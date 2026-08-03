---
layout: doc
outline: [2, 3]
---

# Flutter 与异步：AOT/JIT、Future/Stream、Isolate

> 基于 Dart 3.x 与 Flutter 3.x（2026 主线） · 核于 2026-08

## 速查

- **AOT/JIT 双模式**：① **开发用 JIT**——Dart VM 即时编译 + Flutter 热重载（亚秒级反馈，改代码立即看效果）；② **发布用 AOT**——提前编译为原生机器码（iOS 用 LLVM、Android 直接编译），无 VM 开销，性能接近原生 App，启动快。这是 Flutter 性能优于 RN 的根本原因之一（JS 引擎难做高质量 AOT）。
- **热重载（Hot Reload）**：开发时按 `r` 注入新代码并重建 Widget 树，**保留 State**，亚秒级反馈；热重启（`R`）重置 State。是 Flutter 开发体验的核心优势。
- **`Future<T>` ≈ JS `Promise<T>`**：单值异步结果。`async` 函数返回 `Future`，`await` 等待。API 一一对应：`Future.wait` ≈ `Promise.all`、`Future.value` ≈ `Promise.resolve`、`Future.error` ≈ `Promise.reject`。
- **`Stream<T>` ≈ JS 异步迭代器 / RxJS Observable**：多值异步序列。`async*` 生成（`yield`），`await for` 消费。分**单订阅 Stream**（一个消费者，如 HTTP 响应）与**广播 Stream**（多消费者，如点击事件）。支持 `map`/`filter`/`transform` 等操作符。
- **`async`/`await` 与 JS 几乎一致**：`async` 标记，`await` 等待 Future，`try/catch` 捕获错误。差别：Dart 的 `async*` 生成 Stream。
- **Isolate**：Dart 的并发模型——无共享内存，靠 SendPort/ReceivePort 消息传递（类似 Actor）。主 Isolate 跑 UI，CPU 密集任务放 worker Isolate 避免卡顿。Dart 2.15+ 的 `Isolate.run` 简化了 API。
- **事件循环（Event Loop）**：Dart 单线程事件循环（与 JS 一样）——任务队列先进先出，async 任务通过 Future 排队。主 Isolate 跑事件循环 + UI 渲染。
- **Flutter Widget 的语言基础**：① Widget 是不可变描述（`build` 方法返回 Widget 树）；② `StatefulWidget` 用 `State` 持有可变状态，`setState` 触发重建；③ `BuildContext` 是 Widget 在树中的位置（用于查找祖先、主题、Navigator）；④ 一切皆 Widget（padding/alignment/gesture 都是 Widget）。

## 一、AOT/JIT 双模式：开发体验与性能兼得

Dart 独特的双编译模式是 Flutter 的核心优势：

```
开发流程（JIT）：                      发布流程（AOT）：
┌─────────────────┐                  ┌─────────────────┐
│ flutter run     │                  │ flutter build   │
│   ↓             │                  │   ↓             │
│ Dart VM + JIT   │                  │ AOT 编译器      │
│   ↓             │                  │   ↓             │
│ 启动应用        │                  │ 原生机器码      │
│   ↓             │                  │（iOS: LLVM,     │
│ 改 .dart 文件   │                  │ Android: 直接）│
│   ↓ 按 r        │                  │   ↓             │
│ 热重载（亚秒级）│                  │ 打包成 .ipa/.apk│
│ 保留 State      │                  │ 启动快、性能高  │
└─────────────────┘                  └─────────────────┘
```

- **JIT + 热重载**：开发时 Dart 代码跑在 VM 上，VM 把字节码 JIT 编译为机器码执行。改 `.dart` 文件后按 `r`，框架把新代码注入运行中的 VM，重建 Widget 树，**保留 State**（如已输入的文本、滚动位置），亚秒级看到效果。这是 Flutter 开发体验远超 RN（仍需 JS 桥接 reload）的根本原因。
- **AOT 的性能**：发布时 Dart AOT 编译为原生机器码，运行时无 VM（只有精简的 Dart Runtime 处理 GC 等），性能接近 Swift/Kotlin 原生 App。这也是 Flutter 能做到 120fps 流畅动画、启动快的基础。
- **为何 JS 难做高质量 AOT**：JS 是动态类型（运行时才知道变量类型），JIT 优化靠运行时收集类型信息；AOT 时类型不确定，只能保守编译或加运行时检查。Hermes 引擎的「AOT」实际是预编译字节码（仍需解释），性能不及 Dart 的纯机器码 AOT。React Native 因此用 JS 桥接（新架构 JSI 已大幅改善但仍不及 Dart AOT）。

## 二、Future：单值异步

`Future<T>` 是 Dart 的异步单值，与 JS Promise 几乎一一对应：

```dart
// 声明异步函数（async 返回 Future）
Future<String> fetchUser(int id) async {
  await Future.delayed(Duration(seconds: 1));   // 非阻塞等待
  if (id < 0) {
    throw ArgumentError('id 不能为负');          // 抛错
  }
  return 'User $id';
}

// 调用与等待
Future<void> main() async {
  try {
    var user = await fetchUser(1);              // 等待结果
    print(user);
  } catch (e) {
    print('出错：$e');
  }
}

// 并发等待多个
Future<List<String>> fetchAll() async {
  var results = await Future.wait([             // ≈ Promise.all
    fetchUser(1),
    fetchUser(2),
    fetchUser(3),
  ]);
  return results;
}

// 错误处理的其他写法
var user = await fetchUser(1)
    .catchError((e) => 'fallback');             // catch 转换
var user2 = await fetchUser(1)
    .then((u) => '$u!');                        // then 转换（少用，await 更线性）
```

- **API 对照表**：

| Dart | JS Promise |
| --- | --- |
| `Future<T>` | `Promise<T>` |
| `Future.value(x)` | `Promise.resolve(x)` |
| `Future.error(e)` | `Promise.reject(e)` |
| `Future.wait([...])` | `Promise.all([...])` |
| `Future.any([...])` | `Promise.any([...])` |
| `Future.delayed(d, () => x)` | `new Promise(r => setTimeout(() => r(x), d))` |
| `.then`/`.catchError` | `.then`/`.catch` |
| `async`/`await` | `async`/`await` |

- **风格建议**：优先用 `async`/`await`（线性可读），少用 `.then`/`.catchError` 链式（与 JS 一样，链式嵌套易混乱）。
- **错误传播**：`async` 函数中抛错会自动转成 Future 的错误，调用方用 `try/catch` 或 `.catchError` 接——与 JS 的 async/await 完全一致。

## 三、Stream：多值异步序列

`Stream<T>` 是 Dart 的异步序列，对应 JS 的异步迭代器 / RxJS 的 Observable：

```dart
// 生成 Stream（async* + yield）
Stream<int> counter() async* {
  for (var i = 0; i < 3; i++) {
    await Future.delayed(Duration(seconds: 1));
    yield i;                                    // 生产值
  }
}

// 消费（await for）
Future<void> main() async {
  await for (var i in counter()) {
    print(i);                                   // 0, 1, 2（每秒一个）
  }
}

// 操作符（类似 RxJS）
counter()
  .map((i) => i * 2)                            // 转换
  .where((i) => i > 0)                          // 过滤
  .listen((i) {                                 // 订阅
    print('收到：$i');
  }, onDone: () {
    print('完成');
  });

// 广播 Stream（多消费者）
final controller = StreamController<int>.broadcast();
controller.stream.listen((x) => print('A: $x'));
controller.stream.listen((x) => print('B: $x'));
controller.add(1);                              // A: 1, B: 1
```

- **单订阅 vs 广播 Stream**：① **单订阅 Stream**（默认）——只能有一个消费者，常用于「一次性序列」（HTTP 响应、文件读取）；② **广播 Stream**（`.asBroadcastStream()` 或 `StreamController.broadcast()`）——多消费者共享，常用于「持续事件」（点击、传感器数据）。
- **`async*` 生成器**：`Stream<T> fn() async*` 用 `yield`/`yield*` 生产值，与 JS 的 `async function*` + `yield` 几乎一致。
- **背压**：默认 Stream 是单缓冲——消费者慢时生产者会等待（`yield` 阻塞）。可用 `sync: true` 或自定义策略调整。
- **`listen` 的回调**：`onData`（收到值）、`onError`（出错）、`onDone`（完成）、`cancelOnError`（出错即取消订阅）。返回 `StreamSubscription` 可用于 `.cancel()`/`.pause()`/`.resume()`。
- **Flutter 中的 Stream**：`StreamBuilder` Widget 根据 Stream 自动重建 UI（类似 React 的 useStream）。状态管理库（如 BLoC/RxDart）大量用 Stream。

## 四、Isolate：无共享内存并发

Dart 是单线程事件循环（与 JS 一样），CPU 密集任务会阻塞 UI。Isolate 解决并发：

```dart
import 'dart:isolate';

// 简单 API（Dart 2.15+）：Isolate.run
Future<int> heavyCompute() async {
  final result = await Isolate.run(() {
    // 在 worker Isolate 中执行
    var sum = 0;
    for (var i = 0; i < 1000000000; i++) sum += i;
    return sum;                                 // 自动通过消息传回
  });
  return result;
}

// 低级 API：SendPort/ReceivePort 双向通信
void worker(SendPort mainPort) {
  final workerPort = ReceivePort();
  mainPort.send(workerPort.sendPort);           // 把 worker 的端口发回
  workerPort.listen((msg) {
    mainPort.send('echo: $msg');
  });
}

Future<void> main() async {
  final mainPort = ReceivePort();
  await Isolate.spawn(worker, mainPort.sendPort);
  final workerPort = await mainPort.first as SendPort;
  // ... 通过 workerPort 发消息
}
```

- **为何 Isolate 不共享内存**：避免锁与竞态条件。代价是数据需序列化拷贝（基本类型/集合/对象自动序列化，函数/闭包不能直接传）。
- **何时用 Isolate**：① CPU 密集（大数组排序、JSON 大文件解析、加密、图像处理）；② 避免阻塞主 Isolate 导致 UI 卡顿（Flutter UI 在主 Isolate 渲染）。简单场景优先 `Isolate.run`（Dart 2.15+），复杂的双向通信用 SendPort/ReceivePort。
- **`compute` 函数（Flutter 封装）**：Flutter 提供 `compute(fn, arg)` 简化 Isolate 调用，背后是 `Isolate.run` 的便利封装。

## 五、Flutter Widget 的语言基础

理解 Flutter 必须先理解它的语言基础——一切皆 Widget，状态驱动重建：

```dart
import 'package:flutter/material.dart';

// StatelessWidget：不可变，build 描述 UI
class Greeting extends StatelessWidget {
  final String name;
  const Greeting({super.key, required this.name});   // const 构造（性能）

  @override
  Widget build(BuildContext context) {                // context 是树中位置
    return Text('Hello $name');
  }
}

// StatefulWidget：用 State 持有可变状态
class Counter extends StatefulWidget {
  const Counter({super.key});
  @override
  State<Counter> createState() => _CounterState();
}

class _CounterState extends State<Counter> {
  int count = 0;                                      // 可变状态

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text('Count: $count'),
        ElevatedButton(
          onPressed: () {
            setState(() {                             // 触发重建
              count++;
            });
          },
          child: const Text('加一'),
        ),
      ],
    );
  }
}
```

- **Widget 是不可变描述**：`Widget`（`StatelessWidget`/`StatefulWidget`）只是「给定数据，UI 长什么样」的不可变配置（const 构造）。框架对比新旧 Widget 树决定是否重建 Element（实际渲染对象）。
- **`build(BuildContext context)`**：`context` 是 Widget 在树中的位置句柄——用于查找祖先（`Theme.of(context)`）、导航（`Navigator.of(context).push`）、`MediaQuery`（屏幕尺寸）等。这是 Flutter 的「依赖注入」机制。
- **`setState` 触发重建**：`StatefulWidget` 的 `State` 持有可变状态，`setState(() { ... })` 通知框架状态变了，框架重新调用 `build` 重建子树。**只在 setState 内修改状态**才能触发重建。
- **const Widget 的性能意义**：能用 `const` 的 Widget 必须用——框架识别到 `const Widget` 相同实例就跳过重建（`const Text('hi')` 在多处引用同一实例），是性能优化关键。
- **与 React 的对照**：`StatelessWidget` ≈ 函数组件、`StatefulWidget` ≈ class 组件、`setState` ≈ `setState`、`build` ≈ `render`、`BuildContext` ≈ context（但 Flutter 的 context 是位置句柄，更强）。思想高度相通（声明式、状态驱动、可组合）。

## 六、Flutter 生态与状态管理

Dart 的异步与 Stream 是 Flutter 状态管理的基础：

- **setState**：最简单的状态，适合局部 UI。
- **InheritedWidget / InheritedNotifier**：Flutter 原生的「向后代广播」机制（如 Theme/MediaQuery），是 Provider 的底层。
- **Provider / Riverpod**：基于 InheritedWidget 的依赖注入与状态管理，是 Flutter 社区主流。
- **BLoC / Cubit**：用 Stream 驱动状态（事件 → 状态），适合复杂状态机，与 RxJS 思想相通。
- **GetX / MobX**：响应式状态，类似 Vue 的响应式。

## 下一步

掌握了 Flutter 的语言基础后，可深入 Flutter 框架本身——（本站移动端框架章的 Flutter 叶详述 Widget 体系/路由/动画）。最后回[参考](../reference)速查类型系统、异步 API 与易错点。
