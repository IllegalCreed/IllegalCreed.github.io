---
layout: doc
outline: [2, 3]
---

# Taro 参考

> 基于 Taro 4.x · 核于 2026-07

## 速查

- 版本：Taro **4.x**，最新稳定 **v4.1.8（2025-11-06）**；Node **>= 16.20.0**；编译内核 webpack4/5 或 **Vite**（自 v4.0）
- 主打 **React**（v3.5 起默认 React 18），兼 **Vue3**；内置组件 **PascalCase**、事件 **`on` 前缀**、`Taro.*` API 默认 **promisify**
- 架构：**Taro 1/2 重编译时 → Taro 3 重运行时（彻底重写）→ Taro 4 + Vite + CompileMode + 鸿蒙**
- 鸿蒙三路线（别混）：`harmony-hybrid`（套壳，3.6.24+）/ `harmony`（ArkTS，4.0）/ `harmony_cpp`（C-API，**4.1.0+**，纯血主推，**仅 Vite**）
- 最常踩：页面 Hooks 从 `@tarojs/taro` 导、`useReady` 才能取节点、事件必 `on` 前缀、`null` 而非 `undefined`、不支持 `React.lazy`

## 一、版本 / 量级坐标

| 项 | 值 |
| --- | --- |
| 维护方 | **京东·凹凸实验室（O2 Team）/ NervJS** |
| 仓库 | [github.com/NervJS/taro](https://github.com/NervJS/taro) |
| Star | **约 37k+** |
| 最新稳定版 | **v4.1.8（2025-11-06）** |
| 4.0 首个正式版 | **v4.0.3**（Beta 2024-04，正式约 2024 年中） |
| Taro 3 GA | **3.0.0（2020-07-01）** |
| Node 要求 | **>= 16.20.0** |
| 主打框架 | **React**（v3.5 起默认 React 18），兼 Vue3/Vue2/Preact/Nerv/Svelte |
| 编译内核 | webpack4 / webpack5 / **Vite**（Vite 自 v4.0；纯血鸿蒙 C-API 仅 Vite） |

## 二、内置组件（`@tarojs/components`）

| 类别 | 组件 |
| --- | --- |
| 容器 / 文本 | `View` / `Text` / `RichText` / `ScrollView` |
| 表单 | `Button` / `Input` / `Textarea` / `Picker` / `Switch` / `Checkbox` / `Radio` |
| 媒体 | `Image` / `Video` / `Canvas` / `Audio` |
| 导航 / 轮播 | `Swiper` / `SwiperItem` / `Navigator` / `Icon` / `Map` |

- **PascalCase**；**React 必须显式 import**，**Vue 模板直接用小写标签**（`<view>`，无需 import）。
- 事件用 **`on` 前缀 + 驼峰**（`onClick` / `onScroll` / `onTouchstart`）；防滚动穿透 `<View catchMove />`。

## 三、`Taro.*` API（`@tarojs/taro`）

| 类别 | 常用 API |
| --- | --- |
| 路由 | `navigateTo` / `redirectTo` / `switchTab` / `navigateBack` / `reLaunch` |
| 网络 | `request` / `uploadFile` / `downloadFile` |
| 存储 | `getStorageSync` / `setStorageSync` / `removeStorageSync` |
| UI | `showToast` / `showModal` / `showLoading` / `showActionSheet` |
| 能力探测 | `canIUse`（查各端支持度） |
| 节点查询 | `createSelectorQuery`（须在 `useReady` 后） |

- 异步 API 默认 **`promisify`**，可直接 `await`；统一策略把各端差异收敛到微信规范，未适配可回退端命名空间（`my` / `swan` / `tt`）。

## 四、Hooks 清单

| Hook | 对应生命周期 | 说明 |
| --- | --- | --- |
| `useRouter()` | — | 取 `{ path, params }` |
| `useLoad` | `onLoad` | 加载（**v3.5.0+**），可拿路由参数 |
| `useReady` | `onReady` | 渲染完成，**才能**取节点 |
| `useDidShow` / `useDidHide` | 显示 / 隐藏 | 前后台切换 |
| `usePullDownRefresh` | `onPullDownRefresh` | 下拉刷新 |
| `useReachBottom` | `onReachBottom` | 触底 |
| `usePageScroll` | `onPageScroll` | 滚动带 `scrollTop` |
| `useShareAppMessage` / `useShareTimeline` | 分享 | 需开启 |
| App：`useLaunch` / `useError` / `usePageNotFound` | `onLaunch` 等 | 应用级 |

> 框架 Hooks（`useState`/`useEffect`）从 **`react`** 导入；页面生命周期 Hooks 从 **`@tarojs/taro`** 导入。

## 五、鸿蒙三路线（严禁混淆）

| 路线 | 起始版本 | 命令 | 本质 |
| --- | --- | --- | --- |
| `harmony-hybrid` | v3.6.24+ | `build:harmony-hybrid` | **H5 套壳（WebView）**，过渡 |
| `harmony`（ArkTS） | Taro 4.0 | `taro build --type harmony` | React → **ArkUI 自定义组件递归渲染** |
| `harmony_cpp`（C-API） | **v4.1.0+** | `taro build --type harmony_cpp` | 渲染下沉 **C++**、直调 **ArkUI C-API**（纯血主推，**仅 Vite**） |

- C-API 插件 `@tarojs/plugin-platform-harmony-cpp`（**2025-05-16 开源**），配 `projectPath` / `hapName`（默认 `entry`），需 DevEco Studio。
- 京东 APP 纯血鸿蒙版 **2024-09 上线**、核心链路用 Taro、获华为 **S 级认证**。

## 六、`config/index.ts` 关键项

| 项 | 说明 |
| --- | --- |
| `sourceRoot` / `outputRoot` | 默认 `'src'` / `'dist'` |
| `designWidth` | 默认 **750**（可传函数按文件定制） |
| `framework` | `react` / `vue3` / `preact` / ... |
| `compiler` | `'webpack4'\|'webpack5'\|'vite'` 或 `{ type, prebundle }` |
| `mini` / `h5` | 端专属配置（h5 有 `router.mode`） |
| `defineConstants` / `alias` / `plugins` | 常量 / 别名 / 插件 |
| `jsMinimizer` / `cssMinimizer` | `terser`/`esbuild` · `csso`/`esbuild`/`parcelCss` |

## 七、常见易错点

| # | 易错点 |
| --- | --- |
| 1 | 页面生命周期 Hooks 从 `@tarojs/taro` 导，框架 Hooks 从 `react` 导 |
| 2 | `useEffect` / `componentDidMount` 拿不到渲染层节点 → 用 `useReady` + `createSelectorQuery` |
| 3 | 函数型 props 必须 **`on` 前缀**（对齐小程序事件） |
| 4 | 模板数据用 **`null` 而非 `undefined`** |
| 5 | 勿用 `id` / `class` / `style` 作自定义组件属性名；`state` 与 `props` 勿重名 |
| 6 | 未被编译期识别的属性用 `defaultProps` 初始化 |
| 7 | **不支持 `React.lazy`**（小程序无动态 import） |
| 8 | 环境变量用整体 `process.env.NODE_ENV`，**勿解构** |
| 9 | Vue `scoped` 样式小程序端不支持 → CSS Modules |
| 10 | React 内置组件必须 import；Vue 模板小写标签无需 import |
| 11 | **CLI 版本必须与项目依赖版本一致** |
| 12 | 纯血鸿蒙 **C-API 仅支持 Vite** |
| 13 | 尺寸用 `rpx`（设计稿宽 750），编译期 `pxtransform` 换算 |
| 14 | 路由参数取到都是**字符串**，数字自行转换 |
| 15 | 鸿蒙三路线别混：`harmony-hybrid` / `harmony`(ArkTS) / `harmony_cpp`(C-API) |

## 八、权威链接

- [Taro 官方文档](https://docs.taro.zone/docs/) · [安装及使用](https://docs.taro.zone/docs/GETTING-STARTED)
- [React 使用](https://docs.taro.zone/docs/react-overall) · [Vue3 使用](https://docs.taro.zone/docs/vue3)
- [Hooks](https://docs.taro.zone/docs/hooks) · [路由](https://docs.taro.zone/docs/router) · [组件总览](https://docs.taro.zone/docs/components-desc) · [API 总览](https://docs.taro.zone/docs/apis/about/desc)
- [编译配置详情](https://docs.taro.zone/docs/config-detail) · [目录结构](https://docs.taro.zone/docs/folder)
- [运行时实现](https://docs.taro.zone/docs/implement-note) · [最佳实践](https://docs.taro.zone/docs/best-practice)
- [鸿蒙总览](https://docs.taro.zone/docs/harmony) · [Harmony C-API 插件](https://docs.taro.zone/docs/harmony/c-api)
- [生态](https://docs.taro.zone/docs/treasures) · [物料市场 taro-ext](https://taro-ext.jd.com/)
- [Taro GitHub](https://github.com/NervJS/taro) · [Releases](https://github.com/NervJS/taro/releases)
