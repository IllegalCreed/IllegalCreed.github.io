---
layout: doc
outline: [2, 3]
---

# Cargo、trait、泛型与生态：工具链、抽象与 WASM

> 基于进阶语言 · 核于 2026-08

## 速查

- **Cargo**：Rust 一体化工具链——`new/build/run/test/check/fmt/clippy/doc/publish`，依赖写在 `Cargo.toml`，构建产物在 `target/`，`Cargo.lock` 锁版本可复现。crates.io 是官方包仓库（15 万+ 包）。
- **edition（版本）**：`2015`/`2018`/`2021`/`2024`，是「语言特性集合」而非破坏性升级——老代码在新 edition 仍能编译，迁移用 `cargo fix --edition`。
- **trait**：定义共享行为，类似接口/Haskell typeclass。可有关联类型、默认方法、`impl Trait`（返回/参数）。trait bound 约束泛型。
- **泛型 = 单态化（monomorphization）**：编译期为每个具体类型生成专用代码，**运行时零开销**（无虚函数、无装箱）——代价是编译慢、二进制变大。
- **trait object（`dyn Trait`）**：动态分发，运行时通过虚表（vtable）调用，有开销但能异构集合（`Vec<Box<dyn Draw>>` 装不同类型）。静态分发（泛型）vs 动态分发（trait object）是经典权衡。
- **`impl Trait`**：函数返回 `-> impl Trait`（编译期确定具体类型，静态分发，常用于闭包/迭代器）；参数 `fn f(x: impl Trait)` 等价泛型简写。
- **迭代器**：惰性、零成本——`map`/`filter`/`collect` 在编译期展开成等价的循环，无运行时开销。
- **闭包**：捕获环境变量，按 `Fn`/`FnMut`/`FnOnce` 三 trait 分类（不可变借/可变借/拥有）。
- **WASM**：Rust 是 `wasm32-unknown-unknown` target 一等公民，编译产物体积小、性能高，跑在浏览器/边缘节点/Serverless。
- **前端基建 RIIR（Rewrite It In Rust）**：SWC（Babel 替代，~20×）、Turbopack（Webpack 替代，~10×）、Biome（Prettier+ESLint，~25×）、Ruff（Python linter，~100×）、Oxc、rolldown（Vite 下一代打包器）——Rust 因「接近 C 的性能 + 内存安全 + WASM 友好 + 无 GC 抖动」成为前端工具重写的首选。

## 一、Cargo 工作流

```bash
# 项目创建
cargo new my-app              # 二进制：src/main.rs
cargo new my-lib --lib        # 库：src/lib.rs

# 开发循环
cargo check                   # 仅类型检查（比 build 快，开发首选）
cargo build                   # debug 编译 → target/debug
cargo run                     # 编译 + 运行
cargo test                    # 运行所有 #[test]
cargo fmt                     # 格式化
cargo clippy                  # lint（catch 常见错误/性能问题）
cargo doc --open              # 生成文档

# 发布
cargo build --release         # 优化编译 → target/release
cargo publish                 # 发布到 crates.io
```

```toml
# Cargo.toml —— 项目清单
[package]
name = "my-app"
version = "0.1.0"
edition = "2021"              # Rust 版本

[dependencies]
serde = { version = "1.0", features = ["derive"] }  # 启用 derive 特性
tokio = { version = "1", features = ["full"] }      # 启用全特性
anyhow = "1.0"                                      # 简写：默认 features

[dev-dependencies]           # 仅测试/基准用
proptest = "1.0"

[[bin]]
name = "my-app"
path = "src/main.rs"

[profile.release]
lto = true                   # 链接时优化（更小更快，编译更慢）
opt-level = 3
```

- **Workspace**：多个 crate 共享一个 `Cargo.lock` 与 `target/`，适合 monorepo。
- **Features**：条件编译特性，让用户按需启用功能，减小依赖。
- **`cargo check` 是日常主力**：比 `build` 快得多（跳过代码生成），秒级反馈类型错误。

## 二、trait：定义共享行为

trait 像接口，但更强（有关联类型、默认实现、可组合）：

```rust
// 定义 trait
trait Summary {
    fn summarize(&self) -> String;

    // 默认方法（可被覆盖）
    fn author(&self) -> String {
        String::from("(unknown)")
    }
}

struct Article { title: String, content: String }
struct Tweet  { username: String, text: String }

impl Summary for Article {
    fn summarize(&self) -> String {
        format!("{}: {}", self.title, self.content)
    }
}

impl Summary for Tweet {
    fn summarize(&self) -> String {
        format!("@{}: {}", self.username, self.text)
    }
}

fn main() {
    let a = Article { title: "Rust".into(), content: "Safe".into() };
    println!("{}", a.summarize());   // Rust: Safe
    println!("{}", a.author());      // (unknown)  默认方法
}
```

- **trait bound**：约束泛型必须实现某 trait。
  ```rust
  // 三种等价写法
  fn notify<T: Summary>(item: &T) { println!("{}", item.summarize()); }
  fn notify(item: &impl Summary) { println!("{}", item.summarize()); }
  fn notify(item: &(impl Summary + Display)) { /* 多重 bound */ }
  ```
- **关联类型**：`trait Iterator { type Item; fn next(&mut self) -> Option<Self::Item>; }`——一个 trait 一个关联类型，比泛型参数更清晰。
- **trait object**：`&dyn Trait` 或 `Box<dyn Trait>`，运行时多态（虚表分发）。

## 三、泛型与单态化：零成本抽象

泛型在编译期为每个具体类型生成专用代码（monomorphization），运行时零开销：

```rust
fn largest<T: PartialOrd>(list: &[T]) -> &T {
    let mut max = &list[0];
    for item in &list[1..] {
        if item > max { max = item; }
    }
    max
}

fn main() {
    let nums = vec![1, 5, 3, 9, 2];
    let chars = vec!['a', 'z', 'm'];
    println!("{}", largest(&nums));   // 9
    println!("{}", largest(&chars));  // z
}
// 编译器生成两份代码：largest_i32、largest_char（运行时无类型判断开销）
```

**静态分发 vs 动态分发**：

| | 泛型（静态分发） | trait object（动态分发） |
| --- | --- | --- |
| 写法 | `fn f<T: Trait>()` / `impl Trait` | `fn f(x: &dyn Trait)` / `Box<dyn Trait>` |
| 调用 | 编译期确定，直接函数调用 | 运行期查虚表（vtable） |
| 开销 | 零 | 一次虚表查表（小） |
| 二进制 | 每类型一份代码（变大） | 一份代码 |
| 异构集合 | ❌（类型必须相同） | ✅ `Vec<Box<dyn Draw>>` 装不同类型 |
| 内联优化 | ✅ 编译器可内联 | ❌ 难内联 |

- **默认用泛型**（性能优先），只有需要异构集合（多种类型存一起）或不知道所有类型时才用 trait object。

## 四、迭代器：零成本的函数式

Rust 迭代器惰性求值，编译期展开成等价循环，零开销：

```rust
fn main() {
    let v = vec![1, 2, 3, 4, 5];

    // 函数式链式：filter > map > sum
    let sum: i32 = v.iter()
        .filter(|&&x| x > 2)        // 3, 4, 5
        .map(|&x| x * x)             // 9, 16, 25
        .sum();                      // 50
    println!("{}", sum);

    // 等价手写循环（性能相同）
    let mut s = 0;
    for &x in &v {
        if x > 2 { s += x * x; }
    }
}
```

迭代器 trait 是 `Iterator`，有大量适配器方法（`map/filter/take/skip/zip/enumerate/collect/fold`等）。`collect()` 把迭代器消费成集合（`Vec`/`HashMap`/`String`）。

## 五、闭包：捕获环境的函数

闭包捕获环境变量，按捕获方式分三类：

```rust
fn main() {
    let x = 4;
    let equal_to_x = |z| z == x;        // 不可变借用 x（Fn）
    println!("{}", equal_to_x(4));      // true

    let mut y = vec![1, 2, 3];
    let mut push_to_y = move || {       // move：拥有 y（FnOnce）
        y.push(4);
    };
    push_to_y();
}
```

| trait | 捕获方式 | 可调用次数 | 典型 |
| --- | --- | --- | --- |
| `FnOnce` | 拥有（消耗） | 一次 | `move || drop(captured)` |
| `FnMut` | 可变借用 | 多次（可改环境） | `|| count += 1` |
| `Fn` | 不可变借用 | 多次（只读） | `|| x + 1` |

闭包类型用 `impl Fn(i32) -> bool` 等表示，常作回调/迭代器参数。

## 六、WASM：Rust 在浏览器与边缘

Rust 编译到 WebAssembly 是一等体验：

```bash
rustup target add wasm32-unknown-unknown   # 添加 target
cargo build --target wasm32-unknown-unknown --release
# 产物：target/wasm32-unknown-unknown/release/my_app.wasm
```

- **工具**：`wasm-bindgen`（JS/WASM 互调）、`wasm-pack`（打包发布到 npm）、`trunk`/`wasm-bindgen-rayon`（多线程 WASM）。
- **典型场景**：浏览器里跑计算密集任务（图像处理 Figma/视频剪辑）、边缘计算（Cloudflare Workers 支持 WASM）、加密/压缩库。
- **体积**：Rust WASM 经 `wasm-opt` + `tree-shaking` 可压到几 KB。

## 七、前端基建的 RIIR 浪潮

Rust 近年最大爆发在前端工具链——用 Rust 重写 JS 工具获得数量级提速：

| 工具 | 替代 | 倍速 | 说明 |
| --- | --- | --- | --- |
| **SWC** | Babel | ~20× | Next.js 默认编译器，TS/JSX → JS，单线程也比 Babel 快，多线程更快 |
| **Turbopack** | Webpack | ~10× | Vercel 出品，增量构建，Next.js 13+ 默认 dev server |
| **Biome**（原 Rome） | Prettier + ESLint | ~25× | 格式化 + lint 一体，单二进制 |
| **Ruff** | Flake8/Pylint/isort | ~100× | Python linter + formatter |
| **Oxc** | ESLint + Babel | ~50× | 用 Rust 写的 JS 工具套件（lexer/parser/linter） |
| **rolldown** | Rollup | ~10× | Vite 下一代打包器，Rust + Oxc，将集成进 Vite |
| **Parcel 2** | Webpack | ~10× | 部分核心用 Rust/SW |
| **Deno** | Node.js | — | 安全的 JS/TS 运行时，部分组件 Rust |

**为什么前端基建选 Rust 而非 Go/JS**：
- **性能**：Rust 接近 C，比 JS/Go 快一个数量级——编译大型 monorepo 从分钟级降到秒级。
- **内存安全**：C/C++ 的内存漏洞（UAF/溢出）在「人人都要装」的前端工具中不可接受，Rust 编译期消除。
- **WASM 友好**：可同时编译成原生二进制（CLI）与 WASM（浏览器/Node），一套代码两个 target。
- **无 GC 抖动**：Go/JS 的 GC 会让工具偶发卡顿，Rust 无 GC，运行流畅。
- **生态正反馈**：SWC/Turbopack 成功后，社区跟进，形成「Rust 重写一切（RIIR）」浪潮。

## 八、Rust 生态全景

| 领域 | 代表 crate |
| --- | --- |
| **Web 框架** | axum、actix-web、rocket、warp |
| **异步运行时** | tokio（事实标准）、async-std、smol |
| **序列化** | serde（事实标准）、serde_json |
| **HTTP 客户端** | reqwest |
| **数据库** | sqlx、diesel、sea-orm |
| **CLI** | clap、structopt |
| **错误处理** | anyhow、thiserror |
| **日志** | tracing、log、env_logger |
| **系统** | 标准库 + nix（Unix）/windows-rs |

Rust 在**系统编程、CLI、网络服务、WebAssembly、嵌入式、区块链**领域增长最快；GUI（Tauri）、科学计算（ndarray）、游戏（Bevy）也在追赶。

## 下一步

掌握工具链与抽象后，建议结合[参考](../reference)速查所有权规则、智能指针对比、易错点，再用[cargo new](https://doc.rust-lang.org/cargo/) 起一个项目实践。对照[Go](../../go/) 看「安全派 vs 简单派」的工程取舍。
