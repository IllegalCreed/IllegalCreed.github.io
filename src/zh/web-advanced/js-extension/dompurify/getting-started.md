---
layout: doc
outline: [2, 3]
---

# 入门

> 本篇讲 **DOMPurify 的基本用法**：它是什么、为什么要用、`sanitize` 怎么调、与 `v-html` / `dangerouslySetInnerHTML` 怎么配套。版本基线 **DOMPurify 3.x**。对比对象：手写正则过滤、HTML 转义。

## 速查

- 安装：`npm i dompurify`（TS 类型已内置，无需额外 `@types`）
- 引入：`import DOMPurify from 'dompurify'`（默认导出）
- 净化：`const clean = DOMPurify.sanitize(dirty)` → 返回**安全的 HTML 字符串**
- 带配置：`DOMPurify.sanitize(dirty, { ALLOWED_TAGS: ['b', 'i', 'a'] })`
- 核心认知：**解析成 DOM → 按白名单清理 → 序列化**，不是「字符转义」也不是「正则删标签」
- ⚠️ 必须**先净化、再插入**：写入 `innerHTML` 即解析执行，净化要赶在执行之前
- ⚠️ Node 端没有 DOM，需 **jsdom** 提供 `window`（见[进阶篇](./guide-line/advanced)）

## 一、DOMPurify 是什么

官方一句话定位：「**a DOM-only, super-fast, uber-tolerant XSS sanitizer for HTML, MathML and SVG**」。拆开看三个关键点：

1. **DOM-only**：它依赖 DOM——借**浏览器自身的解析器**把脏 HTML 解析成真实 DOM 树，再清理。这正是它抗绕过的根基。
2. **XSS sanitizer**：它做的是**净化**（移除危险标签/属性），不是**转义**（把 `<` 变 `&lt;`）。净化后安全标签仍以 HTML 形式渲染。
3. **HTML / MathML / SVG**：覆盖这三类标记，默认白名单都包含。

> 边界提醒：DOMPurify **只净化、不渲染**。它不把 Markdown / 模板变成 HTML，只负责把「已经是 HTML 的字符串」清洗干净。

## 二、为什么不用正则自己过滤

很多人第一反应是「正则把 `<script>` 删掉不就行了」。这是危险的误区：

- HTML 解析容错极强：大小写（`<ScRiPt>`）、编码实体、属性折行、注释嵌套、SVG/MathML 命名空间……正则无法穷尽所有变体；
- 攻击者总能构造**绕过 payload**（例如 `<img src=x onerror=...>`、`<svg/onload=...>`）；
- 还有 **mutation XSS（mXSS）**：一段「看着安全」的 HTML 在解析→序列化→再解析时被浏览器规范化「变异」成可执行结构。

DOMPurify 复用浏览器解析器，从源头消除「解析差异」带来的绕过——这是手写正则无论如何补不全的。

## 三、第一条净化

```js
import DOMPurify from 'dompurify';

const dirty = '<img src=x onerror=alert(1)><b>hello</b>';
const clean = DOMPurify.sanitize(dirty);
// → '<img src="x"><b>hello</b>'  (onerror 被剥离，img 与 b 保留)

document.getElementById('app').innerHTML = clean; // 安全
```

`sanitize` 做了三件事：

- **解析**：把 `dirty` 交给浏览器解析器变成 DOM；
- **清理**：移除不在白名单的标签（`<script>` 等）与属性（`on*` 事件、`javascript:` 协议等）；
- **序列化**：默认返回净化后的**字符串**。

## 四、与框架配套：先净化，再渲染

`v-html` / `dangerouslySetInnerHTML` / `innerHTML` 都会**绕过框架的自动转义**直接写 HTML，是 XSS 入口。统一套路：**先 `sanitize`，把结果交给它们**。

::: code-group

```vue [Vue]
<script setup lang="ts">
import DOMPurify from 'dompurify';
import { computed } from 'vue';
const props = defineProps<{ raw: string }>();
// 计算属性里净化，模板只绑定净化后的结果
const safeHtml = computed(() => DOMPurify.sanitize(props.raw));
</script>

<template>
  <div v-html="safeHtml" />
</template>
```

```tsx [React]
import DOMPurify from 'dompurify';

function RichText({ raw }: { raw: string }) {
  const __html = DOMPurify.sanitize(raw);
  return <div dangerouslySetInnerHTML={{ __html }} />;
}
```

```js [原生 DOM]
import DOMPurify from 'dompurify';
el.innerHTML = DOMPurify.sanitize(raw);
```

:::

## 五、为什么必须「先净化、后插入」

XSS 触发点是 HTML 被**解析并执行**的那一刻（写入 `innerHTML` 等）。如果**先插入脏 HTML 再清理**，注入的脚本/事件可能在清理前就已执行，净化形同虚设。所以：

> **在内存里把字符串净化好，再写入页面。** 且别让其它库在净化之后又去改写这段 HTML（否则可能 void 掉净化效果）。

## 六、净化 ≠ 转义（关键辨析）

| 维度 | 净化（DOMPurify） | 转义（escape） |
|---|---|---|
| 手段 | 解析成 DOM，按白名单删危险节点 | 把 `< > & "` 等变成实体 |
| `<b>x</b>` 结果 | 仍是 `<b>x</b>`，**渲染为粗体** | 变成 `&lt;b&gt;x&lt;/b&gt;`，**显示成文本** |
| 适用 | 要**安全地渲染富文本** | 只想把内容当**纯文本**显示 |

需要展示用户富文本（保留部分标签）→ 用 DOMPurify；只想纯文本展示 → 用框架默认的文本插值（如 `{{ }}`）即可，无需 DOMPurify。

---

掌握基本用法后，进入 [指南 · 基础](./guide-line/base)：白名单配置（`ALLOWED_TAGS` / `FORBID_TAGS`）、`USE_PROFILES`、`data-*` / `aria-*` 控制、返回类型选择。
