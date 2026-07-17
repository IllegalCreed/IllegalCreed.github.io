---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 grafana/skills 官方 skills（可观测性代表）主分支的 README、skill-registry.json 与各 `SKILL.md` 编写；LGTM 概念对照 grafana.com/docs。

## 速查

- **定位**：可观测性 Skills = 泛化叶（可观测性 = observability），本叶以 Grafana Labs 官方 `grafana/skills` 锚定；生态另有 OTel（dash0hq/agent-skills）、Sentry、Elastic
- **装**：`npx skills add grafana/skills`（任何遵 agentskills.io 的工具）；Claude Code 用 `claude plugin marketplace add grafana/skills` 再按插件组 install
- **规模**：48 skill / 7 插件组（core 8 · cloud 18 · lgtm 5 · plugins 5 · app-sdk 4 · k6 7 · datasources 1）
- **LGTM 栈**：**L**oki（日志/LogQL）· **G**rafana（可视化）· **T**empo（追踪/TraceQL）· **M**imir（指标长期存储）+ Prometheus（指标/PromQL）+ Pyroscope（剖析）+ k6（负载）
- **采集三路**：`alloy`（统一 OTel 兼容采集器）· `beyla`（eBPF 零代码）· `opentelemetry`（SDK 插桩）
- **明星 skill**：`app-observability`（APM+RUM+LLM）· `adaptive-metrics`（省成本）· `assistant-mcp`（AI agent 连 Grafana）· `app-sdk-concepts`（建 Grafana App）
- **许可**：Apache-2.0；兼容 Claude Code / Cursor / Codex

## 这是什么

「可观测性 Skills」是一个**泛化叶**：可观测性（observability）指用指标（metrics）、日志（logs）、追踪（traces）三大信号理解系统内部状态。各家可观测平台都在把「自家平台怎么用」打包成 AI agent 技能，本叶以 **Grafana Labs 官方 `grafana/skills`** 为代表锚定——因为 Grafana 是领先的开源可观测平台，一手 skill 覆盖面最广，能把「三大信号 + 采集 + 成本」的完整故事讲清楚。

生态里还有其它官方源，各自锚定自家平台：

| 生态源 | 出品方 | 锚定平台 |
| --- | --- | --- |
| `grafana/skills`（本叶主线） | Grafana Labs | Grafana + LGTM 栈 |
| `dash0hq/agent-skills` | Dash0 | OpenTelemetry |
| Sentry 官方 skill | Sentry | 错误追踪 + APM |
| Elastic 官方 skill | Elastic | Elasticsearch / Kibana |

## 安装

`grafana/skills` 遵循 agentskills.io 开放标准，任何兼容工具都能一条命令装：

```bash
# 推荐：任何 Agent Skills 工具（Claude Code / Cursor / Codex 等）
npx skills add grafana/skills
```

Claude Code 也可用插件市场，**按插件组按需安装**（不必全装）：

```bash
# 1. 添加市场
claude plugin marketplace add grafana/skills

# 2. 装你需要的插件组
claude plugin install grafana-core@grafana-skills     # dashboards / PromQL / 采集
claude plugin install grafana-lgtm@grafana-skills      # Loki / Tempo / Mimir / Pyroscope
claude plugin install grafana-cloud@grafana-skills     # Grafana Cloud 全家桶
claude plugin install grafana-k6@grafana-skills        # 负载测试
claude plugin install grafana-app-sdk@grafana-skills   # 建 Grafana App
```

- **Cursor**：同样跑 `npx skills add grafana/skills`，技能写进项目的 `.cursor/skills/`
- **Codex**：经 `.agents-plugin/marketplace.json` 自动发现，无需手动配置
- 装后 agent 检测到相关任务自动激活，也可自然语言显式触发（如「帮我写一条 PromQL」「配 Alloy 采集」）

## LGTM 栈：可观测性三大信号

Grafana 把可观测性拆成三大信号 + 剖析 + 负载测试，`grafana-lgtm` 组一一对应：

| 缩写 | 组件 | 信号 | 查询语言 | 一句话 |
| --- | --- | --- | --- | --- |
| **L** | Loki | 日志 | LogQL | 只索引 label 元数据、不索引全文，比全文检索便宜得多 |
| **G** | Grafana | 可视化 | — | 仪表盘、Explore、关联跳转的统一门户 |
| **T** | Tempo | 追踪 | TraceQL | 只需对象存储的分布式追踪，接 OTLP/Jaeger/Zipkin |
| **M** | Mimir | 指标 | PromQL | 可水平扩展、多租户的长期 Prometheus + OTLP 指标存储 |
| — | Prometheus | 指标 | PromQL | 指标采集与告警的事实标准 |
| — | Pyroscope | 剖析 | — | 持续性能剖析，火焰图看 CPU/内存/分配热点 |
| — | k6 | 负载 | — | 用 JS/TS 写负载测试脚本，阈值门禁 + 场景 |

三大信号靠 `service.name` 等关联键串起来：指标 exemplar 里嵌 trace ID，日志里带 traceID，从一个信号一键跳到另一个。

## 48 skill 总览（7 插件组）

| 插件组 | 数量 | 代表 skill | 干什么 |
| --- | --- | --- | --- |
| `grafana-core` | 8 | grafana-oss · dashboarding · promql · alerting-irm · **alloy** · **beyla** · **opentelemetry** | 仪表盘、PromQL、告警、采集 |
| `grafana-cloud` | 18 | **app-observability** · **adaptive-metrics** · **cost-management** · **assistant-mcp** · fleet-management | Grafana Cloud 全家桶 |
| `grafana-lgtm` | 5 | loki · tempo · prometheus · mimir · pyroscope | LGTM 栈 + 剖析 |
| `grafana-plugins` | 5 | plugin-bundle-size · grafana-scenes · react-19-plugin-migration | 建 Grafana 插件 |
| `grafana-app-sdk` | 4 | **app-sdk-concepts** · cue-kind-definition · reconciler-logic · admission-control | 建 Grafana App Platform 应用 |
| `grafana-k6` | 7 | k6 · k6-manage · k6-perf-test-website · k6-trend-analysis | k6 负载测试 |
| `grafana-datasources` | 1 | datasources-provisioning | 数据源插件配置 |

## 一分钟上手：让 agent 连 Grafana

`assistant-mcp` 把 AI agent 经 `mcp-grafana` MCP server 连到 Grafana Cloud，之后直接在对话里查指标、搜仪表盘、管告警：

```bash
# 1. 装 MCP server
go install github.com/grafana/mcp-grafana/cmd/mcp-grafana@latest

# 2. Grafana → Administration → Service Accounts 建 Viewer 角色、生成 token
```

```json
// 3. 写进 ~/.claude/settings.json（--disable-write 是更安全的只读默认）
{
  "mcpServers": {
    "grafana": {
      "command": "mcp-grafana",
      "args": ["--disable-write"],
      "env": {
        "GRAFANA_URL": "https://myorg.grafana.net",
        "GRAFANA_API_KEY": "glsa_xxxx"
      }
    }
  }
}
```

重启 agent，用 `/mcp` 确认 `grafana` server 出现，再问「我的 Grafana 里配了哪些数据源？」——有干净回答即接通。

## 下一步

- [指南](./guide-line) —— grafana-cloud / grafana-app-sdk / LGTM 逐讲、采集三路、可观测生态、反模式
- [参考](./reference) —— 7 组 48 skill 全表、安装、LGTM 栈表、许可、生态其它源
