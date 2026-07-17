---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 expo/skills 各 `plugins/expo/skills/*/SKILL.md` 编写；具体 API 以 Expo 官方文档 / Expo CLI / EAS CLI 为准。

## 速查

- **两组**：EAS 服务类（付费）+ Expo 框架类（开源）
- **EAS 类**：`eas-app-stores`（上架）·`eas-hosting`（Web+API 路由）·`eas-workflows`（CI/CD YAML）·`eas-observe`（性能观测）·`eas-update-insights`（OTA 健康）·`eas-simulator`（云模拟器）
- **Expo 类**：`expo-router`（路由）·`expo-native-ui`/`expo-ui`（原生 UI）·`expo-data-fetching`（网络）·`expo-dom`（Web 代码入原生）·`expo-module`（原生模块）·`expo-brownfield`（塞进已有原生）·`expo-dev-client`（开发客户端）·`expo-app-clip`（App Clip）
- **反模式**：`app/` 目录禁 co-locate 组件、`_layout` 不能是 DOM 组件、API 路由何时该/不该用、native 性能关键处别用 webview
- **成本提示**：每个 EAS 技能开头都有 `EAS service - costs apply`，指向 expo.dev/pricing

## EAS 服务类技能（付费）

这组的核心目的用到付费的 Expo Application Services，每个 `SKILL.md` 开头都有醒目的成本警告。

### eas-app-stores：出生产包 + 上架

覆盖用 EAS 把 Expo 应用发到 iOS App Store、Google Play、TestFlight：`eas.json` 的 build/submit profiles、版本号与 build number、App Store 元数据与 ASO。

```bash
npm install -g eas-cli && eas login
npx eas-cli@latest init            # 生成 eas.json
npx eas-cli@latest build -p ios --profile production
npx eas-cli@latest submit -p ios   # 提交到 App Store Connect
```

需付费 Apple Developer / Google Play 账号，`build`/`submit` 消耗构建分钟。部署 **Web/API 路由**不归它，归 `eas-hosting`。

### eas-hosting：部署 Web + Router API 路由

把 Expo **网站和 API 路由**部署到 Expo 托管边缘（Cloudflare Workers）：`npx expo export -p web` 导出 Web 包，`eas deploy` 发布（同一命令连带部署 Router 的 API 路由），管理环境密钥、自定义域名。

API 路由放在 `app` 目录、用 `+api.ts` 后缀，按 HTTP 方法导出函数：

```ts
// app/api/hello+api.ts  →  GET /api/hello
export function GET(request: Request) {
  return Response.json({ message: "Hello from Expo!" });
}
```

**何时该用 API 路由**：服务端密钥、数据库直查、第三方 API 代理（藏 key）、Webhook、服务端校验、限流、重计算。**何时不该用**：数据已公开、无需密钥、要实时更新（用 WebSocket）、简单 CRUD（用 Firebase/Supabase/Convex）、纯认证（用 Clerk/Auth0）。导出与写 API 路由免费、可自托管；EAS Hosting 生产部署付费。

### eas-workflows：CI/CD YAML

帮你写/校验 EAS Workflow YAML。工作流放在 `.eas/workflows/*.yml`，顶层键：`name` / `on`（触发器，至少一个）/ `jobs`（必需）/ `defaults` / `concurrency`。动态值用 <code v-pre>${{ }}</code> 表达式语法，可用上下文由 schema 定义。

```yaml
# .eas/workflows/build-preview.yml
name: Build preview
on:
  pull_request: {}
jobs:
  build:
    type: build
    params:
      platform: ios
      profile: preview
```

技能强调**不要靠记忆里的值**：先用它 `scripts/fetch.js` 拉三份权威资源——JSON Schema（`api.expo.dev/v2/workflows/schema`，校验的事实来源）、语法文档、pre-packaged jobs 文档，再生成/校验。表达式 <code v-pre>${{ }}</code> 建议写在 YAML 代码块里，可读取 `github`、`env`、job outputs 等上下文。

### eas-observe：生产性能观测

EAS Observe 追踪生产 Expo 应用的启动、导航、自定义事件性能。集成 `expo-observe`：SDK 55 用 `AppMetricsRoot`、SDK 56+ 用 `ObserveRoot` 包裹根布局；`markInteractive()`（SDK 55 全局 / SDK 56+ 经 `useObserve()` hook）标记可交互；可选 Expo Router / React Navigation 集成做逐路由指标；`Observe.logEvent` 自定义事件。CLI 查询：

```bash
eas observe:metrics-summary
eas observe:metrics   # 冷/热启动、TTR、TTI、导航 TTR、更新下载
eas observe:routes
eas observe:events
eas observe:versions
```

### eas-update-insights：OTA 更新健康度

查已发布 EAS Update 的健康：崩溃率、安装/启动数、独立用户、payload 大小、以及每个 channel 的 **embedded（内嵌构建）vs OTA** 用户分布。数据同 expo.dev 页面，命令行以人读/JSON 形式暴露，可用来给 CI 加更新健康门禁。

```bash
eas update:list --all --json --non-interactive | jq -r '.currentPage[0].group'
eas update:insights <groupId>          # 逐平台启动、失败、崩溃率、独立用户、payload
eas channel:insights --channel production --runtime-version <version>
```

全部支持 `--json --non-interactive` 做程序化解析。它只暴露聚合指标，不给逐用户/逐设备明细。

### eas-simulator：云上远程模拟器

在 EAS 云基础设施上跑远程 iOS 模拟器 / Android 模拟器，从 CLI、AI agent（经 `agent-device`）、浏览器预览（仅 iOS）驱动。它是**本地跑不了模拟器**（Linux、CI、无 Mac 的云沙箱）的解法，也让 agent 能在真设备上*验证*改动而非只推理代码。

核心循环恒定：**start → 装应用 → drive → stop**。`simulator:*` 命令是**实验性隐藏命令**，需较新 eas-cli，故一律走 `npx --yes eas-cli@latest …`；flag/verb 可能变，`<cmd> --help` 是权威。macOS 上有本地模拟器，别为普通「在模拟器跑」自动触发它——它是为云/远程/可分享或缺失的 iOS 版本准备的。

## Expo 框架类技能（开源）

### expo-router：文件式导航

Expo Router 的导航与路由：文件式路由、groups 与动态路由、`Link`（预览 + 上下文菜单）、native Stack、页面标题、模态与表单 sheet、NativeTabs、headers 与 toolbar、header 搜索栏。约定：文件名用 kebab-case、路由放 `app` 目录、**app 目录里禁止 co-locate 组件/类型/工具（反模式）**、始终保证有匹配 `/` 的路由。屏幕样式归 `expo-native-ui`。

### expo-native-ui / expo-ui：原生观感 UI

- `expo-native-ui`：Apple HIG 风格、语义色、原生控件、SF Symbols（经 expo-image）、媒体、Reanimated 动画、视觉效果（`expo-blur` 模糊 / `expo-glass-effect` 液态玻璃）、渐变、存储（SQLite/AsyncStorage/SecureStore）。**关键：先试 Expo Go**，多数 app 无需自定义原生代码；只有用本地模块/自定义原生代码时才 `npx expo run:ios` 或 `eas build`。
- `expo-ui`：`@expo/ui` 从 React 渲染**真原生 UI**——iOS 上 SwiftUI、Android 上 Jetpack Compose。先用**通用组件**（一套树跑三端，从 `@expo/ui` 根导入，需 SDK 56+），通用层不够再降到平台特定 `@expo/ui/swift-ui`（仅 iOS）/ `@expo/ui/jetpack-compose`（仅 Android）。每棵树都要用 `Host` 包裹；还提供从 RN 社区库迁移的 drop-in 替代。

### expo-data-fetching：网络与数据获取

任何网络请求/API/数据获取都用它：fetch API、React Query、SWR、错误处理、缓存、离线（NetInfo 网络状态、`AbortController` 取消）、Expo Router 数据加载器（`useLoaderData`，Web SDK 55+）、认证/token。偏好：**避免 axios，优先 expo/fetch**。

### expo-dom：Web 代码渐进入原生

DOM 组件让 Web 代码在原生的 webview 里逐字运行、在 Web 上原样渲染，从而在 Expo 里直接用 `recharts`、语法高亮器等 Web-only 库。文件顶部加 `'use dom';` 指令即可。**何时该用**：Web-only 库（图表/高亮/富文本）、迁移已有 Web 组件、复杂 HTML/CSS 布局、iframe/embed、Canvas/WebGL。**何时不该用**：原生性能关键（webview 有开销）、简单 UI、深度原生集成、**`_layout` 文件不能是 DOM 组件**。整个 Web app 的端到端迁移用 `expo-web-to-native`。

### expo-module：写原生模块

用 Expo Modules API 建原生模块/视图（Swift/iOS、Kotlin/Android、TypeScript）：模块定义 DSL（`Name`/`Function`/`AsyncFunction`/`Property`/`Constant`/`Events`）、native views、shared objects、config plugins、生命周期 hooks、autolinking、`expo-module.config.json`。**优先 `create-expo-module`** 生成脚手架再往上搭；已有模块只需加平台时用 `create-expo-module add-platform-support`。

### expo-brownfield / expo-app-clip / expo-dev-client

- `expo-brownfield`：把 Expo/RN 加进已有原生 iOS/Android app。两种方式——**isolated**（预构建 AAR/XCFramework，原生团队无需 Node/RN 工具链）vs **integrated**（RN 源码加进已有 Gradle/CocoaPods，单团队通吃、热重载顺畅）。
- `expo-app-clip`：给 Expo 应用加 iOS App Clip 目标——`targets/clip/`、经域名上的 AASA（apple-app-site-association）文件从 URL 唤起、Smart App Banner；`bun create target clip`（装 `@bacons/apple-targets`）。Clip 的 bundle ID 由父 app 自动派生 `<parent>.clip`。AASA 须 HTTPS 提供，上架需 Apple Developer + 审核。
- `expo-dev-client`：建/分发开发客户端，在真机测原生代码改动。**本地构建免费；EAS Build/TestFlight 付费**（需付费 Apple 账号）。何时需要 dev client：本地 Expo 模块、Apple targets（widget/app clip/extension）、Expo Go 不含的第三方原生模块、config plugins、测远程推送/深链。

## 反模式速记

- **别在 `app/` 目录 co-locate** 组件/类型/工具——`app` 只放路由（`expo-router`）
- **`_layout` 不能是 DOM 组件**（`expo-dom`）
- **原生性能关键处别用 DOM/webview**——webview 有开销
- **数据已公开/无需密钥别写 API 路由**——直接 fetch（`eas-hosting`）
- **别靠记忆写 EAS Workflow**——先拉 JSON Schema 校验（`eas-workflows`）
- **macOS 上别为普通「跑模拟器」自动触发 `eas-simulator`**——那是云/远程场景（`eas-simulator`）
- **数据获取避免 axios**——优先 expo/fetch（`expo-data-fetching`）

## 下一步

- [参考](./reference) —— 全技能表 + 安装 + MCP + EAS/Expo 关键点 + 链接
- 上游：[Expo Skills 文档](https://docs.expo.dev/skills/)
