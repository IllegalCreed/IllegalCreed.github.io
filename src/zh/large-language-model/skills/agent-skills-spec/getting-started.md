---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 agentskills/agentskills 规范（HEAD `38a2ff8`，2026-07-09）与 Claude Code 官方 Skills 文档编写。

## 速查

- **技能 = 一个目录 + 一个 `SKILL.md`**；最小合法体只需 `name` + `description` 两个 frontmatter 字段
- **可移植字段**（跨 agent 通用）：`name` `description` `license` `compatibility` `metadata` `allowed-tools`
- **渐进披露三阶段**：Discovery（~100 token 元数据）→ Activation（<5000 token 正文）→ Execution（按需读 `scripts/`·`references/`·`assets/`）
- **`SKILL.md` 保持 < 500 行、< 5000 token**；更多内容下沉到 `references/`，用「何时读」的指针引用
- **技能存放位置（Claude Code）**：个人 `~/.claude/skills/<name>/`、项目 `.claude/skills/<name>/`、插件 `<plugin>/skills/<name>/`
- **触发方式**：`description` 匹配任务时自动加载，或用户手动 `/<skill-name>`
- **命名规则**：`name` 1–64 字符、仅小写字母数字连字符、不首尾连字符、不连续连字符、须与父目录同名
- **校验**：`skills-ref validate ./my-skill`

## 一个技能长什么样

规范只要求一件事——目录里有个 `SKILL.md`：

```
pdf-processing/
├── SKILL.md          # 必填：元数据 + 指令
├── scripts/          # 可选：可执行代码
├── references/       # 可选：按需加载的参考文档
└── assets/           # 可选：模板、图片、数据文件
```

`SKILL.md` = YAML frontmatter + Markdown 正文。**最小合法体**（正文里可以带代码）：

````markdown
---
name: pdf-processing
description: 从 PDF 提取文本与表格、填表单、合并文件。处理 PDF 文档时使用。
---

用 pdfplumber 提取文本；扫描件退回 pdf2image + pytesseract。

```python
import pdfplumber
with pdfplumber.open("file.pdf") as pdf:
    text = pdf.pages[0].extract_text()
```
````

没有 SDK、没有注册步骤、没有构建——把这个文件夹放进技能目录，agent 就能用。

## 渐进披露：技能为什么不撑爆上下文

这是整套标准的**核心设计**。Agent 不会一次读进所有技能，而是分三步「按需取用」：

| 阶段 | 加载什么 | 体量 | 触发时机 |
| --- | --- | --- | --- |
| **Discovery** | 每个技能的 `name` + `description` | ~100 token/个 | 启动时，全部技能 |
| **Activation** | 该技能完整 `SKILL.md` 正文 | 建议 < 5000 token | 任务匹配 description 时 |
| **Execution** | `scripts/`·`references/`·`assets/` 里的文件 | 按需 | 指令明确要读时 |

好比一本组织良好的手册：先看目录（元数据），再翻到对应章节（正文），最后查附录（资源）。正因如此，你可以挂几十上百个技能，平时只花「目录」的钱。

::: tip 这也决定了怎么写
把「每次都要」的核心指令留在 `SKILL.md`，把「偶尔才查」的长参考下沉到 `references/`，并在正文里写清**何时**去读它——「若 API 返回非 200，读 `references/api-errors.md`」远胜笼统的「详见 references/」。
:::

## 写你的第一个技能（Claude Code）

以「总结未提交改动并标出风险」为例：

**1. 建目录**（个人技能，跨项目可用）：

```bash
mkdir -p ~/.claude/skills/summarize-changes
```

**2. 写 `SKILL.md`**：

```markdown
---
description: 总结未提交改动并标出风险。当用户问「改了什么」、想要 commit message、或让你审 diff 时使用。
---

## 当前改动

!`git diff HEAD`

## 指令

用 2-3 个要点总结上面的改动，再列出你注意到的风险（缺失的错误处理、硬编码值、需同步更新的测试）。若 diff 为空，说明没有未提交改动。
```

> `` !`git diff HEAD` `` 是 Claude Code 的**动态上下文注入**：它先跑命令、把输出替换进技能内容，agent 看到的已是当前真实 diff——技能因此扎根在你的工作树而非猜测。

**3. 测试**：改动任意文件后，问「我改了什么？」让 Claude 自动触发，或直接输入 `/summarize-changes`。

## 技能存哪里，谁能用

在 Claude Code 里，存放位置决定作用域与优先级：

| 位置 | 路径 | 作用域 |
| --- | --- | --- |
| 企业级 | 受管设置目录 | 全组织 |
| 个人 | `~/.claude/skills/<name>/SKILL.md` | 你的所有项目 |
| 项目 | `.claude/skills/<name>/SKILL.md` | 仅本项目 |
| 插件 | `<plugin>/skills/<name>/SKILL.md` | 启用插件处 |

同名冲突时：**企业 > 个人 > 项目**，且任一层都可覆盖内置技能。插件技能用 `plugin-name:skill-name` 命名空间，不会与其它层冲突。

::: warning 自定义命令已并入技能
`.claude/commands/deploy.md` 和 `.claude/skills/deploy/SKILL.md` 都会生成 `/deploy`、行为一致。旧的 `commands/` 文件继续可用；技能的优势是能带目录、带 frontmatter 控制触发、能被自动加载。同名时技能优先。
:::

## 校验你的技能

用官方参考库离线检查 frontmatter 与命名：

```bash
skills-ref validate ./my-skill
```

它会核对 `name`/`description` 合法、命名规范是否满足（小写、无连续连字符、与目录同名等）。

## 下一步

- [指南](./guide-line) —— 规范逐字解剖 + Anthropic 官方创作最佳实践 + 让技能「可预测」的工艺
- [参考](./reference) —— frontmatter 全字段（可移植 vs Claude Code 扩展）、目录约定、生态清单
