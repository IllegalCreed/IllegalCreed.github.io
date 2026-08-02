---
layout: doc
---

# Render

**Render** 是一个**全托管云平台**——它继承了 **Heroku 的极简部署体验**（git push 即部署、零 DevOps），又补齐了 Heroku 时代缺失的**分层计费**、**Docker 原生**、**内置 Postgres**、**静态站托管**、**合规（HIPAA）**等现代能力。一句话定位：**给"想用 Heroku 但嫌它贵/缺功能"的开发者的现代继承者**。

Render 的全部能力围绕**服务（Service）**这一抽象展开——你不必再为「买服务器、装系统、配 Nginx、申请证书、接 CI」操心，只需声明「我要一个长驻 Web Service / 一个后台 Worker / 一个 Postgres / 一个静态站」，Render 负责构建、部署、扩缩、证书、日志、告警。开发者面对的是**render.yaml 声明式配置**与 **GitHub/GitLab 自动部署**，而不是虚拟机与运维脚本。理解 Render 的核心机制（分层定价 vs 免费层、长驻 Web Service 与后台 Worker 的区别、Docker 优先、Postgres 内置、静态站与 Preview Environments、HIPAA 合规路径），是判断「这个项目该不该用 Render、用哪一档、配哪种服务」的基础——一个不懂分层计费的开发者会用免费层跑生产库（30 天后数据蒸发），不懂 Worker 的会把定时任务塞进 Web Service（请求超时被杀）。

## 评价

**优点**

- **Heroku 级 DX**：连接 GitHub 仓库 → 选服务类型 → 自动构建部署，git push 即上线，无需碰 Dockerfile/Nginx/证书
- **分层计费透明**：从 Free（探索用）→ Starter $7/mo（生产入门）→ Pro/Scale/Enterprise，按服务**长驻实例**计费，预算可预测
- **Docker 原生**：无需 Dockerfile 也能跑（自动检测 Node/Python/Ruby 等运行时），有 Dockerfile 则完全自定义构建与启动
- **内置生态**：Postgres、Redis、Key-Value、静态站、Background Worker 全在一个平台，免去跨服务商拼装
- **合规就绪**：Scale/Enterprise 档支持 HIPAA（+20% 计算溢价），医疗健康类受监管应用可直接落地

**缺点**

- **免费层不适合生产**：Free Web Service 15 分钟无流量休眠（冷启动慢）；Free Postgres **30 天后自动删除**，只能用于 demo
- **长驻实例成本随服务数线性增长**：每个 Web Service/Worker 至少占一个实例，微服务多/环境多（dev/staging/prod）时账单上升明显
- **不如 Kubernetes 灵活**：Render 把容器/网络/调度都封装了，深度定制（自定义网络拓扑、DaemonSet、GPU）做不到，重度运维场景仍需 K8s
- **国内访问与备案**：Render 节点在海外，面向国内终端用户的应用有延迟，且**不能解决 ICP 备案**（国内合规仍需国内云）

## 本叶地图

- [入门](./getting-started) —— Render 定位（Heroku 继承者）、分层定价、服务类型（Web Service/Worker/Postgres/静态站）、合规
- [服务与定价详解](./guide-line/services-and-pricing) —— Web Service 与 Background Worker 的区别与计费、Postgres 分层、Starter $7/mo vs Free、HIPAA 路径
- [部署、Docker 与静态站](./guide-line/deploy-and-docker) —— Git 自动部署、Docker 优先策略、静态站与 JAMstack、Preview Environments
- [参考](./reference) —— 服务类型速查、定价矩阵、Heroku 迁移对照、易错点清单

## 幻灯片地址

<a href="/SlideStack/render-slide/" target="_blank">Render</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=Render" target="_blank" rel="noopener noreferrer">Render 测试题</a>
