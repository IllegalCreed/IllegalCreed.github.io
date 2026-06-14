---
layout: doc
outline: [2, 3]
---

# 指南 · 基础

> 版本基线 **DOMPurify 3.x**。本篇把「会调 `sanitize`」用到「会配白名单」：标签/属性白名单的替换与追加、`USE_PROFILES`、`data-*` / `aria-*` 控制、返回类型选择、`KEEP_CONTENT` 与文本保留。

## 一、净化的全流程发生了什么

调 `DOMPurify.sanitize(dirty, config)` 时：

1. **解析**：把 `dirty` 字符串交给浏览器解析器（或 jsdom）变成 DOM 树；
2. **建白名单**：根据 config 确定本次允许的标签集合与属性集合；
3. **遍历清理**：逐元素、逐属性比对白名单，移除不允许的标签（默认保留其文本）与属性（`on*` 事件、危险协议等）；
4. **DOM 安全处理**：`SANITIZE_DOM` 防 DOM Clobbering 等；
5. **输出**：按 `RETURN_DOM` / `RETURN_DOM_FRAGMENT` / `RETURN_TRUSTED_TYPE` 决定返回字符串 / 节点 / 片段 / TrustedHTML（默认字符串）。

> 关键：白名单是「比对」而非「字符串替换」——这是它能保留 `<b>` 却删掉 `<script>`、保留 `href="https://"` 却删掉 `href="javascript:"` 的原因。

## 二、白名单：替换 vs 追加

这是配置 DOMPurify 最该先理解的语义差别。

| 配置 | 语义 | 结果 |
|---|---|---|
| `ALLOWED_TAGS: ['b']` | **替换**默认标签白名单 | 只允许 `<b>`，其余标签移除（文本默认保留） |
| `ADD_TAGS: ['my-x']` | 在默认白名单上**追加** | 默认安全标签 **+** `<my-x>` 都允许 |
| `FORBID_TAGS: ['style']` | 在白名单上**精确移除** | 默认安全标签里**唯独**去掉 `<style>` |

属性侧 `ALLOWED_ATTR` / `ADD_ATTR` / `FORBID_ATTR` 语义完全对应。

```js
// 评论区：只允许极少标签，整体替换
DOMPurify.sanitize(dirty, { ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a'], ALLOWED_ATTR: ['href'] });

// 富文本：保留默认安全标签，但禁掉 style 与 form
DOMPurify.sanitize(dirty, { FORBID_TAGS: ['style', 'form'] });

// 在默认基础上追加一个自定义标签
DOMPurify.sanitize(dirty, { ADD_TAGS: ['my-widget'] });
```

::: tip ADD_TAGS 不会覆盖默认
源码对 `ADD_TAGS` / `ADD_ATTR` 会先**克隆默认集合**再扩展，所以追加不会把其它默认安全标签弄丢。而 `ALLOWED_TAGS` 是直接取代。
:::

## 三、USE_PROFILES：预设白名单

不想逐个列标签时，用 profile 一键启用某类集合：

```js
// 只允许 HTML（排除 SVG、MathML）—— 最常用的「收窄到纯 HTML」
DOMPurify.sanitize(dirty, { USE_PROFILES: { html: true } });

// 同时允许 HTML 与 SVG（含滤镜），用于内联 SVG 图标
DOMPurify.sanitize(dirty, { USE_PROFILES: { html: true, svg: true, svgFilters: true } });

// 允许 MathML
DOMPurify.sanitize(dirty, { USE_PROFILES: { mathMl: true } });
```

可选键：`html`、`svg`、`svgFilters`、`mathMl`。profile 同时决定**标签和属性**集合，比手动 `ADD_TAGS` 列一堆 SVG 标签更可靠（profile 自带配套属性白名单）。

## 四、默认白名单里有什么

不传配置时，DOMPurify 的默认允许集合由源码合并而成：

```text
DEFAULT_ALLOWED_TAGS = html + svg + svgFilters + mathMl + text
DEFAULT_ALLOWED_ATTR = html + svg + mathMl + xml
```

也就是说**默认就允许 HTML + SVG（含滤镜）+ MathML + 文本**——这对「展示富文本」足够，但若你只想要纯 HTML，记得用 `USE_PROFILES: { html: true }` 收窄。

无论如何，`<script>`、`on*` 内联事件、`javascript:` 协议**默认都不在白名单**，一定被清理。

## 五、data-* / aria-* 控制

```js
// 默认：data-* 与 aria-* 都允许
DOMPurify.sanitize('<div data-id="5" aria-label="x">hi</div>');
// → 原样保留 data-id 与 aria-label

// 禁掉所有 data-* 属性
DOMPurify.sanitize(dirty, { ALLOW_DATA_ATTR: false });

// 禁掉所有 aria-* 属性
DOMPurify.sanitize(dirty, { ALLOW_ARIA_ATTR: false });
```

| 配置 | 默认 | 说明 |
|---|---|---|
| `ALLOW_DATA_ATTR` | `true` | 控制 `data-*` 自定义数据属性 |
| `ALLOW_ARIA_ATTR` | `true` | 控制 `aria-*` 无障碍属性 |

## 六、返回类型：要字符串还是节点

默认返回**字符串**，可直接赋给 `innerHTML` / `v-html`。需要直接操作 DOM 时改返回类型：

```js
const str  = DOMPurify.sanitize(dirty);                              // string（默认）
const node = DOMPurify.sanitize(dirty, { RETURN_DOM: true });        // HTMLBodyElement
const frag = DOMPurify.sanitize(dirty, { RETURN_DOM_FRAGMENT: true }); // DocumentFragment
```

- `RETURN_DOM` 返回一个 `HTMLBodyElement`；
- `RETURN_DOM_FRAGMENT` 返回 `DocumentFragment`（更轻、无语义、适合批量插入），内部会强制 `RETURN_DOM`。

## 七、KEEP_CONTENT：移除标签时的文本去留

`KEEP_CONTENT` 默认 `true`：标签被移除时，**保留其内部文本**。

```js
const dirty = '<i>italic</i><b>bold</b>';

DOMPurify.sanitize(dirty, { ALLOWED_TAGS: ['b'] });
// → 'italic<b>bold</b>'  (i 标签去掉，文本 italic 保留)

DOMPurify.sanitize(dirty, { ALLOWED_TAGS: ['b'], KEEP_CONTENT: false });
// → '<b>bold</b>'  (i 连同内容一起删除)
```

需要「连被禁标签内容一起清掉」时，把 `KEEP_CONTENT` 设为 `false`。

---

进入 [指南 · 进阶](./advanced)：`addHook` 定制净化、Trusted Types 集成、Node/jsdom 与 SSR、协议与 URI 控制、iframe 来源校验。
