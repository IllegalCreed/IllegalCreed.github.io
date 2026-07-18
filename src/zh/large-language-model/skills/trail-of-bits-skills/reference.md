---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 trailofbits/skills 主分支（2026-07-18 `ls plugins/` 与各 SKILL.md）。许可 CC-BY-SA-4.0。

## 速查

- **装**（Claude Code）：`/plugin marketplace add trailofbits/skills` → `/plugin menu`
- **装**（Codex）：`codex plugin marketplace add trailofbits/skills` → `codex plugin add <plugin>@trailofbits`
- **40 plugin / 75 skill**（网搜常低估，实际 75）
- **许可**：CC-BY-SA-4.0（**copyleft**——署名 + 同样许可；非 MIT/Apache）
- **结构**：每个 plugin 一个目录，下含 `skills/<skill-name>/SKILL.md`；marketplace 元数据在仓库根

## 40 plugin / 75 skill 全表

### 智能合约安全（13 skill）

| plugin | skill 数 | skill |
| --- | --- | --- |
| building-secure-contracts | 11 | algorand-vulnerability-scanner · cairo-vulnerability-scanner · cosmos-vulnerability-scanner · solana-vulnerability-scanner · substrate-vulnerability-scanner · ton-vulnerability-scanner · audit-prep-assistant · code-maturity-assessor · guidelines-advisor · secure-workflow-guide · token-integration-analyzer |
| entry-point-analyzer | 1 | entry-point-analyzer（识别状态变更入口点） |
| spec-to-code-compliance | 1 | spec-to-code-compliance（区块链规范一致性核查） |

### 模糊测试（15 skill · testing-handbook-skills）

| skill |
| --- |
| libfuzzer · aflpp · libafl · ruzzy · atheris · cargo-fuzz · ossfuzz · wycheproof · constant-time-testing · address-sanitizer · coverage-analysis · fuzzing-dictionary · fuzzing-obstacles · harness-writing · testing-handbook-generator |

### 密码学 / 代码图（13 skill）

| plugin | skill 数 | skill |
| --- | --- | --- |
| trailmark | 10 | trailmark · audit-augmentation · crypto-protocol-diagram · mermaid-to-proverif · genotoxic · vector-forge · graph-evolution · diagramming-code · trailmark-structural · trailmark-summary |
| constant-time-analysis | 1 | constant-time-analysis（编译器引入的时序侧信道） |
| zeroize-audit | 1 | zeroize-audit（密钥零化缺失/被消除） |
| dwarf-expert | 1 | dwarf-expert（DWARF 调试格式） |

### 代码审计（11 skill）

| plugin | skill |
| --- | --- |
| c-review | c-review（多 worker + dedup-judge + fp-judge） |
| rust-review | rust-review（unsafe / 内存 / 并发 / panic-DoS / FFI / async，SARIF） |
| audit-context-building | 超细粒度架构上下文 |
| differential-review | git 差分审计 |
| fp-check | 强制误报核查 |
| sharp-edges | footgun API |
| insecure-defaults | 不安全默认 / 硬编码凭据 / fail-open |
| static-analysis | 3 skill：codeql · semgrep · sarif-parsing |
| variant-analysis | 同类漏洞搜索 |

### 规则与模式（4 skill）

| plugin |
| --- |
| semgrep-rule-creator · semgrep-rule-variant-creator · yara-authoring（YARA 检测规则） + variant-analysis（已列入代码审计） |

### 安全扫描（2 skill）

| plugin |
| --- |
| burpsuite-project-parser（Burp Suite 项目解析）· firebase-apk-scanner（Android APK Firebase 配错） |

### agent 与供应链（4 skill）

| plugin | 一句话 |
| --- | --- |
| agentic-actions-auditor | 审 GitHub Actions 工作流的 AI agent 漏洞 |
| supply-chain-risk-auditor | 审依赖供应链威胁 |
| seatbelt-sandboxer | 生成最小化 macOS Seatbelt 沙箱配置 |
| second-opinion | 调外部 LLM CLI（Codex / Gemini）做交叉评审 |

### 验证 / 逆向 / 移动（5 skill）

| plugin |
| --- |
| mutation-testing · property-based-testing（验证） · dwarf-expert（逆向，已列入密码学组） · firebase-apk-scanner（移动，已列入扫描组） |

> 注：部分 skill 跨类（如 dwarf-expert、firebase-apk-scanner），上表只列一次。总计不重复 skill = 75。

### 工程 / 团队 / 工具 / 基础设施（11 plugin · 各 1 skill）

| 分类 | plugin |
| --- | --- |
| 工程 | gh-cli · git-cleanup · modern-python（uv/ruff/pytest）· devcontainer-setup · dimensional-analysis（量纲分析找公式 bug）· workflow-skill-design · skill-improver · ask-questions-if-underspecified · let-fate-decide |
| 团队 | culture-index |
| 工具 | claude-in-chrome-troubleshooting |
| 基础设施 | debug-buttercup（Kubernetes 调试） |

## 安装

### Claude Code

```text
/plugin marketplace add trailofbits/skills
/plugin menu
```

### Codex（原生支持 Claude marketplace）

```bash
codex plugin marketplace add trailofbits/skills
codex plugin list
codex plugin add <plugin-name>@trailofbits
```

### 本地开发（父目录下）

```bash
cd /path/to/parent
/plugins marketplace add ./skills
```

## 许可：CC-BY-SA-4.0（copyleft）

> **Attribution-ShareAlike 4.0 International**

- **署名**：必须署名 Trail of Bits（仓库 README 已要求 found using Trail of Bits Skills）
- **同样许可（ShareAlike）**：分发或改编后的作品须以同样 CC-BY-SA-4.0 发布——**copyleft 传染**
- **非 MIT/Apache**：不能闭源商业封装后分发
- **个人/内部使用**：不受影响
- **集成到自有产品并对外发布**：需法务评估

仓库 [Trophy Case](https://github.com/trailofbits/skills#trophy-case) 鼓励对外公开发现的 bug 时提「Found using Trail of Bits Skills」。

## 目录结构

```text
skills/
├── README.md          # 安装 / Codex / 相关仓
├── CLAUDE.md          # skill 编写规范
├── LICENSE            # CC-BY-SA-4.0 全文
├── ruff.toml
└── plugins/
    ├── building-secure-contracts/
    │   └── skills/
    │       ├── audit-prep-assistant/SKILL.md
    │       ├── solana-vulnerability-scanner/SKILL.md
    │       └── …（11 skill）
    ├── testing-handbook-skills/skills/（15 skill）
    ├── trailmark/skills/（10 skill）
    ├── c-review/
    │   ├── skills/c-review/SKILL.md
    │   └── agents/（c-review-worker.md · dedup-judge.md · fp-judge.md）
    └── …（共 40 plugin / 75 SKILL.md）
```

## Trophy Case（公开漏洞）

- `constant-time-analysis` → RustCrypto ML-DSA 签名时序侧信道（[signatures#1144](https://github.com/RustCrypto/signatures/pull/1144)）

## 资源链接

- 仓库：[trailofbits/skills](https://github.com/trailofbits/skills)（CC-BY-SA-4.0）
- Testing Handbook：[appsec.guide](https://appsec.guide)
- Trail of Bits：[trailofbits.com](https://www.trailofbits.com/)
- 相关仓：[claude-code-config](https://github.com/trailofbits/claude-code-config) · [skills-curated](https://github.com/trailofbits/skills-curated) · [claude-code-devcontainer](https://github.com/trailofbits/claude-code-devcontainer) · [dropkit](https://github.com/trailofbits/dropkit)
- 相邻叶：[Vercel Agent Skills](../vercel-agent-skills/) · [Skills CLI 与 find-skills](../skills-cli-find-skills/)
