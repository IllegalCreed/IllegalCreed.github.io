---
layout: doc
outline: [2, 3]
---

# Stitch 与 Claude Design 深度

> 基于 Google Stitch 官方博客（blog.google / developers.googleblog.com）与 Anthropic Claude Design / Artifacts 官方文档（anthropic.com/news、support.claude.com）编写，对照 2026-04-17 Claude Design Research Preview 与 Stitch 当前 Labs 行为

## 速查

- **Stitch 输入**：prompt / 图片 / 草图 wireframe / 截图 / URL（抽设计系统）/ DESIGN.md / 代码片段——全部共享画布上下文
- **Stitch 输出**：高保真 UI 设计稿 + HTML/CSS + 「Paste to Figma」+ DESIGN.md + .zip HTML
- **Stitch 五大组件**：infinite canvas / Design Agent / Agent Manager / Voice / DESIGN.md
- **Stitch + Play**：拼可点击原型 + 自动生成 logical next screens，验证用户旅程
- **Stitch 开发者出口**：MCP Server / SDK（GitHub ~2.4k stars）/ Skills / 导出到 AI Studio / Antigravity / Jules / Lovable / Dyad / Cursor
- **Claude Design 设计系统**：brand-aware，onboarding 读代码库 + 设计文件，每团队可多套
- **Claude Design 精修控件**：inline comments / direct text editing / custom adjustment sliders（跨全设计传播改动）
- **Claude Design 三档协作**：private / view-only link / edit access
- **Claude Design Handoff Bundle**：一条指令把设计 + 意图传给 Claude Code
- **Claude Design 导出**：Internal URL / Folder / Canva（直连）/ PDF / PPTX / Standalone HTML（**无 Figma**）
- **Claude Design 版本**：Anthropic Labs Research Preview、2026-04-17、基于 Opus 4.7、Pro/Max/Team/Enterprise（**Enterprise 默认 off**）
- **Artifacts 六类**：Documents / Code snippets / 单页 HTML 网站 / SVG / Diagrams / Interactive React components
- **Artifacts 阈值**：significant + self-contained + typically over 15 行
- **Artifacts 持久化**：20MB/artifact、text-only、personal / shared、unpublish 永久删全部存储数据
- **判定边界**：产物是否需要后端 / DB / 部署？需要 = 应用生成器
- **反模式**：把 Stitch 当 Figma 替代品做像素稿、期望 Claude Design 导出 Figma、把生成器归入设计工具、直接拿原型代码上生产

## Stitch 深度

### 多模态输入与画布上下文

Stitch 的多模态输入不是「任选一种」，而是**全部共享画布上下文**：

- **自然语言 prompt**：描述产品想法 / 受众 / 风格
- **图片 / 草图 wireframe**：手绘草图、低保真 wireframe、参考图
- **截图**：现有产品 / 竞品截图
- **URL**：从任意在线 URL **抽取设计系统**（colors / typography / spacing），不靠人肉抄 token
- **DESIGN.md**：跨工具（Lovable / Dyad / Cursor / AI Studio）双向导入导出设计规则
- **代码片段**：现有组件 / 样式代码作为视觉约束

> 输入的关键在「共享画布」——prompt + 草图 + URL + DESIGN.md 同时作为约束，Stitch 综合推理出稿。

### 输出形态

| 产物 | 用途 |
| --- | --- |
| **高保真 UI 设计稿** | 画布内直接渲染，可横向对比多变体 |
| **前端代码** | HTML / CSS，可 .zip 整包导出 |
| **DESIGN.md** | 设计规则文件，跨工具流动 |
| **「Paste to Figma」** | 粘贴到 Figma 继续协作（Figma 仍是真相源） |

> Stitch 出的 HTML 是 **prototype-grade**——结构与可访问性未打磨，直接上生产有风险。

### AI-native 五大组件

| 组件 | 解决什么 |
| --- | --- |
| **infinite canvas** | 多变体平铺对比，不再单线串行 |
| **Design Agent** | 跨项目演进推理，自动迭代 |
| **Agent Manager** | 并行管理多个 idea / agent |
| **Voice（vibe design with your voice）** | 语音实时 critique 与访谈 |
| **DESIGN.md** | 跨工具真相源 |

> 这五个组件让 Stitch 从「prompt→稿」升级为「AI-native 软件设计画布」（官方称 vibe design）。

### Stitch + Play 交互原型

- 把多个屏幕「Stitch」成可点击流程
- 点 **Play** 预览
- 自动生成 **logical next screens**，映射用户旅程

**价值**：单屏漂亮 ≠ 流程通——Play + 自动 next screens 能在写代码前暴露交互断点，特别适合产品发现 / UX 探索阶段验证假设。

### 开发者集成

- **MCP Server**：接入 Claude / Cursor 等 MCP-aware 客户端
- **SDK**：GitHub 开源（[google/stitch-sdk](https://github.com/google/stitch-sdk)，~2.4k stars），可编程调用
- **Skills（stitch-skills）**：可复用设计技能包
- **导出目标**：AI Studio / Antigravity / Jules / Lovable / Dyad / Cursor / Gemini

> Stitch 的开发者出口让设计→编码链路可程序化，设计系统通过 DESIGN.md 双向流动，不依赖人肉拷贝 token。

## Claude Design 深度

### Brand-aware 设计系统（核心差异）

onboarding 时**读代码库 + 设计文件**，自动应用 colors / typography / components：

- **自动套用现有视觉规范**：避免产出与线上产品视觉漂移（drift）
- **每团队可多套设计系统**：多品牌 / 多产品线独立维护
- **不用 Claude 反复纠正风格**：Claude 主动遵守已建立的规范

> 这是 Claude Design 区别于 Stitch 的核心——Stitch 偏重「从零生成变体」，Claude Design 偏重「在既有品牌体系内精修」。

### 多格式导入清单

| 类型 | 来源 |
| --- | --- |
| **text** | 一段描述 / 一份需求 |
| **images** | 截图 / 参考图 / 草图 |
| **DOCX** | Word 文档（产品需求、用例） |
| **PPTX** | 演示文稿（路演稿、设计评审） |
| **XLSX** | Excel（数据驱动页面如报表） |
| **codebase references** | 既有代码库组件 / 样式 |
| **web capture tool** | **从在线网站抓元素**（差异化能力） |

> web capture 让 Claude Design 直接从公网抓元素进设计，不用截图——比 Stitch 的 URL 抽设计系统更细粒度（元素级 vs 系统级）。

### 精修控件

| 控件 | 作用 |
| --- | --- |
| **inline comments** | 行内评论（团队成员 / Claude 都可加） |
| **direct text editing** | 直接改文字内容 |
| **custom adjustment sliders** | 调间距 / 颜色 / 布局，**Claude 跨全设计传播改动** |

> custom adjustment sliders 的杀手锏是「跨全设计传播」——改一处间距，全设计稿所有同类元素同步更新，不用逐个改。

### 三档协作（org-scoped）

| 档位 | 行为 |
| --- | --- |
| **private** | 仅自己可见 |
| **view-only link** | 链接可看不可改 |
| **edit access** | 多人 + Claude 同步聊天编辑 |

> 三档协作 + org admin 控制是 Claude Design 区别于 Artifacts 的 Enterprise 特性——Artifacts 无团队级设计系统持久化与 org 级 admin 控制。

### Handoff Bundle

**一条指令**把「设计稿 + 设计意图」打包传给 **Claude Code**，用于 design→dev 交接：

- 把「丢截图 + 文档」升级为「设计 + 意图结构化打包」
- 减少 dev 二次解读偏差
- 比单独丢 Figma 链接 + 标注文档更保真

> Handoff Bundle 是 Claude Design 与 Claude Code 的官方接力协议——把设计意图一起带过去，dev 不用反推设计师在想什么。

### 导出清单

| 目标 | 类型 |
| --- | --- |
| **Internal URL** | 团队内部链接 |
| **Folder** | 文件夹导出 |
| **Canva** | **直连 Canva**（官方深度集成） |
| **PDF** | 文档归档 |
| **PPTX** | 演示文稿 |
| **Standalone HTML** | 单页 HTML（含交互） |

> 官方公告导出清单**无 Figma**。把 Figma 当 Claude Design 的交付目标会落空——Canva 是直连，PDF/PPTX/HTML 是文件导出，要走 Figma 协作流的话 Stitch 的「Paste to Figma」反而是更直接的路径。

### 代码驱动原型

支持 voice / video / shaders / 3D / 内置 AI 的 **frontier prototypes**——比 Stitch 的 HTML 更激进，能做带 shader / 3D / 视频 / AI 调用的原型。

> 这是 Claude Design 的另一差异化——不只做静态稿，能出真正「活」的原型（带 shader、3D、视频、AI 调用）。

### 版本与可用性

| 项 | 取值 |
| --- | --- |
| **阶段** | Anthropic Labs **Research Preview** |
| **发布日** | 2026-04-17 |
| **底层模型** | Claude Opus 4.7（官方称最 capably vision 模型） |
| **可用范围** | Pro / Max / Team / Enterprise |
| **Enterprise** | **默认 off**，admin 必须显式 enable |
| **用量** | 计入既有订阅额度（extra usage toggle 才超限） |

> Enterprise 默认 off 是常见踩坑——以为开了就能用，实际 admin 必须显式 enable；用量计入订阅额度，超额需开 extra usage。

## Claude Artifacts 深度

### 六类产物

| 类型 | 说明 |
| --- | --- |
| **Documents** | Markdown / 纯文本 |
| **Code snippets** | 代码段 |
| **单页 HTML 网站** | self-contained 单页 |
| **SVG** | 矢量图 |
| **Diagrams / flowcharts** | 流程图 / 架构图 |
| **Interactive React components** | 交互式 React 组件 |

**触发条件**：内容「significant、self-contained、typically over 15 lines」——Claude 自动判断是否升级为 artifact。

> 触发阈值 ~15 行是经验值，不是硬规则；本质是「内容是否值得独立窗口渲染」。

### 面板能力

| 能力 | 作用 |
| --- | --- |
| **dedicated window** | 独立窗口渲染（不被对话流冲掉） |
| **Version selector** | 版本切换 |
| **Code view** | 看底层代码 |
| **Copy / Download** | 复制 / 下载 |
| **Edit with Claude** | Markdown 原地编辑 |
| **Multi-file editing** | 多文件批量批注 |
| **Try fixing with Claude** | 错误修复 |

### 高级能力

- **Publish / Share**：公开发布或组织内分享
- **Fork**：复制他人 artifact 代码再创作
- **AI-powered artifacts**：嵌入 Claude API，访客用自己 Claude 账号登录
- **Persistent storage**：personal / shared，**20MB/artifact、text-only**
- **MCP 集成**：与 MCP-aware 客户端联动

> 持久化限制 20MB/artifact 且 text-only——存图片 / 二进制或塞超 20MB 会失败；unpublish 会永久删全部存储数据。

### Artifacts vs Claude Design

| 维度 | Artifacts | Claude Design |
| --- | --- | --- |
| **定位** | 通用产物面板 | 专业 UI 设计 |
| **设计系统** | 无团队级持久化 | brand-aware，多套 |
| **协作** | 单 artifact | 三档 org-scoped |
| **代码库摄取** | 无 | onboarding 读代码库 |
| **Handoff** | 无 | Bundle → Claude Code |
| **阶段** | GA | Research Preview |
| **admin 控制** | 无 | Enterprise 默认 off |

> Artifacts 是 GA 成熟的轻量同源，Claude Design 是 Preview 阶段的专业重器——把两者等同是反模式。

## AI 设计 vs AI 应用生成器

**判定准则**：产物是否「需要后端 / 数据库 / 部署」？

| 类别 | 代表 | 产物 | 后端 | 部署 |
| --- | --- | --- | --- | --- |
| **AI 设计工具** | Stitch / Claude Design / Artifacts | UI 设计稿 + HTML/CSS + DESIGN.md | 否 | 仅 preview |
| **AI 应用生成器** | Firebase Studio / AI Studio App Builder / Lovable / Dyad / v0 / bolt.new / Cursor | 可运行 app | **是** | 可 deploy |

**误判高发区**

- **v0 / bolt.new / Lovable / Dyad**：输出含状态 / 逻辑 / 可能后端，定位是「应用生成器」
- **Firebase Studio**：全栈云 IDE + AI agent，含后端 / DB / auth / deploy
- **AI Studio App Builder（Build mode）**：可预览 + 部署到稳定 URL

> 把上述生成器归入「AI 设计工具」会混淆产物边界——它们出的是 app，不是设计稿。

## Google 官方串行工作流

```
Stitch（UX 探索）→ AI Studio（app 原型 preview / deploy）→ Firebase Studio（生产代码）
```

**三者可分别独立起点**

- **Stitch**：UX 探索 / 设计变体 / 交互原型验证
- **AI Studio（Build mode / App Builder）**：app 原型，可 preview 与 deploy 到稳定 URL
- **Firebase Studio**：生产代码、后端、auth、DB

> 三者不是替代关系而是接力——Stitch 的 HTML 进 AI Studio 加逻辑，AI Studio 的原型进 Firebase Studio 上生产。Stitch 也可直接导出到 Lovable / Dyad / Cursor 等编码工具走另一条路径。

## 最佳实践

### Stitch 用法

- **早期 UX 探索 / 产品发现阶段**用 Stitch 出多变体，分钟级供 stakeholder 反应
- **不要做像素级精确稿**——Stitch 官方明说「not for pixel-perfect precision」
- **多屏拼 Play 原型验证用户旅程**——单屏漂亮不等于流程通
- **DESIGN.md 跨工具流动**——Lovable / Dyad / Cursor / AI Studio 保持设计系统一致
- **进设计协作流走 Paste to Figma**——Figma 仍是真相源

### Claude Design 用法

- **既有产品先建立 brand-aware 设计系统**——onboarding 读代码库 + 设计文件
- **设计→开发走 Handoff Bundle**——一条指令把设计 + 意图传给 Claude Code
- **不要期望 Figma 导出**——官方清单无 Figma，走 Canva（直连）或 PDF / PPTX / HTML
- **Enterprise 部署先 admin enable**——默认 off，用量计入订阅额度
- **多团队多套设计系统**——独立维护避免视觉漂移

### Artifacts 用法

- **Publish + 分享链接给非技术评审**——独立窗口渲染、可 fork、零部署
- **不存图片 / 二进制 / 超 20MB**——text-only、20MB/artifact
- **不要把 unpublish 当临时操作**——会永久删全部存储数据
- **AI-powered artifacts 嵌入 Claude API**——访客用自己账号登录，不在你的额度

## 反模式（避坑）

- **把 Stitch 当 Figma 替代品**：官方明确「not a Figma replacement」「not a long-term design system source of truth」
- **混淆 Stitch 与 Firebase Studio / AI Studio App Builder**：Stitch 只出 UI + HTML，无后端 / DB / auth / 部署；后者才是全栈云 IDE
- **期望 Claude Design 导出 Figma**：官方公告导出仅 URL / Folder / Canva / PDF / PPTX / HTML，Canva 是直连，**无 Figma**
- **把 Claude Design 等同于 Artifacts**：Design 有 brand-aware 设计系统、codebase 摄取、web capture、三档协作、handoff bundle、org admin 控制；Artifacts 是单 artifact 生成模型
- **直接拿 Stitch / Claude Design 导出的 HTML 上生产**：产物是 prototype-grade，结构与可访问性未打磨，需在 Firebase Studio / 真实工程里重写
- **Enterprise 默认开启就推给全员用**：官方 Enterprise 默认 off，admin 必须显式 enable，且用量计入订阅额度
- **对 Artifacts persistent storage 存图片 / 二进制或塞超 20MB**：官方限制 20MB/artifact 且 text-only，超限或类型不符会失败；unpublish 会永久删全部存储数据
- **把 v0 / bolt.new / Lovable / Dyad 归入「AI 设计工具」**：它们输出可运行 app（含逻辑 / 状态 / 甚至后端调用），定位是应用生成器
- **混淆 preview 与 deploy**：Stitch / Claude Design 只出 preview，稳定 URL 与计费须走 AI Studio / Firebase Studio

## 下一步

- [参考](./reference.md)：能力清单、导入导出对照、版本与可用性、官方资源
