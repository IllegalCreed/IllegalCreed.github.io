---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Kadajett/agent-nestjs-skills（社区，非官方）v1.1.0（January 2026）的 `README.md`、`SKILL.md`、`metadata.json` 与 `rules/` 编写。规则内容以 NestJS 官方文档（docs.nestjs.com）与 TypeORM 为一手依据。

## 速查

- **是什么**：为 agent/LLM 优化的 NestJS 最佳实践技能包，**40 规则 / 10 类**，每条含严重度 + 反模式 + 正例
- **谁出品**：社区作者 **Kadajett**（★≈220，MIT，v1.1.0）——**非 NestJS 官方**；nestjs org 无官方 skill 仓
- **装**：`npx skills add Kadajett/agent-nestjs-skills`（`--global` 全局 / `-a claude-code -a cursor` 指定 agent）
- **10 类（按优先级）**：架构 · 依赖注入（均 CRITICAL）→ 错误处理 · 安全 · 性能（HIGH）→ 测试 · 数据库（MEDIUM-HIGH）→ API 设计 · 微服务（MEDIUM）→ DevOps（LOW-MEDIUM）
- **5 档严重度**：CRITICAL / HIGH / MEDIUM-HIGH / MEDIUM / LOW-MEDIUM
- **数据库示例**：**TypeORM**（非 Prisma）——`DataSource`、`QueryRunner`、`MigrationInterface`
- **支持 agent**：Claude Code · OpenCode · Codex · Cursor · Antigravity · Roo Code
- **可编译**：`rules/` 一条一文件 → `npm run build` 汇编成 `AGENTS.md`

## 定位：社区第三方的 NestJS 规范集（非官方）

`Kadajett/agent-nestjs-skills` 把「怎样写 NestJS 才算生产级」整理成一份 **Agent Skill**——不是通用 prompt，而是有明确分类、严重度、反模式与正例的可执行规范。当 agent 写、审、重构 NestJS 代码时，它作为「随身规范」被引用。

**必须说清楚归属**：这是**社区第三方**作品，**不是 NestJS 官方出品**。截至目前 nestjs 官方组织并未发布 Agent Skill 仓库，本叶选它是因为它是最贴合「NestJS Best Practices」主题、且质量与覆盖度较高的社区源（★≈220，MIT）。它的规则以 NestJS 官方文档、TypeORM、class-validator 等一手资料为依据，但「哪条算最佳实践、如何分档」是作者的整理判断——落地时以 docs.nestjs.com 为最终裁决。

## 安装

```bash
# GitHub 简写：装进当前项目
npx skills add Kadajett/agent-nestjs-skills

# 全局安装（跨所有项目可用）
npx skills add Kadajett/agent-nestjs-skills --global

# 指定 agent 安装
npx skills add Kadajett/agent-nestjs-skills -a claude-code -a cursor
```

装后 agent 在写/审 NestJS 代码时自动参考这份规范。支持的 agent：Claude Code、OpenCode、Codex、Cursor、Antigravity、Roo Code。

## 10 类 40 规则总览

规则按**影响力优先级**编号（前面的类更关键），共 10 类 40 条：

| 优先级 | 类别（前缀） | 类严重度 | 条数 |
| --- | --- | --- | --- |
| 1 | 架构 `arch-` | CRITICAL | 6 |
| 2 | 依赖注入 `di-` | CRITICAL | 6 |
| 3 | 错误处理 `error-` | HIGH | 3 |
| 4 | 安全 `security-` | HIGH | 5 |
| 5 | 性能 `perf-` | HIGH | 4 |
| 6 | 测试 `test-` | MEDIUM-HIGH | 3 |
| 7 | 数据库与 ORM `db-` | MEDIUM-HIGH | 3 |
| 8 | API 设计 `api-` | MEDIUM | 4 |
| 9 | 微服务 `micro-` | MEDIUM | 3 |
| 10 | DevOps 与部署 `devops-` | LOW-MEDIUM | 3 |

> 优先级排序是关键设计——它让 agent「先做影响大的」（架构 / DI 的崩溃比 DevOps 的润色更该先修），而非平均用力。

## 每条规则长什么样

每条规则一个 `rules/前缀-描述.md` 文件，结构固定：

1. **frontmatter**：`title` / `impact`（该条严重度）/ `impactDescription` / `tags`
2. **一句话解释**为什么重要
3. **`Incorrect`**：真实反模式代码 + 说明哪里错
4. **`Correct`**：生产级正确写法 + 说明为什么对
5. **Reference**：指向 NestJS / TypeORM 官方文档

例如 `arch-avoid-circular-deps`（CRITICAL，标注「#1 运行时崩溃原因」）先给「模块 A 导入 B、B 又导入 A」的循环反例，再给「抽第三方共享模块」或「用事件解耦」两种正解。

## 严重度分级机制

规则用**两层影响力**表达优先级：

- **类级**（`SKILL.md` 的优先级表 + `rules/_sections.md`）：整类的定位，如「架构 = CRITICAL」「DevOps = LOW-MEDIUM」
- **条级**（每条 frontmatter 的 `impact`）：具体规则的严重度，5 档：

| 档位 | 含义 |
| --- | --- |
| **CRITICAL** | 违反会导致运行时崩溃、安全漏洞或架构崩坏 |
| **HIGH** | 对可靠性、安全、可维护性有显著影响 |
| **MEDIUM-HIGH** | 对质量与开发体验有明显影响 |
| **MEDIUM** | 对代码质量与最佳实践有中等影响 |
| **LOW-MEDIUM** | 一致性与可维护性的次要改进 |

> 注意：条级与类级可不同。如安全类整体 HIGH，但其中 `security-auth-jwt`（JWT 鉴权）条级是 **CRITICAL**；DevOps 类整体 LOW-MEDIUM，但 `devops-graceful-shutdown`（优雅关闭）条级是 **MEDIUM-HIGH**。

## 下一步

- [指南](./guide-line) —— 10 类逐类深入、反模式按严重度、TypeORM 专项、NestJS 版本背景
- [参考](./reference) —— 40 规则速览表 + 5 档定义 + 安装 CLI + 目录结构 + 依赖生态
