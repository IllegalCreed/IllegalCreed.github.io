---
layout: doc
---

# Trail of Bits Skills

Trail of Bits Skills（`trailofbits/skills`）是**Trail of Bits 官方**出品的 Claude Code plugin marketplace，专门增强 AI 辅助的**安全分析、测试与开发**工作流。它把这家老牌安全公司的密码学、智能合约、代码审计、模糊测试等领域的实战方法论打包成 **40 个 plugin / 75 个 skill**——从智能合约多链漏洞扫描（Algorand/Cairo/Cosmos/Solana/Substrate/TON）、模糊测试手册（libFuzzer/AFL++/LibAFL/OSS-Fuzz/Ruzzy/Wycheproof）、到密码学审计（constant-time 分析、ProVerif 协议验证、零化检查）、代码审计（C/Rust review、Semgrep 规则、变体分析）。许可为 **CC-BY-SA-4.0（copyleft）**，并**兼容 Codex**（Codex 可直接加载 Claude marketplace）。业界称其为安全 agent skills 的「gold standard」。

## 评价

**优点**

- **官方安全公司沉淀**：Trail of Bits 自 2002 年起做安全审计，密码学/区块链/代码审计实力雄厚；skill 来自其审计与 Testing Handbook 实战，非泛泛而谈
- **覆盖广而深**：40 plugin / 75 skill，覆盖智能合约（11 skill）、模糊测试（15 skill）、密码学/代码图（10 skill）、代码审计、规则模式、安全扫描、agent/供应链、工程辅助
- **多链智能合约扫描**：building-secure-contracts 为 Algorand/Cairo/Cosmos/Solana/Substrate/TON 六条链各提供 vulnerability-scanner
- **审计工作流闭环**：从审计前准备（audit-prep-assistant）→ 代码图与攻击面（trailmark）→ 多 worker 并行审计（c-review/rust-review）→ 误报核查（fp-check）→ 报告
- **密码学专精**：constant-time-analysis 已发现真实 bug（ML-DSA 签名时序侧信道，RustCrypto 已修），zeroize-audit 检查密钥零化
- **Codex 兼容**：Codex 原生支持加载 Claude marketplace，一条命令装上
- **Trophy Case 公开**：仓库列出了用这些 skill 发现的真实漏洞

**缺点 / 边界**

- **CC-BY-SA-4.0 是 copyleft**：分发或二次创作需同样许可、需署名——**非 MIT/Apache**，集成到商业产品要谨慎
- **偏安全审计专业**：技能面向安全审计师/密码学工程师，非通用编码助手
- **部分技能需外部工具链**：libFuzzer/AFL++/Semgrep/CodeQL/ProVerif/YARA 等需本机装好
- **智能合约扫描偏 Trail of Bits 方法论**：以威胁建模 + 检查表驱动，结果需人复核
- **c-review/rust-review 等大型技能采用多 agent 编排**：worker/judge 协同，调用成本较高

## 适用场景

- 准备安全审计（audit-prep-assistant 按 Trail of Bits 检查表跑一遍）
- 审 C/C++/Rust 原生代码（c-review、rust-review、constant-time-analysis、zeroize-audit）
- 智能合约多链扫描（building-secure-contracts 的 6 条链 vulnerability-scanner）
- 写/测模糊测试 harness（testing-handbook-skills 的 libFuzzer/AFL++/LibAFL/OSS-Fuzz）
- 写 Semgrep/YARA 规则、做变体分析（semgrep-rule-creator、variant-analysis、yara-authoring）
- 密码学协议审计（trailmark 系列：crypto-protocol-diagram、mermaid-to-proverif）

## 边界

- **是 plugin marketplace 不是单 skill**：`/plugin marketplace add trailofbits/skills` 装入 Claude Code，再 `/plugin menu` 选要装的 plugin
- **CC-BY-SA-4.0 copyleft**：商业集成需注意 ShareAlike 传染
- **Codex 直接兼容**：`codex plugin marketplace add trailofbits/skills`
- **不替代人工审计**：skill 是审计师的助手，发现需人工复核、误报需 fp-check 把关

## 官方文档

[Trail of Bits Skills README](https://github.com/trailofbits/skills) ｜ [Testing Handbook](https://appsec.guide) ｜ [Trail of Bits 官网](https://www.trailofbits.com/)

## GitHub 地址

[trailofbits/skills](https://github.com/trailofbits/skills)（CC-BY-SA-4.0）

## 内容地图

- [入门](./getting-started) —— marketplace 安装、75 skill 分类总览、Codex 兼容、为何「gold standard」
- [指南](./guide-line) —— 按分类讲：智能合约/模糊测试/密码学/代码审计/规则模式/安全扫描/agent 供应链/工程辅助 + 安全审计工作流 + 反模式
- [参考](./reference) —— 40 plugin / 75 skill 分类全表、安装、CC-BY-SA-4.0 许可注意、链接

## 幻灯片地址

<a href="/SlideStack/trail-of-bits-skills-slide/" target="_blank">Trail of Bits Skills</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=654" target="_blank" rel="noopener noreferrer">Trail of Bits Skills 测试题</a>

