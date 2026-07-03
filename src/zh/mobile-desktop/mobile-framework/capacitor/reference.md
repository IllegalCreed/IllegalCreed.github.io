---
layout: doc
outline: [2, 3]
---

# Capacitor 参考

> 基于 Capacitor 8 · 核于 2026-07

## 速查

- 定位：面向 Web 应用的跨平台原生运行时（WebView + 原生桥）；Cordova 现代继任者；Ionic 非必需
- 版本：v8（`@capacitor/core` `8.4.1`）；门槛 Node 22+ / Xcode 26+ / iOS 15+ / Android minSdk 24
- 铁律：先 `npm run build`（产出 `webDir`）再 `cap sync`；`copy`/`update`/`sync` 分工
- 原生工程 `ios/`/`android/` 是**源码**、签入 Git（与 Expo CNG 相反）

## 一、版本坐标

| 项 | 值 |
| --- | --- |
| 稳定大版本 | **v8** |
| `@capacitor/core` | `8.4.1` |
| 下一代 | v9 alpha（在研） |
| 周下载量 | 约 292 万（聚合） |
| Node | ≥ 22 |
| iOS | Xcode 26+ / 部署目标 iOS 15+ |
| Android | Studio Otter 2025.2.1+ / minSdk 24 / compile+target SDK 36 |

## 二、CLI 命令

| 命令 | 作用 |
| --- | --- |
| `npx cap init` | 初始化（appId/appName/webDir） |
| `npx cap add ios\|android` | 加平台（生成源码工程，入库） |
| `npx cap copy` | 搬 Web 资产 + 配置 |
| `npx cap update` | 更新原生插件/依赖 |
| `npx cap sync` | copy + update |
| `npx cap open ios\|android` | 开原生 IDE |
| `npx cap run ios\|android` | 跑真机/模拟器 |
| `npx cap build android` | 出签名包 |
| `npx cap ls\|doctor\|migrate` | 列/体检/升级 |

## 三、copy / update / sync

| 命令 | 做什么 | 何时用 |
| --- | --- | --- |
| `copy` | 搬 webDir 资产 + 配置 | 改了 Web 代码/配置 |
| `update` | 更新原生插件/依赖 | 装/删/升级插件 |
| `sync` | copy + update | 一把梭 / 加平台 / 拉改动 |

## 四、capacitor.config.ts 关键项

| 项 | 说明 |
| --- | --- |
| `appId` | 反向域名唯一包名 |
| `appName` | 展示名 |
| **`webDir`** | **构建产物目录（含 index.html），命门** |
| `server.url` / `cleartext` | Live Reload 指向 dev server |
| `server.androidScheme` | Android 默认 `https` |
| `ios` / `android` | 平台段覆写路径/scheme/调试开关 |
| `plugins` | 各插件专属配置 |

> `bundledWebRuntime` 新版已移除，勿再写。

## 五、官方常用插件（`@capacitor/*`）

`camera` · `geolocation` · `filesystem` · `preferences`（键值存储）· `push-notifications` · `local-notifications` · `share` · `device` · `network` · `dialog` · `toast` · `haptics` · `splash-screen` · `status-bar` · `clipboard` · `browser` · `app` · `keyboard`

## 六、易错点

| # | 易错点 |
| --- | --- |
| 1 | vs Cordova：源码工程 vs 构建产物、无 config.xml、依赖式装插件、无需 deviceready |
| 2 | vs Ionic：Capacitor=运行时、Ionic=可选 UI；Ionic 非必需 |
| 3 | copy=搬资产 / update=装依赖 / sync=两者合一 |
| 4 | `ios/`/`android/` 是源码签入 Git（≠ Expo CNG 的按需生成不入库） |
| 5 | UI 由 WebView 渲染，重动画/长列表有取舍 |
| 6 | `webDir` 指错报「unable to find the web assets directory」 |
| 7 | 顺序：先 `npm run build` 再 `cap copy/sync`（Capacitor 不构建 Web） |
| 8 | 权限写原生文件（Info.plist / AndroidManifest.xml） |
| 9 | Camera v8.1.0：`getPhoto`→`takePhoto`、`CameraSource.Prompt` 移除 |
| 10 | v8 门槛：Node 22+ / Xcode 26+ / iOS 15+ / minSdk 24 |

## 七、权威链接

- [Capacitor 官网](https://capacitorjs.com/) · [Docs](https://capacitorjs.com/docs) · [Getting Started](https://capacitorjs.com/docs/getting-started)
- [Config](https://capacitorjs.com/docs/config) · [CLI](https://capacitorjs.com/docs/cli) · [Plugins](https://capacitorjs.com/docs/plugins)
- [Cordova 对比与迁移](https://capacitorjs.com/docs/cordova) · [v8 升级](https://capacitorjs.com/docs/updating/8-0)
- [官方插件 APIs](https://capacitorjs.com/docs/apis) · [Live Reload](https://capacitorjs.com/docs/guides/live-reload)
