---
layout: doc
---

# Expo Skills

Expo Skills（`expo/skills`）是 Expo 官方团队出品的一组 AI agent 技能集，专门用于**构建、部署、升级、调试 Expo 应用**以及 **EAS（Expo Application Services）**，MIT 开源。它把 Expo 工程团队关于「何时用哪个 Expo/EAS API、常见工作流怎么搭、Expo/React Native/iOS/Android 有哪些约束」的知识，打包成 agent 按任务自动选取的 `SKILL.md`。技能分两组、边界清晰：**Framework（开源免费）** 14 个（Expo Router、原生 UI、数据获取、native module、DOM、跨端迁移等），**Services & paid distribution（用付费 EAS）** 6 个（Build/上架、Hosting、Workflows、Observe、Update Insights、Simulator）。官方强调：**Expo 文档、Expo CLI、EAS CLI 才是唯一事实来源（source of truth）**，技能只是帮 agent 正确地应用它们。

## 评价

**优点**

- **官方出品、覆盖全生命周期**：由 Expo 团队维护，从建应用、写原生模块到 EAS 上架/OTA/监控一条龙，非社区拼凑
- **免费/付费边界明确**：两组分开——Framework 组全开源免费；Services 组每个技能开头都有 `EAS service - costs apply` 成本提示，指向 expo.dev/pricing
- **配套 Expo MCP server**：技能教 agent「怎么做」，MCP 给它「实际去做」的能力——按需读最新 Expo 文档、`npx expo install` 装兼容依赖、触发/监控 EAS 构建与工作流、拉 TestFlight 崩溃数据、给运行中的模拟器截图；`expo` 插件安装时自动接线
- **跨 agent**：Claude Code / Codex 用官方插件（自动更新），Cursor/OpenCode/Copilot/Windsurf 等用 Skills CLI（`npx skills add`）
- **技能自带触发条件**：每个 `SKILL.md` 的 `description` 写明「Use when…」，agent 按任务上下文自动选取，无需手动指定
- **反模式沉淀**：如 API 路由何时该用/不该用、DOM 组件何时该用/不该用、`_layout` 不能是 DOM 组件、路由目录禁止 co-locate 组件等踩坑

**缺点 / 边界**

- **强绑 Expo/React Native 生态**：只服务 Expo 项目，非通用移动或前端技能
- **Services 组需付费 + 账号**：EAS Build/Submit 消耗构建分钟，上架还需付费 Apple Developer / Google Play 账号
- **非事实来源**：技能是「怎么用」的指引，具体 API 以 Expo 官方文档/CLI 为准（Expo/EAS 演进快，技能可能滞后）
- **部分 experimental**：如 `eas-simulator` 的 `simulator:*` 命令是实验性隐藏命令，flag/verb 可能变

## 适用场景

- 用 AI agent 开发 Expo 应用——建路由、写原生 UI、集成数据获取、写 native module
- 用 EAS 部署——出生产包、上 App Store/Play Store/TestFlight、部署 Expo 网站与 API 路由、写 CI/CD 工作流
- OTA 更新健康度监控、生产性能观测、远程模拟器验证
- 把已有 Web React 应用（Next.js/Vite/CRA）增量迁移成原生应用，或把 Expo/RN 塞进已有原生 app
- 升级 Expo SDK、修依赖冲突

## 边界

- **不是单个技能，是官方技能集**：20+ 技能各有触发条件，按需自动激活
- **不是事实来源**：Expo 文档 / Expo CLI / EAS CLI 才是；技能教 agent 正确应用它们
- **Framework vs Services**：免费开源 vs 用付费 EAS，两组分明
- **技能 ≠ MCP**：技能是知识（怎么做），Expo MCP server 是能力（实际去做），二者配套但不同

## 官方文档

[Expo Skills 文档](https://docs.expo.dev/skills/) ｜ [Expo × Claude Code](https://docs.expo.dev/agents/claude/) ｜ [Expo MCP server](https://docs.expo.dev/eas/ai/mcp/) ｜ [skills.sh · expo/skills](https://skills.sh/expo/skills)

## GitHub 地址

[expo/skills](https://github.com/expo/skills)（MIT · Expo 官方）

## 内容地图

- [入门](./getting-started) —— 官方定位、三路安装、Expo/EAS 是什么、20+ 技能总览
- [指南](./guide-line) —— EAS 类技能（build/hosting/workflows/observe/update-insights/simulator）、Expo 类技能（router/data-fetching/dev-client/dom/module/native-ui/brownfield/app-clip）、反模式
- [参考](./reference) —— 全技能清单表、安装、MCP、EAS/Expo 关键点、版本、许可、链接

## 幻灯片地址

<a href="/SlideStack/expo-skills-slide/" target="_blank">Expo Skills</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=PENDING" target="_blank" rel="noopener noreferrer">Expo Skills 测试题</a>

> 测试题链接待生产库分类导入、获得真实数字叶节点 ID 后回填。
