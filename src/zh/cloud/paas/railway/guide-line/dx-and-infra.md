---
layout: doc
outline: [2, 3]
---

# DX 与基础设施即代码：infra-as-code、模板与环境变量

> 基于 Railway 官方文档 · 核于 2026-08

## 速查

- **infra-as-code**：`railway.toml`/`railway.json` 声明服务、数据库、环境变量、健康检查，随仓库版本化，`railway up` 一键重建——避免控制台手点导致的环境漂移。
- **Nixpacks（零配置构建器）**：Railway 自研的构建器，自动检测运行时（Node/Python/Go/Rust 等）并推断构建/启动命令，无需 Dockerfile 即可部署。
- **Dockerfile 兼容**：有 Dockerfile 则用它（完全自定义），与 Nixpacks 二选一。
- **模板市场**：一键拉起整套服务栈（前端 + 后端 + 数据库），新手快速起项目；还有 ClickHouse、RabbitMQ 等进阶模板。
- **环境变量（多环境）**：分服务级、环境级（dev/staging/prod），敏感配置用加密变量；数据库连接串（`DATABASE_URL`/`REDIS_URL`）自动注入。
- **可视化控制台**：以**服务拓扑图**展示服务与数据库关系，拖拽连线，直观。
- **CLI 完整覆盖**：`railway link/up/logs/variables/add`，终端即可完成全部操作。
- **GitHub 集成**：连仓库 → push 即自动构建部署，零 CI 配置。

## 一、infra-as-code：railway.toml/railway.json

Railway 的基础设施即代码用 `railway.toml`（TOML）或 `railway.json`（JSON）声明：

```toml
# railway.toml —— 声明单个服务的配置
[deploy]
startCommand = "npm start"          # 启动命令
restartPolicyType = "ON_FAILURE"    # 重启策略
healthcheckPath = "/health"         # 健康检查路径
healthcheckTimeout = 30

[build]
builder = "nixpacks"                # 用 Nixpacks 构建（或 "dockerfile"）
```

- **版本化**：进 Git，团队任何人 `railway up` 即可重建同构环境——避免「在我机器上能跑」与控制台手点漂移。
- **配置项**：启动命令、构建器、健康检查、重启策略、资源限制等。
- **多服务**：配合模板（Template）定义整个项目栈（前端 + 后端 + 数据库），一键拉起。

## 二、Nixpacks：零配置构建器

Railway 自研的 **Nixpacks** 是其 DX 的核心武器——自动检测运行时并推断构建流程：

| 检测到 | 构建命令（推断） | 启动命令（推断） |
| --- | --- | --- |
| Node.js（package.json） | `npm install` + `npm run build` | `npm start` |
| Python（requirements.txt） | `pip install -r requirements.txt` | 推断入口 |
| Go（go.mod） | `go build` | 编译产物 |
| Rust（Cargo.toml） | `cargo build --release` | 编译产物 |

- **零 Dockerfile 即可部署**：标准项目无需写 Dockerfile，Nixpacks 自动处理。
- **Dockerfile 优先**：若根目录有 Dockerfile，则用它（完全自定义），适合复杂构建或非标运行时。
- **可覆盖**：在 `railway.toml` 或控制台覆盖推断的命令。

## 三、模板市场：一键拉起整套服务栈

模板（Template）是 Railway 的快速起项目利器：

- **整套服务栈**：一个模板可定义前端 + 后端 + Postgres + Redis 等多个服务及它们的连接关系，一键全部拉起。
- **典型模板**：Next.js + Postgres、Express + Redis、FastAPI + Postgres 等常见组合。
- **进阶模板**：ClickHouse（分析型数据库）、RabbitMQ（消息队列）、各类开源项目（WordPress/Ghost 等）。
- **数据库连接自动注入**：模板拉起 Postgres/Redis 后，连接串自动注入相关服务的环境变量（`DATABASE_URL`/`REDIS_URL`），无需手动配。

- **适合**：新手快速起原型、PoC、学习项目。
- **生产建议**：模板起步后，用 `railway.toml` 版本化自定义配置，迁移到 infra-as-code 管理。

## 四、环境变量：多环境与敏感配置

Railway 的环境变量管理支持多环境与加密：

- **服务级 vs 环境级**：每个项目可有多个环境（如 dev/staging/prod），变量按环境隔离——同一服务在不同环境用不同数据库连接。
- **自动注入**：数据库服务创建后，连接串（`DATABASE_URL`、`REDIS_URL`、`PGHOST` 等）自动注入引用它的服务，无需手抄。
- **敏感配置加密**：API Key、密钥等用加密变量存储，日志脱敏，避免泄露。
- **引用其他变量**：变量值可引用其他变量（如 `DATABASE_URL=postgres://${PGUSER}:${PGPASS}@${PGHOST}/${PGDB}`），减少重复。

- **不要硬编码**：敏感配置绝不进 Git，用 Railway 的变量管理。
- **PR 环境**：每个 PR 可自动拉起隔离环境（含独立变量与数据库副本），便于评审测试。

## 五、DX 三件套：CLI、控制台、日志

- **CLI（`railway` 命令）**：`railway link`（关联项目）、`railway up`（部署）、`railway logs`（查日志）、`railway variables`（管理变量）、`railway add`（加服务/数据库）——终端即可完成全部操作，无需开浏览器。
- **可视化控制台**：以**服务拓扑图**展示各服务与数据库的关系，拖拽连线即可建立引用，比纯命令更直观。
- **实时日志流**：每个服务的日志在控制台实时滚动，支持过滤搜索，调试方便。
- **GitHub 集成**：连仓库后，push 即自动触发构建部署，零 CI 配置（也可用 CLI/railway.toml 接外部 CI）。

## 下一步

DX 与 infra-as-code 讲完后，下一步看[数据库与用量定价](./databases-and-pricing)——Postgres/Redis 内置的实战、用量计费公式（CPU/内存/磁盘/流量按秒）与 Hobby $5 额度的成本预估。
