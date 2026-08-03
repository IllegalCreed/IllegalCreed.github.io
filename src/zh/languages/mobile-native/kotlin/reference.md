---
layout: doc
outline: [2, 3]
---

# 参考：Kotlin 类型系统、协程 API 与易错点速查

> 基于 Kotlin 2.x（2026 主线） · 核于 2026-08

## 速查

- **空安全二分**：`T`（永不为 null）与 `T?`（可空）。工具：`?.`（安全调用）、`?:`（Elvis）、`!!`（断言，NPE 风险）、`as?`（安全转型）。
- **平台类型 `T!`**：调用 Java 代码时类型可空性未知，NPE 高发区——显式用 `T?` 接收或加 JSR-305 注解。
- **协程三件套**：`suspend fun`（可挂起）、`launch`（不返回）/`async`（返回 Deferred）、`CoroutineScope`（生命周期）。结构化并发：父取消传播子。
- **调度器**：`Main`（UI）/`IO`（网络磁盘）/`Default`（CPU）/`Unconfined`。`withContext` 切换。
- **Flow**：冷流（每次 collect 触发生产）；`StateFlow`（状态，热）/`SharedFlow`（事件，热）。支持 map/filter/背压/取消。
- **data class**：自动 equals/hashCode/toString/copy/componentN。
- **sealed class/interface**：限定子类，when 穷尽匹配。
- **扩展函数**：`fun Receiver.xxx()`，静态解析（非虚函数）。
- **Compose 状态**：`remember`（缓存）/`mutableStateOf`（可观察）/`derivedStateOf`（派生）/`snapshotFlow`（转 Flow）。状态提升 = value + onChange。
- **Java 互操作**：100% 互通；陷阱在平台类型、原始数组、受检异常、泛型型变、静态成员。

## 一、类型系统速查

| 类型 | 含义 | 关键特性 |
| --- | --- | --- |
| `T` | 非空类型 | 永不为 null，赋 null 编译错误 |
| `T?` | 可空类型 | 可承载 null，访问需先安全处理 |
| `T!` | 平台类型 | 调用 Java 代码时，可空性未知 |
| `data class` | 数据类 | 自动 equals/hashCode/toString/copy |
| `sealed class` | 密封类 | 限定子类，when 穷尽匹配 |
| `enum class` | 枚举 | 单例集合 |
| `object` | 单例 | 替代 Java 的 static |
| `companion object` | 伴生对象 | 类的「静态」成员容器 |
| `Nothing` | 不可达 | 函数永不返回（抛异常/无限循环） |
| `Unit` | 无返回值 | 等价 Java void |

## 二、空安全操作符速查

| 写法 | 含义 | null 行为 |
| --- | --- | --- |
| `a?.b` | 安全调用 | a 为 null 时返回 null |
| `a ?: default` | Elvis | null 时用 default |
| `a!!` | 非空断言 | null 抛 NPE（危险） |
| `a as? Type` | 安全转型 | 失败返回 null |
| `a?.let { }` | 作用域函数 | a 为 null 时跳过 |
| `a?.run { }` | 作用域 + 返回 | a 为 null 时跳过 |
| `list.filterNotNull()` | 去 null | 返回非空元素列表 |
| `requireNotNull(a)` | 校验非空 | null 抛 IllegalArgumentException |

## 三、协程 API 速查

| API | 用途 |
| --- | --- |
| `suspend fun` | 标记可挂起函数（不阻塞线程） |
| `runBlocking { }` | 桥接阻塞世界（顶层入口，少用于生产） |
| `coroutineScope { }` | 结构化作用域（异常取消兄弟） |
| `supervisorScope { }` | 监督作用域（子异常互不影响） |
| `launch { }` | 启动协程（fire-and-forget，返回 Job） |
| `async { }` | 启动并返回 Deferred（await 取结果） |
| `withContext(Dispatcher) { }` | 切换调度器并保留 scope |
| `delay(ms)` | 非阻塞等待（挂起） |
| `ensureActive()` / `yield()` | 协作式取消检查 |
| `Job.cancel()` | 取消协程（协作式） |
| `Deferred<T>.await()` | 等待 async 结果 |
| `flow { emit(x) }` | 冷流生产 |
| `StateFlow<T>` | 热状态流（UI 状态首选） |
| `SharedFlow<T>` | 热事件流（事件总线） |

### 调度器（Dispatchers）

| 调度器 | 用途 | Android 场景 |
| --- | --- | --- |
| `Main` | UI 线程 | 更新 UI 必须 |
| `IO` | IO 密集 | 网络/数据库/文件 |
| `Default` | CPU 密集 | 排序/解析/计算 |
| `Unconfined` | 不切线程 | 少用（测试/特殊） |

## 四、Jetpack Compose 速查

| API | 用途 | 对照 |
| --- | --- | --- |
| `@Composable` | 标记可组合函数 | 函数组件 |
| `remember { }` | 跨重组缓存值 | useMemo（无依赖） |
| `mutableStateOf(x)` | 可观察状态 | useState 的核心 |
| `remember { mutableStateOf(x) }` | 缓存的可观察状态 | useState |
| `var x by remember { mutableStateOf(0) }` | 委托写法（推荐） | 直接读写 |
| `derivedStateOf { }` | 派生状态 | useMemo（有依赖） |
| `snapshotFlow { }` | 状态转 Flow | 状态订阅 |
| `LaunchedEffect(key) { }` | key 变化启动协程 | useEffect |
| `DisposableEffect { }` | 带清理的副作用 | useEffect（return cleanup） |
| `rememberCoroutineScope()` | 在组合内拿 scope | useEventCallback |
| `State<T>` / `MutableState<T>` | 状态持有者 | —— |

### 状态提升（state hoisting）模式

```kotlin
// 子组件：无状态受控
@Composable
fun Input(value: String, onChange: (String) -> Unit) { /* ... */ }

// 父组件：拥有状态
@Composable
fun Form() {
    var name by remember { mutableStateOf("") }
    Input(value = name, onChange = { name = it })
}
```

## 五、与 Java / Swift / Dart 对比

| 维度 | Kotlin | Java | Swift | Dart |
| --- | --- | --- | --- | --- |
| 空安全 | T/T? 二分（编译期） | 无（裸 null） | Optional 枚举（运行时仍有） | 静态检查（运行时仍可触发） |
| 平台类型 | 有（调 Java 时） | —— | 无 | 无 |
| 内存管理 | JVM GC（tracing） | JVM GC | ARC | GC |
| 异步 | 协程 + Flow | Future/回调/Stream | async/await + 结构化并发 | Future/Stream + async/await |
| 声明式 UI | Jetpack Compose | 无原生（用 Compose） | SwiftUI | Flutter Widget |
| 值类型 | 无（data class 是引用） | 无 | struct/enum 一等 | 无（全引用） |
| 主要平台 | Android/JVM/服务端/KMP | Android/JVM/服务端 | iOS/macOS | Flutter 跨平台 |

## 六、易错点清单

- **「Kotlin 完全消灭了 NPE」**：错。平台类型（调 Java）、`!!`、反射、`lateinit` 未初始化访问仍会 NPE。
- **「平台类型就是可空类型」**：错。平台类型 `T!` 是「可空性未知」，Kotlin 允许当非空用（运行时可能 NPE）；`T?` 是明确的可空。
- **「协程比线程快所以能完全替代线程」**：部分对。协程适合 IO/异步密集，但 CPU 密集仍需线程池（Dispatchers.Default 内部就是线程池），且阻塞调用（Thread.sleep/锁等待）仍占线程。
- **「launch 启动的协程不用管」**：错。无 scope 的 launch（如 GlobalScope）会泄漏——必须在结构化 scope 内启动，或显式管理 Job。
- **「协程取消会立即停止」**：错。取消是协作式的——suspend 函数检查取消并抛 CancellationException，但纯 CPU 计算需手动 ensureActive() 或 yield()。
- **「data class 可以被继承」**：默认不能（data class 默认 final）。需显式 open 或继承其他类（Kotlin 1.1+）。
- **「扩展函数能覆盖成员函数」**：错。成员函数优先级高于扩展函数；扩展函数静态解析（按声明类型），不是虚函数。
- **「when 表达式必须有 else」**：不一定。对密封类/枚举的穷尽匹配可省略 else，编译器会检查覆盖所有分支。
- **「Compose 的 remember 等于 useState」**：相似但 remember 需配合 mutableStateOf 才是可观察状态；remember 单独只是缓存（不一定触发重组）。
- **「Kotlin 的 `==` 比较引用」**：错。Kotlin 的 `==` 是结构相等（调 equals），`===` 才是引用相等（与 Java 相反）。

## 七、进阶方向（链接其他叶）

- [Swift](../swift/) —— iOS 原生语言，与 Kotlin 互为镜像（Optional/async/SwiftUI 对照空安全/协程/Compose）
- [Dart](../dart/) —— Flutter 跨平台语言，对比跨平台方案
- [React Native](../../../mobile-desktop/mobile-framework/react-native/) —— RN 主框架，原生模块的服务对象

## 权威链接

- [Kotlin 官方文档](https://kotlinlang.org/docs/home.html)
- [Kotlin 协程指南](https://kotlinlang.org/docs/coroutines-guide.html)
- [Jetpack Compose 文档](https://developer.android.com/jetpack/compose)
- [Kotlin Multiplatform](https://kotlinlang.org/docs/multiplatform.html)
- [React Native Native Modules（新架构）](https://reactnative.dev/docs/next/the-new-architecture/pillars-turbomodules)
- [Android 开发者官网](https://developer.android.com/)
- 本站幻灯片：<a href="/SlideStack/kotlin-slide/" target="_blank">Kotlin</a>
