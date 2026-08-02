---
layout: doc
outline: [2, 3]
---

# 入门：Railway 定位、用量计费与基础设施即代码

> 基于 Railway 官方文档 · 核于 2026-08

## 速查

- **定位**：Railway 是**用量计费的全托管部署平台**，与 Render 同为「Heroku 继承者」，但走**用量定价 + infra-as-code + 极致 DX** 路线。
- **核心计费：按秒用量**。CPU/内存/磁盘/流量按**实际秒级消耗**计费（无空闲溢价），与 Render/Vercel 的「按长驻实例月费」不同——低流量项目更省钱。
- **Hobby $5/mo**：含 **$5 用量额度**，超出按量续费；Free Trial 给 $5 额度 + 30 天（无需信用卡）。
- **基础设施即代码（infra-as-code）**：`railway.toml`/`railway.json` 声明服务/数据库/环境变量，随仓库版本化，`railway up` 一键重建环境。
- **极致 DX**：连 GitHub → push 即部署；可视化服务拓扑控制台；实时日志流；CLI 完整覆盖。
- **内置数据库**：Postgres、Redis、MySQL、MongoDB 经模板一键部署，连接串自动注入环境变量。
- **模板市场**：一键拉起整套服务栈（前端 + 后端 + 数据库），新手快速起项目；还有 ClickHouse、RabbitMQ 等。
- **用量计费的代价**：高负载应用实际消耗可能超过固定月费，需监控额度——稳定高流量选长驻实例可能更划算。
- **进阶顺序**：[DX 与基础设施即代码](./guide-line/dx-and-infra) → [数据库与用量定价](./guide-line/databases-and-pricing) → [参考](./reference)。

## 一、Railway 是什么：用量计费的 Heroku 继承者

Railway 与 Render 都自称 Heroku 继承者，但走了不同的计费路线：

- **Render**：按**长驻实例**计费——Web Service $7/mo 起，实例持续运行持续收费，成本是每月固定水平线。
- **Railway**：按**实际用量**计费——CPU/内存/磁盘/流量按秒级消耗计量，用多少付多少，成本随用量浮动。

Railway 的口号是「**No overprovisioning, no idle markup, no surprises**」（不过度配置、无空闲溢价、无意外账单）——你不为「实例空着」付费，只为「实际跑的计算」付费。这对**低流量项目、开发期、突发流量**场景极友好：一个开发期几乎没流量的应用，用 Railway 可能每月只花几毛钱，用 Render 至少 $7。

一句话：**Railway = Heroku 的部署体验 + 按秒用量计费 + infra-as-code + 内置数据库 + 模板市场。**

## 二、分层与用量计费

Railway 的计费分档：

| 档位 | 定位 | 关键点 |
| --- | --- | --- |
| **Free Trial** | 试用 | **$5 额度 + 30 天**，无需信用卡，每个服务最多 2 vCPU / 1GB |
| **Hobby** | 个人/副业 | **$5/mo**，含 **$5 用量额度**，超出按量续费 |
| **Pro** | 团队 | 更高额度上限、协作、权限管理 |

- **按秒计量单价**（参考）：内存约 $0.00000386/GB·秒，CPU 约 $0.00000772/vCPU·秒，磁盘约 $0.00000006/GB·秒，出站流量约 $0.05/GB。
- **Hobby 的 $5 额度能跑多少**：一个小型低流量 Web 服务 + 一个小 Postgres，开发期每月消耗通常在额度内（近乎"白嫖"）；生产稳定流量则要看实际消耗是否超额。
- **用量计费的双刃剑**：低流量省钱，高负载（如突发爬虫、高 QPS API）可能消耗暴涨，账单失控——需设预算告警。

## 三、基础设施即代码（infra-as-code）

Railway 支持 `railway.toml`（或 `railway.json`）声明式配置：

```toml
[deploy]
# 服务启动命令
startCommand = "npm start"
# 健康检查
healthcheckPath = "/health"
healthcheckTimeout = 30

[[service]]
name = "api"
# 构建配置
builder = "nixpacks"   # 或 dockerfile
```

- **版本化**：配置文件进 Git，团队任何人 `railway up` 即可重建环境，避免控制台手点导致的环境漂移。
- **与 Dockerfile 兼容**：可用 Nixpacks（Railway 自研构建器，零配置检测运行时）或自己的 Dockerfile。
- **环境变量引用**：数据库连接串等可自动注入，避免硬编码。

## 四、内置数据库与模板市场

- **内置数据库**：Postgres、Redis、MySQL、MongoDB 经模板一键部署，Railway 自动管理备份与连接，连接串注入环境变量（如 `DATABASE_URL`、`REDIS_URL`）。
- **模板市场**：一键拉起**整套服务栈**——例如「Next.js + Postgres + Redis」一个模板搞定，适合新手快速起项目与原型验证。
- **进阶模板**：还有 ClickHouse（分析型数据库）、RabbitMQ（消息队列）等，覆盖更多场景。

## 五、极致 DX：CLI、控制台、日志

- **GitHub 集成**：连仓库 → push 即自动构建部署。
- **可视化控制台**：以**服务拓扑图**展示各服务与数据库的关系，拖拽即可连线，直观。
- **实时日志流**：每个服务的日志实时滚动，便于调试。
- **CLI**：`railway` 命令行完整覆盖（link/up/logs/variables/add），可在终端完成全部操作，无需开浏览器。

## 下一步

理解了 Railway 的定位、用量计费与 infra-as-code 后，下一步深入两块——[DX 与基础设施即代码](./guide-line/dx-and-infra)（infra-as-code 实战、模板与环境变量）与[数据库与用量定价](./guide-line/databases-and-pricing)（Postgres/Redis 内置、用量计费公式与成本预估）。
