---
layout: doc
---

# Railway

**Railway** 是一个**用量计费的全托管部署平台**——它与 Render 同为「Heroku 继承者」，但走的是另一条路：**用量定价（Usage-based）**+ **基础设施即代码（infra-as-code）** + **极致开发者体验（DX）**。一句话定位：**给"嫌 Render/Vercel 按实例计费不够灵活、想要按秒付实际用量"的开发者的现代 PaaS**。

Railway 的全部能力围绕「**按秒计量、用多少付多少**」这一核心展开——你不必为「实例长驻」付固定月费，而是按 CPU/内存/磁盘/流量的**实际秒级消耗**计费，Hobby 套餐 $5/mo 即含 $5 用量额度。开发者面对的是 **`railway.toml`/`railway.json` 声明式配置**、**模板市场一键拉起全套服务**、**Postgres/Redis 内置**，而不是虚拟机与运维脚本。理解 Railway 的核心机制（用量计费 vs 长驻实例计费、infra-as-code 的版本化、模板与数据库的一键集成、环境变量的多环境管理），是判断「这个项目该用 Railway 还是 Render、用量计费到底省不省钱」的基础——一个不懂用量计费的开发者会用 Hobby 跑高负载服务（额度耗尽按量续费反而更贵），不懂 infra-as-code 的会在控制台手点配置导致环境漂移。

## 评价

**优点**

- **按秒用量计费**：CPU/内存/磁盘/流量按实际秒级消耗计费，Hobby $5/mo 含 $5 额度——低流量/开发期项目极省钱（无空闲溢价）
- **基础设施即代码（infra-as-code）**：`railway.toml`/`railway.json` 声明服务、数据库、环境变量，随仓库版本化，可重复重建环境
- **极致 DX**：连接 GitHub → push 即部署；Web 控制台可视化服务拓扑；实时日志流；命令行 CLI 完整覆盖
- **内置数据库生态**：Postgres、Redis、MySQL、MongoDB 经模板一键部署，模板市场还有 ClickHouse、RabbitMQ 等
- **模板市场**：一键拉起整套服务（前端 + 后端 + 数据库），新手快速起项目

**缺点**

- **用量计费在高负载下可能更贵**：流量/计算密集型应用的实际消耗可能超过固定月费方案，需监控额度
- **免费试用有时限**：Free Trial 给 $5 额度 + 30 天，过期需升级 Hobby——不像 Render 的静态站永久免费
- **不如 Kubernetes 灵活**：封装了容器/网络/调度，深度定制（自定义网络拓扑、DaemonSet、GPU）做不到
- **国内访问与备案**：节点在海外，面向国内终端用户有延迟，且不能解决 ICP 备案（国内合规仍需国内云）

## 本叶地图

- [入门](./getting-started) —— Railway 定位（Heroku 继承者/用量计费）、分层（Hobby $5/mo 含额度）、infra-as-code、数据库内置、模板
- [DX 与基础设施即代码](./guide-line/dx-and-infra) —— infra-as-code（railway.toml/json）、极致 DX（CLI/控制台/日志）、模板市场与环境变量
- [数据库与用量定价](./guide-line/databases-and-pricing) —— Postgres/Redis 内置、用量计费公式（CPU/内存/磁盘/流量按秒）、Hobby 额度与成本预估
- [参考](./reference) —— 服务类型速查、用量计费矩阵、Render vs Railway 对比、易错点清单

## 幻灯片地址

<a href="/SlideStack/railway-slide/" target="_blank">Railway</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=Railway" target="_blank" rel="noopener noreferrer">Railway 测试题</a>
