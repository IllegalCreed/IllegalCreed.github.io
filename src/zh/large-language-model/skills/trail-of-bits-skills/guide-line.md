---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 trailofbits/skills 主分支（2026-07-18）的 README、plugins/ 各 SKILL.md 与 LICENSE 编写。

## 速查

- **8 大类**：智能合约 · 模糊测试 · 密码学/代码图 · 代码审计 · 规则模式 · 安全扫描 · agent/供应链 · 工程辅助
- **智能合约**：building-secure-contracts 6 链 vulnerability-scanner（Algorand/Cairo/Cosmos/Solana/Substrate/TON）+ audit-prep-assistant 等 5 个辅助 skill
- **模糊测试**：testing-handbook-skills 15 skill，libFuzzer/AFL++/LibAFL/OSS-Fuzz/Ruzzy/Atheris/cargo-fuzz + Wycheproof + 测试手册生成器
- **密码学 / 代码图**：trailmark 10 skill——代码图 + ProVerif 协议验证 + Mermaid 转换；constant-time-analysis 找编译器引入的时序侧信道（已发现真实 bug）；zeroize-audit 检查密钥零化
- **代码审计**：c-review 多 worker + dedup-judge + fp-judge 三段并行；rust-review 覆盖 unsafe/内存/并发/panic-DoS/FFI/async；fp-check 强制误报核查
- **规则模式**：semgrep-rule-creator + variant-creator（跨语言移植）+ variant-analysis（找同类漏洞）+ yara-authoring
- **安全审计工作流**：audit-prep-assistant（准备）→ trailmark（代码图/攻击面）→ c-review/rust-review（多 worker 审计）→ fp-check（误报把关）→ 报告
- **反模式**：盲目信任 skill 结果、跳过 fp-check、把 copyleft CC-BY-SA-4.0 当 MIT 用、智能合约扫描不带业务上下文

## 智能合约安全：6 链漏洞扫描

`building-secure-contracts` 是 11 skill 的合集，核心是**6 条链各一个 vulnerability-scanner**：

- `algorand-vulnerability-scanner`
- `cairo-vulnerability-scanner`（Starknet）
- `cosmos-vulnerability-scanner`（CosmWasm / Cosmos SDK）
- `solana-vulnerability-scanner`（Solana / Anchor）
- `substrate-vulnerability-scanner`（Polkadot Substrate）
- `ton-vulnerability-scanner`（TON / FunC / Tact）

辅助 skill：

- `audit-prep-assistant`——按 Trail of Bits 检查表准备审计（设目标、跑静态分析、提测试覆盖、清死代码、产文档）；**审计前 1-2 周**用
- `code-maturity-assessor`——评估代码成熟度
- `guidelines-advisor`——智能合约安全准则建议
- `secure-workflow-guide`——安全开发工作流
- `token-integration-analyzer`——代币集成分析

另有 `entry-point-analyzer`（识别状态变更入口点）与 `spec-to-code-compliance`（链上代码与规范一致性核查，区块链审计专用）。

## 模糊测试：testing-handbook-skills 15 skill

来自公开的 [Testing Handbook](https://appsec.guide)，覆盖主流模糊器与配套技术：

| 类型 | skill |
| --- | --- |
| 覆盖引导模糊器 | `libfuzzer`（LLVM 内建，C/C++ 起步首选）· `aflpp`（AFL++，多核）· `libafl`（定制/研究）· `ruzzy`（Rust）· `atheris`（Python）· `cargo-fuzz`（Rust crate） |
| 平台 | `ossfuzz`（Google OSS-Fuzz 集成） |
| 密码学测试 | `wycheproof`（已知密码学边界用例集）· `constant-time-testing` |
| 配套 | `harness-writing`（写 fuzz harness）· `fuzzing-dictionary`· `fuzzing-obstacles`· `coverage-analysis`· `address-sanitizer` |
| 生成器 | `testing-handbook-generator`（按需生成测试手册） |

关键判断：libFuzzer **自 2022 年底进入维护模式**但仍是入门首选（安装简单、与 LLVM 集成）；AFL++ 多核突变更强；LibAFL 适合定制研究。**libFuzzer 的 harness 与 AFL++ 兼容**，可平滑迁移。

## 密码学 / 代码图：trailmark 10 skill + 三件套

`trailmark` 把源码解析为**多语言代码图**（函数 / 类 / 调用 / 语义元数据），用于安全分析。10 个 skill：

- `trailmark`——主 skill，构建代码图；包含爆炸半径、污点传播、权限边界、入口点枚举等预分析 pass
- `audit-augmentation`——给代码单元加 LLM 推断注释（假设、前置条件）
- `crypto-protocol-diagram`——密码学协议图
- `mermaid-to-proverif`——Mermaid 图转 [ProVerif](https://prosecco.gforge.inria.fr/personal/bblanche/proverif/) 协议验证器输入
- `genotoxic`——突变测试 triage（内部调 trailmark）
- `vector-forge`·`graph-evolution`·`diagramming-code`·`trailmark-structural`·`trailmark-summary`

配套密码学专用：

- `constant-time-analysis`——检测**编译器引入**的时序侧信道（已发现 RustCrypto ML-DSA 签名 bug，[PR #1144](https://github.com/RustCrypto/signatures/pull/1144)）
- `zeroize-audit`——检测密钥/敏感数据缺失零化或被编译器消除的零化（C/C++/Rust）

## 代码审计：多 agent 编排

`c-review` 是代表性大 skill——**多 worker 并行 + dedup-judge + fp-judge 三段编排**：

| 子 agent | 职责 |
| --- | --- |
| `c-review-worker` | 跑分配到的代码簇、产 finding |
| `c-review-dedup-judge` | 合并重复 finding（最先跑） |
| `c-review-fp-judge` | 误报核查 + 严重度评级 + 最终报告（第二跑） |

覆盖范围：内存安全、整数溢出、竞态、类型混淆、Linux/macOS 守护进程、Windows 用户态服务。**不**适用：内核驱动、托管语言（Java/C#/Python/Go/Rust）、裸金属。

`rust-review` 类似但针对 Rust——safe/unsafe 边界、内存安全、并发、panic-DoS、FFI、async runtime，输出 SARIF。

其它审计 skill：`audit-context-building`（深度架构上下文）、`differential-review`（git 历史差分审计）、`fp-check`（强制误报核查 + gate review）、`sharp-edges`（找 footgun API）、`insecure-defaults`（不安全默认配置 / 硬编码凭据 / fail-open）、`static-analysis`（CodeQL/Semgrep/SARIF）。

## 规则与模式

- `semgrep-rule-creator`——创建 Semgrep 规则（漏洞 / bug 模式 / 编码规范），强调**必须 `semgrep --test` 验证**，"pattern 看着对"是反模式
- `semgrep-rule-variant-creator`——把已有规则移植到新语言（测试驱动）
- `variant-analysis`——基于模式在多仓里找同类漏洞
- `yara-authoring`——YARA 检测规则（lint、atom 分析、最佳实践）

## 安全扫描 / agent 与供应链

- `burpsuite-project-parser`——解析 Burp Suite 项目文件
- `firebase-apk-scanner`——扫 Android APK 的 Firebase 配错
- `agentic-actions-auditor`——审计 GitHub Actions 工作流的 AI agent 安全漏洞
- `supply-chain-risk-auditor`——审计依赖供应链威胁
- `seatbelt-sandboxer`——生成最小化 macOS Seatbelt 沙箱配置
- `second-opinion`——调用外部 LLM CLI（OpenAI Codex / Google Gemini）做交叉评审

## 安全审计工作流（推荐顺序）

```text
1. audit-prep-assistant   # 审计前 1-2 周准备：目标 / 静态分析 / 覆盖率 / 死代码 / 文档
2. trailmark              # 构建代码图：爆炸半径 / 入口点 / 攻击面 / 污点
3. static-analysis        # CodeQL / Semgrep / SARIF 第一遍
4. c-review / rust-review # 多 worker 并行深度审计
5. fp-check               # 强制误报核查 + gate review
6. variant-analysis       # 用已确认漏洞找同类
7. mutation-testing       # 验证测试质量
8. 报告
```

## 反模式

- **跳过 audit-prep-assistant 直接审**——未准备的代码库审计效率低
- **跳过 fp-check**——fp-judge 不是可选项，未经核查的 finding 不可直接报告
- **智能合约扫描不带业务上下文**——vulnerability-scanner 是辅助，最终判断需理解代币经济、权限模型
- **把 CC-BY-SA-4.0 当 MIT 用**——copyleft 传染，商业闭源分发需法务评估
- **写 Semgrep 规则不跑 `--test`**——"pattern 看着对"掩盖假阳/假阴
- **c-review 跑在内核驱动上**——明确不在范围（c-review 是用户态）

## 与相邻叶的边界

- **通用 agent skill 生态**（Vercel/Antfu/Cursor 等）在各自叶，本叶专做安全审计
- **Testing Handbook**（appsec.guide）是 testing-handbook-skills 的源文档，可单独学

## 下一步

- [参考](./reference) —— 40 plugin / 75 skill 全表、CC-BY-SA-4.0 注意、链接
- 上游：[trailofbits/skills](https://github.com/trailofbits/skills) · [Testing Handbook](https://appsec.guide)
