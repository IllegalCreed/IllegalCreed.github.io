---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 fockus/claude-skill-find-skill v1.0.1（提交 `74c2a4d`，2026-04-21）与 Agent Skills 生态工具编写。

## 速查

- **装 find-skill**：`brew tap fockus/tap && brew install find-skill && find-skill`，或 `pipx install find-skill && find-skill`
- **两条命令**：`/find-skill <query>`（搜）、`/install-skill <owner/repo>`（装）——装完在每个 agent 里都可用
- **搜**：`/find-skill docker`（默认限当前 agent、Top 5）；`--agent any` 搜全部、`--all` 展开、`--limit N --page N` 分页
- **装**：`/install-skill owner/repo`（当前 agent）；`--target all`（4 个 agent）、`--name sub`（mono-repo 选子技能）、`--dry-run`
- **铁律**：未确认不安装；本地目录优先，<2 结果才回落 SkillsMP（需 key）
- **更目录**：`~/.claude/skills/find-skill/update-skills-catalogue.sh`（不自动更新）
- **广义技能 CLI**：校验 `skills-ref validate ./skill`；分发 `npx skills add owner/repo`；插件 `claude plugin marketplace add owner/repo`

## 安装 find-skill

三种方式任选，都以「`/find-skill` + `/install-skill` 在你的 agent 里可用」收尾：

```bash
# Homebrew（macOS / Linux）
brew tap fockus/tap
brew install find-skill
find-skill                 # 跑安装器，自动探测 Claude Code / Codex / OpenCode / Cursor

# 或 pipx
pipx install find-skill
find-skill

# 或 curl 一行
curl -sSL https://raw.githubusercontent.com/fockus/claude-skill-find-skill/main/quick-install.sh | bash
```

安装器会把技能装进各 agent 的原生位置，并共享同一份目录缓存：

| Agent | 安装路径 | 格式 |
| --- | --- | --- |
| Claude Code | `~/.claude/skills/find-skill/SKILL.md` | 原生技能文件夹 |
| Codex | `~/.codex/skills/find-skill/SKILL.md` | 与 Claude Code 同格式 |
| OpenCode | `~/.config/opencode/command/find-skill.md` | 斜杠命令（转换后） |
| Cursor | `~/.cursor/commands/find-skill.md` | 用户级命令（转换后） |

四个版本读**同一份** `~/.claude/skills/find-skill/cache/catalogue.json`——更新一次，全部受益。

## 搜第一个技能

```bash
/find-skill docker                     # 搜 docker（默认只显当前 agent 兼容、Top 5）
/find-skill docker --agent any         # 搜整个目录（全部 4835 个）
/find-skill react --agent cursor       # 只显 Cursor 兼容的
/find-skill deploy --all               # 显示所有匹配，不止 Top 5
/find-skill python --limit 10 --page 2 # 分页
```

结果按信任度排序，官方/精选在前，并标注来源与信任级：

```
Found N skills for "docker":
1. [name] (RECOMMENDED)
   Source: Anthropic  | Trust: Official
   Description: ...
   Stars: N  | Repo: URL

Install? (1, 2, all, or no)
```

::: warning 未确认不安装
find-skill 的铁律之一：搜到结果后**必须**等你确认（回复序号 / all / no）才会真正 clone。它不会背着你装东西。
:::

## 装一个技能

```bash
/install-skill fockus/skill-name              # 装进当前 agent
/install-skill owner/repo --target all        # 装进全部 4 个 agent
/install-skill mono-repo --name sub-skill     # 从 mono-repo 里挑子技能
/install-skill https://github.com/user/repo   # 用完整 URL
/install-skill memory-bank                     # 按名字（在目录里查）
```

安装 = clone 仓库 → 探测 `SKILL.md`（mono-repo 最深查 4 层）→ 按目标 agent 转换 frontmatter → 落到原生位置。转换只改 frontmatter 头，**正文逐字保留**。

## 更新技能目录

目录**不自动更新**，需手动或挂 cron：

```bash
# 手动更新
~/.claude/skills/find-skill/update-skills-catalogue.sh

# 每月自动（cron）
(crontab -l 2>/dev/null; echo "0 0 1 * * $HOME/.claude/skills/find-skill/update-skills-catalogue.sh") | crontab -

# 看上次更新时间
date -r "$(cat ~/.claude/skills/find-skill/cache/last_update.txt)"
```

## 更广的技能 CLI：不止发现

find-skill 管「发现/安装」，技能全生命周期还有另外两类 CLI：

```bash
# 校验：查 frontmatter 合法 + 命名规范（离线）
skills-ref validate ./my-skill

# 分发：把技能拷进你的项目（可编辑），来自 skills.sh
npx skills@latest add mattpocock/skills

# 插件：装托管插件包（自更新、只读）
claude plugin marketplace add owner/repo
claude plugin install pack-name@marketplace
```

> `npx skills`（拷贝、可改）与 `claude plugin`（托管、只读、自更新）是两种分发哲学；find-skill 偏向前者（clone 到本地）。

## 下一步

- [指南](./guide-line) —— 6 阶段工作流内幕、信任排序算法、格式转换、与 `claude plugin` 的边界
- [参考](./reference) —— 命令/flag 全表、14 个源清单、安装路径、API key 管理
