---
layout: doc
outline: [2, 3]
---

# Capacitor 的 WebView 与原生桥架构

> 基于 Capacitor 8 · 核于 2026-07

## 速查

- **两层结构**：系统 WebView 承载 Web 层（iOS `WKWebView` / Android 系统 WebView，需 Chrome 60+）+ **Capacitor Bridge** 桥接 JS 与原生
- **Web 资产本地加载**：从 `webDir` 经 `capacitor://`(iOS) / `https://`(Android) scheme 加载，非远程
- **原生桥**：JS 调用 → 桥 → 原生方法（Swift/Kotlin）→ 回传 Promise/事件；Capacitor **自动生成 JS hooks**，插件作者多数只写原生实现
- **渲染是 WebView**（非原生控件、非 RN 的桥接原生视图）→ 业务型 App 够用；极致动画/超长列表/高帧率有取舍，可用自定义原生插件补
- **对比 RN/Flutter**：Capacitor 走 WebView 渲染（Web 生态无缝、上手低）；RN/Flutter 走原生/自绘（性能上限高、另一套体系）

## 一、两层架构

Capacitor 应用本质是「**原生容器 + 原生桥**」：

```
┌─────────────────────────────────────────────┐
│  你的 Web App（任意框架构建产物 → webDir）      │
│  HTML / CSS / JS  运行在 系统 WebView 内       │
└───────────────┬─────────────────────────────┘
                │  Capacitor Bridge（JS ⇄ Native）
┌───────────────┴─────────────────────────────┐
│  Capacitor 原生运行时 + 插件（Swift/Kotlin）   │
│  调用平台原生 SDK（相机/定位/文件/推送…）        │
└──────────────────────────────────────────────┘
```

- **WebView 承载 Web 层**：iOS 用 `WKWebView`，Android 用系统 WebView（要求 Chrome 60+）。
- **Web 资产本地加载**：构建产物从本地 `webDir` 经自定义 scheme（iOS `capacitor://`、Android `https://`）加载，而非从远程服务器（Live Reload 时除外）。

## 二、原生桥怎么工作

- JS 调用某插件方法 → 经 Bridge 转到对应原生方法（iOS Swift/Obj-C、Android Java/Kotlin）→ 执行后回传 Promise 结果或事件。
- **Capacitor 自动在客户端生成 JS hooks**：插件作者多数只需实现原生侧，JS 侧的调用桥接由 Capacitor 按运行时探测的原生方法自动生成（与 Cordova 需 `deviceready` 后手动就绪不同）。
- Web 平台上，插件可提供 **Web 实现**做优雅降级（见[插件体系](./plugins)的 `registerPlugin`）。

## 三、性能取舍（WebView 渲染的含义）

因为 UI 由 **WebView 渲染**（而非原生控件、也非 React Native 的桥接原生视图）：

- **够用场景**：表单、列表、CRUD、内容展示等业务型 App，体验完全足够，且 WebView 性能逐年提升。
- **有取舍场景**：复杂动画、超长列表、高帧率交互，不及纯原生或 RN 的原生视图；重计算走 JS 线程需留意。
- **补足手段**：对性能敏感的局部，写自定义原生插件或原生视图。

一句话对比：**Capacitor = WebView 渲染**（Web 生态无缝、学习成本低）；**RN/Flutter = 原生/自绘渲染**（性能上限高，但是另一套技术体系）。相邻对比另见[对比 Cordova 与 Ionic](./vs-cordova-ionic)。
