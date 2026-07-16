---
layout: doc
---

# Caveman

Caveman（"why use many token when few token do trick"）是 Julius Brussee 开源的一个 Claude Code 技能/插件——让 AI 编码 agent **说话像穴居人**：删掉冠词、填充词、寒暄、模糊语，用极简片段回答，同时**代码、命令、错误逐字节保留**。实测**输出 token 减少约 65%**，技术准确度 100%。它有 6 个强度档（lite / full / ultra + 三档 **wenyan 文言文**），并保留你的对话语言。作者对省钱有难得的**诚实态度**：它只压缩输出 token，真正的赢面是**可读性与速度**，省钱是 bonus。

## 评价

**优点**

- **省输出 token**：实测均值 65%（范围 22–87%），基准可复现（`benchmarks/`）
- **技术零损失**：只删废话（filler/hedging/寒暄），代码/命令/错误/API 名逐字保留
- **wenyan 文言文档**：`wenyan` 系列用古文，每 token 载义最多、80–90% 字符缩减——对中文用户是彩蛋
- **保留你的语言**：写葡萄牙语就用葡语 caveman，压缩风格不翻译语言（wenyan 是刻意例外）
- **Auto-Clarity 安全**：安全警告、不可逆确认、多步歧义时自动退出 caveman，清晰后恢复
- **7 个配套技能**：`/caveman-compress` 改写 CLAUDE.md 省 ~46% 输入 token（永久）、`/caveman-stats` 看省了多少、`/caveman-review` 一行 PR 评论、cavecrew 子代理
- **零遥测零 network**：装后无 telemetry、无 analytics、无 backend、零网络调用
- **30+ agent**：Claude Code / Codex / Gemini / Cursor / Windsurf / Cline / Copilot 等

**缺点 / 诚实数字**

- **只省输出，不省输入/推理**：且 skill 自身每轮加 ~1–1.5k 输入 token，**整会话省得比 65% 少**，在已简洁的工作负载上甚至**可能净负**
- **真正价值是可读性与速度，省钱是 bonus**：别只冲着省钱来（作者自己的 `HONEST-NUMBERS.md` 明确讲）
- **极简可能牺牲细节**：ultra 档过度压缩时，多步序列可能因省略连词而歧义（靠 Auto-Clarity 兜底）
- **风格偏好**：穴居人语气不是所有人都喜欢；代码/commit/PR 仍写正常

## 适用场景

- 想让 agent 回答更**紧凑、快读**——尤其长会话里读得累、想少些废话
- 想省输出 token（长期、大量交互时更明显）
- 中文用户想试 `wenyan` 文言文极限压缩（好玩且真省字符）
- 想用 `/caveman-compress` 把 CLAUDE.md 改写成永久更省输入的版本

## 边界

- **它缩小 agent「嘴」，不缩小「脑」**：压缩的是**说什么**，不是**知道什么**——技术实质全留
- **不是全自动省钱魔法**：诚实看待——只省输出，整会话可能净负；价值在可读性/速度
- **代码/命令/错误逐字保留**：绝不动它们，只压缩散文
- **与全 agent 压缩不同**：`caveman-code`（另一个仓库）压缩整个 agent；本叶只压缩「输出风格」

## 官方文档

[诚实数字 HONEST-NUMBERS](https://github.com/JuliusBrussee/caveman/blob/main/docs/HONEST-NUMBERS.md) ｜ [安装矩阵 INSTALL](https://github.com/JuliusBrussee/caveman/blob/main/INSTALL.md) ｜ [基准 benchmarks](https://github.com/JuliusBrussee/caveman/tree/main/benchmarks)

## GitHub 地址

[JuliusBrussee/caveman](https://github.com/JuliusBrussee/caveman)（MIT）

## 内容地图

- [入门](./getting-started) —— 一行安装、`/caveman` 开关、6 个强度档、before/after
- [指南](./guide-line) —— 核心规则、tokenizer 洞察、wenyan 文言文、Auto-Clarity、诚实数字
- [参考](./reference) —— 7 技能全表、6 档对照、基准数据、跨 agent 安装、隐私

## 幻灯片地址

<a href="/SlideStack/caveman-slide/" target="_blank">Caveman</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=594" target="_blank" rel="noopener noreferrer">Caveman 测试题</a>
