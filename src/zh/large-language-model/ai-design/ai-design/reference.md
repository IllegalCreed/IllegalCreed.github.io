---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Google Stitch 官方博客（blog.google / developers.googleblog.com）与 Anthropic Claude Design / Artifacts 官方文档（anthropic.com/news、support.claude.com）编写，对照 2026-04-17 Claude Design Research Preview 与 Stitch 当前 Labs 行为

## 速查

- **两强**：Stitch（Google Labs，2025-05-20，Gemini 2.5 Pro）+ Claude Design（Anthropic Labs Preview，2026-04-17，Opus 4.7）
- **产物边界**：UI 设计稿 + HTML/CSS + DESIGN.md；**不出**后端 / DB / auth / 部署
- **Stitch 五大组件**：infinite canvas / Design Agent / Agent Manager / Voice / DESIGN.md
- **Stitch 开发者出口**：MCP Server / SDK（GitHub ~2.4k stars）/ Skills / 导出到 AI Studio / Antigravity / Jules / Lovable / Dyad / Cursor
- **Claude Design 关键**：brand-aware 设计系统、多格式导入（含 web capture）、三档协作、Handoff Bundle
- **Claude Design 导出**：Internal URL / Folder / Canva（直连）/ PDF / PPTX / Standalone HTML（**无 Figma**）
- **Artifacts 六类**：Documents / Code snippets / 单页 HTML / SVG / Diagrams / Interactive React
- **Artifacts 持久化**：20MB/artifact、text-only、personal / shared
- **Artifacts 触发阈值**：significant + self-contained + typically over 15 行
- **判定边界**：是否需要后端 / DB / 部署？需要 = 应用生成器
- **串行工作流**：Stitch → AI Studio → Firebase Studio
- 完整说明见 [入门](./getting-started.md) / [Stitch 与 Claude Design 深度](./guide-line.md)

## Stitch 能力清单

### 输入（画布上下文）

| 输入 | 说明 |
| --- | --- |
| **自然语言 prompt** | 一句话描述产品想法 / 风格 / 受众 |
| **图片 / 草图 wireframe** | 手绘草图、低保真 wireframe、参考图 |
| **截图** | 现有产品 / 竞品截图 |
| **URL** | 从任意在线 URL 抽取设计系统（colors / typography / spacing） |
| **DESIGN.md** | 设计规则文件，跨工具双向导入导出 |
| **代码片段** | 现有组件 / 样式代码作为视觉约束 |

### 输出

| 输出 | 说明 |
| --- | --- |
| **高保真 UI 设计稿** | 画布内直接渲染 |
| **前端代码** | HTML / CSS，可 .zip 整包导出 |
| **DESIGN.md** | 设计规则文件 |
| **「Paste to Figma」** | 粘贴到 Figma 继续协作 |
| **可点击原型（Play）** | 多屏拼流程 + 自动生成 logical next screens |

### AI-native 五大组件

| 组件 | 作用 |
| --- | --- |
| **infinite canvas** | 多变体平铺对比 |
| **Design Agent** | 跨项目演进推理 |
| **Agent Manager** | 并行管理多个 idea / agent |
| **Voice** | 语音实时 critique 与访谈 |
| **DESIGN.md** | 跨工具真相源 |

### 开发者集成

| 出口 | 说明 |
| --- | --- |
| **MCP Server** | 接入 MCP-aware 客户端（Claude / Cursor） |
| **SDK** | [google/stitch-sdk](https://github.com/google/stitch-sdk)，~2.4k stars |
| **Skills（stitch-skills）** | 可复用设计技能包 |
| **导出到** | AI Studio / Antigravity / Jules / Lovable / Dyad / Cursor / Gemini |

## Claude Design 能力清单

### 核心能力

| 能力 | 说明 |
| --- | --- |
| **Brand-aware 设计系统** | onboarding 读代码库 + 设计文件，自动应用 colors / typography / components，每团队可多套 |
| **多格式导入** | text / images / DOCX / PPTX / XLSX / codebase references / web capture tool |
| **精修控件** | inline comments / direct text editing / custom adjustment sliders（跨全设计传播改动） |
| **三档协作（org-scoped）** | private / view-only link / edit access |
| **代码驱动原型** | voice / video / shaders / 3D / 内置 AI 的 frontier prototypes |
| **Handoff Bundle** | 一条指令把设计 + 意图传给 Claude Code |

### 导出清单

| 目标 | 类型 |
| --- | --- |
| **Internal URL** | 团队内部链接 |
| **Folder** | 文件夹导出 |
| **Canva** | **直连 Canva**（官方深度集成） |
| **PDF** | 文档归档 |
| **PPTX** | 演示文稿 |
| **Standalone HTML** | 单页 HTML（含交互） |

> **官方公告导出清单无 Figma**——把 Figma 当交付目标会落空。

### 版本与可用性

| 项 | 取值 |
| --- | --- |
| **阶段** | Anthropic Labs **Research Preview** |
| **发布日** | 2026-04-17 |
| **底层模型** | Claude Opus 4.7（官方称最 capably vision 模型） |
| **可用范围** | Pro / Max / Team / Enterprise |
| **Enterprise** | **默认 off**，admin 必须显式 enable |
| **用量** | 计入既有订阅额度（extra usage toggle 才超限） |

## Claude Artifacts 能力清单

### 六类产物

| 类型 | 说明 |
| --- | --- |
| **Documents** | Markdown / 纯文本 |
| **Code snippets** | 代码段 |
| **单页 HTML 网站** | self-contained 单页 |
| **SVG** | 矢量图 |
| **Diagrams / flowcharts** | 流程图 / 架构图 |
| **Interactive React components** | 交互式 React 组件 |

**触发条件**：内容「significant、self-contained、typically over 15 lines」。

### 面板能力

| 能力 | 作用 |
| --- | --- |
| **dedicated window** | 独立窗口渲染 |
| **Version selector** | 版本切换 |
| **Code view** | 看底层代码 |
| **Copy / Download** | 复制 / 下载 |
| **Edit with Claude** | Markdown 原地编辑 |
| **Multi-file editing** | 多文件批量批注 |
| **Try fixing with Claude** | 错误修复 |

### 高级能力

| 能力 | 说明 |
| --- | --- |
| **Publish / Share** | 公开发布或组织内分享 |
| **Fork** | 复制他人 artifact 代码再创作 |
| **AI-powered artifacts** | 嵌入 Claude API，访客用自己 Claude 账号登录 |
| **Persistent storage** | personal / shared，**20MB/artifact、text-only** |
| **MCP 集成** | 与 MCP-aware 客户端联动 |

> 20MB/artifact 且 text-only——存图片 / 二进制或塞超 20MB 会失败；unpublish 会永久删全部存储数据。

## 两强对比速查

| 维度 | Stitch | Claude Design |
| --- | --- | --- |
| **厂商** | Google Labs | Anthropic Labs |
| **发布** | 2025-05-20 I/O | 2026-04-17 |
| **底层模型** | Gemini 2.5 Pro | Claude Opus 4.7 |
| **阶段** | Labs 实验 | Research Preview |
| **定位侧重** | 从零生成多变体 | 既有品牌体系内精修 |
| **画布** | infinite canvas | 组织级协作空间 |
| **设计系统** | DESIGN.md 跨工具 | brand-aware，多套 |
| **URL 摄取** | 抽设计系统 | web capture 抓元素 |
| **导出 Figma** | 「Paste to Figma」 | **无** |
| **导出 Canva** | 无 | **直连** |
| **代码原型** | HTML/CSS | voice / video / shaders / 3D / AI |
| **可用范围** | 公网访问 | Pro / Max / Team / Enterprise（Enterprise 默认 off） |
| **开发者出口** | MCP / SDK / Skills | Handoff Bundle → Claude Code |

## AI 设计 vs AI 应用生成器

| 类别 | 代表 | 产物 | 后端 | 部署 |
| --- | --- | --- | --- | --- |
| **AI 设计工具** | Stitch / Claude Design / Artifacts | UI 设计稿 + HTML/CSS + DESIGN.md | 否 | 仅 preview |
| **AI 应用生成器** | Firebase Studio / AI Studio App Builder / Lovable / Dyad / v0 / bolt.new / Cursor | 可运行 app | **是** | 可 deploy |

**判定准则**：产物是否「需要后端 / 数据库 / 部署」？

> 把 v0 / bolt.new / Lovable / Dyad 归入「AI 设计工具」是常见误区——它们输出可运行 app（含逻辑 / 状态 / 可能后端调用），定位是应用生成器。

## Google 官方串行工作流

```
Stitch（UX 探索）→ AI Studio（app 原型 preview / deploy）→ Firebase Studio（生产代码）
```

- **Stitch**：UX 探索 / 设计变体 / 交互原型验证
- **AI Studio（Build mode / App Builder）**：app 原型，可 preview 与 deploy 到稳定 URL
- **Firebase Studio**：生产代码、后端、auth、DB

> 三者可分别独立起点，不是替代关系而是接力。

## 最佳实践清单

| # | 实践 | 理由 |
| --- | --- | --- |
| 1 | 早期 UX 探索用 Stitch 出多变体 | 分钟级供 stakeholder 反应，做精确稿回 Figma |
| 2 | 多屏拼 Play 验证用户旅程 | 单屏漂亮 ≠ 流程通，Play + 自动 next screens 暴露交互断点 |
| 3 | Claude Design 接入既有代码库建立 brand-aware 设计系统 | 自动套现有 colors / typography / components，避免视觉漂移 |
| 4 | 设计→开发走 Handoff Bundle 传给 Claude Code | 设计 + 意图打包，减少 dev 二次解读偏差 |
| 5 | 跨工具保持设计系统一致用 DESIGN.md | Stitch / Lovable / Dyad / Cursor / AI Studio 双向流动 |
| 6 | 进设计协作流走 Paste to Figma | Figma 仍是设计系统真相源 |
| 7 | 非技术评审走 Artifacts Publish + 分享链接 | 独立窗口渲染、可 fork、零部署 |
| 8 | 区分 preview vs deploy | 生产部署走 AI Studio / Firebase Studio |

## 反模式清单

- 把 Stitch 当 Figma 替代品做像素级精确稿
- 混淆 Stitch 与 Firebase Studio / AI Studio App Builder
- 期望 Claude Design 导出 Figma
- 把 Claude Design 等同于 Artifacts
- 直接拿 Stitch / Claude Design 导出的 HTML 上生产
- Enterprise 默认开启就推给全员用（实际默认 off）
- 对 Artifacts persistent storage 存图片 / 二进制或塞超 20MB
- 把 v0 / bolt.new / Lovable / Dyad 归入「AI 设计工具」
- 混淆 preview 与 deploy

## 官方资源

- Stitch 官网：[https://stitch.withgoogle.com/](https://stitch.withgoogle.com/)
- Stitch I/O 2025 公告：[https://developers.googleblog.com/stitch-a-new-way-to-design-uis/](https://developers.googleblog.com/stitch-a-new-way-to-design-uis/)
- Stitch vibe design 公告：[https://blog.google/innovation-and-ai/models-and-research/google-labs/stitch-ai-ui-design/](https://blog.google/innovation-and-ai/models-and-research/google-labs/stitch-ai-ui-design/)
- Stitch SDK GitHub：[https://github.com/google/stitch-sdk](https://github.com/google/stitch-sdk)
- Claude Design 公告：[https://www.anthropic.com/news/claude-design-anthropic-labs](https://www.anthropic.com/news/claude-design-anthropic-labs)
- Claude Artifacts 文档：[https://support.claude.com/en/articles/9487310-what-are-artifacts-and-how-do-i-use-them](https://support.claude.com/en/articles/9487310-what-are-artifacts-and-how-do-i-use-them)
