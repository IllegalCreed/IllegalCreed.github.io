---
layout: doc
---

# AI 设计

AI 设计（AI UI Design Tools）是一类**以生成式 AI 为核心、把「想法 / 草图 / 截图 / 既有产品」直接转成 UI 设计稿与前端代码」的工具**，定位在「设计探索 + design→dev 交接」这一段，**不产出可交付的运行时应用**。当前官方两强对峙：① **Google Stitch**（Google Labs 实验，2025-05-20 I/O 发布，基于 Gemini 2.5 Pro 多模态），输入自然语言 prompt / 草图 wireframe / 截图 / URL，输出高保真 UI 设计稿 + HTML/CSS + DESIGN.md，可「Paste to Figma」或导出到 AI Studio / Antigravity / Lovable / Cursor；已演化为「AI-native 软件设计画布」，引入无限画布、Design Agent、Agent Manager、Voice（vibe design with your voice）、MCP Server 与开源 SDK（GitHub ~2.4k stars）。② **Anthropic Claude Design**（Anthropic Labs Research Preview，2026-04-17 发布，基于 Claude Opus 4.7），主打 brand-aware 设计系统（onboarding 读代码库 + 设计文件，自动套用 colors/typography/components，每团队可多套），多格式导入（text / images / DOCX / PPTX / XLSX / codebase / web capture），导出 Internal URL / Folder / Canva / PDF / PPTX / Standalone HTML，并通过 Handoff Bundle 一条指令把「设计 + 意图」打包给 Claude Code。同源的 **Claude Artifacts**（已 GA）则是更通用的产物面板，输出单页 HTML 网站 / 交互式 React 组件 / SVG / 图表 / 文档，支持 Publish / Share / Fork 与 Persistent storage（20MB/artifact、text-only）。

明确边界——**AI 设计工具 ≠ AI 应用生成器**。Firebase Studio / Google AI Studio App Builder（Build mode）/ Lovable / Dyad / v0 / bolt.new / Cursor 这类生成器输出的是「可运行 app」（含状态、逻辑、可能含后端调用 / DB / auth / 部署）；Stitch / Claude Design 只出 UI 设计稿与原型级前端代码，需要后续在 Firebase Studio / 真实工程里重写后端与可访问性。判定准则：**产物是否需要后端 / 数据库 / 部署**，以及**定位是设计探索 vs 可交付应用**。Google 官方推荐的串行工作流是：Stitch（UX 探索）→ AI Studio（app 原型 preview / deploy）→ Firebase Studio（生产代码），三者可分别独立起点。

## 评价

**优点**

- **分钟级出多变体**：Stitch 官方定位「fastest way to explore multiple paths」，Claude Design 同样能从一句 prompt 出多版稿，给 stakeholder 反应的反馈循环从天级压到分钟级
- **降低设计→开发交接损耗**：Claude Design 的 Handoff Bundle 把「设计稿 + 设计意图」打包成一条指令传给 Claude Code，减少 dev 二次解读偏差；Stitch 的 DESIGN.md 让设计规则在 Stitch / Lovable / Dyad / Cursor / AI Studio 间双向流动
- **既有产品视觉一致性**：Claude Design brand-aware 设计系统 onboarding 读代码库 + 设计文件，自动套用现有 colors/typography/components，多团队多套独立维护，避免视觉漂移
- **多模态输入友好**：Stitch 接 prompt / 草图 / 截图 / URL 抽设计系统 / DESIGN.md / 代码片段；Claude Design 接 text / images / DOCX / PPTX / XLSX / codebase / web capture（从在线网站抓元素）
- **生态打通**：Stitch 可「Paste to Figma」、导出到 AI Studio / Antigravity / Jules / Lovable / Dyad / Cursor；Claude Design 可导出 Canva（直连）/ PDF / PPTX / Standalone HTML
- **开发者可编程**：Stitch 提供 MCP Server + 开源 SDK + Skills；Artifacts 支持嵌入 Claude API、MCP 集成

**缺点**

- **产物是原型级（prototype-grade）**：Stitch / Claude Design 导出的 HTML / 前端代码结构与可访问性未打磨，直接上生产有风险，需在真实工程里重写
- **不是 Figma 替代品**：Stitch 官方明说「not for pixel-perfect precision」「not a Figma replacement」「not a long-term design system source of truth」；Claude Design 也**未提供 Figma 导出**（官方导出仅 Internal URL / Folder / Canva / PDF / PPTX / HTML）
- **实验性 / Preview 阶段**：Stitch 是 Google Labs 实验产品可能下线；Claude Design 是 Anthropic Labs Research Preview，用量计入既有订阅额度（Enterprise 默认 off 需 admin 显式开启）
- **preview ≠ deploy**：Stitch / Claude Design 只出 preview，要稳定 URL 与计费须走 AI Studio / Firebase Studio
- **Artifacts 持久化限制**：20MB/artifact、text-only，unpublish 会永久删全部存储数据
- **同类工具命名混淆**：v0 / bolt.new / Lovable / Dyad 等出可运行 app 的「生成器」常被误归入「AI 设计工具」，定位与产物完全不同

## 文档地址

- [Stitch 产品官网](https://stitch.withgoogle.com/)
- [Google Developers：Introducing Stitch (I/O 2025)](https://developers.googleblog.com/stitch-a-new-way-to-design-uis/)
- [Google 官方博客：vibe design with Stitch](https://blog.google/innovation-and-ai/models-and-research/google-labs/stitch-ai-ui-design/)
- [Anthropic 官方：Claude Design by Anthropic Labs](https://www.anthropic.com/news/claude-design-anthropic-labs)
- [Claude Help Center：Artifacts 官方文档](https://support.claude.com/en/articles/9487310-what-are-artifacts-and-how-do-i-use-them)

## GitHub 地址

- [Stitch SDK（GitHub 开源，~2.4k stars）](https://github.com/google/stitch-sdk)

## 幻灯片地址

<a href="/SlideStack/ai-design-slide/" target="_blank">AI 设计</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=PENDING" target="_blank" rel="noopener noreferrer">AI 设计测试题</a>
