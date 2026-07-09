---
layout: doc
---

# Capacitor

Capacitor 是 **Ionic 团队出品的「面向 Web 应用的跨平台原生运行时」**（cross-platform native runtime for web apps）——用系统 WebView 承载任意前端框架构建出的 Web 应用，再通过**原生桥**让 JavaScript 调用设备原生能力（相机、定位、文件系统等），从而把**一套 Web 代码打包成 iOS / Android / PWA 原生 App**。它是 **Cordova 的现代继任者**：把 `ios/`、`android/` 原生工程当作**源码签入 Git**、直接用 Xcode/Android Studio 编辑，摒弃 `config.xml` 抽象层，以依赖方式（CocoaPods/Gradle）安装插件，且**无需 `deviceready`**。它**框架无关**——React/Vue/Angular/Svelte/vanilla 皆可，**Ionic UI 并非必需**。2026 年稳定版为 **v8**（`@capacitor/core` 8.4.1），周下载量约 292 万，是 Web 技术栈团队做跨端 App 的主流原生运行时。

## 概述

- **定位**：`原生容器 + 原生桥` 运行时。系统 WebView（iOS `WKWebView` / Android 系统 WebView）渲染 Web 层，Capacitor 插件把 JS 调用桥接到 Swift/Kotlin 原生实现。一次编写 → iOS + Android + PWA。
- **与 Cordova（现代继任者）**：原生工程当**源码**（非构建产物、签入 Git）；**无 `config.xml`**，直接改 `Info.plist`/`AndroidManifest.xml` + `capacitor.config.ts`；插件以**依赖**引入（不拷源码）；自动注册插件 JS、**无需 `deviceready`**；**本地** `npx cap` CLI。
- **与 Ionic（正交关系）**：Capacitor = 原生运行时，Ionic = **可选** UI 组件库；官方明言「Capacitor 不需要 Ionic 也能构建 App」，很多团队只用 Capacitor + 自研/任意 UI。
- **核心工作流**：**先 `npm run build` 产出 `webDir`（含 `index.html`）→ 再 `npx cap copy/sync` 搬进原生工程**——Capacitor 只搬产物、不负责构建 Web。命门是 `webDir` 配置。
- **能力边界**：Web 技术栈复用最顺；UI 由 **WebView 渲染**（非原生控件），业务型 App 体验足够，极致动画/超长列表不及原生或 RN，可用自定义原生插件补足。

## 本叶地图

- [入门](./getting-started) —— Capacitor 是什么、从零接入、核心工作流、与 Ionic/Cordova 的关系
- [WebView 与原生桥架构](./guide-line/webview-architecture) —— WebView 承载 Web、原生桥 JS⇄Native、能力边界与性能取舍
- [原生工程即源码](./guide-line/native-projects) —— `ios/`/`android/` 当源码签入、直接用原生 IDE、与 Expo CNG 的相反哲学
- [插件体系](./guide-line/plugins) —— 三类插件、官方 `@capacitor/*`、权限写原生文件、`registerPlugin` 自写与 Web 降级
- [CLI 与工作流](./guide-line/cli-workflow) —— init/add/open/run/build、**copy vs update vs sync**、Live Reload
- [对比 Cordova 与 Ionic](./guide-line/vs-cordova-ionic) —— 现代继任者的架构差异、与 Ionic 的分工、选型直觉
- [参考](./reference) —— 版本坐标 / CLI 命令 / 配置项 / 官方插件 / 易错点 速查表 + 权威链接

## 文档地址

- [Capacitor 官网](https://capacitorjs.com/) —— 定位与总览
- [Docs 总览](https://capacitorjs.com/docs) —— 版本、导航
- [Getting Started](https://capacitorjs.com/docs/getting-started) —— 安装 / init / add / sync
- [Configuration](https://capacitorjs.com/docs/config) —— `capacitor.config.ts` 全项
- [CLI](https://capacitorjs.com/docs/cli) —— 命令总览
- [Plugins](https://capacitorjs.com/docs/plugins) —— 插件三分类与官方清单
- [Cordova 对比与迁移](https://capacitorjs.com/docs/cordova) —— 现代继任者差异

## 幻灯片地址

- <a href="/SlideStack/capacitor-slide/" target="_blank">Capacitor</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=capacitor" target="_blank" rel="noopener noreferrer">Capacitor 测试题</a>
