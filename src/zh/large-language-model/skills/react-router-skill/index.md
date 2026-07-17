---
layout: doc
---

# React Router Skill

React Router Skill 是 React Router 官方（remix-run）出品的 AI 编码 agent 技能，教 agent 用**当前安装版本**的 React Router 正确地配路由、写 `loader`/`action`、处理表单与导航，而不是依赖可能过时的训练数据。它最初是独立仓库 `remix-run/agent-skills` 里按「框架模式 / 数据模式 / 声明式模式」拆成的三个技能，现已**归档并迁入 React Router 主仓库** `remix-run/react-router/.agents/skills/react-router/`；同时官方把文档发布进 `node_modules`、把 skill 大幅**瘦身**、引导 agent 直接读 `node_modules` 里与安装版本一致的文档。MIT 开源。它不是通用路由教程，而是「让 agent 少犯错、跟得上库版本」的官方随库技能。

## 评价

**优点**

- **官方随库、版本对齐**：技能随主仓库维护，引导 agent 读 `node_modules/react-router/docs/` 里与安装版本一致的一手文档，从根上规避「训练数据过时」
- **模式感知**：先判断应用处于哪种模式（框架 / 数据 / 声明式 / RSC），只加载匹配的 reference，并只应用 `[MODES: ...]` 标记匹配的文档，避免把框架模式套路硬塞给声明式应用
- **覆盖广**：从框架模式的 `loader`/`action`/SSR/中间件，到数据模式的 `createBrowserRouter`，到声明式的 `BrowserRouter`，再到 unstable 的 RSC（React Server Components）
- **反模式明确**：搜索表单用 `<Form method="get">`、内联变更用 `useFetcher`、`meta` 用 `loaderData` 而非弃用的 `data`，都给正误对照
- **演进即范本**：独立仓库 → 主仓库 + `node_modules` 文档 + skill 瘦身，是「技能该如何跟随库版本演进」的官方示范
- **安装省事、可进 CLI**：一条 `npx skills add`，且 `create-react-router` 新建项目时可默认带上该技能

**缺点 / 边界**

- **只讲 React Router**：不覆盖别的路由库（TanStack Router、Redux Toolkit 路由等在相邻叶）
- **依赖库随包发 docs**：`node_modules` 文档策略要求安装的版本确实带了 `docs/`；老版本或裁剪安装可能没有本地文档，需回退到版本匹配的官网文档
- **RSC 为 unstable**：RSC 相关 API 仍可能变动，指引带 `unstable_` 前缀
- **有版本门槛**：如中间件需 v7.9.0+（`v8_middleware` flag）
- **只教「怎么用」**：模式选型、架构取舍仍靠你判断

## 适用场景

- 用 AI agent 写 / 改 React Router 应用：配路由、`loader`/`action`、表单、导航、pending / optimistic UI
- 框架模式（`@react-router/dev` + Vite 插件）下做 SSR / SPA / 预渲染、中间件、会话鉴权
- 已有 React 应用用数据模式（`createBrowserRouter` + `RouterProvider`）补数据加载与变更
- 纯客户端声明式路由（`BrowserRouter` + `Routes`/`Route`）
- 想让 agent 用**当前版本** API（读 `node_modules` docs）而非过时训练知识
- 模式迁移（声明式 → 数据 → 框架）时对照官方迁移文档索引

## 边界

- **聚焦单库**：只讲 React Router，不是通用前端路由教程
- **新版是一个技能识别模式**：旧版「三模式各一技能」已归档，理解历史即可，落地用新版
- **文档策略有前提**：需库随包发 `docs/`，否则回退官网
- **RSC unstable**：勿在生产强依赖

## 官方文档

[reactrouter.com](https://reactrouter.com) ｜ [React Router 文档](https://reactrouter.com/docs) ｜ [迁移说明 discussion #15099](https://github.com/remix-run/react-router/discussions/15099)

## GitHub 地址

[remix-run/react-router · .agents/skills/react-router](https://github.com/remix-run/react-router/tree/main/.agents/skills/react-router)（MIT）；已归档旧仓 [remix-run/agent-skills](https://github.com/remix-run/agent-skills)

## 内容地图

- [入门](./getting-started) —— 安装（新命令）、从独立仓库迁主仓库的来龙去脉、`node_modules` 文档策略、`create-react-router` 集成
- [指南](./guide-line) —— 三模式（+RSC）各覆盖什么、skill 瘦身 + 引导读 `node_modules` 文档的设计、`loader`/`action`/表单、渲染策略、反模式
- [参考](./reference) —— 三模式（+RSC）速查表、安装命令、`references/` 组织、`node_modules` 文档路径、版本、许可、链接

## 幻灯片地址

<a href="/SlideStack/react-router-skill-slide/" target="_blank">React Router Skill</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=605" target="_blank" rel="noopener noreferrer">React Router Skill 测试题</a>
