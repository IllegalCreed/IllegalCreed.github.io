---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 obra/superpowers 主分支编写。本笔记示例都在 Claude Code 2.x 测试。

## 安装

Claude Code 官方 marketplace 一行装：

```bash
# Claude Code 内 slash 命令
/plugin install superpowers@claude-plugins-official
```

或手动 clone（适合修改 skill 后本地使用）：

```bash
git clone https://github.com/obra/superpowers.git ~/.claude/plugins/superpowers
# Claude Code 会在 ~/.claude/plugins/ 下自动扫描
```

::: tip 其它 Agent 平台

| 平台 | 安装命令 |
| --- | --- |
| Codex CLI | `codex plugin install superpowers` |
| Gemini CLI | `gemini ext install superpowers` |
| Cursor | 装 Cursor MCP 插件 + 链 superpowers 目录 |
| Copilot CLI | `copilot ext install superpowers` |
| Factory Droid | UI 操作 |

跨平台一致——同一份 skill 在不同 Agent 下行为相同。

:::

## 验证安装

```
（在 Claude Code 里）
> /plugin list
```

应看到：

```
superpowers@claude-plugins-official    ✓ installed
```

或直接看 skill 列表：

```
> /skills
```

应该列出 `superpowers:*` 命名空间下一组 skill（约 15-25 个）。

## 第一次自动触发

试一个典型场景：

```
> 帮我加一个用户注册功能
```

Claude Code 会**自动**：

1. 看到任务匹配 `superpowers:brainstorming`（任何「加新功能」类需求）→ 先反问需求细节
2. 用户回答需求后匹配 `superpowers:writing-plans` → 先写实施计划
3. 计划批准后匹配 `superpowers:executing-plans` → 逐步执行
4. 涉及测试时匹配 `superpowers:test-driven-development` → 先写测试再实现
5. 完工前匹配 `superpowers:verification-before-completion` → 跑命令拿证据

::: warning 这是「强制」流程

`superpowers` 把这些 step 标记成 **mandatory workflows**——不是建议而是规范。Claude 会很认真照办，简单任务也走全流程。

如果你只想改一行 typo，可显式说「跳过 brainstorming，直接改」。

:::

## 手动触发

不依赖自动匹配，显式调：

```
> 用 /superpowers:test-driven-development 帮我重构 calculatePrice 函数
```

或在对话中点名：

```
> 我下面要做的事请走 systematic-debugging 流程
```

Claude 看到关键字会主动加载对应 skill。

## using-superpowers：入口 meta skill

这是 superpowers 的**总开关**——`using-superpowers` 是「meta skill」，对话开始时自动加载，作用是「教 Agent 如何发现并用 skills」。

它要求 Agent：

1. 任何回答前（包括澄清问题）**必须**先 `Skill` 工具加载相关 skill
2. 不允许凭直觉直接答题
3. skill 优先级 > 默认行为

```
（对话开始时）

[system-reminder]
Below is the full content of your 'superpowers:using-superpowers' skill - your introduction to using skills...
```

这是为什么装了 superpowers 后 Claude 「**风格突变**」的根源——之前可能直接动手写代码，现在会先停下来问需求 / 写计划 / 走 TDD。

## 核心 skill 速览

按使用频次排序前 10 个：

| Skill | 何时自动触发 | 干什么 |
| --- | --- | --- |
| `using-superpowers` | 每次对话开始 | 加载 skill 系统 |
| `brainstorming` | 「加新功能 / 设计 X」类问题 | 苏格拉底式反问需求 |
| `writing-plans` | 多步任务 | 先写计划文档 |
| `executing-plans` | 计划批准后 | 逐步执行 + 人工 checkpoint |
| `test-driven-development` | 写代码前 | RED-GREEN-REFACTOR 循环 |
| `systematic-debugging` | 调试场景 | 4 阶段根因分析 |
| `verification-before-completion` | 声称完工前 | 跑命令拿证据 |
| `subagent-driven-development` | 大型任务 | 派发独立子任务 + 两段式审查 |
| `dispatching-parallel-agents` | 多个无依赖任务 | 并行下发 |
| `using-git-worktrees` | 风险大的改动 | 隔离工作区 |

详见 [指南](./guide-line) 与 [参考](./reference) 章节。

## 第一次实战体验

试一个完整流程：

```
> 帮我给这个 quiz-monorepo 项目加一个「答题历史导出 CSV」功能
```

预期流程：

1. **brainstorming** 反问：导出范围（本人 / 全员）？字段（哪些）？触发方式（按钮 / 定时）？
2. 你回答完后 **writing-plans** 写计划：API 端点 / DTO / Service / UI 按钮 / 测试
3. 你 approve 后 **executing-plans** 一步步实施
4. 写实现前 **test-driven-development** 先写测试
5. 实施完后 **verification-before-completion** 跑测试 + 启动 dev server 验证

::: tip 这个体验是「强迫」性的

如果不喜欢这样，可以说「**我先不要 brainstorming，按我说的直接做**」。Claude 仍会保留部分实践（如 verification）。

:::

## 升级

```bash
/plugin update superpowers
```

或 clone 安装的：

```bash
cd ~/.claude/plugins/superpowers
git pull
```

## 卸载

```bash
/plugin uninstall superpowers
```

会从 settings 删除 plugin 注册。`~/.claude/plugins/superpowers/` 目录可手动 `rm -rf`。

## 下一步

- [指南](./guide-line) —— 每个 skill 详细介绍 + 怎么写自己的 skill
- [参考](./reference) —— 完整 skill 列表 + frontmatter 字段 + plugin 配置
- 上游：[Skills 编写指南](https://github.com/obra/superpowers/blob/main/skills/writing-skills/SKILL.md)
