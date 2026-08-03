---
layout: doc
outline: [2, 3]
---

# 入门：Swift 定位、类型安全与声明式 UI

> 基于 Apple Swift 5.x（2026 主线） · 核于 2026-08

## 速查

- **定位**：Apple 全平台（iOS/iPadOS/macOS/watchOS/tvOS/visionOS）的**官方首选开发语言**，2014 年发布、2019 年 Swift 5 ABI 稳定、2021 年 Swift Concurrency（async/await）落地。取代服役近 30 年的 Objective-C，但仍与 OC **完全互操作**（同一工程可混用）。
- **设计灵感**：Rust（内存安全）、Haskell（代数数据类型/类型推断）、Python（语法简洁）、C#（泛型/属性）。**性能接近 C**，远快于动态语言。
- **三大支柱**：①**类型安全**——Optional 强制显式处理 nil，泛型编译期具化（无运行时装箱）；②**值语义优先**——`struct`/`enum` 是值类型（赋值即拷贝、天然线程安全），`class` 才是引用类型；③**协议导向**——`protocol` + `extension` + 泛型约束实现静态多态，避免脆弱基类。
- **Optional**：`Optional<T>` 是**带值的枚举**（`.some(T)` / `.none`），编译器强制你解包才能用值——**消灭一整类空指针崩溃**。解包方式：强制 `!`（不安全）、`if let`/`guard let`（安全绑定）、可选链 `a?.b?.c`（链中任一 nil 即返回 nil）、空合 `??`（给默认值）。
- **值类型 vs 引用类型**：`struct`/`enum`/`tuple` 是**值类型**（赋值拷贝、不可变、线程安全），集合（Array/Dictionary/Set/String）用**写时复制（CoW）**优化性能；`class`/`closure` 是**引用类型**（共享、由 ARC 管生命周期，可能循环引用）。「能用 struct 就别用 class」是 Swift 的核心惯例。
- **ARC 内存管理**：Swift 用**自动引用计数**（不是 GC）——编译器在编译期插入 `retain`/`release`，强引用计数为 0 即立即释放（无 GC 暂停）。**循环引用**（A 强引 B、B 强引 A）会导致内存泄漏，需用 `weak`（可空，引用释放后自动置 nil）/`unowned`（假定永不为空，释放后访问会崩溃）打破。
- **协议导向编程（POP）**：用 `protocol` 定义能力、`extension` 提供默认实现、泛型 `<T: Protocol>` 做约束——比继承更灵活（值类型也能遵循协议、可组合多个协议、避免单继承脆弱基类）。Swift 标准库本身就是 POP 范本（`Equatable`/`Hashable`/`Codable`/`Collection` 全是协议）。
- **SwiftUI 声明式 UI**：2019 年推出的**声明式 UI 框架**——状态是真相、视图是状态的函数。四种属性包装器管理数据流：`@State`（视图局部值）、`@Binding`（父子双向绑定）、`@ObservedObject`（外部引用类型对象，需 `ObservableObject`）、`@EnvironmentObject`（全局注入）。视图用 `some View` + ResultBuilder DSL 描述结构，Canvas 实时预览。
- **错误处理**：用 `throws` 标记可失败函数、`try`/`try?`/`try!` 调用、`catch` 捕获——错误必须**显式传播**（不处理编译不过）。`Result<Success, Failure>` 是异步/回调场景的值类型替代。
- **进阶顺序**：[语言精要](./guide-line/language-essentials)（Optional/值类型/协议/SwiftUI 深入）→ [原生模块](./guide-line/native-modules)（RN iOS 桥接）→ [参考](./reference)。

## 一、Swift 是什么：Apple 的现代系统语言

Swift 的诞生背景：Objective-C 自 1984 年起就是 Apple 平台的语言，但它**语法古旧**（方括号消息传递 `[obj msg:arg]`）、**头文件繁琐**、**空指针崩溃频发**、**对新手极不友好**。2010 年起 Chris Lattner（LLVM/Clang 之父）主导设计 Swift，目标是「**像脚本语言一样易用，像 C 一样快，像 Haskell 一样安全**」。2014 年 WWDC 正式发布，2015 年开源。

Swift 的定位有三个层次：

1. **应用层语言**：写 iOS/macOS App 的主力——配合 SwiftUI（声明式）或 UIKit/AppKit（命令式）。
2. **系统层语言**：性能敏感场景（图像处理/加密/算法库），值类型 + 具化泛型让性能贴近 C。
3. **跨平台潜力**：开源后能在 Linux/Windows 跑（服务端框架 Vapor/Hummingbird），但生态仍以 Apple 平台为主。

对前端/JS 开发者，Swift 最值得学的两点：① **类型系统设计**（Optional + 值类型 + 协议是后来 Kotlin/Dart 空安全、Rust 借用检查的思想源头之一）；② **声明式 UI 的另一范本**（SwiftUI 与 React 思想相通：状态驱动视图、单向数据流、可组合），对照能加深对 React 的理解。

## 二、Optional：消灭空指针崩溃

`null` 引用是 Tony Hoare 称之为「十亿美元错误」的发明——绝大多数运行时崩溃都源于解引用了 null。Swift 的解法是 **Optional**：把「可能没有值」做成**类型系统的一部分**，编译器强制你在用值前显式处理「无值」情况。

```swift
// Optional<Int> 是枚举：case some(Int) | case none
let x: Int? = 42       // ? 是 Optional<Int> 的语法糖
let y: Int? = nil

// ❌ 编译错误：不能直接把 Optional 当 Int 用
// let sum = x + y

// ✅ 必须先解包（unwrap）
if let unwrapped = x {
    print(unwrapped + 1)            // 安全绑定，unwrapped 是 Int
}

let z = y ?? 0                        // 空合：y 为 nil 时用 0
let name: String? = user?.profile?.name   // 可选链：链中任一 nil 即返回 nil
let n = try? parse("abc")            // 可选 try：失败返回 nil 而非抛错
let forced = x!                       // 强制解包：nil 时崩溃（仅在你确信非空时用）
```

- **核心收益**：`nil` 不再是「任何类型都能装的值」，而是**只有 Optional 类型才能承载的状态**。函数签名 `func find(_ id: Int) -> User?` 直接告诉调用者「可能找不到」，编译器强制你处理。
- **解包工具箱**：`if let`/`guard let`（早返回，Swift 风格首选）、可选链 `?.`（深挖嵌套属性）、空合 `??`（给默认值）、可选 try `try?`（吞错误转 nil）、强制解包 `!`（危险，仅测试/确信时用）。
- **与 Kotlin/Dart 的差异**：Swift 的 Optional 是**真正的枚举类型**（有运行时表示），Kotlin 的 `T?` 是平台类型 + 编译期检查（运行时仍是 null），Dart 的 Null Safety 也是静态检查（运行时仍可被 legacy 代码触发）。Swift 最严格。

## 三、值类型 vs 引用类型：struct 与 class

Swift 把类型严格分两类，这是它**优于绝大多数 OOP 语言**的关键设计：

```swift
// 值类型 struct：赋值即拷贝
struct Point { var x: Double; var y: Double }
var p1 = Point(x: 1, y: 2)
var p2 = p1                 // 拷贝，p1 与 p2 互不影响
p2.x = 99
print(p1.x)                 // 仍是 1

// 引用类型 class：赋值共享引用，ARC 管生命周期
class ViewModel { var count = 0 }
let a = ViewModel()
let b = a                   // 共享同一实例
b.count = 99
print(a.count)              // 99（同一对象）
```

| 维度 | struct / enum（值类型） | class（引用类型） |
| --- | --- | --- |
| 赋值语义 | **拷贝**（独立副本） | 共享引用（同一对象） |
| 内存位置 | 栈（小）/ 堆（大，CoW） | 堆 |
| 生命周期 | 作用域结束自动回收 | **ARC 引用计数** |
| 线程安全 | **天然安全**（无共享可变） | 需手动同步 |
| 继承 | 不能继承（用协议复用） | 单继承 |
| 多态 | 静态派发（可加 `@inlinable`） | 动态派发（虚表） |

- **「能用 struct 就用 struct」**：值类型赋值即拷贝、无线程安全问题、无循环引用、性能好（栈分配 + 内联）。Swift 标准库的 Array / Dictionary / Set / String 全是 struct（带**写时复制 CoW**——只在修改时才真正拷贝，避免无谓开销）。
- **何时用 class**：① 需要共享身份（如 ViewModel、UIView 子类）；② 需要 Objective-C 互操作；③ 需要继承。日常 80% 的模型/数据应该用 struct。

## 四、协议导向编程：优于继承的复用方式

Swift 鼓励**协议导向编程（Protocol-Oriented Programming, POP）**——用协议定义能力、用扩展提供默认实现、用泛型约束做静态多态，而非经典的类继承。

```swift
// 协议定义能力（带 associatedtype 关联类型，类似泛型）
protocol Drawable {
    func draw(into ctx: Canvas)
}

// extension 提供默认实现 —— 遵循协议就免费获得
extension Drawable where Self: Shape {
    func draw(into ctx: Canvas) { ctx.fill(self.bounds) }
}

// 泛型约束：T 必须同时满足 Drawable 和 Equatable
func render<T: Drawable & Equatable>(_ items: [T]) {
    items.forEach { $0.draw(into: canvas) }
}
```

- **优于继承的理由**：① 值类型（struct）也能遵循协议；② 一个类型可遵循多个协议（多重能力），而类只能单继承；③ 协议有默认实现，避免「脆弱基类」（父类改动破坏所有子类）；④ 静态派发（编译期可知，可内联优化）。
- **标准库是 POP 范本**：`Equatable`（`==`）、`Hashable`（字典/集合 key）、`Codable`（JSON 序列化）、`Comparable`（排序）、`Sequence`/`Collection`（迭代）全是协议——你的 struct 声明遵循它们就免费获得能力（编译器常能自动合成实现）。

## 五、ARC：自动引用计数（不是 GC）

Swift 用 **ARC（Automatic Reference Counting）** 管理引用类型（class）的生命命期——**编译器在编译期**自动插入 `retain`/`release`，强引用计数归零立即释放，**无 GC 暂停**（区别于 Java/Kotlin/Dart/JS 的 tracing GC）。

```swift
class Person {
    let name: String
    init(name: String) { self.name = name }
    deinit { print("\(name) 被释放") }
}

var p: Person? = Person(name: "A")    // 强引用计数 = 1
var q = p                              // = 2
p = nil                                // = 1，不释放
q = nil                                // = 0，立即释放 → 打印「A 被释放」

// 循环引用陷阱 —— 需用 weak / unowned 打破
class Node { var next: Node? }         // ❌ 强引用，会泄漏
class Node2 { weak var next: Node2? }  // ✅ 弱引用，不参与计数
```

- **循环引用（retain cycle）**：A 强引 B、B 强引 A，双方计数永远 ≥1，永不释放 → 内存泄漏。常见于闭包捕获 `self`（`closure` 也是引用类型）。
- **解法**：`weak`（弱引用，必须是 Optional，引用释放后自动置 nil，适合可失效的关系）/ `unowned`（无主引用，非 Optional，假定永存，释放后访问会崩溃，适合生命周期有保证的关系）/ 闭包捕获列表 `[weak self]`。
- **weak 与 JS 弱引用差异**：Swift 的 `weak` 是**语言级**机制，编译器保证引用失效后自动置 nil（不是「可能延迟」的 WeakRef）。

## 六、SwiftUI：声明式 UI 与状态驱动

SwiftUI（2019）是 Apple 的**声明式 UI 框架**，思想与 React/Vue 高度相通：**状态是真相、视图是状态的函数**。开发者只需声明「给定这个状态，视图长什么样」，框架负责 diff 与更新。

```swift
import SwiftUI

struct CounterView: View {
    @State private var count = 0          // 局部状态，修改触发视图刷新

    var body: some View {                  // body 是计算「视图」的函数
        VStack {
            Text("Count: \(count)")
            Button("加一") { count += 1 }   // 修改 @State → 自动重渲染
        }
    }
}
```

四种属性包装器对应四种数据流：

| 包装器 | 用途 | 数据源 | 谁拥有 |
| --- | --- | --- | --- |
| `@State` | 视图**局部**简单值 | 自己创建 | 当前视图 |
| `@Binding` | 父子**双向**绑定 | 父传 `$state` | 父视图 |
| `@ObservedObject` | 外部**引用类型**对象 | 注入 | 别处 |
| `@EnvironmentObject` | **全局**注入的对象 | 环境链路 | 祖先注入 |

- **Swift 5.9+（2023）的 Observation**：`@Observable` 宏替代 `ObservableObject`，性能更好（只追踪实际访问的属性），新工程优先用。
- **与 React 的对照**：`@State` ≈ `useState`、`@Binding` ≈ 受控 props、`@ObservedObject`/`@EnvironmentObject` ≈ Context/Redux。SwiftUI 的视图是**值类型 struct**（不是组件实例），框架 diff 的是值，这点比 React 的 reconciliation 更轻量。

## 下一步

理解了 Swift 的总览后，下一步深入语言核心——[语言精要](./guide-line/language-essentials)（Optional 全家桶、值类型与写时复制、协议与泛型、ARC 循环引用排查、SwiftUI 状态四件套实战），再进入[原生模块](./guide-line/native-modules)（React Native iOS 桥接）。
