---
layout: doc
outline: [2, 3]
---

# 参考

> docx-editor（`@eigenpal/docx-editor-*`）常用包、`DocxEditor` props、ref 方法、mode 取值、headless 与 agents 入口速查。版本基线 **1.5.0**。React 与 Vue 适配器的根 API 形状相同（同 props、同 ref 方法，hooks↔composables）。

## 一、包一览

| 包 | 作用 |
|---|---|
| `@eigenpal/docx-editor-react` | React 适配器：工具栏、分页编辑器、插件（传递带入 -core / -i18n） |
| `@eigenpal/docx-editor-vue` | Vue 3 适配器：与 React 对等 |
| `@eigenpal/nuxt-docx-editor` | Nuxt 3 & 4 模块，封装 Vue 适配器、SSR 安全、自动导入 |
| `@eigenpal/docx-editor-core` | 框架无关核心：OOXML 解析器、序列化器、布局引擎、ProseMirror schema |
| `@eigenpal/docx-editor-i18n` | 共享语言字符串与类型 |
| `@eigenpal/docx-editor-agents` | Agent SDK 与聊天 UI：工具桥、MCP server、AI SDK 适配器 |

> 两个适配器都导出 `DocxEditor`、`DocxEditorProps`、`DocxEditorRef`、`DocxEditorHandle`、`EditorMode`、`renderAsync`；框架特定定制走显式子路径 `/ui`、`/hooks`（Vue 为 `/composables`）、`/dialogs`、`/plugin-api`。

## 二、DocxEditor 常用 props

| Prop | 类型 | 默认 | 含义 |
|---|---|---|---|
| `documentBuffer` | `ArrayBuffer \| Uint8Array \| Blob \| File` | — | 要加载的 `.docx`（`null` 挂空文档，`undefined` 推迟挂载） |
| `document` | `Document` | — | 预解析的文档树（替代 buffer） |
| `author` | `string` | `'User'` | 修订与批注的作者名 |
| `mode` | `'editing' \| 'suggesting' \| 'viewing'` | `'editing'` | 编辑 / 修订（tracked changes）/ 只读查看 |
| `onModeChange` | `(mode: EditorMode) => void` | — | 用户切换模式时回调 |
| `readOnly` | `boolean` | `false` | 只读预览（隐藏工具栏、标尺、面板） |
| `externalContent` | `boolean` | `false` | `document` 仅作 schema 种子，内容由外部（如 Yjs）提供 |
| `showToolbar` | `boolean` | `true` | 是否显示格式工具栏 |
| `showRuler` | `boolean` | `false` | 显示水平/垂直标尺 |
| `showOutline` | `boolean` | `false` | 显示文档大纲侧栏（目录） |
| `initialZoom` | `number` | `1.0` | 初始缩放 |
| `comments` | `Comment[]` | — | 受控批注，配 `onCommentsChange` 经 Yjs/Liveblocks 同步（**React 端**） |
| `onChange` | `(doc: Document) => void` | — | 文档变更时回调 |
| `onSave` | `(buffer: ArrayBuffer) => void` | — | 工具栏触发保存时回调 |
| `onError` | `(error: Error) => void` | — | 出错回调（解析/渲染错误从这里抛出） |
| `onSelectionChange` | `(state: SelectionState \| null) => void` | — | 选区变化回调 |
| `onPrint` | `() => void` | — | 传入才启用「文件→打印」与 `editor.print()`，省略则隐藏菜单项 |
| `documentName` | `string` | — | 标题栏里可编辑的文档名 |
| `disableFindReplaceShortcuts` | `boolean` | `false` | 让浏览器/宿主接管 Cmd/Ctrl+F、Cmd/Ctrl+H |

> Vue 端：`toolbarExtra` / `renderLogo` / `renderTitleBarRight` 用 `VNodeChild` 渲染函数；SFC 模板里对应具名插槽 `toolbar-extra`、`title-bar-left`、`title-bar-right`。

## 三、DocxEditorRef 方法

| 方法 | 签名 | 作用 |
|---|---|---|
| `save` | `(opts?: { selective?: boolean }) => Promise<ArrayBuffer \| null>` | 序列化为 `.docx`；默认选择性保存，`selective:false` 全量重打包 |
| `getDocument` | `() => Document` | 取当前文档对象 |
| `loadDocumentBuffer` | `(input: DocxInput) => Promise<void>` | 运行时换一份 `.docx`（不重挂组件） |
| `loadDocument` | `(doc: Document) => void` | 加载一个预解析的 `Document` |
| `setZoom` | `(n: number) => void` | 设缩放（如 `1.5` = 150%） |
| `focus` | `() => void` | 聚焦编辑器 |
| `scrollToPage` | `(n: number) => void` | 滚动到第 n 页 |
| `print` | `() => void` | 打印（需先传 `onPrint`） |
| `proposeChange` | `(opts) => boolean` | 按 `w14:paraId` 锚定插入一条 tracked 替换（AI 红线的原语） |

```tsx
const ref = useRef<DocxEditorRef>(null);
await ref.current?.save();              // ArrayBuffer | null
ref.current?.getDocument();             // 当前文档
ref.current?.setZoom(1.5);              // 150%
ref.current?.scrollToPage(3);           // 第 3 页
await ref.current?.loadDocumentBuffer(nextBuffer); // 运行时换文档
```

## 四、修订追踪：接受/拒绝命令

接受/拒绝是 `@eigenpal/docx-editor-core/prosemirror/commands` 导出的 **ProseMirror 命令**，需对编辑器 view 运行（用 `onEditorViewReady` 捕获 view）：

| 命令 | 作用 |
|---|---|
| `acceptChangeById(revisionId)` | 接受某条修订 |
| `rejectChangeById(revisionId)` | 拒绝某条修订 |
| `acceptAllChanges()` | 接受全部修订（含结构性表格/列表修订） |
| `rejectAllChanges()` | 拒绝全部修订 |

> 枚举修订用 `extractTrackedChanges`（`@eigenpal/docx-editor-core/prosemirror/utils/extractTrackedChanges`）：传入编辑器状态，返回修订条目与「批注→修订」映射。

## 五、headless 核心（`@eigenpal/docx-editor-core/headless`）

无 DOM、可在 Node/Worker 运行的解析与序列化引擎。

| API | 作用 |
|---|---|
| `parseDocx(buffer)` | 解析 `.docx` → `Document` |
| `repackDocx(doc)` | 对原始 buffer 选择性回写 → `ArrayBuffer`（无原 buffer 抛错） |
| `createDocx(doc)` | 从零构建全新包 → `ArrayBuffer` |
| `serializeDocx(doc)` | 返回 `document.xml` 字符串（不是 `.docx` 文件） |
| `getParagraphs` / `getParagraphText` / `getBodyText` / `getBodyWordCount` | 文本读取助手 |
| `DocumentAgent` | 链式不可变文档操作（`insertText`/`applyStyle`/`applyVariables`/`toBuffer` 等） |
| `detectVariables` / `processTemplate` | `{{变量}}` 模板检测与填充（docxtemplater 支撑） |
| `findContentControls` / `setContentControlContent` | 内容控件（按 tag/alias/id 寻址）查找与填充 |
| `createEmptyDocument` / `createDocumentWithText` | 新建空/带文本文档 |

## 六、agents 子路径（`@eigenpal/docx-editor-agents`）

| 子路径 | 用途 |
|---|---|
| 根 | `DocxReviewer`、`agentTools`、`getToolSchemas`、`executeToolCall`、`createReviewerBridge` |
| `/react` | `useDocxAgentTools`、`useAgentChat`、聊天 UI 组件 |
| `/vue` | `useAgentBridge`、Vue 聊天 UI |
| `/server` | 后端路由所需工具 schema（不走 MCP） |
| `/mcp` | `McpServer`、`runStdioServer` |
| `/ai-sdk/server` | 给 Vercel AI SDK `streamText` 的 `getAiSdkTools()` |
| `/ai-sdk/react`、`/ai-sdk/vue` | `toAgentMessages()` 把 `useChat` 输出喂给 `<AgentChatLog>` |

> 14 个工具：定位 7（`read_document`/`read_selection`/`read_page`/`read_pages`/`find_text`/`read_comments`/`read_changes`）+ 变更 6（`add_comment`/`reply_comment`/`resolve_comment`/`suggest_change`/`apply_formatting`/`set_paragraph_style`）+ 导航 1（`scroll`）。

---

速查完毕，进 [指南 · 基础](./guide-line/base) 理解 mode 与修订，或 [指南 · 进阶](./guide-line/advanced) 看协同、headless 与 AI 实战。
