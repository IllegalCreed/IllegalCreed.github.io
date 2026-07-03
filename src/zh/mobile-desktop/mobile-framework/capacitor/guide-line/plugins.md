---
layout: doc
outline: [2, 3]
---

# Capacitor 插件体系

> 基于 Capacitor 8 · 核于 2026-07

## 速查

- **三类插件**：官方 `@capacitor/*`（团队维护）、社区 `@capacitor-community/*`、经兼容层复用的 **Cordova 插件**
- **官方高频插件**：`@capacitor/camera`、`geolocation`、`filesystem`、`preferences`（键值存储，替代旧 Storage）、`push-notifications`、`local-notifications`、`share`、`device`、`network`、`splash-screen`、`status-bar`、`haptics` 等
- **装插件**：`npm i @capacitor/xxx` → `npx cap sync`（sync 会 update 原生依赖）
- **权限写原生文件**：iOS `Info.plist`、Android `AndroidManifest.xml`；运行时 `checkPermissions()` / `requestPermissions()`
- **自写插件**：`registerPlugin<T>('Name', { web: () => import('./web') })`，iOS 用宏 / Android 用注解声明可暴露方法（取代 Cordova `plugin.xml`）；`@capacitor/create-plugin` 脚手架
- **Camera 换代**：v8.1.0 起 `getPhoto`/`pickImages` 弃用 → `takePhoto`/`chooseFromGallery`；`CameraSource.Prompt` 移除

## 一、三类插件

1. **官方插件 `@capacitor/*`**：Capacitor 团队维护，覆盖高频原生能力。
2. **社区插件**：`capacitor-community/` GitHub 组织维护（如 `@capacitor-community/sqlite`）。
3. **Cordova 插件**：经**兼容层**复用的旧 Cordova 插件，便于渐进迁移（可能需额外步骤）。

官方插件（节选）：Action Sheet、App、Browser、**Camera**、Clipboard、Device、Dialog、**Filesystem**、**Geolocation**、Haptics、Keyboard、Local/Push Notifications、Network、**Preferences**（键值存储，替代旧 Storage）、Screen Orientation、Share、Splash Screen、Status Bar、System Bars、Toast。

## 二、使用插件

```bash
npm install @capacitor/geolocation
npx cap sync   # 装原生依赖（Pods/Gradle）并搬 Web 资产
```

```typescript
import { Geolocation } from '@capacitor/geolocation';

const pos = await Geolocation.getCurrentPosition();
console.log(pos.coords.latitude, pos.coords.longitude);
```

**权限**体现「直接改原生文件」哲学：

- iOS：在 `Info.plist` 加用途描述（如相机 `NSCameraUsageDescription`、定位 `NSLocationWhenInUseUsageDescription`）。
- Android：在 `AndroidManifest.xml` 加权限（如 `ACCESS_FINE_LOCATION`）。
- 运行时：`Xxx.checkPermissions()` / `Xxx.requestPermissions()`。

## 三、Camera API 换代（考点）

Capacitor **8.1.0** 起，经典的 `getPhoto` / `pickImages` 已**弃用**（仍可用），推荐新 API：

```typescript
import { Camera, CameraDirection } from '@capacitor/camera';

// 拍照（原 CameraSource.Camera）
const result = await Camera.takePhoto({
  quality: 90,
  editable: 'in-app',                     // 取代 allowEditing: true
  cameraDirection: CameraDirection.Rear,
  targetWidth: 1280, targetHeight: 720,   // 取代 width/height，须成对
});

// 选图（原 CameraSource.Photos）
const { results } = await Camera.chooseFromGallery({ quality: 90 });
// 注意：CameraSource.Prompt 已移除 —— 需用 @capacitor/action-sheet 自建来源选择 UI
```

## 四、自写插件

JS 接口 + 原生实现（iOS Swift/Obj-C、Android Java/Kotlin），用 `registerPlugin()` 注册，可挂 Web 实现做降级：

```typescript
import { registerPlugin } from '@capacitor/core';

const ScreenOrientation = registerPlugin<ScreenOrientationPlugin>('ScreenOrientation', {
  web: () => import('./web').then((m) => new m.ScreenOrientationWeb()),
});
```

- iOS 用**宏（macros）**、Android 用**注解（annotations）**声明可暴露给 JS 的方法——取代 Cordova 的 `plugin.xml`。
- 脚手架：`npm init @capacitor/plugin@latest`（`@capacitor/create-plugin`），官方有 creating-plugins 教程。
