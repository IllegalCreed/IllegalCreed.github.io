---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Kadajett/agent-nestjs-skills（社区，非官方）v1.1.0 的 `README.md`、`SKILL.md`、`metadata.json`、`rules/_sections.md` 与 40 条规则 frontmatter 整理。规则 `title` / `impact` 为源文件逐条抽取。

## 速查

- **装**：`npx skills add Kadajett/agent-nestjs-skills`（`--global` / `-a claude-code -a cursor`）
- **规模**：40 规则 / 10 类 / 5 档严重度（CRITICAL → LOW-MEDIUM）
- **归属**：社区第三方（作者 Kadajett），MIT，v1.1.0，January 2026——**非 NestJS 官方**
- **数据库**：示例基于 **TypeORM**（非 Prisma）
- **结构**：`rules/前缀-描述.md`（一条一文件）+ `_sections.md` + `metadata.json` → `npm run build` → `AGENTS.md`
- **支持 agent**：Claude Code · OpenCode · Codex · Cursor · Antigravity · Roo Code

## 10 类优先级总表

| # | 类别 | 前缀 | 类严重度 | 条数 |
| --- | --- | --- | --- | --- |
| 1 | 架构 Architecture | `arch-` | CRITICAL | 6 |
| 2 | 依赖注入 Dependency Injection | `di-` | CRITICAL | 6 |
| 3 | 错误处理 Error Handling | `error-` | HIGH | 3 |
| 4 | 安全 Security | `security-` | HIGH | 5 |
| 5 | 性能 Performance | `perf-` | HIGH | 4 |
| 6 | 测试 Testing | `test-` | MEDIUM-HIGH | 3 |
| 7 | 数据库与 ORM Database & ORM | `db-` | MEDIUM-HIGH | 3 |
| 8 | API 设计 API Design | `api-` | MEDIUM | 4 |
| 9 | 微服务 Microservices | `micro-` | MEDIUM | 3 |
| 10 | DevOps 与部署 DevOps & Deployment | `devops-` | LOW-MEDIUM | 3 |

## 40 规则速览表

> `impact` 为**条级**严重度（frontmatter），可能与类级不同（如 `security-auth-jwt` 类属安全 HIGH，条级为 CRITICAL）。

### 1. 架构 arch-（6）

| 规则 | 条级 | 要点 |
| --- | --- | --- |
| `arch-avoid-circular-deps` | CRITICAL | 避免循环依赖（#1 崩溃源）→ 共享模块 / 事件 |
| `arch-feature-modules` | CRITICAL | 按特性模块组织，非技术分层 |
| `arch-module-sharing` | CRITICAL | 正确导出/导入，避免重复注册 provider |
| `arch-single-responsibility` | CRITICAL | 单一职责，拒 god service |
| `arch-use-events` | MEDIUM-HIGH | 事件驱动解耦 |
| `arch-use-repository-pattern` | HIGH | 仓储模式抽象数据访问，利于测试 |

### 2. 依赖注入 di-（6）

| 规则 | 条级 | 要点 |
| --- | --- | --- |
| `di-prefer-constructor-injection` | CRITICAL | 构造函数注入优于属性注入 |
| `di-scope-awareness` | CRITICAL | 懂 singleton/request/transient 三 scope |
| `di-use-interfaces-tokens` | HIGH | 接口用注入令牌（Symbol/抽象类） |
| `di-avoid-service-locator` | HIGH | 避免 service locator 反模式 |
| `di-interface-segregation` | HIGH | 接口隔离原则（ISP） |
| `di-liskov-substitution` | HIGH | 里氏替换原则（LSP） |

### 3. 错误处理 error-（3）

| 规则 | 条级 | 要点 |
| --- | --- | --- |
| `error-use-exception-filters` | HIGH | 异常过滤器集中处理 |
| `error-throw-http-exceptions` | HIGH | service 直接抛 HttpException |
| `error-handle-async-errors` | HIGH | 正确处理 async 错误 |

### 4. 安全 security-（5）

| 规则 | 条级 | 要点 |
| --- | --- | --- |
| `security-auth-jwt` | CRITICAL | JWT：Config 读密钥、短 access + refresh、不放敏感字段 |
| `security-validate-all-input` | HIGH | DTO + 全局 ValidationPipe（whitelist） |
| `security-use-guards` | HIGH | 守卫做鉴权/RBAC（RolesGuard/@Roles） |
| `security-sanitize-output` | HIGH | XSS 净化 + Helmet CSP |
| `security-rate-limiting` | HIGH | @nestjs/throttler 限流 |

### 5. 性能 perf-（4）

| 规则 | 条级 | 要点 |
| --- | --- | --- |
| `perf-use-caching` | HIGH | 策略性缓存 + 失效 |
| `perf-optimize-database` | HIGH | 优化 DB 查询 |
| `perf-async-hooks` | HIGH | async 生命周期钩子要 await |
| `perf-lazy-loading` | MEDIUM | 大模块懒加载加快启动 |

### 6-7. 测试 test- / 数据库 db-（3 + 3）

| 规则 | 条级 | 要点 |
| --- | --- | --- |
| `test-use-testing-module` | HIGH | Test.createTestingModule + mock |
| `test-e2e-supertest` | HIGH | Supertest E2E |
| `test-mock-external-services` | HIGH | mock 外部依赖 |
| `db-use-transactions` | HIGH | TypeORM 事务（DataSource/QueryRunner） |
| `db-avoid-n-plus-one` | HIGH | 避免 N+1（relations/join/DataLoader） |
| `db-use-migrations` | HIGH | 迁移（禁生产 synchronize） |

### 8-10. API / 微服务 / DevOps（4 + 3 + 3）

| 规则 | 条级 | 要点 |
| --- | --- | --- |
| `api-use-interceptors` | MEDIUM-HIGH | 拦截器管横切 |
| `api-use-dto-serialization` | MEDIUM | DTO + @Exclude 序列化 |
| `api-use-pipes` | MEDIUM | 管道转换输入 |
| `api-versioning` | MEDIUM | 内置版本化（URI/Header/Media-Type） |
| `micro-use-health-checks` | MEDIUM-HIGH | terminus liveness/readiness |
| `micro-use-queues` | MEDIUM-HIGH | BullMQ 后台任务 |
| `micro-use-patterns` | MEDIUM | 消息/事件模式 |
| `devops-graceful-shutdown` | MEDIUM-HIGH | 优雅关闭（enableShutdownHooks） |
| `devops-use-logging` | MEDIUM-HIGH | 结构化日志 |
| `devops-use-config-module` | LOW-MEDIUM | ConfigModule + Joi 校验 |

## 5 档严重度定义

| 档位 | 含义 |
| --- | --- |
| **CRITICAL** | 违反导致运行时崩溃、安全漏洞或架构崩坏 |
| **HIGH** | 对可靠性、安全、可维护性有显著影响 |
| **MEDIUM-HIGH** | 对质量与开发体验有明显影响 |
| **MEDIUM** | 对代码质量与最佳实践有中等影响 |
| **LOW-MEDIUM** | 一致性与可维护性的次要改进 |

## 安装与 CLI

```bash
npx skills add Kadajett/agent-nestjs-skills          # 当前项目
npx skills add Kadajett/agent-nestjs-skills --global # 全局
npx skills add Kadajett/agent-nestjs-skills -a claude-code -a cursor
```

支持 agent：Claude Code、OpenCode、Codex、Cursor、Antigravity、Roo Code。

## 目录结构

```
agent-nestjs-skills/
├── rules/
│   ├── _sections.md       # 10 类元数据（标题/严重度/描述）
│   ├── _template.md       # 新规则模板（_ 开头不参与编译）
│   ├── arch-avoid-circular-deps.md
│   ├── security-validate-all-input.md
│   └── ...（40 条，一条一文件）
├── scripts/               # 构建脚本
├── metadata.json          # 版本/组织/摘要/references
├── SKILL.md               # 技能入口 + 优先级速查
└── AGENTS.md              # 编译产物（npm run build 生成）
```

- 文件名 `前缀-描述.md`，前缀决定归类；`_` 开头的文件（`_sections.md`/`_template.md`）不参与编译
- 规则在类内**按 title 字母序**排列，编号（1.1、1.2…）构建时自动生成
- 构建：`cd scripts && npm install` → `npm run build`（或 `./scripts/build.sh`）汇编成 `AGENTS.md`

## 依赖生态（示例所用）

`metadata.json` 的 references 与规则示例涉及：NestJS（docs.nestjs.com）、**TypeORM**（typeorm.io，事务/迁移/N+1）、class-validator（校验）、`@nestjs/jwt` + `@nestjs/passport`（鉴权）、`@nestjs/throttler`（限流）、`@nestjs/terminus`（健康检查）、`@nestjs/bullmq`（队列）、`@nestjs/config` + Joi（配置）、`nestjs-cls` / `nestjs-pino`（上下文/日志）、helmet + sanitize-html（安全）。**数据库层为 TypeORM，非 Prisma。**

## NestJS 版本背景（补充 · 非本 skill 规则）

本 skill 版本无关。作为独立背景：NestJS 11 升级到 Express 5，通配路由需用**命名通配**（`@Get('*splat')` 而非裸 `@Get('*')`）。详见 [NestJS v11 迁移指南](https://docs.nestjs.com/migration-guide)——非本 skill 的规则条目。

## 许可与链接

- 许可：**MIT**（社区第三方，作者 Kadajett）
- 仓库：[Kadajett/agent-nestjs-skills](https://github.com/Kadajett/agent-nestjs-skills)
- skill 文档站：[kadajett.github.io/agent-nestjs-skills](https://kadajett.github.io/agent-nestjs-skills/)
- 一手来源：[NestJS 官方文档](https://docs.nestjs.com) · [TypeORM](https://typeorm.io) · [skills CLI](https://github.com/vercel-labs/skills)

## 下一步

- 回 [入门](./getting-started) 看安装与分级机制
- 回 [指南](./guide-line) 看 10 类逐类深入与反模式
