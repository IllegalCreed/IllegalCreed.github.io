---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 fockus/claude-skill-find-skill v1.0.1 README 与 `SKILL.md` 编写。

## 速查

- **`/find-skill <query>`** flag：`--agent` `--limit` `--page` `--all` `--top N` `--stats` `--category`
- **`/install-skill <source>`** flag：`--target` `--name` `--force` `--dry-run`
- **默认**：limit=5、page=1、agent=当前（Claude Code）
- **安装路径**：Claude `~/.claude/skills/`、Codex `~/.codex/skills/`、OpenCode `~/.config/opencode/command/`、Cursor `~/.cursor/commands/`
- **目录**：`~/.claude/skills/find-skill/cache/catalogue.json`（4835 条），`update-skills-catalogue.sh` 手动更新
- **key**：`SKILLSMP_API_KEY` 存 `~/.claude/skills/find-skill/.env`（`chmod 600`）

## `/find-skill` 命令

| Flag | 用途 | 默认 |
| --- | --- | --- |
| `<query>` | 搜索词 | — |
| `--agent <name>` | `claude`/`codex`/`opencode`/`cursor`/`any` | 当前 agent |
| `--limit N` | 每页最多结果数 | 5 |
| `--page N` | 分页 | 1 |
| `--all` | 显示全部匹配 | false |
| `--top N` | 全目录按星数取 Top-N | — |
| `--stats` | 按源与 agent 的目录统计 | — |
| `--category <cat>` | 某分类下全部技能 | — |

```bash
/find-skill docker                     # 当前 agent、Top 5
/find-skill docker --agent any         # 全目录 4835 个
/find-skill react --agent cursor       # 仅 Cursor 兼容
/find-skill deploy --all               # 全部匹配
/find-skill python --limit 10 --page 2 # 分页
/find-skill --top 20                   # 全目录 Top-20 by stars
/find-skill --stats                    # 目录统计
```

## `/install-skill` 命令

| Flag | 用途 | 默认 |
| --- | --- | --- |
| `<source>` | `owner/repo`、完整 URL、或目录里的名字 | — |
| `--target <list>` | 逗号分隔目标，或 `all` | 当前 agent |
| `--name NAME` | 覆盖技能名（mono-repo 选子技能） | 从 frontmatter 推导 |
| `--force` | 覆盖已存在的安装 | false |
| `--dry-run` | 只打印动作不写文件 | false |

```bash
/install-skill fockus/skill-name              # 当前 agent
/install-skill owner/repo --target all        # 全部 4 个 agent
/install-skill mono-repo --name sub-skill     # mono-repo 子技能
/install-skill https://github.com/user/repo   # 完整 URL
```

## 14 个源（共 4835 技能）

| 源 | 星数 | 技能数 | 类型 |
| --- | ---: | ---: | --- |
| Anthropic | 105K | 17 | 官方 |
| ComposioHQ | 49K | 31 | 头部精选清单 |
| hesreallyhim | 39.9K | 16 | 头部精选清单 |
| skills.sh | — | 3999 | 官方目录（Vercel，多 agent） |
| vercel-labs | 24K | 6 | 社区 |
| VoltAgent-subagents | 15.5K | 100 | 社区 |
| VoltAgent | 13K | 100 | 社区 |
| travisvn | 10K | 56 | 社区 |
| BehiSecc | 8K | 100 | 社区 |
| alirezarezvani | 8K | 3 | 社区 |
| heilcheng | 3.5K | 100 | 社区 |
| daymade | — | 100 | 社区 |
| mxyhi | — | 38 | 社区 |
| SkillsMP API | — | 352 | 市场 |

## Agent 兼容分布

| Agent | 兼容技能数 | 原因 |
| --- | ---: | --- |
| `claude` | 4835（100%） | SKILL.md 是原生格式 |
| `codex` | 4835（100%） | 与 Claude 同 SKILL.md 格式 |
| `opencode` | 3913（81%） | skills.sh 目录（多 agent） |
| `cursor` | 3913（81%） | skills.sh 目录（多 agent） |

## 安装路径与共享文件

**共享**（4 个 agent 单一真相源）：

| 文件 | 用途 |
| --- | --- |
| `~/.claude/skills/find-skill/cache/catalogue.json` | 4835 技能目录 |
| `~/.claude/skills/find-skill/update-skills-catalogue.sh` | 刷新脚本 |
| `~/.claude/skills/find-skill/scripts/install-skill.sh` | 通用安装器（带格式转换） |
| `~/.claude/skills/find-skill/.env` | API key |

**各 agent 原生命令**：Claude Code `~/.claude/skills/find-skill/` + `~/.claude/commands/`；Codex `~/.codex/skills/`；OpenCode `~/.config/opencode/command/`；Cursor `~/.cursor/commands/`。

## 目录维护

```bash
# 手动更新（不自动）
~/.claude/skills/find-skill/update-skills-catalogue.sh

# 挂 cron 每月更新
(crontab -l 2>/dev/null; echo "0 0 1 * * $HOME/.claude/skills/find-skill/update-skills-catalogue.sh") | crontab -

# 看上次更新
date -r "$(cat ~/.claude/skills/find-skill/cache/last_update.txt)"
```

## SkillsMP API key（可选）

离线核心功能不需要 key；key 只影响「实时兜底」与「多 352 条市场技能」：

```bash
# 装后随时添加
echo 'export SKILLSMP_API_KEY="smp_YOUR_KEY_HERE"' >> ~/.claude/skills/find-skill/.env
chmod 600 ~/.claude/skills/find-skill/.env
```

获取：[skillsmp.com](https://skillsmp.com) → GitHub 登录 → Settings → API keys → Create。key 只存本机、`chmod 600`、不进 git、4 个 agent 共享一份。

## 卸载

```bash
~/.claude/skills/claude-skill-find-skill/uninstall.sh              # 全部 4 agent + 共享缓存
~/.claude/skills/claude-skill-find-skill/uninstall.sh --target opencode  # 仅 OpenCode
~/.claude/skills/claude-skill-find-skill/uninstall.sh --keep-cache       # 保留目录 + key
```

## 相邻的技能 CLI

| 工具 | 职责 | 命令 |
| --- | --- | --- |
| find-skill | 发现 + 安装（多 agent、clone 到本地） | `/find-skill` `/install-skill` |
| skills.sh | 分发（拷进项目、可编辑） | `npx skills@latest add owner/repo` |
| claude plugin | 托管插件包（只读、自更新） | `claude plugin marketplace add owner/repo` |
| skills-ref | 校验（frontmatter + 命名，离线） | `skills-ref validate ./my-skill` |

## 资源链接

- 仓库：[fockus/claude-skill-find-skill](https://github.com/fockus/claude-skill-find-skill)
- 市场：[skillsmp.com](https://skillsmp.com)
- 分发：[skills.sh](https://skills.sh)
- 校验：[agentskills/agentskills · skills-ref](https://github.com/agentskills/agentskills/tree/main/skills-ref)
- 相关叶：[Agent Skills 规范与生态](../agent-skills-spec/)
