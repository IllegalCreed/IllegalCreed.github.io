---
layout: doc
---

# Skill 安全与供应链治理

Skill 安全与供应链治理是一个**方法论/主题叶**——把 `SKILL.md` / agent skill 当作**攻击面**来治理。它不是某一个单一官方仓，而是以 **Trail of Bits 安全研究**为核心一手、以其官方 `trailofbits/skills` 内相关 skill 为代表锚定（`agentic-actions-auditor` / `supply-chain-risk-auditor` / `seatbelt-sandboxer` 等），生态另有第三方工具如 `agent-skillguard`、Repello 审计方法论等共同构成防御体系。

## 评价

**优点**

- **直击真实攻击面**：Trail of Bits「The Sorry State of Skill Distribution」（2026-06-03）造了 4 个明恶意 skill，绕过了所有测试的 skill 扫描器（含 ClawHub、Cisco agent skill 扫描器）——本叶把这条结论当作起点
- **官方锚定清晰**：`agentic-actions-auditor` 检测 GitHub Actions 里 AI agent 的 CI/CD prompt injection；`supply-chain-risk-auditor` 给出依赖风险准则（single maintainer / unmaintained / 缺 security contact 等）；`seatbelt-sandboxer` 做 macOS 沙箱限制
- **生态互补**：`agent-skillguard` 对比 SKILL.md 声明 vs 观测行为检测漂移；Repello 提供安装前逐行审计方法论
- **多层防御思路清晰**：安装前人工审计 → 行为对比 → 运行时沙箱 → CI/CD agent 审计 → 依赖供应链审计，纵深而非单点
- **CC-BY-SA-4.0 开放**：Trail of Bits 的 skill 与准则可被复用、扩展、嵌入企业流程

**缺点 / 边界**

- **方法论叶，非单一仓**：以 Trail of Bits 研究为代表锚定，生态另有第三方；不要把它当作某个「官方 skill 框架」
- **不能只靠自动化扫描器**：核心结论是「现有扫描器不足以作为唯一把关」，自动化通过 ≠ 安全
- **macOS 限定**：`seatbelt-sandboxer` 是 macOS 专用；Linux 用 seccomp-bpf/AppArmor/namespaces，Windows 另有方案
- **CI/CD 范围限定**：`agentic-actions-auditor` 只覆盖 GitHub Actions（含 Claude Code Action/Gemini CLI/Codex/GitHub AI Inference），不管 Jenkins/GitLab CI/CircleCI
- **静态分析非动态利用**：相关 skill 是静态审计指导，不做 runtime prompt injection 渗透

## 适用场景

- 你在分发或消费 agent skill / `SKILL.md`（Claude Code、Cursor、Codex 等），需要评估可信度
- 你在 GitHub Actions 里集成了 Claude Code Action / Gemini CLI / Codex，担心 PR 评论等攻击者可控输入触发 prompt injection
- 你要审计项目依赖的供应链风险（single maintainer、unmaintained、缺 security contact 等）
- 你要在 macOS 上用 seatbelt 给 agent 进程加一层运行时沙箱（防 supply chain 攻击的纵深防御）
- 你想用 `agent-skillguard` 对比 skill 声明与实际行为，揪出声明/行为漂移

## 边界

- **不是某个 skill 仓的速查页**：是方法论叶——SKILL.md 作为攻击面 + 多层防御思路
- **不替代理渗透**：静态审计 + 行为对比 + 沙箱 是**预防性纵深**，不是红队 runtime 利用
- **不覆盖非 GitHub CI**：Jenkins/GitLab CI/CircleCI 在 `agentic-actions-auditor` 之外
- **依赖审计非漏洞扫描**：`supply-chain-risk-auditor` 评估「被接管/利用的**风险**」，不是 `npm audit`/`pip-audit` 的已知 CVE 列表

## 核心素材

- Trail of Bits 博文「The Sorry State of Skill Distribution」（2026-06-03）：4 个明恶意 skill 绕过所有测试的 skill 扫描器
- `trailofbits/skills`（CC-BY-SA-4.0）：`agentic-actions-auditor` / `supply-chain-risk-auditor` / `seatbelt-sandboxer` / `insecure-defaults` / `sharp-edges`
- 生态工具：`agent-skillguard`（npm，声明 vs 行为漂移检测）、Repello 审计方法论（逐行读 SKILL.md、列 zip 全部文件、查恶意行为）

## 官方与生态锚点

- [Trail of Bits 博文：The Sorry State of Skill Distribution](https://blog.trailofbits.com/2026/06/03/the-sorry-state-of-skill-distribution/) ｜ [trailofbits/skills](https://github.com/trailofbits/skills)（CC-BY-SA-4.0）
- [agent-skillguard（npm）](https://www.npmjs.com/package/agent-skillguard)：声明 vs 行为漂移检测

## 内容地图

- [入门](./getting-started) —— 方法论叶定位、SKILL.md 作为攻击面、Trail of Bits 核心发现、防御层级总览
- [指南](./guide-line) —— 攻击面详解（prompt injection/声明行为漂移）、防御四层深入、依赖风险准则、反模式
- [参考](./reference) —— 攻击面清单、防御工具表、依赖风险准则速查、链接合集

## 幻灯片地址

<a href="/SlideStack/skill-security-supply-chain-slide/" target="_blank">Skill 安全与供应链治理</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=653" target="_blank" rel="noopener noreferrer">Skill 安全与供应链治理 测试题</a>

