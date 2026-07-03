---
layout: doc
outline: [2, 3]
---

# React Native 的 Expo 工作流

> 基于 React Native 0.86 · Expo SDK 57 · 核于 2026-07

## 速查

- **Expo 是什么**：构建在 RN 之上的**框架 + 工具/云服务**；官方 2026 明确**推荐用它起步**（`npx create-expo-app@latest`）
- **用框架 vs 裸 CLI**：用 Expo＝省自建基础设施、专注业务；裸 `@react-native-community/cli`＝自拼路由/模块、全自控（仅特殊约束时）
- **Expo SDK**：一批官方原生模块（Camera/Notifications/FileSystem…），按 SDK 版本整体发布，与 RN 对应（**SDK 57 = RN 0.86 + React 19.2**）；用 **Expo Modules API** 写的自定义原生模块**默认支持新架构**
- **Expo Router**：**文件路由**（`app/` 下加文件即成路由）、`_layout` 嵌套布局、Typed Routes、每页自动 deep link、原生+Web Universal；**建立在 React Navigation 之上**
- **Development Build vs Expo Go**：Expo Go＝固定内置库的 playground、**不能加自定义原生代码**；Dev Build（含 `expo-dev-client`）＝你自己的调试版、可加任意原生库/改原生配置。**用到 Expo Go 没有的原生模块 → 必须 Dev Build**
- **CNG / prebuild**：`ios/`、`android/` 当**构建产物**（默认 `.gitignore`），真源＝app 配置 + Config Plugins；`npx expo prebuild --clean` 重生成（含 Autolinking）；「managed/bare」旧术语已淘汰
- **Config Plugins**：prebuild 期以代码（`with<Name>`）声明式改原生工程（权限/图标/Info.plist/AndroidManifest），避免手改被覆盖

## 一、Expo 是什么，与 RN 什么关系

**Expo 是构建在 React Native 之上的框架 + 一套工具/云服务**：一套 JS/TS 代码原生跑 iOS/Android/Web。它不是「另一个框架」，而是让 RN 开箱即用的上层。

2026 年 reactnative.dev 的「Get Started」明确表态：**最好的 RN 体验是通过一个 Framework**，并把 **Expo 列为推荐框架**。Expo 免费开源，开箱提供文件路由、成体系的原生模块、插件系统、开发工具链、云构建/更新。

- **用框架（推荐）**：省去自建基础设施，专注写业务。
- **不用框架（裸社区 CLI，`@react-native-community/cli`）**：需自拼路由/模块等库、自管 Xcode/Android Studio；仅在有特殊约束、想完全自控时选。

## 二、Expo SDK

Expo SDK 是一大批官方原生模块（Camera、Notifications、Image、FileSystem……），**按 SDK 版本整体发布**并与 RN 版本对应：

| Expo SDK | RN | React |
| --- | --- | --- |
| 54 | 0.81 | 19.x |
| 55 | 0.83 | 19.x |
| 56 | 0.85 | 19.2 |
| **57** | **0.86** | **19.2** |

- 用 **Expo Modules API** 写的自定义原生模块**默认支持新架构**，无需额外适配——这也是要自写原生能力时的推荐首选路径。

## 三、Expo Router：文件路由

Expo Router 是**基于文件的路由**：在 `app/` 目录下加文件即成为一条路由，免手动注册。

```
app/
  _layout.tsx      # 根布局（Tab/Stack 等）
  index.tsx        # 路由 /
  profile/
    [id].tsx       # 动态路由 /profile/:id
```

- 收益：移动文件即重构（无需改 import）、**每个页面自动 deep link**、Typed Routes（链接不存在的路由在开发期报错）、`_layout` 定义嵌套布局、**Universal**（原生 + Web 统一导航）。
- 与 React Navigation 关系：**Expo Router 建立在 React Navigation 之上**，用文件约定替代手写 navigator。

## 四、Development Build vs Expo Go（重要区分）

| 维度 | Expo Go | Development Build |
| --- | --- | --- |
| 本质 | 官方预建 playground App | 含 `expo-dev-client` 的**你自己的**调试 App |
| 原生库 | **固定内置一套** | **可加任意含原生代码的库** |
| 改原生配置/图标名 | ❌ | ✅ |
| 适用 | 学习、快速试 | 生产级开发环境 |

- **需要 Dev Build 的场景**：自定义原生模块（如 `react-native-firebase`）、改 App 图标/名/启动屏、生产级推送、Android App Links / iOS Universal Links、老 SDK。
- 记忆点：**用到 Expo Go 里没有的原生模块，就必须 Development Build**。

## 五、CNG / prebuild（Continuous Native Generation）

CNG 主张**不长期手工维护 `ios/`、`android/` 原生目录**，而把它们当作**可再生的构建产物**：

- **真源** = app 配置（app.json / app.config）+ Config Plugins。
- **`npx expo prebuild`** 按需生成原生工程，来源＝SDK 模板 + app 配置 + Config Plugins + **Autolinking**（自动链接 package.json 里的原生模块）。
- `ios/`、`android/` **默认加进 `.gitignore`**（视为构建产物）；`npx expo prebuild --clean` 可安全删除重生成。
- 升级流程简化：升依赖 + 改配置 + `prebuild --clean`。
- 「managed vs bare workflow」**旧术语已淘汰**，统一为 CNG 模型；旧「eject」概念也被 CNG 取代。

## 六、Config Plugins

因为 CNG 下**不应手改原生文件**（会被 `prebuild` 重生成覆盖），Config Plugins 让原生改动变成**声明式、可复现**：

- 一批在 prebuild 期**以代码方式修改原生工程**的 JS 函数（约定名 `with<Name>`），写进 app 配置的 `plugins` 数组。
- 典型用途：改 AndroidManifest.xml / Info.plist、加权限、改图标/启动屏。
- 卸载库会连带移除其插件声明，避免孤儿配置。

```js
// app.config.js —— 通过 plugins 声明式改原生
export default {
  expo: {
    plugins: [
      ["expo-camera", { cameraPermission: "允许访问相机以扫码" }],
    ],
  },
};
```

> 发布（EAS Build/Submit/Update）、OTA 合规与上架，见 [EAS 与发布](./eas-release)。
