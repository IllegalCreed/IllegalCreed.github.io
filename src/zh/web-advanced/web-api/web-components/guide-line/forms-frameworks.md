---
layout: doc
outline: [2, 3]
---

# 表单参与、可访问性与框架互操作

> 基于 WHATWG HTML/DOM 现行标准与各浏览器 Baseline 状态 · 核于 2026-07

## 速查

- **默认残疾**：自定义元素天生**不参与表单**——不进 `FormData`、不响应 reset、不参加约束校验、`<label>` 关联不上；补齐这一切的正规接口是 **`ElementInternals`**。
- **开启两件套**：类上声明 **`static formAssociated = true`** + 构造函数里 **`this.internals_ = this.attachInternals()`**——从此浏览器把该元素当表单控件对待。
- **`attachInternals()` 限制**：仅 **autonomous** 自定义元素可调；每元素**只能调一次**（重复抛错）；返回的 `ElementInternals` 建议存私有字段。
- **提交值**：**`internals.setFormValue(value, state?)`**——`value` 可为 `string`/`File`/`FormData`（多字段）/`null`（不提交）；`state` 是可选的"UI 状态"表示，供浏览器恢复（自动填充/回退导航）时用。
- **约束校验四件**：**`setValidity(flags, message?, anchor?)`** 设置有效性（`flags` 如 `{ valueMissing: true }`，空对象 `{}` = 有效）；**`checkValidity()`** 静默校验；**`reportValidity()`** 校验并向用户展示气泡；配套只读 `validity`/`validationMessage`/`willValidate`。
- **表单只读属性**：`internals.form`（所属表单）、`internals.labels`（关联的 `<label>` 列表）、`internals.states`（`CustomStateSet`）、`internals.shadowRoot`（含 closed 声明式根，水合用）。
- **表单生命周期四回调**（类上定义，配合 `formAssociated` 生效）：**`formAssociatedCallback(form)`**（与表单建立/解除关联）、**`formDisabledCallback(disabled)`**（自身或祖先 `<fieldset>` disabled 变化）、**`formResetCallback()`**（表单 reset，须自行恢复默认值）、**`formStateRestoreCallback(state, mode)`**（浏览器恢复状态，`mode` 为 `"restore"` 或 `"autocomplete"`）。
- **`disabled` 要自己演**：`formDisabledCallback` 只是通知——置灰、拦截交互、内部控件同步 disabled 都得组件自己实现。
- **name/value 惯例**：表单关联元素通常观察 `name`/`value` attribute 并在变化时 `setFormValue()`，对齐原生控件心智。
- **默认 ARIA 语义**：`internals.role = "checkbox"`、`internals.ariaChecked = "true"` 等——**不在 HTML 上喷 ARIA 属性**就建立可访问语义；作者写的同名 attribute 可覆盖、删除后默认值仍在，这正是它优于 `setAttribute("role")` 的原因。
- **ARIA 元素引用**：`ariaLabelledByElements`、`ariaDescribedByElements` 等接受**元素数组**——可直接引用影子树内节点，绕过跨根 id 引用失效的问题。
- **焦点配套**：表单组件几乎总要 `attachShadow({ delegatesFocus: true })` + 宿主 `tabindex` 语义，让点击/Tab 聚焦直达内部控件且宿主能匹配 `:focus-visible`。
- **支持现状**：ElementInternals / 表单关联自定义元素 **Safari 16.4（2023-03）补齐后全绿**（Baseline Widely available）。
- **框架互操作根源**：框架模板绑定要决定"设 **attribute**（字符串）还是设 **property**（任意类型）"、以及能否监听**自定义事件**——不同框架策略不同，这是互操作差异的全部来源。
- **custom-elements-everywhere 结论**：**Vue、Angular 满分**；**React 19 起完整支持**（属性智能分配 + 可监听自定义事件），React 18 及之前 props 一律序列化为 attribute、自定义事件基本没法用（需 ref 手动 addEventListener）。
- **Vue 要点**：编译器需配 **`compilerOptions.isCustomElement: (tag) => tag.includes("-")`**（否则报"组件未注册"警告）；绑定默认智能判断，**`.prop` / `.attr` 修饰符**可显式指定；Vue 还能反向输出——`defineCustomElement()` 把 Vue 组件编译成自定义元素。
- **Angular 要点**：模块/组件里加 **`CUSTOM_ELEMENTS_SCHEMA`**；`[prop]` 绑 property、`(event)` 听任意事件，天生契合。
- **对外事件规范**：组件从影子树内 dispatch 必须 **`bubbles: true, composed: true`**，否则任何框架都听不到；事件名建议全小写无冒号（跨框架监听语法最大公约数）。
- **写库别裸写**：属性反射、渲染更新样板多——工程上用 [Lit](/zh/frontend-framework/ui/lit/) 这类轻封装产出标准自定义元素，本叶不展开（见独立叶）。

## 一、问题：光有外观，成不了表单控件

给 `<fancy-input>` 做好了影子树、样式、交互，放进 `<form>` 却会发现：

- 提交时 `FormData` 里**没有它的值**；
- `form.reset()` 对它**无效**；
- `required`/校验气泡/`:invalid` **不存在**；
- `<label for="…">` **关联不上**；
- 屏幕阅读器只念出"组"或什么都不念。

原生 `<input>` 的这些能力全部来自浏览器内部的"表单关联"机制。**`ElementInternals`**（配合 `formAssociated`）把这套机制开放给自定义元素——这是 2023 年 Safari 16.4 补齐后才真正跨浏览器可用的能力，也是 Web Components 从"展示组件"晋级"表单控件"的分水岭。

## 二、开启表单参与：formAssociated + attachInternals

```js
class FancyInput extends HTMLElement {
  // 1. 声明"我是表单关联元素"——浏览器从此把它当表单控件对待
  static formAssociated = true;
  static observedAttributes = ["value", "required"];

  constructor() {
    super();
    // 2. 领取 ElementInternals：每元素只能调一次，仅 autonomous 元素可调
    this.internals_ = this.attachInternals();
    const shadow = this.attachShadow({ mode: "open", delegatesFocus: true });
    shadow.innerHTML = `
      <style>:host { display: inline-block; }</style>
      <input part="field" />
    `;
    this.input_ = shadow.querySelector("input");
    // 内部值变化 → 同步提交值 + 校验状态
    this.input_.addEventListener("input", () => this.#sync());
  }

  #sync() {
    const v = this.input_.value;
    // 3. 设置提交值：表单提交时 FormData 里出现 name=该值
    this.internals_.setFormValue(v);
    // 4. 约束校验：flags 空对象 {} 表示有效
    if (this.hasAttribute("required") && !v) {
      // (flags, 提示文案, 校验气泡锚定的元素)
      this.internals_.setValidity({ valueMissing: true }, "请填写此字段", this.input_);
    } else {
      this.internals_.setValidity({});
    }
  }

  connectedCallback() {
    this.#sync(); // 初始也要同步一次
  }
}
customElements.define("fancy-input", FancyInput);
```

```html
<form>
  <label for="nick">昵称</label>
  <!-- label 关联、required 校验、FormData 提交，现在全部生效 -->
  <fancy-input id="nick" name="nick" required></fancy-input>
  <button>提交</button>
</form>
```

要点拆解：

- **`setFormValue(value, state?)`**：`value` 接受 `string` / `File` / `FormData`（一个组件提交**多个字段**时用）/ `null`（本次不提交）。第二个参数 `state` 是"UI 状态"的可选表示——值与状态可以不同（如日期控件提交 ISO 字符串、状态存用户的原始输入），浏览器在**恢复**场景（回退导航、自动填充）会把 state 交还给 `formStateRestoreCallback`。
- **`setValidity(flags, message?, anchor?)`**：`flags` 是 `ValidityState` 同款布尔集（`valueMissing`/`typeMismatch`/`patternMismatch`/`rangeUnderflow`/`customError` 等）；只要有一个为 `true` 就必须给 `message`；`anchor` 指定校验气泡锚定的（影子树内）元素。设 `{}` 即宣告有效。
- **`checkValidity()` vs `reportValidity()`**：前者静默返回布尔，后者还会向用户展示浏览器原生校验 UI——与原生表单 API 完全同构。
- 配套只读属性：`internals.form`（所属 `<form>`）、`internals.labels`（所有关联 `<label>` 的 NodeList）、`internals.willValidate`/`validity`/`validationMessage`。

## 三、表单生命周期四回调

`formAssociated = true` 之后，元素类可以再定义四个**表单专属**回调（与五个通用生命周期回调并列）：

```js
class FancyInput extends HTMLElement {
  static formAssociated = true;

  formAssociatedCallback(form) {
    // 与某个 <form> 建立/解除关联时触发（form 为 null 表示解除）
  }

  formDisabledCallback(disabled) {
    // 自身 disabled 属性或祖先 <fieldset disabled> 变化时触发
    // 注意：视觉置灰、拦截交互要自己做，浏览器只负责通知
    this.input_.disabled = disabled;
  }

  formResetCallback() {
    // 表单 reset：自行恢复默认值（浏览器不知道你的"默认"是什么）
    this.input_.value = this.getAttribute("value") ?? "";
    this.internals_.setFormValue(this.input_.value);
  }

  formStateRestoreCallback(state, mode) {
    // 浏览器恢复状态：mode 为 "restore"（回退/刷新导航）或 "autocomplete"
    this.input_.value = state;
  }
}
```

最容易被忽略的两条：**`formResetCallback` 不写 = reset 按钮对你的组件无效**；**`formDisabledCallback` 只是通知**，disabled 的一切表现（样式、`tabindex`、内部控件禁用）都是组件自己的责任。

## 四、可访问性：ElementInternals 的另一半价值

### 默认 ARIA 语义，不污染 HTML

传统做法是构造时 `this.setAttribute("role", "checkbox")`——缺点是**篡改了使用者的 HTML**（"attribute sprouting"）：使用者若删掉这个属性，语义就丢了；使用者想覆盖也分不清哪个是默认、哪个是自定义。`ElementInternals` 的 ARIA 属性建立的是**默认语义**：

```js
class MyCheckbox extends HTMLElement {
  static formAssociated = true;
  constructor() {
    super();
    this.internals_ = this.attachInternals();
    // 默认语义：写在 internals 上，不出现在 HTML attribute 里
    this.internals_.role = "checkbox";
    this.internals_.ariaChecked = "false";
  }
  toggle() {
    const on = this.internals_.ariaChecked === "true";
    this.internals_.ariaChecked = on ? "false" : "true"; // 值是字符串
  }
}
```

三条语义规则：**作者在 HTML 上写的同名 ARIA attribute 优先**（可覆盖默认）；作者**删除** attribute 后回落到 internals 默认值（语义不丢）；作者**从没写过**也有完整默认语义。`ElementInternals` 上有全套 ARIA 反射属性（`role`、`ariaLabel`、`ariaChecked`、`ariaExpanded`、`ariaValueNow` 等数十个，速查全表见[参考页](../reference)）。

**跨影子根引用**：`aria-labelledby="id"` 这类 **id 引用无法跨越影子边界**（外面的 id 影子树内看不见，反之亦然）。`ElementInternals` 的元素引用属性直接收**元素对象数组**，绕开 id：

```js
// 直接引用影子树内的节点作为无障碍名称来源
this.internals_.ariaLabelledByElements = [this.shadowRoot.querySelector(".label")];
```

同族还有 `ariaDescribedByElements`、`ariaControlsElements`、`ariaActiveDescendantElement` 等。

### 焦点：delegatesFocus 是表单组件标配

包壳型表单组件（宿主包着内部 `<input>`）应 `attachShadow({ delegatesFocus: true })`：点击宿主任意位置、`el.focus()`、Tab 聚焦都会把焦点**委托**给影子树内第一个可聚焦元素，且宿主整体匹配 `:focus`/`:focus-visible`——否则会出现"点组件边缘没反应、`<label>` 点了不聚焦"的破碎体验。

## 五、框架互操作：差异从哪来、现在还剩多少

框架把 `<my-el foo="…">` 渲染到 DOM 时要做两个决定：

1. **`foo` 设成 attribute 还是 property？** attribute 只能是字符串；对象/数组必须走 property。设错了，组件拿到的是 `"[object Object]"`。
2. **`@change`/`(change)` 能不能听到组件 dispatch 的 `CustomEvent`？**

这两个决定就是 [custom-elements-everywhere.com](https://custom-elements-everywhere.com/) 测试集的全部内容，结论（核于 2026-07）：

| 框架 | 结论 | 要点 |
| --- | --- | --- |
| **Vue** | **满分** | 智能判断：属性名存在于元素实例（`in` 检查）设 property，否则设 attribute；`.prop`/`.attr` 修饰符可显式指定；任意事件名可 `@xxx` 监听 |
| **Angular** | **满分** | `[prop]` 显式绑 property、`(event)` 听任意事件；需在模块/组件加 `CUSTOM_ELEMENTS_SCHEMA` 消除未知标签报错 |
| **React** | **React 19 起完整支持**（2024 末的关键变化） | 19 之前：props 一律序列化为 attribute（对象变 `"[object Object]"`）、自定义事件无法声明式监听（只能 ref + `addEventListener`）；19 起：属性名在实例上是 property 就设 property、否则设 attribute，且支持自定义事件绑定 |

各框架接入的最小配置：

```js
// Vue（vite.config.js 或编译选项）：告诉编译器带连字符的标签不是 Vue 组件
// 否则控制台警告 "Failed to resolve component: my-el"
compilerOptions: {
  isCustomElement: (tag) => tag.includes("-"),
}
```

```html
<!-- Vue 模板：默认智能分配，也可用修饰符强制 -->
<my-chart :data.prop="chartData" @point-click="onPoint"></my-chart>
```

```ts
// Angular：组件/模块声明 schema 后即可自由使用
@Component({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  /* … */
})
```

```jsx
// React 19+：直接绑定，框架自动决定 property/attribute
<my-chart data={chartData} onpoint-click={onPoint} />
```

组件作者侧要为互操作做的事：

- **对外事件**：影子树内 dispatch 必须 `new CustomEvent("change", { bubbles: true, composed: true, detail })`，否则**任何**框架都听不到；事件名用全小写、避免特殊字符（各框架监听语法的最大公约数）；
- **富数据走 property、简单标量镜像成 attribute**（reflect），并保持二者同步——这让声明式 HTML、`querySelector` 调试、框架绑定三者都好用；
- **Vue 反向输出**：Vue 自己的组件也能用 `defineCustomElement()` 编译成标准自定义元素对外交付——"框架内开发、标准格式交付"的路线。

### 与 Lit 的边界

裸写自定义元素时，attribute/property 反射、模板高效更新、响应式状态全是手工样板——[Lit](/zh/frontend-framework/ui/lit/)（约 5KB）把这层样板声明式化，产物仍是标准自定义元素，是目前生产 Web Components 的主流工程选择。本站有独立 Lit 叶，此处不展开。

至此四块主题（元素与生命周期、封装、模板与 SSR、表单与互操作）已经闭环，最后一页把全部 API 收进速查表并给出选型与易错点总览：[参考](../reference)。
