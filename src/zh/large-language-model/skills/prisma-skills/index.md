---
layout: doc
---

# Prisma Skills

Prisma Skills（`prisma/skills`）是 **Prisma 官方**（Prisma ORM 团队）出品的一组 AI 编码 agent 技能集，遵循 agentskills.io 开放格式，MIT 开源。它把 Prisma ORM 从「建库、写查询、跑迁移」到「升级 Prisma 7、实现 driver adapter、开 Prisma Postgres、部署 Prisma Compute」的全流程知识，打包成 9 个可按需调用的技能。采用**渐进披露**（progressive disclosure）：启动只加载技能名与描述，完整 `SKILL.md` 只在 agent 判断相关时才载入上下文。ORM 类技能锁定 **Prisma ORM 7.6.x**，把「Prisma 7 必须用 driver adapter」「`prisma-client` 新生成器」「`prisma.config.ts` 配置文件」这些容易踩坑的新范式，直接喂给 agent。

## 评价

**优点**

- **官方权威**：出自 Prisma 团队，覆盖 Prisma 7 的破坏性变更与新范式，非社区二手总结
- **全流程 9 技能**：CLI、Client API、建库、Prisma 7 升级、driver adapter 实现、Prisma Postgres、Compute 部署、MongoDB 决策——一条命令全装
- **渐进披露省 token**：启动只加载 name + description，`SKILL.md` 按需载入，不污染上下文
- **精准触发**：每个技能的 description 写明「Use when…」+ 触发词（`prisma migrate`、`findMany`、`upgrade to prisma 7`…），agent 据此激活
- **含「不可从代码推断」的契约**：driver-adapter-implementation 讲事务生命周期协议（`commit`/`rollback` 只是钩子、不发 SQL）、`ColumnTypeEnum` 映射、错误转换等硬约束
- **防错设计**：mongodb-upgrade 明确拦住「把 MongoDB 项目升到 Prisma 7」这个不可能的计划（v7 无 Mongo 连接器）
- **跨 agent**：`npx skills add` 装进 Claude Code / Cursor / Codex 等

**缺点 / 边界**

- **绑 Prisma 生态**：只服务 Prisma ORM，不涉及其它 ORM（Drizzle、TypeORM 等）
- **版本敏感**：ORM 技能锁 7.6.x，Prisma Postgres 追 7.7.x，Compute 追活跃发布流——用前需核对本地实际版本
- **Compute 部分需现场核验**：`prisma-compute` 要求 agent 先核对当前 Platform CLI 与 `create-prisma` 命令面，不能照抄
- **不替代官方文档**：mongodb-upgrade 自称「发现桥」，切到 Prisma Next 后要跟 Next 自己的技能

## 适用场景

- 用 AI agent 写 Prisma 代码，想让它照 Prisma 7 的新范式（driver adapter、`prisma-client` 生成器）而非老写法
- 从 Prisma 6 升级到 7，想要逐步迁移清单（`prisma-upgrade-v7`）
- 开 Prisma Postgres、或用 `create-db` 秒建临时库（`prisma-postgres`）
- 实现自定义 SQL driver adapter，需要接口契约与事务协议（`prisma-driver-adapter-implementation`）
- MongoDB 项目纠结「要不要升 Prisma 7」，需要正确的决策框架（`prisma-mongodb-upgrade`）

## 边界

- **是官方技能集，不是单个技能**：9 个技能各有触发条件，按需激活
- **Prisma 7 优先**：内容以 Prisma ORM 7.6.x 为准，v6 是升级来源
- **MongoDB 无 v7 路**：v7 永不出 Mongo 连接器，MongoDB 项目走 v6 维护或 Prisma Next
- **CLI vs Compute 分工**：ORM/数据库命令用 `prisma-cli`，应用部署用 `prisma-compute`，二者边界清晰

## 官方文档

[Prisma 文档](https://www.prisma.io/docs) ｜ [升级到 Prisma 7](https://www.prisma.io/docs/orm/more/upgrades/to-v7) ｜ [Driver Adapters](https://www.prisma.io/docs/orm/overview/databases/database-drivers) ｜ [Prisma Postgres](https://www.prisma.io/docs/postgres)

## GitHub 地址

[prisma/skills](https://github.com/prisma/skills)（MIT，★44）

## 内容地图

- [入门](./getting-started) —— `npx skills add` 安装、9 个技能速览、渐进披露机制
- [指南](./guide-line) —— 各技能分组深入（建库 / Client / CLI / Postgres / adapter / 升级）、Prisma 7 五大变更、driver adapter 事务坑、反模式
- [参考](./reference) —— 9 技能全表 + 触发词、安装、Prisma 7 破坏性变更表、driver adapter 表、许可与链接

## 幻灯片地址

<a href="/SlideStack/prisma-skills-slide/" target="_blank">Prisma Skills</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=632" target="_blank" rel="noopener noreferrer">Prisma Skills 测试题</a>
