---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Gemini Notebook（原 NotebookLM）2026 + Google 官方支持文档编写。入口：[notebooklm.google](https://notebooklm.google/)，帮助中心：[support.google.com/gemininotebook](https://support.google.com/gemininotebook/)。本页**重点列源类型、限制、输出形态与对比**。

## 关键事实速查

| 项目 | 值 |
| --- | --- |
| 厂商 | Google |
| 底层模型 | Gemini 系列 |
| 别名 | NotebookLM → **Gemini Notebook**（2025 末更名） |
| 入口 | [notebooklm.google](https://notebooklm.google/) |
| 单笔记本源上限 | **50** |
| 单源大小上限 | ~200 MB |
| 单源字数上限 | ~500,000 词 |
| 数据用于训练 Gemini 通用模型 | 否 |
| Audio Overview 语言 | 80+ |
| Audio Overview 长度调节 | 仅英语可用 |

## 源类型全表

| 源类型 | 接受形式 | 备注 |
| --- | --- | --- |
| Google Docs | 云端文档 | 自动同步 |
| Google Slides | 云端幻灯 | 提取文字 + 图表标注 |
| PDF | `.pdf` | 文字层最佳；扫描件需先 OCR |
| Text | `.txt` | 纯文本 |
| Markdown | `.md` | 程序员友好 |
| 粘贴文本 | 浏览器输入框 | 临时片段 |
| Web URL | 公开网页链接 | 自动抓正文 |
| YouTube URL | 公开视频链接 | 提取字幕 + 音频 |
| 音频文件 | `.mp3` `.wav` 等 | 自动转写 |

## Studio 输出形态对比

| 输出 | 形式 | 适合场景 |
| --- | --- | --- |
| **Audio Overview — Deep Dive** | 双主持人对话播客 | 通读资料 / 通勤学习 |
| **Audio Overview — The Brief** | 单口 < 2 分钟 | 抓要点 / 开场 |
| **Audio Overview — The Critique** | 双主持人建设性批评 | 草稿评审 / 找漏洞 |
| **Audio Overview — The Debate** | 双主持人正反辩论 | 决策权衡 |
| **Mind Map** | 可视化思维导图 | 梳理结构 / 复习 |
| **Briefing Doc** | 一页摘要 | 快速汇报 |
| **Study Guide** | 术语 + 问题 + 答案 | 备考 |
| **FAQ** | 问答对 | 知识库初稿 |
| **Timeline** | 时间线 | 历史 / 事件 |
| **Quiz** | 自测题 | 自我检测 |

## Audio Overview 关键能力

| 能力 | 说明 |
| --- | --- |
| 格式 | Deep Dive / Brief / Critique / Debate |
| 语言 | 80+ 种 |
| 长度调节 | shorter / default / longer（**仅英语**） |
| Custom instructions | 用 prompt 聚焦主题 / 调专家级别 |
| Interactive mode | 中途插话，主持人基于源回答（**英语**） |
| 后台生成 | 可关页面，完成通知 |
| 下载 / 分享 | 音频可下载、可链接分享（需设权限） |

## 共享 / 协作

| 角色 | 权限 |
| --- | --- |
| Owner | 创建笔记本、管理源、设权限 |
| Editor | 加 / 删源、提问、生成输出 |
| Viewer | 只读、可在自己副本里提问 |

## vs ChatGPT（OpenAI）

| 维度 | NotebookLM | ChatGPT |
| --- | --- | --- |
| 知识来源 | 仅上传的源 | 训练数据 + 联网搜索 |
| 引用 | 每论断带可点击引用 | 一般无 |
| 幻觉风险 | 低（被源约束） | 较高 |
| 工作流 | 源优先 | 提示优先 |
| Audio Overview | 原生播客式生成 | 无对等能力 |
| 创意写作 | 弱 | 强 |
| 代码生成 | 不擅长 | 强 |
| 实时联网 | 默认不能（Discover sources 自动找网） | 可联网 |
| 价格 | Free tier 够用 | Free / Plus $20 |

## vs Gemini Deep Research

| 维度 | NotebookLM | Gemini Deep Research |
| --- | --- | --- |
| 定位 | 接地深加工（基于已知源） | 联网广撒网（自动找源） |
| 源 | 用户主动上传 | 模型自动联网找 |
| 引用 | 强（每句跳原文） | 中（给链接列表） |
| 适合 | 读懂、对比、可核对 | 探索、找资料 |
| 组合 | 接收 Deep Research 产出做深加工 | 上游供给 |

## vs Claude Projects / ChatGPT GPTs（自定义知识库类）

| 维度 | NotebookLM | Claude Projects / GPTs |
| --- | --- | --- |
| 知识约束 | 强接地（默认只用源） | 弱（模型仍可用通用知识补） |
| 引用 | 强 | 弱 / 无 |
| 输出形态 | Audio / Mind Map 等多形态 | 主要对话 |
| 适合 | 学术 / 法律 / 合规研究 | 一般助手 + 知识库 |

## 常见问题排查

| 现象 | 排查 |
| --- | --- |
| 答案说「源里没有」 | 该信息未上传——补源，或换问法 |
| 答案引用错位 | 源质量低 / 扫描件 OCR 差——换清晰文字版 |
| Audio Overview 卡住不动 | 后台排队，等通知；或刷新 Studio 面板 |
| Audio 语言选不到中文 | 确认源主要是中文；语言由源主导 |
| 单源超限报错 | 切分大 PDF / 拆分长文 |
| 上传 YouTube 失败 | 视频需公开可访问；私有 / 受限不可用 |
| 大陆打不开 | 自备网络代理 |
| 引用跳转后看不到高亮 | 源是扫描件——换文字层 PDF |

## 隐私

- 上传源、对话、生成的 Audio **不用于训练** Gemini 通用模型
- 数据存于 Google 服务器
- 共享笔记本时数据对协作者可见
- 企业 / 教育版有更细的管控（管理员后台）

## 资源链接

- 入口：[notebooklm.google](https://notebooklm.google/)
- 帮助中心：[support.google.com/gemininotebook](https://support.google.com/gemininotebook/)
- 添加 / 发现源：[support.google.com/gemininotebook/answer/16215270](https://support.google.com/gemininotebook/answer/16215270)
- Audio Overview 说明：[support.google.com/gemininotebook/answer/16212820](https://support.google.com/gemininotebook/answer/16212820)
- Google 官方博客：[blog.google/technology/ai/notebooklm-google-ai/](https://blog.google/technology/ai/notebooklm-google-ai/)
