---
layout: doc
outline: [2, 3]
---

# 自定义元素与生命周期

> 基于 WHATWG HTML/DOM 现行标准与各浏览器 Baseline 状态 · 核于 2026-07

## 速查

- **两类自定义元素**：**autonomous**（自治，`class X extends HTMLElement`，独立标签 `<my-el>`）与 **customized built-in**（定制内置，`extends HTMLParagraphElement` 等 + `<p is="word-count">`）。
- **customized built-in 是死路**：WebKit/Safari **明确拒绝实现**（standards-positions #97），跨浏览器实践中**只走 autonomous 路线**；需要内置元素语义时用组合（内部包一个真的 `<button>`）而非继承。
- **命名规则**：必须**小写字母开头 + 至少一个连字符**（如 `popup-info`）；不合法名字 `define()` 抛 `SyntaxError`；同名或同类重复注册抛 `NotSupportedError`。
- **注册**：`customElements.define(name, 类[, { extends }])`；`extends` 选项仅 customized built-in 用（即实践中不用）。
- **构造函数三禁**：首行 `super()`；**不得读取**属性/子节点（此时不可用）；**不得添加**属性/子节点（违反规范约束）——初始化放 `connectedCallback()`。
- **`connectedCallback()`**：每次**插入文档**都触发（移动元素 = 先断开再连接 = 再次触发，**可多次**）；做事的主场——读属性、挂事件、发请求。
- **`disconnectedCallback()`**：每次**移出文档**触发，做清理（解绑外部监听器、清定时器）；注意页面卸载时**不保证**触发。
- **`attributeChangedCallback(name, old, new)`**：仅对 `static observedAttributes = [...]` 列出的属性触发；**初始解析时属性已存在也会触发一次**；不声明 `observedAttributes` 则完全不观察。
- **`adoptedCallback()`**：元素被 `document.adoptNode()` 移入**另一个 document**（如 iframe 间）时触发，日常极少用。
- **`connectedMoveCallback()`**（新）：配合 `Element.moveBefore()` 的**状态保持移动**——定义了它，移动时就**代替** `disconnected + connected` 这对回调，内部状态（如 iframe、动画、焦点）不被重置。
- **升级（upgrade）机制**：`define()` 前就出现在 DOM 里的标签是"未定义元素"，`define()` 后**自动升级**——构造函数补跑、回调补触发；`customElements.upgrade(node)` 可对**不在文档中**的树手动升级。
- **`:defined` 伪类**：CSS 区分已升级/未升级，`my-el:not(:defined) { visibility: hidden }` 是防 FOUC 标配。
- **注册表查询三件**：`customElements.get("my-el")` 返回构造函数（未注册返回 `undefined`）；`customElements.getName(类)` 反查名字；`customElements.whenDefined("my-el")` 返回 Promise（可 `await` 后再操作元素）。
- **Scoped Custom Element Registries**：`new CustomElementRegistry()` 创建**局部注册表**，经 `attachShadow({ customElementRegistry })` 绑定到 shadow root——同名标签在不同影子树里可指向**不同实现**，解决微前端多版本共存的全局命名冲突。
- **Scoped 现状与限制**：**Safari 26.0（2025-09）首发标准化实现**，Safari 26.4 增补 `registry.initialize(root)`（后期关联）与 `customelementregistry` 内容属性；Chromium 原型跟进中。局部注册表的 `define()` **不支持 `extends`**（抛 `NotSupportedError`）。
- **自定义状态**：`this.attachInternals().states`（`CustomStateSet`）`add`/`delete` 状态字符串，CSS 用 **`:state(xxx)`** 匹配——组件内部状态（如 checked、loading）暴露给使用者样式化的标准姿势，仅 autonomous 可用。
- **响应式属性模式**：attribute（字符串、声明式）与 property（任意类型、命令式）要**手动同步**（reflect），getter/setter + `attributeChangedCallback` 双向桥接是标准样板，框架（Lit）帮你生成的就是这层。

## 一、两类自定义元素：只有一类能用

规范定义了两类自定义元素：

**autonomous custom elements（自治自定义元素）**——继承 `HTMLElement`，行为完全自建，以独立标签使用：

```js
class PopupInfo extends HTMLElement {}
customElements.define("popup-info", PopupInfo);
```

```html
<popup-info></popup-info>
```

**customized built-in elements（定制内置元素）**——继承某个具体内置元素类，用 `is` 属性挂到原生标签上，意图是"继承原生行为再增强"：

```js
class WordCount extends HTMLParagraphElement {}
customElements.define("word-count", WordCount, { extends: "p" });
```

```html
<p is="word-count"></p>
```

**但第二类在跨浏览器实践中是死路**：WebKit（Safari）在 standards-positions #97 中**明确拒绝实现**该特性（理由包括与继承模型的冲突），MDN 也在文档中直接标注"Safari 不打算支持"。多年僵持后，事实结论是：

- **可移植的组件只能走 autonomous 路线**；
- 需要原生元素的行为/语义/可访问性时，用**组合**代替继承——影子树内部包一个真的 `<button>`/`<input>`，把交互代理给它；
- 后文的 Scoped Registries 同样不支持 `extends`，标准演进也在事实上冷落这条路线。

教学与选型时把这条边界讲清，比记住 `is=""` 的语法更重要。

## 二、命名与注册：customElements.define()

```js
customElements.define(name, constructor, options?);
```

- **`name`**：必须**以小写字母开头且包含至少一个连字符**（连字符是与现有及未来内置标签的命名空间隔离），如 `user-card`、`x-panel`；违反抛 `SyntaxError`。
- **`constructor`**：元素类。
- **`options.extends`**：仅 customized built-in 使用（实践中不用）。

重复注册同一个名字、或用同一个类注册两个名字，都会抛 `NotSupportedError`——热重载场景常见此错，需先 `customElements.get()` 判存在性：

```js
// 防重复注册的标准写法（HMR/多次执行的脚本中常用）
if (!customElements.get("user-card")) {
  customElements.define("user-card", UserCard);
}
```

## 三、构造函数约束：为什么初始化要放 connectedCallback

规范对自定义元素构造函数有硬性要求（违反可能直接抛错或产生未定义行为）：

1. **首行调用 `super()`**；
2. **不得读取元素的属性或子节点**——解析器构造元素时属性/子节点尚未就绪，升级场景下拿到的又是"历史快照"，两种时机结果不一致；
3. **不得添加属性或子节点**——规范禁止（会破坏 `createElement()` "返回干净元素"的约定）。

因此构造函数里只适合做**与 DOM 无关**的自身初始化（绑定方法、创建影子根、初始化内部字段），一切依赖属性和子节点的逻辑放 `connectedCallback()`：

```js
class MyWidget extends HTMLElement {
  constructor() {
    super();
    // 合法：挂影子树、初始化内部状态
    this.attachShadow({ mode: "open" });
    this._count = 0;
  }

  connectedCallback() {
    // 此时属性可读、元素已入文档——真正的初始化主场
    const initial = this.getAttribute("start") ?? "0";
    this._count = Number(initial);
    this.shadowRoot.textContent = `count: ${this._count}`;
  }
}
```

## 四、生命周期回调全解

```js
class LifecycleDemo extends HTMLElement {
  static observedAttributes = ["color", "size"]; // 声明要观察的属性

  connectedCallback() {
    // 每次插入文档都触发（可能多次！）
  }
  disconnectedCallback() {
    // 每次移出文档都触发，做清理
  }
  attributeChangedCallback(name, oldValue, newValue) {
    // 仅 observedAttributes 中的属性变化时触发
  }
  adoptedCallback() {
    // 被移入另一个 document 时触发
  }
  connectedMoveCallback() {
    // moveBefore() 移动时代替上面 disconnected+connected 一对
  }
}
```

### connectedCallback：可多次触发是头号认知点

`connectedCallback` 在元素**每次**连接到文档时触发。`appendChild` 把已在文档中的元素挪个位置 = 先移除再插入 = `disconnectedCallback` + `connectedCallback` 各来一次。因此：

- **幂等设计**：挂事件、发请求前判断"是否已初始化"，避免重复执行；
- 也要知道：回调触发时元素**可能已再次断开**（同步连续操作 DOM 时），健壮代码可用 `this.isConnected` 复核。

### disconnectedCallback：清理但别依赖它兜底

移出文档时触发，标准用途是解绑挂在 `document`/`window` 上的监听器、清定时器、断开 `IntersectionObserver` 等。注意**页面整体卸载（关闭标签页）时不保证触发**，持久化类逻辑不要押在这里。

### attributeChangedCallback + observedAttributes：显式 opt-in

- 只有 `static observedAttributes` 数组里列出的属性才会触发回调——**忘记声明 = 静默不观察**，这是最常见的"为什么回调不跑"原因；
- **初始 HTML 里就写着的属性，解析/升级时也会触发一次**（`oldValue` 为 `null`），所以渲染逻辑写在这个回调里即可同时覆盖"初始值"与"后续变更"；
- 回调签名 `(name, oldValue, newValue)`，值都是字符串或 `null`（attribute 被移除时 `newValue` 为 `null`）。

### adoptedCallback：跨 document 移动

`document.adoptNode()` 把元素移入另一个 document（典型：主页面与 iframe 之间）时触发，日常业务极少遇到，知道语义即可。

### connectedMoveCallback：状态保持的移动（新）

传统上"移动元素"必然触发 `disconnected + connected` 一对回调，导致组件内部状态被拆了重建。新的 `Element.moveBefore()` API 配套了 `connectedMoveCallback()`：**如果定义了它**，`moveBefore()` 移动时就只调它、不再调那对回调，组件得以在移动中保持内部状态（如播放进度、焦点、动画）：

```js
class MyComponent extends HTMLElement {
  connectedMoveCallback() {
    // moveBefore() 移动时走这里，代替 disconnected+connected
    console.log("被移动了，但状态保住了");
  }
}
```

属于新近落地的能力，使用前查目标浏览器支持。

## 五、升级机制：define 之前的标签怎么办

自定义元素支持"**先用后定义**"：HTML 解析到 `<user-card>` 而注册表里还没有这个名字时，元素以"未定义的普通元素"存在（`HTMLUnknownElement` 语义之外的 unresolved 状态）；之后一旦 `define()`，文档中所有同名元素**就地升级**——构造函数补跑、`connectedCallback` 等回调按当前状态补触发。这套机制是渐进增强的基石，配套 API：

| API | 用途 |
| --- | --- |
| `customElements.whenDefined(name)` | 返回 Promise，定义后 resolve 为构造函数——"等组件就绪再操作"的标准姿势 |
| `customElements.get(name)` | 已注册返回构造函数，否则 `undefined`——防重复注册判断 |
| `customElements.getName(constructor)` | 用类反查注册名 |
| `customElements.upgrade(node)` | 手动升级**不在文档中**的树（`define()` 只自动升级文档内的元素） |

```js
// 等所有 user-card 可交互后再执行依赖逻辑
await customElements.whenDefined("user-card");

// 文档外的树不会自动升级，需手动
const frag = document.createRange().createContextualFragment("<user-card></user-card>");
customElements.upgrade(frag); // 现在 frag 里的 user-card 是完整实例
```

CSS 侧配套 **`:defined`** 伪类，防止"JS 未加载完时组件裸奔"（FOUC）：

```css
/* 未升级期间隐藏或给骨架样式，升级后自然显示 */
user-card:not(:defined) {
  visibility: hidden;
}
```

## 六、Scoped Custom Element Registries：局部注册表

`customElements` 是**全局单例**注册表：一个名字只能注册一次。这在微前端/大型应用里是真实痛点——两个子应用带着**同名不同版**的组件（都叫 `<fancy-button>`）就会撞车。Scoped Custom Element Registries 让注册表可以**按影子树局部化**：

```js
// 1. 创建局部注册表：同名元素在这里可以是另一套实现
const myRegistry = new CustomElementRegistry();
myRegistry.define(
  "my-element",
  class extends HTMLElement {
    connectedCallback() {
      this.textContent = "来自局部注册表的实现";
    }
  },
);

// 2. 挂影子树时绑定局部注册表：这棵影子树内的自定义元素查这本"局部字典"
const shadow = host.attachShadow({
  mode: "open",
  customElementRegistry: myRegistry,
});
shadow.innerHTML = "<my-element></my-element>"; // 解析为局部注册表里的实现

// 3. 后期关联：先挂树后绑注册表（Safari 26.4 起）
const shadow2 = host2.attachShadow({ mode: "open", customElementRegistry: null });
shadow2.innerHTML = "<my-element></my-element>"; // 此时是未定义元素
myRegistry.initialize(shadow2); // 关联后升级为局部实现
```

声明式 Shadow DOM 也有配套属性：

```html
<my-host>
  <!-- shadowrootcustomelementregistry：声明这棵影子树使用局部注册表 -->
  <template shadowrootmode="open" shadowrootcustomelementregistry>
    <my-element></my-element>
  </template>
</my-host>
```

配套查询：`ShadowRoot.customElementRegistry` / `Element.customElementRegistry` / `Document.customElementRegistry` 可读取节点关联的注册表。

**现状与限制（核于 2026-07）**：

- **Safari 26.0（2025-09）是第一个发布标准化版本的浏览器**；Safari 26.4 扩展了 `CustomElementRegistry.prototype.initialize()` 与 `customelementregistry` 内容属性；**Chromium 在跟进原型**——跨浏览器可用尚需时日，当前适合渐进增强或有 polyfill 兜底的场景；
- 局部注册表的 `define()` **不支持 `extends` 选项**（抛 `NotSupportedError`）——即局部注册表只服务 autonomous 元素，再次坐实 customized built-in 的死路地位。

## 七、自定义状态：CustomStateSet 与 :state()

内置元素有 `:checked`、`:disabled` 这类**状态伪类**；自定义元素的对等能力是 `ElementInternals.states`（一个 `CustomStateSet`）配 CSS **`:state()`**：

```js
class MyCheckbox extends HTMLElement {
  constructor() {
    super();
    this._internals = this.attachInternals(); // ElementInternals 入口
  }

  get checked() {
    return this._internals.states.has("checked");
  }
  set checked(flag) {
    // 状态进出 states 集合，CSS 立即可感知
    if (flag) this._internals.states.add("checked");
    else this._internals.states.delete("checked");
  }
}
customElements.define("my-checkbox", MyCheckbox);
```

```css
/* 使用者从外部按状态样式化组件 */
my-checkbox:state(checked) {
  outline: 2px solid seagreen;
}
/* 组件内部（影子树里）也能用 :host 配 :state() */
:host(:state(checked)) .box {
  background: seagreen;
}
```

`:state()` 还能出现在 `::part()` 之后，用于样式化"处于某状态的组件的某个 part"。注意 `attachInternals()` **仅 autonomous 元素可调用**。`ElementInternals` 在表单与可访问性上的更大作用见[表单参与、可访问性与框架互操作](./forms-frameworks)。

行为（生命周期）有了，下一页解决"封装"——影子树的建立、JS/CSS 双向边界与样式钩子：[Shadow DOM 封装与样式](./shadow-dom)。
