---
layout: doc
outline: [2, 3]
---

# 指南 · 基础

> 版本基线 **1.9.0（已 deprecated）**。本篇把「会加载保存」用到「懂模型」：`mode` 三态、`documentBuffer` 哨兵状态、**修订追踪**（tracked changes）、批注、ref 方法，以及选择性 OOXML 往返的真实边界。

## 速查

- 模式：`editing` 直接修改、`suggesting` 生成修订、`viewing` 查看；`readOnly` 是另一层输入开关
- 输入：buffer 加载文件、`null` 建空文档、`undefined` 推迟挂载；预解析树走 `document`
- 修订：保存为 Word 原生 `w:ins` / `w:del`；接受/拒绝命令需要 ProseMirror `view`
- 主动保存：调用 ref 的 `save()`；工具栏保存回调以所用适配器的 1.9.0 类型为准
- 往返：未改部件尽量原样保留，改过的 XML 会重写；这不是字节级相同或任意 Word 特性零损失
- 风险：1.9.0 已 deprecated 且仓库不可访问，必须用真实文档做 Word 重开回归

## 一、三种 mode：editing / suggesting / viewing

`EditorMode` = `'editing' | 'suggesting' | 'viewing'`（默认 `editing`）：

| mode | 行为 |
|---|---|
| `editing` | 正常编辑，改动直接写入文档 |
| `suggesting` | **修订模式**：每次编辑变成一条修订（插入下划线、删除删除线），带作者与时间 |
| `viewing` | 带工具栏的**只读**查看 |

```tsx
const [mode, setMode] = useState<EditorMode>('editing');
<DocxEditor documentBuffer={buf} mode={mode} onModeChange={setMode} />;
```

> 传 `onModeChange` 表示你自己持有 mode 状态；不传则编辑器内部管理（用户可在工具栏的模式选择器切换）。

::: tip mode 与 readOnly 是两回事
`readOnly` 禁用一切输入手段（打字、工具栏、对话框）但**保留完整分页渲染**；`mode` 控制「编辑还是记修订还是只看」。想「能读但仍可加建议」用 `mode="suggesting"`，想「纯查看器」用 `readOnly` + `showToolbar={false}`。两者相互独立。
:::

## 二、documentBuffer 的三种哨兵状态

`documentBuffer` 接受 `DocxInput`（`ArrayBuffer`/`Uint8Array`/`Blob`/`File`），另有三种值含义不同：

```tsx
<DocxEditor documentBuffer={buf} />        // 挂载该文档
<DocxEditor documentBuffer={null} />       // 立即挂一个空文档（从零录入）
<DocxEditor documentBuffer={undefined} />  // 推迟挂载，避免 fetch 在途的空状态闪烁
```

> 若已持有解析好的 `Document` 树（来自 `@eigenpal/docx-editor-core`），用 `document` prop 传入即可跳过解析器。

## 三、修订追踪：写进 .docx 的是真 OOXML

在 `suggesting` 模式下，每次编辑都成为修订而非直接改动，并序列化为 Word 原生的 **`<w:ins>` / `<w:del>`**，Word 审阅窗格可识别这些记录；复杂结构仍需用目标 Word 版本回归。

```tsx
<DocxEditor documentBuffer={buf} author="Jess Lin" mode="suggesting" />
```

被追踪的不止行内文本，还包括：

- **文本**插入/删除/替换（显示为「Replaced X with Y」）
- **段落结构**：段落断点、段落属性变化
- **表格**：行/单元格的增删合并、行/单元格/表格属性变化
- **图片**：插入/删除
- **列表**：编号变化（拒绝时同时回退文本与编号）

> 这些都作为真实 OOXML 修订往返，不是编辑器私有状态。每条修订记录创建时间戳；`author` 与日期都能经保存、重载后保留。

### 接受/拒绝修订（API）

侧栏按钮背后是 `@eigenpal/docx-editor-core/prosemirror/commands` 的 ProseMirror 命令：

```tsx
import { acceptAllChanges } from '@eigenpal/docx-editor-core/prosemirror/commands';

// 用 onEditorViewReady 捕获 view，再对 view 运行命令
<DocxEditor documentBuffer={buf} onEditorViewReady={(v) => (viewRef.current = v)} />;
// ...
const view = viewRef.current;
if (view) acceptAllChanges()(view.state, view.dispatch);
```

> 还有 `acceptChangeById(id)` / `rejectChangeById(id)` / `rejectAllChanges()`。枚举修订用 `extractTrackedChanges(state)`。

## 四、用代码提一条修订：proposeChange

`DocxEditorRef.proposeChange` 不靠用户打字，按段落的 `w14:paraId` 锚定插入一条 tracked 替换（找不到段落或搜索文本时返回 `false`）：

```ts
ref.current?.proposeChange({
  paraId: 'ABC12300',
  search: 'thirty (30) days',
  replaceWith: 'sixty (60) days',
  author: 'Contract Bot',
});
```

> 这是「AI 红线（redlining）」构建于其上的原语。

## 五、回调：onChange / onSave / onError（React）

```tsx
<DocxEditor
  documentBuffer={buf}
  onChange={(doc) => {/* 每次文档变更，参数是解析后的 Document */}}
  onSave={(out) => {/* 用户经工具栏 Ctrl/Cmd+S 触发保存，out 是 ArrayBuffer */}}
  onError={(err) => report(err) /* 解析/渲染错误从这里抛出 */}
/>
```

> 区别：`ref.save()` 是你**主动**要字节（自动保存、自定义保存按钮）；React 的 `onSave` 是用户**通过内置 UI** 触发保存时的回调。Vue 1.9.0 的公开 props 没有同名 `onSave`，应由宿主按钮调用 ref。

## 六、「无损往返」到底是什么意思

`.docx` 是一堆 XML 部件的 ZIP，Word 还会写很多编辑器无须建模的 XML（书签、自定义 XML、邮件合并域、兼容性设置、VBA 工程……）。docx-editor 的管线是 **解析 → 文档模型 → 编辑 → 序列化**，保存时：

- 只重写它改过的部件（正文，以及被改动的页眉/页脚/批注/注释）；
- 其余未触及部件（`styles.xml`、主题、字体表、设置、媒体、关系、自定义 XML、VBA、嵌入字体、OLE 对象）尽量**逐字节从原 ZIP 带过**；
- 未触及部件里的关系 ID、书签名、域代码、样式 ID、编号定义因而更有机会保持原样；
- 输出是 **canonical OOXML**：修订是 Word 审阅窗格认得的真 `w:ins`/`w:del`，主题色保持主题引用。

::: warning 「无损」≠「字节级相同」
ZIP 容器会被重建、改动过的 XML 会被重新序列化，所以空白与部件顺序可能不同。目标是尽可能**语义保留**，但不能推导为所有 Word 构造都零损失。官方保真说明列出的已知例外包括部分 run 级 legacy VML shape（watermark 除外）；仓库当前又无法提交 issue，因此要保留原件并对业务模板逐份做打开、保存、Word 重开与差异检查。
:::

---

进入 [指南 · 进阶](./advanced)：React 端 Yjs 协同、受控批注同步、headless 服务端处理、`DocumentAgent` 与模板填充、内容控件。
