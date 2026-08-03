---
layout: doc
outline: [2, 3]
---

# 入门：Kotlin 定位、空安全、协程与 Compose

> 基于 Kotlin 2.x（2026 主线） · 核于 2026-08

## 速查

- **定位**：JetBrains 出品的**现代 JVM 语言**，2016 年 1.0、2017 年 Google 确立为 **Android 官方首选语言**、2019 年起与 Java 平级且新工程默认。运行在 JVM 上（编译为字节码），与 Java **100% 互操作**（同工程混用、相互调用、渐进迁移）。也是服务端（Ktor/Spring）、跨平台（Kotlin Multiplatform）的可选语言。
- **Java 是 Kotlin 的前身**：Java 自 1995 年起是 Android 与企业服务端的主力语言近 30 年，语法繁琐（样板多）、空安全弱（裸 null 易 NPE）、缺乏现代特性。Kotlin 设计目标就是「**写起来像现代语言，跑起来与 Java 无缝**」——用空安全、简洁语法、协程修正 Java 的痛点，**Java 不独立立叶**，仅作为旧 Android 语言与服务端经典语言在对比中提及。
- **三大支柱**：①**空安全**——`T`（永不为空）与 `T?`（可空）类型二分，编译期强制处理（与 Swift Optional 同源思想）；②**协程（coroutine）**——轻量级并发（一个线程跑十万协程），`suspend` 函数 + 结构化并发；③**互操作**——与 Java 100% 互通，老代码无需重写。
- **空安全**：`var x: String = "a"`（永不为 null），`var y: String? = null`（可空）。访问 `y` 必须先安全处理（`?.`/`?:`/`!!`）。调用 **Java 代码**时遇到「**平台类型** `T!`」——可空性未知，需手动用 `?`/`!!` 断言，否则仍可能 NPE。
- **协程（coroutine）**：`suspend fun fetch(): Data` 标记可挂起函数；`GlobalScope.launch { ... }` / `async { ... }` 启动；`runBlocking` 桥接到阻塞世界；`Dispatchers.Main/IO/Default` 选择线程；**结构化并发**——父协程取消会传播到所有子协程。`Flow` 是协程版的异步流（对照 RxJava 的 Observable / JS 的 Stream）。
- **Jetpack Compose**：Google 2019 年推出的**声明式 UI 框架**——`@Composable` 函数描述 UI，`remember` 缓存跨重组的值，`mutableStateOf` 创建可观察状态，状态变化触发重组。思想与 React/SwiftUI 高度相通（状态驱动、单向数据流、可组合）。
- **简洁特性**：`data class`（一行声明带 equals/hashCode/toString/copy 的模型）、`sealed class`（密封类，限定子类用于 when 穷尽匹配）、扩展函数（`fun String.shout() = this + "!"`，无继承加方法）、属性委托（`by lazy`/`by viewModels()`）、字符串模板（`"Hello $name"`）、`when` 表达式。
- **进阶顺序**：[语言精要](./guide-line/language-essentials)（空安全/协程/Compose/Java 互操作深入）→ [原生模块](./guide-line/native-modules)（RN Android 桥接）→ [参考](./reference)。

## 一、Kotlin 是什么：Java 的现代继任者

Kotlin 的诞生背景：Java 自 1995 年起统治 Android 与企业服务端，但 20+ 年的演进让它包袱沉重——**语法繁琐**（getter/setter/匿名类样板多）、**空安全弱**（`null` 是任何引用类型的合法值，运行时 NPE 是最常见的崩溃）、**缺乏现代特性**（无协程、无模式匹配、扩展机制弱）。JetBrains（IntelliJ IDEA 母公司）2010 年起设计 Kotlin，目标是「**像现代语言一样写起来舒服，跑在 JVM 上与 Java 无缝**」。

2017 年 Google 宣布 Kotlin 成为 Android 官方语言（与 Java 平级），2019 年起成为**首选**（新工程默认、官方示例首选）。如今：① Android 新代码事实标准是 Kotlin（Google 推 Compose 也只服务 Kotlin）；② 服务端可与 Spring/Ktor 共用；③ **Kotlin Multiplatform（KMP）** 让业务逻辑共享到 iOS/桌面/JS。

对前端/JS 开发者，Kotlin 最值得学：① **空安全设计**（与 Swift 同源，对照能加深理解）；② **协程的异步模型**（与 async/await、Promise 思想相通，但更结构化）；③ **Compose 的声明式 UI**（与 React 同源，Android 端的最佳实践）。

## 二、空安全：`T` 与 `T?` 二分

Kotlin 的空安全是类型系统层面的——把「可空」做成类型的一部分：

```kotlin
var a: String = "hello"      // 永不为 null（赋 null 编译错误）
var b: String? = null        // 可空类型 String?

// ❌ 编译错误：可空类型不能直接当非空用
// println(b.length)

// ✅ 安全调用工具箱
println(b?.length)           // 安全调用：b 为 null 时返回 null（输出 null）
println(b?.length ?: -1)     // Elvis 操作符：null 时用默认值 -1
println(b!!.length)          // 非空断言：b 为 null 时抛 NPE（危险，确信非空才用）
val n: Int? = b?.length      // 类型是 Int?
val list: List<String?> = listOf("a", null)   // 集合元素可空
```

- **核心收益**：`null` 不再是「任何引用类型都能装的值」，而是**只有 `T?` 才能承载的状态**。函数签名 `fun find(id: Int): User?` 直接告诉调用者「可能找不到」，编译器强制处理。
- **平台类型陷阱**：调用 **Java 代码**时，Java 没有 `T?` 标注，Kotlin 无法判断可空性，类型成为**平台类型 `T!`**（如 `String!`）——Kotlin 允许你按非空用（`!!` 隐式断言），但 Java 那边可能返回 null，**运行时仍会 NPE**。这是 Kotlin 空安全最大的边界。
- **与 Swift 的差异**：Swift 的 Optional 是运行时仍有表示的枚举；Kotlin 的 `T?` 在编译后仍是普通引用（运行时还是 null），只是编译期静态检查。所以 Kotlin 的空安全是「编译期保证 + 运行时失效（平台类型/反射/Java 互操作）」。

## 三、协程：轻量级并发

协程（coroutine）是 Kotlin 处理并发的核心机制——比线程轻量得多（一个线程可跑十万协程），用同步代码风格写异步逻辑。

```kotlin
import kotlinx.coroutines.*

// suspend 标记可挂起函数（不阻塞线程，挂起时让出执行权）
suspend fun fetchUser(id: Int): User {
    delay(1000)                    // 非阻塞等待（挂起）
    return User(id)
}

fun main() = runBlocking {          // 桥接协程与阻塞世界
    val job = launch {              // 启动新协程（不返回结果）
        val u = fetchUser(1)
        println(u)
    }
    val deferred = async {          // 启动并返回结果（Deferred<User>）
        fetchUser(2)
    }
    println(deferred.await())       // 等待结果
    job.cancel()                    // 取消
}
```

- **结构化并发**：协程在 `CoroutineScope` 内启动，**父作用域取消时所有子协程自动取消**——避免协程泄漏（对比 JS 的 Promise 没有作用域概念，易悬挂）。
- **调度器（Dispatchers）**：`Main`（UI 线程，Android 用）、`IO`（IO 密集，如网络/磁盘）、`Default`（CPU 密集，如排序）、`Unconfined`（不限制）。用 `withContext(Dispatchers.IO) { ... }` 切换线程。
- **Flow**：协程版的异步流——`flow { emit(1); emit(2) }`，支持背压、取消、操作符（map/filter）。是 RxJava 在协程世界的对应物，但更轻量、与协程深度整合。

## 四、Jetpack Compose：声明式 UI

Compose 是 Google 的声明式 UI 框架（2019），思想与 React/SwiftUI 高度相通：

```kotlin
import androidx.compose.runtime.*
import androidx.compose.material3.*
import androidx.compose.ui.*

@Composable
fun Counter() {
    var count by remember { mutableStateOf(0) }   // remember 缓存，mutableStateOf 可观察
    Column {
        Text("Count: $count")
        Button(onClick = { count++ }) {           // 修改状态 → 触发重组
            Text("加一")
        }
    }
}
```

- **核心概念**：`@Composable` 函数描述 UI（无返回值或返回 Unit），`remember` 缓存跨重组的值，`mutableStateOf` 创建可观察状态（修改触发重组）。状态是真相、UI 是状态的函数。
- **状态提升（state hoisting）**：把状态从子组件移到父组件，子组件变成无状态（受控）——与 React 的受控组件思想一致。模式：子组件接收 `value: T, onChange: (T) -> Unit`。
- **与 React/SwiftUI 对照**：`remember { mutableStateOf() }` ≈ `useState`、状态提升 ≈ 受控 props、`@Composable` ≈ 函数组件。Compose 用 Kotlin 编译器插件做重组追踪，比 React 的 reconciliation 更精细（按可观察状态订阅）。

## 五、简洁特性：data class、sealed class、扩展函数

Kotlin 用一批现代特性大幅减少样板代码：

- **data class**：一行声明带 equals/hashCode/toString/copy 的模型类——`data class User(val name: String, val age: Int)`，等价 Java 几十行。
- **sealed class**（密封类）：限定子类集合，配合 `when` 做**穷尽匹配**（编译器强制处理所有分支）——适合表达有限状态（UI 状态机、结果类型）。
- **扩展函数**：`fun String.shout() = this + "!"`，给现有类（包括 Java 的 String）加方法，无需继承。
- **属性委托**：`val x by lazy { compute() }`（懒加载）、`by viewModels()`（Android ViewModel 注入），把「如何存取」抽象出来。
- **字符串模板**：`"Hello $name, age ${age + 1}"`，比 Java 的字符串拼接优雅。
- **when 表达式**：强大的 switch，支持模式匹配、范围、多分支，是表达式（有返回值）。

## 下一步

理解了 Kotlin 的总览后，下一步深入语言核心——[语言精要](./guide-line/language-essentials)（空安全与平台类型、协程与 Flow、data/sealed class、Compose 状态四件套、Java 互操作陷阱），再进入[原生模块](./guide-line/native-modules)（React Native Android 桥接）。
