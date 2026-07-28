---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Gemini Notebook（原 NotebookLM）2026 + Google 官方支持文档编写

## 速查

- 入口：[notebooklm.google](https://notebooklm.google/)，Google 账号登录即用
- 底层模型：**Gemini** 系列
- 核心机制：**源接地（source grounding）**——答案只从你上传的源里找
- 单笔记本上限：**50 个源**
- 单源上限：约 **200MB / 50 万词**
- 支持源：Google Docs / Google Slides / PDF / Text / Markdown / 粘贴文本 / **Web URL** / **YouTube URL** / 音频（MP3、WAV 等）
- 标志输出：**Audio Overview**（Deep Dive 播客）/ Mind Map（思维导图）/ FAQ / 学习指南 / 时间线 / Briefing Doc
- 隐私：上传内容**不用于训练** Gemini 通用模型

## 第一次使用

1. 打开 [notebooklm.google](https://notebooklm.google/) → 用 Google 账号登录
2. 点 **Create new notebook**
3. 左侧 **Sources** 面板点 **Add**，上传你的第一份资料
4. 等待处理（几秒到几十秒，看资料大小）
5. 中间聊天框提问，或在右侧 **Studio** 面板生成 Audio Overview / Mind Map

## 支持的源类型

| 源类型 | 例子 | 备注 |
| --- | --- | --- |
| Google Docs | `docs.google.com` 文档 | 自动同步内容 |
| Google Slides | `slides.google.com` 幻灯片 | 含图表文字 |
| PDF | 论文 / 电子书 / 报告 | 文字层 PDF 最佳，扫描件需先 OCR |
| Text / Markdown | `.txt` `.md` | 程序员友好 |
| 粘贴文本 | 直接贴一段文字 | 适合临时片段 |
| Web URL | 任意公开网页 | 自动抓正文 |
| YouTube URL | 公开视频 | 提取字幕 + 音频 |
| 音频文件 | `.mp3` `.wav` 等 | 自动转写 |

## 单源与单笔记本限制

| 维度 | 上限 |
| --- | --- |
| 单笔记本源数 | **50** |
| 单源大小 | ~200 MB |
| 单源字数 | ~500,000 词 |
| 每天聊天次数 | Free/Pro tier 各异（约 50–5000 chats/day） |

::: tip 长资料处理

超过 50 万词的书 / 大型代码仓库，先按章节切成多个源分批上传；或先用 Gemini / ChatGPT 总结成大纲后再喂。

:::

## 提问与引用

提问示例：

> 这三篇论文在「注意力机制」上的核心分歧是什么？

回答里每个论断后都跟一个数字角标，点击会**高亮跳到对应源的原句**。这是 NotebookLM 最有别于通用聊天机器人的地方——答案可追溯、可核对。

::: warning 不会用通用知识补

如果你问的资料**没提**，NotebookLM 会直接说「这些源里没有相关信息」，而**不会**像 ChatGPT 那样用训练知识硬答。这是 grounding 的代价，也是它的可靠性来源。

:::

## 生成 Audio Overview（Deep Dive 播客）

1. 进入一个含源的笔记本
2. 右侧 **Studio** → 选 **Audio Overview**
3. 选格式：**Deep Dive**（默认）/ **The Brief**（单口 <2min）/ **The Critique**（评审）/ **The Debate**（辩论）
4. 可选**输出长度**（shorter / default / longer，目前仅英语支持长度调节）
5. 选**语言**（80+ 语言可选）
6. 可加 **Custom instructions** 聚焦特定主题
7. 点生成——后台跑（可关页面，完成后通知）

生成后可：

- 在线播放，**同步看引用**
- 下载音频
- 链接分享（需设访问权限）
- **Interactive mode**（英语）：随时打断主持人，让他们换个角度解释

## Mind Map 思维导图

Studio → **Mind Map**，自动生成你资料的可视化思维导图，节点点击可展开提问。适合：

- 快速摸清一份陌生论文 / 报告的结构
- 备课 / 复习时梳理知识脉络
- 把碎片资料串成体系

## 协作与共享

笔记本可共享：

- 顶部 **Share** → 设 Viewer / Editor 权限
- 团队场景：多人共同往一个笔记本加源、提问、生成 Audio Overview
- Audio 文件可单独链接分享（需在 Studio 里设置可访问性）

## 与 ChatGPT 的根本差异

| 维度 | NotebookLM | ChatGPT |
| --- | --- | --- |
| **知识来源** | 仅你上传的源 | 训练数据 + 联网搜索 |
| **引用** | 每句带可点击引用 | 一般无引用 |
| **幻觉风险** | 低（被源约束） | 较高 |
| **典型场景** | 文献综述 / 论文阅读 / 学习 | 创意写作 / 代码 / 通用问答 |
| **工作流** | **源优先**（先上传再问） | **提示优先**（直接问） |

一句话：**需要可追溯、可核对的研究用 NotebookLM；需要广覆盖、强生成的日常任务用 ChatGPT**。

## 大陆访问

- `notebooklm.google.com` 在大陆默认不可达，需自备网络代理
- 上传的源、Audio 文件都存 Google 服务器
- 无官方中国区版本

## 下一步

- [指南](./guide-line) —— 多源策略 / Audio Overview 进阶 / 协作流程 / 与 Gemini Deep Research 组合
- [参考](./reference) —— 源类型全表 / 限制 / 输出形态对比 / 常见问题
