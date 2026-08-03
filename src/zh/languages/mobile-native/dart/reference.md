---
layout: doc
outline: [2, 3]
---

# 参考：Dart 类型系统、异步 API 与易错点速查

> 基于 Dart 3.x（2026 主线） · 核于 2026-08

## 速查

- **变量声明三档**：`var`（推断可变）、`final`（单次赋值、运行时）、`const`（编译时常量、深度不可变）。
- **一切皆对象**：数字是 `int`/`double` 对象（无原始类型）；`Object` 是非空根，`Object?` 含 null；`dynamic` 关闭类型检查。
- **类型系统**：`num`（int/double 父）、`String`、`bool`（严格，无 truthy）、`List<T>`、`Map<K,V>`、`Set<T>`。
- **空安全**：`T`/`T?` 二分（健全，全依赖图）；工具 `?.`/`??`/`!`/`?[]`；`late`（延迟初始化）、`required`（强制命名参数）。
- **命名参数**：`{}` 包裹（默认可选），`required` 强制；位置参数 `[]`；默认值 `=`。
- **集合 if/for**：List/Map/Set 字面量内 `if (cond) x` / `for (var x in list) x`；扩展运算符 `...` / `...?`。
- **Cascade**：`obj..m()..f = x` 连续操作同一对象。
- **AOT/JIT 双模式**：开发 JIT + 热重载（亚秒级），发布 AOT（性能近原生）。
- **异步**：`Future<T>`（≈Promise）、`Stream<T>`（≈异步迭代器/Observable）、`async`/`await`（与 JS 一致）、`async*`/`yield`（生成 Stream）、`await for`（消费 Stream）。
- **Isolate**：无共享内存的消息传递并发；`Isolate.run`（2.15+ 简化）、`compute`（Flutter 封装）。
- **类**：单继承 + mixin（with）+ implements（所有类隐式接口）；构造简写 `User(this.name)`、命名构造、factory 工厂；增强 enum（2.17+）。

## 一、类型系统速查

| 类型 | 含义 | 对应 JS |
| --- | --- | --- |
| `int` / `double` | 整数 / 浮点（num 子类） | number |
| `num` | 数字父类（接受 int/double） | number |
| `String` | 字符串（单双引号等价） | string |
| `bool` | 严格布尔（无 truthy/falsy） | boolean |
| `List<T>` | 列表（有序、可重复） | Array |
| `Map<K,V>` | 映射（键值对） | Object / Map |
| `Set<T>` | 集合（无序、不重复） | Set |
| `Object` | 所有非空类型的根 | Object |
| `Object?` | 含 null 的根 | —— |
| `dynamic` | 关闭类型检查 | any（运行时） |
| `void` | 无返回值 | void |
| `Never` | 不可达（抛异常/无限循环） | never（TS） |

## 二、变量声明速查

| 声明 | 语义 | 何时用 |
| --- | --- | --- |
| `var x = ...` | 类型推断、可变 | 局部变量，类型明显 |
| `final x = ...` | 单次赋值、运行时确定 | 不变的运行时值（如 `DateTime.now()`） |
| `const x = ...` | 编译时常量、深度不可变 | 编译期已知的常量（Flutter const Widget） |
| `Type x = ...` | 显式类型 | 公共 API、需明确类型时 |
| `late Type x` | 延迟初始化非空 | 构造时无法确定、使用前必填 |
| `late final x = ...` | 懒加载（首次访问才计算） | 昂贵计算的缓存 |

## 三、空安全操作符速查

| 写法 | 含义 | null 行为 |
| --- | --- | --- |
| `T x` | 非空类型 | 赋 null 编译错误 |
| `T? x` | 可空类型 | 可承载 null |
| `a?.b` | 安全调用 | a 为 null 时返回 null |
| `a ?? default` | 空合 | null 时用 default |
| `a!` | 非空断言 | null 抛异常 |
| `a?[i]` | 安全索引 | a 为 null 时返回 null |
| `late T x` | 延迟初始化 | 访问前未初始化抛 LateInitializationError |
| `required T x` | 命名参数强制传入 | 调用方必传 |

## 四、异步 API 速查

### Future（单值，≈Promise）

| API | 含义 | JS 对应 |
| --- | --- | --- |
| `Future<T>` | 异步结果类型 | `Promise<T>` |
| `Future.value(x)` | 已完成的 Future | `Promise.resolve(x)` |
| `Future.error(e)` | 已出错的 Future | `Promise.reject(e)` |
| `Future.wait([...])` | 等所有完成 | `Promise.all` |
| `Future.any([...])` | 任一完成 | `Promise.any` |
| `Future.delayed(d, fn)` | 延迟后执行 | `setTimeout` + resolve |
| `.then(fn)` / `.catchError(fn)` | 链式 | `.then` / `.catch` |
| `async` / `await` | 异步函数 | `async` / `await` |

### Stream（多值，≈异步迭代器/Observable）

| API | 含义 |
| --- | --- |
| `Stream<T> fn() async*` | 生成 Stream（用 yield） |
| `yield x` / `yield* other` | 生产值 / 展开另一 Stream |
| `await for (var x in stream)` | 消费 Stream |
| `.listen(onData)` | 订阅（返回 StreamSubscription） |
| `.map` / `.where` / `.transform` | 操作符（类似 RxJS） |
| `.asBroadcastStream()` | 单订阅转广播 |
| `StreamController` | 手动控制 Stream（add/close） |
| `StreamController.broadcast()` | 广播 Stream（多消费者） |

### Isolate（并发）

| API | 含义 |
| --- | --- |
| `Isolate.run(fn)` | 启动 worker 执行并返回结果（2.15+） |
| `Isolate.spawn(entry, message)` | 启动 Isolate（低级 API） |
| `SendPort` / `ReceivePort` | 端口（消息收发） |
| `compute(fn, arg)`（Flutter） | Isolate.run 的便利封装 |

## 五、Flutter Widget 语言基础速查

| 概念 | 含义 | React 对照 |
| --- | --- | --- |
| `Widget` | 不可变 UI 描述 | 元素描述 |
| `StatelessWidget` | 无状态组件 | 函数组件 |
| `StatefulWidget` + `State` | 有状态组件 | class 组件 |
| `build(BuildContext)` | 描述 UI | render |
| `setState(() { })` | 触发重建 | setState |
| `BuildContext` | 树中位置句柄 | context（更强） |
| `const Widget` | 编译期单例（性能） | —— |
| `InheritedWidget` | 向后代广播 | Context.Provider |
| `Key`（key 参数） | 控制复用与重排 | key |

## 六、与 JS/TS / Swift / Kotlin 对比

| 维度 | Dart | JS / TS | Swift | Kotlin |
| --- | --- | --- | --- | --- |
| 变量声明 | var/final/const 三档 | let/const | var/let | var/val |
| 空安全 | 健全（全依赖图） | TS 擦除 | Optional 枚举 | T/T?（平台类型逃逸） |
| 数字 | int/double/num | number（全 double） | Int/Double | Int/Double |
| 相等 | `==` 结构相等 | `===` 严格 | `==` 结构 | `==` 结构 |
| 异步 | Future/Stream + async | Promise/async iter | async/await | 协程/Flow |
| 内存 | GC（分代） | GC | ARC | JVM GC |
| 编译 | AOT + JIT 双模式 | 解释 + JIT | AOT | JVM 字节码 |
| 主要用途 | Flutter 跨平台 | Web/Node | iOS/macOS | Android/JVM |

## 七、易错点清单

- **「Dart 类型与 TS 一样会擦除」**：错。Dart 类型在运行时仍有效（尤其 AOT 模式），TS 类型完全擦除。
- **「`final` 等于 `const`」**：错。`final` 是运行时单次赋值（值可运行时确定），`const` 是编译时常量（深度不可变，对象图编译期固定）。
- **「`dynamic` 等于 `Object`」**：错。`dynamic` 关闭类型检查（任意方法调用都通过），`Object` 是强类型根（只有 Object 方法可调）。
- **「Dart 有 truthy/falsy」**：错。条件必须是 `bool`，`if (1)` 或 `if ('')` 编译错误（无 JS 的隐式转换）。
- **「健全空安全就是 T/T? 二分」**：部分对。健全性要求整个依赖图全空安全（一个未迁移库会阻止 sound 模式），不只是语法二分。
- **「`late` 是安全的」**：错。访问前未初始化会抛 LateInitializationError，需谨慎。
- **「Future 就是 Promise 完全等价」**：API 高度相似但非完全等价（如错误处理细节、`Future.wait` 的错误行为与 `Promise.all` 略有差异）。
- **「Stream 默认多消费者」**：错。默认是单订阅 Stream（一个消费者），广播需 `.asBroadcastStream()` 或 `StreamController.broadcast()`。
- **「Isolate 是线程」**：错。Isolate 无共享内存（独立堆），靠消息传递，与共享内存线程不同，避免锁。
- **「热重载会重置状态」**：错。热重载（`r`）保留 State，热重启（`R`）才重置。
- **「const Widget 只是风格选择」**：错。const Widget 让框架复用实例、跳过重建，是性能优化关键（Flutter 中能用 const 必用）。
- **「Dart 的 `==` 与 JS 一样需 `===`」**：错。Dart `==` 已是结构相等（调 `==` 操作符），无 JS 的隐式转换问题，不需 `===`。

## 八、进阶方向（链接其他叶）

- [Swift](../swift/) —— iOS 原生语言，对比声明式 UI 的不同实现（SwiftUI vs Flutter）
- [Kotlin](../kotlin/) —— Android 原生语言，对比（Compose vs Flutter）
- [Flutter](../../../mobile-desktop/mobile-framework/flutter/) —— 使用 Dart 的跨平台框架详述

## 权威链接

- [Dart 官方文档](https://dart.dev/guides)
- [Dart 语言之旅](https://dart.dev/language)
- [Dart Null Safety](https://dart.dev/null-safety)
- [Flutter 官方文档](https://docs.flutter.dev/)
- [DartPad（在线运行）](https://dartpad.dev/)
- [Dart pub 包仓库](https://pub.dev/)
- 本站幻灯片：<a href="/SlideStack/dart-slide/" target="_blank">Dart</a>
