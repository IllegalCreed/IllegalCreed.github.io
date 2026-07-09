---
layout: doc
---

# React Native

React Native 是**用 JavaScript/TypeScript + React 构建真正原生移动应用**的框架——官方口径「Written in JavaScript, rendered with native code」。它的核心组件在运行时映射成真实原生视图（iOS `UIView`、Android `ViewGroup`），因此观感、手感、无障碍与性能都接近原生，而**不是** WebView 套壳、也**不是**像 Flutter 那样自绘像素。口号是 **「Learn once, write anywhere」**——复用的是技能与心智，各平台仍可写平台特定代码。2026 年 RN 已进入**「新架构专属 + Expo 为默认工作流」**的成熟期：最新稳定版 **0.86**（配 React 19.2、Expo SDK 57），新架构（JSI/Fabric/TurboModules/Codegen/Bridgeless）**0.76 起默认、0.82 起强制不可关**，Hermes 为默认引擎。它由 **Meta 主导 + 社区驱动**，是全球第二大跨端框架（仅次于 Flutter）。

## 概述

- **定位**：用 React 心智写、运行时渲染成**真实原生控件**的跨平台框架；一套 JS/TS 代码跑 iOS/Android（经 RN for Web 亦可上 Web）。与 React 的关系＝复用组件/Hooks 心智，但换了一个把组件渲染到**原生视图**（而非 DOM）的 renderer。
- **新架构（重中之重）**：**JSI**（JS↔C++ 直接互引，替代序列化 Bridge）＋ **Fabric**（C++ 统一新渲染器，同步布局 + React 并发）＋ **TurboModules**（类型安全、懒加载的原生模块）＋ **Codegen**（构建期从 TS/Flow spec 生成原生胶水）＋ **Bridgeless**（彻底不建桥）；布局引擎 **Yoga**，默认 JS 引擎 **Hermes**（AOT 字节码）。版本口诀：**0.76 默认、0.82 强制**。
- **开发模型的关键差异**：样式用 **JS 对象 + camelCase**、无 CSS 级联；**Flexbox 默认 `column`**（Web 是 row）；**所有文本必须包在 `<Text>` 里**；长列表用**虚拟化的 `FlatList`** 而非 `ScrollView`；`useNativeDriver` 只支持 transform/opacity。
- **Expo（2026 官方默认工作流）**：起步 `npx create-expo-app@latest`；开箱含**文件路由 Expo Router**、成体系的 **expo-\* 原生模块**、**CNG/prebuild**（原生目录当构建产物）、**Config Plugins**（声明式改原生）、**EAS** 云构建/提交/OTA 更新。
- **版本与选型**：0.86 稳定、新架构专属；要用 Expo Go 里没有的原生模块就得 **Development Build**；OTA 只能下发 JS/资源、不能下发原生代码。2026 年做原生级跨端 App 的 JS 系首选之一。

## 本叶地图

- [入门](./getting-started) —— RN 是什么、与 React/Flutter 的关系、用 Expo 起步、核心组件与样式初识、心智地图
- [新架构深潜](./guide-line/new-architecture) —— 为何弃 Bridge、JSI/Fabric/TurboModules/Codegen/Bridgeless/Yoga、Hermes、版本时间线与开关
- [样式与布局](./guide-line/styling-layout) —— JS 样式/StyleSheet、Flexbox 与 Web 的差异、Text/TextInput 规则、单位 dp 与平台差异
- [组件·列表·性能·动画](./guide-line/components-lists-perf) —— 核心组件映射、FlatList/FlashList 与优化、两线程模型与 60fps、Animated/useNativeDriver/Reanimated
- [Expo 工作流](./guide-line/expo-workflow) —— 用框架 vs 裸 CLI、Expo SDK、Expo Router、Dev Build vs Expo Go、CNG/prebuild、Config Plugins
- [EAS 与发布](./guide-line/eas-release) —— EAS Build/Submit/Update(OTA)、Runtime Version、iOS/Android 上架、OTA 合规边界
- [工具链与导航](./guide-line/tooling-navigation) —— Metro 打包器、React Native DevTools、Fast Refresh、React Navigation、网络与状态
- [参考](./reference) —— 版本坐标 / 新架构四大件 / Flexbox 差异 / FlatList 优化 / Expo 概念 / EAS 命令 / 易错点 等速查表 + 权威链接

## 文档地址

- [React Native 官网](https://reactnative.dev/) —— 组件、API、指南一手文档
- [Get Started](https://reactnative.dev/docs/getting-started) —— 框架推荐、起步、核心概念
- [Architecture Overview](https://reactnative.dev/architecture/overview) —— 新架构（JSI/Fabric/TurboModules/Codegen）一手说明
- [The New Architecture](https://reactnative.dev/architecture/landing-page) —— Bridgeless、渲染器、版本演进
- [Hermes](https://reactnative.dev/docs/hermes) —— 默认引擎、字节码、启用判断
- [Performance](https://reactnative.dev/docs/performance) —— 两线程、60fps、FlatList 优化
- [Expo 官方文档](https://docs.expo.dev/) —— Router / EAS / CNG / Config Plugins
- [React Navigation](https://reactnavigation.org/) —— 导航社区事实标准
- [React Native Directory](https://reactnative.directory/) —— 社区库检索（可筛新架构兼容性）

## 幻灯片地址

- <a href="/SlideStack/react-native-slide/" target="_blank">React Native</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=react-native" target="_blank" rel="noopener noreferrer">React Native 测试题</a>
