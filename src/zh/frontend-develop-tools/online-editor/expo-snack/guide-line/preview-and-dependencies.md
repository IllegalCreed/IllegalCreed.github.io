---
layout: doc
outline: [2, 3]
---

# 预览机制与依赖限制

> 基于 snack.expo.dev 与 Expo 官方文档 2025–2026 现状编写

## 速查

- **架构**：hub-and-spoke，**snack-sdk** 为中枢，协调 website（前端 + Monaco）、snackager（打包）、runtime（执行）
- **runtime 两形态**：Expo Go **原生 runtime**（真机/模拟器）+ 浏览器 **web-player**；底层用 **SystemJS** 动态加载模块
- **实时同步**：snack-sdk 经 **SnackPub（pub/sub 发布订阅）** 把改动去抖后广播给所有已连接客户端；日志 / 报错同通道回流编辑器
- **依赖打包**：第三方 npm 包由 **Snackager**（`snackager.eascdn.net`，Webpack + RN preset）云端转译打包，首次请求后缓存
- **永久外置**：`react`、`react-native`、`expo` **永不打进 bundle**，由 runtime 提供；`@expo/vector-icons`、`expo-constants` 等常用包也预置 / 外置
- **能装什么**：纯 JS 包 + Expo SDK 自带的原生模块；格式 `name` 或 `name@version`
- ⚠️ **版本省略 ≈ `expo install`**：不取 latest，而是取与所选 SDK **兼容**的版本
- ⚠️ **NPM 缓存延迟**：新发布的版本**最多 60 分钟**才在 Snack 可用（可 `bypassCache=true` 绕过）
- **SDK 版本**：URL/嵌入参数 `sdkVersion` 可指定；**不指定用最新已发布的 Expo SDK**
- 🔴 **核心限制**：跑在 Expo Go 预置 runtime，**装不了需要自定义原生代码 / config plugin 的库**
- **文档**：<https://github.com/expo/snack/blob/main/docs/dependencies-bundling.md>

## 预览机制：代码怎么跑起来的

Snack 内部是一个 **hub-and-spoke（中枢辐射）** 架构，中枢是 **snack-sdk**，它编排四个组件：

| 组件          | 角色                                                                 |
| ------------- | -------------------------------------------------------------------- |
| **website**   | `snack.expo.dev` 前端：React + **Monaco 编辑器** + Koa 服务端         |
| **snack-sdk** | 状态管理 / 会话编排（npm 包，外部也可用来做自定义 Snack 体验）        |
| **snackager** | 打包服务（`snackager.eascdn.net`，Webpack + S3 缓存）                |
| **runtime**   | 执行环境，分 Expo Go **原生 runtime** 与浏览器 **web-player** 两种    |

runtime 的官方定义：「Snack runtime 是一个加载并运行 Snack 代码的 Expo App……它有两种形态：给 Expo Go 用的原生 runtime，和在浏览器里跑 Snack 的 web-player。」两者底层都用 **SystemJS** 在运行时动态加载模块——这也是为什么 Snack 能不重新整体打包就「热替换」你刚改的代码。

### 实时同步：SnackPub

三端预览之所以能跟编辑器保持一致，靠的是 **SnackPub** —— 一套实时**发布订阅（pub/sub）** 通道：

- 你在编辑器里每敲一次键，改动**去抖**后由 snack-sdk 通过 SnackPub **广播**给所有已连接的客户端（web-player / 模拟器 / 真机 Expo Go）。
- 去抖是为了避免高频改动**冲垮设备**。
- 反向：客户端的 `console` 输出和运行时报错，通过**同一通道回流**到编辑器的日志面板。

::: tip 真机连接的两种方式
登录同一 Expo 账号后，已连接的设备会自动出现在「My Device」列表；也可以直接用 Expo Go 扫二维码连接。多台设备 / 多个客户端可同时连同一个 Snack 一起预览。
:::

## 依赖：Snackager 与外置策略

Snack 允许你直接加 npm 依赖——在编辑器里写 `import`，或在 **Dependencies 面板**里添加，格式是 `name` 或 `name@version`：

```
expo-image-picker
lodash@4
react-native-paper@5.0.0
```

这些第三方依赖由 **Snackager** 处理：

- **按需打包**：第一次请求某个 `包@版本` 组合时，Snackager 用 **Webpack + react-native preset** 转译打包，之后请求直接返回**缓存**的 bundle。
- **外置（externalize）降体积**：`react`、`react-native`、`expo` **永远不会打进 bundle**——它们由 runtime 直接提供。`@expo/vector-icons`、`expo-constants` 等常用包也由 runtime 预置 / 外置。只有你引入的第三方依赖才会被真正打包。
- **缺失 peer 依赖提示**：当你加的包（如 `@react-navigation/stack`）缺少 peer 依赖时，Snack 会在 `missingDependencies` 里报告缺哪个、期望什么版本。

::: warning 版本省略 ≈ `expo install`，不是 latest
依赖的版本号可以省略。**省略时 Snack 不会取 latest**，而是取与你当前所选 **Expo SDK 兼容**的版本——行为等同 `expo install`。如果你需要某个精确版本，务必显式写 `name@version`。
:::

### NPM 缓存延迟：最多 60 分钟

::: warning 新版本发布后不会立刻在 Snack 可用
你把一个新版本发布到 NPM 后，Snackager 因为缓存了 NPM 解析结果，**最多需要 60 分钟**这个新版本才会在 Snack 里可用。

需要立即用时，可手动请求并绕过缓存：

```bash
curl "https://snackager.eascdn.net/bundle/[name]@[version]?platforms=ios,android,web&version_snackager=true&bypassCache=true"
```
:::

## 核心限制：只能 JS + Expo 自带原生模块

这是 Snack 最重要、也最容易踩坑的一点。

::: danger Snack 跑在 Expo Go 的预编译 runtime
官方原话：「有些库在 Snack 上跑不了，即便用 CLI 时完全正常——因为代码打包方式不同。」

**根因**：Snack 在真机上跑在 **Expo Go 的预编译 runtime**（web 上跑 web-player）。因此它**只能使用**：

- **纯 JS 包**，以及
- **Expo Go 里已经编译进去的那批原生模块**（即 Expo SDK 自带的原生能力）。

**任何需要自定义原生代码 / config plugin / 链接原生库的包，都不能在 Snack 里跑**——因为那要求重新编译原生二进制（development build），而 **Snack 不构建二进制**。需要这类能力，必须落到本地项目 + EAS Build / custom dev client（详见「嵌入与边界」一章）。
:::

记忆口诀：**「build 通过的本地库」不等于「Snack 能跑」**——打包方式不同，依赖原生编译的库会在 Snack 失败。

### 资源（assets）

图片、字体等资源可通过 `files` 参数以 `type: 'ASSET'`（外链 URL）引入；编辑器内也可直接上传资源文件。详细的 `files` JSON 结构见「参考」页。

## SDK 版本

Snack 跟随 Expo SDK 持续滚动升级：

- 用 URL / 嵌入参数 **`sdkVersion`**（如 `sdkVersion=54.0.0`）指定 Expo SDK 版本；
- **不指定则使用最新已发布的 Expo SDK 版本**。
- 切换 SDK 版本会影响：可用的 Expo 模块 API，以及依赖的兼容版本解析（同 `expo install` 按 SDK 选兼容版）。
- 新 SDK 通常在 beta 阶段就接入 Snack 测试，稳定后切为可选。

::: tip 具体默认 SDK 号以官方为准
Snack 当前的默认 SDK 具体号会随 Expo 发布节奏变动，本页不写死某个数字。需要确认时，直接打开 <https://snack.expo.dev/> 看版本选择器即可。
:::
