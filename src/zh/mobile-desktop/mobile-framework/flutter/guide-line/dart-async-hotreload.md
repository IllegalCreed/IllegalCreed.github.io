---
layout: doc
outline: [2, 3]
---

# Dart 编译、异步与热重载

> 基于 Flutter 3.44 · 核于 2026-07

## 速查

- **JIT vs AOT**：**开发（debug）用 JIT**（Dart VM 运行时编译 → 支持 **Hot Reload**、断言、调试）；**发布（release/profile）用 AOT**（提前编成原生 ARM/x64 机器码 → 快启动、小体积、无解释层）
- **三种构建模式**：**Debug**（JIT，`flutter run`，可 Hot Reload）／ **Profile**（AOT，`--profile`，真机性能分析）／ **Release**（AOT，`--release`/`build`，上线最优）；**模拟器只跑 debug**
- **sound null safety**：Dart 3 起**强制**；`int` 非空、`int?` 可空、`!` 断言非空、`late` 延迟初始化、`required` 命名参数、`??` 空合并、`?.` 空安全调用、`!= null` 后类型提升
- **Future**：单个异步值（≈ JS Promise），`async`/`await` 消费
- **Stream**：异步事件序列，`async*` + `yield` 产生、`await for` 消费，UI 里用 `StreamBuilder`
- **单线程事件循环**：`async/await` **不开线程**、只让出事件循环；**CPU 密集仍会卡 UI → 用 isolate**
- **isolate ≠ 线程**：各自**独立内存**、不共享状态、**只靠消息传递**（Actor 模型）；`Isolate.run(fn)` 一次性重计算，`compute(fn, msg)` 是 Flutter 封装（**Web 无 isolate → 退回主线程**），`Isolate.spawn` 长期存活
- **Hot Reload vs Restart**：**Hot Reload** 注入改动、重建 Widget 树、**保留状态**、最快（仅 debug/JIT）；**Hot Restart** 重跑 `main()`/`initState()`、**丢状态**；**Full Restart** 才重编原生代码
- **Hot Reload 失效**：改 `main`/`initState`、全局/静态字段初始化器、enum↔class 互转、泛型签名增删、原生代码 → 需 Restart

## 一、JIT 与 AOT 双编译

Dart 最独特的能力是**同一份代码可以两种方式编译**，Flutter 借此在「开发体验」与「运行性能」之间两头兼得：

- **开发（debug）用 JIT**（Just-In-Time）：Dart VM 在运行时编译代码，因此能**热重载**、支持断言与丰富调试。
- **发布（release / profile）用 AOT**（Ahead-Of-Time）：提前把 Dart 编译成**原生 ARM / x64 机器码**，启动快、执行快、体积小、没有解释层开销。

Web 端类似：开发用 `dartdevc`（增量、可调试），生产用 `dart2js`（压缩 + tree-shaking）或编译到 **WebAssembly**（`--wasm`，见 [渲染引擎：Skia 到 Impeller](./rendering-impeller) 的 Web 渲染器一节）。

## 二、三种构建模式

JIT/AOT 直接对应三种构建模式：

| | Debug | Profile | Release |
| --- | --- | --- | --- |
| 编译 | **JIT** | **AOT** | **AOT** |
| Hot Reload | ✅ | ❌ | ❌ |
| 断言 assertions | ✅ | ❌ | ❌ |
| DevTools / Service Extensions | ✅ | ⚠️ 部分（性能相关） | ❌ |
| 调试 | ✅ | 有限（可 profile） | ❌（信息剥离） |
| 性能 / 体积 | 慢 / 大 | 优化 | 最优 / 最小 |
| 用途 | 开发（`flutter run`） | 真机性能分析（`--profile`） | 上线（`--release`、`build apk/ipa/web`） |

> **模拟器 / 仿真器只能跑 debug**；profile / release 需要真机。

## 三、Sound Null Safety

Dart 2.12 引入、**Dart 3.0 起强制** sound null safety——「sound」意味着编译器能**保证**一个非空类型的变量永远不会是 null：

```dart
int  x = 5;      // 非空
int? y;          // 可空（默认 null）
y!.isEven;       // ! 断言非空（若为 null 抛异常）
late int z;      // late：延迟初始化，用前必须已赋值
if (y != null) y.isEven;              // 类型提升（promotion）：这里 y 被当作非空
final a = y ?? 0;                      // ?? 空合并
obj?.method();                         // ?. 空安全调用
String greet(String name, {required int age}) => '$name $age'; // required 命名参数
```

其它现代特性（都用单引号写字面量）：`var`（推断）/ `final`（运行期常量）/ `const`（编译期常量）/ `dynamic`（关类型检查）；**Records** `(int, String) pair = (1, 'a');`、**Patterns / 解构** `final (a, b) = pair;`、**sealed classes**（穷尽 switch）、`mixin`（`with` 复用）、extension methods、enhanced enum。

## 四、异步：Future 与 Stream

- **`Future`** = 单个异步值（类比 JS Promise），用 `async` / `await` 消费。
- **`Stream`** = 异步事件序列，用 `async*` + `yield` 产生，用 `await for` 消费；在 UI 里用 `StreamBuilder`（单值用 `FutureBuilder`）。

```dart
Future<void> fetch() async {
  final data = await Future.delayed(const Duration(seconds: 1), () => 'ok');
  print(data);
}

Stream<int> counter() async* {   // async* + yield 产生流
  for (var i = 0; i < 3; i++) yield i;
}

await for (final v in counter()) print(v); // 消费流
```

**关键机制**：Dart 是**单线程事件循环**，`async/await` **不会开新线程**——它只是把控制权让回事件循环，等异步结果就绪再继续。所以 `await` 一段 I/O 不卡 UI，但**一段 CPU 密集计算（如解析大 JSON、图像处理）仍会卡住 UI**，因为它占着唯一的主 isolate。

## 五、并发：isolate

要真正并行、避免 CPU 密集卡 UI，就得用 **isolate**：

- **模型**：默认只有一个 `main isolate`，用一个事件队列顺序处理手势、回调、每帧渲染（~16ms/60Hz）。单次计算超过 16ms 就会 **jank**。
- **isolate ≠ 线程**：每个 isolate 有**独立内存**，**不共享状态**，**只靠消息传递**（Actor 模型）；消息会被**拷贝**（不可变对象如 String 按引用传，`Isolate.exit()` 可转移所有权）。

| API | 用途 |
| --- | --- |
| **`Isolate.run(fn)`** | 一次性重计算，跑完自动退出（最常用） |
| **`compute(fn, msg)`** | Flutter 便捷封装；移动/桌面 ≈ `Isolate.run`，**Web 无 isolate → 退回主线程跑** |
| **`Isolate.spawn` + `ReceivePort`/`SendPort`** | 长期存活、多次收发 |

```dart
Future<List<Photo>> parse(String jsonStr) =>
    Isolate.run(() => (jsonDecode(jsonStr) as List)
        .cast<Map<String, Object?>>()
        .map(Photo.fromJson)
        .toList());
```

限制：**Web 不支持 isolate**；spawned isolate 不能直接访问 `rootBundle` / `dart:ui`；用插件需先 `BackgroundIsolateBinaryMessenger.ensureInitialized(token)`。决策口诀：**卡 UI 吗？否 → 留主 isolate；是 → 一次性用 `Isolate.run`/`compute`，长期用 `Isolate.spawn`。**

## 六、Hot Reload vs Hot Restart

Flutter 的开发体验核心是 **Hot Reload**——改完代码存盘，约 1 秒内看到效果**且保留 App 状态**：

| | Hot Reload | Hot Restart | Full Restart |
| --- | --- | --- | --- |
| 速度 | 最快（~1s 内） | 较慢 | 最慢 |
| **状态保留** | **✅ 保留** | ❌ 丢失 | ❌ 丢失 |
| 重跑 `main()` / `initState()` | ❌ 否 | ✅ 是 | ✅ 是 |
| 重编原生代码 | 否 | 否 | ✅ 是 |

**Hot Reload** 把改动源码注入运行中的 Dart VM（不重启进程），重建 Widget 树，因此登录态、导航栈、计数器等**状态都保留**。它**只在 debug（JIT）模式可用**。

**Hot Reload 失效、需要 Restart 的高频场景**：

1. 改 **`main()` / `initState()`**（它们不会重跑）→ 需 Hot Restart。
2. **全局变量 / 静态字段初始化器**（只初始化一次，不会重跑）；`const` 字段会被重新求值 → 可用 `const` 或 getter 规避。
3. **enum ↔ class 互转**、**泛型类型参数增删**（如 `A<T>` → `A<T, V>`）→ 需 Hot Restart。
4. 改**原生代码**（Kotlin/Java/Swift/ObjC）→ 需 Full Restart。
5. 编译错误、App 被杀 / 长时间后台等。

**Hot Restart** 重载代码并重启 App（丢状态、重跑 `main`/`initState`），比全量重启快；**Full Restart** 才会重新编译原生部分。

---

想理解重建的是哪一棵树、状态存在哪，回看 [Dart 与 Widget：三棵树与生命周期](./dart-widgets) 与 [状态管理](./state-management)；渲染管线与 JIT/AOT 如何协作出帧，见 [渲染引擎：Skia 到 Impeller](./rendering-impeller)。
