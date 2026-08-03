---
layout: doc
---

# Rust

**Rust** 是一门追求**内存安全与并发安全**的系统级编程语言——它用**所有权（Ownership）、借用（Borrowing）、生命周期（Lifetime）**三套机制，在**编译期**就消除整类内存错误（空指针、悬垂指针、数据竞争、缓冲区溢出），**无需垃圾回收（GC）**。Rust 由 Mozilla 主导设计（2010 年立项，2015 年发布 1.0），目标是替代 C/C++ 在系统编程、浏览器内核、操作系统、嵌入式领域的地位，同时提供现代语言的人体工学（强类型、模式匹配、零成本抽象、优秀工具链）。Stack Overflow 连续多年开发者调查中，Rust 都是「最受喜爱语言」第一名。

Rust 的全部考点围绕**安全与性能如何兼得**展开：①**所有权系统**——每个值有唯一所有者，作用域结束自动释放（RAII），赋值/传参默认**移动（move）**而非拷贝，彻底杜绝双重释放；②**借用与引用**——`&T` 共享借用、`&mut T` 独占借用，编译器（借用检查器 borrow checker）保证「任意时刻要么多个不可变引用，要么一个可变引用」，从根上消灭数据竞争；③**生命周期**——标注引用的有效区间，确保引用不会比被引用者活得更久（无悬垂指针）；④**错误处理**——用 `Result`/`Option` 枚举 + `?` 运算符替代异常，错误是值、是类型签名的一部分，**没有隐藏的控制流**；⑤**trait 与泛型**——trait（类似接口/Haskell typeclass）定义行为，泛型静态单态化（zero-cost），trait object（`dyn Trait`）提供动态分发。Rust 的实践价值在前端基建尤为突出：**SWC**（Next.js 编译器）、**Turbopack**（Webpack 继任者）、**Rome**、**Biome**、**Deno**、**Ruff**（Python linter）、**Oxc** 都用 Rust 重写，把 JS 工具链速度提升 10-100 倍——这是「用 Rust 重写一切（Rewrite It In Rust, RIIR）」浪潮的缩影。本叶是进阶语言章的**安全派代表**，与[Go](../go/) 的「简单派」形成经典对照。

## 评价

**优点**

- **编译期内存安全**：所有权 + 借用检查，在编译阶段消除空指针、悬垂指针、数据竞争、UAF，不需要 GC 也不需要手动 free
- **零成本抽象**：泛型单态化、迭代器、trait 在编译期展开，运行时无虚函数/装箱开销，性能媲美 C/C++
- **无畏并发（Fearless Concurrency）**：Send/Sync trait 让线程安全在编译期保证，多线程代码「能编译就能并发安全」
- **现代化工具链**：Cargo（构建+包管理+测试+文档一体）、rustfmt（格式化）、clippy（lint）、强大的编译器错误提示（指出位置 + 给出修复建议）
- **无 GC 的确定性回收**：值在作用域结束确定性释放（无 STW 停顿），适合实时/游戏/嵌入式场景

**缺点**

- **学习曲线陡峭**：所有权/借用/生命周期是全新心智模型，初学者与借用检查器反复搏斗（「与编译器吵架」）
- **编译速度慢**：单态化 + LLVM 后端，大型项目增量编译仍偏慢（比 Go 慢一个数量级）
- **生态弱于 C++/Java**：某些领域（GUI、科学计算、企业级 Web）库尚不如成熟语言丰富
- **Unsafe 边界**：与 C 互操作或写底层数据结构时仍需 `unsafe`，安全责任部分回到开发者肩上

## 本叶地图

- [入门](./getting-started) —— Rust 定位、所有权/借用/生命周期心智模型、Cargo 工具链、错误处理（Result/?）、与 C/C++ 对比
- [所有权、借用与生命周期](./guide-line/ownership-and-lifetimes) —— move 语义、借用检查器规则、生命周期标注、智能指针（Box/Rc/Arc/RefCell）
- [Cargo、trait、泛型与生态](./guide-line/cargo-and-ecosystem) —— Cargo 工作流、trait/泛型/trait object、WASM、前端工具底层趋势（SWC/Turbopack）
- [参考](./reference) —— Rust 核心概念速查、所有权规则、智能指针对比、易错点清单

## 幻灯片地址

<a href="/SlideStack/rust-slide/" target="_blank">Rust</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=Rust" target="_blank" rel="noopener noreferrer">Rust 测试题</a>
