---
layout: doc
outline: [2, 3]
---

# 指南 · 专家

> 版本基线 **1.5.0**。深入边界与权衡：双渲染器架构、AI/agents 三种集成形态、选择性保存与全量重打包、自动保存与崩溃恢复、性能与打包、稳定性与许可，以及与 docx / mammoth / docx-preview / docxtemplater 的选型。

## 一、双渲染器架构（为什么能 Word 级保真）

编辑面与可见输出是两套 DOM、两个渲染器同时跑：

- **隐藏的 ProseMirror 实例**是「编辑器」：持有文档状态、选区、撤销/重做、键盘与 IME 输入、schema 校验的事务模型；离屏挂载、永不显示。
- **可见页面**是「渲染器」：**布局画家**在每次变更时从 ProseMirror 状态重建静态 DOM——用 Word 的页面尺寸、页边距、页眉/页脚、分页，几何从 Word 自己的度量（twips、half-points、EMU）计算，而非由浏览器近似。

两者通过一层薄桥保持同步：ProseMirror 状态变化触发布局重排与受影响页面的重绘；画到页面上的点击/拖拽映射回 ProseMirror 位置（故光标与选区表现得像直接编辑可见 DOM）；画出的元素携带其来源的 ProseMirror 位置区间，这正是选区高亮、批注锚点、修订标记能落在正确像素的原因。

```text
加载：.docx → 解包 → OOXML 解析器 → Document 模型 → toProseDoc → ProseMirror 状态
            → 布局引擎(测量+分页) → 布局画家 → 可见页面
保存：ProseMirror 状态 → fromProseDoc → Document 模型 → OOXML 序列化器 → rezip → .docx
```

> 代价：每个可见特性都得在画家里实现，不能退回 ProseMirror 默认节点渲染。收益：表达出 contenteditable 表达不了的真实分页，输出仍是可选择、可访问的 DOM 文本。

## 二、AI / agents：三种集成形态

`@eigenpal/docx-editor-agents` 把 DOCX 编辑暴露成 **14 个模型工具**（定位 7 + 变更 6 + 导航 1），可三种形态运行：

| | live editor 面板 | headless DocxReviewer | MCP server |
|---|---|---|---|
| agent 在哪跑 | 你的 API 路由，工具在浏览器执行 | 你的服务端进程 | MCP 客户端指向处 |
| 文档在哪 | 用户浏览器里打开的编辑器 | 你加载/保存的 buffer | 宿主每请求加载的 buffer |
| 用户实时围观 | 是 | 否（批处理） | 否 |
| 典型用途 | 编辑器内 AI 写作/审阅 | 合同审阅 API、CI bot、批量红线 | 已支持 MCP 的 agent/平台 |

**live editor**（浏览器内）：

```tsx
const { tools, executeToolCall, getContext } = useDocxAgentTools({ editorRef, author: 'Assistant' });
```

**headless DocxReviewer**（服务端，无 DOM）：

```ts
import { DocxReviewer } from '@eigenpal/docx-editor-agents';

const reviewer = await DocxReviewer.fromBuffer(buffer, 'Reviewer');
reviewer.addComment({ paragraphIndex: 5, text: 'This cap seems too low.' });
reviewer.replace({ paragraphIndex: 5, search: '$50k', replaceWith: '$500k' });
const out = await reviewer.toBuffer();
```

**MCP server**：

```ts
import { McpServer } from '@eigenpal/docx-editor-agents/mcp';
import { createReviewerBridge } from '@eigenpal/docx-editor-agents';

const server = new McpServer(createReviewerBridge(reviewer), { name: 'acme-review', version: '1.0.0' });
```

> 选型：做产品 UI 从 live editor 起步；有文档没 UI 用 DocxReviewer；客户端已支持 MCP 才选 MCP。

## 三、选择性保存 vs 全量重打包

默认 `save()` 做**选择性保存**：只修补你编辑触及过的 XML 部件，其余部件逐字节从原包带过（这保留了编辑器未建模的一切）。强制全量重打包传 `selective: false`：

```ts
const out = await ref.current?.save({ selective: false });
```

> `save()` 在无文档可序列化时返回 `null`，记得判空。

## 四、自动保存与崩溃恢复

服务端持久化：用 `onChange` 触发、防抖、再经 `ref.save()` 序列化：

```tsx
const onChange = () => {
  if (timer.current) clearTimeout(timer.current);
  timer.current = window.setTimeout(async () => {
    const buf = await ref.current?.save();
    if (buf) await fetch(`/api/documents/${docId}`, { method: 'PUT', body: buf });
  }, 1500); // 1~2 秒是合理默认
};
```

> 本地崩溃恢复：React 适配器在 `@eigenpal/docx-editor-react/hooks` 提供 `useAutoSave`，按间隔把解析后的 `Document` 存进 localStorage，并在重载后暴露恢复数据（`hasRecoveryData` / `acceptRecovery`）。

## 五、性能与打包

- `-core` 提供可独立摇树的子路径导出。
- ProseMirror 各包是 **peer 依赖**，让包管理器共享单一副本（严格安装器需显式安装）。
- 懒加载编辑器（`next/dynamic`、`React.lazy`）把它移出首屏 bundle。
- 布局引擎缓存逐块测量，一次编辑不会重新测量整篇文档。

> 官方未发布基准数据，建议用你自己的文档在[在线 demo](https://docx-editor.dev/editor) 实测。

## 六、安全与稳定性

- **普通编辑器用法仅浏览器**：编辑器包不上传文档、不调转换 API。
- **不执行宏**：VBA 宏与嵌入代码不被求值。
- **AI 集成由宿主掌控**：live-editor 让 `.docx` 留在客户端，只把聊天/工具调用文本发给你自己的路由。
- **SemVer + 机器校验**：所有包共享一个版本号，公共 API 由 API Extractor 快照在 CI 跟踪、漂移即失败；React/Vue 对等是受检契约（`agentPanel` 与受控 `comments` 仍 React 独占）；`layout-engine`/`layout-painter`/`layout-bridge`/`plugin-api` 标注 `@experimental`。

## 七、与同类库的选型

| 维度 | **docx-editor** | docx | mammoth | docx-preview | docxtemplater |
|---|---|---|---|---|---|
| 角色 | **浏览器内可编辑** | 生成 | 解析转 HTML | 只读渲染 | 模板批量生成 |
| 编辑 | ✓ WYSIWYG | ✗ | ✗ | ✗ | ✗ |
| 修订追踪 | ✓（w:ins/w:del） | ✗ | ✗ | ✗ | ✗ |
| 协同 | ✓（Yjs） | ✗ | ✗ | ✗ | ✗ |
| 模板填充 | ✓（headless 内置 docxtemplater） | 手写 | ✗ | ✗ | ✓（核心强项） |
| 服务端无 UI | ✓（-core/headless、DocxReviewer） | ✓ | ✓ | — | ✓ |

**经验法则**：

- 要**在浏览器里让人/AI 真正编辑 Word** → **docx-editor**（独一档）。
- 只**从零生成报表** → **docx**；只**把 docx 转 HTML 展示** → **mammoth**；只**只读预览** → **docx-preview**。
- 纯 **mail-merge 式占位符填充**且无需可视化编辑 → **docxtemplater**（或直接用 docx-editor 的 headless 模板管线，再串联 reviewer/editor）。

## 八、版本与许可再强调

- 版本基线 **1.5.0**，全部包 **Apache-2.0**（agents 包在 0.x 曾是 AGPL-3.0，1.0 起放宽）。
- 从 0.x 单体 `@eigenpal/docx-js-editor` 迁移：拆成多包，但常规 React 应用仍只装 `-react`；官方建议至少升到 **1.0.1**（修复若干导入路径痛点）。

---

回到 [入门](../getting-started) 复习加载/保存，或查 [参考](../reference) 速览 props、ref 方法与 headless/agents 入口。
