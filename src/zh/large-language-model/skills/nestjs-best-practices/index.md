---
layout: doc
---

# NestJS Best Practices

NestJS Best Practices（`Kadajett/agent-nestjs-skills`）是一份为 AI 编码 agent 与 LLM 优化的 **NestJS 最佳实践与架构规范**技能包——把 **40 条规则 / 10 大类**（按影响力从架构、依赖注入的 CRITICAL 到 DevOps 的 LOW-MEDIUM）沉淀成可安装的 Agent Skill，每条规则含严重度分级、反模式（Incorrect）与生产级正确示例（Correct）。它遵循 [skills](https://github.com/vercel-labs/skills) 开放格式，一条 `npx skills add` 装进 Claude Code / Cursor / Codex 等，让 agent 写、审、重构 NestJS 代码时照规范办事。

> **社区第三方（非官方）声明**：本技能包由社区作者 **Kadajett** 维护（★≈220，MIT，v1.1.0，January 2026），**不是** NestJS 官方出品。截至目前 **nestjs 官方组织并没有发布 Agent Skill 仓库**，本叶选用的 `Kadajett/agent-nestjs-skills` 是最贴合「NestJS Best Practices」主题的社区源。其规则内容仍以 NestJS 官方文档（docs.nestjs.com）、TypeORM、class-validator 等一手资料为依据，但「哪条算最佳实践、如何分级」属于作者的社区整理，使用时请以官方文档为最终裁决。

## 评价

**优点**

- **规则可执行且分级**：40 条规则 10 类，按影响力分 5 档（CRITICAL / HIGH / MEDIUM-HIGH / MEDIUM / LOW-MEDIUM），告诉 agent「先修影响大的」
- **反模式 + 正例成对**：每条规则都给 `Incorrect`（真实反模式）与 `Correct`（生产级写法），照抄即改对
- **覆盖全栈后端关切**：架构/DI/错误/安全/性能/测试/数据库/API/微服务/DevOps 十大面
- **安全与鉴权翔实**：JWT（短 access + refresh token）、`class-validator` 全局校验、RBAC 角色守卫、`@nestjs/throttler` 限流、XSS sanitize + Helmet CSP
- **跨 agent 安装**：`npx skills add Kadajett/agent-nestjs-skills`，支持 Claude Code / OpenCode / Codex / Cursor / Antigravity / Roo Code
- **可编译成单文档**：`rules/` 一条一文件，`npm run build` 汇编成 `AGENTS.md` 完整手册

**缺点 / 边界**

- **社区第三方、非官方**：分级与取舍是作者观点，非 NestJS 官方背书；以 docs.nestjs.com 为准
- **数据库示例绑 TypeORM**：`db-*` 与事务/迁移/N+1 全用 **TypeORM**（`DataSource`、`QueryRunner`、`MigrationInterface`），**不含 Prisma**——用 Prisma/Mongoose 需自行迁移思路
- **规则是输入、判断靠人**：40 条是清单，具体项目取舍仍需工程师定夺
- **版本无关、随框架演进**：规则引 docs.nestjs.com 通用写法，不锁定某个 NestJS 大版本（如 v11 / Express 5 破坏性变更需另查官方迁移指南）

## 适用场景

- 用 agent 写 / 审 / 重构 NestJS 模块、控制器、服务时，想有一份可执行的规范清单
- 实现鉴权（JWT + refresh + RBAC）、输入校验、限流、异常处理，想照生产级样板
- 排查架构问题（循环依赖、god service、错误的 provider scope）
- 优化性能（缓存、N+1、懒加载、async 生命周期钩子）或上生产（配置校验、结构化日志、优雅关闭、健康检查）

## 边界

- **不是框架、不是库**：是一份 Markdown 规则集（Agent Skill），装进 agent 当规范用
- **不是 NestJS 官方**：社区第三方整理，官方无同类 skill 仓
- **数据库层偏 TypeORM**：Prisma 用户可借鉴模式（事务、迁移、避免 N+1）但示例需替换
- **不替你做决定**：给分级清单，最终工程取舍在你

## 官方文档

[NestJS 官方文档](https://docs.nestjs.com)（框架一手来源） ｜ [TypeORM 文档](https://typeorm.io)（数据库示例所依赖） ｜ [class-validator](https://github.com/typestack/class-validator)（校验） ｜ [skill 文档站（社区作者）](https://kadajett.github.io/agent-nestjs-skills/)

## GitHub 地址

[Kadajett/agent-nestjs-skills](https://github.com/Kadajett/agent-nestjs-skills)（社区第三方，MIT，v1.1.0）

## 内容地图

- [入门](./getting-started) —— 定位（社区非官方）、`npx skills add` 安装、10 类 40 规则总览、严重度分级机制
- [指南](./guide-line) —— 10 类逐类讲（架构/DI/错误/安全/性能/测试/数据库/API/微服务/DevOps）、反模式按严重度、TypeORM 专项、NestJS 版本背景
- [参考](./reference) —— 10 类优先级表 + 40 规则速览表、5 档严重度定义、安装 CLI、目录结构、依赖生态、链接

## 幻灯片地址

<a href="/SlideStack/nestjs-best-practices-slide/" target="_blank">NestJS Best Practices</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=PENDING" target="_blank" rel="noopener noreferrer">NestJS Best Practices 测试题</a>

> 测试题链接待生产库分类导入、获得真实数字叶节点 ID 后回填。
