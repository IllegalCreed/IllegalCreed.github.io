---
layout: doc
outline: [2, 3]
---

# 入门：Dart 定位、JS 友好语法、空安全与双编译

> 基于 Dart 3.x（2026 主线） · 核于 2026-08

## 速查

- **定位**：Google 2011 年发布、专为 **Flutter**（2017 发布的跨平台 UI 框架）设计的现代面向对象语言。是 Flutter 的**唯一官方语言**，一套代码跨 iOS/Android/Web/桌面/嵌入式。也支持服务端（Shelf/Dart Frog），但生态以 Flutter 为主。
- **JS/TS 友好语法**：刻意借鉴 JS——类 C 语法、`var`/`final`/`const` 变量、`Map`/`List` 字面量、箭头函数（`=>`）、可选命名参数、扩展运算符（`...`）、`async`/`await`。JS/TS 开发者 1-2 天即可上手，是所有「非 JS 跨平台语言」中迁移成本最低的。
- **健全空安全（Sound Null Safety）**：`T`（永不为 null）与 `T?`（可空）类型二分（Dart 2.12+ 引入），与 Swift/Kotlin 同源思想。关键是「健全」——**整个依赖图全空安全时编译器才保证**，无逃逸（一个未迁移的库会阻止 sound 模式）。编译期消灭一整类空引用崩溃。
- **AOT/JIT 双模式**：① **开发用 JIT（Just-In-Time）**——配合 VM 与 Flutter 热重载（Hot Reload），亚秒级反馈，改代码立即看到效果；② **发布用 AOT（Ahead-Of-Time）**——提前编译为原生机器码（iOS 用 LLVM、Android 也不例外），无解释器/VM 开销，性能接近原生 App，启动也快。
- **异步模型**：`Future<T>`（对应 JS Promise）、`Stream<T>`（对应 JS 异步迭代器/RxJS Observable）、`async`/`await`（与 JS 几乎一致）。`Isolate` 是 Dart 的并发模型——**无共享内存的消息传递**（类似 Actor 模型），区别于线程，避免锁与共享状态问题。
- **类 JS 的特性**：扩展运算符 `...`、`??`（空合）、`?.`（安全调用）、`cascade` 操作符（`..` 连续调用）、字符串插值（`'$name'` / `'${expr}'`）、集合 if/for（`[for (var x in list) x]`）。
- **与 JS 的关键差异**：① 一切皆对象（数字也是 `int`/`double` 对象，无原始类型）；② `==` 是结构相等（不需 JS 的 `===`）；③ 模块系统是 `pub`（统一，无 CommonJS/ESM 之分）；④ `final`（单次赋值）/`const`（编译时常量）二分；⑤ 没有原型链/`this` 动态绑定困惑。
- **进阶顺序**：[语法与类型](./guide-line/syntax-and-types)（与 JS/TS 对比/空安全）→ [Flutter 与异步](./guide-line/flutter-and-async)（AOT/JIT/Future/Stream）→ [参考](./reference)。

## 一、Dart 是什么：为 Flutter 而生的语言

Dart 的诞生有两个阶段：① **2011 年 Google 发布 Dart 1.0**——目标是「替代 JS 做浏览器端开发」（dart2js 编译到 JS），但浏览器厂商不买账，未能撼动 JS；② **2017 年 Flutter 发布**——Google 转向用 Dart 写跨平台 UI，一套代码跨 iOS/Android/Web/桌面，Dart 找到了真正的归宿。如今 Dart 几乎等同于「Flutter 的语言」，所有 Flutter 开发都用 Dart。

为什么 Flutter 选 Dart（而不是 JS/TS）？核心原因：① **AOT/JIT 双模式**——JS 引擎（V8/Hermes）只能 JIT 或解释，难做高质量 AOT（React Native 用 JS 桥接有性能损耗，Flutter 用 Dart 直接编译为原生机器码，性能接近原生）；② **健全空安全 + 强类型**——TS 类型只是开发期提示（运行时擦除），Dart 的类型在运行时仍有效（尤其在 AOT 模式下）；③ **布局友好的语法**——Dart 的命名参数 + cascade 操作符让 Flutter 的嵌套 Widget 树写起来比 JS 的对象字面量更清晰。

对前端/JS 开发者，Dart 是「**最像 JS 的非 JS 语言**」——学习曲线远低于 Swift/Kotlin/Rust，1-2 天可上手，且能直接进入 Flutter 跨平台开发，无需双平台分别学。

## 二、JS 友好语法：1-2 天上手

Dart 刻意借鉴 JS 的语法习惯，让前端开发者几乎无障碍迁移：

```dart
// 变量声明（与 JS 类似，但 final/const 语义更清晰）
var name = 'A';           // 类型推断为 String
final age = 20;           // 单次赋值（运行时确定）
const PI = 3.14;          // 编译时常量
String city = 'BJ';       // 显式类型

// 集合字面量（与 JS 几乎一致）
var list = [1, 2, 3];                 // List<int>（对应 JS Array）
var map = {'a': 1, 'b': 2};           // Map<String, int>（对应 JS Object/Map）
var set = {1, 2, 3};                  // Set<int>

// 箭头函数 + 扩展运算符
var doubled = list.map((x) => x * 2).toList();
var combined = [...list, 4, 5];       // 扩展运算符（与 JS 一致）

// 字符串插值（与 JS 模板字符串类似）
print('Hello $name, age ${age + 1}');

// async/await（与 JS 几乎一致）
Future<String> fetch() async {
  var data = await http.get('...');
  return data;
}
```

- **`var`/`final`/`const` 三档**：`var` 类型推断可变；`final` 单次赋值（运行时确定，如 `final x = DateTime.now()`）；`const` 编译时常量（深度不可变，`const list = [1,2,3]` 整个列表编译期固定）。JS 只有 `let`/`const`，Dart 多了 `final`（介于两者之间）。
- **命名参数**：Dart 的 `void fn({required String name, int age = 0})` 让函数调用 `fn(name: 'A', age: 20)` 清晰（类似 Python/OC），Flutter Widget 全用命名参数让嵌套树可读。
- **Cascade `..`**：`obj..method()..field = x` 连续调用同一对象的方法/属性，省去重复写对象名——Flutter 中配置 Widget 的利器。

## 三、健全空安全（Sound Null Safety）

Dart 2.12（2021）引入健全空安全，与 Swift/Kotlin 同源思想——把「可空」做成类型的一部分：

```dart
String a = 'hello';        // 非空类型，赋 null 编译错误
String? b = null;          // 可空类型 String?

// ❌ 编译错误：可空类型不能直接当非空用
// print(b.length);

// ✅ 安全工具箱
print(b?.length);          // 安全调用：b 为 null 时返回 null
print(b?.length ?? -1);    // 空合：null 时用默认 -1
print(b!.length);          // 非空断言：b 为 null 时抛异常（确信非空才用）
int? len = b?.length;      // 类型 Int?
```

- **「健全」（Sound）的含义**：编译器**只在整个依赖图全部空安全时**才保证无空引用崩溃——一个未迁移的库会阻止工程进入 sound 模式（强制 mix 模式）。这与 Kotlin 的「平台类型逃逸」、Swift 的「隐式解包」不同，Dart 最严格（要么全空安全，要么不保证）。
- **初始化要求**：非空类型字段必须在构造时初始化（或用 `late` 标记延迟初始化、`required` 命名参数强制传入）。
- **`late` 关键字**：声明「这个非空变量稍后初始化」（如 `late String x;` 后在 `init()` 中赋值），访问前未初始化会抛 `LateInitializationError`。适合「构造时无法确定、但使用前必填」的场景。

## 四、AOT/JIT 双模式

Dart 独特的双编译模式是 Flutter 体验与性能的关键：

| 模式 | 用途 | 机制 | 优势 |
| --- | --- | --- | --- |
| **JIT（即时编译）** | 开发 | Dart VM + JIT，配合 Flutter 热重载 | **亚秒级反馈**，改代码立即看效果，无需重编译 |
| **AOT（提前编译）** | 发布 | 提前编译为原生机器码（iOS/Android 各自工具链） | **性能接近原生**，无 VM/解释器开销，启动快 |

- **JIT + 热重载的工作流**：开发时 Flutter 跑在 Dart VM 上，你改 `.dart` 文件后按 `r`（热重载）或 `R`（热重启），框架注入新代码并重建 Widget 树，**亚秒级看到效果**——这是 Flutter 开发体验的核心优势（对比 RN 的 reload 仍需 JS 桥接）。
- **AOT 的性能**：发布时 Dart 编译为原生机器码（iOS 通过 LLVM、Android 直接编译），运行时无 GC 频繁暂停（Dart 用分代 GC，移动端优化好），性能接近 Swift/Kotlin 原生 App。这也是 Flutter 能做到「120fps 流畅动画」的基础。
- **JS 引擎做不到高质量 AOT**：V8/Hermes 等 JS 引擎主要 JIT 或解释，AOT（如 Hermes 的字节码）只是预编译字节码仍需解释，性能不及 Dart 的纯机器码 AOT——这是 Flutter 性能优于 RN 的根本原因之一。

## 五、异步模型：Future / Stream / async/await

Dart 的异步模型与 JS 高度一致：

```dart
// Future<T> —— 对应 JS Promise
Future<String> fetchUser(int id) async {
  await Future.delayed(Duration(seconds: 1));   // 非阻塞等待
  return 'User $id';
}

// 调用
void main() async {
  var user = await fetchUser(1);                // 与 JS await 几乎一致
  print(user);
}

// Stream<T> —— 对应 JS 异步迭代器/RxJS Observable
Stream<int> counter() async* {                  // async* 生成 Stream
  for (var i = 0; i < 3; i++) {
    await Future.delayed(Duration(seconds: 1));
    yield i;                                    // 生产值
  }
}

// 消费
await for (var i in counter()) {                // await for 消费 Stream
  print(i);                                     // 0, 1, 2
}
```

- **`Future<T>` ≈ JS `Promise<T>`**：单值异步结果，`async` 函数返回 `Future`，`await` 等待。API 几乎一一对应（`Future.all` ≈ `Promise.all`、`Future.value` ≈ `Promise.resolve`）。
- **`Stream<T>` ≈ JS 异步迭代器 / RxJS Observable**：多值异步序列，`async*` 生成（用 `yield`），`await for` 消费。分**单订阅 Stream**（只能一个消费者，如网络响应）和**广播 Stream**（多消费者，如点击事件）。
- **`async`/`await` 与 JS 几乎一致**：`async` 标记异步函数，`await` 等待 Future，错误用 `try/catch` 捕获。差别：Dart 的 `async*` 生成 Stream（JS 用 `async function*` + `yield` 类似）。

## 六、Isolate：无共享内存的并发

Dart 的并发模型是 **Isolate**——类似 Actor 模型，**每个 Isolate 有独立的内存堆**，Isolate 间不共享内存，靠**消息传递（SendPort/ReceivePort）**通信。

```dart
import 'dart:isolate';

void worker(SendPort sendPort) {
  sendPort.send('来自 worker 的问候');          // 发消息
}

void main() async {
  final receivePort = ReceivePort();
  await Isolate.spawn(worker, receivePort.sendPort);   // 启动 Isolate
  print(await receivePort.first);              // 收到消息
}
```

- **为何不用线程**：Dart 是单线程事件循环（与 JS 一样），多线程共享内存会引入锁与竞态。Isolate 用「不共享内存 + 消息传递」避免这些问题——但代价是数据需序列化拷贝（除非用 `IsolateNameServer` 或 Dart 2.15+ 的 `Isolate.run` 简化 API）。
- **何时用 Isolate**：CPU 密集任务（大数组排序、JSON 解析、加密）放 Isolate，避免阻塞主 Isolate 的 UI 线程（Flutter 的 UI 渲染在主 Isolate）。

## 下一步

理解了 Dart 的总览后，下一步深入语言核心——[语法与类型](./guide-line/syntax-and-types)（变量声明、类型系统、命名参数、空安全健全性、与 JS/TS 差异对照），再进入[Flutter 与异步](./guide-line/flutter-and-async)（AOT/JIT 双模式细节、Future/Stream/Isolate 实战）。
