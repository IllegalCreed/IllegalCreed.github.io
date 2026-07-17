---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 expo/skills 官方 skills 仓库主分支（2026-07）的 README、AGENTS.md 与各 `plugins/expo/skills/*/SKILL.md` 编写；具体 API 以 Expo 官方文档为准。

## 速查

- **是什么**：Expo 官方团队的 AI agent 技能集，用于构建/部署/升级/调试 Expo 应用 + EAS；MIT
- **装（Claude Code）**：`claude plugin install expo@claude-plugins-official`（或 `/plugin install expo@claude-plugins-official`）
- **装（Codex）**：`codex plugin add expo@openai-curated`
- **装（其它 agent）**：`npx skills@latest add expo/skills --skill '*'`（Cursor/OpenCode/Copilot/Windsurf/Gemini/Cline 等）
- **两组**：Framework（开源免费）14 个 · Services & paid（用付费 EAS）6 个 · 另有 `expo-skill-feedback`
- **事实来源**：Expo 文档 / Expo CLI / EAS CLI——技能只是帮 agent 正确应用它们
- **配套**：Expo MCP server（`expo` 插件自动接线），给 agent 实际执行能力
- **触发**：装后自动激活（agent 按任务匹配 `SKILL.md` 的「Use when…」），也可直接说「Build an Expo Router screen with tabs」

## 官方定位

Expo Skills 由 **Expo 团队官方**维护。它的目标不是替代 Expo 文档，而是给 AI agent「聚焦的 Expo 知识」：什么时候用哪个 Expo API、常见工作流怎么组织、哪些 Expo / EAS / React Native / iOS / Android 约束要注意。README 反复强调：

> Expo documentation, Expo CLI, and EAS CLI remain the source of truth; these skills help agents apply them correctly.

即**技能是「怎么用」的指引，不是 API 的权威**——具体值以官方文档和 CLI 为准，因为 Expo/EAS 演进很快。

## 安装

按 agent 选路径。Claude Code / Codex 用官方插件，更新走各自插件市场；其它 agent 用 Skills CLI。

```bash
# Claude Code（官方插件市场，自动更新）
claude plugin install expo@claude-plugins-official
# 或在 Claude Code 内：/plugin install expo@claude-plugins-official

# Codex（OpenAI 精选市场）
codex plugin add expo@openai-curated

# 其它 agent：Skills CLI 一次装全部 Expo 技能
npx skills@latest add expo/skills --skill '*'
```

`--skill '*'` 选中每个 Expo 技能但不选每个 agent；CLI 仍会问装到哪；`--agent <agent>` 可直接指定。从项目根目录跑，装完刷新/重启 agent 会话让它发现 `SKILL.md`。

**更新**：插件安装走市场更新；Skills CLI 安装用 `npx skills@latest update`（单个：`npx skills@latest update expo-router`）。

## Expo / EAS 是什么

- **Expo**：基于 React Native 的开源框架 + 工具链，Expo Router 提供文件式路由，`npx expo` 是 CLI；开发时先用 **Expo Go**（免费 playground），需要自定义原生代码再建 dev client。
- **EAS（Expo Application Services）**：Expo 的**付费云服务**（有免费额度），提供 Build（云构建）、Submit（上架）、Update（OTA 热更）、Hosting（部署 Web + API 路由）、Workflows（CI/CD）、Observe（性能观测）、Simulator（远程模拟器）等。Services 组技能每个开头都有成本提示。

## 20+ 技能总览

分两组，免费 vs 付费边界清晰。

**Framework（开源免费）**

| 技能 | 用来做 |
| --- | --- |
| `expo-project-structure` | 新 Expo 应用的目录结构（`src/`、routes-only `app/`、screens、server） |
| `expo-router` | 文件式路由、Link、native Stack、模态/表单 sheet、NativeTabs、headers |
| `expo-native-ui` | 原生观感屏幕：语义色、控件、SF Symbols、动画、视觉效果 |
| `expo-ui` | `@expo/ui` 原生组件（真 SwiftUI / Jetpack Compose） |
| `expo-data-fetching` | 网络请求、React Query/SWR、缓存、离线、Router 数据加载器 |
| `expo-tailwind-setup` | Tailwind v4 + react-native-css + NativeWind v5 |
| `expo-dom` | DOM 组件：原生里渐进用 Web 代码 |
| `expo-web-to-native` | 把已有 Web React 应用迁成原生 |
| `expo-module` | 写 Expo 原生模块/视图（Swift/Kotlin/TS） |
| `expo-brownfield` | 把 Expo/RN 塞进已有原生 iOS/Android app |
| `expo-dev-client` | 开发客户端（本地免费，EAS/TestFlight 付费） |
| `expo-examples` | `expo/examples` 的 ~70 个 `with-*` 集成范例 |
| `expo-app-clip` | iOS App Clip 目标、AASA、Smart App Banner |
| `expo-upgrade` | 升级 Expo SDK、修依赖冲突、清缓存 |

**Services & paid distribution（用付费 EAS）**

| 技能 | 用来做 |
| --- | --- |
| `eas-app-stores` | 生产构建 + 上 App Store/Play Store/TestFlight、`eas.json` profiles |
| `eas-hosting` | 部署 Expo 网站 + Router API 路由到 EAS Hosting（Cloudflare Workers） |
| `eas-workflows` | EAS Workflow YAML、CI/CD 自动化 |
| `eas-observe` | EAS Observe：启动/导航/自定义事件性能观测 |
| `eas-update-insights` | EAS Update 健康度：崩溃率、启动数、embedded/OTA 分布 |
| `eas-simulator` | EAS 云上远程 iOS 模拟器 / Android 模拟器 |

> 另有 `expo-skill-feedback`（遥测反馈，默认关，Claude Code 才有）。

## 上手一试

装完后直接对 agent 说 Expo 相关任务，它会自动选技能：

```text
Build a native-feeling Expo Router screen with tabs, modals, and animations.
Set up Tailwind CSS v4 and NativeWind v5 in this Expo app.
Create an EAS workflow that builds previews on pull requests.
Help me upgrade this app to the latest Expo SDK.
Check whether this EAS Update rollout is healthy.
```

## 下一步

- [指南](./guide-line) —— EAS 类与 Expo 类技能逐个深入、反模式
- [参考](./reference) —— 全技能表 + 安装 + MCP + EAS/Expo 关键点
