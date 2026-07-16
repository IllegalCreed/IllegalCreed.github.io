---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 JuliusBrussee/caveman 主分支（提交 `0d95a81`，2026-07-03）的 README 与 `skills/caveman/SKILL.md` 编写。

## 速查

- **装（一行，30+ agent）**：`curl -fsSL https://raw.githubusercontent.com/JuliusBrussee/caveman/main/install.sh | bash`（Node ≥18）
- **装（Claude Code 插件）**：`claude plugin marketplace add JuliusBrussee/caveman && claude plugin install caveman@caveman`
- **开**：`/caveman` 或说「talk like caveman」；**关**：说「normal mode」（Claude Code/Codex/Gemini 装后即从第一条消息开启）
- **6 档**：`lite` / `full`（默认）/ `ultra` / `wenyan-lite` / `wenyan-full` / `wenyan-ultra`；`/caveman <level>` 切换
- **省**：实测输出 token 均值 65%（22–87%）；代码/命令/错误逐字保留
- **诚实**：只省输出，skill 自身加 ~1–1.5k 输入/轮，整会话可能省得少甚至净负；真价值=可读性/速度
- **零遥测**：装后无 telemetry、无 network 调用

## 安装

一条命令，找到你机器上每个 agent 分别安装（~30 秒，需 Node ≥18，可安全重跑）：

```bash
# macOS / Linux / WSL / Git Bash
curl -fsSL https://raw.githubusercontent.com/JuliusBrussee/caveman/main/install.sh | bash
```

```powershell
# Windows PowerShell 5.1+
irm https://raw.githubusercontent.com/JuliusBrussee/caveman/main/install.ps1 | iex
```

只装某一个 agent（Claude Code 插件为例）：

```bash
claude plugin marketplace add JuliusBrussee/caveman && claude plugin install caveman@caveman
```

也支持 Codex / Gemini / Cursor / Windsurf / Cline / Copilot 等 30+ agent，见 INSTALL.md。

## 开关

- **开**：输入 `/caveman`，或说「talk like caveman」
- **关**：说「normal mode」或「stop caveman」
- 在 **Claude Code / Codex / Gemini** 上，装后靠一个 hook 从**第一条消息**就开启，无需每次 `/caveman`

## 6 个强度档

一句话「你应该把对象包进 useMemo，因为每次渲染都创建新引用」，逐档压缩：

| 档 | 效果 |
| --- | --- |
| *正常 agent* | 完整句子、带冠词、有铺垫 |
| `lite` | 去 filler/hedging，保留冠词 + 完整句，专业但紧 |
| `full`（默认） | 删冠词、片段 OK、短同义词，经典 caveman |
| `ultra` | 有把握时省连词，一个词够就一个词 |
| `wenyan-full` | 全文言文，80–90% 字符缩减 |

`/caveman <level>` 切换，档位保持到你改或会话结束。

## before / after

```text
❌ 正常 agent（69 token）
你的 React 组件重渲染，很可能是因为你每次渲染都创建了一个新的对象
引用。当你把内联对象作为 prop 传入，React 的浅比较每次都视为不同
对象，触发重渲染。建议用 useMemo 记忆这个对象。

✅ caveman（19 token）
New object ref each render. Inline object prop = new ref = re-render.
Wrap in `useMemo`.
```

同一个修复，三分之一的词，技术一点没丢——它缩小 agent 的**嘴**，不缩小**脑**。

## 保留你的语言

Caveman 保留你的对话语言：写葡萄牙语就用葡语 caveman、西语法语同理。它压缩**风格**，从不翻译语言。`wenyan`（文言文）是刻意的例外——古文每 token 载义最多，是极限压缩。

## 下一步

- [指南](./guide-line) —— 核心规则、tokenizer 洞察（为何禁自造缩写）、wenyan、Auto-Clarity、诚实数字
- [参考](./reference) —— 7 技能全表、6 档对照、基准、跨 agent 安装、隐私
