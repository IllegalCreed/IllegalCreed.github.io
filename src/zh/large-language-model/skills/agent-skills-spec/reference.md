---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 agentskills/agentskills 规范（`docs/specification.mdx`）与 Claude Code 官方 Skills 文档 frontmatter reference 编写。区分**可移植规范字段**与**Claude Code 扩展字段**。

## 速查

- **可移植 frontmatter**（跨 agent）：`name`(必) `description`(必) `license` `compatibility` `metadata` `allowed-tools`(实验)
- **Claude Code 扩展**：`when_to_use` `argument-hint` `arguments` `disable-model-invocation` `user-invocable` `disallowed-tools` `model` `effort` `context: fork` `agent` `hooks` `paths` `shell`（**不跨平台**）
- **目录**：`SKILL.md`(必) + `scripts/` + `references/` + `assets/`；正文 < 500 行、< 5000 token；引用保持一层深
- **命名**：`name` 1–64、小写字母数字连字符、不首尾/不连续连字符、与父目录同名
- **命令名来源**：`~/.claude/skills/<dir>/` → `/<dir>`（目录名，非 frontmatter `name`）
- **字符串替换**：`$ARGUMENTS` `$0`/`$1` `$name` `${CLAUDE_SESSION_ID}` `${CLAUDE_SKILL_DIR}` `${CLAUDE_PROJECT_DIR}`
- **校验**：`skills-ref validate ./my-skill`

## 可移植规范字段（跨 agent 通用）

以下字段来自 Agent Skills 开放规范，各家 skills 兼容 agent 都应识别：

| 字段 | 必需 | 约束 |
| --- | --- | --- |
| `name` | 是 | ≤ 64 字符；小写字母、数字、连字符；不首尾连字符；不连续连字符；须与父目录同名 |
| `description` | 是 | ≤ 1024 字符、非空；说明「做什么 + 何时用」，含帮助触发的关键词 |
| `license` | 否 | 许可名，或指向随附许可文件（建议短） |
| `compatibility` | 否 | ≤ 500 字符；声明环境要求（目标产品、系统包、网络访问等）；多数技能不需要 |
| `metadata` | 否 | 任意字符串键值映射；客户端存规范未定义的额外属性；键名建议加前缀防冲突 |
| `allowed-tools` | 否 | 空格分隔的预批准工具串（**实验**，各实现支持度不一） |

**带可选字段的例子**：

```yaml
---
name: pdf-processing
description: 提取 PDF 文本、填表单、合并文件。处理 PDF 时使用。
license: Apache-2.0
metadata:
  author: example-org
  version: "1.0"
---
```

## Claude Code 扩展字段（仅 Claude Code）

Claude Code 在开放规范之上加了这些字段——**它们不跨平台**，写进 `SKILL.md` 后拿到别的 agent 可能被忽略：

| 字段 | 说明 |
| --- | --- |
| `name` | 在 Claude Code 里**可选**，默认取目录名（作显示名，不改 `/` 后要输入的命令名） |
| `when_to_use` | 追加触发上下文（触发短语、示例请求），并入 description，共计 1536 字符上限 |
| `argument-hint` | 自动补全时提示期望参数，如 `[issue-number]` |
| `arguments` | 命名位置参数，供正文 `$name` 替换 |
| `disable-model-invocation` | `true` = 禁止 Claude 自动加载，只能手动 `/<name>`；也阻止预载入子代理与计划任务 |
| `user-invocable` | `false` = 从 `/` 菜单隐藏（供用户不该直接调的背景知识） |
| `disallowed-tools` | 该技能激活时从可用工具池移除的工具 |
| `model` | 该技能激活时用的模型（`inherit` 保持当前） |
| `effort` | 该技能激活时的努力档 `low`/`medium`/`high`/`xhigh`/`max` |
| `context` | `fork` = 在 fork 出的子代理上下文里跑 |
| `agent` | 配合 `context: fork` 指定子代理类型 |
| `hooks` | 绑定到该技能生命周期的 hooks |
| `paths` | glob，限定仅处理匹配文件时才自动激活 |
| `shell` | 内联 `` !`command` `` 用的 shell：`bash`（默认）或 `powershell` |

::: warning 可移植性
写「一次编写处处运行」的技能，只用**可移植字段**。需要 Claude Code 专有的触发控制/子代理/模型切换时才加扩展字段，并接受它只在 Claude Code 生效。
:::

## 目录结构与渐进披露预算

```
skill-name/
├── SKILL.md          # 必填：frontmatter + 指令；< 500 行、< 5000 token
├── scripts/          # 可选：可执行代码（Python/Bash/JS，取决于实现）
├── references/       # 可选：按需加载的参考文档，每文件聚焦、越小越省上下文
└── assets/           # 可选：模板、图片、schema
```

| 层 | 体量 | 加载时机 |
| --- | --- | --- |
| 元数据（`name`+`description`） | ~100 token | 启动，全部技能 |
| 指令（`SKILL.md` 正文） | 建议 < 5000 token | 激活时 |
| 资源（`scripts/`·`references/`·`assets/`） | 按需 | 指令要读时 |

**文件引用**：用相对技能根的相对路径；保持一层深，避免深层引用链：

```markdown
详见 [参考指南](references/REFERENCE.md)。
运行提取脚本：scripts/extract.py
```

## 命令名从哪来（Claude Code）

`/` 后输入的命令名取自技能**文件位置**，frontmatter `name` 只是显示名（插件根 `SKILL.md` 例外）：

| 技能位置 | 命令名来源 | 例 |
| --- | --- | --- |
| `~/.claude/skills/` 或 `.claude/skills/` 下目录 | 目录名 | `.claude/skills/deploy-staging/` → `/deploy-staging` |
| 嵌套 `.claude/skills/`（重名时） | 相对工作目录的路径 + 目录名 | `apps/web/.claude/skills/deploy/` → `/apps/web:deploy` |
| `.claude/commands/` 下文件 | 去扩展名的文件名 | `.claude/commands/deploy.md` → `/deploy` |
| 插件 `skills/` 子目录 | 目录名 + 插件命名空间 | `my-plugin/skills/review/` → `/my-plugin:review` |

## 字符串替换（Claude Code）

正文可用这些动态替换：

| 变量 | 含义 |
| --- | --- |
| `$ARGUMENTS` | 调用时传入的全部参数 |
| `$ARGUMENTS[N]` / `$N` | 按 0 基下标取第 N 个参数（`$0` 为首个） |
| `$name` | frontmatter `arguments` 里声明的命名参数 |
| `${CLAUDE_SESSION_ID}` | 当前会话 ID |
| `${CLAUDE_SKILL_DIR}` | 技能 `SKILL.md` 所在目录（引用随技能打包的脚本用） |
| `${CLAUDE_PROJECT_DIR}` | 项目根目录（引用项目本地脚本用） |

**动态上下文注入**：`` !`command` `` 在 agent 读到技能前先跑命令、把输出替换进内容——技能因此扎根真实状态。

## 校验

```bash
# 校验 frontmatter 合法 + 命名规范
skills-ref validate ./my-skill
```

`skills-ref` 是规范仓库 `skills-ref/` 下的参考实现库，可离线检查。

## 生态：谁支持 Agent Skills

Agent Skills 由 Anthropic 发起、开源为开放标准，已被大量 agent 采纳。截至 2026 年常见支持方：

| 类别 | 代表 |
| --- | --- |
| 编码 agent | Claude Code、OpenAI Codex CLI、Gemini CLI、GitHub Copilot（VS Code）、Cursor |
| 多 agent 支持方 | OpenCode、Factory Droid、Slate、Kiro、Hermes 等（见各技能集的 `--host` 支持） |
| 技能集合（建立在规范之上） | [Superpowers](../superpowers/)、[Everything Claude Code](../everything-claude-code/)、[gstack](../gstack/)、[mattpocock/skills](../grill-me/) |
| 发现/安装/校验工具 | [find-skills](../skills-cli-find-skills/)、`npx skills`（skills.sh）、`skills-ref validate` |

> 完整客户端展示见 [agentskills.io/clients](https://agentskills.io/clients)。各家对扩展字段与目录约定的支持仍有差异，「一次编写处处运行」在可移植字段范围内成立。

## 资源链接

- 规范原文：[agentskills.io/specification](https://agentskills.io/specification)
- 规范仓库：[agentskills/agentskills](https://github.com/agentskills/agentskills)
- 官方示例技能：[anthropics/skills](https://github.com/anthropics/skills)
- Claude Code Skills 文档：[code.claude.com/docs/en/skills](https://code.claude.com/docs/en/skills)
- 创作最佳实践：[best practices](https://agentskills.io) · 描述优化 · 技能评测
- Anthropic 工程博客：[Equipping agents with Agent Skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills)
