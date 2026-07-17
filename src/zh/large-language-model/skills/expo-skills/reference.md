---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 expo/skills README、AGENTS.md 与各 `SKILL.md` 编写；具体 API 以 Expo 官方文档 / Expo CLI / EAS CLI 为准。

## 速查

- **仓库**：`expo/skills`（MIT · Expo 官方）；文档 docs.expo.dev/skills
- **装**：Claude Code `claude plugin install expo@claude-plugins-official` · Codex `codex plugin add expo@openai-curated` · 其它 `npx skills@latest add expo/skills --skill '*'`
- **20+ 技能**：14 Framework（开源）+ 6 Services（付费 EAS）+ `expo-skill-feedback`
- **每技能**：`SKILL.md`（frontmatter `name`/`description`/`version`/`license`，多数 MIT）+ 可选 `references/` + `scripts/`
- **配套**：Expo MCP server（`expo` 插件自动接线）
- **事实来源**：Expo 文档 / Expo CLI / EAS CLI

## 全技能清单

### Framework（开源免费）

| 技能 | 触发场景 | 覆盖 |
| --- | --- | --- |
| `expo-project-structure` | 新建 Expo 项目、决定文件放哪 | `src/` 布局、routes-only `app/`、screens、server（仅新项目） |
| `expo-router` | 导航路由 | 文件式路由、Link、native Stack、模态/sheet、NativeTabs、headers、搜索栏 |
| `expo-native-ui` | 原生观感屏幕样式 | 语义色、控件、SF Symbols、Reanimated 动画、blur/液态玻璃、渐变、存储 |
| `expo-ui` | `@expo/ui` 原生组件树 | 通用组件（SDK 56+）、SwiftUI/Compose 平台特定、drop-in 替代 |
| `expo-data-fetching` | 任何网络/API/数据获取 | fetch、React Query、SWR、缓存、离线、Router loaders；优先 expo/fetch |
| `expo-tailwind-setup` | Tailwind 样式 | Tailwind v4 + react-native-css + NativeWind v5 |
| `expo-dom` | 原生里用 Web 代码 | `'use dom';`、Web-only 库、渐进迁移 |
| `expo-web-to-native` | Web 应用迁原生 | 端到端迁移（Next.js/Vite/CRA），strangler-fig，编排其它技能 |
| `expo-module` | 写原生模块/视图 | Expo Modules API（Swift/Kotlin/TS）、DSL、config plugin、autolinking |
| `expo-brownfield` | 塞进已有原生 app | isolated（AAR/XCFramework）vs integrated（Gradle/CocoaPods） |
| `expo-dev-client` | 开发客户端 | dev client 构建/分发（本地免费，EAS/TestFlight 付费） |
| `expo-examples` | 集成第三方库 | `expo/examples` ~70 个 `with-*` 范例，adapt 或 scaffold |
| `expo-app-clip` | iOS App Clip | `targets/clip/`、AASA、associated domains、Smart App Banner |
| `expo-upgrade` | 升 SDK / 修依赖 | `expo install --fix`、`expo-doctor`、React 19/New Arch/迁移 |

### Services & paid distribution（用付费 EAS）

| 技能 | 触发场景 | 覆盖 |
| --- | --- | --- |
| `eas-app-stores` | 上架、生产构建 | App Store/Play/TestFlight、`eas.json` profiles、版本号、ASO |
| `eas-hosting` | 部署 Web + API 路由 | `expo export -p web` + `eas deploy`、`+api.ts`、密钥、域名、Cloudflare Workers |
| `eas-workflows` | CI/CD | `.eas/workflows/*.yml`、JSON Schema 校验、pre-packaged jobs |
| `eas-observe` | 生产性能观测 | `expo-observe`、`eas observe:*`、冷/热启动、TTR/TTI |
| `eas-update-insights` | OTA 健康度 | 崩溃率、启动数、payload、embedded vs OTA；`eas update:insights` |
| `eas-simulator` | 云模拟器 | 远程 iOS/Android 模拟器、CLI/agent/浏览器驱动（实验性） |

> `expo-skill-feedback`：遥测反馈技能，**默认关**，仅 Claude Code；`EXPO_SKILLS_TELEMETRY=1` 开、`=0` / `DO_NOT_TRACK=1` 关；只发匿名事件（技能名/平台/随机安装 id 哈希），不发代码/prompt/路径/个人数据。

## 安装与更新

```bash
# Claude Code（插件市场，自动更新）
claude plugin install expo@claude-plugins-official
# Codex
codex plugin add expo@openai-curated
# 其它 agent（Cursor/OpenCode/Copilot/Windsurf/Gemini/Cline/AMP…）
npx skills@latest add expo/skills --skill '*'      # 一次装全部
npx skills@latest update                            # 更新（单个：update expo-router）
```

## Expo MCP server

技能教 agent「怎么做」，[Expo MCP server](https://docs.expo.dev/eas/ai/mcp/) 给它「实际去做」的能力：

- 按需读最新 Expo 文档
- `npx expo install` 装兼容依赖
- 触发并监控 EAS 构建与工作流
- 从 TestFlight 拉崩溃数据
- 给模拟器里运行的 app 截图

`expo` 插件捆绑这份 MCP 配置——Claude Code / Codex 插件安装时自动接线；其它 agent 按 MCP setup guide 单独加。

## EAS CLI 关键命令

| 命令 | 用途 |
| --- | --- |
| `npx eas-cli@latest init` | 初始化项目、生成 `eas.json` |
| `eas build -p ios --profile production` | 云构建生产包 |
| `eas submit -p ios` | 提交 App Store Connect |
| `eas deploy` | 部署 Web + API 路由到 EAS Hosting |
| `eas update:insights <groupId>` | 查 OTA 更新健康度 |
| `eas observe:metrics-summary` | 生产性能指标汇总 |
| `npx --yes eas-cli@latest simulator:start` | 启动云模拟器会话（实验性） |

## Expo CLI 关键点

- 开发先用 **Expo Go**（`npx expo start` 扫码）；需自定义原生代码再建 dev client 或 `npx expo run:ios/android`
- 升级：`npx expo install expo@latest` + `npx expo install --fix`，再 `npx expo-doctor`
- 数据获取优先 **expo/fetch**（避免 axios）
- 路由目录 `app/` 只放路由，文件名 kebab-case，禁 co-locate 组件

## 版本与许可

- **许可**：MIT（多数技能 `SKILL.md` 标 `license: MIT`）
- **出品**：Expo 官方团队；★2.2k
- **事实来源**：Expo 文档 / Expo CLI / EAS CLI——技能可能滞后于文档
- **SDK 相关**：`@expo/ui` 通用层需 SDK 56+；EAS Observe 根组件 SDK 55 用 `AppMetricsRoot`、SDK 56+ 用 `ObserveRoot`

## 资源链接

- 仓库：[expo/skills](https://github.com/expo/skills)
- 文档：[docs.expo.dev/skills](https://docs.expo.dev/skills/)
- Claude Code 集成：[docs.expo.dev/agents/claude](https://docs.expo.dev/agents/claude/)
- MCP：[docs.expo.dev/eas/ai/mcp](https://docs.expo.dev/eas/ai/mcp/)
- skills.sh：[skills.sh/expo/skills](https://skills.sh/expo/skills)
- 定价：[expo.dev/pricing](https://expo.dev/pricing)
