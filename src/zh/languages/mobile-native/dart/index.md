---
layout: doc
---

# Dart

**Dart** 是 Google 于 2011 年发布的**现代面向对象语言**，专为 **Flutter 跨平台 UI 框架**（2017 发布）而生——是 Flutter 的唯一官方语言。它最大的特点是**语法对 JS/TS 开发者极度友好**（类 C 语法、async/await、可选类型、Map/List 字面量），同时具备**强类型 + 健全空安全（Null Safety）+ AOT/JIT 双模式编译**。对前端开发者而言，Dart 的最大价值有二：① 用 Flutter 一套代码跨 iOS/Android/Web/桌面（学习曲线远低于 Swift/Kotlin 双平台分别学）；② 语法迁移成本低——JS/TS 开发者能在 1-2 天内上手 Dart，因为它刻意借鉴了 JS 的语法习惯。Dart 的考点集中在**与 JS/TS 的对比（语法相似与差异）**、**Null Safety（健全空安全）**、**AOT/JIT 双模式（开发用 JIT 热重载、发布用 AOT 高性能）**、**异步模型（Future/Stream + async/await）**与 **Flutter Widget 的语言基础**。

Dart 的全部考点围绕**「JS 友好语法 + 健全类型 + 双编译 + Flutter 语言基础」**四轴展开：①**JS 友好语法**——类 C 语法、`var`/`final`/`const` 变量声明、`Map`/`List` 字面量、箭头函数、可选命名参数、扩展运算符，JS 开发者几乎无障碍；②**健全空安全（Sound Null Safety）**——`T`（永不为 null）与 `T?`（可空）类型二分（与 Swift/Kotlin 同源思想），且是「健全」的（整个依赖图全空安全时编译器才能保证，无逃逸）；③**AOT/JIT 双模式**——开发用 **JIT**（即时编译 + 热重载，亚秒级反馈），发布用 **AOT**（提前编译为原生机器码，性能接近原生 App）；④**异步模型**——`Future<T>`（对应 JS Promise）、`Stream<T>`（对应 JS 异步迭代器/RxJS Observable）、`async`/`await`（与 JS 几乎一致），`Isolate` 是 Dart 的并发模型（无共享内存的消息传递，区别于线程）。本叶是 Flutter 跨平台语言的**地基**，讲清语言核心（语法/类型/异步）后，[Flutter 与异步叶](./guide-line/flutter-and-async) 衔接 AOT/JIT 双模式与 Future/Stream 实战。

## 评价

**优点**

- **JS 友好语法**：类 C 语法 + async/await + Map/List 字面量，JS/TS 开发者 1-2 天上手
- **健全空安全**：`T`/`T?` 二分 + 全依赖图健全检查，编译期消灭空引用崩溃
- **AOT/JIT 双模式**：开发 JIT 热重载亚秒级反馈，发布 AOT 性能接近原生 App
- **Flutter 唯一语言**：一套代码跨 iOS/Android/Web/桌面，无需学双平台语言
- **强类型 + 类型推断**：可选类型注解 + 强大推断，IDE 补全与重构安全
- **没有 JavaScript 的历史包袱**：模块系统统一（pub）、数值类型统一（num/int/double）、this 绑定清晰（无 JS 的 this 困惑）

**缺点**

- **生态规模不如 JS**：npm 周下载量级远超 pub，某些小众领域无现成包
- **空安全迁移成本**：健全空安全要求整个依赖图支持（老库未迁移则不能进入 sound 模式）
- **Isolate 心智负担**：无共享内存的消息传递并发，与线程模型不同，调试相对复杂
- **服务端生态弱**：Dart 也能写服务端（Shelf/Aqueduct），但远不如 Node/Java/Python 主流
- **Dart Web（dart2js）小众**：虽能编译到 JS，但 Flutter Web 渲染（CanvasKit/HTML）有性能/体积权衡

## 本叶地图

- [入门](./getting-started) —— Dart 定位、与 JS/TS 语法对比、Null Safety、AOT/JIT 双模式、Future/Stream 异步总览
- [语法与类型](./guide-line/syntax-and-types) —— 变量声明（var/final/const）、类型系统（num/String/bool/List/Map/Set）、命名参数、扩展运算符、空安全（健全性）、与 JS/TS 差异对照
- [Flutter 与异步](./guide-line/flutter-and-async) —— AOT/JIT 双模式编译、Future/async/await、Stream（单订阅/广播）、Isolate 并发、Flutter Widget 的语言基础（build/状态/上下文）
- [参考](./reference) —— 类型系统速查、异步 API、与 JS/TS/Swift/Kotlin 对比、易错点

## 幻灯片地址

<a href="/SlideStack/dart-slide/" target="_blank">Dart</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=Dart" target="_blank" rel="noopener noreferrer">Dart 测试题</a>
