---
layout: doc
outline: [2, 3]
---

# Ionic vs Capacitor

> 基于 Ionic 8 · 核于 2026-07

## 速查

- **一句话分工**：**Ionic = UI 层**（组件/主题/导航/手势/动画）；**Capacitor = 原生运行时**（把 Web 应用装进原生壳 + 原生 API 桥）
- **同队出品、职责分离**：都出自 Ionic 团队，但可**组合**也可**各自独立用**——Ionic 能脱离 Capacitor 做纯 PWA，Capacitor 能脱离 Ionic 给任意 Web 应用套壳
- **产出不同**：Ionic 产出 `ion-*` 组件 + CSS；Capacitor 产出 iOS/Android 原生工程 + 插件（相机/GPS/文件系统……）
- **WebView 机制**：Ionic 应用跑在原生内嵌的全屏 WebView 里（iOS **WKWebView** / Android **Android WebView**）；应用文件经本地 `http://` 服务器托管而非 `file://`，保证跨端一致
- **Cordova**：更老的等价运行时，Ionic 仍维护兼容；**新项目推荐 Capacitor**
- **别记反**：调相机/GPS/蓝牙、上架打包**不是 Ionic 的事**，是 Capacitor/Cordova 的事

## 一、一句话分工

这是关于 Ionic 最重要、也最容易考的一条认知：

- **Ionic Framework 只负责「界面」**——组件、主题、导航、手势、动画。它不知道、也不关心你的应用最终是网页还是原生 App。
- **Capacitor 负责「把 Web 应用变成原生 App」**——提供原生工程、WebView 宿主，以及访问设备能力（相机、GPS、文件系统、蓝牙……）的插件桥。

官方对 Capacitor 的定义：一个开源的跨平台**应用运行时**，让基于 Web 的应用能原生运行在 iOS、Android、Electron 和 Web 上。

## 二、职责对照表

| 维度 | Ionic Framework | Capacitor |
| --- | --- | --- |
| 角色 | **UI 层**（组件/主题/导航/手势/动画） | **原生运行时**（Web App 装进原生壳 + 原生 API 桥） |
| 产出 | `ion-*` 组件 + CSS | iOS/Android 原生工程 + 插件（相机/GPS/文件系统……） |
| 团队 | Ionic 团队 | 同为 Ionic 团队（官方推荐运行时） |
| 独立性 | 可脱离 Capacitor 单独做 PWA/网页 | 可脱离 Ionic，用于任何 Web 应用 |

## 三、WebView 机制：应用到底跑在哪

用 Capacitor 打包后，你的 Ionic 应用并**不是**被编译成原生控件，而是**跑在原生内嵌的全屏 WebView 里**：

- iOS 用 **WKWebView**，Android 用 **Android WebView**。
- 应用文件（HTML/CSS/JS）通过一个**本地 `http://` 服务器**托管，而**不是** `file://` 直接加载——这样能保证跨端行为一致，也满足某些 Web API 对安全上下文的要求。
- 与「渲染真实原生控件」的方案（如 React Native）不同：Ionic 的界面本质是**在 WebView 里跑的网页 UI**，靠 Ionic 组件做出接近原生的观感（双 mode + 主题）。

## 四、Cordova：更老的等价方案

在 Capacitor 之前，社区标准的原生运行时是 **Apache Cordova**：

- Cordova 与 Capacitor **角色等价**（都是把 Web 应用装进原生壳 + 原生插件），Capacitor 可视作现代化的继任者。
- Ionic **仍维护对 Cordova 的兼容**（含专用 WebView 插件），老项目可继续用。
- **新项目官方推荐 Capacitor**（更贴近原生工程、插件生态更现代）。

## 五、组合还是独立：四种搭配

因为二者职责分离，实际可有多种组合：

| 搭配 | 场景 |
| --- | --- |
| **Ionic + Capacitor** | 最常见：Ionic 画界面，Capacitor 打包成 iOS/Android App |
| **Ionic 单用** | 只做 PWA / 网页，不需要原生壳与原生 API |
| **Capacitor 单用** | 已有其他 Web 应用（非 Ionic UI），只想套原生壳 |
| **Ionic + Cordova** | 维护老项目或依赖某些 Cordova 插件时 |

## 六、周边：Appflow 与 Live Updates

Ionic 生态里还有配套的移动 CI/CD 服务 **Appflow**，提供云构建与 **Live Updates**（不发商店直接热推 HTML/CSS/JS 更新，仅 Capacitor/Cordova 应用可用）。

> ⚠️ 时效提醒：Appflow 正被官方**逐步停运**——不再接新客户、不再加新功能，存量应用有一段过渡期。若项目依赖热更新，建议评估 Capacitor 生态的其他 Live Update 方案，并以官方最新公告为准（本页不锁定具体停运日期）。

## 七、和其他跨端方案的一句话区分

- **vs React Native**：RN 把组件渲染成**真实原生控件**；Ionic 是**在 WebView 里跑网页 UI**（靠组件模拟原生观感）。二者的原生能力都需运行时/原生模块，但渲染路线根本不同。
- **vs 纯 PWA**：Ionic 可只做 PWA；加上 Capacitor 才获得上架能力与完整原生 API。
