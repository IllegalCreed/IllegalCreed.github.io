---
layout: doc
outline: [2, 3]
---

# React Native 工具链与导航

> 基于 React Native 0.86 · 核于 2026-07

## 速查

- **Metro**：RN 的 JS 打包器，三段式 **Resolution（解析依赖）→ Transformation（转译）→ Serialization（打 bundle）**；配 `metro.config.js`；跑 dev server + 驱动 Fast Refresh
- **React Native DevTools**（0.76 起）：**取代 Flipper / 旧 Hermes 调试器 / 远程 JS 调试（`chrome://inspect` 已废弃）**；**需 Hermes**，Dev Menu 按 `j` 开；含 Console/断点/Network(0.83+)/Performance/Memory/React 组件检查器 + Profiler
- **Fast Refresh**（默认开）：**保留函数组件 + Hooks 的 state**（类组件不保留）；带依赖的 Hook（`useEffect`/`useMemo`/`useCallback`）刷新时**总会重跑、忽略依赖数组**；`// @refresh reset` 强制重挂
- **导航**：**React Navigation** 是社区事实标准（Stack/Tab/Drawer，底层原生）；**Expo Router 建于其上**；选型：要文件约定/Web 通用→Expo Router，要完全手控→React Navigation；另有 Wix `react-native-navigation`（全原生）
- **原生能力**：无 UI → **TurboModules**；原生 UI 组件 → **Fabric Native Components**（`codegenNativeComponent`）；优先用 Expo SDK / 社区库
- **网络**：内置 **`fetch`**（+ XHR/WebSocket）；**RN 无 CORS 概念**；**iOS ATS 默认要 HTTPS、Android 28+ 默认禁明文**
- **状态**：本地 `useState`/`useReducer`/Context；全局 **Redux Toolkit / Zustand / Jotai**；服务端状态 **TanStack Query**（与 React Web 通用）

## 一、Metro：打包器

Metro 是 RN 的 JS 打包器，处理分三段：

1. **Resolution**：解析模块依赖图（含平台后缀 `Foo.ios.js` 等）。
2. **Transformation**：转译（JSX/TS → JS）。
3. **Serialization**：打成最终 bundle。

它同时跑 dev server 并驱动 Fast Refresh，配置在 `metro.config.js`：

```js
// metro.config.js
const { getDefaultConfig, mergeConfig } = require("@react-native/metro-config");
module.exports = mergeConfig(getDefaultConfig(__dirname), {
  // 自定义 resolver / transformer 等
});
```

> Expo 项目用 `@expo/metro-config`。

## 二、React Native DevTools（新调试器）

自 **0.76** 起，官方调试器是 **React Native DevTools**，它**取代了 Flipper、实验性 Debugger、旧的 Hermes(Chrome) 调试器**；同时**基于 `chrome://inspect` 的 Remote JS Debugging（远程 JS 调试）已被废弃**。

- **前提**：应用需跑在 **Hermes**（RN 默认引擎）；从 Dev Menu 按 `j` 打开。
- **功能**：Console、Sources/断点（条件断点、Logpoints、`debugger;`）、**Network（0.83 起，支持 fetch/XHR/Image，暂不支持 WebSocket/mock/限速）**、Performance（0.83 起）、Memory 堆快照、**React Components 检查器**（改 props/state、高亮重渲染、被 React Compiler 优化的组件标「Memo ✨」）、**React Profiler**（火焰图）。
- 不用于原生层调试——原生用 Xcode / Android Studio。

## 三、Fast Refresh

Fast Refresh（默认开启）让你保存即见效，同时尽量保留状态：

- **保留函数组件 + Hooks 的本地 state**（`useState`/`useRef`，只要参数与 Hook 顺序不变）；**类组件不保留 state**。
- 带依赖的 Hook（`useEffect`/`useMemo`/`useCallback`）在 Fast Refresh 时**总会重新运行、忽略依赖数组**（为即时见效；正式运行照常生效）。
- 改「纯 React 组件模块」→ 局部刷新；改「混合导出 / 非 React 依赖」→ 可能回退整页 reload。
- 语法/运行时错误可优雅恢复（改好红屏消失，不整页重载）；`// @refresh reset` 强制该文件组件重挂。
- 它统一取代了旧的 **Live Reload**（整页刷新丢 state）与 **Hot Reloading**（旧且不稳）。

## 四、导航

- **React Navigation**：社区**事实标准**，纯 JS 库，提供 Stack / Tab / Drawer 导航，底层用原生（iOS `UINavigationController`、Android `Fragment`）。

```tsx
// 安装：@react-navigation/native + 具体导航器 + react-native-screens + react-native-safe-area-context
import { useNavigation } from "@react-navigation/native";
const navigation = useNavigation();
navigation.navigate("Detail", { id: 1 }); // route.params 取参
```

- **Expo Router**：建立在 React Navigation 之上的**文件路由**层（见 [Expo 工作流](./expo-workflow)）。
- **选型**：新项目 / 需 Web 通用 / 喜欢文件约定 → **Expo Router**；需完全手控导航结构或已有体系 → 直接 **React Navigation**；要嵌入既有原生 App 的全原生导航 → Wix 的 `react-native-navigation`。

## 五、原生能力

- **无 UI 的原生模块 → Turbo Native Modules**：TS/Flow spec + Codegen + 原生实现，JSI 同步、懒加载（见 [新架构深潜](./new-architecture)）。
- **原生 UI 组件 → Fabric Native Components**：`codegenNativeComponent` + iOS `RCTViewComponentView` / Android `SimpleViewManager`。
- **访问平台 API**：优先用 Expo SDK / 社区库（reactnative.directory），没有再自写 Turbo/Fabric；用 **Expo Modules API** 写的模块默认兼容新架构。

## 六、网络与状态

### 网络

- 内置 **`fetch`**（推荐 async/await + `catch`）；`XMLHttpRequest`、`WebSocket` 也内置（axios 等基于 XHR）。
- **原生无 CORS 概念**（安全模型不同于浏览器）。
- 默认安全策略：**iOS ATS 默认要求 HTTPS**；**Android API 28+ 默认禁明文 HTTP**（需 `usesCleartextTraffic` 或网络安全配置例外）。

### 状态管理

- **本地**：`useState` / `useReducer` / Context。
- **全局**：**Redux Toolkit**（含 RTK Query）、**Zustand**（轻量 hook store）、**Jotai**（原子化）等——用法与 React Web 基本一致，无 RN 专属唯一官方库。
- **服务端状态**：**TanStack Query（React Query）** 做缓存与请求。
