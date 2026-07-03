---
layout: doc
outline: [2, 3]
---

# Capacitor 对比 Cordova 与 Ionic

> 基于 Capacitor 8 · 核于 2026-07

## 速查

- **vs Cordova（现代继任者）**：原生工程当**源码**(签入 Git) vs 构建产物；**无 `config.xml`**直改原生文件 vs 全局抽象；**依赖式装插件**(CocoaPods/Gradle) vs 拷源码；自动注册、**无需 `deviceready`** vs 需等；**本地 `npx cap`** vs 全局 CLI；Swift 优先
- **兼容层**：多数 Cordova 插件可经兼容层复用，便于渐进迁移（`npx cap migrate`）
- **vs Ionic（正交关系）**：Capacitor=**原生运行时**、Ionic=**可选 UI 层**；官方明言「Capacitor 不需要 Ionic 也能构建 App」
- **选型直觉**：Web 技术栈团队要上原生 App → Capacitor 运行时；想要现成移动 UI 组件 → 叠加 Ionic（也可用任意 UI 库）

## 一、vs Cordova（最高频对比）

两者「精神相同」（WebView + 暴露原生能力给 Web），但 Capacitor 做了根本性现代化：

| 维度 | Cordova（旧） | Capacitor（新） |
| --- | --- | --- |
| **原生工程** | 构建产物，每次重生成、不入库 | **源码**，`ios/`/`android/` 签入 Git、用原生 IDE 直改 |
| **配置** | 全局 `config.xml` 抽象层 | **无 `config.xml`**；直接改 `Info.plist`/`AndroidManifest.xml` + `capacitor.config.ts` |
| **插件安装** | 把插件**源码拷进**工程（易被魔改） | 以**依赖**经 CocoaPods/Gradle 引入（不拷源码） |
| **插件就绪** | 需等 `deviceready` 事件 | **自动注册/导出**插件 JS，**无需 `deviceready`** |
| **插件元数据** | `plugin.xml` | iOS 用宏、Android 用注解 |
| **原生构建** | CLI 直接构建 | 交原生 IDE / 工具链（`cap open`） |
| **CLI** | 全局安装 | **本地** `npx cap`（版本随项目锁定） |
| **iOS 语言** | Obj-C 为主 | **Swift 优先** |

一句话记忆：**Cordova 把原生当「黑盒产物 + config.xml 抽象 + 拷插件源码」；Capacitor 把原生当「源码工程 + 原生 IDE 直改 + 依赖式装插件」。**

**迁移**：Capacitor 提供 Cordova 插件**兼容层**，多数 Cordova 插件可直接用（可能需额外步骤）；官方有 migration 专页 + `npx cap migrate` 辅助。

## 二、vs Ionic（正交，别混）

Capacitor 与 Ionic Framework 是**互补但独立**的两层，出自同一团队：

- **Capacitor = 原生运行时层**：设备能力访问、原生工程管理、打包发布。
- **Ionic Framework = 可选 UI 组件库**：一套移动端 UI 组件（按钮/列表/导航…），纯前端。

官方原文：「**Capacitor does not require Ionic Framework in order to build apps.**」很多团队只用 Capacitor + 自研 UI（或任意 UI 库）；也可以 Ionic UI + Capacitor 运行时。底层原生能力完全一致，差别仅在脚手架（用 Ionic 时可 `ionic cap ...`，否则 `npx cap ...`）。

## 三、选型直觉

- 你已有 Web 技术栈、想把 Web 应用变原生 App（+PWA）→ **Capacitor**（运行时）。
- 想要开箱即用的精致移动 UI 组件 → 叠加 **Ionic**（或任意 UI 库，非必需）。
- 要极致原生性能/复杂原生交互为主 → 考虑 React Native / Flutter（原生/自绘渲染），或在 Capacitor 里用自定义原生插件补足局部。
