---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 garrytan/gstack v1.60.1.0 的 README、`ETHOS.md`、`docs/skills.md` 编写。

## 速查

- **冲刺七阶段**：Think（office-hours）→ Plan（ceo/eng/design/devex-review、autoplan）→ Build → Review（review/investigate/codex）→ Test（qa/browse/benchmark）→ Ship（ship/land-and-deploy/canary）→ Reflect（retro/document-release/learn）
- **审查选型**：终端用户 UI 用 design-review；开发者 API 用 devex-review；架构用 eng-review；全都要用 `/autoplan` 自动跑
- **安全护栏**：`/careful`（危险命令预警）`/freeze`（锁编辑目录）`/guard`（两者）`/unfreeze`
- **跨模型**：`/review`（Claude）+ `/codex`（OpenAI Codex CLI）交叉审同一 diff
- **ETHOS 核心**：Boil the Ocean——AI 让完整性成本趋零，能完整就别走捷径
- **并行**：Conductor 跑 10-15 个隔离冲刺
- **LOC 争议**：作者用「逻辑行」而非原始 LOC 度量并附方法论；**工程价值在角色化流程本身，非生产力数字**

## 核心心智：把 Claude Code 变成一支团队

gstack 的立意是——一次软件冲刺本该有很多角色：重新思考产品的 CEO、锁架构的工程经理、抓 AI slop 的设计师、找生产 bug 的审查员、开真浏览器的 QA、跑 OWASP+STRIDE 的安全官、发 PR 的发布工程师。gstack 把这些角色**各做成一条 slash 命令**，让你像 CEO 管团队那样管这些 AI 专家：只盯要紧的决策，其余放手让它跑。

> 关键不是「AI 写了多少」，而是「什么被 ship 了」。角色化流程的价值在于：每个阶段有明确职责、有交接、不掉链子。

## 七阶段冲刺：技能按阶段拆解

### Think — 想清楚要做什么

| 技能 | 角色 | 做什么 |
| --- | --- | --- |
| `/office-hours` | YC Office Hours | 六个「逼问」问题，动手前重构你的产品；推翻你的框架、挑战前提、生成实现备选；设计文档喂给下游 |

### Plan — 把方案锁死

| 技能 | 角色 | 做什么 |
| --- | --- | --- |
| `/plan-ceo-review` | CEO/创始人 | 重构问题，找藏在需求里的「10 星产品」；4 模式：扩张/选择性扩张/守范围/缩减 |
| `/plan-eng-review` | 工程经理 | 锁架构、数据流、图示、边界、测试；把隐藏假设逼到明面 |
| `/plan-design-review` | 高级设计师 | 每个设计维度打 0-10 分、说明 10 分长什么样、再改计划达到；AI Slop 检测 |
| `/plan-devex-review` | 开发者体验负责人 | 交互式 DX 评审：开发者画像、对标竞品 TTHW、设计「魔法时刻」、逐步追踪摩擦点 |
| `/autoplan` | 评审流水线 | 一条命令自动跑 CEO → design → eng → DX 评审，只把「品味决策」抛给你确认 |

### Build — 写代码

批准计划后 agent 实现（可配合 `/design-shotgun` 探索 UI 变体、`/design-html` 把 mockup 变生产级 HTML）。

### Review — 审查

| 技能 | 角色 | 做什么 |
| --- | --- | --- |
| `/review` | 资深工程师 | 找「过了 CI 却会炸生产」的 bug，自动修明显的，标完整性缺口 |
| `/investigate` | 调试者 | 系统性根因调试；铁律「无调查不修复」；3 次失败即停 |
| `/codex` | 第二意见 | OpenAI Codex CLI 独立审查（review 门禁 / 对抗挑战 / 开放咨询三模式）；跨模型交叉分析 |
| `/design-review`·`/devex-review` | 设计师/DX 测试员 | 上线后的实时审计，边审边修 |

### Test — 测试

| 技能 | 角色 | 做什么 |
| --- | --- | --- |
| `/qa` | QA 负责人 | 真浏览器测应用、找 bug、原子提交修复、再核实；每个修复自动生成回归测试 |
| `/qa-only` | QA 报告员 | 同方法但只报告不改代码 |
| `/browse` | QA 工程师 | 给 agent 一双眼睛——真 Chromium、真点击、真截图，~100ms/命令 |
| `/benchmark` | 性能工程师 | 基线页面加载、Core Web Vitals、资源大小；每个 PR 前后对比 |

### Ship — 发布

| 技能 | 角色 | 做什么 |
| --- | --- | --- |
| `/ship` | 发布工程师 | 同步 main、跑测试、审覆盖率、push、开 PR；没测试框架就 bootstrap 一个 |
| `/land-and-deploy` | 发布工程师 | 合 PR、等 CI 与部署、核实生产健康；一条命令从「批准」到「生产已验证」 |
| `/canary` | SRE | 部署后监控循环，盯 console 错误、性能回归、页面失败 |

### Reflect — 复盘

| 技能 | 角色 | 做什么 |
| --- | --- | --- |
| `/retro` | 工程经理 | 团队感知的周复盘；`/retro global` 跨所有项目与 AI 工具 |
| `/document-release` | 技术写手 | 更新所有项目文档对齐刚 ship 的东西；建 Diataxis 覆盖图 |
| `/learn` | 记忆 | 管理 gstack 跨 session 学到的模式/坑/偏好；越用越懂你的代码库 |

## 该用哪个 review？

| 你在给谁建 | 计划阶段（写码前） | 实时审计（上线后） |
| --- | --- | --- |
| **终端用户**（UI/web/移动） | `/plan-design-review` | `/design-review` |
| **开发者**（API/CLI/SDK/文档） | `/plan-devex-review` | `/devex-review` |
| **架构**（数据流/性能/测试） | `/plan-eng-review` | `/review` |
| **以上全部** | `/autoplan`（自动判定哪些适用） | — |

## 安全护栏：按需开启

| 技能 | 作用 |
| --- | --- |
| `/careful` | 危险命令（`rm -rf`、`DROP TABLE`、force-push）执行前预警；说「be careful」激活 |
| `/freeze` | 把编辑锁在一个目录，防调试时误改无关代码 |
| `/guard` | `/careful` + `/freeze` 合一，prod 工作最大安全 |
| `/unfreeze` | 解除 freeze 边界 |

此外浏览器侧有**提示注入防御**：本地 ML 分类器扫每个页面、canary token 抓会话外泄、双分类器一致才拦截（防单模型误报）。

## 跨模型审查：`/review` + `/codex`

`/review`（Claude）和 `/codex`（OpenAI Codex CLI）审同一 diff——两个不同模型看同一份代码。当两者都跑过，你得到跨模型分析：哪些发现重叠、哪些各自独有。`/codex` 三模式：review（通过/失败门禁）、对抗挑战（主动试图破坏你的代码）、开放咨询。

## ETHOS：Boil the Ocean

gstack 的哲学写在 `ETHOS.md`，注入每个工作流技能的前言。核心是**「Boil the Ocean」**：

> 「别啃下整片海」曾是工程时间是瓶颈时的对的建议。那个时代结束了。AI 让完整性的边际成本趋近于零，旧的谨慎悄悄变成了借口。当完整实现只比捷径多花几分钟——就做完整的那个。每次都是。

配套的「压缩比」直觉（人类团队 vs AI 辅助）：样板 ~100×、测试 ~50×、功能实现 ~30×、bug 修复 ~20×、架构 ~5×、研究 ~3×。含义：过去团队会跳过的「最后 10% 完整性」，现在只花几秒——所以别跳。

> 但这不是「无限扩张范围」：真正无关的工作（如与当前任务无关的跨季度平台迁移）仍要标为独立范围。Boil the ocean 指的是**把该做的做完整**，不是揽下一切。

## LOC 争议辨析（中立看待）

gstack README 大量援引作者的个人产出数据（如「逻辑行 810× 于 2013 年」）。需要理性看待：

- 作者**承认原始 LOC 会被 AI 膨胀**，因此改用「逻辑代码变更」度量、并附完整方法论与复现脚本（`docs/ON_THE_LOC_CONTROVERSY.md`）
- 但这仍是**单个高强度用户的极端个案**，不代表普适生产力
- **本笔记的立场**：gstack 的工程价值在于**角色化冲刺方法论**（明确职责、链式交接、多重审查、真浏览器 QA、安全护栏），而非那些生产力数字。学它的流程，别把数字当承诺。

## 与 Karpathy 四失败模式的关系

README 指出 Karpathy 的 AI 编码规则点出四个失败模式（错误假设、过度复杂、正交编辑、命令式压过声明式），gstack 的工作流技能都覆盖：`/office-hours` 逼假设到明面、Confusion Protocol 阻止 Claude 在架构决策上瞎猜、`/review` 抓不必要复杂与顺手改、`/ship` 把任务变成可验证目标。

## 并行冲刺：一条很好，十条才有意思

配合 [Conductor](https://conductor.build) 可同时跑多个 Claude Code 会话，各在隔离工作区：一个 `/office-hours` 想新点子、一个 `/review` 审 PR、一个实现功能、一个 `/qa` 测 staging……作者常跑 10-15 个并行冲刺。冲刺结构（think→…→reflect）正是让并行可控的关键——没有流程，十个 agent 是十个混乱源。

## 下一步

- [参考](./reference) —— 全命令表、power tools、新 binary、团队模式、GBrain、卸载、故障排查
- 上游：[gstack README](https://github.com/garrytan/gstack) · [ETHOS](https://github.com/garrytan/gstack/blob/main/ETHOS.md)
