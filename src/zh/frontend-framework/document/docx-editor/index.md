---
layout: doc
---

# docx-editor

::: tip 本篇范围
本篇聚焦 **docx-editor**（`@eigenpal/docx-editor-*`）——一个**在浏览器里所见即所得（WYSIWYG）编辑 `.docx` 并写回 `.docx`** 的开源库，支持 **React 与 Vue 3**。重点在：它的「**可编辑**」定位与 docx（生成）/ mammoth（解析转 HTML）/ docx-preview（只读渲染）的本质差异、`documentBuffer` 加载与 `ref.save()` 导出、`mode` 三态（editing / suggesting / viewing）、**修订追踪**（tracked changes，序列化为 Word 原生 `w:ins`/`w:del`）、**canonical OOXML 与无损往返**、基于 **Yjs（CRDT）** 的实时协同、**headless** 服务端处理与 **agents（AI/MCP）** 工具面。版本基线 **1.5.0**，许可证 **Apache-2.0**。
:::

::: warning 新兴项目提醒
docx-editor 是较新的项目（仓库高频更新、API 受 SemVer 与机器校验快照约束）。本篇内容均以官网 [docx-editor.dev](https://www.docx-editor.dev/) 与 GitHub [eigenpal/docx-editor](https://github.com/eigenpal/docx-editor) 源码/文档为准；部分 `layout-engine`/`layout-painter`/`plugin-api` 等被官方标注为 `@experimental`，使用前请以你所装版本的文档为准。
:::

docx-editor 的官方一句话定位是「**Open-source WYSIWYG `.docx` editor for React and Vue with canonical OOXML, tracked changes, and real-time collaboration. Agent-ready.**」。它的核心价值是把「在浏览器里**真正编辑** Word 文档」这件事做到 **Word 级排版保真 + 语义无损往返**：`.docx` 进，`.docx` 出，全程客户端，无需上传、无需转换服务。

理解 docx-editor 的关键是它的 **双渲染器架构**：一个**隐藏的 ProseMirror 实例**持有编辑状态（文档、选区、撤销历史、键盘与 IME 输入），离屏挂载、永不显示；每次变更由一个**布局画家（layout painter）**用 Word 自己的度量单位（twips、half-points、EMU、文档字体与主题、分节与页边距几何）从该状态重建可见的分页页面——换行与分页由画家计算，浏览器不参与，输出仍是普通 DOM 文本而非画布位图。正因如此，它能表达 contenteditable 表达不了的真实分页，又保留了 ProseMirror 成熟的输入/撤销/协同能力。

1.x 把库按关注点拆成多个包：框架适配器 `-react` / `-vue`（外加 Nuxt 模块），框架无关核心 `-core`（OOXML 解析器、序列化器、布局引擎、ProseMirror schema），语言包 `-i18n`，以及 AI/agent 工具包 `-agents`。**常规应用通常只装一个适配器**（如 `@eigenpal/docx-editor-react`），它会把 `-core` 与 `-i18n` 作为传递依赖一起带入。

## 评价

**优点**

- **真正可编辑**：浏览器内 WYSIWYG 编辑正文/表格/图片/页眉页脚，区别于 docx（生成）、mammoth（解析）、docx-preview（只读）
- **Word 级排版保真**：双渲染器用 Word 度量计算分页，输出 DOM 文本（非位图），可选择、可访问
- **canonical OOXML、语义无损往返**：只重写改过的部件，其余部件逐字节带过，关系/书签/样式/编号 ID 不重排
- **原生修订追踪**：suggesting 模式把编辑记成 `w:ins`/`w:del`，与 Word 审阅窗格互通、可接受/拒绝
- **实时协同**：基于 Yjs（CRDT），提供光标、在场、批注同步、修订归属，provider 可自选
- **React/Vue 对等**：同组件名、同 props、hooks↔composables，由机器校验契约保证
- **能上服务端与 AI**：`-core/headless` 无 DOM 解析/序列化/模板填充；`-agents` 暴露 14 个工具，支持 DocxReviewer 与 MCP
- **Apache-2.0**：全部包统一，可商用、无水印、无上限

**缺点**

- **较新、迭代快**：部分 API（layout-engine/painter/plugin-api）标注 `@experimental`，需关注版本
- **体积偏大、必须客户端渲染**：编辑器挂载要在 DOM 测量文本，SSR 框架需 client-only 边界，建议懒加载
- **ProseMirror 为 peer 依赖**：严格安装器（pnpm 关 peer 自动装、Yarn PnP）需显式安装 prosemirror-* 系列
- **协同接线有坑**：必须设 `externalContent`，否则挂载期重置会清空并污染 Y.Doc
- **不是「全功能 Word」**：部分高级 Word 特性是「保留（preserved）」而非「可编辑」；以官方 Word fidelity 矩阵为准
- **部分 React 独占**：`agentPanel` 与受控 `comments` 目前仅 React 端有

## 文档地址

[docx-editor Documentation](https://www.docx-editor.dev/docs)

## GitHub 地址

[eigenpal/docx-editor](https://github.com/eigenpal/docx-editor)

## 幻灯片地址

<a href="/SlideStack/docx-editor-slide/" target="_blank">docx-editor</a>
