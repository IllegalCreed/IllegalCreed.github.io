---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 obra/superpowers 主分支编写。完整 skill 列表见 [GitHub 仓库](https://github.com/obra/superpowers/tree/main/skills)。

## 完整 Skill 列表

### Core workflow skills

| Skill | 强度 | 触发 |
| --- | --- | --- |
| `using-superpowers` | mandatory | 每次对话开始 |
| `brainstorming` | mandatory | 新需求 / 设计问题 |
| `writing-plans` | mandatory | 多步任务 |
| `executing-plans` | mandatory | 计划批准后 |
| `verification-before-completion` | mandatory | 声称完工前 |
| `test-driven-development` | mandatory | 写代码前 |
| `systematic-debugging` | mandatory | 调试场景 |

### Subagent / parallel skills

| Skill | 触发 |
| --- | --- |
| `subagent-driven-development` | 大型任务派子代理 |
| `dispatching-parallel-agents` | 多个无依赖任务 |
| `dispatching-investigative-subagent` | 调研型子任务 |
| `dispatching-research-subagent` | 文献 / 资料调研 |

### Git / workflow skills

| Skill | 触发 |
| --- | --- |
| `using-git-worktrees` | 风险大改动隔离 |
| `finishing-a-development-branch` | 完工后流程 |
| `requesting-code-review` | 提交 review |
| `receiving-code-review` | 收到 review 评论 |
| `using-git` | 通用 git 操作 |

### Code quality skills

| Skill | 触发 |
| --- | --- |
| `writing-tests` | 写测试场景 |
| `writing-skills` | 创建新 skill 时 |
| `refactoring` | 重构场景 |
| `condition-based-waiting` | 异步代码涉及等待 |
| `defensive-programming` | 边界处理 |

### Meta skills

| Skill | 作用 |
| --- | --- |
| `using-superpowers` | 入口，强制 skill-first 流程 |
| `evaluating-skill-fit` | 判断哪个 skill 适合当前任务 |
| `composing-skills` | 多个 skill 组合使用 |

::: tip 列表持续更新

上游 skill 数会随版本变化。准确列表用 `/skills` 或看 `~/.claude/plugins/superpowers/skills/`。

:::

## SKILL.md frontmatter 完整字段

```md
---
name: my-skill
description: |
  Use when [触发场景描述]
  Example: "用户问 X" / "需要做 Y 前"
strength: mandatory | recommended | optional
applies-to:
  - claude-code
  - codex
  - gemini-cli
  - cursor
  - copilot-cli
related-skills:
  - test-driven-development
  - verification-before-completion
references:
  - title: "Some Reference"
    url: "https://..."
---
```

| 字段 | 必需 | 说明 |
| --- | --- | --- |
| `name` | ✓ | skill 名（也是 `/<name>` 命令） |
| `description` | ✓ | 何时触发——Agent 据此自动调用 |
| `strength` | - | `mandatory` / `recommended` / `optional` |
| `applies-to` | - | 适用 Agent 平台（无字段 = 全适用） |
| `related-skills` | - | 关联 skill（供 Agent 链式调用） |
| `references` | - | 外部参考链接 |

`mandatory` 与 `recommended` 的差别：

- `mandatory`：Agent **必须**走这个流程，跳过需用户显式同意
- `recommended`：Agent 优先用但可灵活判断
- `optional`：仅手动调用

## Plugin 配置

### 启用 / 禁用

```json
// ~/.claude/settings.json
{
  "plugins": {
    "superpowers": {
      "enabled": true,
      "disabledSkills": ["brainstorming"],
      "disabledMandatorySkills": []
    }
  }
}
```

### 项目级覆盖

```json
// <project>/.claude/settings.json
{
  "plugins": {
    "superpowers": {
      "disabledSkills": ["using-git-worktrees"]
    }
  }
}
```

项目内禁用某 skill（合并：用户级 + 项目级 disabledSkills 取并集）。

## 文件结构

```
~/.claude/plugins/superpowers/        # plugin 安装位置
├── skills/
│   ├── using-superpowers/
│   │   └── SKILL.md
│   ├── brainstorming/
│   │   └── SKILL.md
│   ├── test-driven-development/
│   │   ├── SKILL.md
│   │   └── references/
│   │       └── test-anti-patterns.md
│   └── ...
├── plugin.json                       # plugin 元数据
└── README.md
```

`plugin.json`:

```json
{
  "name": "superpowers",
  "version": "1.x.x",
  "author": "Jesse Vincent (Prime Radiant)",
  "description": "...",
  "skills": [
    {
      "name": "using-superpowers",
      "path": "skills/using-superpowers/SKILL.md"
    },
    ...
  ]
}
```

## CLI 命令

### Marketplace 操作

```bash
# 列出可用 plugin
/plugin list --available

# 装
/plugin install superpowers@claude-plugins-official
/plugin install superpowers@1.5.0   # 指定版本

# 升级
/plugin update superpowers

# 卸载
/plugin uninstall superpowers

# 查看 plugin 详情
/plugin info superpowers

# 临时禁用（不删）
/plugin disable superpowers
/plugin enable superpowers
```

### Skill 操作

```bash
/skills                           # 列当前生效 skill
/skills --plugin superpowers      # 仅 superpowers 的 skill
/skills <name>                    # 看某 skill 详情
/superpowers:<name>               # 手动触发
```

## 命名空间约定

| 来源 | 命名规则 | 例子 |
| --- | --- | --- |
| 用户自写（`~/.claude/skills/`） | 无前缀 | `my-team-style` |
| 项目自写（`<proj>/.claude/skills/`） | 无前缀 | `cypress-skill` |
| Plugin 安装 | `<plugin-name>:<skill>` | `superpowers:brainstorming` |
| Anthropic 内置 | `claude-code:<skill>` | （罕见） |

冲突优先级：项目 > 用户 > plugin > 内置（具体 > 通用）。

## 跨平台兼容性

| Skill 字段 | Claude Code | Codex | Gemini CLI | Cursor | Copilot |
| --- | --- | --- | --- | --- | --- |
| `name` / `description` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `Skill` tool 加载 | ✓ | ✓ (`skill`) | `activate_skill` | UI 触发 | ✓ |
| `strength: mandatory` | ✓ | ✓ | 部分 | ✓ | ✓ |
| 项目级 skill | ✓ | ✓ | ✓ | ✓ | ✓ |
| Hooks 配合 | ✓ | 部分 | 部分 | -    | ✓ |

详见 superpowers 仓库 `references/copilot-tools.md` / `references/codex-tools.md` / `references/gemini-tools.md` 等平台适配说明。

## 与其它 skill 框架对比

| 框架 | 范围 | 特点 |
| --- | --- | --- |
| **superpowers** | 软件开发全流程 | mandatory workflow，强制 skill-first |
| **Easy Claude Code (ECC)** | Claude Code 使用辅助 | 降低使用门槛，简化命令 |
| **awesome-claude-code** 列表 | 工具索引 | 不是 skill 框架，是清单 |
| 自家 SKILL.md | 项目内规范 | 团队 / 个人定制 |

参考：[ECC](../easy-claude-code/) / [awesome-claude-code](https://github.com/hesreallyhim/awesome-claude-code)。

## 调试 skill 加载

```bash
# 详细日志看 skill 加载顺序
CLAUDE_LOG_LEVEL=debug claude

# 查看当前会话注入的 skill
/skills --active
```

调试 frontmatter 解析错：

```bash
# skill 文件加载失败时 stderr 输出
claude --debug 2>&1 | grep "skill"
```

## 反模式

| 反模式 | 问题 |
| --- | --- |
| 写 100 行的 description | Agent 读不完，建议 < 200 字 |
| description 太宽（"用于编码"） | 没法精准触发，建议「`Use when 用户问 X 类问题`」 |
| 步骤含「**考虑性能**」「**保证质量**」等空话 | 不具体可执行 → 改成「用 console.time 测时长」「跑 lint --max-warnings=0」 |
| skill 之间循环引用 | A → B → A 无限递归 |
| mandatory skill 太多 | Agent 每次都走全流程，慢且烦 |
| 中文 skill 配中文 Agent | 跨平台时英文 Agent 看不懂 |

## 资源链接

- 仓库：[obra/superpowers](https://github.com/obra/superpowers)
- 发布页：[primeradiant.com/superpowers](https://primeradiant.com/superpowers/)
- Skill 编写指南：[skills/writing-skills/SKILL.md](https://github.com/obra/superpowers/blob/main/skills/writing-skills/SKILL.md)
- Anthropic Skills 文档：[docs.claude.com/skills](https://docs.claude.com/en/docs/claude-code/skills)
- 作者 Jesse Vincent 博客：[primeradiant.com/blog](https://primeradiant.com/blog/)
- Marketplace：通过 Claude Code 内 `/plugin list --available`
