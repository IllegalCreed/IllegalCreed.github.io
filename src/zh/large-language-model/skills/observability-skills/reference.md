---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 grafana/skills 官方 skills（可观测性代表）README、skill-registry.json 与各 `SKILL.md` 编写。

## 速查

- **装**：`npx skills add grafana/skills`；Claude Code 用 `claude plugin marketplace add grafana/skills` + 按组 install
- **规模**：48 skill / 7 插件组；许可 **Apache-2.0**；遵 agentskills.io
- **LGTM**：Loki(LogQL) · Grafana · Tempo(TraceQL) · Mimir(PromQL) + Prometheus + Pyroscope + k6
- **采集**：Alloy · Beyla(eBPF) · OpenTelemetry(SDK)
- **生态其它源**：dash0hq/agent-skills（OTel）· Sentry · Elastic

## 7 插件组 48 skill 全表

### grafana-core（8）—— 仪表盘、查询、告警、采集

| skill | 覆盖 |
| --- | --- |
| `grafana-oss` | Grafana OSS 核心——仪表盘、数据源、provisioning、RBAC、服务配置 |
| `dashboarding` | 建仪表盘——panel、变量、transformation、阈值 |
| `promql` | 写、验证、优化 PromQL |
| `alerting-irm` | Grafana 告警、事件响应管理（IRM）、SLO——规则、联系点、on-call |
| `alloy` | Alloy OTel 采集器——config 语言、组件、遥测管道 |
| `beyla` | Beyla eBPF 零代码自动插桩 |
| `opentelemetry` | OTel + Grafana 栈——SDK 插桩、OTLP、采集器 |
| `skill-authoring` | 写 Grafana skill 本身的规范 |

### grafana-cloud（18）—— Grafana Cloud 全家桶

| skill | 覆盖 |
| --- | --- |
| `admin` | 账户管理——组织、stack、RBAC、SSO、服务账号 |
| `send-data` | 发遥测到 Cloud——metrics/logs/traces/profiles |
| `fleet-management` | 用 remotecfg + OpAMP 远程管理 Alloy 采集器集群 |
| `cloud-integrations` | 接 AWS / Azure 等云厂商 |
| `infrastructure` | 基础设施监控——K8s、主机/容器指标 |
| `app-observability` | 应用可观测——APM + 前端 RUM（Faro）+ AI/LLM（OpenLIT） |
| `database-observability` | MySQL / PostgreSQL 查询级性能洞察 |
| `adaptive-metrics` | 聚合规则缩减 active-series 成本、基数管理 |
| `cost-management` | 成本监控、归因、用量告警、优化 |
| `dpm-finder` | 找驱动高 DPM（每分钟数据点）的指标 |
| `loki-label-analyzer` | 评估改进 Loki label 策略 |
| `prometheus-label-strategy` | 审计设计 Prometheus label schema |
| `prometheus-cardinality-troubleshooter` | 诊断 Prometheus 基数问题（慢查询、OOM、高账单） |
| `oncall-irm` | OnCall + IRM——告警路由、升级链、事件生命周期 |
| `ml-ai` | AI/ML 特性——Assistant、动态告警、Sift、知识图谱、LLM 插件 |
| `assistant-mcp` | 经 mcp-grafana 把 AI agent 连到 Grafana Cloud |
| `private-connectivity` | 私网连接——AWS PrivateLink / Azure Private Link / GCP PSC |
| `testing` | 合成监控、k6 Cloud 负载测试、前端可观测 |

### grafana-lgtm（5）—— LGTM 栈 + 剖析

| skill | 覆盖 |
| --- | --- |
| `loki` | 日志聚合 + LogQL、pipeline、架构 |
| `tempo` | 分布式追踪 + TraceQL、service graph、关联 |
| `prometheus` | 指标 + PromQL、告警、recording rule、Mimir |
| `mimir` | 可扩展长期指标存储——架构与运维 |
| `pyroscope` | 持续剖析——火焰图、diff、多语言支持 |

### grafana-plugins（5）—— 建 Grafana 插件

| skill | 覆盖 |
| --- | --- |
| `plugin-bundle-size` | 用 React.lazy/Suspense/webpack 代码分割优化插件 bundle |
| `react-19-plugin-migration` | 迁移插件到 React 19（Grafana 13 前） |
| `grafana-scenes` | 用 @grafana/scenes 框架建插件页面 |
| `check-npm` | 审计 npm/yarn/pnpm 配置做供应链加固 |
| `audit-and-reduce-dependencies` | 缩减 pnpm 依赖足迹 |

### grafana-app-sdk（4）—— 建 Grafana App Platform 应用

| skill | 覆盖 |
| --- | --- |
| `app-sdk-concepts` | project init、三种 deployment mode、schema-centric 工作流 |
| `cue-kind-definition` | 用 CUE 写 kind schema——版本、spec/status、codegen |
| `reconciler-logic` | 实现异步 reconciler / watcher 业务逻辑 |
| `admission-control` | 写 validation / mutation 准入 handler |

### grafana-k6（7）—— k6 负载测试

| skill | 覆盖 |
| --- | --- |
| `k6` | k6 负载测试——脚本、executor、阈值、场景、k6 Cloud |
| `k6-docs` | 写/审 k6 文档 |
| `k6-perf-test-website` | 端到端压测公开网站（协议 + 浏览器混合） |
| `k6-manage` | 用 gcx CLI / curl 操作 Grafana Cloud k6 |
| `k6-cloud-investigate-test` | 排查某个 Cloud k6 测试/运行的通过/失败根因 |
| `k6-trend-analysis` | 分析 Cloud k6 运行趋势、阈值余量 |
| `k6-test-maintenance` | 维护改进已有 k6 脚本——阈值收紧、迁移、重构 |

### grafana-datasources（1）

| skill | 覆盖 |
| --- | --- |
| `datasources-provisioning` | Grafana 数据源插件配置的编写与 schema 发现 |

## 安装速查

```bash
# 任何 Agent Skills 工具
npx skills add grafana/skills

# Claude Code：加市场 + 按组装
claude plugin marketplace add grafana/skills
claude plugin install grafana-core@grafana-skills
claude plugin install grafana-lgtm@grafana-skills
claude plugin install grafana-cloud@grafana-skills
claude plugin install grafana-k6@grafana-skills
claude plugin install grafana-app-sdk@grafana-skills
claude plugin install grafana-plugins@grafana-skills
claude plugin install grafana-datasources@grafana-skills
```

## LGTM 栈对照表

| 组件 | 信号 | 查询语言 | 存储 | 一句话 |
| --- | --- | --- | --- | --- |
| Loki | 日志 | LogQL | 对象存储 | 只索引 label，不索引全文 |
| Grafana | 可视化 | — | — | 统一门户 |
| Tempo | 追踪 | TraceQL | 对象存储 | 只需对象存储的追踪后端 |
| Mimir | 指标 | PromQL | 对象存储 | 可扩展多租户长期指标存储 |
| Prometheus | 指标 | PromQL | 本地/远程 | 指标采集告警事实标准 |
| Pyroscope | 剖析 | — | 对象存储 | 火焰图看性能热点 |
| k6 | 负载 | — | — | JS/TS 写负载脚本 |

## 目录结构

```text
grafana-skills/
├── .claude-plugin/marketplace.json    # Claude Code 市场清单
├── .cursor-plugin/marketplace.json    # Cursor 市场清单
├── .agents-plugin/marketplace.json    # Codex 市场清单
├── skill-registry.json                # 机器可读 skill 清单
├── skills/                            # 全部 skill，按插件组分
│   ├── grafana-core/  grafana-cloud/  grafana-lgtm/
│   ├── grafana-plugins/  grafana-app-sdk/
│   └── grafana-k6/  grafana-datasources/
├── template/SKILL.md                  # 新 skill 起始模板
└── scripts/lint-skills.sh             # 本地校验
```

每个 skill = `SKILL.md`（agent 指令，含 frontmatter 的 name/license/description）+ 可选 `references/`（支撑文档）+ 可选 `scripts/`。

## 许可

**Apache License 2.0** —— Grafana Labs 官方出品。

## 生态其它源

| 源 | 出品方 | 锚定 |
| --- | --- | --- |
| [grafana/skills](https://github.com/grafana/skills)（本叶主线） | Grafana Labs | Grafana + LGTM |
| [dash0hq/agent-skills](https://github.com/dash0hq/agent-skills) | Dash0 | OpenTelemetry |
| Sentry 官方 skill | Sentry | 错误追踪 + APM |
| Elastic 官方 skill | Elastic | Elasticsearch / Kibana |

## 下一步

- 上游：[grafana/skills](https://github.com/grafana/skills)（Apache-2.0）· [Grafana 文档](https://grafana.com/docs/) · [Agent Skills 标准](https://agentskills.io)
- 回看：[入门](./getting-started) · [指南](./guide-line)
