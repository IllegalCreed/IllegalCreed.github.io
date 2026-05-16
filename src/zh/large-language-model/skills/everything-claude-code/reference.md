---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Everything Claude Code 主分支编写。完整列表见 [GitHub 仓库](https://github.com/affaan-m/everything-claude-code) / [ecc.tools](https://ecc.tools/)。

## CLI 命令

### `ecc install`

```bash
ecc install [--profile <name>] [--harness <name>]
```

| Flag | 说明 |
| --- | --- |
| `--profile` | `minimal` / `core` / `full`（默认 core） |
| `--harness` | `claude-code` / `codex` / `cursor` / `opencode` / `all`（默认 all） |
| `--dry-run` | 不实际装，只列出会做的事 |
| `--force` | 覆盖已存在配置 |

### `ecc shield scan`

```bash
ecc shield scan [path] [flags]
```

| Flag | 说明 |
| --- | --- |
| `--fail-on-medium` | medium 及以上严重度 exit 1 |
| `--fail-on-high` | 仅 high+critical 退出非 0 |
| `--include <glob>` | 仅扫匹配的文件 |
| `--exclude <glob>` | 排除文件 |
| `--format json` | 输出 JSON 给 CI 解析 |
| `--severity-min <level>` | 仅显示 ≥ 该 severity |
| `--quiet` | 仅输出问题 |

### `ecc hook`

```bash
ecc hook list                          # 所有可用 hook 模板
ecc hook enable <name>                 # 启用某 hook
ecc hook disable <name>                # 禁用
ecc hook show <name>                   # 看模板内容
ecc hook customize <name>              # 复制到本地编辑
```

### `ecc skill / agent / rule`

```bash
ecc skill list [--enabled-only]
ecc skill show <name>
ecc skill disable <name>

ecc agent list
ecc agent show <name>

ecc rule list                          # 多语言 rules
ecc rule show typescript               # 看 TS rules
```

### `ecc update`

```bash
ecc update                             # 升级 ECC 自身
ecc update --check                     # 仅检查不升级
ecc update --rollback                  # 回滚到上一版本
```

## 配置文件

### `~/.claude/plugins/ecc/.profile`

```json
{
  "profile": "core",
  "enabledSkills": ["ecc:test-driven-development", ...],
  "disabledSkills": [],
  "enabledAgents": ["ecc:planning-agent", "ecc:code-review-agent"],
  "enabledRules": ["typescript", "python"],
  "shieldSeverity": "medium",
  "harness": "claude-code"
}
```

### `~/.claude/settings.json` 中的 ECC 配置

```json
{
  "plugins": {
    "ecc": {
      "enabled": true,
      "profile": "core",
      "disabledSkills": ["ecc:overly-strict-rule"],
      "disabledAgents": [],
      "shieldOnStartup": true,
      "instinctEnabled": true
    }
  }
}
```

## Agent 完整列表（精选）

### Planning & Design

| Agent | 用途 |
| --- | --- |
| `ecc:planning-agent` | 需求 → 设计文档 |
| `ecc:architecture-agent` | 系统架构设计 |
| `ecc:api-design-agent` | RESTful / GraphQL API 设计 |
| `ecc:database-design-agent` | Schema / 迁移设计 |
| `ecc:ui-design-agent` | UI 组件 / 交互设计 |

### Implementation

| Agent | 用途 |
| --- | --- |
| `ecc:typescript-implementer` | TS 代码实现 |
| `ecc:python-implementer` | Python 实现 |
| `ecc:react-implementer` | React 组件 |
| `ecc:vue-implementer` | Vue 组件 |
| `ecc:backend-implementer` | API / 服务端 |

### Quality

| Agent | 用途 |
| --- | --- |
| `ecc:code-review-agent` | 代码评审 |
| `ecc:testing-agent` | 测试覆盖 |
| `ecc:refactoring-agent` | 重构 |
| `ecc:debugging-agent` | bug 定位 |
| `ecc:performance-agent` | 性能优化 |

### Security

| Agent | 用途 |
| --- | --- |
| `ecc:security-agent` | 安全审计 |
| `ecc:agentshield-agent` | prompt injection 扫描 |
| `ecc:auth-agent` | 鉴权方案 |

### DevOps

| Agent | 用途 |
| --- | --- |
| `ecc:ci-cd-agent` | CI/CD 配置 |
| `ecc:docker-agent` | Docker / Compose |
| `ecc:k8s-agent` | Kubernetes manifest |
| `ecc:terraform-agent` | IaC |

### Documentation

| Agent | 用途 |
| --- | --- |
| `ecc:docs-agent` | README / API 文档 |
| `ecc:adr-agent` | Architecture Decision Records |
| `ecc:changelog-agent` | CHANGELOG 维护 |

::: tip 完整 60 个 agent 列表

跑 `ecc agent list` 看具体。仓库的 `agents/` 目录是源数据。

:::

## Skill 命名空间

| 命名空间 | 来源 |
| --- | --- |
| `ecc:<name>` | Everything Claude Code |
| `superpowers:<name>` | obra/superpowers |
| 无前缀 | 用户 / 项目自写 |
| `<plugin-name>:<name>` | 其它社区 plugin |

ECC skill 例子：

- `ecc:test-driven-development`
- `ecc:systematic-debugging`
- `ecc:multi-language-rules`
- `ecc:agentshield-scan-before-commit`
- `ecc:planning-document-template`

## 多语言 Rules

每个语言的 rule 文件位置：

```
~/.claude/plugins/ecc/rules/
├── typescript.md
├── javascript.md
├── python.md
├── go.md
├── java.md
├── rust.md
├── php.md
├── kotlin.md
├── ruby.md
├── csharp.md
└── ...
```

| Rule | 行数 | 涵盖 |
| --- | --- | --- |
| typescript.md | ~50 条 | type strict / satisfies / 数组下标安全 |
| python.md | ~40 条 | type hints / async / pathlib / dataclass |
| go.md | ~35 条 | error 处理 / channel / context 传递 |
| java.md | ~30 条 | Spring 最佳实践 / Stream / Optional |
| rust.md | ~25 条 | borrow / lifetime / Result vs panic |

文件打开时按 mimetype 自动激活对应 rule。

## AgentShield 规则结构

```yaml
# ~/.claude/plugins/ecc/shields/builtin.yml
- id: prompt-injection-base64
  severity: high
  pattern: '(?i)[A-Za-z0-9+/]{20,}={0,2}'
  context_check: |
    if matches_base64_decode_to_directive(match):
      return True
    return False
  message: "Possible base64-encoded prompt injection"
  references:
    - https://github.com/cybersec/known-attacks

- id: rm-rf-pattern
  severity: critical
  pattern: 'rm -rf \w+'
  message: "Dangerous rm -rf in agent config"
```

### 规则字段

| 字段 | 必需 | 说明 |
| --- | --- | --- |
| `id` | ✓ | 规则 ID |
| `severity` | ✓ | critical / high / medium / low |
| `pattern` | ✓ | 正则 / glob |
| `context_check` | - | 二次校验脚本（避免误报） |
| `message` | ✓ | 提示消息 |
| `references` | - | 参考链接 |
| `applies_to` | - | 文件 glob 限定 |

### 自定义规则示例

```yaml
# ~/.claude/plugins/ecc/shields/custom.yml
- id: company-secret-leak
  severity: critical
  pattern: 'CORP-SECRET-[A-Z0-9]{32}'
  message: "Corporate secret detected in agent config"

- id: deprecated-api-mention
  severity: low
  pattern: 'old-internal-api\.com'
  message: "Reference to deprecated internal API"
  applies_to: ["**/*.md"]
```

## Hook 模板列表

```
~/.claude/plugins/ecc/hooks/
├── lint-on-edit.json
├── typecheck-on-edit.json
├── test-on-edit.json
├── format-on-write.json
├── audit-bash.json
├── commit-validation.json
├── push-protection.json
├── mcp-call-log.json
├── cost-monitor.json
├── notification-on-complete.json
├── security-scan-on-edit.json
├── pii-scrubbing.json
├── docker-build-cache-clean.json
├── git-worktree-init.json
└── post-deployment-verify.json
```

每个 JSON 是 hook 配置模板，启用时 copy 到 `~/.claude/settings.json` 的 `hooks` 数组。

## Profile 差异

| Profile | Skills | Agents | Rules | Hooks | Shield |
| --- | --- | --- | --- | --- | --- |
| minimal | ~10 | 3 | 1（TS） | 2 | 关 |
| core | ~50 | 15 | 3-5 | 5 | medium 严重度 |
| full | 230+ | 60 | 全语言 | 全模板 | 全规则 |

按需切换：

```bash
ecc install --profile minimal
ecc install --profile core --force      # 升级
ecc install --profile full --force
```

## 环境变量

| 变量 | 作用 |
| --- | --- |
| `ECC_PROFILE` | 覆盖 `.profile` 中的 profile 字段 |
| `ECC_SHIELD_OFF` | `1` 临时禁用 AgentShield |
| `ECC_INSTINCT_OFF` | `1` 禁用持续学习 |
| `ECC_LOG_LEVEL` | debug / info / warn / error |
| `ECC_REGISTRY_URL` | 自托管 marketplace URL |

## 内部目录

```
~/.claude/plugins/ecc/
├── skills/               # 230+ SKILL.md（按类别子目录组织）
│   ├── core/
│   ├── language/
│   ├── security/
│   ├── ml/
│   └── ...
├── agents/               # 60 agent 配置
├── rules/                # 多语言 rules
├── hooks/                # hook 模板
├── shields/              # AgentShield 规则
│   ├── builtin.yml
│   ├── custom.yml        # 用户自定义
│   └── ...
├── adapters/             # 跨 harness 适配
│   ├── claude-code/
│   ├── codex/
│   ├── cursor/
│   └── opencode/
├── instincts/            # 持续学习累积
├── .profile              # 当前 profile 配置
├── CHANGELOG.md
├── plugin.json
└── README.md
```

## CI 集成示例

### GitHub Actions

```yaml
- name: ECC Setup
  run: |
    npm i -g ecc-universal
    ecc install --profile minimal --harness claude-code

- name: AgentShield scan
  run: ecc shield scan --fail-on-medium --format json > shield-report.json

- name: Upload shield report
  uses: actions/upload-artifact@v4
  with:
    name: agentshield-report
    path: shield-report.json
```

### GitLab CI

```yaml
agentshield:
  image: node:22
  script:
    - npm i -g ecc-universal
    - ecc install --profile minimal
    - ecc shield scan --fail-on-high
  artifacts:
    reports:
      sast: shield-report.json
```

## 资源链接

- 仓库：[affaan-m/everything-claude-code](https://github.com/affaan-m/everything-claude-code)
- 官网：[ecc.tools](https://ecc.tools/)
- 文档：[ecc.tools/docs](https://ecc.tools/docs)
- Hackathon 介绍：[Anthropic blog](https://www.anthropic.com/news)
- 解读：
  - [Augment Code](https://www.augmentcode.com/learn/everything-claude-code-github)
  - [Bridgers Agency](https://bridgers.agency/en/blog/everything-claude-code-explained)
- AgentShield：[docs.ecc.tools/shield](https://docs.ecc.tools/shield)
- 易混淆同名：[chemany/easy-claude-code](https://github.com/chemany/easy-claude-code)（provider GUI，非本笔记主体）
- Anthropic Skills 文档：[docs.claude.com/skills](https://docs.claude.com/en/docs/claude-code/skills)
