---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 Everything Claude Code 主分支编写

## 速查

- 装：`/plugin install ecc@ecc` 或 `npx ecc-install --profile core`
- 看 skill / agent：`/skills | grep ecc:` / `/agents | grep ecc:`
- 安全扫描：`ecc shield scan`
- 升级：`/plugin update ecc`
- 与 superpowers 共存：建议二选一，避免 skill 冲突 + 系统提示膨胀
- 自定义 profile：`~/.claude/plugins/ecc/.profile` 选 minimal / core / full

## 整体架构

ECC 不是单一 skill 包，而是「**Agent 工程基础设施集合**」：

```
ECC
├── Skills（230+）        - SKILL.md，自动触发流程
├── Agents（60）          - subagent 配置（独立上下文跑特定任务）
├── Rules（多语言）       - 按文件类型自动激活的编码规范
├── Hooks（15+ 模板）     - tool 调用前/后的 shell 命令模板
├── AgentShield           - 安全扫描器（防 prompt injection）
└── Cross-harness adapters - Claude Code / Cursor / OpenCode / ... 适配
```

## 核心 Agents

### planning-agent

**何时调**：新功能 / 复杂任务前。

**做的事**：

1. 读 `CLAUDE.md` + 现有代码理解项目
2. 询问需求 / 约束 / 验收
3. 输出结构化设计文档（schema / API / UI / test plan）
4. 写 `docs/plans/<date>-<title>.md`

```
> 用 ecc:planning-agent 设计「评论系统」
```

```md
# 评论系统设计

## 需求范围（确认中...）
- 支持嵌套？最大层级？
- 审核机制？
- 通知机制（提到我 / 回复我）？

## Schema（待确认）
... [ER 图]

## API
GET /api/comments?postId=...
POST /api/comments
PATCH /api/comments/:id
DELETE /api/comments/:id

## 实施步骤
1. ...
```

### code-review-agent

**何时调**：完成大段代码后 / PR 提交前。

**做的事**：

1. 读改动的 git diff
2. 按多语言 rule 检查
3. 跑 AgentShield 扫安全
4. 列具体问题 + 建议

类似 GitHub Copilot Code Review，但跑在本地 + 跨平台。

### debugging-agent

**何时调**：bug 复现 + 调试场景。

**做的事**：

1. 让用户复现 bug 给堆栈 / 日志
2. 4 阶段根因分析（复现 / 缩小 / 假设 / 验证）
3. 提议修复 + 回归测试

### security-agent

**何时调**：安全敏感代码（auth / 加密 / 输入处理）。

**做的事**：

1. 扫常见漏洞模式（SQL inj / XSS / CSRF / path traversal）
2. 提议防护措施
3. 跑 AgentShield 校验 prompt injection 面

### refactoring-agent

**何时调**：重构请求。

**做的事**：

1. 读现有代码识别坏味（long function / 复杂条件 / 重复）
2. 提议重构策略
3. 增量改 + 持续跑测试

### testing-agent

**何时调**：写测试 / 提升覆盖率。

**做的事**：

1. 分析代码识别测试不足
2. 提议 unit / integration / e2e 测试分布
3. 写测试 + 跑确认

### docs-agent

**何时调**：写文档 / README / API 文档。

**做的事**：

1. 读代码 + 公开 API 自动生成文档骨架
2. 含示例 + 边界情况
3. 跨语言（中英）模板

## 多语言 Rules

每个语言一个 rule 文件，文件打开时自动激活：

### TypeScript Rules（约 50 条）

```md
- 用 satisfies 而非 as
- 类型 import 分开（import type）
- 严格 null check + noUncheckedIndexedAccess
- enum 不要用（用 union 字面量）
- 避免 any，必要时用 unknown + type guard
- Generic 约束写明确
...
```

### Python Rules（约 40 条）

```md
- type hints 全覆盖
- 用 dataclass / pydantic 而非裸 dict
- 异常类继承 Exception 而非 BaseException
- async def 不要嵌 sync I/O
- 用 pathlib 而非 os.path
...
```

### Go / Java / Rust / PHP / Kotlin

同样覆盖各语言常见反模式 + 项目惯例。

## Hooks 模板

ECC 提供 15+ 类 hook 模板（位于 `~/.claude/plugins/ecc/hooks/`）：

```json
{
  "matcher": { "tool": "Edit", "path": "*.ts" },
  "hooks": [
    {
      "type": "command",
      "command": "cd $CLAUDE_PROJECT_DIR && pnpm exec tsc --noEmit --pretty false 2>&1 || true"
    }
  ]
}
```

常用 hook 类别：

| 类别 | 何时触发 | 做什么 |
| --- | --- | --- |
| `lint-on-edit` | Edit TS/JS/Vue 后 | 跑 ESLint / Prettier |
| `typecheck-on-edit` | Edit TS 后 | 跑 tsc --noEmit |
| `test-on-edit` | Edit src/ 后 | 跑相关 unit test |
| `format-on-write` | Write 后 | 跑 prettier --write |
| `audit-bash` | Bash 前 | 记日志 + 高危命令拦截 |
| `commit-validation` | git commit 前 | 跑 commitlint |
| `push-protection` | git push 前 | 阻止 main 直推 |
| `mcp-call-log` | MCP tool 调用 | 记 audit log |
| `cost-monitor` | tool 调用 | 累计 token 消耗，阈值告警 |
| `notification` | 长任务完成 | 系统通知 / Slack |

启用 hook 模板：

```bash
ecc hook enable lint-on-edit
ecc hook list
ecc hook disable audit-bash
```

或手动 copy 到 `~/.claude/settings.json` 调整。

## AgentShield 深入

102 条规则扫 prompt injection / 敏感信息 / 越权指令。

### 扫描范围

```bash
ecc shield scan                    # 当前项目所有 ECC 相关文件
ecc shield scan ~/.claude/         # 用户全局配置
ecc shield scan --include "*.md"   # 仅 markdown
ecc shield scan --exclude "node_modules/**"
```

### 严重级

| 级别 | 含义 | 默认行为 |
| --- | --- | --- |
| `critical` | 明确恶意（自动 rm -rf 等） | 报错退出 |
| `high` | 高度可疑（隐藏 base64 指令） | 报错退出 |
| `medium` | 可疑（不常见模式） | 警告 |
| `low` | 风格 / 弱实践 | 提示 |

### CI 集成

```yaml
# GitHub Actions
- name: AgentShield scan
  run: |
    npx ecc-install --profile minimal
    ecc shield scan --fail-on-medium
```

CI 阻断含可疑 prompt injection 的 CLAUDE.md / SKILL.md 合入。

### 自定义规则

`~/.claude/plugins/ecc/shields/custom.yml`：

```yaml
rules:
  - id: my-custom-1
    pattern: 'curl .* \| sh'
    severity: critical
    message: "Avoid piping curl to shell"

  - id: my-custom-2
    pattern: '(?i)ignore (all )?previous instructions'
    severity: high
    message: "Possible prompt injection"
```

## 跨 Harness 适配

ECC 用同一份 skill / agent 配置，在不同 Agent 平台运行：

| Harness | 安装命令 | 注意 |
| --- | --- | --- |
| Claude Code | `/plugin install ecc@ecc` | 一类支持 |
| Codex CLI | `codex plugin install ecc` | hook 部分功能受限 |
| Cursor | Cursor MCP 装 `ecc-mcp` | rule 通过 .cursorrules 文件 |
| OpenCode | 配置 `~/.opencode/plugins/ecc/` | 全功能 |
| Antigravity | 通过 marketplace | 部分 agent 不可用 |

`~/.claude/plugins/ecc/adapters/` 含每个 harness 的特定适配代码。

## 「Instinct-based」持续学习

ECC v2 引入 instinct 机制：Agent 在用户反复纠正某行为后，把纠正信息累积到 `~/.claude/plugins/ecc/instincts/`：

```yaml
# instincts/typescript-strict-mode.yml
context: TypeScript projects
learned-from: 12 user corrections
instinct: |
  This project uses noUncheckedIndexedAccess strict mode.
  Always handle T | undefined when indexing arrays.
```

下次 ECC 看到 TS 文件时自动注入该 instinct——避免重复犯同一错误。

::: tip vs Memory

Claude Code 原生 memory 是「**对话累积**」（每个会话各自记），ECC instinct 是「**全局技能内化**」（跨项目跨会话）。

:::

## 性能与成本

| Profile | Skills | Agents | 系统提示开销 | 月费（按 Sonnet） |
| --- | --- | --- | --- | --- |
| minimal | ~10 | 3 | +3KB | +$1-3 |
| core | ~50 | 15 | +10KB | +$10-20 |
| full | 230+ | 60 | +30KB | +$30-60 |

::: warning full 不要轻易开

230+ skill 全装：

- 每次对话 +30KB 系统提示
- 重度用户月成本可能 +$60
- Agent 决策时 skill 选择犹豫（太多选项）

**推荐**：core profile，按需追加项目相关 skill。

:::

## 与 superpowers 选择

| 维度 | superpowers | ECC |
| --- | --- | --- |
| 体量 | 15-25 skill | 230+ skill + 60 agent |
| 哲学 | 流程严格（mandatory workflow） | 工程基础设施（functional） |
| 安全扫描 | ✗ | AgentShield |
| 多语言 rules | ✗ | TS/Python/Go/Java/Rust/PHP/Kotlin |
| 跨 harness | ✓ | ✓ |
| 学习曲线 | 低 | 中 |
| 系统提示开销 | 低 | 中-高 |
| 适合 | 个人 + 强流程 | 团队 + 工程化 + 多语言 |

**单选建议**：

- 全栈 / 多人团队 + 多语言：**ECC core**
- 单语言（如 TS）+ 重视流程：**superpowers**
- 实验玩家：先 superpowers，再决定要不要 ECC

## 自定义 / 扩展

### 禁用某 skill

```json
// ~/.claude/settings.json
{
  "plugins": {
    "ecc": {
      "disabledSkills": ["ecc:overly-strict-rule"],
      "disabledAgents": ["ecc:slow-agent"]
    }
  }
}
```

### 覆盖某 skill

同名 skill 放 `~/.claude/skills/<name>/SKILL.md`——用户级 skill 优先 plugin 级。

### 写自己的 agent

`~/.claude/agents/my-agent.md`，frontmatter 加 `inherits-from: ecc:planning-agent` 继承 ECC 设计。

## 故障排查

| 现象 | 排查 |
| --- | --- |
| `/plugin install` 失败 | 网络问题（marketplace 境外） / 用 npx ecc-install 替代 |
| skill 太多 Agent 不知道选哪个 | 切到 `core` profile / 禁用不用的 skill |
| agent 调用报错 | `ecc:planning-agent` 等内部有依赖，看 `/agents` 详细 |
| AgentShield 误报 | 调 severity 阈值 / `--exclude` 排除文件 |
| 升级后行为变 | `~/.claude/plugins/ecc/CHANGELOG.md` 看变更 |
| 卸载 superpowers 后 ecc 也不工作 | 共享配置 cache，重启 Claude Code |

## 版本里程碑

| 版本 | 时间 | 主要变化 |
| --- | --- | --- |
| 0.x | 2026 初 | 首次发布 + hackathon 优胜 |
| 1.0 | 2026 中 | 230+ skill / 60 agent / AgentShield |
| 1.x | 持续 | instinct v2 / 跨 harness 完善 / 性能优化 |

## 易混淆：chemany/easy-claude-code

社区里偶尔有人把 ECC 称为 "easy claude code"——但有一个**字面同名**的不同项目：

[chemany/easy-claude-code](https://github.com/chemany/easy-claude-code)——provider 切换 GUI，**面向中国大陆用户**：

- 一键切换 Moonshot Kimi / 通义千问 / 智谱 GLM / `claude.nekro.ai` 代理
- Python GUI / 单文件可执行
- 自动管理环境变量
- README 有中文版

**与 ECC 完全不同**：

| 维度 | Everything Claude Code | easy-claude-code (chemany) |
| --- | --- | --- |
| 目的 | Agent 工程框架 | Provider 切换 GUI |
| 体量 | 230+ skills | 单工具 |
| 大陆用户 | 需自备网络 | 开箱即用 |

如果你想要的是「在中国大陆顺畅用 Claude Code」，看 easy-claude-code；如果是「让 Agent 写代码更靠谱」，看本笔记（ECC）。
