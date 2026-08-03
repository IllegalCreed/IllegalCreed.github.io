---
layout: doc
outline: [2, 3]
---

# 参考：Swift 类型系统、Optional API 与易错点速查

> 基于 Apple Swift 5.x（2026 主线） · 核于 2026-08

## 速查

- **类型两大类**：值类型（struct/enum/tuple，赋值拷贝、栈分配、线程安全）与引用类型（class/closure，共享引用、堆分配、ARC 管理）。「能用 struct 就别用 class」。
- **Optional**：`T?` 是 `Optional<T>` 枚举（`.some(T)`/`.none`），编译期强制解包。解包工具：`!`（强制）/`if let`/`guard let`（绑定）/`?.`（链）/`??`（空合）/`try?`（可选 try）。
- **集合全 struct**：Array/Dictionary/Set/String 全是值类型，靠**写时复制（CoW）**避免无谓拷贝。
- **协议（protocol）**：定义能力，可带默认实现（extension）、关联类型（associatedtype）、条件遵循（where）。值类型/引用类型都能遵循。
- **泛型具化**：编译期为每种类型生成专门代码，无装箱开销，性能等价手写具体类型版本。
- **ARC**：编译期插入 retain/release，引用计数为 0 立即释放（无 GC 暂停）。循环引用用 `weak`（可空）/`unowned`（永存）/闭包捕获列表 `[weak self]` 打破。
- **SwiftUI 状态四件套**：`@State`（局部值）/`@Binding`（父子双向）/`@ObservedObject`（外部引用对象）/`@EnvironmentObject`（全局注入）。`@StateObject` 视图自己拥有，`@Observable`（5.9+ 宏）替代 `ObservableObject`。
- **错误处理**：`throws` 标记、`try`/`try?`/`try!` 调用、`catch` 捕获；`Result<Success, Failure>` 用于异步/回调。
- **OC 互操作**：Swift 调 OC 用 Bridging Header；OC 调 Swift 需 `@objc` + 继承 `NSObject`。

## 一、类型系统速查

| 类型 | 种类 | 语义 | 关键能力 |
| --- | --- | --- | --- |
| `struct` | 值类型 | 拷贝 | 可遵循协议、可 `mutating` 方法、CoW 集合 |
| `enum` | 值类型 | 拷贝 | 可带关联值（代数数据类型）、模式匹配 |
| `class` | 引用类型 | 共享 | 单继承、ARC、`deinit`、OC 互操作 |
| `tuple` | 值类型 | 拷贝 | `(a, b)`，无名/具名 |
| `protocol` | 契约 | —— | 关联类型、默认实现、多遵循 |
| `closure` | 引用类型 | 共享 | 捕获上下文（默认强引 self） |
| `Optional<T>` | enum（值类型） | 拷贝 | `.some(T)`/`.none`，即 `T?` |
| `Result<S, F>` | enum（值类型） | 拷贝 | `.success`/`.failure`，错误做值传递 |

## 二、Optional API 速查

| 写法 | 含义 | nil 行为 |
| --- | --- | --- |
| `let x: T? = nil` | 声明 Optional | 允许 nil |
| `x!` | 强制解包 | nil 崩溃（Fatal error） |
| `if let v = x { }` | 安全绑定到 v | 不进入分支 |
| `guard let v = x else { return }` | 早返回 | 走 else 分支 |
| `a?.b?.c` | 可选链 | 任一 nil 返回 nil |
| `x ?? default` | 空合 | 用 default |
| `try? expr` | 可选 try | 失败返回 nil |
| `try! expr` | 强制 try | 抛错崩溃 |
| `let x: T! = ...` | 隐式解包 Optional | 访问时自动解包，nil 崩溃（少用） |
| `as? Type` | 可选转型 | 失败返回 nil |
| `as! Type` | 强制转型 | 失败崩溃 |

## 三、协议导向常用协议

| 协议 | 能力 | 自动合成 |
| --- | --- | --- |
| `Equatable` | `==` | ✅（字段全 Equatable 时） |
| `Hashable` | 字典/集合 key | ✅ |
| `Comparable` | `<`/`>`/排序 | 需实现 `<` |
| `Codable` | JSON/归档序列化 | ✅ |
| `CustomStringConvertible` | `description`（print） | 需实现 |
| `Sequence`/`Collection` | 迭代/下标 | 需实现核心方法 |
| `Identifiable`（SwiftUI） | 列表/ForEach 的 id | 需 `var id: ID` |

## 四、SwiftUI 属性包装器对比

| 包装器 | 数据流 | 类型 | 拥有者 | 何时用 |
| --- | --- | --- | --- | --- |
| `@State` | 局部 | 值类型 | 当前视图 | 视图内的简单状态 |
| `@StateObject` | 局部 | 引用类型 | 当前视图 | 视图首次创建后保持的 ObservableObject |
| `@Binding` | 双向（父↔子） | 值/引用 | 父 | 子修改父状态（受控组件） |
| `@ObservedObject` | 外部→本视图 | 引用类型 | 别处 | 注入的 ObservableObject（不拥有） |
| `@EnvironmentObject` | 祖先→后代 | 引用类型 | 祖先 | 全局注入（避免层层透传） |
| `@Observable`（5.9+ 宏） | 替代 ObservableObject | 引用类型 | —— | 新工程首选 |

## 五、与 Objective-C / Kotlin / Dart 对比

| 维度 | Swift | Objective-C | Kotlin | Dart |
| --- | --- | --- | --- | --- |
| 空安全 | Optional 枚举（运行时仍有） | 无（裸 nil 易崩） | 平台类型 + 编译期 | 静态检查（运行时仍可触发） |
| 内存管理 | ARC（编译期 retain/release） | ARC（手动写 retain） | JVM GC（tracing） | GC（tracing + 分代） |
| 值类型 | struct/enum（一等公民） | 无（全对象） | data class（值语义但仍是对象） | 无（全引用） |
| 协议 | 一等公民 + 默认实现 + 关联类型 | protocol（弱） | interface（类似） | implements（类似） |
| 泛型 | 具化（reified） | 无泛型（伪泛型） | JVM 擦除（reified 需 inline） | 具化 |
| 异步 | async/await（5.5+）+ 结构化并发 | GCD/回调 | coroutine + Flow | Future/Stream + async/await |
| 主要平台 | iOS/macOS | iOS/macOS（退场中） | Android/JVM/服务端 | Flutter 跨平台 |

## 六、易错点清单

- **「Optional 就是 nullable」**：部分对。Swift 的 Optional 是真正的枚举类型，编译器强制解包；其它语言的 null 只是「没有值的占位」。Swift 最严格。
- **「struct 一定比 class 快」**：不一定。大 struct 频繁拷贝（无 CoW 时）反而慢；引用类型共享更省内存。需看场景。
- **「weak 和 unowned 等价」**：错。`weak` 必须 Optional（失效自动 nil，安全）；`unowned` 非 Optional（失效访问崩溃）。
- **「闭包默认弱捕获 self」**：错。闭包**默认强捕获** self，长时间持有（异步/属性/通知）必须 `[weak self]`。
- **「SwiftUI 视图是组件实例」**：错。SwiftUI 视图是**值类型 struct**（描述状态的函数），框架 diff 的是值；不像 React 有实例。
- **「`@State` 可以放引用类型」**：错。`@State` 只能用于值类型；引用类型用 `@StateObject`（自己拥有）或 `@ObservedObject`（外部注入）。
- **「Swift 可以直接调 C++」**：部分对。Swift 5.9+ 引入 C++ 互操作，但有限制；RN 的 JSI 胶水仍多用 OC++/OC 包装。
- **「`T!` 隐式解包是安全的」**：错。它只是「自动解包」的 Optional，nil 访问仍崩溃。新代码应避免，改用 `T?` + 显式解包。
- **「协议方法都是动态派发」**：错。声明在 `protocol` 内的走 PWT 动态派发；直接在 `extension` 里定义的方法走静态派发（编译期绑定，不可被子类覆盖）。
- **「RN 新架构下不用再写 OC」**：部分对。Codegen 省去了模板，但 JSI 是 C++ 抽象，Swift↔C++ 桥接仍可能要 OC/OC++ 胶水。

## 七、进阶方向（链接其他叶）

- [Kotlin](../kotlin/) —— Android 原生语言，与 Swift 互为镜像（空安全/协程/Compose 对照 Optional/async/SwiftUI）
- [Dart](../dart/) —— Flutter 跨平台语言，对比声明式 UI 的另一种实现
- [React Native](../../../mobile-desktop/mobile-framework/react-native/) —— RN 主框架，原生模块的服务对象

## 权威链接

- [The Swift Programming Language（官方）](https://docs.swift.org/swift-book/)
- [Swift.org](https://www.swift.org/)
- [Swift Evolution（提案）](https://github.com/swiftlang/swift-evolution)
- [SwiftUI Tutorials（Apple）](https://developer.apple.com/tutorials/swiftui)
- [React Native Native Modules（新架构）](https://reactnative.dev/docs/next/the-new-architecture/pillars-turbomodules)
- [WWDC（每年最新 Sessions）](https://developer.apple.com/videos/)
- 本站幻灯片：<a href="/SlideStack/swift-slide/" target="_blank">Swift</a>
