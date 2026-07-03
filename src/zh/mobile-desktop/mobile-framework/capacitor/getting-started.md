---
layout: doc
outline: [2, 3]
---

# 入门：Capacitor 是什么与怎么起步

> 基于 Capacitor 8 · 核于 2026-07

## 速查

- **一句话**：Capacitor 是「面向 Web 应用的跨平台原生运行时」——系统 WebView 承载 Web 层 + **原生桥**调设备能力，一套 Web 代码打成 iOS/Android/PWA；Ionic 团队出品，**Cordova 现代继任者**
- **框架无关**：React/Vue/Angular/Svelte/vanilla 皆可，只要能构建出含 `index.html` 的静态 Web 资产
- **接入**：`npm i @capacitor/core` + `npm i -D @capacitor/cli` → `npx cap init`（配 appId/appName/**webDir**）→ 装 `@capacitor/ios @capacitor/android` → `npx cap add ios/android` → `npx cap sync`
- **日常循环（关键顺序）**：**先 `npm run build`（产出 webDir）→ 再 `npx cap sync` → `npx cap open/run`**——Capacitor 只搬产物、不构建 Web
- **copy vs update vs sync**：`copy`=搬 Web 资产+配置；`update`=装原生依赖(Pods/Gradle)；`sync`=copy+update
- **原生工程是源码**：`ios/`、`android/` 签入 Git、用原生 IDE 直改（与 Expo CNG 相反）
- **Ionic 非必需**：Capacitor=运行时、Ionic=可选 UI 层；只用 Capacitor + 任意 UI 完全可行
- **版本**：v8（`@capacitor/core` `8.4.1`）；门槛 Node 22+ / Xcode 26+ / iOS 15+ / Android minSdk 24
- **命门**：`webDir` 指向含 `index.html` 的构建产物目录，指错报「unable to find the web assets directory」

## 一、Capacitor 解决什么问题

如果你的团队已经用 Web 技术栈（React/Vue/Angular…）写界面，又想把它变成能上架 App Store / Google Play 的**原生 App**，同时保留 PWA——Capacitor 就是这条路。它的做法是：用系统 **WebView** 渲染你的 Web 应用，再通过 **Capacitor 插件（原生桥）** 让 JavaScript 能调用相机、定位、文件系统等原生能力。

```
你的 Web App（任意框架构建产物 → webDir，跑在系统 WebView 内）
        │  Capacitor Bridge（原生桥，JS ⇄ Native）
Capacitor 原生运行时 + 插件（Swift/Kotlin）→ 平台原生 SDK
        ios/（源码，签入 Git）    android/（源码，签入 Git）
```

它是 **Cordova 的现代继任者**：精神相同（WebView + 暴露原生能力），但架构现代化——原生工程当源码、无 `config.xml`、以依赖装插件、无需 `deviceready`。详见[对比 Cordova 与 Ionic](./guide-line/vs-cordova-ionic)。

## 二、从零接入一个 Web 项目

前提：项目有 `package.json`、有构建输出目录（`dist`/`www` 等），且该目录根有含 `<head>` 的 `index.html`。

```bash
# 1. 安装核心与 CLI
npm i @capacitor/core
npm i -D @capacitor/cli

# 2. 初始化（交互式配置 appId / appName / webDir）
npx cap init

# 3. 加平台（生成 ios/、android/ 原生工程，签入 Git）
npm i @capacitor/ios @capacitor/android
npx cap add ios
npx cap add android

# 4. 首次同步
npx cap sync
```

`npx cap init` 会问三个关键值：`appId`（反向域名唯一包名，如 `com.company.app`）、`appName`（展示名）、`webDir`（**构建产物目录**，最关键，指错就找不到 Web 资产）。

## 三、日常开发循环（顺序是重点）

Capacitor **只搬 Web 产物、不负责构建**，所以顺序永远是「先构建 Web，再同步到原生」：

```bash
npm run build          # 1) 前端框架构建 → 产出到 webDir
npx cap sync           # 2) 同步：copy(搬 Web 产物+配置) + update(更新原生依赖)
npx cap open ios       # 3a) 打开 Xcode（或 npx cap open android）
npx cap run ios        # 3b) 或直接跑到设备/模拟器（debug）
npx cap build android  # 4) 出签名包（AAB/APK/IPA）交商店
```

其中 `copy` / `update` / `sync` 的区别是高频考点：`copy` 搬 Web 资产、`update` 装原生依赖、`sync` = 两者合一。只改 Web 代码时 `copy` 最快；动了插件才需 `update`（详见 [CLI 与工作流](./guide-line/cli-workflow)）。

## 四、加一个原生能力：以相机为例

```bash
npm install @capacitor/camera
npx cap sync
```

```typescript
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

const takePicture = async () => {
  const photo = await Camera.getPhoto({
    quality: 90,
    resultType: CameraResultType.Uri, // Uri / Base64 / DataUrl
    source: CameraSource.Camera,
  });
  imageEl.src = photo.webPath; // WebView 可直接渲染
};
```

权限体现「直接改原生文件」哲学：iOS 在 `Info.plist` 加 `NSCameraUsageDescription`，Android 在 `AndroidManifest.xml` 按需加存储权限；运行时用 `Camera.checkPermissions()` / `requestPermissions()`。

> 注意 Capacitor **8.1.0** 起 `getPhoto`/`pickImages` 已弃用，改用 `takePhoto`/`chooseFromGallery`（`CameraSource.Prompt` 移除，需自建来源选择 UI）——详见[插件体系](./guide-line/plugins)。

## 五、心智地图：接下来读什么

- 想懂运行原理 → [WebView 与原生桥架构](./guide-line/webview-architecture)。
- 想懂为什么 `ios/`/`android/` 要签入 Git → [原生工程即源码](./guide-line/native-projects)。
- 想用/写插件 → [插件体系](./guide-line/plugins)。
- 想吃透命令 → [CLI 与工作流](./guide-line/cli-workflow)。
- 想搞清和 Cordova/Ionic 的关系 → [对比 Cordova 与 Ionic](./guide-line/vs-cordova-ionic)。
- 速记表在 [参考](./reference)。
