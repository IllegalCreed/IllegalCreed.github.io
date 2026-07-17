---
layout: doc
---

# 可观测性 Skills

**可观测性 Skills** 是一个泛化叶（可观测性 = observability），涵盖各家把「可观测性平台的用法」打包成 AI 编码 agent 技能的开源集合。本叶以 **Grafana Labs 官方的 `grafana/skills`** 为主线代表——它是 Grafana Labs 官方出品、Apache-2.0 开源、遵循 [agentskills.io](https://agentskills.io) 开放标准的技能集，兼容 Claude Code / Cursor / Codex。48 个 skill 分 7 个插件组，把 Grafana + Prometheus + **LGTM 栈**（Loki 日志 / Grafana 可视化 / Tempo 追踪 / Mimir 指标）+ Pyroscope 剖析 + k6 负载测试的用法，沉淀成 agent 可按需调用的 `SKILL.md`。之所以以 Grafana 锚定：它是领先的开源可观测平台，一手 skill 覆盖面最广、可用来讲清「三大信号 + 采集 + 成本」的完整故事。

> 生态里还有 OpenTelemetry（`dash0hq/agent-skills`，Dash0 出品的 OTel skill）、Sentry、Elastic 等官方/厂商 skill；它们各自锚定自家平台。本叶不逐一展开，而是以 Grafana 官方 `grafana/skills` 作代表把「可观测性 Skills」讲透，并在参考页列出其它生态源。

## 评价

**优点**

- **官方一手**：Grafana Labs 官方出品，48 skill 覆盖 dashboards / PromQL / LogQL / TraceQL / 告警 / 采集 / 成本，全部来自 Grafana 工程实战
- **LGTM 全栈**：一叶讲清可观测性三大信号——Loki（日志）/ Tempo（追踪）/ Mimir + Prometheus（指标），外加 Pyroscope（持续剖析）与 k6（负载测试）
- **采集统一**：`alloy`（一个 OTel 兼容 binary 收 metrics/logs/traces/profiles）、`beyla`（eBPF 零代码插桩）、`opentelemetry`（SDK 自动插桩）三条采集路径都有专技能
- **成本可控**：`adaptive-metrics`（聚合规则缩减 active-series）、`cost-management`（成本归因 + Adaptive 信号 + 用量告警）直击「可观测账单太贵」
- **AI 原生**：`assistant-mcp` 把 AI agent 经 `mcp-grafana` MCP server 连到 Grafana Cloud，直接在编码环境里查指标/仪表盘/告警
- **应用可观测三合一**：`app-observability` 一技能覆盖 APM（OTel spanmetrics）+ 前端 RUM（Faro）+ AI/LLM 监控（OpenLIT）
- **跨 agent**：`npx skills add grafana/skills` 装进 Claude Code / Cursor / Codex

**缺点 / 边界**

- **绑 Grafana 生态**：主线是 Grafana + LGTM 栈；用 Datadog / New Relic / 纯 OTel Collector 时参考价值下降
- **概念门槛**：涉及 PromQL / LogQL / TraceQL 三套查询语言、基数与采样等运维概念，非纯前端读者需补背景
- **部分绑 Cloud**：`grafana-cloud` 组的 18 个 skill（adaptive-metrics / cost-management…）针对 Grafana Cloud，OSS 自建栈用不到全部
- **泛化叶取代表**：本叶用 Grafana 官方锚定；OTel / Sentry / Elastic 的一手 skill 未逐一展开

## 适用场景

- 想用 AI agent 落地可观测性（建仪表盘、写 PromQL/LogQL/TraceQL、配告警），照 Grafana 官方规范做
- 搭 LGTM 栈或 Grafana Cloud，想让 agent 帮你配 Alloy 采集管道、排查「数据没进来」
- 可观测账单太贵，想缩 metrics 基数、归因团队成本（adaptive-metrics / cost-management）
- 给服务上 APM / 前端 RUM / LLM 监控（app-observability），或把 AI agent 连到 Grafana（assistant-mcp）

## 边界

- **不是单个技能，是官方技能集**：48 个 skill 分 7 组，各有触发条件，按需激活
- **是「用法沉淀」不是平台本身**：skill 教 agent 怎么用 Grafana/LGTM，真正的存储与查询在 Grafana 侧
- **泛化叶以 Grafana 锚定**：OTel（dash0hq）、Sentry、Elastic 等生态源见参考页
- **App SDK 偏开发**：`grafana-app-sdk` 组（建 Grafana App）面向插件/平台开发者，与「用可观测」是两条线

## 官方文档

[Grafana 文档](https://grafana.com/docs/) ｜ [Agent Skills 开放标准](https://agentskills.io) ｜ [LGTM 栈介绍](https://grafana.com/oss/)

## GitHub 地址

[grafana/skills](https://github.com/grafana/skills)（Apache-2.0）

## 内容地图

- [入门](./getting-started) —— 定位（泛化可观测性叶 + Grafana 锚定 + 生态说明）、安装、LGTM 栈与 48 skill 总览
- [指南](./guide-line) —— grafana-cloud / grafana-app-sdk / LGTM 逐讲、采集三路、可观测生态、反模式
- [参考](./reference) —— 7 组 48 skill 全表、安装、LGTM 栈表、许可、生态其它源链接

## 幻灯片地址

<a href="/SlideStack/observability-skills-slide/" target="_blank">可观测性 Skills</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=641" target="_blank" rel="noopener noreferrer">可观测性 Skills 测试题</a>
