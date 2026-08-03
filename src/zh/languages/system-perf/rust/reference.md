---
layout: doc
outline: [2, 3]
---

# 参考：Rust 核心概念、所有权规则与智能指针速查

> 基于进阶语言 · 核于 2026-08

## 速查

- **定位**：内存安全 + 并发安全的系统级语言，编译期消除内存错误，无 GC，性能媲美 C/C++。
- **所有权三规则**：唯一所有者 + 作用域结束自动释放 + 赋值/传参默认 move（Copy 类型则栈拷贝）。
- **借用铁律**：多个 `&T` 或一个 `&mut T`，不可共存；引用必须有效（不可悬垂）。
- **生命周期 `'a`**：描述引用关系，确保引用不比被引用者长寿；`'static` 活整个程序。
- **错误处理**：`Result<T, E>` + `?`，无异常；`Option<T>` 表可能无值；`panic!` 是不可恢复。
- **泛型**：单态化，零成本；`dyn Trait` 动态分发（虚表）。
- **智能指针**：`Box`（独占堆）、`Rc`（单线程引用计数）、`Arc`（多线程原子引用计数）、`RefCell`/`Mutex`（内部可变性）。
- **Cargo**：`check`/`build`/`run`/`test`/`fmt`/`clippy`；edition 2015/2018/2021/2024。
- **WASM**：`wasm32-unknown-unknown` 一等 target，配合 wasm-bindgen/wasm-pack。
- **前端 RIIR**：SWC（~20×）、Turbopack（~10×）、Biome（~25×）、Ruff（~100×）、Oxc、rolldown。

## 一、所有权规则速查

| 规则 | 内容 | 违反后果 |
| --- | --- | --- |
| 唯一所有者 | 每个值有且仅有一个所有者 | 编译错误 |
| 自动释放 | 所有者离开作用域 → 调用 `Drop` | — |
| 默认 move | 赋值/传参转移所有权，原变量失效 | 用了失效变量 → 编译错误 |
| Copy trait | 栈上拷贝，原变量仍可用（`i32`/`bool`/`&T`） | — |
| 借用规则 | 多个 `&` 或一个 `&mut`，不可共存 | 编译错误 |
| 引用有效 | 引用不可悬垂（不比被引用者长寿） | 编译错误 |

```rust
// move
let s1 = String::from("hi");
let s2 = s1;
// s1 已失效

// Copy
let a = 5;
let b = a;   // a 仍可用

// 借用
let mut s = String::from("hi");
let r1 = &s;
let r2 = &s;      // ✅ 多个不可变
// let r3 = &mut s; // ❌ 与 r1/r2 冲突
```

## 二、借用与可变性对照

| 形式 | 可变性 | 数量 | 场景 |
| --- | --- | --- | --- |
| `&T` | 不可变 | 多个 | 只读共享 |
| `&mut T` | 可变 | 唯一 | 修改值 |
| `*const T` | 不可变 | — | 裸指针（unsafe） |
| `*mut T` | 可变 | — | 裸指针（unsafe） |

借用检查器在**编译期**静态分析，通过则运行时绝不违反。

## 三、智能指针对比

| 智能指针 | 用途 | 借用检查 | 线程 | 计数方式 |
| --- | --- | --- | --- | --- |
| `Box<T>` | 独占堆分配 | 编译期 | ✅ | 独占（无计数） |
| `Rc<T>` | 多所有者（单线程） | 编译期 | ❌ | 非原子引用计数 |
| `Arc<T>` | 多所有者（多线程） | 编译期 | ✅ | 原子引用计数 |
| `RefCell<T>` | 内部可变性（单线程） | **运行期** | ❌ | 无（运行期借用计数） |
| `Mutex<T>` | 内部可变性（多线程，互斥） | 运行期 | ✅ | — |
| `RwLock<T>` | 内部可变性（多线程，读写锁） | 运行期 | ✅ | — |
| `Cell<T>` | Copy 类型的内部可变性 | 编译期 | ❌ | 无（按值拷贝） |
| `Weak<T>` | 弱引用（防循环泄漏） | 编译期 | Rc/Arc | 不增 strong count |

**组合模式**：
- 单线程共享可变：`Rc<RefCell<T>>`
- 多线程共享可变：`Arc<Mutex<T>>` 或 `Arc<RwLock<T>>`

## 四、错误处理速查

| 类型 | 含义 | 用法 |
| --- | --- | --- |
| `Result<T, E>` | 可恢复错误（成功 T / 失败 E） | `match`、`?`、`.unwrap()`、`.expect()` |
| `Option<T>` | 可能有值（Some / None） | `match`、`?`、`.unwrap_or(default)` |
| `?` 运算符 | 提前返回错误 | `fn f() -> Result<T, E>` 内 `x?` |
| `panic!` | 不可恢复 | 断言失败/越界/显式 panic |

```rust
use std::fs;

fn read_num() -> Result<i32, std::io::Error> {
    let s = fs::read_to_string("n.txt")?;  // 失败提前 return
    Ok(s.trim().parse().unwrap_or(0))
}
```

## 五、trait 与泛型速查

| 概念 | 写法 | 说明 |
| --- | --- | --- |
| 定义 trait | `trait T { fn m(&self); }` | 类似接口 |
| 实现 trait | `impl T for S { fn m(&self) {} }` | |
| trait bound | `fn f<T: T>(x: T)` | 泛型约束 |
| `impl Trait` | `fn f(x: impl T)` | bound 简写 |
| 返回 `impl Trait` | `fn f() -> impl T` | 静态分发（编译期知具体类型） |
| trait object | `Box<dyn T>` / `&dyn T` | 动态分发（虚表） |
| 关联类型 | `trait T { type Item; }` | 一个 trait 一个关联类型 |
| 默认方法 | `fn m() { /* 默认 */ }` | 可被覆盖 |
| marker trait | `Send`/`Sync`/`Sized`/`Copy` | 无方法，标记属性 |

## 六、Cargo 命令速查

| 命令 | 作用 |
| --- | --- |
| `cargo new NAME` | 创建二进制项目 |
| `cargo new NAME --lib` | 创建库 |
| `cargo check` | 类型检查（开发首选，快） |
| `cargo build` | 编译（debug） |
| `cargo build --release` | 优化编译 |
| `cargo run` | 编译 + 运行 |
| `cargo test` | 跑所有测试 |
| `cargo fmt` | 格式化 |
| `cargo clippy` | lint |
| `cargo doc --open` | 生成文档 |
| `cargo add NAME` | 加依赖 |
| `cargo update` | 升级依赖（受 semver 约束） |
| `cargo publish` | 发布到 crates.io |
| `cargo fix --edition` | 自动迁移 edition |

## 七、Rust vs C/C++ vs Go 速查

| 维度 | Rust | C/C++ | Go |
| --- | --- | --- | --- |
| 内存安全 | 编译期（所有权） | 靠人工 | GC（运行期） |
| 并发安全 | 编译期（Send/Sync） | 靠人工 | CSP（channel）+ 运行期 |
| 内存回收 | 确定性（RAII） | 手动/RAII | GC（有停顿） |
| 运行时 | 无 | 无 | 有（GC + 调度器） |
| 性能 | ≈ C/C++ | 巅峰 | 略低于 Rust/C++ |
| 编译速度 | 慢 | 慢（C++）/快（C） | **极快** |
| 学习曲线 | 陡（所有权） | 陡（UB/模板） | **平缓** |
| 错误处理 | Result/Option | 异常/错误码 | error（值）+ panic |
| 泛型 | 单态化 | 模板 | 1.18+ 泛型（单态化+GC） |
| 二进制 | 静态/动态 | 静态/动态 | **静态**（默认） |

## 八、易错点清单

- **「Rust 有 GC」**：错。Rust 无 GC，靠所有权 + RAII 确定性回收，无 STW 停顿。
- **「`clone()` 是免费的」**：错。`clone()` 多为深拷贝，有分配开销，应避免在热路径滥用。
- **「多个 `&` 和一个 `&mut` 可以同时」**：错。这是借用铁律，违反即编译错误（数据竞争的根源）。
- **「Rust 完全内存安全」**：不完全。`unsafe` 块可绕过检查（FFI、裸指针、底层数据结构），但 unsafe 是局部的。
- **「`Rc` 可以跨线程」**：错。`Rc` 非原子，跨线程用 `Arc`（否则编译错误，Rc 未实现 Send）。
- **「泛型有运行时开销」**：错。单态化在编译期为每类型生成专用代码，零开销；有开销的是 trait object（`dyn`）。
- **「`?` 是异常」**：错。`?` 是提前返回错误的语法糖，仍是普通控制流（return），不是异常。
- **「生命周期标注改变引用寿命」**：错。`'a` 只描述关系，不改变实际寿命；是编译器验证用的标注。
- **「`Box` 是引用计数」**：错。`Box` 是独占堆指针（无计数）；引用计数的是 `Rc`/`Arc`。
- **「Cargo 是包管理器」**：不完整。Cargo 是构建系统 + 包管理器 + 测试 + 文档 + 发布的一体化工具链。
- **「edition 是版本号」**：错。edition（2015/2018/2021/2024）是语言特性集合，非破坏性升级，老代码仍能编译。
- **「Rust 编译慢是因为 LLVM」**：不全是。主要因单态化为每类型生成代码（代码膨胀），LLVM 优化耗时是次要。

## 九、进阶方向（链接其他叶）

- [Go](../../go/) —— 简单派代表，与 Rust「安全派」对照（简单 vs 安全、GC vs 所有权、CSP vs Send/Sync）

## 权威链接

- [The Rust Programming Language（官方书）](https://doc.rust-lang.org/book/)
- [Rust by Example](https://doc.rust-lang.org/rust-by-example/)
- [Rust Reference](https://doc.rust-lang.org/reference/)
- [Cargo Book](https://doc.rust-lang.org/cargo/)
- [Rust ownership - Wikipedia](https://en.wikipedia.org/wiki/Rust_(programming_language))
- [SWC 官网](https://swc.rs/)
- [Turbopack](https://turbo.build/pack)
- 本站幻灯片：<a href="/SlideStack/rust-slide/" target="_blank">Rust</a>
