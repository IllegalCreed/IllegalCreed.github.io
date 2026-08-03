---
layout: doc
---

# Kotlin

**Kotlin** 是 JetBrains 于 2011 年立项、2016 年发布 1.0 的**现代 JVM 语言**，2017 年被 Google 确立为 **Android 官方首选开发语言**（与 Java 平级），是 Android 生态近十年的核心推进力。它在 JVM 上运行（编译为字节码），与 Java **100% 互操作**（同工程混用、相互调用），同时用**空安全、简洁语法、协程（coroutine）、扩展函数、data class、密封类**等现代特性大幅修正了 Java 的历史包袱。对前端开发者而言，Kotlin 的最大价值有二：① 直接为 Android 写**原生 App / 原生模块**（Jetpack Compose 声明式 UI 已是 Google 主推）；② 在 **React Native Android 桥接**中替代 Java 写原生模块（Kotlin 是 Android 新代码事实标准，Java 是其前身但**不独立立叶**——仅作为旧 Android 语言与服务端经典语言对比提及）。Kotlin 的考点集中在**空安全（nullable 类型系统）**、**协程与结构化并发（suspend/launch/Flow）**、**data class 与 sealed class**、**Jetpack Compose 声明式 UI（remember/mutableStateOf/状态提升）**与 **Java 互操作与平台类型陷阱**。

Kotlin 的全部考点围绕**「Java 现代化 + 协程 + 声明式 UI」**三轴展开：①**空安全**——`T` 与 `T?` 类型二分，编译期强制处理 null（与 Swift Optional 同源思想），调用 Java 代码时遇到「平台类型」（`T!`，可空性未知）需手动断言；②**协程（coroutine）**——轻量级并发原语（一个线程跑十万协程），`suspend` 函数 + `launch`/`async` 构建器 + `CoroutineScope` 结构化并发（父子取消传播），`Flow` 是协程版的异步流（对照 RxJava/JS 的 Stream）；③**Jetpack Compose**——2019 年推出的声明式 UI 框架，`@Composable` 函数 + `remember`/`mutableStateOf` 状态管理 + 状态提升，思想与 React/SwiftUI 高度相通。本叶是 Android 原生语言的**地基**，讲清语言核心与 Compose 后，[原生模块叶](./guide-line/native-modules) 衔接 React Native 桥接实战。

## 评价

**优点**

- **空安全强**：`T` 与 `T?` 二分，编译期消灭一整类 NullPointerException（与 Swift 同源思想）
- **协程轻量优雅**：suspend 函数 + 结构化并发，比回调/RxJava 更线性可读，一个线程可跑十万协程
- **简洁**：data class（一行声明模型）、扩展函数、字符串模板、when 表达式、属性委托大幅减少样板
- **与 Java 100% 互操作**：同工程混用、相互调用、渐进迁移无成本
- **Jetpack Compose 现代化**：声明式 + 状态驱动 + 实时预览，开发效率远超命令式 View 体系
- **跨平台潜力**：Kotlin Multiplatform（KMP）可共享业务逻辑到 iOS/桌面/服务端

**缺点**

- **平台类型陷阱**：调用 Java 代码时空安全失效（`T!` 可空性未知），需手动 `!!`/`?` 断言，易触发 NPE
- **协程心智负担**：调度器（Dispatchers）、作用域（Scope）、取消传播虽优雅但概念密集，误用易泄漏
- **编译速度一般**：增量编译受 Java/Kotlin 混编影响，全量编译慢于纯 Java
- **Java 互操作边界**：某些 Java 类型（如原始类型数组、可变泛型）映射有坑，需注意
- **Compose 仍演进**：复杂场景（自定义 Layout/性能优化）资料不如成熟 View 体系丰富，版本碎片化

## 本叶地图

- [入门](./getting-started) —— Kotlin 定位、空安全、协程与结构化并发、Jetpack Compose 声明式 UI、与 Java 关系总览
- [语言精要](./guide-line/language-essentials) —— nullable 类型系统与平台类型、协程（suspend/launch/Flow）、data class/sealed class、扩展函数、Compose 状态四件套（remember/mutableStateOf/状态提升）、Java 对比与互操作陷阱
- [原生模块](./guide-line/native-modules) —— React Native Android 桥接（Native Module + TurboModule 新架构）、Kotlin 替代 Java 写模块、Gradle 集成实战
- [参考](./reference) —— 类型系统速查、协程 API、Compose 速查、与 Java/Swift 对比、易错点

## 幻灯片地址

<a href="/SlideStack/kotlin-slide/" target="_blank">Kotlin</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=Kotlin" target="_blank" rel="noopener noreferrer">Kotlin 测试题</a>
