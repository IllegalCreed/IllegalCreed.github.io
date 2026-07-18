---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 trailofbits/skills 主分支（2026-07-18 检视）的 README、plugins/ 目录与各 SKILL.md 编写。仓库共 40 plugin / 75 skill，许可 CC-BY-SA-4.0。

## 速查

- **是什么**：Trail of Bits 官方 Claude Code plugin marketplace，专做 AI 辅助安全分析/测试/开发；40 plugin / 75 skill；CC-BY-SA-4.0（copyleft）；Codex 兼容
- **装**（Claude Code）：`/plugin marketplace add trailofbits/skills` → `/plugin menu` 浏览/装；或本地开发 `/plugins marketplace add ./skills`
- **装**（Codex）：`codex plugin marketplace add trailofbits/skills` → `codex plugin list` → `codex plugin add <plugin-name>@trailofbits`
- **大类**：智能合约安全 / 代码审计 / 模糊测试 / 密码学审计 / 规则与模式 / 安全扫描 / agent 与供应链 / 验证 / 逆向 / 移动 / 工程 / 团队管理 / 工具 / 基础设施
- **代表性 plugin**：building-secure-contracts（11 skill · 6 链漏洞扫描）、testing-handbook-skills（15 skill · 全模糊测试栈）、trailmark（10 skill · 代码图 + 协议验证）、c-review、rust-review、semgrep-rule-creator、constant-time-analysis、supply-chain-risk-auditor
- **「gold standard」**：来自 20+ 年安全审计实战、Testing Handbook 公开、Trophy Case 列真实 bug（如 ML-DSA 时序侧信道）
- **许可注意**：CC-BY-SA-4.0 = 署名 + 同样许可（copyleft），商业集成需评估

## 定位：是谁、做了什么

Trail of Bits 是 2002 年成立的美国安全公司，专精密码学、区块链、代码审计与逆向工程。`trailofbits/skills` 仓库是它官方维护的 Claude Code plugin marketplace，把公司的审计方法论、Testing Handbook、密码学工具、智能合约检查表封装成可调用的 skill。

**计数（以 2026-07-18 `ls plugins/` + 各 SKILL.md 计）**：40 个 plugin 目录、75 个 SKILL.md。**网搜常低估为 35+ skill，实际 75**。

**许可**：CC-BY-SA-4.0（Creative Commons Attribution-ShareAlike 4.0 International）——**copyleft**，分发/改编需署名并以同样许可发布。**非 MIT/Apache**。

**Codex 兼容**：Codex 原生支持加载 Claude marketplace，无需额外 sidecar 元数据。

## 安装

### Claude Code

```text
/plugin marketplace add trailofbits/skills
/plugin menu
```

`/plugin menu` 打开浏览界面，按需安装单个 plugin（如 building-secure-contracts、c-review）。

### Codex

```bash
codex plugin marketplace add trailofbits/skills
codex plugin list
codex plugin add <plugin-name>@trailofbits
```

### 本地开发

仓库**父目录**下：

```bash
cd /path/to/parent   # 若仓在 ~/projects/skills，进 ~/projects
/plugins marketplace add ./skills
```

## 75 skill 分类总览

按 plugin 聚合（数字为该 plugin 下 skill 数）：

| 大类 | plugin（skill 数） |
| --- | --- |
| **智能合约安全** | building-secure-contracts（11 · 含 6 链 vulnerability-scanner）· entry-point-analyzer（1）· spec-to-code-compliance（1） |
| **代码审计** | c-review · rust-review · audit-context-building · differential-review · fp-check · sharp-edges · insecure-defaults · static-analysis（3 · codeql/semgrep/sarif-parsing）· variant-analysis |
| **模糊测试 / 验证** | testing-handbook-skills（15 · libfuzzer/aflpp/libafl/ossfuzz/ruzzy/atheris/cargo-fuzz/wycheproof/constant-time-testing/coverage-analysis/fuzzing-dictionary/fuzzing-obstacles/harness-writing/address-sanitizer/testing-handbook-generator）· mutation-testing · property-based-testing |
| **密码学 / 代码图** | trailmark（10 · trailmark/audit-augmentation/crypto-protocol-diagram/mermaid-to-proverif/genotoxic/vector-forge/graph-evolution/diagramming-code/trailmark-structural/trailmark-summary）· constant-time-analysis · zeroize-audit · dwarf-expert |
| **规则与模式** | semgrep-rule-creator · semgrep-rule-variant-creator · yara-authoring |
| **安全扫描** | burpsuite-project-parser · firebase-apk-scanner |
| **agent 与供应链** | agentic-actions-auditor · supply-chain-risk-auditor · seatbelt-sandboxer · second-opinion（调用外部 LLM CLIs 做交叉评审） |
| **工程辅助** | gh-cli · git-cleanup · modern-python · devcontainer-setup · dimensional-analysis · workflow-skill-design · skill-improver · ask-questions-if-underspecified · let-fate-decide |
| **团队 / 工具 / 基础设施** | culture-index · claude-in-chrome-troubleshooting · debug-buttercup（Kubernetes 调试） |

## 为何被称为「gold standard」

- **来源权威**：Trail of Bits 是密码学/区块链/代码审计领域的标杆公司（OpenSSL、Bitcoin Core、Libra/Diem、Telegram 等都做过审计）
- **方法论沉淀**：skill 不是 prompt 片段，而是把公司内部的审计 playbook（c-review 的多 worker + dedup-judge + fp-judge 三段编排）封装进去
- **配套公开资料**：[Testing Handbook](https://appsec.guide) 在线免费、Building Secure Contracts 课程公开
- **Trophy Case**：仓库公开列了用 skill 发现的真实漏洞——例如 `constant-time-analysis` 找出 RustCrypto ML-DSA 签名的时序侧信道（PR #1144 已合）
- **持续更新**：覆盖新链（TON、Solana、Cosmos）、新工具（LibAFL、Ruzzy）

## 相关仓库

- [claude-code-config](https://github.com/trailofbits/claude-code-config) · [skills-curated](https://github.com/trailofbits/skills-curated) · [claude-code-devcontainer](https://github.com/trailofbits/claude-code-devcontainer) · [dropkit](https://github.com/trailofbits/dropkit)

## 下一步

- [指南](./guide-line) —— 按分类深入、安全审计工作流、反模式
- [参考](./reference) —— 40 plugin / 75 skill 全表、CC-BY-SA-4.0 注意、链接
