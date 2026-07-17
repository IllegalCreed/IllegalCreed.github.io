---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 grafana/skills 官方 skills（可观测性代表）各 `SKILL.md` 逐个精读；LGTM 与采集概念对照 grafana.com/docs。

## 速查

- **两条线**：用可观测（core + cloud + lgtm）+ 建可观测应用（app-sdk + plugins）
- **app-observability**：一技能三产品——APM（OTel spanmetrics `traces_spanmetrics_*`）+ 前端 RUM（Faro）+ AI/LLM 监控（OpenLIT）
- **adaptive-metrics**：聚合规则在存储前缩减 active-series，直接降账单；drop 高基数 label（`pod_uid`/`version`）
- **cost-management**：成本归因 `team`/`project` 外部标签 + Adaptive Metrics/Logs/Traces + 用量告警
- **assistant-mcp**：`go install` mcp-grafana → service-account token → `--disable-write` 只读 → `/mcp` 验证
- **app-sdk**：schema-centric——CUE kinds → `generate` 出 Go/TS 代码 → reconciler/admission 填业务逻辑；三种 deployment mode
- **LGTM**：Loki(LogQL) · Tempo(TraceQL) · Mimir/Prometheus(PromQL) · Pyroscope(火焰图) · k6(负载)
- **采集三路**：Alloy(统一) · Beyla(eBPF 零代码) · OpenTelemetry(SDK)
- **反模式**：高基数 label 炸账单、无采样全量存 trace、健康检查日志不过滤、`pkg/generated/` 手改

## grafana-cloud：Grafana Cloud 全家桶（18 skill）

### app-observability——APM + 前端 RUM + AI 监控三合一

一个 skill 覆盖三个共用 OTLP + Mimir/Loki/Tempo/Pyroscope 底座的产品：

1. **Application Observability（APM）**——从 OTel 追踪自动生成 `traces_spanmetrics_*` 系列的 RED 指标（Rate / Errors / Duration，p50/p95/p99），Service Inventory + Service Map。
2. **Frontend Observability**——用 Faro Web SDK 做浏览器 RUM：Core Web Vitals、session replay、`pushError`、React + router 集成，`TracingInstrumentation` 把浏览器 → 后端的 trace 串起来。
3. **AI Observability**——经 OpenLIT 自动插桩，监控 LLM 的 token / 成本 / 延迟，还有幻觉与毒性评估。

关键关联：`service.name` 连所有信号；trace exemplar 把 trace ID 嵌进指标点；日志里的 `traceID` 和 Faro 注入的 `traceparent` 做前端 → 后端链接。常见坑：服务不出现在 Service Inventory = 缺 `service.namespace` 或 `deployment.environment` 资源属性；Service Map 缺边 = 出站调用没设 `span.kind=CLIENT`。

### adaptive-metrics——聚合规则缩减 active-series 成本

Grafana Cloud 按 **active-series**（活跃时间序列数）计费，高基数 label 会让序列数爆炸。Adaptive Metrics 用聚合规则在存储前把高基数指标预先收缩：

```bash
# 1. 拉自动推荐（按序列缩减影响排序）
curl -s -H "Authorization: Bearer <KEY>" \
  "https://adaptive-metrics.grafana.net/api/v1/recommendations" \
  | jq '.recommendations[] | {metric_name, current_series, projected_series, estimated_reduction_percent}'

# 2. 应用推荐（或 UI 里点 Apply）；~5 分钟生效
```

思路：先看哪些指标的 `version`、`pod_uid`、`service_instance_id` 等 label 是高基数且没被用到，drop 掉这些 label 或按 SUM 聚合。用 `grafanacloud_instance_active_series_dropped_by_aggregation_rules` 度量效果，可随时删规则回滚。手写规则前**务必确认该 label 没被仪表盘/告警用到**。

### cost-management——成本归因 + Adaptive 信号

面向「Grafana 账单太贵、谁在烧钱」：

- **成本归因**：在 Alloy 配置里给指标/日志加 `team` + `project` 外部标签，Cost Management 里按团队/服务分组看花销。
- **三种 Adaptive 信号**：Adaptive Metrics（缩基数）、Adaptive Logs（drop/采样噪声日志，如健康检查）、Adaptive Traces（尾采样到 5–10% 且保留错误/慢 span）。
- **用量告警**：在配额 80% 处设 `MetricsUsageHigh`、`LogsIngestionHigh` 告警，撞配额前预警。

优化清单：应用 Adaptive Metrics 推荐（通常降 40–60% 序列）→ Alloy 里 drop 健康检查日志 → trace 尾采样 → 加 team/project 标签 → 设用量告警 → 用 recording rule 替昂贵的即席查询。

### assistant-mcp——把 AI agent 连到 Grafana

见入门页的接入步骤。要点：`go install` 装 `mcp-grafana`，用 service-account token（`Viewer` 角色够查询/读仪表盘，需写才加 `Editor`），`--disable-write` 作更安全的只读默认，团队共享时从 `stdio` 切到 `SSE` 传输。API key 放环境变量或密钥管理器，**绝不提交进仓库**。

## grafana-app-sdk：建 Grafana App Platform 应用（4 skill）

这条线面向**平台/插件开发者**——用 `grafana-app-sdk`（CLI + Go 库）建 schema-centric 的 Grafana App。

### app-sdk-concepts——脚手架与工作流

```bash
go install github.com/grafana/grafana-app-sdk/cmd/grafana-app-sdk@latest
grafana-app-sdk project init github.com/example/my-app
```

核心是 **schema-centric 开发环**：

```text
1. project init            → 模块、Makefile、kinds/
2. project kind add MyKind → CUE kind 脚手架
3. 编辑 kinds/*.cue         → schema、校验、版本
4. grafana-app-sdk generate → 生成 Go 类型、client、TS 类型、AppManifest、CRD
5. 填 reconciler / admission 业务逻辑
```

三种 deployment mode：**standalone operator**（Grafana 仓库外、自己的 binary，跑成 K8s operator）、**grafana/apps**（在 grafana/grafana 仓库内，进程内跑）、**frontend-only**（纯 UI，只出 TS 类型）。每次改 CUE 都要重跑 `generate`——生成的代码就是 reconciler 看到的 API。

### cue-kind-definition——用 CUE 定义资源 schema

用 CUE 写 kind 的 spec / status schema，带类型约束（regex / enum / range）、`#` 前缀的具名类型、版本注册。`grafana-app-sdk project kind add MyKind` 脚手架，`generate` 出代码。**永远别手改 `pkg/generated/` 下的文件**——每次 `generate` 都会覆盖。

### reconciler-logic——异步业务逻辑层

Reconciler 是 app 的异步业务逻辑层：SDK 在资源被创建/更新/删除时入队 reconcile 事件，reconciler 观察当前状态、把系统驱动向期望状态。首选 `operator.TypedReconciler`（用 `TypedReconciler[*MyKind]` 泛型帮你做类型断言），配 `BasicReconcileOptions`（namespace、label/field 过滤、finalizer），用 `RequeueAfter` 做周期性重新调谐。若 operator 起了但没 reconcile 事件，多半是 namespace 或 label filter 不匹配。

### admission-control——准入控制

写 validation（校验）与 mutation（变更）准入 handler——在资源写入前拦截，做字段校验或默认值注入。

## LGTM 栈：三大信号 + 剖析 + 负载（5 skill）

### Loki（日志 / LogQL）

只索引 label 元数据、不索引全文，比全文检索系统便宜得多。每条 LogQL 查询必须有 log stream selector：

```logql
{app="nginx", env="prod"}                    # 选流（必需）
{app="nginx"} |= "error" != "debug"          # 行过滤
{app="nginx"} | json | status >= 500         # 解析 + label 过滤
sum(rate({app="nginx"} |= "error" [5m]))     # metric 查询
```

解析器有 `json` / `logfmt` / `pattern` / `regexp` / `unpack`；日志经 Alloy / Promtail / Fluent Bit 采集。

### Tempo（追踪 / TraceQL）

只需对象存储（S3/GCS/Azure）的分布式追踪，接受 OTLP / Jaeger / Zipkin。metrics-generator 从 span 产 RED spanmetrics + service graph。TraceQL 按 span / resource / event 作用域查，有结构操作符 `>>`（后代）、`<<`（祖先）：

```traceql
{ resource.service.name = "api" && duration > 500ms }
{ span.http.status_code >= 500 }
```

### Prometheus + Mimir（指标 / PromQL）

Prometheus 是指标采集与告警的事实标准；Mimir 是它的可水平扩展、多租户、长期存储后端（`X-Scope-OrgID` 分租户，接 `remote_write` 与 OTLP）。PromQL 速览：

```promql
sum by (job) (rate(http_requests_total{status=~"5.."}[5m]))
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
```

recording rule 把昂贵查询预计算，alerting rule 触发告警。

### Pyroscope（持续剖析）

持续性能剖析，火焰图看 CPU / 内存 / 分配 / goroutine / mutex 争用热点。三种插桩路径：**Alloy eBPF**（首选，零代码，Linux 5.8+ 带 BTF）、**SDK 直接 push**、**SDK → Alloy 转发**。可对比两个 profile 找回归，或从慢 Tempo trace 关联到 profile（Span Profiles）。

### k6（负载测试）

用 JS/TS 写负载脚本，`thresholds` 做门禁（如 `http_req_duration: ['p(95)<500']`），`executors` / `scenarios` 控流量形状，测试类型有 load/stress/spike/soak/smoke/breakpoint，可本地或 k6 Cloud 跑。

## 采集三路：数据怎么进来

| 路径 | skill | 特点 | 何时用 |
| --- | --- | --- | --- |
| **Alloy** | `alloy` | 一个 OTel 兼容 binary 收 metrics/logs/traces/profiles，config 语言 + 组件引用，UI 在 `:12345` | 统一采集器，替代 Grafana Agent / OTel Collector |
| **Beyla** | `beyla` | eBPF 零代码自动插桩 HTTP/gRPC/DB，无需改代码/SDK/重启（Linux 5.8+ BTF + CAP_SYS_ADMIN） | 不能重编译的服务、闭源 binary、集群级 DaemonSet |
| **OpenTelemetry** | `opentelemetry` | SDK 自动插桩（Go/Java/Python/Node/.NET），OTLP gateway + env var 配置 | 标准 OTel 插桩、从 Jaeger/Datadog 迁移 |

Alloy 常见管道：`prometheus.scrape` → `remote_write`、`loki.source.file` + `loki.process` → `loki.write`、`otelcol.receiver.otlp` → `otelcol.exporter.otlp`。改完用 `alloy fmt` / `alloy validate` 校验，`curl -X POST http://localhost:12345/-/reload` 热重载。

## 可观测生态：Grafana 之外

本叶以 Grafana 官方锚定，但可观测性 Skills 生态是多家的。理解这点有助判断该用哪套：

- **OpenTelemetry（`dash0hq/agent-skills`）**：Dash0 出品的 OTel agent skill，锚定厂商中立的 OpenTelemetry 标准——若你不想绑单一平台、走纯 OTLP，这套更合适。
- **Sentry**：官方 skill 锚定 Sentry 的错误追踪 + 性能监控，前端异常与 release 健康是强项。
- **Elastic**：官方 skill 锚定 Elasticsearch / Kibana 的可观测方案（Elastic APM、日志检索）。

选型直觉：已用 Grafana/LGTM 或 Grafana Cloud → `grafana/skills`；想平台中立、只认 OTel → dash0hq；错误追踪为主 → Sentry；已在 ELK 栈 → Elastic。

## 反模式

- **高基数 label 炸账单**：把 `user_id`、`pod_uid`、`request_id` 塞进指标 label → active-series 爆炸。用 adaptive-metrics 缩，或源头就别加。
- **无采样全量存 trace**：全量存追踪又贵又慢。用尾采样保留错误/慢 span、丢正常流量。
- **健康检查日志不过滤**：`GET /health` 刷屏烧日志配额。Alloy 里 drop 掉。
- **手改生成代码**：改 `pkg/generated/` 下的文件 → 下次 `generate` 被覆盖。改 CUE 源、重跑 generate。
- **MCP 给写权限当默认**：共享环境不加 `--disable-write` → agent 误改 Grafana。只读起步。

## 下一步

- [参考](./reference) —— 7 组 48 skill 全表、安装、LGTM 栈表、许可、生态其它源
- 上游：[Grafana 文档](https://grafana.com/docs/) · [grafana/skills](https://github.com/grafana/skills)
