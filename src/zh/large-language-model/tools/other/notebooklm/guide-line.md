---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 Gemini Notebook（原 NotebookLM）2026 + Google 官方支持文档编写

## 速查

- 答案**只在源里**找——源质量决定一切
- 引用脚标点击 = 跳源原文，**事实必核对**
- Audio Overview 四种形态：Deep Dive / Brief / Critique / Debate
- Audio 长度调节仅英语可用，语言支持 80+
- Interactive Audio mode（英语）可中途打断主持人
- 每笔记本 50 源上限，每源 200MB / 50 万词
- 「Discover sources」让模型自动按主题找网页补充（仍受接地约束）
- 协作：Share → Viewer / Editor
- 与 Gemini Deep Research 组合 = 终极研究工作流
- 不用于训练 Gemini 通用模型

## 多源策略：怎么挑源

源接地意味着**模型看不到源外的世界**，挑源直接决定答案质量。

### 推荐

- **一手资料优先**：论文原文 > 综述 > 博客
- **覆盖完整**：别只放支持某一观点的源，正反都放
- **时间新鲜**：政策 / 行业数据用近 1 年的
- **结构化文本**：Markdown / 文字 PDF 比扫描件 / 截图强

### 避免

- 整本 1000 页 PDF 不切——单源超限
- 自相矛盾的源混在一起——答案会摇摆
- 内容农场 / 营销稿——污染接地
- 仅放标题党标题——正文质量低

::: tip 50 源规划

50 个源足够覆盖一个完整研究主题。建议组合：

- 5–10 篇核心论文
- 3–5 份行业报告
- 5–10 篇权威博客 / 新闻
- 1–3 个相关 YouTube 视频（讲座 / 访谈）
- 余下放补充与对立观点

:::

## Audio Overview 进阶

### 四种形态选哪个

| 形态 | 形式 | 适合 |
| --- | --- | --- |
| **Deep Dive** | 两个主持人轻松对话 | 默认、通勤听、通读资料 |
| **The Brief** | 单口 <2 分钟 | 快速抓要点、会议开场 |
| **The Critique** | 两主持人建设性批评 | 评审草稿、找漏洞 |
| **The Debate** | 两主持人正反辩论 | 决策权衡、看清多面 |

### Custom instructions 调教

可在生成前加 prompt 聚焦：

```
重点讨论第三章的实验设计缺陷，
解释时假设听众是数据科学家，
加入对结论的批判性反思。
```

效果：从泛泛的「资料复读」变成「有观点的深度讨论」。

### Interactive mode（英语）

播放 Audio Overview 时可点击 **Join** 进入交互模式：

- 随时按按钮插话
- 主持人会**基于你的源**回答，再回到主线
- 适合：学习中卡壳想追问、想换个角度解释

## Discover sources：让模型自己找源

NotebookLM 支持「**Discover sources**」——你给一个主题，它自动搜公开网页加进源列表。关键点：

- 找到的仍是**外部网页**，进笔记本后受接地约束
- 适合快速起步，但**权威性需自己把关**（建议人工筛一遍）
- 不能完全替代你精挑的论文 / 报告

## 协作工作流

### 团队研究

1. 一个 Lead 创建笔记本，加 5–10 个核心源
2. Share → 加团队成员为 **Editor**
3. 各人分头加自己负责的源（每人 5–10 个）
4. 统一在中间聊天框提问、对结论
5. Studio 生成 Audio Overview 给全员通勤听

### 教学场景

1. 教师建笔记本，上传课程阅读材料
2. Share 给学生为 **Viewer**（只读）
3. 学生在副本里提问、生成 Mind Map 复习
4. Audio Overview 当「随身复习课」

## 与 Gemini Deep Research 组合

Google Deep Research 是 Gemini 的深度联网研究能力。组合工作流：

```
Gemini Deep Research（联网广撒网）
    ↓ 产出报告 / 引用列表
NotebookLM（接地深加工）
    ↓ 上传报告 + 一手论文
    ↓ 提问、对比、生成 Audio Overview
最终交付（可追溯的研究产物）
```

Deep Research 负责「**找到**」，NotebookLM 负责「**读懂 + 可核对**」。

## 输出形态全景

Studio 面板可生成的形态：

| 输出 | 用途 |
| --- | --- |
| **Audio Overview** | 播客式音频 |
| **Mind Map** | 思维导图 |
| **Briefing Doc** | 一页摘要 |
| **Study Guide** | 学习指南（术语 / 问题 / 答案） |
| **FAQ** | 常见问答 |
| **Timeline** | 时间线（适合历史 / 事件类资料） |
| **Quiz** | 自测题 |

## 引用核对流程

1. 提问得到答案
2. 看答案中每个角标编号
3. 点击角标 → 跳到对应源的高亮段落
4. 阅读原文上下文
5. 若与答案矛盾——说明源不够，补充源再问

这是接地工具的核心价值：**答案不是黑盒，而是可逐句追溯**。

## 常见误区

| 误区 | 真相 |
| --- | --- |
| 「NotebookLM 知识很广」 | 只知你上传的，没上传 = 不会 |
| 「它能联网实时搜」 | 默认不能（除非 Discover sources 自动找） |
| 「Audio Overview 一定客观」 | 仍可能选择性强调某些内容，需听后核对 |
| 「源越多越好」 | 50 个高质量源 > 50 个垃圾源 |
| 「替代 ChatGPT」 | 不行——它是研究工具，不是通用助手 |

## 版本演进

| 节点 | 变化 |
| --- | --- |
| 2023 实验版 | 仅支持 Google Docs |
| 2024 扩展 | 加 PDF / Web / YouTube / 音频；推出 Audio Overview |
| 2024 末 | Audio Overview 爆火出圈 |
| 2025 | Mind Map / 多语言 Audio / Discover sources / 多种 Audio 形态（Brief / Critique / Debate） |
| 2025 末 | 更名 **Gemini Notebook**（旧域名 `notebooklm.google.com` 302 跳转 `notebook.google.com`） |
| 2026 | Interactive Audio mode 扩展、协作增强 |
