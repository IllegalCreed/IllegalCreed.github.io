---
layout: doc
---

# Deno Skills

Deno Skills（`denoland/skills`）是 Deno 官方（denoland org）出品的一组 AI 编码助手技能集，主题为「Modern Deno skills for AI coding assistants」，MIT 开源（★88）。它把现代 Deno 开发知识——JSR 导入、`deno.json` 配置、CLI 工具、Fresh 2.x 前端、Deno Deploy 新版部署、`@deno/sandbox` 沙箱、项目脚手架、专家级代码审查——打包成 6 个可按需调用的 Agent Skill，遵循 [agentskills.io](https://agentskills.io/specification) 开放规范，装进 Claude Code / Cursor / VS Code Copilot 等后，让 AI 助手在 Deno 项目里自动应用当前最佳实践。它的一大价值是**纠正 LLM 的过时习惯**：默认改用 JSR、禁止写废弃的 URL 式导入、坚持 Fresh 2.x 模式、部署一律用新的 `deno deploy` CLI 而非弃用的 `deployctl`。

## 评价

**优点**

- **官方权威**：出自 denoland org（Deno 团队本身），非社区二手总结，规则跟随官方文档演进
- **纠偏 LLM 过时习惯**：强 guardrail 设计——反复强调 JSR 优先、明令禁止写废弃的 `deno.land/x` URL 式导入、坚持 Fresh 2.x（非 1.x）、部署用 `deno deploy`（非弃用 `deployctl`）
- **覆盖全栈**：6 skills 从 runtime（deno-guidance）→ 前端（deno-frontend/Fresh）→ 部署（deno-deploy）→ 沙箱（deno-sandbox）→ 脚手架（deno-project-templates）→ 审查（deno-expert）
- **最新知识点**：`deno deploy` 是内建于 Deno CLI 的现代命令（需 Deno ≥ 2.4.2），技能明确要求弃用 `deployctl`——纠正大量训练数据里的旧写法
- **作用域克制**：每个 skill 都写了 Scope Boundaries——只在 Deno 项目或用户明确问 Deno 时激活，不对 Node/Bun/Python 硬推 Deno
- **审查即规范**：deno-expert 当「Deno 代码评审器」用，每次涉及 Deno 代码都提醒 `deno fmt`/`deno lint`/`deno test`

**缺点 / 边界**

- **仅 Deno 生态**：只服务 Deno；Node.js、Bun、其它 runtime 不适用（技能本身也明确不硬推 Deno）
- **`deno deploy` 有版本门槛**：需 Deno ≥ 2.4.2；旧版本用不了新命令
- **Fresh 仍在演进**：Fresh 2.x 稳定版与 `2.0.0-alpha.*` 有 `dev.ts` vs `vite.config.ts` 等差异，需看 `deno.json` 判断
- **部分绑 Deno Deploy 平台**：deno-deploy / deno-sandbox 的托管能力依赖 Deno Deploy 账号与平台
- **是规范不是代劳**：技能提供指令与最佳实践，业务逻辑仍靠你写

## 适用场景

- 用 AI 助手从零建 Deno 应用（选包、配 `deno.json`、跑 CLI）
- 建 Fresh 2.x 前端（文件路由 + island 架构 + Preact + Tailwind）
- 部署到 Deno Deploy（新 `deno deploy` CLI、env + KV 数据库、tunnel 本地联调）
- 建代码沙箱 / playground / AI agent 工具执行（`@deno/sandbox`）
- 脚手架新项目（Fresh Web / CLI / 库 / API server）
- 让 AI 按现代 Deno 规范审查、调试代码

## 边界

- **不是单个技能，是官方技能集**：6 个 skill 各有 `Use when…` 触发条件，按需激活
- **只在 Deno 语境激活**：技能的 Scope Boundaries 要求非 Deno 问题直接答，不掺 Deno
- **Deploy/Sandbox 绑平台**：与 Deno Deploy 账号强相关
- **审查给输入，取舍靠人**：deno-expert 报出的清单是参考，最终判断在你

## 官方文档

[Deno 文档](https://docs.deno.com) ｜ [Fresh 框架](https://fresh.deno.dev/docs) ｜ [JSR 包注册表](https://jsr.io) ｜ [Deno Deploy](https://docs.deno.com/deploy/) ｜ [Agent Skills 规范](https://agentskills.io/specification)

## GitHub 地址

[denoland/skills](https://github.com/denoland/skills)（MIT）

## 内容地图

- [入门](./getting-started) —— 官方定位、安装（clone + 拷贝 / 插件）、6 skills 总览、Deno/JSR/Fresh 核心概念
- [指南](./guide-line) —— 6 skills 逐个深入（guidance/deploy/frontend/expert/templates/sandbox）、反模式、作用域机制
- [参考](./reference) —— 6 skills 全表、deno CLI/JSR、Fresh 2.x、`deno deploy` 命令、安装、许可、链接

## 幻灯片地址

<a href="/SlideStack/deno-skills-slide/" target="_blank">Deno Skills</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=PENDING" target="_blank" rel="noopener noreferrer">Deno Skills 测试题</a>

> 测试题链接待生产库分类导入、获得真实数字叶节点 ID 后回填。
