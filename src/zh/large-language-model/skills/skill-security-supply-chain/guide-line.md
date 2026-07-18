---
layout: doc
outline: [2, 3]
---

# 指南

> 方法论/主题叶——以 Trail of Bits 安全研究 + trailofbits/skills 相关 skill 为代表锚定。基于「The Sorry State of Skill Distribution」博文与各 SKILL.md 编写。

## 速查

- **攻击面**：prompt injection（恶意指令嵌 skill）/ 声明行为漂移（声明 A 实际做 B）
- **Trail of Bits 4 恶意 skill**：绕过所有测试的 skill 扫描器（ClawHub、Cisco）——自动化不够
- **防御四层**：安装前人工审计 → `agent-skillguard` 行为对比 → `seatbelt-sandboxer` 运行时沙箱 → `agentic-actions-auditor` + `supply-chain-risk-auditor` CI/CD 与依赖审计
- **依赖风险准则**：single maintainer / 匿名 / unmaintained / low popularity / 高危特性（FFI/反序列化/三方代码执行）/ past CVE / 缺 security contact
- **反模式**：只信自动扫描器；只读 SKILL.md 不跑行为对比；sandbox 配 `danger-full-access`
- **macOS 限定**：seatbelt 仅 macOS；Linux 用 seccomp/AppArmor

## 攻击面一：prompt injection

skill 是会被 agent **加载并执行**的内容。攻击者把恶意指令藏在：

- SKILL.md 正文（自然语言指令）
- `references/` 文档（被 agent 读进上下文）
- skill 调用的脚本（`scripts/`）

被 agent 调用时，这些指令获得了 agent 的权限——读你的代码、写文件、调网络。**与 npm/PyPI 供应链同构，但更隐蔽**：自然语言指令不像代码那样容易被静态扫描器判定为「恶意」。

CI/CD 场景更危险：GitHub Actions 里集成了 Claude Code Action / Gemini CLI / Codex 时，攻击者可控输入（PR 评论、issue body）可能经 `env:` 块传到 AI prompt——这就是 `agentic-actions-auditor` 重点查的向量。

### CI/CD prompt injection 的常见入口

- `pull_request_target` 触发——以 base 分支上下文跑，外部 PR 即可触发
- `issue_comment` / `issues` 触发——评论与 issue 正文是攻击者可控输入
- <code v-pre>${{ github.event.* }}</code> 表达式经 `env:` 块间接到达 prompt（YAML 看着干净，prompt 仍被污染）

### 四种「自我安慰」要拒绝（来自 agentic-actions-auditor）

1. **「它只跑维护者的 PR」**——错：`pull_request_target` 让任意外部贡献者能触发
2. **「我们用 allowed_tools 限制了」**——错：连 `echo` 都能被 `echo $(env)` 用来外泄
3. **「prompt 里没有 <code v-pre>${{ }}</code>，安全」**——错：env 中介模式，YAML 干净但 prompt 仍被污染
4. **「沙箱防得住」**——错：`danger-full-access` / `Bash(*)` / `--yolo` 直接关掉保护

## 攻击面二：声明 vs 行为漂移（drift）

SKILL.md 声明 skill 的用途，实际行为可能不一致：

- 声明「格式化代码」实际偷偷 `curl` 外发 `.env`
- 声明「生成测试」实际改 `package.json` 加恶意 postinstall
- 声明「lint」实际往 `~/.ssh/authorized_keys` 写入

**声明/行为漂移**是供应链攻击的常见向量。`agent-skillguard`（npm）这类工具跑 skill、观测其实际行为、与 SKILL.md 声明对比，漂移即告警。

## Trail of Bits 研究：4 恶意 skill 绕过所有扫描器

2026-06-03 Trail of Bits 博文「The Sorry State of Skill Distribution」核心结论：

- 造了 **4 个明恶意 agent skill**
- 这些 skill **绕过了所有测试的 skill 扫描器**（含 ClawHub 恶意 skill 检测器、Cisco agent skill 扫描器等）
- 公共 skill marketplace 是重大攻击面
- 现有自动化扫描器**不足以**作为唯一把关

**核心教训**：

> 自动化通过 ≠ 安全。需要 **sandboxing + 运行时行为监控 + 人工审查** 的纵深组合。

## 防御第一层：安装前人工审计

最低成本、最高 ROI。安装任何 skill 前：

1. **逐行读 SKILL.md**——查可疑指令（外发、eval、改敏感文件）
2. **列出 skill zip 全部文件**——`unzip -l skill.zip` 看有没有不在声明里的脚本
3. **检查脚本内容**——查数据外发、shell 注入、危险操作（写 `authorized_keys`、读 `~/.aws/credentials`）
4. **核 source**——是知名组织 / 个人？还是匿名新账号？

Repello 把这做成可重复的审计方法论。

## 防御第二层：行为对比（agent-skillguard）

光读声明不够——要跑起来对比。

`agent-skillguard`（npm）：

- 读 SKILL.md 提取**声明行为**
- 在受控环境跑 skill，**观测实际行为**（文件读写、网络调用、子进程）
- 对比两者，**漂移即告警**

适合 CI 集成、批量 skill 体检。

## 防御第三层：运行时沙箱（seatbelt-sandboxer）

即使被恶意 skill 钻空子，沙箱限制它的爆炸半径。

`seatbelt-sandboxer`（macOS）：

- 生成最小权限 **allowlist** 沙箱配置（deny default + 显式 allow）
- 资源分类：File Read / File Write / Network / Process / Mach IPC / POSIX IPC / Sysctl / IOKit / Signals / Pseudo-TTY / System / User Prefs / Notifications / AppleEvents / Camera/Mic / Dynamic Code / NVRAM
- 每类按需开（如只允许读项目目录、写指定输出目录）
- 多子命令场景（如 build / serve）分别建 profile，加 helper 脚本路由

> **重要**：allowlist ≠ denylist。从「拒绝一切」开始，按需放行。`danger-full-access` / `Bash(*)` / `--yolo` 这些"通配放行"等于没沙箱。

**Linux 替代**：seccomp-bpf、AppArmor、namespaces（seatbelt 不管 Linux）。

## 防御第四层：CI/CD agent 审计（agentic-actions-auditor）

如果你的 GitHub Actions 里集成了 AI agent（Claude Code Action / Gemini CLI / Codex / GitHub AI Inference），用 `agentic-actions-auditor` 审计 9 类攻击向量：

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

**注意**：向量 H、I 是**放大器**——单独存在只是 Low/Info，与 A–G 任一叠加就放大严重度。

## 防御第五层：依赖供应链审计（supply-chain-risk-auditor）

`supply-chain-risk-auditor` 评估**项目依赖**被接管/利用的风险。**判高风险的准则**（满足任一即标红）：

| 准则 | 说明 | 理由 |
| --- | --- | --- |
| **Single maintainer / 团队个人** | 主要靠单个人或少数人，非组织维护 | 被钓鱼/贿赂即可单方推恶意代码（参考 left-pad） |
| **匿名维护者** | GitHub 身份无法对应真实人 | 风险显著更大，溯源困难 |
| **Unmaintained** | 长期不更新 / 已 archive / 维护者声明 inactive | 漏洞不被及时修 |
| **Low popularity** | Star / 下载量显著低于其他同类依赖 | 眼睛少，恶意代码引入不易被发现 |
| **High-risk features** | FFI / 反序列化 / 三方代码执行 | 天然高危，需更高门槛 |
| **Past CVEs** | 高/危 CVE 多（相对于流行度） | 历史漏洞密度 |
| **缺 security contact** | `.github/SECURITY.md` / README 无安全联系方式 | 漏洞难以及时上报 |

> 重要：只标红**有风险因子**的依赖；不出现在报告 = 低风险。feature request 类 issue 不算"维护不响应"。

## 反模式：不要这么做

- **只信自动扫描器**：Trail of Bits 已证 4 个明恶意 skill 全绕过——扫描器是**第一道**而非唯一关
- **只读 SKILL.md 不跑行为对比**：声明/行为漂移读不出来，要 `agent-skillguard` 跑出来
- **sandbox 配 `danger-full-access` / `Bash(*)` / `--yolo`**：等于没沙箱
- **`allowed_tools` 限制即心安**：连 `echo` 都能被 `echo $(env)` 外泄
- **「prompt 里没 <code v-pre>${{ }}</code> 就安全」**：env 中介模式骗过肉眼
- **「只在维护者 PR 上跑」**：`pull_request_target` 让任意外部 PR 都能触发
- **`pull_request_target` + checkout PR head**：经典 RCE 路径（向量 D）

## 下一步

- [参考](./reference) —— 攻击面清单、防御工具表、依赖风险准则速查、链接合集
- 上游：[Trail of Bits 博文：The Sorry State of Skill Distribution](https://blog.trailofbits.com/2026/06/03/the-sorry-state-of-skill-distribution/) ｜ [trailofbits/skills](https://github.com/trailofbits/skills)
