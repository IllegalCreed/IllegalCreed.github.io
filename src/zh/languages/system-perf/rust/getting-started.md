---
layout: doc
outline: [2, 3]
---

# 入门：Rust 定位、所有权与工具链

> 基于进阶语言 · 核于 2026-08

## 速查

- **定位**：Rust 是**内存安全 + 并发安全**的系统级语言，用**所有权/借用/生命周期**在**编译期**消除整类内存错误，**无 GC**，性能媲美 C/C++。目标：替代 C/C++ 在系统编程、内核、浏览器、前端的地位。
- **核心三件套**：①**所有权（Ownership）**——每个值有唯一所有者，作用域结束自动释放（RAII），赋值/传参默认**移动（move）**非拷贝；②**借用（Borrowing）**——`&T` 共享、`&mut T` 独占，借用检查器保证「多个 `&` 或一个 `&mut`，不可共存」→ 消灭数据竞争；③**生命周期（Lifetime）**——标注引用有效区间，确保引用不比被引用者长寿 → 消灭悬垂指针。
- **无 GC 的关键**：所有权转移（move）+ 作用域结束确定性析构（`Drop` trait），内存回收是**确定性**的（无 STW 停顿），适合实时/游戏/嵌入式。
- **零成本抽象**：泛型**单态化**（monomorphization，编译期为每个具体类型生成专用代码）、迭代器惰性求值、trait 静态分发——运行时无虚函数/装箱开销。
- **错误处理**：用 `Result<T, E>`（可恢复错误）和 `Option<T>`（可能有值）枚举替代异常；`?` 运算符提前返回错误。**错误是值、是类型签名的一部分**，没有隐藏控制流。
- **trait 与泛型**：trait 定义共享行为（类似接口/Haskell typeclass）；泛型在编译期单态化（zero-cost）；`dyn Trait` 是动态分发（有虚表开销）。
- **无畏并发（Fearless Concurrency）**：`Send`（可跨线程转移所有权）/`Sync`（可跨线程共享引用）两个 marker trait 让线程安全在编译期保证。
- **Cargo**：Rust 一体化工具链——`cargo new`/`build`/`run`/`test`/`doc`/`fmt`/`clippy`/`publish`，依赖在 `Cargo.toml`，构建产物在 `target/`。
- **前端基建浪潮（RIIR）**：SWC（Next.js 编译器，比 Babel 快 20×）、Turbopack（比 Webpack 快 10×）、Rome、Biome、Deno、Ruff、Oxc 都用 Rust 重写——把 JS 工具链提速 10-100 倍。
- **WASM 一等公民**：`wasm32-unknown-unknown` target，Rust 编译成 WASM 跑在浏览器/边缘节点，体积小、性能高。
- **与 C/C++ 对比**：Rust 内存安全（编译期保证，C/C++ 靠人工 + sanitizer）、无未定义行为陷阱；C/C++ 生态更老更全、互操作（FFI）成熟、手写底层更自由。Rust 的 `unsafe` 仍可绕过检查与 C 互操作。
- **进阶顺序**：[所有权、借用与生命周期](./guide-line/ownership-and-lifetimes) → [Cargo、trait、泛型与生态](./guide-line/cargo-and-ecosystem) → [参考](./reference)。

## 一、Rust 是什么：安全与性能兼得

C/C++ 性能强但内存不安全（缓冲区溢出、UAF、数据竞争是 70% 安全漏洞的根源，CVE 数据）；Java/Go 用 GC 解决了内存安全但引入停顿与运行时开销。Rust 的雄心是**两者都要**：

- **像 C/C++ 一样快、一样贴近硬件**（无 GC、无运行时、可写操作系统/驱动）。
- **像 GC 语言一样内存安全**——但安全不是靠运行时检查，而是靠**编译期所有权系统**。

```rust
fn main() {
    let s1 = String::from("hello");  // s1 拥有 "hello"
    let s2 = s1;                      // 所有权转移给 s2，s1 失效
    // println!("{}", s1);            // ❌ 编译错误：s1 已被 move
    println!("{}", s2);               // ✅
}   // s2 离开作用域，自动释放 "hello" 的内存（Drop trait）
```

这就是 Rust 的核心：**编译器在编译阶段就拒绝所有可能内存不安全的代码**。代价是与借用检查器搏斗（学习曲线陡），收益是「能编译就能安全运行」。

## 二、所有权系统：无 GC 的基石

所有权是 Rust 独有的、取代 GC 与手动 `free` 的机制。三条规则：

1. **每个值有唯一所有者**（一个变量）。
2. **所有者离开作用域，值被自动释放**（调用 `Drop::drop`，类似 C++ RAII）。
3. **赋值或传参默认是移动（move）**——所有权转交，原变量失效；除非类型实现了 `Copy` trait（如 `i32`/`bool`/`&T`，栈上拷贝，无需 move）。

```rust
fn main() {
    let s = String::from("hi");
    takes(s);            // s 的所有权移入函数
    // println!("{}", s); // ❌ s 已 move

    let n = 5;           // i32 实现了 Copy
    takes_copy(n);
    println!("{}", n);   // ✅ n 仍可用（拷贝了一份）

    let s2 = gives();    // 函数返回值的所有权移给 s2
    println!("{}", s2);
}

fn takes(s: String) { println!("got {}", s); }   // s 在函数结束被释放
fn takes_copy(n: i32) { println!("got {}", n); }
fn gives() -> String { String::from("from fn") }
```

- **为什么不直接拷贝？** `String` 持有堆内存，拷贝要分配新内存（昂贵）；move 只拷贝栈上的「指针/长度/容量」三元组，把堆内存的归属交给新变量——既快又避免双重释放。
- **想要拷贝怎么办？** 显式 `s.clone()`（深拷贝，有开销，编译器不会让你「不小心」深拷贝）。
- **不想转移所有权怎么办？** 用**引用（借用）**。

## 三、借用与引用：不获取所有权地使用值

借用（borrow）是传**引用**而非传所有权。`&T` 是不可变借用（共享），`&mut T` 是可变借用（独占）。借用检查器的铁律：

- **任意给定时刻，要么有多个不可变引用，要么有且仅有一个可变引用**——二者不可共存。
- **引用必须始终有效**（不可悬垂）。

```rust
fn main() {
    let mut s = String::from("hello");

    let r1 = &s;            // 不可变借用
    let r2 = &s;            // 多个不可变借用 OK（共享只读）
    println!("{} {}", r1, r2); // r1/r2 在此之后不再使用（NLL 优化）

    let r3 = &mut s;        // ✅ 可变借用（此时 r1/r2 已不再使用）
    r3.push_str(" world");
    println!("{}", r3);

    // let r4 = &s;         // ❌ 若 r3 仍活跃，不能再不可变借用
}
```

- **为什么这套规则消灭数据竞争**：数据竞争的本质是「一个线程写、另一个线程读/写同一块内存，无同步」。借用规则让「写」必须独占——这在单线程里消除 aliasing bug，在多线程里（配合 Send/Sync）消除数据竞争，**全部在编译期**。
- **NLL（Non-Lexical Lifetimes）**：2018 版引入，引用的生命周期到「最后一次使用」而非「作用域结束」，让上例 `r3` 能编译通过（否则老规则会因 r1/r2 与 r3 作用域重叠报错）。

## 四、生命周期：确保引用不悬垂

引用必须不比被引用者活得更久。多数情况编译器能自动推断生命周期，但当**函数参数/返回值有多个引用**时，需要手动标注：

```rust
// 告诉编译器：返回的引用与 x、y 中活得短的那个一样长
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() { x } else { y }
}

fn main() {
    let result;
    let s1 = String::from("long string");
    {
        let s2 = String::from("short");
        result = longest(s1.as_str(), s2.as_str());
        // println!("{}", result); // ✅ 在 s2 还活着时用
    }
    // println!("{}", result); // ❌ s2 已释放，result 可能指向 s2，悬垂！
}
```

- **生命周期标注 `'a` 不改变引用寿命，只是描述关系**——编译器据此检查调用是否安全。
- **`'static`**：活整个程序（如字符串字面量 `"hello"`，编译进二进制）。

## 五、错误处理：Result、Option 与 `?`

Rust 没有 `try/except` 异常。可恢复错误用 `Result<T, E>`，可能无值用 `Option<T>`：

```rust
use std::fs;
use std::io;
use std::num::ParseIntError;

// ? 运算符：成功则解包继续，失败则提前 return Err
fn read_count() -> Result<i32, Box<dyn std::error::Error>> {
    let content = fs::read_to_string("count.txt")?;  // 失败 → return
    let n: i32 = content.trim().parse()?;             // 失败 → return
    Ok(n + 1)
}

fn main() {
    match read_count() {
        Ok(n)  => println!("count = {}", n),
        Err(e) => eprintln!("error: {}", e),
    }
}
```

- **`?` 的本质**：语法糖，等价于 `match { Ok(v) => v, Err(e) => return Err(e.into()) }`。
- **`panic!`**：不可恢复错误（数组越界/断言失败/显式 panic），展开栈或 abort 进程，**不该用于普通错误处理**。
- **好处**：错误是类型签名的一部分——`fn f() -> Result<T, E>` 明确告诉你「这个调用可能失败」，调用者必须处理，不会被异常「悄悄」绕过。

## 六、Cargo 工具链

Cargo 是 Rust 的构建系统 + 包管理器 + 测试运行器 + 文档生成器，开箱即用：

```bash
cargo new my-app          # 创建二进制项目（src/main.rs）
cargo new my-lib --lib    # 创建库项目（src/lib.rs）
cargo build               # 编译（debug，产物在 target/debug）
cargo build --release     # 优化编译（产物在 target/release）
cargo run                 # 编译并运行
cargo test                # 运行所有 #[test]
cargo check               # 只做类型检查不生成产物（比 build 快，开发首选）
cargo fmt                 # 格式化代码
cargo clippy              # 运行 lint（Rust 的 eslint）
cargo doc --open          # 生成文档并打开
cargo add serde           # 添加依赖到 Cargo.toml
cargo publish             # 发布到 crates.io
```

```toml
# Cargo.toml —— 项目清单
[package]
name = "my-app"
version = "0.1.0"
edition = "2021"          # Rust 版本（2021 版）

[dependencies]
serde = { version = "1.0", features = ["derive"] }
tokio = { version = "1", features = ["full"] }
```

- **无版本地狱**：`Cargo.lock` 锁定精确版本，构建可复现（类似 npm 的 lockfile）。
- **crates.io**：官方包仓库，现有 15 万+ crates（serde/tokio/reqwest/axum/clap 等）。

## 七、Rust 在前端基建：RIIR 浪潮

Rust 近年最大爆发在前端工具链——用 Rust 重写 JS 工具，获得数量级提速：

| 工具 | 替代谁 | 倍速 | 背景 |
| --- | --- | --- | --- |
| **SWC** | Babel | ~20× | Next.js 默认编译器，TS/JSX → JS |
| **Turbopack** | Webpack | ~10× | Vercel 出品，Next.js 增量构建 |
| **Rome / Biome** | Prettier + ESLint | ~25× | 格式化 + lint 一体 |
| **Ruff** | Flake8/Pylint | ~100× | Python linter |
| **Oxc** | ESLint + Babel | ~50× | JS 工具套件 |
| **Deno** | Node.js | — | 安全的 JS/TS 运行时（部分 Rust） |
| **rolldown** | Rollup | ~10× | Vite 下一代打包器（基于 Rust + Oxc） |

**为什么前端选 Rust**：①性能（Rust 接近 C，比 JS/Go 快得多，编译大型项目从分钟级降到秒级）；②内存安全（C/C++ 的内存漏洞在基建中不可接受）；③WASM 友好（可同时在 Node.js 与浏览器跑）；④无 GC 抖动（工具运行流畅）。

## 八、与 C/C++ 的对比

| 维度 | Rust | C / C++ |
| --- | --- | --- |
| 内存安全 | **编译期保证**（所有权/借用） | 靠人工 + sanitizer/ASan，仍有 UAF/溢出 |
| 并发安全 | 编译期（Send/Sync + 借用） | 靠人工加锁，数据竞争频发 |
| 内存回收 | 确定性（RAII，作用域结束释放） | 手动 free / new-delete / RAII |
| 运行时 | 无 GC、无 VM、最小运行时 | 无 GC、无 VM |
| 性能 | 接近 C/C++（LLVM 后端） | 巅峰 |
| 抽象成本 | 零成本（泛型单态化、trait 静态分发） | 零成本（模板） |
| 错误处理 | Result/Option（无异常） | 异常（C++）/ 错误码（C） |
| 生态成熟度 | 较新（GUI/科学计算弱） | 极成熟（几十年积累） |
| FFI 互操作 | `unsafe` + extern，与 C 互操作良好 | 原生 |
| 学习曲线 | 陡（所有权/借用是新模型） | 陡（手动内存 + 模板元编程 + UB） |

- **Rust 不是「替换所有 C++」**：游戏引擎（Unreal）、Qt GUI、遗留系统仍以 C++ 为主；Rust 在**新写的系统软件、前端基建、CLI、网络服务**增长最快。
- **`unsafe`**：Rust 也允许 `unsafe { }` 块绕过借用检查（写底层数据结构、FFI、裸指针），此时安全责任回到开发者——但 unsafe 是**局部**的，把不安全隔离在小范围内。

## 下一步

理解了 Rust 的定位与核心心智后，下一步深入两个机制——[所有权、借用与生命周期](./guide-line/ownership-and-lifetimes)（move 语义、借用检查器、智能指针）与[Cargo、trait、泛型与生态](./guide-line/cargo-and-ecosystem)（工作流、泛型单态化、WASM、前端工具趋势）。
