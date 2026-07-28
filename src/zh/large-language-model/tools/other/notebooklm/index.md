---
layout: doc
---

# NotebookLM

**Google 推出的 AI 笔记与研究助手**（现已更名为 Gemini Notebook），基于 **Gemini** 模型构建。核心机制是**源接地（source grounding）**——你上传一组资料（PDF / 网页 / YouTube / 音频 / Google Docs / Slides），模型仅基于这些资料回答你的提问，并给出可点击的**引用**（citation）跳到原文，从而把幻觉降到极低。

它不是「通用聊天机器人」的替代品，而是一个「**个性化、对你的资料了如指掌的研究搭子**」。标志性功能是 **Audio Overview**——一键把资料生成「**Deep Dive**」式播客（两个 AI 主持人对话讲解），还有 **Mind Map**（思维导图）、**Brief / Critique / Debate** 等多种生成形态。

## 评价

**优点**

- **源接地降低幻觉**：答案只从上传源里找，每个论断都带引用，可一键核对
- **多源混合**：单笔记本最多 50 个源，支持 PDF / 网页 / YouTube / 音频 / Google Docs / Slides / 粘贴文本
- **Audio Overview 出圈**：Deep Dive 播客效果好到被广泛传播，支持 80+ 语言
- **多种输出形态**：FAQ / 学习指南 / 时间线 / 思维导图 / 播客 / 辩论 / 评审
- **免费可用**：Google 账号直接登录，Free tier 已能覆盖多数研究场景
- **隐私可控**：上传内容不用于训练 Gemini 通用模型
- **支持协作**：笔记本可共享给团队一起研究

**缺点**

- 仅基于上传源——源里没有的信息，模型不会用通用知识补
- 单源上限 200MB / 50 万词，长资料需先切分
- 大陆访问需自备网络
- 不支持代码执行、不能联网实时搜索（除非用「Discover sources」自动找网页）
- 输出受源质量影响——垃圾源 = 垃圾答案
- 主要面向研究 / 学习场景，不适合创意写作 / 代码生成

## 文档地址

[support.google.com/gemininotebook](https://support.google.com/gemininotebook/)

## GitHub地址

NotebookLM 是闭源 SaaS 产品，无公开代码仓库。官方入口：[notebooklm.google](https://notebooklm.google/)（旧域名 `notebooklm.google.com` 仍 302 跳转）。

## 幻灯片地址

<a href="/SlideStack/notebooklm-slide/" target="_blank">NotebookLM</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=notebooklm" target="_blank" rel="noopener noreferrer">NotebookLM 测试题</a>
