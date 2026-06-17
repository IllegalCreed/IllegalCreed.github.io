---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 snack.expo.dev 与 Expo 官方文档 2025–2026 现状编写

## URL 速查

| 操作                | URL                                       |
| ------------------- | ----------------------------------------- |
| 主站 / 新建         | `https://snack.expo.dev/`                 |
| 打开已存 Snack      | `snack.expo.dev/{id}`                      |
| 打开某用户 Snack    | `snack.expo.dev/@用户名/slug`             |
| 极简嵌入页          | `snack.expo.dev/embedded`                 |
| 极简嵌入 + 已存     | `snack.expo.dev/embedded/{id}`            |

> 旧域名 `snack.expo.io` 已 301 跳转到 `snack.expo.dev`。

## embed.js 的 `data-snack-*` 属性

> 用于 embed.js 嵌入；所有值都需 **URL 编码（`encodeURIComponent`）**。

| 属性                              | 含义 / 取值                                                       |
| --------------------------------- | ---------------------------------------------------------------- |
| `data-snack-id`                   | 已存 Snack 的 id；**设了则 `code` / `dependencies` 被忽略**       |
| `data-snack-code`                 | 内联 JS 代码（单 `App.js`）                                       |
| `data-snack-name`                 | 名称                                                             |
| `data-snack-description`          | 描述                                                             |
| `data-snack-dependencies`         | 逗号分隔依赖，版本可选；省略版本按所选 SDK 取兼容版（类似 `expo install`） |
| `data-snack-platform`             | 默认预览平台，**默认 `web`**；`ios` / `android` / `web` / `mydevice` |
| `data-snack-preview`              | 显 / 隐预览面板，**embed.js 下默认 `true`**；`true` / `false`     |
| `data-snack-theme`                | `light` / `dark`，省略用用户配置（默认 light）                   |
| `data-snack-sdkversion`           | Expo SDK 版本（如 `54.0.0`），默认最新                            |
| `data-snack-supportedplatforms`   | 可选预览平台，默认 `mydevice,ios,android,web`                    |
| `data-snack-loading`              | iframe loading：`auto` / `lazy` / `eager`（懒加载省资源）         |
| `data-snack-device-frame`         | 是否画设备外框 `true` / `false`                                  |
| `data-snack-device-android`       | Android 模拟器型号（Appetize device 取值，**会影响 Android 版本**） |
| `data-snack-device-android-scale` | 模拟器缩放 `1`–`100`                                             |
| `data-snack-device-ios`           | iOS 模拟器型号（Appetize device 取值，**会影响 iOS 版本**）       |
| `data-snack-device-ios-scale`     | `1`–`100`                                                       |
| `data-snack-deviceappearance`     | 设备外观 `light` / `dark`，省略回退到主题                        |

## URL 查询参数

> 用于 URL / iframe 嵌入；所有值都需 **URL 编码**。

| 参数                 | 说明 / 取值                                                       |
| -------------------- | ---------------------------------------------------------------- |
| `code`               | 内联 JS，建单 `App.js`；多文件用 `files`                          |
| `description`        | 描述                                                             |
| `dependencies`       | 逗号分隔依赖（版本可选），如 `expo-image-picker,lodash@4`         |
| `files`              | URL 编码的 JSON，多文件 / 外链 / 支持 `App.tsx`（设了则忽略 `code`） |
| `hideQueryParams`    | `true` / `false`（默认 `false`），隐藏地址栏参数显示干净 URL      |
| `name`               | 名称，默认自动生成                                               |
| `platform`           | 默认预览平台，**默认 `web`**；`ios` / `android` / `web` / `mydevice` |
| `preview`            | 显 / 隐预览面板，**URL 嵌入页默认 `false`**；`true` / `false`     |
| `sdkVersion`         | Expo SDK 版本，默认最新                                          |
| `sourceUrl`          | 外部托管代码 URL（公开可访问）；设了则忽略 `code` / `files`       |
| `supportedPlatforms` | 可选预览平台，默认 `mydevice,ios,android,web`                    |
| `theme`              | `light` / `dark`                                                |
| `deviceAppearance`   | 设备外观 `light` / `dark`                                        |
| `verbose`            | `true` / `false`，开详细日志，便于排查包 / Snack 问题            |

## `files` 参数 JSON 结构

三种文件定义，整体 `JSON.stringify` 后再 `encodeURIComponent`：

```js
const files = {
  "App.tsx": { type: "CODE", contents: 'console.log("hi");' }, // 内联代码
  "data/data.json": { type: "CODE", url: "https://mysite/data.json" }, // 外链代码(JS/MD/JSON)
  "assets/image.png": { type: "ASSET", contents: "https://mysite/image.png" }, // 外链资源(图片/字体)
};
const url = `https://snack.expo.dev?files=${encodeURIComponent(JSON.stringify(files))}`;
```

| `type`  | 取内容字段           | 用途                          |
| ------- | -------------------- | ----------------------------- |
| `CODE`  | `contents`           | 内联源码                      |
| `CODE`  | `url`                | 外链代码（JS / MD / JSON）    |
| `ASSET` | `contents`（外链 URL）| 外链资源（图片 / 字体等）      |

## 依赖规则速记

| 规则                  | 说明                                                              |
| --------------------- | ----------------------------------------------------------------- |
| 依赖格式              | `name` 或 `name@version`（如 `lodash@4`、`react-native-paper@5.0.0`） |
| 版本省略              | 取与所选 **SDK 兼容**的版本（≈ `expo install`），**不是 latest**   |
| 永久外置              | `react` / `react-native` / `expo` 永不打进 bundle，由 runtime 提供 |
| 预置 / 外置常用包     | `@expo/vector-icons`、`expo-constants` 等由 runtime 预置 / 外置    |
| 打包器                | 第三方包由 **Snackager**（`snackager.eascdn.net`，Webpack + RN preset）转译打包并缓存 |
| 缺 peer 依赖          | 在 `missingDependencies` 报告缺哪个、期望版本                      |
| **NPM 新版本延迟**    | 发布后**最多 60 分钟**才在 Snack 可用                             |
| 绕过缓存              | `curl ".../bundle/[name]@[version]?platforms=ios,android,web&version_snackager=true&bypassCache=true"` |
| **能装**              | 纯 JS 包 + **Expo SDK 自带的原生模块**                            |
| **装不了**            | 需自定义原生代码 / config plugin / 链接原生库的包（要 EAS Build 落本地） |

## 预览端速记

| 平台值（`platform`） | 运行位置                          | 说明                          |
| -------------------- | --------------------------------- | ----------------------------- |
| `web`（默认）        | 浏览器 web-player（RN-for-web）    | 打开即运行                    |
| `ios`                | 云端 Appetize iOS 模拟器          | 画面流到浏览器                |
| `android`            | 云端 Appetize Android 模拟器      | 画面流到浏览器                |
| `mydevice`           | 手机 Expo Go App                  | 扫码 / 同账号登录，真机预览    |

## 能力边界速记

| 想做的事                        | 能否在 Snack 完成 | 替代方案                          |
| ------------------------------- | ----------------- | --------------------------------- |
| 写 RN 并三端预览                | ✅                | —                                 |
| 用 Expo SDK 自带原生模块        | ✅                | —                                 |
| 用纯 JS npm 包                  | ✅                | —                                 |
| 自定义原生模块 / 链接原生库     | ❌                | 本地 + **EAS Build / dev client** |
| config plugin / `prebuild`      | ❌                | 本地 + EAS Build                  |
| 生产构建 / 签名 / 上架          | ❌                | **EAS Build / EAS Submit**        |
