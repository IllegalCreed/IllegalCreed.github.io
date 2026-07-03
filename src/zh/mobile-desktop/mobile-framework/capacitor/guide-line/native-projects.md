---
layout: doc
outline: [2, 3]
---

# Capacitor 的原生工程即源码

> 基于 Capacitor 8 · 核于 2026-07

## 速查

- **核心哲学**：`ios/`、`android/` 是**源码工程（source asset）**，**签入 Git**，直接用 Xcode / Android Studio 打开编辑——不是构建产物
- **与 Cordova 相反**：Cordova 把原生当构建产物（每次重生成、不入库）；Capacitor 让你**拥有并直接改**原生工程
- **与 Expo CNG 相反**：Expo 的 CNG 把 `ios/`/`android/` 当**可再生产物**（`.gitignore`、`prebuild` 重生成）；Capacitor 恰相反——签入、手改
- **生成**：`npx cap add ios/android` 生成标准原生工程（iOS `App.xcworkspace` + CocoaPods；Android 标准 Gradle 工程）
- **加原生代码**：直接在原生工程写，或做自定义插件；改配置直接改 `Info.plist`/`AndroidManifest.xml`（无 `config.xml` 抽象层）

## 一、原生工程是「源码」，不是「产物」

`npx cap add ios` / `npx cap add android` 会生成标准的原生工程目录：

- **iOS**：`ios/App/App.xcworkspace`（CocoaPods 管理 `Pods`），用 Xcode 打开。
- **Android**：`android/` 标准 Gradle 工程（`android/app`），用 Android Studio 打开。

这两个目录被**签入版本库**，你可以像对待任何原生工程一样直接编辑它们——这是 Capacitor 的核心设计选择。

## 二、三种「原生目录」哲学对比

| 方案 | 原生目录定位 | 是否入库 | 改原生的方式 |
| --- | --- | --- | --- |
| **Cordova** | 构建产物（每次重生成） | 否 | 全局 `config.xml` 抽象层 |
| **Expo CNG** | 可再生产物（`prebuild` 生成） | 否（`.gitignore`） | 声明式 app 配置 + Config Plugins |
| **Capacitor** | **源码工程** | **是** | **直接改原生文件 + `capacitor.config.ts`** |

- **Capacitor vs Expo CNG（易混）**：两者对「原生目录该不该手改」的态度完全相反。Expo 把原生目录当短命产物、鼓励用 Config Plugins 声明式修改、`prebuild --clean` 可删了重生成；Capacitor 把原生目录当长期源码、鼓励直接在 IDE 里改、签入 Git。

## 三、怎么加原生代码 / 改原生配置

- **加原生代码**：直接在 `ios/`、`android/` 工程里写 Swift/Kotlin，或封装成[自定义插件](./plugins)。
- **改原生配置**：直接改文件——iOS 的 `Info.plist`（权限描述、scheme 等）、Android 的 `AndroidManifest.xml`（权限、`configChanges` 等）。**没有 `config.xml` 这层抽象**，所见即所得。
- **`capacitor.config.ts`**：跨平台的运行时/构建配置（`appId`/`appName`/`webDir`/`server`/`plugins` 等），与原生文件互补。

> 因为原生工程是你自己的源码，跨大版本升级（如 v7→v8）常涉及手动改原生工程的构建配置——Capacitor 提供 `npx cap migrate` 辅助，但仍需按官方 updating 页核对（如 v8 要求 Node 22+/Xcode 26+/minSdk 24 等）。
