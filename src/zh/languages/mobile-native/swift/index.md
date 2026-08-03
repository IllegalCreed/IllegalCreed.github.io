---
layout: doc
---

# Swift

**Swift** 是 Apple 于 2014 年推出的**现代编译型语言**，是 iOS / iPadOS / macOS / watchOS / tvOS 全平台的**官方首选开发语言**——取代服役近 30 年的 Objective-C。它由 Chris Lattner 主导设计（灵感来自 Rust / Haskell / Python / C#），把**类型安全、值语义、协议导向、函数式特性**融进一门**性能接近 C** 的语言，并搭配**编译期内存安全检查**（ARC 自动引用计数，无 GC 暂停）。对前端开发者而言，Swift 的最大价值有二：① 直接为 Apple 平台写**原生 App / 原生模块**（SwiftUI 声明式 UI 已是主流）；② 在 **React Native iOS 桥接**中替代 Objective-C 写原生模块（新架构 Fabric/TurboModule 默认走 Swift 友好的 Objective-C++ 桥）。Swift 的考点集中在**Optional（空安全）**、**值类型 vs 引用类型（struct vs class，写时复制）**、**协议导向编程（protocol + extension + 泛型约束）**、**ARC 内存管理（强/弱/无主引用与循环引用）**与 **SwiftUI 声明式 UI 的状态驱动模型（@State / @Binding / @ObservedObject / @EnvironmentObject）**。

Swift 的全部考点围绕**「安全 + 现代 + 高性能」**三轴展开：①**类型安全**——Optional 强制显式处理 nil、泛型在编译期具化（无运行时装箱）、错误用 `throws/try/catch` 强制传播；②**值语义优先**——`struct`/`enum` 是值类型（赋值即拷贝、线程安全天然保障），Array/Dictionary/String 用**写时复制（CoW）**兼顾性能；`class` 才是引用类型（ARC 管生命周期）；③**协议导向**——`protocol` + `extension` + protocol witness table 实现静态多态与代码复用，避免经典 OOP 的脆弱基类问题；④**SwiftUI 声明式**——状态是真相、视图是状态的函数，`@State`（局部）/`@Binding`（双向）/`@ObservedObject`（外部对象）/`@EnvironmentObject`（全局注入）四种属性包装器对应不同数据流。本叶是 iOS 原生语言的**地基**，讲清语言核心（Optional/值类型/协议）与 SwiftUI 后，[原生模块叶](./guide-line/native-modules) 衔接 React Native 桥接实战。

## 评价

**优点**

- **类型安全强**：Optional 让 nil 显式化，编译期消灭一整类空指针崩溃；泛型具化保证性能
- **值语义优先**：struct/enum 默认值拷贝，天然规避共享可变状态导致的并发 bug
- **协议导向优雅**：protocol + extension + 泛型约束组合出强大的静态多态，优于脆弱的继承体系
- **性能接近 C**：值类型无引用计数开销，泛型具化后零成本抽象，ARC 无 GC 暂停
- **SwiftUI 现代化**：声明式 + 状态驱动 + 实时预览（Canvas），开发效率与可维护性远超 UIKit 时代
- **与 OC 互操作**：可在同一工程混用，老代码可渐进迁移

**缺点**

- **平台锁定**：除 SwiftUI 跨 Apple 平台外，生态几乎只在 Apple 世界（服务端 Vapor 仍小众）
- **ABI / Source 稳定历史包袱**：Swift 5（2019）才 ABI 稳定，5.1 才模块稳定；早期版本迁移成本高
- **编译速度慢**：类型推断 + 泛型具化让中大型工程增量编译动辄数十秒
- **学习曲线陡**：Optional 链、协议带 associatedtype、property wrapper、result builder 概念密集
- **SwiftUI 仍演进**：部分高级控件（复杂 List/自定义 Layout）不如 UIKit 成熟，iOS 版本碎片化（需兼容旧系统时退回 UIKit）

## 本叶地图

- [入门](./getting-started) —— Swift 定位、Optional/值类型/协议导向、ARC 内存管理、SwiftUI 声明式 UI 总览
- [语言精要](./guide-line/language-essentials) —— Optional 全家桶（解包/链式/可选 try）、struct vs class 与写时复制、protocol + extension + 泛型、ARC 与循环引用、SwiftUI 状态四件套
- [原生模块](./guide-line/native-modules) —— React Native iOS 桥接（Native Module + TurboModule/Fabric 新架构）、Objective-C 前身与互操作、Xcode 集成实战
- [参考](./reference) —— 类型系统速查、Optional API、属性包装器清单、SwiftUI 修饰符、与 OC 对比、易错点

## 幻灯片地址

<a href="/SlideStack/swift-slide/" target="_blank">Swift</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=Swift" target="_blank" rel="noopener noreferrer">Swift 测试题</a>
