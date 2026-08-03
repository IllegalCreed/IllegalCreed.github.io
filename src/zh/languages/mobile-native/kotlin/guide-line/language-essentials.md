---
layout: doc
outline: [2, 3]
---

# 语言精要：空安全、协程、Compose 与 Java 互操作

> 基于 Kotlin 2.x（2026 主线） · 核于 2026-08

## 速查

- **空安全二分**：`T`（永不为 null）与 `T?`（可空）。安全工具箱：`?.`（安全调用）、`?:`（Elvis 默认）、`!!`（非空断言，null 抛 NPE）、`as?`（安全转型）。`let`/`run`/`also`/`takeIf` 配合 `?.` 做链式处理。
- **平台类型 `T!`**：调用 **Java 代码**时类型可空性未知（如 `String!`），Kotlin 允许按非空用但运行时仍可能 null → **NPE 高发区**。解法：Java 返回值显式用 `T?` 接收并断言，或为库加 `@Nullable`/`@NotNull` 注解（Kotlin 能识别 JSR-305 注解）。
- **协程（coroutine）**：`suspend fun` 标记可挂起函数；`launch`（启动不返回）、`async`（启动返回 Deferred）；`CoroutineScope` 管理生命周期；**结构化并发**——父取消传播到子。
- **调度器（Dispatchers）**：`Main`（UI）、`IO`（网络/磁盘）、`Default`（CPU 密集）、`Unconfined`。`withContext(Dispatchers.IO) { ... }` 切换。
- **Flow**：协程版的冷流（cold flow），`flow { emit(x) }` 生产，`.collect { }` 消费；支持 `map`/`filter`/`flatMapLatest`/背压/取消。`StateFlow`/`SharedFlow` 是热流（多订阅者共享）。
- **结构化并发核心**：协程在 `coroutineScope { }`/`supervisorScope { }` 内启动；父异常默认取消所有子（普通 scope），`supervisorScope` 让子异常不互相影响。
- **data class**：自动生成 equals/hashCode/toString/copy/componentN（解构），适合模型。限制：可继承其他类但不能被继承（除非 open）。
- **sealed class/interface**：限定子类（同文件/同包/同模块），配合 `when` 穷尽匹配——编译器强制处理所有分支。
- **扩展函数/属性**：`fun Receiver.xxx()` 给现有类加方法，静态解析（非虚函数），无运行时开销。
- **Compose 状态四件套**：`remember`（缓存跨重组）、`mutableStateOf`（可观察状态）、`derivedStateOf`（派生状态）、`snapshotFlow`（状态转 Flow）。状态提升：子组件 `value + onChange` 受控。

## 一、空安全与平台类型

Kotlin 的空安全在编译期消灭一整类 NPE，但调用 Java 代码时存在边界。

```kotlin
var a: String = "hello"
// a = null                    // ❌ 编译错误：非空类型不能赋 null

var b: String? = null
// println(b.length)           // ❌ 编译错误：可空类型需先处理

// 安全工具箱
println(b?.length)             // null（安全调用）
println(b?.length ?: -1)       // -1（Elvis，null 时默认）
println(b?.let { it.length } ?: 0)   // 0（let 配合 ?.）

val list: List<String?> = listOf("a", null, "b")
list.filterNotNull()           // [a, b]（去 null）

val s: String = b as String    // ClassCastException（b 为 null）
val s2: String? = b as? String // null（安全转型）
```

### 平台类型：Java 互操作的 NPE 风险

```kotlin
// Java 代码：public String getName() { return null; }
val name: String = javaObj.name    // 编译通过！name 类型推断为 String!（平台类型）
println(name.length)               // 💥 运行时 NPE（Java 那边返回了 null）

// 正确写法：显式按可空接收
val name: String? = javaObj.name   // String?，编译器强制处理
println(name?.length)              // 安全
```

- **平台类型本质**：Java 没有 `T?` 标注，Kotlin 无法判断可空性，类型显示为 `String!`（感叹号表示「未知」）。Kotlin 允许你把它当 `String` 或 `String?` 用——当非空用时就隐式 `!!`，运行时若为 null 仍 NPE。
- **避免方法**：① Java 返回值**显式用 `T?` 接收**并处理；② 给 Java 库加 **JSR-305 注解**（`@Nullable`/`@NotNull`），Kotlin 能识别并推断可空性；③ 跨语言 API 边界用 Kotlin 重写或加包装层。
- **`!!` 的使用场景**：仅在你**确信非空**（如已用 `requireNotNull` 校验、或业务逻辑保证）时用，否则宁可 `?:` 给默认值或 `?.` 安全跳过。

## 二、协程与结构化并发

协程是 Kotlin 异步编程的核心，理解 `suspend`、scope、调度器是关键。

```kotlin
import kotlinx.coroutines.*

suspend fun fetchUser(id: Int): User {     // suspend：可挂起，不阻塞线程
    delay(1000)                            // 挂起（非 Thread.sleep）
    return User(id)
}

fun main() = runBlocking {                 // 启动顶层协程（阻塞主线程等待）
    coroutineScope {                       // 结构化并发作用域
        launch {                           // 启动子协程（fire-and-forget）
            val u = fetchUser(1)
            println(u)
        }
        val u2 = async { fetchUser(2) }    // 启动并返回 Deferred
        println(u2.await())                // 等待结果
    }                                      // 作用域结束前会等所有子协程完成
}

// 异常与取消
suspend fun work() {
    withContext(Dispatchers.IO) {          // 切到 IO 线程
        Thread.sleep(100)                  // 阻塞调用要切 IO
    }
}
```

- **结构化并发**：在 `coroutineScope { }` 内启动的协程都是该 scope 的子协程，**scope 不结束直到所有子完成**；scope 取消时所有子**自动取消**。这避免了协程泄漏（对比 JS 的 Promise 没有作用域，悬挂回调难以管理）。
- **普通 scope vs supervisor scope**：`coroutineScope` 内任一子异常会取消所有兄弟；`supervisorScope` 让子异常互不影响（适合多个独立任务）。
- **调度器选择**：`Main`（Android UI 线程，更新 UI 必须在此）、`IO`（网络/数据库/文件，IO 密集）、`Default`（排序/解析等 CPU 密集）、`Unconfined`（不切，少用）。`withContext` 切换并保留原 scope。
- **取消协作性**：协程取消是协作式的——`suspend` 函数（如 `delay`/网络库）会检查取消并抛 `CancellationException`，但**纯 CPU 计算**需手动 `ensureActive()` 或 `yield()` 检查。

### Flow：协程版的异步流

```kotlin
import kotlinx.coroutines.flow.*

fun users(): Flow<User> = flow {
    for (i in 1..3) {
        delay(500)
        emit(User(i))                   // 生产
    }
}

suspend fun main() {
    users()
        .map { it.name }
        .filter { it.isNotEmpty() }
        .collect { println(it) }        // 消费（终端操作）
}

// 热流：StateFlow（状态）/ SharedFlow（事件），多订阅者共享
val state = MutableStateFlow(0)         // 类似 MutableLiveData，UI 状态首选
val events = MutableSharedFlow<Event>() // 事件总线
```

- **冷流 vs 热流**：`Flow` 是冷流（每个 collect 触发一次生产，无订阅者不生产）；`StateFlow`/`SharedFlow` 是热流（始终有值，多订阅者共享同一份）。
- **背压**：Flow 用协程的挂起天然支持背压——消费者慢时生产者自动等待（emit 是 suspend）。
- **与 RxJava/JS 对照**：Flow ≈ Observable（冷）/ StateFlow ≈ BehaviorSubject（热）/ SharedFlow ≈ Subject。与 JS 的 async iterator/Stream 思想相通。

## 三、data class 与 sealed class

```kotlin
// data class：一行声明带 equals/hashCode/toString/copy/解构的模型
data class User(val name: String, val age: Int)

val u1 = User("A", 20)
val u2 = u1.copy(age = 21)            // 浅拷贝并改字段
val (name, age) = u1                  // 解构（componentN）
println(u1 == u2.copy(age = 20))      // true（结构相等，非引用相等）

// sealed class：限定子类，配合 when 穷尽匹配
sealed interface UiState {
    object Loading : UiState
    data class Success(val data: List<Item>) : UiState
    data class Error(val msg: String) : UiState
}

fun render(state: UiState) = when (state) {
    is UiState.Loading -> "加载中"      // 智能转型：state 自动转 Loading
    is UiState.Success -> "成功：${state.data.size}"
    is UiState.Error -> "失败：${state.msg}"
    // 无需 else —— 编译器知道已穷尽，新增子类会编译报错提醒补分支
}
```

- **data class 限制**：① 不能 abstract/open/sealed/inner（Kotlin 1.1+ 可继承其他类）；② 主构造必须至少 1 个 val/var 参数；③ 自动生成的 equals 比较主构造属性。
- **sealed 的价值**：限定子类集合让编译器能**穷尽检查**——when 表达式覆盖所有分支时无需 else，**新增子类时编译器报错**提醒补全（重构安全）。这是替代 Java 枚举+继承的优雅方案，适合 UI 状态机、Result 类型、AST 节点。

## 四、扩展函数与属性

```kotlin
// 给 String 加方法（无继承）
fun String.shout(): String = this.uppercase() + "!"
println("hi".shout())                    // HI!

// 扩展属性
val String.halfLength: Int get() = length / 2

// 标准库的扩展：let/run/also/apply/takeIf
val len = "hi"?.let { it.length } ?: 0   // let：作用域函数
val cfg = Config().apply { timeout = 30 } // apply：配置对象
```

- **静态解析**：扩展函数在编译期按**声明类型**绑定（不是运行时按实际类型），所以不是虚函数——子类实例调用扩展函数仍走父类版本（除非用成员函数覆盖）。
- **可空接收者**：`fun String?.orDefault() = this ?: ""`，扩展可空类型，常用于 null 安全工具。
- **标准库的作用域函数**：`let`（转换/作用域）、`run`（执行并返回）、`apply`（配置对象）、`also`（副作用链）、`with`（多次调用同一对象）。区别主要在返回值与 this/it。

## 五、Jetpack Compose 状态四件套

```kotlin
import androidx.compose.runtime.*

@Composable
fun Counter() {
    // remember：跨重组缓存；mutableStateOf：可观察状态（修改触发重组）
    var count by remember { mutableStateOf(0) }
    Button(onClick = { count++ }) { Text("$count") }
}

// 状态提升：子组件变无状态（受控）
@Composable
fun Counter(value: Int, onChange: (Int) -> Unit) {
    Button(onClick = { onChange(value + 1) }) { Text("$value") }
}
@Composable
fun Parent() {
    var count by remember { mutableStateOf(0) }
    Counter(value = count, onChange = { count = it })
}

// 派生状态：依赖其他状态自动重算
@Composable
fun List(items: List<Int>) {
    val sorted by remember { derivedStateOf { items.sortedDescending() } }
}

// 状态转 Flow（与协程整合）
@Composable
fun Search() {
    var query by remember { mutableStateOf("") }
    LaunchedEffect(Unit) {
        snapshotFlow { query }.debounce(300).collect { search(it) }
    }
}
```

- **remember 的作用**：Compose 重组时会重新调用 `@Composable` 函数，普通局部变量会重置；`remember` 把值缓存到「组合」（composition）中，跨重组保留。
- **`by` 委托**：`var x by remember { mutableStateOf(0) }` 让 `x` 像普通变量读写（委托给 mutableState），比 `val state = remember { mutableStateOf(0) }; state.value++` 优雅。
- **状态提升（hoisting）**：模式是 `value: T + onChange: (T) -> Unit`，让子组件无状态、可复用、可测试——与 React 受控组件完全一致。
- **副作用（Side-effect）**：`LaunchedEffect(key)`（key 变化时启动协程）、`DisposableEffect`（清理资源）、`rememberCoroutineScope`（在组合内拿 scope 启动协程）。
- **与 React/SwiftUI 对照**：`remember { mutableStateOf() }` ≈ `useState`、状态提升 ≈ 受控 props、`LaunchedEffect` ≈ `useEffect`、`derivedStateOf` ≈ `useMemo`。

## 六、Java 互操作的陷阱清单

Kotlin 与 Java 100% 互操作，但边界处仍有坑：

- **平台类型**：如前述，Java 返回值可空性未知，是 NPE 高发区——显式用 `T?` 接收或加注解。
- **原始类型数组**：Java 的 `int[]` 在 Kotlin 是 `IntArray`（不是 `Array<Int>`），需注意映射。
- **受检异常**：Java 的 checked exception 在 Kotlin 不强制处理（Kotlin 无受检异常），调用 Java 抛受检异常的代码可忽略或用 `@Throws` 标注。
- **泛型差异**：Java 泛型擦除 + 协变不安全（`List<String>` 可强转 `List<Object>`），Kotlin 用 `out`/`in` 声明型变（`List<out T>` 是只读协变）。
- **静态成员**：Java 类的静态方法在 Kotlin 用伴生对象访问（`JavaClass.staticMethod()` 或 `@JvmStatic` 注解让 Kotlin 伴生对象成员生成真正的静态方法）。
- **`void` vs `Unit`**：Java 的 void 返回在 Kotlin 是 Unit，多数情况透明，但反射/泛型边界需注意。

## 交互演示

本叶无专门可视化。Compose 的状态流建议在 Android Studio 的 Preview 功能中动手感受——修改 `mutableStateOf` 即看预览重组。

## 下一步

掌握了语言核心后，下一站是工程实战——[原生模块](./native-modules)：如何用 Kotlin 为 React Native Android 写原生模块、替代 Java、Gradle 集成全流程。
