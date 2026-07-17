---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 dbt-labs/dbt-agent-skills README、tile.json（v1.3.1）与各 SKILL.md 编写。

## 速查

- **装（Claude Code）**：`/plugin marketplace add dbt-labs/dbt-agent-skills` + `/plugin install dbt@dbt-agent-marketplace`
- **装（通用）**：`npx skills add dbt-labs/dbt-agent-skills`
- **12 技能 3 组**：`dbt`(9) · `dbt-migration`(2) · `dbt-extras`(1)
- **每技能**：`SKILL.md`（必）+ 可选 `scripts/` `references/`；frontmatter 仅允许 `name`/`description`/`allowed-tools`/`compatibility`/`license`/`metadata`/`user-invocable`
- **MetricFlow**：latest spec（Core 1.12+/Fusion）vs legacy（1.6–1.11）；metric 类型 simple/derived/cumulative/ratio/conversion
- **CLI**：Core / Fusion(`dbtf`) / Cloud CLI；开发用 `build`、总带 `--select`
- 许可 **Apache-2.0**；dbt Labs 官方

## 12 技能全表

| 技能 | 触发场景 | 覆盖 |
| --- | --- | --- |
| `using-dbt-for-analytics-engineering` | 做任何 dbt 活、建/改模型、探数据源 | 用 `ref()`/`source()` 写转换、建测试、评估影响；软件工程纪律 |
| `running-dbt-commands` | 跑 model/test/build/compile/show | `build` 优先、`--select` 必带、图操作符、`--defer`、run_results 分析 |
| `adding-dbt-unit-test` | 加单测、TDD | Model-Inputs-Outputs、dict/csv/sql 格式、只测复杂逻辑 |
| `building-dbt-semantic-layer` | 建/改语义层组件 | MetricFlow：semantic model/entity/dimension/metric、两种 spec、验证 |
| `answering-natural-language-questions-with-dbt` | 问 analytics/metrics/KPI | 语义层优先，4 级 fallback 到 manifest |
| `working-with-dbt-mesh` | 破坏性变更、版本化、多项目 | 契约/组/访问/版本、跨项目 ref（需 Enterprise） |
| `troubleshooting-dbt-job-errors` | dbt 平台 job 失败 | Admin API/日志/git、按类型分流、铁律不改测试 |
| `configuring-dbt-mcp-server` | 配/排查 dbt MCP | local vs remote、4 客户端、工具开关、凭据安全 |
| `fetching-dbt-docs` | 查 dbt 文档/特性 | LLM 友好 markdown，无需项目 |
| `migrating-dbt-core-to-fusion` | Core → Fusion 迁移报错 | 先 dbt-autofix，再 A/B/C/D 四类分诊 |
| `migrating-dbt-project-across-platforms` | 跨平台迁移 | 信任 Fusion 实时编译、源平台生成单测、0 错 0 警 |
| `creating-mermaid-dbt-dag` | 可视化血缘 | Mermaid `graph LR`，按资源类型着色，层级 fallback 取血缘 |

> 另有较新的 `using-dbt-state`（服务端复用机制，别与 `state:modified` 选择器 / `--state` 延迟混淆）在仓库中、尚未进 v1.3.1 tile。

## SKILL.md frontmatter 字段

只允许这些字段（其它会校验报错）：

| 字段 | 说明 |
| --- | --- |
| `name` | 必填，全小写 + 连字符，须与目录名完全一致 |
| `description` | 必填，一句话，以 `Use when…` 开头（触发判据） |
| `allowed-tools` | 可选，限定技能可用工具（如 `Bash(dbt *), Read, Write`） |
| `compatibility` | 可选，如 `dbt Fusion` |
| `license` | 可选 |
| `metadata` | 可选，自定义键放这（如 `author: dbt-labs`） |
| `user-invocable` | 可选，多数技能设 `false`（自动激活、非手动触发） |

> `version`/`author`/`tags` 不能放顶层，否则「Unexpected fields」校验错——自定义键放 `metadata:` 下。

## MetricFlow 速查

**两种 spec**：

| spec | 版本 | 语义模型定义位置 |
| --- | --- | --- |
| latest | Core 1.12+ / Fusion | 模型上的 `semantic_model:` metadata |
| legacy | Core 1.6–1.11 | 顶层 `semantic_models:` 资源 + measures |

**5 种 metric 类型**：`simple`（聚合单列）· `derived`（多 metric 组合）· `cumulative`（累计，需 time spine）· `ratio`（分子/分母）· `conversion`（漏斗转化）。

**验证顺序**：

```bash
dbt parse            # 或 dbtf parse：确认 YAML 语法与引用
dbt sl validate      # dbt Cloud CLI / Fusion
mf validate-configs  # MetricFlow CLI（读编译后 manifest，改 YAML 须先 parse）
```

> 装 `dbt-metricflow`（不是裸 `metricflow`）以拿到兼容依赖版本。

## dbt CLI flavor 与 selector

| flavor | 位置 | 备注 |
| --- | --- | --- |
| dbt Core | Python venv | `pip show dbt-core` |
| dbt Fusion | `~/.local/bin/dbt` 或 `dbtf` | 更快、SQL 理解更强 |
| dbt Cloud CLI | `~/.local/bin/dbt` | Go 编写，跑在平台上 |

图操作符：`model+`（下游）· `+model`（上游）· `+model+`（双向）· `model+N`（下游 N 层）。`--select` 空格=并集、逗号=交集；`--exclude` 排除。

```bash
# 标准开发命令：build = run + test
dbt build --select my_model --quiet \
  --warn-error-options '{"error": ["NoNodesForSelectionCriteria"]}'

# 预览：用 --limit，不是 SQL LIMIT
dbt show --select my_model --limit 10

# 引用生产数据而非重建上游
dbt build --select my_model --defer --state prod-artifacts
```

## Fusion 迁移分诊 4 类

| 类 | 含义 | 处理 |
| --- | --- | --- |
| A 自动修（安全） | 高置信可自动修 | 确认后自动应用、验证 |
| B 需批准 | 可修但先看 diff | 一次一个 diff、批准后应用 |
| C 需用户输入 | 多种合理做法 | 给选项、等用户决定 |
| D 被阻塞 | 需 Fusion 引擎更新 | 说明原因、附 GitHub issue、讲清 workaround 风险 |

必须**先跑 `dbt-autofix`** 再分诊；验证用真实 repro 命令（如 `dbt compile`），不能只 `dbt parse`。

## 目录结构

```text
dbt-agent-skills/
├── skills/
│   ├── dbt/skills/                 # 分析工程 9 技能
│   │   ├── using-dbt-for-analytics-engineering/SKILL.md
│   │   ├── running-dbt-commands/SKILL.md
│   │   ├── adding-dbt-unit-test/SKILL.md
│   │   ├── building-dbt-semantic-layer/SKILL.md
│   │   └── ...
│   ├── dbt-migration/skills/       # 迁移 2 技能
│   │   ├── migrating-dbt-core-to-fusion/SKILL.md
│   │   └── migrating-dbt-project-across-platforms/SKILL.md
│   └── dbt-extras/skills/
│       └── creating-mermaid-dbt-dag/SKILL.md
├── tile.json                        # 技能清单
└── README.md / CLAUDE.md
```

每技能：`SKILL.md`（agent 指令，必）+ `scripts/`（可选自动化）+ `references/`（可选支撑文档，按需加载）。

## 资源链接

- 仓库：[dbt-labs/dbt-agent-skills](https://github.com/dbt-labs/dbt-agent-skills)（Apache-2.0）
- dbt 文档：[docs.getdbt.com](https://docs.getdbt.com/) · [CLI 参考](https://docs.getdbt.com/reference/dbt-commands)
- Agent Skills：[官网](https://agentskills.io/home) · [规范](https://agentskills.io/specification)
- 相关叶：[Agent Skills 规范](../agent-skills-spec/) · [Vercel Agent Skills](../vercel-agent-skills/)
