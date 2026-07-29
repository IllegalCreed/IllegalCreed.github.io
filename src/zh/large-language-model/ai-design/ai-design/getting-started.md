---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Google Stitch 官方博客（blog.google / developers.googleblog.com）与 Anthropic Claude Design / Artifacts 官方文档（anthropic.com/news、support.claude.com）编写，对照 2026-04-17 Claude Design Research Preview 与 Stitch 当前 Labs 行为

## 速查

- **本主题两强**：Google Stitch（Labs 实验，2025-05-20 I/O 发布，基于 Gemini 2.5 Pro）+ Anthropic Claude Design（Labs Research Preview，2026-04-17，基于 Claude Opus 4.7）
- **产物边界**：UI 设计稿 + HTML/CSS 前端代码 + DESIGN.md；**不出**后端 / DB / auth / 部署
- **Stitch 核心输入**：自然语言 prompt / 图片 / 草图 wireframe / 截图 / URL（抽设计系统）/ DESIGN.md / 代码片段
- **Stitch 核心输出**：高保真 UI 设计稿 + HTML/CSS + 「Paste to Figma」+ DESIGN.md + .zip HTML 导出
- **Stitch 五大新组件**：infinite canvas（无限画布）/ Design Agent / Agent Manager / Voice（vibe design）/ DESIGN.md
- **Stitch + Play**：多屏拼可点击原型 + 自动生成 logical next screens，验证用户旅程
- **Stitch 开发者出口**：MCP Server、SDK（GitHub ~2.4k stars）、Skills、导出到 AI Studio / Antigravity / Jules / Lovable / Dyad / Cursor
- **Claude Design 关键能力**：brand-aware 设计系统（onboarding 读代码库 + 设计文件）、多格式导入（text / images / DOCX / PPTX / XLSX / codebase / web capture）、Handoff Bundle → Claude Code
- **Claude Design 导出**：Internal URL / Folder / Canva（直连）/ PDF / PPTX / Standalone HTML；**官方未提 Figma 导出**
- **Claude Design 三档协作**：private / view-only link / edit access
- **Claude Design 可用性**：Pro / Max / Team / Enterprise（**Enterprise 默认 off，admin 必须显式 enable**）；用量计入订阅额度
- **Claude Artifacts 六类产物**：Documents / Code snippets / 单页 HTML 网站 / SVG / Diagrams & flowcharts / Interactive React components；触发阈值 ~15 行 + self-contained
- **Artifacts 持久化限制**：20MB/artifact、text-only、unpublish 永久删全部存储数据
- **边界判定**：是否需要后端 / DB / 部署？需要 = 应用生成器（Firebase Studio / AI Studio App Builder / Lovable / Dyad / v0 / bolt.new），不需要 = AI 设计工具
- **串行工作流**：Stitch（UX 探索）→ AI Studio（app 原型 preview / deploy）→ Firebase Studio（生产代码）

## AI 设计工具是什么

「AI 设计工具」是一类**以生成式 AI 为核心、产物是 UI 设计稿 / 原型 / 前端代码**的工具集合，定位在「设计探索 + design→dev 交接」这一段，**不产出可交付的运行时应用**。它的三个核心特征：

- **输入多模态**：自然语言 prompt、图片 / 草图 wireframe、截图、URL、DESIGN.md、代码片段、文档文件
- **产物是设计资产**：UI 设计稿、HTML/CSS 前端代码、DESIGN.md、可点击原型
- **定位上游 ideation**：是 Figma / 真实工程的上游，不是替代品

> AI 设计工具 ≠ AI 应用生成器。产物是否「需要后端 / 数据库 / 部署」是最快的判定准则。

## 当前官方两强

### Google Stitch

Google Labs 实验产品，2025-05-20 Google I/O 2025 发布，基于 **Gemini 2.5 Pro 多模态**。访问 [stitch.withgoogle.com](https://stitch.withgoogle.com/)。官方定位是「fastest way to explore multiple paths」——分钟级出多变体供 stakeholder 反应，做精确稿该回 Figma。已演化为「AI-native 软件设计画布」（官方称 vibe design）阶段。

### Anthropic Claude Design

Anthropic Labs 产品，2026-04-17 发布 Research Preview，基于 **Claude Opus 4.7**（官方称最 capably vision 模型）。面向 **Pro / Max / Team / Enterprise** 订阅用户，**Enterprise 默认 off，admin 必须显式 enable**，用量计入既有订阅额度（extra usage toggle 才超限）。

> 同源的 Claude Artifacts 已 GA，是更通用的产物面板，但本主题把它视为 Claude Design 的「轻量同源」，与 Claude Design 区分（Design 有 brand-aware 设计系统、codebase 摄取、web capture、三档协作、handoff bundle、org admin 控制；Artifacts 是单 artifact 生成模型，无团队级设计系统持久化）。

## Stitch 输入与输出

**输入（画布上下文）**

- **自然语言 prompt**：一句话描述意图（产品想法 / 风格 / 受众）
- **图片 / 草图 wireframe**：手绘草图、低保真 wireframe、参考图
- **截图**：现有产品 / 竞品截图，作为视觉参考
- **URL**：从任意在线 URL **抽取设计系统**（colors / typography / spacing）
- **DESIGN.md**：设计规则文件，跨工具（Lovable / Dyad / Cursor / AI Studio）双向导入导出
- **代码片段**：现有组件 / 样式代码

**输出**

- **高保真 UI 设计稿**：直接在画布渲染
- **前端代码**：HTML / CSS（可 .zip 整包导出）
- **DESIGN.md**：自动生成的设计规则文件
- **「Paste to Figma」**：把 Stitch 设计稿粘贴到 Figma 继续协作

> Stitch 多模态输入的关键不在「能输入什么」而在「这些输入共享同一画布上下文」——prompt + 草图 + URL + DESIGN.md 可以一起作为约束。

## Stitch 五大 AI-native 组件

| 组件 | 作用 |
| --- | --- |
| **infinite canvas（无限画布）** | 把多变体平铺到一张无限画布横向对比 |
| **Design Agent** | 跨项目演进推理，自动迭代设计 |
| **Agent Manager** | 并行管理多个 idea / agent，避免单线串行 |
| **Voice（vibe design with your voice）** | 语音实时 critique 与访谈，像跟设计师 pair |
| **DESIGN.md** | 设计规则文件，跨工具流动的真相源 |

> 这五个组件让 Stitch 从「prompt→稿」演进为「AI-native 软件设计画布」，区别于传统的单输入单输出。

## Stitch + Play 交互原型

把多个屏幕「Stitch」成可点击流程，点 **Play** 预览，可自动生成 **logical next screens**，映射用户旅程。

- 单屏漂亮 ≠ 流程通——Play + 自动 next screens 能在写代码前暴露交互断点
- 适合产品发现 / UX 探索阶段验证假设

> Play 是 Stitch 把「静态稿」变成「可验证流程」的关键——单看每屏都好看，但点过去才发现断点。

## Stitch 开发者集成

- **MCP Server**：把 Stitch 接入 Claude / Cursor 等 MCP-aware 客户端
- **SDK**：GitHub 开源（~2.4k stars），可编程调用 Stitch 能力
- **Skills（stitch-skills）**：可复用的设计技能包
- **导出目标**：AI Studio / Antigravity / Jules / Lovable / Dyad / Cursor / Gemini

> Stitch 的开发者集成出口让设计→编码链路可程序化，不依赖人肉拷贝。

## Claude Design 关键能力

### Brand-aware 设计系统

onboarding 时**读代码库 + 设计文件**，自动应用 colors / typography / components：

- Claude 自动套用现有视觉规范，避免产出与线上产品视觉漂移（drift）
- 每团队可多套设计系统，独立维护
- 把 Claude Design 当 Figma 替代品做像素级精确稿是反模式

### 多格式导入

text / images / DOCX / PPTX / XLSX / codebase references / **web capture tool**（从在线网站抓元素）。

> web capture 是 Claude Design 区别于 Stitch 的差异化输入——直接从公网抓元素进设计，不用截图。

### 精修控件

- **inline comments**：行内评论（团队成员 / Claude 都可加）
- **direct text editing**：直接改文字内容
- **custom adjustment sliders**：调间距 / 颜色 / 布局，Claude **跨全设计传播改动**

### 三档协作（org-scoped）

| 档位 | 行为 |
| --- | --- |
| **private** | 仅自己可见 |
| **view-only link** | 链接可看不可改 |
| **edit access** | 多人 + Claude 同步聊天编辑 |

### Handoff Bundle

**一条指令**把「设计稿 + 设计意图」打包传给 **Claude Code**，用于 design→dev 交接。

> Handoff Bundle 把「丢截图 + 文档」升级为「设计 + 意图结构化打包」，减少 dev 二次解读偏差。

## Claude Design 导出

| 目标 | 说明 |
| --- | --- |
| **Internal URL** | 团队内部链接 |
| **Folder** | 文件夹导出 |
| **Canva** | **直连 Canva**（官方深度集成） |
| **PDF** | 文档归档 |
| **PPTX** | 演示文稿 |
| **Standalone HTML** | 单页 HTML（含交互） |

> 官方公告导出清单**无 Figma**——把 Figma 当交付目标会落空。Canva 是直连，PDF/PPTX/HTML 是文件导出。

## Claude Artifacts（同源轻量）

Artifacts 是 Claude 通用产物面板，支持六类：

- **Documents**（Markdown / 纯文本）
- **Code snippets**
- **单页 HTML 网站**
- **SVG**
- **Diagrams / flowcharts**
- **Interactive React components**

**触发条件**：内容「significant、self-contained、typically over 15 lines」。

**面板能力**：dedicated window（独立窗口）、Version selector（版本切换）、Code view、Copy / Download、Edit with Claude、Multi-file editing、Try fixing with Claude。

**高级**：Publish / Share、Fork（复制他人 artifact 代码再创作）、AI-powered artifacts（嵌入 Claude API，访客用自己 Claude 账号登录）、Persistent storage（personal / shared，**20MB/artifact、text-only**）、MCP 集成。

> Artifacts 是 GA 的成熟能力，适合给非技术评审用 Publish + 分享链接独立窗口渲染、可 fork、可嵌入网页，比贴代码截图更直观且零部署成本。

## AI 设计 vs AI 应用生成器

**判定准则**：产物是否「需要后端 / 数据库 / 部署」？

| 类别 | 代表 | 产物 | 是否含后端 |
| --- | --- | --- | --- |
| **AI 设计工具** | Stitch / Claude Design / Artifacts | UI 设计稿 + HTML/CSS + DESIGN.md | **否** |
| **AI 应用生成器** | Firebase Studio / AI Studio App Builder / Lovable / Dyad / v0 / bolt.new / Cursor | 可运行 app（含状态 / 逻辑 / 可能后端） | **是** |

> 把 v0 / bolt.new / Lovable / Dyad 这类「出可运行 app 的生成器」归入「AI 设计工具」是常见误区——它们的输出含逻辑 / 状态 / 甚至后端调用，定位是应用生成器。

## 串行工作流（Google 官方）

```
Stitch（UX 探索）→ AI Studio（app 原型 preview / deploy）→ Firebase Studio（生产代码）
```

三者可分别独立起点：

- **Stitch**：UX 探索 / 设计变体
- **AI Studio（Build mode / App Builder）**：app 原型，可 preview 与 deploy 到稳定 URL
- **Firebase Studio**：生产代码、后端、auth、DB

> Stitch 与 AI Studio / Firebase Studio 不是替代关系，而是接力关系——Stitch 的 HTML 进 AI Studio 加逻辑，AI Studio 的原型进 Firebase Studio 上生产。

## 最佳实践速跑

1. **早期 UX 探索用 Stitch**——分钟级出多变体供 stakeholder 反应
2. **既有产品用 Claude Design brand-aware**——自动套现有 colors / typography / components
3. **设计→开发走 Handoff Bundle**——一条指令把设计 + 意图传给 Claude Code
4. **跨工具保持设计系统一致用 DESIGN.md**——双向导入导出
5. **进设计协作流走 Paste to Figma**——Figma 仍是设计系统真相源
6. **非技术评审走 Artifacts Publish + 分享链接**——独立窗口渲染、零部署
7. **区分 preview vs deploy**——生产部署走 AI Studio / Firebase Studio

## 下一步

- [Stitch 与 Claude Design 深度](./guide-line.md)：能力对比、AI-native 画布、brand-aware 设计系统、Handoff、Artifacts、反模式
- [参考](./reference.md)：能力清单、导入导出对照、版本与可用性、官方资源
