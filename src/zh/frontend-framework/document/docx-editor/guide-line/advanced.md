---
layout: doc
outline: [2, 3]
---

# 指南 · 进阶

> 版本基线 **1.5.0**。把 docx-editor 用进真实项目：基于 **Yjs** 的实时协同、受控批注同步、**headless** 服务端解析/序列化/模板填充、`DocumentAgent` 链式操作、内容控件（content controls）。

## 一、实时协同：基于 Yjs（CRDT）

把 `DocxEditor` 绑定到一个 Yjs 文档即可获得多用户实时编辑：光标、在场（presence）、批注同步、修订归属。要点是把 `document` 当 schema 种子并设 **`externalContent`**（禁用内置加载，改由 Yjs 填充），再用 **`externalPlugins`** 传入 `y-prosemirror` 的插件：

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

## 五、模板变量：{{mustache}}

headless 内置 docxtemplater 支撑的模板管线：

```ts
import { detectVariables, parseDocx, processTemplate } from '@eigenpal/docx-editor-core/headless';

const doc = await parseDocx(buffer);
console.log(detectVariables(doc)); // ["customer_name", "date"]

const out = processTemplate(buffer, { customer_name: 'Acme GmbH', date: '2026-07-01' }); // ArrayBuffer
```

> 配套 `validateTemplate` / `getMissingVariables` / `previewTemplate` / `processTemplateDetailed` 做校验与报错。

## 六、内容控件：按 tag/alias/id 寻址

Word 内容控件（`w:sdt`，Structured Document Tags）是带稳定 `tag`/`alias`/`id` 的有界区域，是模板与文档自动化的天然锚点（与 `{{mustache}}` 是并存的两套系统）：

```ts
import { parseDocx, findContentControls, setContentControlContent } from '@eigenpal/docx-editor-core/headless';

const doc = await parseDocx(buffer);
const all = findContentControls(doc);                    // ContentControlInfo[]
const intro = findContentControls(doc, { tag: 'intro' });

let next = setContentControlContent(doc, { tag: 'intro' }, 'Filled by template');
```

> 编辑器会把块级控件解析进文档模型、保持可编辑、渲染边界并无损往返（含 `w:dataBinding`、`w15:repeatingSection` 等未建模属性）。`showingPlaceholder` 为 `true` 时 `text` 是占位样板，不是真数据。

---

进入 [指南 · 专家](./guide-line/expert)：双渲染器架构、AI/agents 三种集成形态（live editor / DocxReviewer / MCP）、自动保存与崩溃恢复、性能与打包、与同类库的选型。
