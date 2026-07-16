---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 garrytan/gstack v1.60.1.0 的 README、`docs/skills.md`、`CHANGELOG.md` 编写。

## 速查

- **装**：`git clone --single-branch --depth 1 https://github.com/garrytan/gstack.git ~/.claude/skills/gstack && cd ~/.claude/skills/gstack && ./setup`
- **团队**：`./setup --team` + `bin/gstack-team-init required|optional`
- **多 agent**：`./setup --host codex|opencode|cursor|factory|slate|kiro|hermes|gbrain`
- **前缀**：`--no-prefix`（`/qa`）/ `--prefix`（`/gstack-qa`）
- **升级/卸载**：`/gstack-upgrade` / `bin/gstack-uninstall`
- **依赖**：Claude Code、Git、Bun v1.0+、（Windows）Node.js

## 工作流技能全表（按冲刺阶段）

| 阶段 | 技能 | 角色 |
| --- | --- | --- |
| Think | `/office-hours` | YC Office Hours（6 逼问） |
| Plan | `/plan-ceo-review` | CEO（4 模式：扩张/选择性扩张/守范围/缩减） |
| Plan | `/plan-eng-review` | 工程经理（架构/数据流/测试矩阵） |
| Plan | `/plan-design-review` | 高级设计师（0-10 打分 + AI Slop 检测） |
| Plan | `/plan-devex-review` | DX 负责人（3 模式，20-45 逼问） |
| Plan | `/design-consultation` | 设计伙伴（从零建设计系统，写 DESIGN.md） |
| Plan | `/autoplan` | 评审流水线（自动跑 CEO→design→eng→DX） |
| Plan | `/spec` | Spec 作者（五阶段成 spec，Codex 质量门禁 7/10） |
| Build | `/design-shotgun` | 设计探索（4-6 AI mockup 变体 + 品味记忆） |
| Build | `/design-html` | 设计工程师（mockup → 生产级 HTML，Pretext 布局） |
| Review | `/review` | 资深工程师（抓生产 bug，自动修） |
| Review | `/investigate` | 调试者（无调查不修复，3 次失败即停） |
| Review | `/codex` | 第二意见（OpenAI Codex 跨模型审查） |
| Review | `/design-review` | 会写码的设计师（审 + 修 + 前后截图） |
| Review | `/devex-review` | DX 测试员（实测 onboarding、计时 TTHW） |
| Test | `/qa` | QA 负责人（真浏览器测 + 修 + 回归测试） |
| Test | `/qa-only` | QA 报告员（只报告不改） |
| Test | `/benchmark` | 性能工程师（Core Web Vitals 前后对比） |
| Ship | `/ship` | 发布工程师（同步/测试/覆盖率/PR） |
| Ship | `/land-and-deploy` | 发布工程师（合 PR→CI→部署→核实） |
| Ship | `/canary` | SRE（部署后监控循环） |
| Reflect | `/retro` | 工程经理（周复盘，`/retro global` 跨项目） |
| Reflect | `/document-release` | 技术写手（更文档 + Diataxis 覆盖图） |
| Reflect | `/document-generate` | 文档作者（Diataxis 从零生成缺失文档） |
| Reflect | `/learn` | 记忆（跨 session 学模式/坑/偏好） |

## Power tools

| 技能 | 作用 |
| --- | --- |
| `/codex` | 第二意见——OpenAI Codex 独立审查（三模式） |
| `/careful` | 危险命令预警（`rm -rf`/`DROP TABLE`/force-push） |
| `/freeze` | 锁编辑到一个目录 |
| `/guard` | `/careful` + `/freeze` |
| `/unfreeze` | 解除 freeze |
| `/open-gstack-browser` | 启动 GStack Browser（反爬 stealth、侧栏、自动模型路由） |
| `/setup-deploy` | 为 `/land-and-deploy` 一次性配置 |
| `/setup-gbrain` | GBrain 上手（PGLite/Supabase/远程 MCP） |
| `/sync-gbrain` | 把本仓库代码索引进 GBrain |
| `/gstack-upgrade` | 自更新（探测全局 vs vendored） |

## 独立 binary（v0.19+）

| 命令 | 作用 |
| --- | --- |
| `gstack-model-benchmark` | 跨模型基准——同 prompt 过 Claude/GPT/Gemini，比延迟/token/成本/质量 |
| `gstack-taste-update` | 设计品味学习——把 design-shotgun 的取舍写进 per-project 品味档，每周衰减 5% |
| `gstack-analytics` | 本地个人使用看板（从本地 JSONL，无需远程） |
| `gstack-config` | 配置（`set telemetry off`、`set checkpoint_mode continuous`） |

## 命令名前缀

| Flag | 效果 |
| --- | --- |
| `./setup --no-prefix` | `/qa`、`/review`（默认，短命令） |
| `./setup --prefix` | `/gstack-qa`、`/gstack-review`（命名空间，与其它技能包共存时用） |

选择被记住，供后续升级沿用。

## 团队模式

```bash
(cd ~/.claude/skills/gstack && ./setup --team) && \
  ~/.claude/skills/gstack/bin/gstack-team-init required && \
  git add .claude/ CLAUDE.md && git commit -m "require gstack for AI-assisted work"
```

- 不 vendored 文件进仓库、不版本漂移、不手动升级
- 每会话启动限流自更新检查（每小时一次、断网安全、静默）
- `required` 强制 / `optional` 提醒

## 多 agent 支持（10 家）

| Agent | Flag | 装到 |
| --- | --- | --- |
| Claude Code | 默认 | `~/.claude/skills/gstack/` |
| OpenAI Codex CLI | `--host codex` | `~/.codex/skills/gstack-*/` |
| OpenCode | `--host opencode` | `~/.config/opencode/skills/gstack-*/` |
| Cursor | `--host cursor` | `~/.cursor/skills/gstack-*/` |
| Factory Droid | `--host factory` | `~/.factory/skills/gstack-*/` |
| Slate / Kiro / Hermes / GBrain | `--host slate\|kiro\|hermes\|gbrain` | 各自 `~/.<agent>/skills/` |

加新 agent 只需一个 TypeScript 配置文件，零代码改动（见 `docs/ADDING_A_HOST.md`）。

## 持续检查点模式（opt-in）

`gstack-config set checkpoint_mode continuous`——技能自动以 `WIP:` 前缀 + 结构化 `[gstack-context]` 正文提交进展（决策、剩余工作、失败尝试）。抗崩溃与上下文切换；`/ship` 前 filter-squash 掉 WIP 提交保持 bisect 干净。默认本地，`checkpoint_push=true` 才 push。

## GBrain：持久知识库

[GBrain](https://github.com/garrytan/gbrain) 是 agent 的持久记忆。`/setup-gbrain` 四条路：Supabase 现有 URL / Supabase 自动开通 / PGLite 本地（~30s 零账号）/ 远程 gbrain MCP。`/sync-gbrain` 把代码索引进去，写 `## GBrain Search Guidance` 到 CLAUDE.md 让 agent 优先用 `gbrain search`。每仓库三级信任：read-write / read-only / deny。

## 遥测（默认关）

opt-in，默认关；开了只发技能名/时长/成功失败/版本/OS，**绝不发代码/路径/仓库名/prompt**。`gstack-config set telemetry off` 随时关。本地 `gstack-analytics` 看板始终可用。

## 卸载

```bash
# 有本地 repo
~/.claude/skills/gstack/bin/gstack-uninstall            # 处理技能/符号链接/全局状态/browse daemon/临时文件
~/.claude/skills/gstack/bin/gstack-uninstall --keep-state  # 保留配置与分析
```

无本地 repo 时按 README「Manual removal」逐步清 `~/.claude/skills/gstack`、`~/.gstack`、各 agent 集成目录。卸载脚本**不改 CLAUDE.md**——需手动删项目里的 `## gstack` 段。

## 故障排查

| 现象 | 处理 |
| --- | --- |
| 技能不显示 | `cd ~/.claude/skills/gstack && ./setup` |
| `/browse` 失败 | `cd ~/.claude/skills/gstack && bun install && bun run build` |
| 安装陈旧 | `/gstack-upgrade` 或 `~/.gstack/config.yaml` 设 `auto_upgrade: true` |
| Codex 报「invalid SKILL.md」 | `cd ~/.codex/skills/gstack && git pull && ./setup --host codex` |
| Windows | 需 Bun + Node（Bun 在 Windows 有 Playwright pipe 已知 bug，自动回落 Node）；无 Developer Mode 时每次 `git pull` 后重跑 `./setup` |

## 资源链接

- 仓库：[garrytan/gstack](https://github.com/garrytan/gstack)
- 技能深潜：[docs/skills.md](https://github.com/garrytan/gstack/blob/main/docs/skills.md)
- 哲学：[ETHOS.md](https://github.com/garrytan/gstack/blob/main/ETHOS.md)
- 官网：[gstacks.org](https://gstacks.org/)
- GBrain：[garrytan/gbrain](https://github.com/garrytan/gbrain)
