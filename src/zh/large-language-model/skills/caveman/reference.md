---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 JuliusBrussee/caveman 的 README、`skills/` 与 `benchmarks/` 编写。

## 速查

- **装**：`curl -fsSL .../install.sh | bash`（30+ agent，Node ≥18）或 `claude plugin install caveman@caveman`
- **6 档**：lite / full(默认) / ultra / wenyan-lite / wenyan-full / wenyan-ultra
- **7 技能**：`/caveman` `/caveman-commit` `/caveman-review` `/caveman-stats` `/caveman-compress` `caveman-shrink` `cavecrew-*`
- **省**：输出均值 65%（22–87%）；`/caveman-compress` 输入 ~46%（永久）
- **零遥测零 network**（装后）；Julius Brussee，MIT

## 7 个技能/命令

| 命令 | 作用 |
| --- | --- |
| `/caveman [lite\|full\|ultra\|wenyan]` | 压缩每条回复，档位保持整会话 |
| `/caveman-commit` | Conventional Commit 信息，≤50 字符标题，why over what |
| `/caveman-review` | 一行 PR 评论：`L42: 🔴 bug: user null. Add guard.` |
| `/caveman-stats` | 真实 session token 用量、终身节省、USD；`--share` 生成可发推的一行 |
| `/caveman-compress <file>` | 改写记忆文件（如 CLAUDE.md）成 caveman-speak，减 ~46% 输入 token（每 session 后永久生效），代码/URL/路径逐字节保留 |
| `caveman-shrink` | MCP 中间件，包裹任意 MCP server、压缩其工具描述（npm 包） |
| `cavecrew-*` | Caveman 子代理（investigator/builder/reviewer），比原版少 ~60% token，主上下文更耐用 |

> Claude Code 状态栏显示 `[CAVEMAN] ⛏ 12.4k`（终身省的 token），`/caveman-stats` 时更新；`CAVEMAN_STATUSLINE_SAVINGS=0` 可关。

## 6 档对照

| 档 | 变化 |
| --- | --- |
| `lite` | 去 filler/hedging，保留冠词 + 完整句 |
| `full`（默认） | 删冠词、片段 OK、短同义词；无工具旁白/装饰表格/emoji；标准缩写 OK、无自造缩写 |
| `ultra` | 有把握时省连词、一词够就一词、每事实只说一次；无散文缩写、无箭头 |
| `wenyan-lite` | 半文言，删 filler 保语法结构 |
| `wenyan-full` | 完全文言文，80–90% 字符缩减，古典句式 |
| `wenyan-ultra` | 极限缩写 + 古典韵味 |

## 基准数据（真实 Claude API）

均值 **65%** 输出减少（范围 22–87%），可复现于 `benchmarks/` / `evals/`：

| 任务 | 正常 | Caveman | 省 |
| --- | ---: | ---: | ---: |
| Explain React re-render | 1180 | 159 | 87% |
| Fix auth middleware | 704 | 121 | 83% |
| PostgreSQL connection pool | 2347 | 380 | 84% |
| git rebase vs merge | 702 | 292 | 58% |
| Refactor callback→async | 387 | 301 | 22% |
| **均值** | **1214** | **294** | **65%** |

`/caveman-compress` 改写记忆文件：均减 **46%** 输入 token（永久）。

> ⚠️ 诚实数字：只省输出；输入/推理不动 + skill 自身加 ~1–1.5k 输入/轮，整会话省得少甚至净负。价值在可读性/速度。

## 跨 agent 安装

| Agent | 方式 |
| --- | --- |
| 全部（30+，自动探测） | `curl -fsSL .../install.sh \| bash` |
| Claude Code | `claude plugin marketplace add JuliusBrussee/caveman && claude plugin install caveman@caveman` |
| Gemini CLI | `gemini extensions install https://github.com/JuliusBrussee/caveman` |
| Cursor/Windsurf/Cline/Codex/30+ | `npx skills add JuliusBrussee/caveman -a <agent>` |
| OpenClaw | `curl .../install.sh \| bash -s -- --only openclaw` |

## 隐私

Caveman **不 phone home**：无 telemetry、无 analytics、无账号、无 backend。装后**零网络调用**——skill 是 prompt、hook 是本地脚本、`/caveman-stats` 读本地磁盘上的 log。装时的 fetch（GitHub + 各 agent registry）在 SECURITY.md 列明。

## 生态（选读）

同一理念的一组仓库（agent do more with less）：

| 仓库 | 压缩什么 |
| --- | --- |
| **caveman**（本叶） | agent **说**什么 |
| caveman-code | **整个 agent**，端到端 |
| cavemem | agent **记住**什么（跨会话） |
| cavekit | **build loop**，spec 驱动 |
| cavegemma | 压缩**烘进权重**（Gemma 微调） |

## 资源链接

- 仓库：[JuliusBrussee/caveman](https://github.com/JuliusBrussee/caveman)
- 诚实数字：[docs/HONEST-NUMBERS.md](https://github.com/JuliusBrussee/caveman/blob/main/docs/HONEST-NUMBERS.md)
- 安装矩阵：[INSTALL.md](https://github.com/JuliusBrussee/caveman/blob/main/INSTALL.md)
- 相关叶：[Agent Skills 规范与生态](../agent-skills-spec/)
