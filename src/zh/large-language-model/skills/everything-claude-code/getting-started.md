---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Everything Claude Code 主分支编写。本笔记示例在 Claude Code 2.x 测试。

## 安装

最快路径：Claude Code 内 marketplace 一行装：

```bash
# Claude Code 里输入
/plugin install ecc@ecc
```

或通用安装器（适合 Codex / Cursor / OpenCode）：

```bash
npm i -g ecc-universal
ecc install --profile full
```

或 npx 一次性：

```bash
npx ecc-install --profile core
```

或 bash 脚本（仓库 release 提供）：

```bash
curl -fsSL https://github.com/affaan-m/everything-claude-code/raw/main/install.sh | bash -s -- --profile full
```

## Profile 选择

ECC 按 profile 控制装多少：

| Profile | 包含 | 适合 |
| --- | --- | --- |
| `minimal` | 基础几个 skills + 1-2 个 agent | 体验 / 看看是什么 |
| `core` | 30-50 skills + 关键 agent | **推荐**，覆盖 TDD / 调试 / review |
| `full` | 230+ skills + 60 agents 全装 | 极致党 / 不在乎系统提示开销 |

```bash
# 装核心
/plugin install ecc@ecc --profile core

# 升级 profile
/plugin update ecc --profile full
```

## 验证

```bash
# 装完后看 plugin
/plugin list

# 看 skill 列表
/skills | grep ecc:

# 看 agent
/agents | grep ecc:
```

应能看到 `ecc:*` 前缀的 skill / agent。

## 文件位置

```
~/.claude/plugins/ecc/
├── skills/                       # 230+ SKILL.md
├── agents/                       # 60 subagent 配置
├── hooks/                        # hook 模板
├── rules/                        # 多语言 rules（按文件类型自动激活）
│   ├── typescript.md
│   ├── python.md
│   └── ...
├── shields/                      # AgentShield 规则
└── plugin.json
```

## 第一次使用

试 ECC 的核心 agent：

```
> 用 ecc:planning-agent 帮我设计一个评论系统的 schema 和 API
```

planning-agent 会：

1. 询问需求范围（嵌套评论？审核？通知？）
2. 给出 schema 设计（含 ER 图描述）
3. 列 API 端点
4. 提议 acceptance criteria

类似 superpowers 的 `brainstorming + writing-plans` 组合，但 ECC 更结构化、更工程化。

## 多语言 Rules

ECC 自动按当前文件类型激活对应 rule。打开 `*.ts` 文件时：

```
[system-reminder]
Below is the full content of your 'ecc:typescript-rules' skill...
```

会强制 Agent 遵循：

- `noUncheckedIndexedAccess` 推荐开
- 用 `satisfies` 而非 `as`
- 类型 import / 值 import 分开
- ...（约 50 条 TS 最佳实践）

切到 `*.py` 文件时自动切到 Python rules。

## AgentShield：安全扫描

```bash
# 扫当前项目的 CLAUDE.md / .cursorrules / .ecc 配置
ecc shield scan

# 输出
✓ CLAUDE.md: 0 issues
⚠ .cursorrules: 1 medium-severity prompt injection (line 42)
✓ skills/*.md: 0 issues
```

102 条规则覆盖：

- prompt injection（隐藏指令在 system prompt 里）
- 敏感信息泄露（API key in CLAUDE.md）
- 已知恶意模式（社区收集的 attack pattern）
- 越权指令（让 Agent 自动 push --force / rm -rf 等）

::: tip 何时跑

- 装新 plugin 后立刻扫一次
- 接手陌生仓库 clone 后扫
- CI 中跑：`ecc shield scan --fail-on-medium`

:::

## 与 superpowers 共存

ECC 与 superpowers 都装时 skill 命名冲突可能：

| Skill 名 | superpowers | ecc |
| --- | --- | --- |
| `test-driven-development` | ✓ | ✓ |
| `systematic-debugging` | ✓ | ✓ |
| `verification-before-completion` | ✓ | ✓ |

两边内容略不同。**Claude Code 显示带前缀**（`superpowers:test-driven-development` vs `ecc:test-driven-development`），用户/Agent 选哪个。

::: warning 一般只装一个

两者都装：

- 系统提示加倍占空间
- Agent 选哪个走流程不确定，行为不稳定

**建议**：选一个走到底。**superpowers 偏方法论**（流程严格），**ECC 偏工程基础设施**（功能广）。日常开发选 superpowers，企业级或需要安全扫描选 ECC。

:::

## 升级

```bash
/plugin update ecc
```

或 clone 安装的：

```bash
cd ~/.claude/plugins/ecc
git pull
```

## 卸载

```bash
/plugin uninstall ecc
```

`~/.claude/plugins/ecc/` 目录可 `rm -rf` 彻底删。

## 下一步

- [指南](./guide-line) —— 60 个 agent 中最常用的 / 多语言 rules / AgentShield 深入
- [参考](./reference) —— 完整 skill / agent 列表 + profile 差异 + 配置项
- 上游：[ecc.tools](https://ecc.tools/) / [GitHub](https://github.com/affaan-m/everything-claude-code)
