---
layout: doc
outline: [2, 3]
---

# 参考

> 方法论/主题叶——以 Trail of Bits 安全研究 + trailofbits/skills 相关 skill 为代表锚定，生态另有 agent-skillguard 等第三方。

## 速查

- **代表锚定 skill（CC-BY-SA-4.0）**：`agentic-actions-auditor` / `supply-chain-risk-auditor` / `seatbelt-sandboxer` / `insecure-defaults` / `sharp-edges`
- **生态**：`agent-skillguard`（声明 vs 行为漂移）、Repello 审计方法论
- **Trail of Bits 研究**：4 恶意 skill 绕过所有测试的 skill 扫描器
- **防御纵深 4 层**：人工审计 → 行为对比 → 运行时沙箱 → CI/CD + 依赖审计
- **CI/CD 9 向量**：A–I（env 中介 / 直插 / CLI fetch / PR target / 日志注入 / subshell / eval / 危险沙箱 / 通配 allowlist）

## SKILL.md 作为攻击面：清单

| 攻击面 | 描述 | 典型向量 |
| --- | --- | --- |
| **Prompt injection** | skill 内嵌恶意指令，劫持 agent | SKILL.md 正文、references、scripts 藏指令 |
| **声明/行为漂移** | SKILL.md 声明 A，实际做 B | 偷偷外发数据、改敏感文件、加恶意 postinstall |
| **CI/CD prompt injection** | 攻击者可控输入经 `env:` 进 AI prompt | `pull_request_target` / `issue_comment` / <code v-pre>${{ github.event.* }}</code> |
| **危险 sandbox 配置** | 沙箱被"通配放行"架空 | `danger-full-access` / `Bash(*)` / `--yolo` / `safety-strategy: unsafe` |
| **通配 allowlist** | 谁都能触发 agent action | `allowed_non_write_users: "*"` / `allow-users: "*"` |

## 防御工具表

| 工具 / 方法 | 层级 | 平台 | 一句话 |
| --- | --- | --- | --- |
| `agentic-actions-auditor` | CI/CD 审计 | GitHub Actions | 扫 AI agent（Claude Code Action/Gemini CLI/Codex/GitHub AI Inference）的 9 类攻击向量 |
| `supply-chain-risk-auditor` | 依赖审计 | 跨平台 | 按风险准则标红项目依赖（single maintainer/unmaintained/缺 contact 等） |
| `seatbelt-sandboxer` | 运行时沙箱 | 仅 macOS | 最小权限 allowlist 沙箱配置生成 |
| `insecure-defaults` / `sharp-edges` | 安全默认 | 跨平台 | 配合上述识别默认危险配置 |
| `agent-skillguard`（npm） | 行为对比 | 跨平台 | SKILL.md 声明 vs 观测行为漂移检测 |
| Repello 审计方法论 | 人工审计 | 跨平台 | 安装前逐行读 SKILL.md、列 zip 全部文件、查恶意行为 |

## CI/CD 攻击向量 9 类（agentic-actions-auditor）

| 向量 | 名称 | 关键检查 |
| --- | --- | --- |
| A | Env Var Intermediary | `env:` 含 <code v-pre>${{ github.event.* }}</code> + prompt 读该 env |
| B | Direct Expression Injection | <code v-pre>${{ github.event.* }}</code> 直插 prompt/system-prompt |
| C | CLI Data Fetch | prompt 里 `gh issue view` / `gh pr view` / `gh api` |
| D | PR Target + Checkout | `pull_request_target` + checkout PR head |
| E | Error Log Injection | CI 日志、build 输出、`workflow_dispatch` 输入进 prompt |
| F | Subshell Expansion | 工具允许 list 含支持 `$()` 的命令 |
| G | Eval of AI Output | `eval`/`exec`/`$()` 消费 `steps.*.outputs.*` |
| H | Dangerous Sandbox Configs | `danger-full-access` / `Bash(*)` / `--yolo` / `safety-strategy: unsafe` |
| I | Wildcard Allowlists | `allowed_non_write_users: "*"` / `allow-users: "*"` |

> 向量 H、I 是**放大器**：单独存在是 Low/Info，与 A–G 任一叠加就放大严重度。

## 已识别的 AI Action（agentic-actions-auditor）

| Action Reference | 类型 |
| --- | --- |
| `anthropics/claude-code-action` | Claude Code Action |
| `google-github-actions/run-gemini-cli` | Gemini CLI |
| `google-gemini/gemini-cli-action` | Gemini CLI（legacy/archived） |
| `openai/codex-action` | OpenAI Codex |
| `actions/ai-inference` | GitHub AI Inference |

## 依赖风险准则速查（supply-chain-risk-auditor）

满足任一即标红（仅记录有风险的依赖；不在报告里 = 低风险）：

- **Single maintainer / 个人**——非组织维护；知名者（如 sindresorhus）降一级但风险仍在
- **匿名维护者**——GitHub 身份无法对应真实人，**风险显著更大**
- **Unmaintained**——长期不更新、已 archive、声明 inactive；feature request 类 issue **不算**未响应
- **Low popularity**——Star/下载显著低于同类依赖
- **High-risk features**——FFI / 反序列化 / 三方代码执行
- **Past CVEs**——高/危 CVE 多（相对于流行度）
- **缺 security contact**——`.github/SECURITY.md` / CONTRIBUTING / README 均无联系方式

> 参考 left-pad 事件——single maintainer 被钓鱼/贿赂即可单方推恶意代码。

## macOS Seatbelt 资源分类

`seatbelt-sandboxer` 把沙箱权限按这些类拆（从 deny default 开始按需 allow）：

File Read · File Write · Network · Process · Mach IPC · POSIX IPC · Sysctl · IOKit · Signals · Pseudo-TTY · System · User Prefs · Notifications · AppleEvents · Camera/Mic · Dynamic Code · NVRAM

> 多子命令（如 build / serve）的 app：分别建 profile，配 helper 脚本按子命令路由。

## 反模式（不要这么做）

- 只信自动扫描器（Trail of Bits 已证可被绕过）
- 只读 SKILL.md 不跑行为对比（漂移读不出来）
- sandbox 配 `danger-full-access` / `Bash(*)` / `--yolo`（等于没沙箱）
- `allowed_tools` 限制即心安（`echo $(env)` 即可外泄）
- "prompt 里没 <code v-pre>${{ }}</code> 就安全"（env 中介骗肉眼）
- "只在维护者 PR 上跑"（`pull_request_target` 任意外部 PR 可触发）
- `pull_request_target` + checkout PR head（经典 RCE 路径）

## 资源链接

- 博文：[Trail of Bits — The Sorry State of Skill Distribution](https://blog.trailofbits.com/2026/06/03/the-sorry-state-of-skill-distribution/)
- 仓库：[trailofbits/skills](https://github.com/trailofbits/skills)（CC-BY-SA-4.0）
- 生态：[agent-skillguard（npm）](https://www.npmjs.com/package/agent-skillguard)
- 相关叶：[Trail of Bits Skills](../trailofbits-skills/) · [Skills CLI 与 find-skills](../skills-cli-find-skills/) · [Vercel Agent Skills](../vercel-agent-skills/)
