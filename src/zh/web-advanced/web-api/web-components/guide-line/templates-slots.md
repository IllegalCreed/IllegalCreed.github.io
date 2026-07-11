---
layout: doc
outline: [2, 3]
---

# template、slot 与声明式 Shadow DOM

> 基于 WHATWG HTML/DOM 现行标准与各浏览器 Baseline 状态 · 核于 2026-07

## 速查

- **`<template>` 本质**：内容**解析但不渲染**——不出现在渲染树、脚本不执行、图片不加载；内容挂在 `template.content`（一个 **`DocumentFragment`**）上，随取随用。
- **必须克隆再用**：`template.content` 直接 `appendChild` 会把内容**搬走**（fragment 被掏空，模板一次性报废）；标准姿势 `template.content.cloneNode(true)` 或 `document.importNode(template.content, true)` **深克隆**。
- **template + 组件**：构造函数/`connectedCallback` 里克隆模板塞进影子根——**解析一次、千百实例共享**，比每实例 `innerHTML` 更省。
- **`<slot>` 本质**：影子树里的**内容投影占位符**——使用者写在宿主标签内的 light DOM 子节点，按名字分发到对应插槽的位置渲染。
- **命名匹配**：影子树 `<slot name="title">` ↔ light DOM 子节点 `slot="title"` 属性，二者字符串精确匹配。
- **默认插槽**：`name` 与 `slot` 属性都**默认空串**——不带 `name` 的 `<slot>` 接住所有未标 `slot` 的子节点；多个节点可进同一插槽（按源顺序排列）。
- **重名规则**：同名 `<slot>` 出现多个时，内容只分发给**文档序第一个**；light DOM 侧多个节点标同一 `slot` 值则**都**进去。
- **Fallback 内容**：`<slot>` 标签内部的子节点是**后备内容**——没有任何节点分发进来时才渲染；有分发则被完全替换。
- **分发是"投影"不是"搬家"**：被分发节点**仍在 light DOM**（`parentNode` 还是宿主），只是渲染位置到了插槽处——所以页面 CSS 仍然能样式化它们（这与影子树内部节点截然不同）。
- **`slotchange` 事件**：插槽的**分发节点集合变化**时在 `<slot>` 上触发（首个分发也触发）；注意它**不冒泡出影子树**（composed: false），须在 slot 或影子根上监听。
- **查询三 API**：`slot.assignedNodes()` / `slot.assignedElements()`（加 `{ flatten: true }` 可展开嵌套 slot 与 fallback）；反向用 `el.assignedSlot` 查节点被分到了哪个插槽。
- **手动分发模式**：`attachShadow({ slotAssignment: "manual" })` 后自动匹配失效，改用 **`slot.assign(...nodes)`** 显式指派——适合按任意逻辑（而非 slot 属性）动态决定内容归属；声明式对应 `shadowrootslotassignment="manual"`。
- **声明式 Shadow DOM（DSD）**：`<template shadowrootmode="open|closed">` ——HTML 解析器遇到即**就地转为影子根**挂到父元素上，template 元素本身从 DOM 移除；**Baseline Newly available 2024-08-05**（Chrome/Edge 111、Firefox 123、Safari 16.4）。
- **DSD 的价值**：服务端直出组件内部结构，**零 JS 即有完整首渲**（免 FOUC/布局跳动）；且内容**流式解析**（边收边渲染），是 Web Components SSR 的基石。
- **水合模式**：组件 JS 加载后，构造函数里查 `this.internals_.shadowRoot`（或 open 模式 `this.shadowRoot`）——**已有就复用**（接管既有 DOM），没有才 `attachShadow` 走客户端渲染；对带声明式影子根的元素调 `attachShadow()` **不抛错**，而是清空后返回该根。
- **DSD 三个限制**：只有 **HTML 解析器**认（JS 设置 `shadowrootmode` 属性无效）；`innerHTML`/`insertAdjacentHTML` **不解析** DSD，动态注入须用 `setHTMLUnsafe()`/`parseHTMLUnsafe()`；每元素仍只一棵影子根。
- **序列化**：`el.getHTML({ serializableShadowRoots: true })` 把影子树序列化回 `<template shadowrootmode>` 形态——配合 `serializable: true`/`shadowrootserializable` 使用。
- **DSD 配套属性**：`shadowrootdelegatesfocus`、`shadowrootclonable`、`shadowrootserializable`、`shadowrootslotassignment`、`shadowrootcustomelementregistry`，与 `attachShadow()` 选项一一对应。
- **特性检测**：`HTMLTemplateElement.prototype.hasOwnProperty("shadowRootMode")`；历史注意：Chrome 90 曾短暂支持旧的非标 `shadowroot` 属性，已废弃，一律写 `shadowrootmode`。

## 一、`<template>`：解析但不渲染的惰性标记

`<template>` 里的内容是"冻结"的：

- **不渲染**——不进渲染树，`display` 都谈不上；
- **不激活**——脚本不执行、`<img>` 不发请求、`<video>` 不加载；
- **随处合法**——内容不受父元素内容模型约束（如 `<td>` 可以直接放在 template 里而不需要包 table）。

内容通过 `template.content` 访问，拿到的是一个 **`DocumentFragment`**：

```html
<template id="row-tpl">
  <tr><td class="name"></td><td class="email"></td></tr>
</template>

<script>
  const tpl = document.getElementById("row-tpl");

  // 错误示范：直接 append 会把 fragment 的子节点"搬走"，模板被掏空，只能用一次
  // tbody.appendChild(tpl.content);

  // 正确：深克隆一份再用，模板可无限复用
  const row = tpl.content.cloneNode(true); // 或 document.importNode(tpl.content, true)
  row.querySelector(".name").textContent = "张三";
  row.querySelector(".email").textContent = "zhang@example.com";
  tbody.appendChild(row);
</script>
```

`cloneNode(true)` 与 `document.importNode(content, true)` 在这里效果等价（后者语义是"从别的文档导入"，MDN 示例惯用它），记住**深克隆标志 `true` 不能少**。

**与组件结合**：把组件的内部结构写成 `<template>`，每个实例克隆一份塞进影子根——浏览器**只解析一次模板**，千百个实例共享解析成果；模板里的 `<style>` 进了影子树后自动获得作用域隔离：

```js
customElements.define(
  "my-paragraph",
  class extends HTMLElement {
    constructor() {
      super();
      const tpl = document.getElementById("my-paragraph-tpl");
      this.attachShadow({ mode: "open" }).appendChild(
        tpl.content.cloneNode(true), // 克隆模板作为影子树内容
      );
    }
  },
);
```

## 二、`<slot>`：把使用者的内容投影进影子树

影子树把内部结构封起来了，但组件总要接收使用者的内容（按钮文字、卡片正文）——`<slot>` 就是留在影子树里的"投影窗口"：

```html
<!-- 影子树模板：两个命名插槽 + 一个默认插槽 -->
<template id="card-tpl">
  <style>
    header { font-weight: bold; }
  </style>
  <header><slot name="title">未命名卡片</slot></header>
  <main><slot></slot></main>
  <footer><slot name="footer"></slot></footer>
</template>

<!-- 使用侧：light DOM 子节点按 slot 属性对号入座 -->
<info-card>
  <h2 slot="title">季度报告</h2>
  <p>正文第一段（未标 slot，进默认插槽）</p>
  <p>正文第二段（同样进默认插槽，按源顺序排列）</p>
  <small slot="footer">2026-07</small>
</info-card>
```

规则清单：

- **匹配**：子节点 `slot="title"` ↔ 影子树 `<slot name="title">`，字符串精确匹配；
- **默认插槽**：`name`/`slot` 属性都默认空串——无 `name` 的 slot 接住所有未标 `slot` 的内容；
- **重名**：影子树里多个同名 slot，内容只给**第一个**；light DOM 里多个节点标同一 slot 名则**全部**分发进去；
- **Fallback**：`<slot>` 的子内容是后备——上例没提供 title 时显示"未命名卡片"，提供了则整个后备被替换；
- **术语**：能被分发的节点叫 *slottable*，分发完成叫 *slotted*。

**最重要的心智**：分发是**投影（projection）而非移动**。`<h2 slot="title">` 的 `parentNode` 依然是 `<info-card>`（它还在 light DOM），只是**渲染位置**出现在插槽处。推论：

- 页面全局 CSS **仍能**样式化这些被分发节点（它们不在影子树里）；
- 影子树内部想样式化它们要用 `::slotted()`（只能选顶层，见[上一页](./shadow-dom)）；
- `document.querySelector` 也能直接查到它们。

## 三、slotchange 与插槽查询 API

插槽的分发集合是动态的（使用者随时增删子节点），组件用 `slotchange` 事件响应：

```js
const slot = this.shadowRoot.querySelector("slot[name=title]");
slot.addEventListener("slotchange", () => {
  // 首次分发和每次分发集合变化都触发
  const nodes = slot.assignedNodes(); // 分发进来的节点（含文本节点）
  const els = slot.assignedElements(); // 只要元素
  console.log("title 插槽现在有", els.length, "个元素");
});
```

- `assignedNodes()`/`assignedElements()` 默认只返回**直接分发**的节点；传 `{ flatten: true }` 会展开"slot 套 slot"的转发链并把 fallback 计算在内；
- 反方向查询：light DOM 节点的 `el.assignedSlot`（`Element` 与 `Text` 都有）返回它被分到的 `<slot>`，未分发返回 `null`；
- `slotchange` **不穿出影子树**（composed: false），监听要挂在 slot 元素或影子根上。

## 四、手动插槽分配：slotAssignment: "manual"

默认的命名分发要求使用者在子节点上写 `slot` 属性；某些场景（按内容类型自动归类、不想暴露 slot 属性契约）希望组件自己决定谁进哪个槽——手动模式：

```js
const shadow = host.attachShadow({
  mode: "open",
  slotAssignment: "manual", // 关闭自动匹配
});
```

```js
// 手动模式下 slot 属性被忽略，必须显式 assign
const slot = shadow.querySelector("slot");
const title = host.querySelector("span");
slot.assign(title); // 参数是若干节点；再次调用会整体替换上次的指派
```

注意手动模式下 `assign()` 是**全量替换**语义（不是追加），且被指派节点必须是宿主的直接子节点。声明式写法用 `shadowrootslotassignment="manual"`（下一节）。日常组件绝大多数用默认 `"named"` 即可，手动模式是留给"分发逻辑本身需要编程"的少数场景。

## 五、声明式 Shadow DOM：SSR 的关键拼图

命令式 `attachShadow()` 有个结构性缺陷：**影子树必须等 JS 跑起来才存在**。服务端渲染输出的 HTML 里没有影子树，首屏要么白块（FOUC）、要么布局跳动。**声明式 Shadow DOM**（Declarative Shadow DOM，DSD）补上了这块：

```html
<user-card>
  <!-- 解析器遇到带 shadowrootmode 的 template：
       立即把内容转为影子根挂到父元素 user-card 上，template 本身从 DOM 消失 -->
  <template shadowrootmode="open">
    <style>
      :host { display: inline-block; border: 1px solid #ccc; }
    </style>
    <div class="name">张三</div>
    <slot name="title">未填写头衔</slot>
  </template>
  <span slot="title">高级前端工程师</span>
</user-card>
```

关键事实：

- **解析期生效**：解析器读到开标签就建影子根，模板内容**直接流式解析进影子根**——大文档边下载边渲染，不等整页；
- **零 JS 首渲**：上面这段 HTML 不加载任何脚本也能以完整样式渲染——组件 JS 只负责后续交互（水合）；
- **Baseline Newly available 2024-08-05**：Chrome/Edge 111（标准属性 + 流式行为）、Firefox 123、Safari 16.4；历史上 Chrome 90 曾支持旧的非标 `shadowroot` 属性（无流式行为），已废弃，一律写 **`shadowrootmode`**。

### 水合：组件 JS 与既有影子根会师

组件定义加载后，构造函数不能盲目 `attachShadow` + 重建内容——服务端可能已经渲染好了。官方推荐模式（web.dev）：

```js
class UserCard extends HTMLElement {
  constructor() {
    super();
    const internals = this.attachInternals();
    let shadow = internals.shadowRoot; // 检查是否已有（声明式）影子根；closed 模式也拿得到
    if (!shadow) {
      // 纯客户端场景：自己建树、自己渲染
      shadow = this.attachShadow({ mode: "open" });
      shadow.appendChild(template.content.cloneNode(true));
    }
    // 已有 DSD：直接复用既有 DOM，只挂事件、接管状态
    shadow.querySelector(".name").addEventListener("click", () => { /* … */ });
  }
}
```

- 用 `ElementInternals.shadowRoot` 检查的好处：**closed 模式的声明式影子根也能拿到**（`this.shadowRoot` 只在 open 时非空）；
- 特殊行为：对已带**声明式**影子根的元素调用 `attachShadow()` **不抛错**，而是**清空该影子根并返回**——"放弃服务端内容、客户端全量重建"的语义，也可作为简化水合的手段（代价是丢掉 SSR 成果）。

### 限制与配套 API

- **只有 HTML 解析器认得**：JS 里 `template.setAttribute("shadowrootmode", "open")` 什么也不会发生；
- **fragment 解析不处理 DSD**：出于安全（防止意外注入影子根），`innerHTML`、`insertAdjacentHTML()` 不解析 `shadowrootmode`——动态注入含 DSD 的 HTML 必须用显式"知情"API：`el.setHTMLUnsafe(html)` 或 `Document.parseHTMLUnsafe(html)`；
- **Constructable Stylesheets 无法声明式表达**：`adoptedStyleSheets` 是 JS 对象，DSD 里只能内联 `<style>`，共享样式表要在水合时补挂；
- **序列化（反向操作）**：`el.getHTML({ serializableShadowRoots: true })` 能把影子树重新序列化为 `<template shadowrootmode>` 形态——前提是影子根创建时标了 `serializable: true`（声明式对应 `shadowrootserializable` 属性）；
- **配套属性全家福**（与 `attachShadow()` 选项一一对应）：`shadowrootdelegatesfocus`、`shadowrootclonable`、`shadowrootserializable`、`shadowrootslotassignment`、`shadowrootcustomelementregistry`；
- **特性检测**：

```js
function supportsDSD() {
  // 支持 DSD 的浏览器，template 元素原型上有 shadowRootMode 反射属性
  return HTMLTemplateElement.prototype.hasOwnProperty("shadowRootMode");
}
```

结构、投影、服务端直出都齐了，下一页补上组件融入真实应用的最后两块：表单参与（ElementInternals）与框架互操作：[表单参与、可访问性与框架互操作](./forms-frameworks)。
