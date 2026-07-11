---
layout: doc
outline: [2, 3]
---

# 指南 · 进阶

> 版本基线 **1.9.0（已 deprecated）**。把 docx-editor 用进存量项目：React 端 **Yjs** 协同与受控批注、**headless** 解析/序列化/模板填充、`DocumentAgent` 链式操作，以及 1.9.0 扩展后的内容控件。

## 速查

- 协同示例仅适用于 React：`document` 作 schema 种子，`externalContent` + `externalPlugins` 接 Yjs
- Vue 1.9.0 没有 `externalContent` 和受控 `comments` prop，不能复制 React 接线
- headless：`parseDocx` → 修改 → `repackDocx`；从零文档用 `createDocx`
- `serializeDocx` 只返回 `document.xml`，不是可打开的 `.docx`
- `DocumentAgent.getPageCount()` 在 headless 环境是估算值，不是浏览器排版后的权威页数
- 模板：`processTemplate(buffer, data)` 同步返回 `ArrayBuffer`
- 内容控件：1.9.0 支持 block、inline、table cell，并可覆盖页眉页脚；批量变更优先原子操作

## 一、实时协同：基于 Yjs（CRDT）

React 适配器可把 `DocxEditor` 绑定到 Yjs：要点是把 `document` 当 schema 种子并设 **`externalContent`**（禁用内置加载，改由 Yjs 填充），再用 **`externalPlugins`** 传入 `y-prosemirror` 插件。下面是接线骨架，不包含鉴权、持久化、初始文档竞争与 provider 重连策略：

```tsx
import { useMemo } from 'react';
import { createEmptyDocument } from '@eigenpal/docx-editor-core';
import { DocxEditor } from '@eigenpal/docx-editor-react';
import { ySyncPlugin, yCursorPlugin, yUndoPlugin } from 'y-prosemirror';

function CollaborativeEditor({ ydoc, provider }) {
  const fragment = ydoc.getXmlFragment('prosemirror');
  const plugins = useMemo(
    () => [
      ySyncPlugin(fragment),             // 同步 ProseMirror 文档
      yCursorPlugin(provider.awareness), // 远端光标
      yUndoPlugin(),                     // 共享撤销/重做
    ],
    [fragment, provider],
  );

  return (
    <DocxEditor
      document={createEmptyDocument()}
      externalPlugins={plugins}
      externalContent
    />
  );
}
```

> 传输 provider 由你选：开发可用 `y-webrtc`（点对点），生产换 PartyKit、Liveblocks、Hocuspocus 等。用户身份经 `provider.awareness.setLocalStateField('user', user)` 发布，对端即可渲染头像与带标签的光标。

::: danger 必须设 externalContent，否则会污染共享文档
不设 `externalContent` 时，挂载期的 `useEffect` 会调用 `loadDocument()` **重置 ProseMirror 状态**；若 `ySyncPlugin` 已用 Y.Doc 内容填充了 ProseMirror，这个重置会清空它——随后 ySync 又把空状态同步回 Y.Doc，**破坏每个已连接客户端的共享文档**。设了 `externalContent`，`document` 仅作 schema 种子、挂载时不加载。
:::

> 这是 **React 1.9.0** 的公开入口。Vue 1.9.0 类型没有 `externalContent` 或受控 `comments` prop；若必须在 Vue 做协同，需要自行验证更底层的 ProseMirror/插件接入，或选择仍受维护且明确支持 Vue 协同的编辑器。

## 二、修订与批注的同步差异

- **修订自动同步**：其元数据（`author`/`date`/`revisionId`）存在 ProseMirror 文档的 insertion/deletion mark 属性里，作为文档树一部分被 `ySyncPlugin` 同步，**无需额外 props**。
- **批注需手动桥接**：线程元数据（文本、作者、回复、已解决）存在文档**之外**，只有批注范围标记随 `ySyncPlugin` 同步。要让线程跨协作者同步，用受控 `comments` + `onCommentsChange` 桥接到协同后端（如 `Y.Array`）：

```tsx
import * as Y from 'yjs';
import type { Comment } from '@eigenpal/docx-editor-core';

function useSyncedComments(ydoc: Y.Doc): [Comment[], (next: Comment[]) => void] {
  const yComments = ydoc.getArray<Comment>('comments');
  const [comments, setComments] = useState<Comment[]>(() => yComments.toArray());
  useEffect(() => {
    const sync = () => setComments(yComments.toArray());
    yComments.observeDeep(sync);
    return () => yComments.unobserveDeep(sync);
  }, [yComments]);
  const setRemote = useCallback((next: Comment[]) => {
    ydoc.transact(() => {
      if (yComments.length > 0) yComments.delete(0, yComments.length);
      if (next.length > 0) yComments.push(next);
    });
  }, [ydoc, yComments]);
  return [comments, setRemote];
}

// const [comments, setComments] = useSyncedComments(ydoc);
// <DocxEditor document={...} comments={comments} onCommentsChange={setComments} />
```

> 省略 `comments` 时编辑器回退到内部状态，现有用法无需改动。受控 `comments` 目前是 **React 端**能力。

## 三、headless：在 Node / Worker 里处理文档

`@eigenpal/docx-editor-core/headless` 是去掉 UI 的文档引擎，不碰 DOM，适合批量管线（填模板、盖水印、抽文本、生成、后处理上传）：

```ts
import { readFile, writeFile } from 'node:fs/promises';
import { parseDocx, getParagraphs, getParagraphText, repackDocx } from '@eigenpal/docx-editor-core/headless';

const buffer = await readFile('contract.docx');
const doc = await parseDocx(buffer);

for (const para of getParagraphs(doc.package.document)) {
  console.log(para.paraId, getParagraphText(para));
}

const out = await repackDocx(doc); // ArrayBuffer，原始部件逐字节带过
await writeFile('contract-out.docx', Buffer.from(out));
```

### 两条写回字节的路径

- `repackDocx(doc)`：对文档**原始 buffer** 选择性回写，未改部件原样带过——文档来自 `parseDocx` 时用它（无原 buffer 会抛错）。
- `createDocx(doc)`：从零构建全新包——用于代码里凭空创建的文档。
- `serializeDocx(doc)`：只返回 `document.xml` 字符串（**不是** `.docx` 文件），仅在需要原始 XML 时用。

## 四、DocumentAgent：链式不可变操作

`DocumentAgent` 把 `Document` 包成链式、不可变 API（每次调用返回新 agent）：

```ts
import { DocumentAgent } from '@eigenpal/docx-editor-core/headless';

const agent = await DocumentAgent.fromBuffer(buffer);
console.log(agent.getWordCount(), agent.getPageCount(), agent.getVariables());

const edited = agent
  .insertText({ paragraphIndex: 0, offset: 0 }, 'CONFIDENTIAL: ')
  .applyStyle(0, 'Heading1');

const filled = await edited.applyVariables({ customer_name: 'Jane Doe', date: '2026-07-01' });
const out = await filled.toBuffer(); // ArrayBuffer（浏览器用 toBlob()）
```

> 还有 `insertTable` / `insertImage` / `insertHyperlink` / `replaceRange` / `deleteRange` / `applyFormatting` / `mergeParagraphs` / `executeCommands` 等。

`getPageCount()` 在 headless 环境没有浏览器字体测量与可见分页结果，只能作为近似值；合同页码、打印份数等流程应在最终渲染环境确认。

## 五、模板变量：<code v-pre>{{mustache}}</code>

headless 内置 docxtemplater 支撑的模板管线：

```ts
import { detectVariables, parseDocx, processTemplate } from '@eigenpal/docx-editor-core/headless';

const doc = await parseDocx(buffer);
console.log(detectVariables(doc)); // ["customer_name", "date"]

const out = processTemplate(buffer, { customer_name: 'Acme GmbH', date: '2026-07-01' }); // ArrayBuffer
```

> 配套 `validateTemplate` / `getMissingVariables` / `previewTemplate` / `processTemplateDetailed` 做校验与报错。

## 六、内容控件：按 tag/alias/id 寻址

Word 内容控件（`w:sdt`，Structured Document Tags）是带稳定 `tag`/`alias`/`id` 的有界区域，是模板与文档自动化的天然锚点（与 <code v-pre>{{mustache}}</code> 是并存的两套系统）：

```ts
import { parseDocx, findContentControls, setContentControlContent } from '@eigenpal/docx-editor-core/headless';

const doc = await parseDocx(buffer);
const all = findContentControls(doc);                    // ContentControlInfo[]
const intro = findContentControls(doc, { tag: 'intro' });

let next = setContentControlContent(doc, { tag: 'intro' }, 'Filled by template');
```

1.9.0 已不只处理块级控件：还支持 inline 与 table-cell 内容控件，并提供 `createContentControl`、`includeHeadersFooters` 查询，以及 `{ all: true }` 的原子批量更新。未建模属性会尽量往返；`showingPlaceholder: true` 时 `text` 是占位样板，不是真数据。锁定、重复区段、数据绑定与跨部件更新都应拿真实模板回归。

---

进入 [指南 · 专家](./expert)：双渲染器架构、AI/agents 三种集成形态（live editor / DocxReviewer / MCP）、自动保存与崩溃恢复、性能与打包、与同类库的选型。
