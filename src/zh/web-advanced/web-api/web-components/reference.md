---
layout: doc
outline: [2, 3]
---

# 参考：API 速查 / 选型 / 易错点

> 基于 WHATWG HTML/DOM 现行标准与各浏览器 Baseline 状态 · 核于 2026-07

## 速查

- **三大技术**：Custom Elements（元素类 + 注册表 + 生命周期）、Shadow DOM（封装边界）、`<template>`/`<slot>`（惰性模板 + 内容投影）；核心三件**全绿多年**。
- **注册**：`customElements.define(name, 类)`；名字**小写开头 + 含连字符**；配套 `get`/`getName`/`whenDefined`/`upgrade`。
- **生命周期五回调**：`connectedCallback`（可多次）/ `disconnectedCallback` / `attributeChangedCallback`（配 `static observedAttributes`，初始解析也触发）/ `adoptedCallback` / `connectedMoveCallback`（配 `moveBefore()`，定义则代替断连对）。
- **构造函数三禁**：先 `super()`；不读属性/子节点；不加属性/子节点——初始化放 `connectedCallback`。
- **两类元素一条路**：autonomous 全绿可移植；customized built-in（`is=""` + `extends`）**WebKit 拒绝实现**（standards-positions #97），视为死路。
- **attachShadow 六选项**：`mode`（open/closed，closed 非安全机制）、`delegatesFocus`、`slotAssignment`（named/manual）、`clonable`、`serializable`、`customElementRegistry`。
- **样式封装**：双向隔离；穿透通道 = 可继承属性 + **CSS 自定义属性**；外部接口 = **`::part()`**（配 `exportparts`）；内部钩子 = `:host` / `:host()` / `:host-context()` / `::slotted()`（仅顶层）。
- **事件**：retargeting 把 `target` 重定向为宿主；`CustomEvent` 默认 `composed: false`，对外必须 `{ bubbles: true, composed: true }`；真实路径查 `composedPath()`。
- **template**：`content` 是 `DocumentFragment`，**深克隆再用**（`cloneNode(true)`/`importNode(…, true)`）。
- **slot**：`name` ↔ `slot` 匹配；无名 slot 接未标记内容；slot 子内容是 fallback；**分发是投影不是搬家**（节点仍在 light DOM，页面 CSS 仍可及）；动态感知靠 `slotchange` + `assignedNodes/assignedElements`。
- **声明式 Shadow DOM**：`<template shadowrootmode>` 解析期就地成影子根，**免 JS 首渲**；Baseline **2024-08-05**；`innerHTML` 不解析（用 `setHTMLUnsafe`/`parseHTMLUnsafe`）；序列化 `getHTML({ serializableShadowRoots: true })`。
- **水合模式**：构造函数查 `internals.shadowRoot` 有则复用、无则 `attachShadow`；对声明式根调 `attachShadow()` 不抛错而是**清空返回**。
- **表单参与**：`static formAssociated = true` + `attachInternals()`；`setFormValue`/`setValidity`/`checkValidity`/`reportValidity`；四回调 `formAssociatedCallback`/`formDisabledCallback`/`formResetCallback`/`formStateRestoreCallback`；Safari 16.4（2023-03）后全绿。
- **可访问性**：`internals.role`/`aria*` 建立**默认语义**不喷属性；`ariaLabelledByElements` 等元素引用可跨影子根；表单组件配 `delegatesFocus`。
- **自定义状态**：`internals.states`（`CustomStateSet`）+ CSS `:state()`；未升级样式用 `:defined`。
- **Scoped Registries**：`new CustomElementRegistry()` + `attachShadow({ customElementRegistry })`/`initialize()`；解决全局重名冲突；**Safari 26.0（2025-09）首发**、Chromium 跟进；scoped `define()` 不支持 `extends`（`NotSupportedError`）。
- **框架互操作**：Vue/Angular 满分；**React 19 起完整支持**（此前 props 全序列化为 attribute、听不了自定义事件）；Vue 需 `isCustomElement`，Angular 需 `CUSTOM_ELEMENTS_SCHEMA`。
- **选型**：跨框架/微前端/嵌入挂件 → Web Components（工程上配 [Lit](/zh/frontend-framework/ui/lit/)）；单框架业务内部 → 框架组件。

## 一、CustomElementRegistry 与生命周期

### 注册表 API

| API | 说明 |
| --- | --- |
| `customElements.define(name, ctor[, { extends }])` | 注册；名字须小写开头含连字符（违反 `SyntaxError`）；重名/重类 `NotSupportedError` |
| `customElements.get(name)` | 返回构造函数或 `undefined`（防重复注册判断） |
| `customElements.getName(ctor)` | 用构造函数反查注册名 |
| `customElements.whenDefined(name)` | Promise，定义后 resolve 为构造函数 |
| `customElements.upgrade(node)` | 手动升级**不在文档中**的树 |
| `new CustomElementRegistry()` | 创建局部注册表（Scoped，Safari 26+） |
| `registry.initialize(root)` | 后期把局部注册表关联到 shadow root（Safari 26.4+） |
| `ShadowRoot/Element/Document.customElementRegistry` | 读取节点关联的注册表 |

### 生命周期回调

| 回调 | 触发时机 | 关键注意 |
| --- | --- | --- |
| `constructor` | 创建/升级 | 先 `super()`；禁读禁改属性与子节点 |
| `connectedCallback()` | 每次插入文档 | **可多次触发**；初始化主场；`isConnected` 复核 |
| `disconnectedCallback()` | 每次移出文档 | 做清理；页面卸载不保证触发 |
| `attributeChangedCallback(name, old, new)` | `observedAttributes` 中属性变化 | 初始解析也触发；值为字符串或 `null` |
| `adoptedCallback()` | 移入新 document | `document.adoptNode()` 场景 |
| `connectedMoveCallback()` | `moveBefore()` 移动 | 定义则**代替**断连+重连一对，状态保持 |
| `formAssociatedCallback(form)` | 表单关联建立/解除 | 需 `formAssociated = true` |
| `formDisabledCallback(disabled)` | disabled 状态变化 | 含祖先 `<fieldset disabled>`；表现自己实现 |
| `formResetCallback()` | 表单 reset | 不实现 = reset 对组件无效 |
| `formStateRestoreCallback(state, mode)` | 浏览器恢复状态 | `mode`: `"restore"` / `"autocomplete"` |

## 二、Shadow DOM

### attachShadow() 选项

| 选项 | 默认 | 说明 |
| --- | --- | --- |
| `mode` | 必填 | `"open"`（`el.shadowRoot` 可达）/ `"closed"`（返回 `null`；**非安全机制**） |
| `delegatesFocus` | `false` | 聚焦宿主时焦点委托给影子树内首个可聚焦元素；表单组件标配 |
| `slotAssignment` | `"named"` | `"manual"` 时改用 `slot.assign(...nodes)` 手动分发（全量替换语义） |
| `clonable` | `false` | `cloneNode(true)` 是否连影子树克隆（声明式根默认可克隆） |
| `serializable` | `false` | 允许 `getHTML({ serializableShadowRoots: true })` 序列化 |
| `customElementRegistry` | 全局 | 绑定局部注册表（Scoped Registries） |

可挂影子树的元素：自治自定义元素 + `article`/`aside`/`blockquote`/`body`/`div`/`footer`/`h1`-`h6`/`header`/`main`/`nav`/`p`/`section`/`span`。每元素至多一棵；对命令式根重复 `attachShadow()` 抛 `NotSupportedError`，对**声明式**根则清空并返回。

### ShadowRoot 关键成员

| 成员 | 说明 |
| --- | --- |
| `mode` / `host` | 模式 / 反查宿主元素 |
| `adoptedStyleSheets` | Constructable Stylesheets 数组（`new CSSStyleSheet()` + `replaceSync()`） |
| `delegatesFocus` / `slotAssignment` / `clonable` / `serializable` | 创建选项的只读反射 |
| `customElementRegistry` | 关联的注册表 |
| `getHTML(options)` | 序列化（配 `serializableShadowRoots` / `shadowRoots` 选项） |

### 样式选择器

| 选择器 | 位置 | 说明 |
| --- | --- | --- |
| `:host` | 影子树内 | 宿主自身；优先级低于外部直接命中宿主的规则 |
| `:host(sel)` | 影子树内 | 宿主匹配 `sel` 时命中（按属性/类做变体） |
| `:host-context(sel)` | 影子树内 | 宿主**祖先**匹配时命中；**Firefox 未实现**，主题适配慎用 |
| `::slotted(sel)` | 影子树内 | 被分发节点；**仅顶层元素**，选不到后代与文本 |
| `::part(name)` | 页面侧 | 影子树内标 `part="name"` 的元素；后可接伪类 |
| `:defined` | 页面侧 | 已升级元素；`:not(:defined)` 防 FOUC |
| `:state(x)` | 两侧均可 | `CustomStateSet` 中含 `x` 的元素；可接在 `::part()` 后 |

## 三、template / slot / 声明式 Shadow DOM

### 元素与属性

| 元素/属性 | 说明 |
| --- | --- |
| `<template>` | 内容解析不渲染；`content` 为 `DocumentFragment`；**深克隆再用** |
| `<slot name="x">` | 投影占位；无 `name` 为默认插槽；子内容为 fallback |
| `slot="x"`（light DOM 侧） | 指定进入哪个命名插槽 |
| `part="x"` / `exportparts="x, y:alias"` | 对外样式接口 / 嵌套转发（可改名） |
| `shadowrootmode`（`"open"` / `"closed"`） | **声明式影子根**；解析期就地生效，template 从 DOM 移除 |
| `shadowrootdelegatesfocus` / `shadowrootclonable` / `shadowrootserializable` / `shadowrootslotassignment` / `shadowrootcustomelementregistry` | `attachShadow()` 各选项的声明式对应 |

### 插槽 JS API

| API | 说明 |
| --- | --- |
| `slot.assignedNodes({ flatten? })` | 分发进来的节点（含文本）；`flatten` 展开嵌套与 fallback |
| `slot.assignedElements({ flatten? })` | 仅元素 |
| `slot.assign(...nodes)` | 手动分发（须 `slotAssignment: "manual"`；全量替换） |
| `el.assignedSlot` / `text.assignedSlot` | 反查节点被分到的插槽 |
| `slotchange` 事件 | 分发集合变化（含首次）；**不穿出影子树**，在 slot/影子根上听 |

### 声明式 Shadow DOM 要点

| 主题 | 结论 |
| --- | --- |
| 解析行为 | 遇 `<template shadowrootmode>` 开标签即建根，内容**流式**解析进根 |
| 动态注入 | `innerHTML`/`insertAdjacentHTML` **不解析**；用 `setHTMLUnsafe()`/`parseHTMLUnsafe()` |
| JS 设属性 | 无效，只有 HTML 解析器认 |
| 水合 | 构造函数查 `internals.shadowRoot`（closed 也可达）；有则复用无则自建 |
| `attachShadow()` 相遇 | 不抛错，**清空声明式根并返回**（客户端全量重建语义） |
| Constructable Stylesheets | 无法声明式表达，水合时补挂 |
| 特性检测 | `HTMLTemplateElement.prototype.hasOwnProperty("shadowRootMode")` |
| 历史 | Chrome 90 旧非标属性 `shadowroot` 已废弃，一律 `shadowrootmode` |

## 四、ElementInternals

入口：`static formAssociated = true` + `this.attachInternals()`（仅 autonomous、每元素一次）。

| 成员 | 说明 |
| --- | --- |
| `setFormValue(value, state?)` | 提交值：`string`/`File`/`FormData`/`null`；`state` 供恢复场景 |
| `setValidity(flags, message?, anchor?)` | `{}` = 有效；有 `true` flag 必须给 `message`；`anchor` 锚定气泡 |
| `checkValidity()` / `reportValidity()` | 静默校验 / 校验并展示原生 UI |
| `form` / `labels` | 所属表单 / 关联的 `<label>` NodeList |
| `willValidate` / `validity` / `validationMessage` | 约束校验三只读 |
| `states` | `CustomStateSet`：`add`/`delete`/`has`，配 CSS `:state()` |
| `shadowRoot` | 元素的影子根（**closed 声明式根也可达**，水合用） |
| `role`、`ariaLabel`、`ariaChecked`、`ariaExpanded`、`ariaValueNow`、`ariaValueMin`/`Max`、`ariaLive` 等 | 默认 ARIA 语义（字符串值）；作者 attribute 可覆盖，删除后默认仍在 |
| `ariaLabelledByElements`、`ariaDescribedByElements`、`ariaControlsElements`、`ariaActiveDescendantElement` 等 | **元素引用**版 ARIA，可跨影子根（绕过 id 引用失效） |

## 五、事件模型

| API/概念 | 说明 |
| --- | --- |
| retargeting | 事件穿出边界后 `target` 重定向为宿主；影子树内监听不受影响 |
| `event.composed` | 是否可穿越影子边界；多数原生 UI 事件 `true` |
| `new CustomEvent(type, init)` | **默认 `bubbles: false, composed: false`**——对外事件两者必须显式开 |
| `event.composedPath()` | 完整传播路径；`[0]` 为真实起点；closed 树内部节点被隐去 |
| `slotchange` | 分发集合变化；不穿出影子树 |

## 六、浏览器支持时间线

| 能力 | 状态（核于 2026-07） |
| --- | --- |
| Custom Elements / Shadow DOM / `<template>`/`<slot>` | 全绿多年（Baseline Widely available） |
| `ElementInternals` / 表单关联 | Safari 16.4（2023-03）补齐，**全绿**（Widely available） |
| 声明式 Shadow DOM（`shadowrootmode`） | **Baseline Newly available 2024-08-05**：Chrome/Edge 111、Firefox 123、Safari 16.4 |
| customized built-in（`is=""` + `extends`） | Chromium/Firefox 有实现，**WebKit 明确拒绝**（standards-positions #97）→ 跨浏览器死路 |
| `connectedMoveCallback()` / `moveBefore()` | 新近落地，逐步铺开 |
| Scoped Custom Element Registries | **Safari 26.0（2025-09）首发标准化版本**；Safari 26.4 增 `initialize()`、`customelementregistry` 属性；Chromium 原型跟进 |
| `:state()` / `CustomStateSet` | 各主流浏览器已支持 |

## 七、选型对比

### 原生 Web Components vs Lit vs 框架组件

| 维度 | 裸写原生 | [Lit](/zh/frontend-framework/ui/lit/) | 框架组件（Vue/React） |
| --- | --- | --- | --- |
| 产物 | 标准自定义元素 | **标准自定义元素**（Lit 是写法糖不是运行时锁定） | 框架私有格式 |
| 跨框架复用 | 是 | 是 | 否（需重写或桥接） |
| 运行时体积 | 0 | 约 5KB | 框架运行时（几十 KB 起） |
| 样板量 | 高（反射/渲染/diff 全手写） | 低（响应式属性 + 声明式模板） | 低 |
| 响应式/状态 | 自己实现 | `@property` 装饰器 + 高效模板更新 | 框架内建 |
| SSR | 声明式 Shadow DOM（自己拼） | `@lit-labs/ssr` | 框架成熟方案 |
| 适用 | 学标准、极致零依赖、简单挂件 | **生产级组件库的主流选择** | 单框架业务应用 |

### 何时选 Web Components 路线

| 场景 | 建议 |
| --- | --- |
| 跨框架/跨团队设计系统 | **Web Components（Lit）**——一套产物全框架可用 |
| 微前端共享组件、多版本共存 | Web Components + Scoped Registries（关注 Chromium 进度） |
| 嵌第三方页面的挂件 | Web Components——Shadow DOM 抗宿主样式干扰 |
| 单框架业务应用内部组件 | 框架组件——响应式与生态更顺手，不必为用而用 |
| 需要"扩展原生 `<button>`/`<input>`" | **不要走 `is=""`**；用 autonomous 元素内部组合真原生控件 |

## 八、易错点清单

- **构造函数里读属性/加子节点**：违反规范约束，升级场景行为不一致——初始化放 `connectedCallback`。
- **`connectedCallback` 当"只跑一次"用**：移动元素就会再触发，重复挂监听器/发请求——做幂等或标志位。
- **忘记 `static observedAttributes`**：`attributeChangedCallback` 静默不跑的第一原因。
- **重复 `define()` 抛错**：HMR/多次执行脚本先 `customElements.get()` 判存在。
- **押注 `is=""`**：Safari 永不支持，跨浏览器直接死——autonomous + 组合是唯一可移植路线。
- **`:host` 忘设 `display`**：自定义元素默认 `inline`，宽高布局"莫名失效"。
- **closed 模式当安全沙箱**：只挡 `el.shadowRoot` 一条路，不是防护机制。
- **`CustomEvent` 忘开 `composed`/`bubbles`**：组件事件"外面听不到"的头号嫌疑。
- **`::slotted()` 选后代/文本**：只能选顶层被分发**元素**。
- **`:host-context()` 做主题**：Firefox 未实现——改用 CSS 变量或宿主属性。
- **直接 `appendChild(template.content)`**：把模板掏空，第二个实例空白——先深克隆。
- **`slotchange` 在宿主外监听**：它不穿影子边界，要挂在 slot/影子根上。
- **`innerHTML` 注入声明式影子根**：不解析——用 `setHTMLUnsafe()`/`parseHTMLUnsafe()`。
- **水合时盲目 `attachShadow` + 重建**：把服务端渲染成果清空了——先查 `internals.shadowRoot` 复用。
- **表单组件不写 `formResetCallback`**：reset 按钮对组件无效。
- **`aria-labelledby` 跨影子根引 id**：引用失效——用 `ariaLabelledByElements` 元素引用。
- **React 18 及以下绑对象 props**：拿到 `"[object Object]"`——升 React 19 或 ref 手动设 property。
- **Vue 未配 `isCustomElement`**：编译器把自定义标签当未注册组件报警告。
- **Scoped registry 里用 `extends`**：抛 `NotSupportedError`——局部注册表只服务 autonomous。

## 九、权威链接

- [MDN: Web Components](https://developer.mozilla.org/en-US/docs/Web/API/Web_components) —— 总览与三篇官方指南入口
- [MDN: Using custom elements](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements) ｜ [Using shadow DOM](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_shadow_DOM) ｜ [Using templates and slots](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_templates_and_slots)
- [MDN: ElementInternals](https://developer.mozilla.org/en-US/docs/Web/API/ElementInternals) —— 表单参与与默认 ARIA 语义全 API
- [web.dev: Declarative Shadow DOM](https://web.dev/articles/declarative-shadow-dom) —— SSR/流式/水合的权威解读
- [WebKit Blog: WebKit Features in Safari 26.0](https://webkit.org/blog/17333/webkit-features-in-safari-26-0/) —— Scoped Custom Element Registries 首发公告
- [WICG/webcomponents](https://github.com/WICG/webcomponents) —— 提案孵化仓库（Scoped Registries 等）
- [WebKit standards-positions #97](https://github.com/WebKit/standards-positions/issues/97) —— customized built-in elements 的官方反对立场
- [custom-elements-everywhere.com](https://custom-elements-everywhere.com/) —— 各框架互操作测试集与得分
- [HTML Living Standard: Custom elements](https://html.spec.whatwg.org/multipage/custom-elements.html) ｜ [DOM Standard: Shadow tree](https://dom.spec.whatwg.org/#shadow-trees) —— 规范原文
