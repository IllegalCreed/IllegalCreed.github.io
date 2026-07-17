---
layout: doc
---

# Redux Toolkit Skills

Redux Toolkit Skills 是 Redux 官方在**主仓库** `reduxjs/redux-toolkit` 内建的一组 AI 编码 agent 技能（源在 `packages/toolkit/skills/`，根目录 `skills/` 有 symlink 指过去），MIT 开源，主仓库 ★11k+。跟 Angular Developer Skill、Next.js 的做法同款——官方 skill 不单独开仓库，而是藏在主框架仓库里跟着代码一起演进。它把「现代 Redux」的正确姿势（`createSlice` / `configureStore` / `createAsyncThunk` + `extraReducers` / RTK Query）连同一整套**反模式清单**（`connect`、手写 switch reducer、reducer 里跑副作用、一个后端建多个 API 根……）沉淀成 9 个 `SKILL.md`，按 5 大任务类组织，可被 Claude Code / Cursor / Codex 等 agent 按需调用。不是泛泛的 prompt，而是 Redux 维护者把官方文档 + 风格指南 + 维护者访谈里的判断，压缩成「Setup / Core Patterns / Common Mistakes（带 CRITICAL/HIGH/MEDIUM 分级）」的可执行规范。

## 评价

**优点**

- **官方一手**：规则直接引自 `reduxjs/redux` 风格指南、RTK 文档与维护者访谈（每条 mistake 都标了 `Source:`），不是二手总结
- **反模式驱动**：每个 skill 的核心是「Wrong → Correct」对照 + 严重度分级（CRITICAL/HIGH/MEDIUM），专治 agent 拿 RTK 1.x / 老 Redux 语料生成的过时代码
- **纠偏训练数据**：明确点名「agent 被 RTK 1.x 训练仍生成 `extraReducers` 对象语法 / 数组 middleware / `connect`」，让新代码不再退回旧范式
- **任务分层**：5 大任务类（建应用 / 建模状态 / 管服务端数据 / 编排副作用 / 演进与诊断）+ `requires` 依赖图，agent 按需组合
- **覆盖全生命周期**：从新建（modern-redux）→ 建模（slices/ownership）→ 数据获取（RTK Query + OpenAPI codegen）→ 副作用（thunk/listener）→ 调试与迁移，闭环
- **RTK Query 深度**：createApi、tag 失效、乐观更新 lifecycle、OpenAPI 代码生成单列成技能

**缺点 / 边界**

- **绑 React-Redux 生态**：示例默认 React + hooks，非 React 集成（Angular/Vue）只作为「逃生舱」提及
- **需要 agent 宿主**：技能价值在被 Claude Code / Cursor 等消费时体现，人肉直接读也行但不是设计初衷
- **版本锚定 RTK 2.x**：skills 声明 `library_version 2.11.2`（最新 2.12.0），RTK 1.x 用户先看迁移技能
- **不替代理解**：技能给的是「怎么写对 + 怎么避坑」，Redux 的 event→reducer→selector→render 心智模型仍需自己建立

## 适用场景

- 用 agent 新建或现代化 Redux 应用，想让它一步到位用 `configureStore` + `createSlice` + typed hooks，而非老 `createStore` 样板
- 让 agent 按官方风格建模状态（slices / selectors / state ownership），避免把表单/URL 状态硬塞进 Redux
- 引入 RTK Query 做服务端数据缓存（含从 OpenAPI schema 生成 endpoints）
- 排查重复请求、stale 缓存、订阅过宽、序列化警告等 RTK/RTK Query 问题
- 把 legacy Redux 增量迁移到现代 RTK（含 codemod）

## 边界

- **不是单个技能，是官方技能集**：9 个 `SKILL.md`，各有 `description`（Use when…）触发条件与 `requires` 依赖
- **偏 React**：React-Redux hooks 优先，`connect` 与非 React 集成是逃生舱不是默认
- **与相邻叶的分工**：路由/URL 状态归 [React Router Skill](../react-router-skill/) / [TanStack Router & Start Skills](../tanstack-router-start-skills/)——本叶明确「URL 状态别同步进 Redux」
- **规则是输入，判断是你的**：CRITICAL/HIGH/MEDIUM 分级帮排优先级，最终取舍仍靠人

## 官方文档

[Redux Toolkit 官网](https://redux-toolkit.js.org/) ｜ [RTK 快速上手](https://redux-toolkit.js.org/introduction/getting-started) ｜ [迁移到现代 Redux](https://redux-toolkit.js.org/usage/migrating-to-modern-redux) ｜ [Redux 风格指南](https://redux.js.org/style-guide/)

## GitHub 地址

[reduxjs/redux-toolkit](https://github.com/reduxjs/redux-toolkit)（MIT） · skills 源在 [`packages/toolkit/skills/`](https://github.com/reduxjs/redux-toolkit/tree/master/packages/toolkit/skills)

## 内容地图

- [入门](./getting-started) —— 官方定位（主仓库内建）、5 大任务类总览、安装/激活、现代 Redux 是什么
- [指南](./guide-line) —— 5 大类逐类深入、createSlice/configureStore/RTK Query、副作用编排、调试与迁移、反模式清单
- [参考](./reference) —— 9 SKILL.md 分类表 + `requires` 依赖图、rtk-query-codegen-openapi、安装、版本、许可、链接

## 幻灯片地址

<a href="/SlideStack/redux-toolkit-skills-slide/" target="_blank">Redux Toolkit Skills</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=607" target="_blank" rel="noopener noreferrer">Redux Toolkit Skills 测试题</a>
