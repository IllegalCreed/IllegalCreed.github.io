---
layout: doc
outline: [2, 3]
---

# 工程与构建配置

> 基于 Taro 4.x · 核于 2026-07

## 速查

- **两套配置分工**：`config/` 目录（`index.ts`/`dev.ts`/`prod.ts`）= **编译配置**；`src/app.config.ts` = **应用配置**（对齐小程序 `app.json`，但可写 JS/TS 逻辑）；页面 `*.config.ts` = 页面 json
- **`config/index.ts` 关键项**：`projectName`、`sourceRoot`（默认 `'src'`）、`outputRoot`（默认 `'dist'`）、`designWidth`（默认 **750**）、`framework`（`react`/`vue3`/...）、`compiler`、`mini`、`h5`、`plugins`、`defineConstants`、`alias`
- **`compiler`**：`'webpack4' | 'webpack5' | 'vite'`，或对象 `{ type, prebundle }`；**Vite 自 v4.0 起支持**，**纯血鸿蒙 C-API 仅支持 Vite**
- **CompileMode**：Taro 4 小程序端性能优化（编译期把部分运行时逻辑静态化），减少 `setData` / 递归模板开销
- **CLI**：`taro init` 建项目；`taro build --type weapp|h5|rn|harmony|harmony_cpp [--watch]`；`dev` = 带 `--watch`；**CLI 版本必须与项目依赖一致**
- **样式尺寸**：设计稿宽 **750**、用 **`rpx`** 单位，编译期 **`pxtransform`**（PostCSS）按端换算；`designWidth` 可传函数按文件定制
- **Vue 注意**：`scoped` 样式**小程序端不支持**，用 CSS Modules 替代
- **压缩**：`jsMinimizer`（`terser`/`esbuild`）、`cssMinimizer`（`csso`/`esbuild`/`parcelCss`）；`cache` 为 webpack5 持久缓存（默认关）

## 一、目录结构

```
├── dist/                 # 编译产物
├── config/               # 编译配置
│   ├── index.ts          # 主配置
│   ├── dev.ts            # 开发环境
│   └── prod.ts           # 生产环境
├── src/
│   ├── app.ts(x)         # App 入口（React: app.tsx / Vue: app.ts）
│   ├── app.config.ts     # 全局配置（= app.json，但可写逻辑）
│   ├── app.scss          # 全局样式
│   └── pages/
│       └── index/
│           ├── index.tsx        # 页面逻辑
│           ├── index.scss       # 页面样式（可选）
│           └── index.config.ts  # 页面配置（= 页面 json，可选）
└── project.config.json   # 微信小程序端专属配置
```

**两套配置别混**：`config/` 管**怎么编译**（工具链），`src/*.config.ts` 管**应用/页面本身**（路由、窗口、TabBar）。

## 二、`app.config.ts`：应用配置

等价于小程序 `app.json`，但**是可执行的 JS/TS**（能写逻辑、按环境拼数组）。核心字段：`pages`（页面路径数组，**第一项即首页**，决定路由）、`window`、`tabBar`、`subPackages`（分包）、`permission` 等。

```ts
// src/app.config.ts
export default defineAppConfig({
  pages: ['pages/index/index', 'pages/detail/index'],
  window: { navigationBarTitleText: 'Taro' },
  tabBar: {
    list: [
      { pagePath: 'pages/index/index', text: '首页' },
    ],
  },
})
```

页面级 `src/pages/xxx/index.config.ts` = 小程序页面 json（`navigationBarTitleText`、`enablePullDownRefresh` 等）。路由跳转见[页面 Hooks 与路由](./hooks-router)。

## 三、`config/index.ts`：编译配置

```ts
// config/index.ts（节选）
export default {
  projectName: 'myApp',
  sourceRoot: 'src',        // 默认 'src'
  outputRoot: 'dist',       // 默认 'dist'
  designWidth: 750,         // 设计稿宽度，默认 750（可传函数按文件定制）
  framework: 'react',       // react / preact / nerv / vue / vue3
  compiler: 'webpack5',     // 见下

  mini: {
    // 小程序端：postcss、编译规则、baseLevel、debugReact 等
  },
  h5: {
    // H5 端：router.mode 'hash' | 'browser'、devServer、publicPath 等
  },

  defineConstants: {},      // 全局常量
  alias: {},                // 路径别名
  plugins: [],              // 插件 / presets
}
```

### `compiler`：选编译内核

```ts
// 简写
compiler: 'vite'
// 或对象形式，开启依赖预打包
compiler: { type: 'webpack5', prebundle: { enable: true } }
```

- 可选 `'webpack4' | 'webpack5' | 'vite'`。
- **Vite 自 Taro v4.0 起支持**，冷启动 / HMR 更快。
- **纯血鸿蒙 C-API 仅支持 Vite**（见[纯血鸿蒙三路线](./harmony)）。

### 其它常用项

- `mini`：小程序端 `postcss`、编译规则、`baseLevel`、`debugReact`。
- `h5`：`router.mode`（`'hash'` / `'browser'`）、`devServer`、`publicPath`。
- `defineConstants`（全局常量）、`env`（环境变量，业务里用整体 `process.env.NODE_ENV`，**勿解构**）、`alias`（路径别名）、`sass`（资源注入）、`copy`、`cache`（webpack5 持久缓存，默认关）。
- 压缩：`jsMinimizer`（`terser` / `esbuild`）、`cssMinimizer`（`csso` / `esbuild` / `parcelCss`）。

## 四、CompileMode（编译模式）

Taro 4 小程序端的性能优化特性：把部分本可静态确定的运行时逻辑**在编译期静态化**（混合编译），从而减少运行时 `setData` 数据量与递归模板开销——相当于在「重运行时」模型里局部找回「编译时」的性能红利（运行时原理见[架构演进](./architecture)）。

## 五、CLI 命令

```bash
npm i -g @tarojs/cli          # 安装（或 npx @tarojs/cli init myApp）
taro init myApp               # 交互选 框架(React/Vue3)/模板(default/NutUI...)

# 通用命令
taro build --type weapp --watch     # 微信小程序（= dev:weapp）
taro build --type h5                # H5
taro build --type rn                # React Native
taro build --type harmony_cpp       # 纯血鸿蒙 C-API（仅 Vite）
```

- **`dev` = `build --watch`**；`build` 去掉 `--watch` 并压缩；开发态想压缩需 `NODE_ENV=production`。
- ⚠️ **CLI 版本必须与项目依赖版本一致**，否则编译报错。
- Node 要求 **>= 16.20.0**（Windows 部分特性用 Rust，需装 VC++ Redist）。

## 六、样式与尺寸

- 设计稿宽默认 **750**，用 **`rpx`** 单位书写，编译期由 **`pxtransform`**（PostCSS）按目标端换算成对应单位；`designWidth` 可传**函数**按文件定制（如引入第三方 UI 库时按目录区分）。
- **Vue 的 `scoped` 样式在小程序端不支持**——改用 **CSS Modules** 做样式隔离（见[开发模型](./react-model)）。

## 七、生态速记

- **UI 库**：**NutUI**（京东，Vue3，多端，官方推荐模板之一）、**Taro UI**（官方 React 系）、**Taroify**（Vant 的 Taro 版）、`@antmjs/vantui`（React + Vant）。
- **状态管理**：Redux、**Pinia**（`taro-plugin-pinia`）、Mobx。
- **物料市场**：`taro-ext.jd.com`（插件 / 组件 / 模板）。
- **插件**：Tailwind CSS 插件、骨架屏、编译加速（多核 / 缓存）、`taro-hooks`、`tarojs-router-next`（类型安全路由）。
