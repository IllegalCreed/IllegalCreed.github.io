---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 addyosmani/agent-skills README 与 `docs/` 编写。24 技能（23 生命周期 + 1 meta）、8 命令、4 persona、7 参考清单。

## 速查

- **装**：`npx skills add addyosmani/agent-skills`（70+ agent）或 `/plugin install agent-skills@addy-agent-skills`
- **8 命令**：`/spec` `/plan` `/build`（`/build auto` 自主）`/test` `/review` `/webperf` `/code-simplify` `/ship`
- **6 阶段**：DEFINE → PLAN → BUILD → VERIFY → REVIEW → SHIP
- **技能六段**：Overview / When / Process / Rationalizations / Red Flags / Verification
- Addy Osmani（Google）+ 协作者，MIT

## 24 技能（按阶段）

### Meta
| 技能 | 作用 |
| --- | --- |
| `using-agent-skills` | 把来的活映射到对的技能，定义共享操作规则 |

### DEFINE
| 技能 | 作用 |
| --- | --- |
| `interview-me` | 一次一问访谈，挖真实需求到 ~95% 置信 |
| `idea-refine` | 发散/收敛把模糊想法变具体提案 |
| `spec-driven-development` | 写 PRD（目标/命令/结构/风格/测试/边界）先于代码 |

### PLAN
| `planning-and-task-breakdown` | 把 spec 分解成小而可验证的任务 + 验收 + 依赖排序 |

### BUILD
| 技能 | 作用 |
| --- | --- |
| `incremental-implementation` | 薄垂直切片：实现→测试→验证→commit，feature flag、可回滚 |
| `test-driven-development` | Red-Green-Refactor、测试金字塔 80/15/5、DAMP over DRY、Beyoncé Rule |
| `context-engineering` | 在对的时间喂对的信息——规则文件、上下文打包、MCP |
| `source-driven-development` | 每个框架决策扎根官方文档、引用来源、标注未验证 |
| `doubt-driven-development` | 对抗性 fresh-context 审查：CLAIM→EXTRACT→DOUBT→RECONCILE→STOP |
| `frontend-ui-engineering` | 组件架构、设计系统、状态管理、WCAG 2.1 AA |
| `api-and-interface-design` | 契约优先、Hyrum's Law、One-Version Rule、错误语义 |

### VERIFY
| `browser-testing-with-devtools` | Chrome DevTools MCP 取实时运行时数据 |
| `debugging-and-error-recovery` | 五步 triage：复现、定位、缩小、修、加护栏 |

### REVIEW
| `code-review-and-quality` | 五轴审查、改动定大小(~100 行)、严重度标签、拆分策略 |
| `code-simplification` | Chesterton's Fence、Rule of 500，降复杂保行为 |
| `security-and-hardening` | OWASP Top 10、鉴权、密钥、依赖审计、三层边界 |
| `performance-optimization` | 先测量——Core Web Vitals、profiling、bundle 分析 |

### SHIP
| `git-workflow-and-versioning` | trunk-based、原子 commit、改动定大小、commit 即存档点 |
| `ci-cd-and-automation` | Shift Left、Faster is Safer、feature flag、质量门流水线 |
| `deprecation-and-migration` | 代码即负债、强制 vs 建议废弃、迁移模式、僵尸代码移除 |
| `documentation-and-adrs` | ADR、API 文档、记录「为什么」 |
| `observability-and-instrumentation` | 结构化日志、RED 指标、OpenTelemetry、症状式告警 |
| `shipping-and-launch` | 上线前清单、feature flag 生命周期、分阶段 rollout、回滚 |

## 8 命令

| 命令 | 阶段 | 原则 |
| --- | --- | --- |
| `/spec` | DEFINE | Spec 先于代码 |
| `/plan` | PLAN | 小而原子的任务 |
| `/build`（`/build auto`）| BUILD | 一次一片（auto 自主但仍 test-driven） |
| `/test` | VERIFY | 测试即证据 |
| `/review` | REVIEW | 改善代码健康 |
| `/webperf` | REVIEW | 先测量再优化（跑 web-performance-auditor） |
| `/code-simplify` | REVIEW | 清晰胜过聪明 |
| `/ship` | SHIP | 更快即更安全 |

## 4 个 persona

| Persona | 角色 |
| --- | --- |
| code-reviewer | 资深 Staff 工程师（五轴审查） |
| test-engineer | QA 专家（测试策略 + Prove-It） |
| security-auditor | 安全工程师（威胁建模 + OWASP） |
| web-performance-auditor | Web 性能工程师（Core Web Vitals，`/webperf`） |

> 规则：persona 不调用 persona。

## 7 参考清单

definition-of-done / testing-patterns / security-checklist / performance-checklist / accessibility-checklist / observability-checklist / orchestration-patterns —— 技能按需拉入。

## 跨工具安装

| 工具 | 方式 |
| --- | --- |
| 任意（70+）| `npx skills add addyosmani/agent-skills` |
| Claude Code | `/plugin marketplace add addyosmani/agent-skills` + install |
| Cursor | 放 `.cursor/skills/`，短策略进 `.cursor/rules/*.mdc` |
| Antigravity | `agy plugin install https://github.com/addyosmani/agent-skills.git` |
| Gemini CLI | `gemini skills install … --path skills` |
| Codex（v0.122+）| `codex plugin marketplace add addyosmani/agent-skills`（`@` 调用） |

## 资源链接

- 仓库：[addyosmani/agent-skills](https://github.com/addyosmani/agent-skills)
- 技能解剖：[skill-anatomy](https://github.com/addyosmani/agent-skills/blob/main/docs/skill-anatomy.md)
- 三者对比：[comparison](https://github.com/addyosmani/agent-skills/blob/main/docs/comparison.md)（vs Superpowers / Matt Pocock）
- 相关叶：[Superpowers](../superpowers/) · [Grill Me](../grill-me/)
