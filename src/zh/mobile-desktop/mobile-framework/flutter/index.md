---
layout: doc
---

# Flutter

Flutter 是 **Google 开源的 UI 框架 / SDK**，官方口径是「从单一代码库构建漂亮的、原生编译的、多平台应用」。它用 **Dart** 语言，最大特征是**自带渲染引擎、自绘每一个像素**——按钮、文本、滚动条这些控件全部由 Flutter 框架用 Dart 实现，而**不是**调用系统原生控件。这条路线与 React Native「桥接真实原生控件」正好相反：一句话记忆就是 **RN「翻译」给系统画，Flutter「自己」画**。它的核心心智是**「一切皆 Widget」**加**声明式 UI（`UI = f(state)`）**，底层由 **Widget / Element / RenderObject 三棵树**驱动高效更新。一套 Dart 代码可覆盖移动（iOS/Android）、Web、桌面（Windows/macOS/Linux）与嵌入式。2026 年当前稳定版为 **Flutter 3.44**（配 **Dart 3.12**，随 Google I/O 2026 发布），渲染引擎 **Impeller** 已在 iOS（自 3.10）与 Android（自 3.27）成为默认。

## 概述

- **定位**：Google 的开源 UI 工具包，用 **Dart** 写、由**自绘引擎直接画像素**的跨平台框架；一套代码跑移动 / Web / 桌面 / 嵌入式。与 RN 的根本差异＝**自绘 vs 桥接原生控件**：Flutter 的控件是纯 Dart 实现，跨平台、跨系统版本外观**一致**；RN 包装系统原生控件，外观随 OS 变。
- **一切皆 Widget + 三棵树（重中之重）**：Widget 是**不可变**的 UI 声明片段，用**组合**（composition over inheritance）构树，连「应用」本身都是 Widget（`MaterialApp` / `CupertinoApp`）。运行时由三棵树协作：**Widget 树**（可变蓝图、便宜、频繁重建）→ **Element 树**（可变、持久、diff 复用，`BuildContext` 本质就是 Element）→ **RenderObject 树**（真正做 layout / paint / hit-test）。
- **布局与约束**：黄金法则 **「Constraints go down. Sizes go up. Parent sets position.」**（约束向下、尺寸向上、父级定位置），一趟 O(n) 完成布局；`Row`/`Column`/`Expanded`/`Flexible` 是 Flex 家族核心；UI 风格分 **Material**（Google 设计）与 **Cupertino**（iOS 风格）两套。
- **渲染引擎**：从 **Skia** 迁移到 **Impeller**，核心是**构建期预编译所有 shader 与 pipeline**、消除运行时的 shader 编译卡顿（jank）；**iOS 默认自 3.10、Android 默认自 3.27**，Web 仍走 Skia 系（CanvasKit / Skwasm）。
- **Dart 语言**：静态强类型 + 类型推断、**sound null safety**（Dart 3 起强制）、**JIT + AOT 双编译**（对应开发热重载 vs 发布原生机器码）；异步用 `Future` / `Stream` / `async-await`，CPU 密集用 **isolate** 而非线程；`main()` 是固定入口，包生态在 **pub.dev**（非 npm）。
- **版本与选型**：**Flutter 3.44 + Dart 3.12**（2026-05，I/O 2026）；开发靠 **Hot Reload**（保留状态、仅 debug/JIT），DevTools 里的 **Flutter Inspector** 可直接看三棵树。要做像素级一致、性能可控的跨端 App，Flutter 是 2026 年的主流之选。

## 本叶地图

- [入门](./getting-started) —— Flutter/Dart 是什么、与 RN 的本质差异、声明式 UI 心智、装环境用 `flutter create`/`flutter doctor` 起步、心智地图
- [Dart 与 Widget：三棵树与生命周期](./guide-line/dart-widgets) —— 分层架构、一切皆 Widget、Stateless vs Stateful、State 生命周期、Widget/Element/RenderObject 三棵树、BuildContext 误用
- [布局与约束系统](./guide-line/layout-constraints) —— 约束黄金法则、紧/松约束、三类 Widget 行为、经典反直觉例子、Row/Column/Expanded/Flexible、overflow 排错、Material vs Cupertino
- [状态管理](./guide-line/state-management) —— 局部 vs 共享状态、setState/ValueNotifier/InheritedWidget 内置手段、Provider/Riverpod/Bloc 等社区方案与选型
- [渲染引擎：Skia 到 Impeller](./guide-line/rendering-impeller) —— 为何替换 Skia、Impeller 四大目标、平台默认状态、渲染管线四阶段、Flutter Web 渲染器（CanvasKit/Skwasm）
- [Dart 编译、异步与热重载](./guide-line/dart-async-hotreload) —— JIT/AOT 双编译与构建模式、sound null safety、Future/Stream/isolate 并发、Hot Reload vs Hot Restart 与失效场景
- [参考](./reference) —— 版本坐标 / 三棵树 / 约束法则 / 生命周期 / 状态管理选型 / Impeller / Dart 空安全 / CLI / 易错点等速查表 + 权威链接

## 文档地址

- [Flutter 官网](https://flutter.dev/) —— 定位、平台、案例一手入口
- [Flutter 文档站](https://docs.flutter.dev/) —— 指南、教程、Widget catalog、API 全在此
- [Architectural Overview](https://docs.flutter.dev/resources/architectural-overview) —— 分层架构、三棵树、渲染管线一手说明
- [Understanding constraints](https://docs.flutter.dev/ui/layout/constraints) —— 约束布局黄金法则（考点重灾区）
- [State management](https://docs.flutter.dev/data-and-backend/state-mgmt/options) —— 官方状态管理选型指南
- [Impeller rendering engine](https://docs.flutter.dev/perf/impeller) —— Impeller 目标、后端与平台默认
- [Hot reload](https://docs.flutter.dev/tools/hot-reload) —— Hot Reload / Hot Restart 与失效场景
- [Dart 官网](https://dart.dev/) —— Dart 语言、null safety、并发一手文档
- [pub.dev](https://pub.dev/) —— Dart/Flutter 官方包仓库（非 npm）

## 幻灯片地址

- <a href="/SlideStack/flutter-slide/" target="_blank">Flutter</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=flutter" target="_blank" rel="noopener noreferrer">Flutter 测试题</a>
