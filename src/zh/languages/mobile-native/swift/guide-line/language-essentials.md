---
layout: doc
outline: [2, 3]
---

# 语言精要：Optional、值类型、协议与 SwiftUI

> 基于 Apple Swift 5.x（2026 主线） · 核于 2026-08

## 速查

- **Optional 本质是枚举**：`Optional<T> = .some(T) | .none`，`T?` 是语法糖。编译器强制解包才能用值——`!`（强制，nil 崩溃）、`if let`/`guard let`（安全绑定）、`?.`（可选链）、`??`（空合）、`try?`（可选 try）。`guard let` 是 Swift 风格首选（早返回，减少嵌套）。
- **隐式解包 Optional（`T!`）**：历史遗留（OC 互操作 outlet），访问时自动解包，nil 仍会崩溃——新代码应避免，改用普通 `T?` + 显式解包。
- **值类型 struct / enum**：赋值即拷贝（独立副本），天然线程安全，无线程同步开销。Swift 标准库的 Array/Dictionary/Set/String **全是 struct**。
- **写时复制（CoW）**：Swift 集合底层用「引用计数的内部缓冲」实现，但**修改时**（`append`/赋值）才真正复制——让值类型在大数据上不浪费内存。
- **引用类型 class / closure**：赋值共享引用，由 **ARC** 管生命周期，可能循环引用（需 `weak`/`unowned` 打破）。
- **协议（protocol）**：定义能力契约，可带**默认实现**（`extension`）、**关联类型**（`associatedtype`，类似泛型）、**条件遵循**（`where Self: ...`）。值类型与引用类型都能遵循。
- **泛型具化（reified）**：Swift 泛型在编译期为每种类型生成专门代码（不同于 Java 的类型擦除），无装箱开销，性能等价于手写具体类型版本。
- **协议见证表（protocol witness table, PWT）**：协议方法动态派发的实现机制——每个「类型 + 协议」组合有一张静态表，运行时按表查实现（类似 vtable，但按协议而非类层级组织）。
- **ARC 循环引用排查**：用 Xcode Memory Graph Debugger 或 Instruments 的 Leaks 找泄漏。闭包默认强捕获 `self`，长时间持有需用 `[weak self]` 捕获列表。
- **SwiftUI 状态四件套**：`@State`（局部值）/`@Binding`（父子双向）/`@ObservedObject`（外部引用对象，配合 `ObservableObject`）/`@EnvironmentObject`（全局注入）。Swift 5.9+ 的 `@Observable` 宏是更优替代。

## 一、Optional 全家桶

Optional 是 Swift 最基础也最重要的类型。它让「可能没有值」成为**类型签名的一部分**，调用者一眼可知、编译器强制处理。

```swift
// 1. 强制解包 !：危险，nil 即崩溃
let x: Int? = Int("42")
let n = x!                          // ✅ 42
let m = Int("abc")!                 // 💥 运行时崩溃：找不到值

// 2. if let 安全绑定：在作用域内得到非空副本
if let value = x { print(value) }   // value 是 Int（非 Optional）

// 3. guard let 早返回：Swift 风格首选，减少嵌套
func greet(_ name: String?) {
    guard let name else { return }  // Swift 5.7+ 简写（同名绑定）
    print("Hi, \(name)")
}

// 4. 可选链 ?.：深挖嵌套属性，链中任一 nil 即返回 nil
let city = user?.address?.city      // 类型是 String?

// 5. 空合 ??：nil 时给默认值
let display = user?.name ?? "匿名"

// 6. 可选 try try?：失败转 nil（不抛错）
let n2 = try? parseJSON("...")      // 失败返回 nil

// 7. 隐式解包 !（历史遗留，少用）
let outlet: UILabel! = ...
outlet.text = "..."                 // 自动解包
```

- **guard 优于 if**：`guard let` 让「失败路径」早返回，主逻辑留在函数外层（无嵌套），可读性更好。这是 Swift 强烈推荐的风格。
- **可选链的短路语义**：`a?.b?.c?.d` 中任一环节为 nil，整条立即返回 nil，不会向后求值——避免层层 `if let` 嵌套。
- **`try?` vs `try!` vs `try`**：`try` 必须配 `do-catch` 或在 `throws` 函数内；`try?` 把错误转 nil；`try!` 断言不抛错（抛了就崩溃）。优先 `try?` + `??`。

## 二、值类型与写时复制

Swift 把「值类型优先」作为语言哲学。理解 struct 与 class 的差异、以及集合如何用 CoW 兼顾性能，是写好 Swift 的关键。

```swift
struct Point: Equatable { var x: Double; var y: Double }

var p1 = Point(x: 1, y: 2)
var p2 = p1                  // 拷贝：p2 是独立副本
p2.x = 99
print(p1.x, p2.x)            // 1.0 99.0（互不影响）

// 集合 CoW：共享读取时不拷贝，修改时才拷贝
var arr = [1, 2, 3]
var arr2 = arr               // 此时底层缓冲共享（引用计数 +1，但没拷贝）
arr2.append(4)               // 修改 → 触发真正的拷贝
print(arr, arr2)             // [1,2,3]  [1,2,3,4]
```

- **CoW 工作原理**：集合内部用一个**引用计数的缓冲区**（`__ContiguousArrayStorage`）存元素。赋值时只增加引用计数（O(1)），真正修改时检测「引用计数 > 1」就先复制一份再改（O(n)）。
- **自定义 CoW**：你自己写的 struct 若持有大量数据（如大数组、缓冲区），可用 `isKnownUniquelyReferenced(&storage)` 判断是否独占，独占时直接改、否则拷贝——标准库就是这样实现的。
- **struct vs class 选型清单**：

| 选 struct ✅ | 选 class |
| --- | --- |
| 数据模型（User/Point/Config） | 需要共享身份（ViewModel/Manager） |
| 不可变值（坐标/颜色/尺寸） | 需要 OC 互操作 |
| 值语义（拷贝即副本） | 需要继承 |
| 线程安全的纯数据 | 跨层传递的可变状态 |

## 三、协议、扩展与泛型

协议导向编程（POP）是 Swift 复用代码的主要方式。

```swift
// 1. 协议定义能力（含关联类型）
protocol Stack {
    associatedtype Element
    mutating func push(_ item: Element)
    mutating func pop() -> Element?
}

// 2. 遵循 + 实现
struct IntStack: Stack {
    typealias Element = Int        // 可省略，编译器能推断
    private var items: [Int] = []
    mutating func push(_ item: Int) { items.append(item) }
    mutating func pop() -> Int? { items.popLast() }
}

// 3. extension 提供默认实现（遵循就免费获得）
extension Stack where Element: Equatable {
    func contains(_ item: Element) -> Bool { /* ... */ false }
}

// 4. 泛型约束：T 必须遵循 Stack 且 Element 可比较
func topMost<S: Stack>(_ s: S) -> S.Element? where S.Element: Comparable {
    s.pop()
}

// 5. 协议的合成（多协议约束）
func describe<T: Equatable & CustomStringConvertible>(_ x: T) -> String { "\(x)" }
```

- **协议的两种派发**：① 在 `protocol` 内声明的方法走**动态派发**（查 PWT）；② 在 `extension` 里**直接定义**（非协议声明）的方法走**静态派发**（编译期绑定）。这点微妙但重要：把方法放协议声明里才能让子类/不同实现被多态调用。
- **associatedtype vs 泛型参数**：协议用 `associatedtype`（让遵循者自己定具体类型），泛型函数/类型用 `<T>`。带 associatedtype 的协议做「存在类型」需 `any Stack`（Swift 5.7+ 语法，运行时存在容器）。
- **编译器自动合成**：声明 `Codable`/`Equatable`/`Hashable` 时，若所有字段都满足，编译器自动生成实现——日常极少手写。

## 四、ARC 与循环引用

ARC 是 Swift 内存管理的核心机制。理解它的关键，在于知道**何时引用计数变化**、**循环引用怎么产生**、**怎么打破**。

```swift
class Person {
    var name: String
    var friend: Person?              // ❌ 强引用
    init(name: String) { self.name = name }
    deinit { print("\(name) 释放") }
}

// 循环引用场景
var a: Person? = Person(name: "A")
var b: Person? = Person(name: "B")
a?.friend = b                        // A 强引 B
b?.friend = a                        // B 强引 A —— 引用计数双方都 = 2
a = nil; b = nil                     // 外部断开，但 A↔B 互相引用，计数仍 = 1，永不释放 → 泄漏

// 打破：weak（可空，自动置 nil）
class Person2 {
    var name: String
    weak var friend: Person2?        // ✅ 弱引用
    init(name: String) { self.name = name }
}

// 闭包循环引用 —— 最常见陷阱
class Networker {
    var onDone: (() -> Void)?
    func fetch() {
        onDone = { self.handle() }  // ❌ 闭包强捕获 self，self 又持有闭包 → 循环
    }
    func handle() {}
}
// 解法：捕获列表
class Networker2 {
    var onDone: (() -> Void)?
    func fetch() {
        onDone = { [weak self] in self?.handle() }   // ✅ 弱捕获
    }
    func handle() {}
}
```

- **weak vs unowned**：`weak var` 必须 Optional（引用失效后自动 nil，安全）；`unowned let` 非 Optional（假定永存，失效后访问崩溃）。规则：生命周期可能短于自己用 `weak`，能保证永存用 `unowned`（少一次解包开销）。
- **闭包默认强捕获**：闭包对捕获的变量（尤其是 `self`）默认强引用——长时间持有（异步回调、属性闭包、NotificationCenter observer）必须 `[weak self]` 或 `[unowned self]`。
- **排查工具**：Xcode 的 **Memory Graph Debugger**（Debug Navigator → 内存图）能可视化对象引用关系，红色叹号标出循环引用；Instruments 的 **Leaks** 工具能在运行时检测泄漏。

## 五、SwiftUI 状态四件套实战

SwiftUI 是声明式 UI，理解四种属性包装器的适用场景是写好 SwiftUI 的关键。

```swift
import SwiftUI

// 1. @State：视图局部简单值，自己拥有
struct Counter: View {
    @State private var count = 0
    var body: some View {
        Button("加一") { count += 1 }    // 修改触发刷新
        Text("\(count)")
    }
}

// 2. @Binding：父子双向，父传 $state（带 $ 是投影 Binding）
struct Stepper: View {
    @Binding var value: Int
    var body: some View { Button("-") { value -= 1 } }
}
struct Parent: View {
    @State private var total = 0
    var body: some View { Stepper(value: $total) }   // $total 是 Binding<Int>
}

// 3. @ObservedObject：外部引用类型对象（需 ObservableObject）
class Profile: ObservableObject {
    @Published var name = "A"            // @Published 修改时通知刷新
}
struct ProfileView: View {
    @ObservedObject var profile: Profile // 不拥有，由父注入
    var body: some View { Text(profile.name) }
}

// 4. @EnvironmentObject：全局注入（祖先链上注入，后代任意取）
struct App: View {
    var body: some View {
        ContentView().environmentObject(Profile())   // 注入
    }
}
struct DeepChild: View {
    @EnvironmentObject var profile: Profile          // 任意后代取用
    var body: some View { Text(profile.name) }
}
```

- **核心原则**：① 数据**单向向下流动**（父→子）；② 子修改父用 `@Binding`（双向契约）；③ 跨层共享用 `@EnvironmentObject`（避免层层透传）。
- **`@State` 只能用于值类型**：因为它是视图拥有的「真相源」，引用类型不能保证拷贝语义；引用类型用 `@ObservedObject`/`@StateObject`（`@StateObject` 是视图自己创建并拥有，Swift 2.0 后用于「视图首次创建后保持」的对象）。
- **Swift 5.9+ 的 `@Observable` 宏**：替代 `ObservableObject` + `@Published`，写法是 `@Observable class Profile { var name = "A" }`，性能更好（只追踪视图真正访问的属性）。新工程优先用。
- **与 React 的对照**：`@State` ≈ `useState`、`@Binding` ≈ 受控组件 props、`@ObservedObject` ≈ 外部 store 订阅、`@EnvironmentObject` ≈ React Context。SwiftUI 的视图是 struct（值），diff 成本低。

## 交互演示

本叶无专门可视化。SwiftUI 的状态流建议在 Xcode Canvas 实时预览中动手感受——修改 `@State` 即看视图刷新。

## 下一步

掌握了语言核心后，下一站是工程实战——[原生模块](./native-modules)：如何用 Swift 为 React Native iOS 写原生模块、与 Objective-C 互操作、Xcode 集成全流程。
