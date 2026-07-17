---
layout: doc
---

# Nuxt Skills

Nuxt Skills（`onmax/nuxt-skills`）是一套面向 AI 编码助手的 **Vue / Nuxt / NuxtHub 技能集**，遵循 [agentskills.io](https://agentskills.io) 开放格式，MIT 开源，约 ★688。它把 Nuxt 生态的高频知识——Nuxt 4+ 服务端路由与数据获取、NuxtHub 数据库/存储、Nuxt Content、Nuxt UI、Reka UI、VueUse、Vite/Vitest/pnpm 等——打包成 **21 个可按需加载的 skill**，让 Claude Code / Copilot / Codex / Gemini / OpenCode 等 agent 在写 Nuxt 项目时自动拿到「最新且经过筛选」的模式与反模式，而非依赖各自过时的训练记忆。

> **社区项目，非官方**：本仓库由 **onmax**（Nuxt 生态活跃贡献者）个人维护，**不属于 nuxt 官方 org**，请勿当作 Nuxt 官方发布物。它与官方化进程有关联但相互独立：nuxt 官方仓库的 PR [#33498](https://github.com/nuxt/nuxt/pull/33498)（为 Nuxt 加 Claude Code skill）**已关闭未合并**；社区正在 RFC [#34059](https://github.com/nuxt/nuxt/discussions/34059)（在 Nuxt 模块里内置 Agent Skills）讨论「官方内置」的路。README 亦挂了 WARNING：本仓库未来可能迁移到 [nuxt-skill.onmax.me](https://nuxt-skill.onmax.me/)。

## 评价

**优点**

- **一条命令装全家桶**：`npx skills add onmax/nuxt-skills` 自动检测已装 agent、交互式挑选，Nuxt 全栈知识一次到位
- **21 个 skill，覆盖面广**：从核心 `nuxt`、`vue`，到 `nuxthub`/`nuxt-content`/`nuxt-ui`/`nuxt-seo`/`nuxt-studio`/`nuxt-better-auth`，再到 `reka-ui`/`vueuse`/`motion`/`tresjs` 与工具链 `vite`/`vitest`/`pnpm`/`tsdown`/`ts-library`
- **锁定 Nuxt 4+ 最新模式**：`nuxt` skill 明确标注 Nuxt 4.3+、h3 v1、nitro v2，并用「红旗（Red Flags）」主动纠正 `event.context.params`、`[id]` 泛化参数等 Nuxt 3 旧写法
- **渐进披露（Progressive Disclosure）**：每个 `SKILL.md` 只 ~300 token 作入口，`references/*` 子文件按任务再加载，省 token
- **跨 agent 通用**：遵 agentskills 开放格式，Claude Code / Cursor / Codex / OpenCode / Copilot / Gemini / Antigravity / Roo Code 都能用
- **自动维护**：GitHub Actions 每周/每两周从上游（reka-ui、nuxt-ui、vueuse 等）重新生成文档并检测破坏性变更

**缺点 / 边界**

- **社区个人项目**：非官方，稳定性/长期维护取决于作者；README 已预告可能迁站
- **偏 Nuxt/Vue 生态**：对非 Vue 技术栈无帮助
- **知识有时效**：skill 里的版本号（如 NuxtHub v0.10.6、Nuxt UI v4.4）会随上游演进，需以官方文档为准
- **不替代理解**：skill 给 agent 喂正确模式，但架构取舍仍靠你

## 适用场景

- 用 AI 助手写 Nuxt 4+ 项目，想让它别再用 Nuxt 3 旧写法
- 做 NuxtHub 全栈（DB/KV/Blob/Cache）、Nuxt Content 内容站、Nuxt UI 界面
- 团队统一 agent 的 Vue/Nuxt「工程规范来源」
- 关注 Nuxt 官方内置 Agent Skills 的进程（RFC #34059）

## 边界

- **不是 Nuxt 官方产物**：社区个人维护，别在正式文档里标成官方
- **不是框架/CLI**：是喂给 AI agent 的知识集，不改变 Nuxt 本身
- **版本会漂**：skill 内标的库版本是快照，破坏性变更以上游官方为准
- **与相邻叶分工**：通用 Vue 生态 skill（`vue`/`vueuse`/`vite`）与 [Antfu Skills](../antfu-skills/) 等有交集，本叶聚焦「Nuxt 全栈那套」

## 官方文档

[agentskills.io 开放格式](https://agentskills.io) ｜ [skills CLI（npm）](https://www.npmjs.com/package/skills) ｜ [Nuxt 官方文档](https://nuxt.com/docs) ｜ [RFC #34059 · 模块内置 Skills](https://github.com/nuxt/nuxt/discussions/34059)

## GitHub 地址

[onmax/nuxt-skills](https://github.com/onmax/nuxt-skills)（社区项目，MIT）

## 内容地图

- [入门](./getting-started) —— `npx skills add` 安装、21 skills 总览、社区定位与官方化进程、如何触发
- [指南](./guide-line) —— 渐进披露与多 skill 组织、nuxt 核心（Nuxt 4 app/ 目录、useFetch/useAsyncData/useState、server routes、SSR/hydration）、生态 skills、反模式
- [参考](./reference) —— 21 skills 分组全表、安装/多 agent、版本、贡献、许可、链接

## 幻灯片地址

<a href="/SlideStack/nuxt-skills-slide/" target="_blank">Nuxt Skills</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=PENDING" target="_blank" rel="noopener noreferrer">Nuxt Skills 测试题</a>

> 测试题链接待生产库分类导入、获得真实数字叶节点 ID 后回填。
