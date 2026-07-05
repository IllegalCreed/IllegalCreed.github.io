---
layout: doc
outline: [2, 3]
---

# 状态与变体全家桶

> 基于 Tailwind CSS 4.3 · 核于 2026-07

## 速查

- **变体 = 条件前缀**：`前缀:工具类`，把工具类限定在某状态/关系/媒体条件下生效；可**堆叠**（与关系）`dark:md:hover:bg-…`。
- **交互态**：`hover`（v4 默认包在 `@media (hover: hover)`）、`focus`、`focus-visible`（多为键盘焦点）、`focus-within`、`active`、`visited`。
- **表单态**：`disabled`/`enabled`、`checked`/`indeterminate`、`required`、`valid`/`invalid`、`user-valid`/`user-invalid`、`placeholder-shown`、`read-only`、`autofill`、`in-range`/`out-of-range`。
- **结构态**：`first`/`last`/`only`、`odd`/`even`、`first-of-type`、`empty`、`nth-3`/`nth-[3n+1]`、`nth-last-*`。
- **父联动 group**：父加 `group`，子用 `group-hover`/`group-focus`/`group-has-[…]`；具名 `group/item` + `group-hover/item`；免 group 用 `in-*`（响应任意可聚焦祖先）。
- **兄弟联动 peer**：标记 `peer`，用 `peer-checked`/`peer-invalid`/`peer-focus`；具名 `peer/draft` + `peer-checked/draft`；**只能作用于 `peer` 之后的兄弟**。
- **关系态 has**：`has-[:checked]`/`has-[img]` 父随后代变化（对应 CSS `:has()`）；组合 `group-has-*`/`peer-has-*`。
- **取反 not（v4 新增）**：`not-hover:`、`not-supports-[…]:` 对伪类/媒体/`@supports` 取反。
- **属性态**：`aria-checked`/`aria-[sort=ascending]`、`data-active`/`data-[size=large]`（配合 Headless UI/Radix 的 `data-state`）。
- **伪元素**：`before:`/`after:`（需 `content-['']`）、`placeholder:`、`selection:`、`file:`、`marker:`、`first-letter:`。
- **子/后代**：`*:` 直接子元素、`**:` 所有后代。
- **自定义变体**：`@custom-variant`（见 [CSS-first 配置](./css-first-config)）。

## 一、交互与表单状态

最常用的一批伪类变体，直接对应 CSS 伪类：

```html
<button class="bg-violet-500 hover:bg-violet-600 focus-visible:ring-2 active:bg-violet-700 disabled:opacity-50">
  Save
</button>

<input class="border focus:border-sky-500 invalid:border-pink-500 required:border-l-4" />
```

- **`hover` 的 v4 变化**：默认包在 `@media (hover: hover)` 里，只在支持真正悬停的设备生效，纯触屏不会「点一下卡在悬停态」。从 v3 迁移若依赖触屏触发 hover，需留意。
- **`focus` vs `focus-visible`**：前者只要获焦就生效；后者仅在浏览器判定「应显示焦点」（通常是键盘导航）时生效。给按钮加焦点环用 `focus-visible:` 体验更好。
- **表单态**很齐全：`checked`、`disabled`、`required`、`valid`/`invalid`、`placeholder-shown`、`read-only`、`autofill` 等，配合原生表单校验可做出「无 JS 的即时反馈」。

## 二、结构性变体：位置与序号

```html
<li class="py-4 first:pt-0 last:pb-0">…</li>
<tr class="odd:bg-white even:bg-gray-50">…</tr>
<li class="nth-3:underline nth-[3n+1]:font-bold">…</li>
```

`first`/`last`/`only`/`odd`/`even`/`empty`/`first-of-type` 对应同名伪类；`nth-3`、`nth-[3n+1]`、`nth-last-*` 支持任意 `:nth-child()` 表达式。

## 三、group：父状态驱动子样式

父元素标记 `group`，子元素用 `group-*` 响应父级状态——最经典的是「悬停整张卡片，内部文字/图标一起变」：

```html
<a href="#" class="group rounded-lg p-8 hover:bg-sky-500">
  <svg class="stroke-sky-500 group-hover:stroke-white">…</svg>
  <h3 class="text-gray-900 group-hover:text-white">New project</h3>
</a>
```

- **具名 group**：嵌套时用 `group/item` 命名，`group-hover/item:` 精确指向那一层，避免相互干扰。
- **`group-has-*` / `group-aria-*` / `group-data-*`**：group 可与其它变体组合，如「父级内部含链接时显示某图标」`group-has-[a]:block`。
- **`in-*`（免 group）**：`in-focus:` 无需在祖先加 `group`，直接响应「任一可聚焦祖先获焦」，适合快速联动。

## 四、peer：兄弟状态驱动

标记 `peer` 的元素，可让**其后的兄弟**根据它的状态变化。经典场景是表单校验提示：

```html
<label>
  <input type="email" class="peer" required />
  <p class="invisible peer-invalid:visible text-pink-600">请输入有效邮箱</p>
</label>
```

::: warning peer 只能向后，不能向前
受 CSS 相邻/通用兄弟组合器（`+`、`~`）限制，`peer-*` 只能作用于 `peer` 元素**之后**的兄弟。所以要联动的目标元素必须排在那个 `peer`（通常是 input）的**后面**。
:::

具名 peer 处理多个并存的 peer：

```html
<input id="draft" class="peer/draft" type="radio" name="status" checked />
<label class="peer-checked/draft:text-sky-500">草稿</label>
<input id="pub" class="peer/published" type="radio" name="status" />
<label class="peer-checked/published:text-sky-500">已发布</label>
```

## 五、has：父随后代变化（`:has()`）

`has-*` 对应 CSS 关系伪类 `:has()`，让元素根据「是否包含匹配的后代」应用样式——这是**无 JS 联动**的利器：

```html
<!-- 容器里有被选中的 radio 时，整块高亮 -->
<label class="rounded-lg p-4 ring has-[:checked]:bg-indigo-50 has-[:checked]:ring-indigo-500">
  <input type="radio" name="pay" />
  Google Pay
</label>

<div class="has-[img]:p-2">…</div>     <!-- 含 img 后代时加内边距 -->
```

还能组合：`group-has-*`（父的父根据后代变）、`peer-has-*`（兄弟含某后代时变）。

## 六、not：取反（v4 新增）

`not-*` 对伪类、媒体查询、`@supports` 取反：

```html
<button class="bg-indigo-600 hover:not-focus:bg-indigo-700">…</button>
<div class="not-supports-[display:grid]:flex">…</div>
```

`hover:not-focus:` 表示「悬停但未聚焦时」；`not-supports-…:` 表示「浏览器不支持某特性时」的回退样式。

## 七、aria 与 data：跟随属性状态

与组件库/状态机联动的两大变体：

```html
<!-- ARIA：布尔型有内建变体，其它用任意值 -->
<div aria-checked="true" class="bg-gray-600 aria-checked:bg-sky-700">…</div>
<th aria-sort="ascending" class="aria-[sort=ascending]:bg-sky-100">…</th>

<!-- data-*：存在性检测 + 值匹配 -->
<div data-active class="data-active:border-purple-500">…</div>
<div data-size="large" class="data-[size=large]:p-8">…</div>
```

`aria-*`/`data-*` 特别适合配合 Headless UI、Radix 这类库——它们会在元素上写 `data-state="open"` 等属性，你用 `data-[state=open]:` 直接据此设样式，样式与交互状态天然同步。

## 八、伪元素与子/后代变体

```html
<!-- 伪元素：before/after 需要 content -->
<span class="before:content-['→'] before:mr-1">Next</span>
<input class="placeholder:text-gray-400" placeholder="搜索…" />
<p class="selection:bg-yellow-200">选中我看看</p>

<!-- 子/后代：* 直接子元素，** 所有后代 -->
<ul class="*:py-2 **:text-sm">…</ul>
```

`before:`/`after:`/`placeholder:`/`selection:`/`file:`/`marker:`/`first-letter:` 覆盖常见伪元素；`*:` 作用于直接子元素、`**:` 作用于所有后代（谨慎用，选择面大）。

## 九、堆叠：把条件层层叠加

变体堆叠是「与」关系，从左到右逐层限定：

```html
<button class="dark:md:hover:bg-fuchsia-600">…</button>
<input class="focus:invalid:border-pink-500 disabled:opacity-50" />
```

`dark:md:hover:bg-fuchsia-600` = 深色模式 + 视口≥md + 悬停，三者同时满足才生效；`focus:invalid:` = 聚焦且校验不通过时。没有数量上限，但堆太多会难读，必要时抽成组件或自定义变体。

---

变体体系掌握后，下一步进入 [v4 CSS-first 配置](./css-first-config)：`@theme` 设计令牌、`@utility`/`@custom-variant` 自定义、`@apply`/`@reference`/`@source`/`@config` 全套指令与函数。
