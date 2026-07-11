---
layout: doc
outline: [2, 3]
---

# 入门

> 本篇按最后可核验发行版 **1.9.0** 演示「加载 → 编辑 → 保存」，包内许可证 **Apache-2.0**。该版本已被 npm 标为 deprecated，原仓库不可访问；以下内容服务于存量系统维护与迁移评估，不构成新项目选型推荐。

## 速查

- 状态：`1.9.0` 已 deprecated；新生产项目应先选替代方案，存量项目固定精确版本与 lockfile
- 安装（React）：`npm install @eigenpal/docx-editor-react@1.9.0`
- 安装（Vue 3）：`npm install @eigenpal/docx-editor-vue@1.9.0`
- 安装（Nuxt 3/4）：`npm install @eigenpal/nuxt-docx-editor@1.9.0`
- 导入组件 + 样式：`import { DocxEditor } from '@eigenpal/docx-editor-react'` + `import '@eigenpal/docx-editor-react/styles.css'`
- 加载：`<DocxEditor documentBuffer={buf} mode="editing" />`（`buf` 可为 `File`/`Blob`/`ArrayBuffer`/`Uint8Array`/`null`）
- 保存：`const out = await editorRef.current?.save()`（返回 `Promise<ArrayBuffer | null>`）
- 修订模式：`mode="suggesting"`（编辑记成 `w:ins`/`w:del`）
- SSR（Next.js/Remix/Astro）需 client-only 边界；Nuxt 模块可自动注册客户端组件

## 一、docx-editor 是什么

官方定位：「**WYSIWYG `.docx` editor for React and Vue**」。三个关键点：

1. **可编辑**：在浏览器里所见即所得地改 Word 文档，区别于 docx（生成）/mammoth（解析）/docx-preview（只读）。
2. **保真 + 无损**：用 Word 度量计算分页（canonical OOXML），未编辑的部件逐字节带过。
3. **客户端优先**：解析/渲染/编辑/序列化都在浏览器，不上传文档、不调转换 API。

> 边界提醒：它不是「全功能 Word」。部分高级 Word 构造是「保留（preserved，往返不丢但不可编辑）」而非「可编辑」，以官方 [Word fidelity](https://www.docx-editor.dev/docs/1.x/word-fidelity) 矩阵为准。

## 二、安装：选一个适配器即可

适配器会把 `-core` 与 `-i18n` 作为传递依赖带入，多数应用一次安装即可：

```bash
# React（存量系统锁定最后可核验版）
npm install @eigenpal/docx-editor-react@1.9.0

# Vue 3
npm install @eigenpal/docx-editor-vue@1.9.0

# Nuxt 3 & 4（封装 Vue 适配器的模块）
npm install @eigenpal/nuxt-docx-editor@1.9.0

# 无 UI 的服务端处理
npm install @eigenpal/docx-editor-core@1.9.0

# AI / agent 工具（叠加在适配器之上）
npm install @eigenpal/docx-editor-agents@1.9.0
```

::: danger 安装成功不等于适合新项目
npm 的 deprecated 状态不会阻止安装。存量系统继续使用时，应把精确版本、lockfile 与完整性哈希纳入制品，并保留一组真实 `.docx` 的加载、编辑、保存、Word 重开回归；不要依赖浮动版本或在线仓库始终可用。
:::

::: warning ProseMirror 是 peer 依赖
为避免重复的编辑器状态包导致状态分裂，`prosemirror-*` 系列被声明为 `peerDependencies`。npm 7+ 会自动安装；**pnpm（关闭 peer 自动安装）/ Yarn PnP** 需显式补齐：

```bash
npm i prosemirror-commands prosemirror-dropcursor prosemirror-history \
      prosemirror-keymap prosemirror-model prosemirror-state \
      prosemirror-tables prosemirror-transform prosemirror-view
```
:::

::: warning TypeScript 项目先跑一次真实检查
1.9.0 的 `@eigenpal/docx-editor-i18n/dist/index.d.ts` 实际包含 JavaScript 初始化代码，`tsc` 在 `skipLibCheck: false` 下会报 TS1046/TS1039。隔离验证中，Vue 3 + `vue-tsc` 在 `skipLibCheck: true` 下可通过，但这只是绕过依赖声明检查；采用前应确认团队是否接受该折衷，并把替换/fork 纳入计划。
:::

## 三、挂载：组件 + 样式表缺一不可

```tsx
import { DocxEditor } from '@eigenpal/docx-editor-react';
import '@eigenpal/docx-editor-react/styles.css'; // 不导入则工具栏无样式

export default function App() {
  return <DocxEditor documentBuffer={null} />; // null = 立即挂一个空文档
}
```

> 样式作用域在 `.ep-root` 下，**不会泄漏**到你的应用。不导入 `styles.css` 编辑器仍能工作，但工具栏会渲染成无样式。

Vue 的基础加载写法相近，但完整 props/ref 不能按 React 原样照搬：

```vue
<script setup lang="ts">
import { DocxEditor } from '@eigenpal/docx-editor-vue';
import '@eigenpal/docx-editor-vue/styles.css';
</script>

<template>
  <DocxEditor :document-buffer="null" />
</template>
```

## 四、第一次「加载」

`documentBuffer` 接受一个 `DocxInput`：`ArrayBuffer | Uint8Array | Blob | File`。三种「哨兵状态」要分清：

- 传 **buffer** → 挂载该文档；
- 传 **`null`** → 立即挂一个空文档（适合从零录入）；
- 传 **`undefined`** → 推迟挂载，避免 fetch 在途时的空状态闪烁。

从**文件选择器**加载（`File` 本身就是合法输入）：

```tsx
import { useState } from 'react';
import { DocxEditor } from '@eigenpal/docx-editor-react';

export function FileEditor() {
  const [file, setFile] = useState<File | null>(null);
  return (
    <>
      <input
        type="file"
        accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
      />
      {file && <DocxEditor documentBuffer={file} mode="editing" />}
    </>
  );
}
```

从**远程 URL** 加载（`.docx` 是二进制 ZIP，**必须**取 `arrayBuffer()`，不能用 `text()`）：

```tsx
const [buf, setBuf] = useState<ArrayBuffer | null>(null);
useEffect(() => {
  fetch(url).then((r) => r.arrayBuffer()).then(setBuf);
}, [url]);
return <DocxEditor documentBuffer={buf} />;
```

## 五、第一次「保存」

通过 `ref` 调 `save()`，它返回 `Promise<ArrayBuffer | null>`（无文档时为 `null`，**务必判空**）：

```tsx
import { useRef } from 'react';
import { DocxEditor, type DocxEditorRef } from '@eigenpal/docx-editor-react';

const ref = useRef<DocxEditorRef>(null);
// ... <DocxEditor ref={ref} documentBuffer={buf} />
const out = await ref.current?.save(); // ArrayBuffer | null
```

React 还可用 `onSave` prop 接住用户通过工具栏（Ctrl/Cmd+S 或文件菜单）触发的保存；Vue 1.9.0 没有同名 prop，应由宿主按钮调用 ref：

```tsx
<DocxEditor
  ref={ref}
  documentBuffer={buf}
  onSave={async (out) => {
    await fetch(`/api/documents/${docId}`, { method: 'PUT', body: out });
  }}
/>
```

拿到 `ArrayBuffer` 后在浏览器触发下载（包成正确 MIME 的 Blob）：

```ts
async function downloadDocx(ref: DocxEditorRef, fileName: string) {
  const buf = await ref.save();
  if (!buf) return; // 判空
  const blob = new Blob([buf], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName.endsWith('.docx') ? fileName : `${fileName}.docx`;
  a.click();
  URL.revokeObjectURL(url);
}
```

## 六、一个易忘点：SSR 必须 client-only

编辑器挂载时要在 **DOM 中测量文本**，因此必须客户端渲染。纯客户端应用（Vite、普通 Vue）无需特殊处理；SSR 框架需要一个 client-only 边界：

```tsx
// Next.js：动态导入并禁用 SSR
import dynamic from 'next/dynamic';
const DocxEditor = dynamic(
  () => import('@eigenpal/docx-editor-react').then((m) => m.DocxEditor),
  { ssr: false }, // 否则会 "window is not defined"
);
```

> Nuxt 用官方模块 `@eigenpal/nuxt-docx-editor` 即可：它自动注册一个 **SSR 安全**的 `<DocxEditor>`，无需手动 `import`、无需 `<ClientOnly>`。

---

跑通「加载→编辑→保存」后，进入 [指南 · 基础](./guide-line/base)：mode 三态、修订追踪、批注、`documentBuffer` 哨兵状态、ref 方法与选择性往返的边界。
