---
layout: doc
---

# docx-editor

::: tip 本篇范围
本篇聚焦 **docx-editor**（`@eigenpal/docx-editor-*`）——一个**在浏览器里所见即所得（WYSIWYG）编辑 `.docx` 并写回 `.docx`** 的库，提供 **React 与 Vue 3** 适配器。重点在：它的「**可编辑**」定位与 docx（生成）/ mammoth（解析转 HTML）/ docx-preview（只读渲染）的本质差异、`documentBuffer` 加载与 `ref.save()` 导出、`mode` 三态（editing / suggesting / viewing）、**修订追踪**、选择性 OOXML 往返、React 端 Yjs 协同、**headless** 服务端处理与 **agents（AI/MCP）** 工具面。代码示例按最后可核验发行版 **1.9.0**，包内许可证为 **Apache-2.0**。
:::

::: danger 维护与供应链状态
截至 **2026-07-11**，npm 已把 docx-editor 相关包（含 React、Vue、core、i18n、agents 与 Nuxt 模块）的 **1.9.0 标为 deprecated**，deprecation 文本没有给出继任包；原 GitHub 仓库链接也返回 404。官网仍在线，但部分页面停留在旧版本并与 1.9.0 包类型不一致。**不建议新生产项目直接采用**；存量项目应锁定 `1.9.0` 和 lockfile/integrity，保存依赖产物，并准备 fork、替换或导出迁移方案。
:::

docx-editor 的官方一句话定位是「**Open-source WYSIWYG `.docx` editor for React and Vue with canonical OOXML, tracked changes, and real-time collaboration. Agent-ready.**」。它的核心价值是把「在浏览器里**真正编辑** Word 文档」这件事做到 **Word 级排版保真 + 语义无损往返**：`.docx` 进，`.docx` 出，全程客户端，无需上传、无需转换服务。

理解 docx-editor 的关键是它的 **双渲染器架构**：一个**隐藏的 ProseMirror 实例**持有编辑状态（文档、选区、撤销历史、键盘与 IME 输入），离屏挂载、永不显示；每次变更由一个**布局画家（layout painter）**用 Word 自己的度量单位（twips、half-points、EMU、文档字体与主题、分节与页边距几何）从该状态重建可见的分页页面——换行与分页由画家计算，浏览器不参与，输出仍是普通 DOM 文本而非画布位图。正因如此，它能表达 contenteditable 表达不了的真实分页，又保留了 ProseMirror 成熟的输入/撤销/协同能力。

1.x 把库按关注点拆成多个包：框架适配器 `-react` / `-vue`（外加 Nuxt 模块），框架无关核心 `-core`（OOXML 解析器、序列化器、布局引擎、ProseMirror schema），语言包 `-i18n`，以及 AI/agent 工具包 `-agents`。**常规应用只需一个适配器**。两端共享大量核心能力，但 1.9.0 的公开类型并不完全对等：React 有 `externalContent`、受控 `comments`、`agentPanel` 与带选项的 `save`；Vue 没有这些相同入口，并有自己的菜单栏、插槽与 ref 能力。

## 评价

**优点**

- **真正可编辑**：浏览器内 WYSIWYG 编辑正文/表格/图片/页眉页脚，区别于 docx（生成）、mammoth（解析）、docx-preview（只读）
- **Word 级排版保真**：双渲染器用 Word 度量计算分页，输出 DOM 文本（非位图），可选择、可访问
- **选择性 OOXML 往返**：只重写改过的部件，其余部件尽量逐字节带过，降低未建模内容丢失风险
- **原生修订追踪**：suggesting 模式把编辑记成 `w:ins`/`w:del`，与 Word 审阅窗格互通、可接受/拒绝
- **实时协同**：基于 Yjs（CRDT），提供光标、在场、批注同步、修订归属，provider 可自选
- **双框架适配**：React 与 Vue 共享核心文档引擎，Nuxt 模块负责客户端挂载与自动导入
- **能上服务端与 AI**：`-core/headless` 无 DOM 解析/序列化/模板填充；`-agents@1.9.0` 实际暴露 15 个工具，支持 DocxReviewer 与 MCP
- **Apache-2.0**：全部包统一，可商用、无水印、无上限

**缺点**

- **已 deprecated、仓库不可访问**：没有官方继任说明，修复、审计与长期维护都需要自行承担
- **官网与包已漂移**：官网仍写 14 个 agent 工具和更强的 React/Vue 对等性，1.9.0 运行时与类型并非如此
- **发布类型有缺陷**：`-i18n@1.9.0` 的根 `.d.ts` 实际含 JavaScript 初始化代码，`skipLibCheck:false` 会触发 TS1046/TS1039
- **体积偏大、必须客户端渲染**：编辑器挂载要在 DOM 测量文本，SSR 框架需 client-only 边界，建议懒加载
- **ProseMirror 为 peer 依赖**：严格安装器（pnpm 关 peer 自动装、Yarn PnP）需显式安装 prosemirror-* 系列
- **协同入口偏 React**：官网 Yjs 接法依赖 React 的 `externalContent`；Vue 1.9.0 没有同名 prop，不能照搬
- **不是「全功能 Word」**：部分高级 Word 特性是「保留（preserved）」而非「可编辑」；以官方 Word fidelity 矩阵为准
- **部分 React 独占**：`agentPanel` 与受控 `comments` 目前仅 React 端有

## 文档地址

[docx-editor Documentation](https://www.docx-editor.dev/docs)

## GitHub 地址

[eigenpal/docx-editor（本次核验返回 404，仅保留历史链接）](https://github.com/eigenpal/docx-editor)

## 幻灯片地址

<a href="/SlideStack/docx-editor-slide/" target="_blank">docx-editor</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=docx-editor" target="_blank" rel="noopener noreferrer">docx-editor 测试题</a>
