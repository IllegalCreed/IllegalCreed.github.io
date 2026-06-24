---
layout: doc
outline: [2, 3]
---

# 表单事件与页面加载

> 基于现代 JavaScript（ES2025 · 核于 2026-06）

## 速查

- **控件事件**：`input`（每次内容变化即时触发）、`change`（失焦且值变了才触发）、`focus` / `blur`（聚焦 / 失焦，**不冒泡**）
- **`focus`/`blur` 不冒泡**：委托要用会冒泡的 `focusin` / `focusout`，或在捕获阶段监听
- **表单提交**：监听 `<form>` 的 `submit`；`event.preventDefault()` 拦默认整页提交，改异步处理
- **取值**：`input.value`（文本框当前值）、`checkbox.checked`（布尔）、`select.value`；读「现在输入了什么」永远用属性
- **`DOMContentLoaded`**：HTML 解析完、DOM 树就绪即触发（图片 / 样式表**未必**加载完）——绑事件、初始化的最佳时机
- **`load`**（`window`）：连图片、样式表等**全部资源**加载完才触发，比 `DOMContentLoaded` 晚
- **`document.readyState`**：`"loading"` → `"interactive"`（≈DOMContentLoaded）→ `"complete"`（≈load）；变化派发 `readystatechange`
- **脚本时机**：普通 `<script>` 阻塞解析；`defer` 后台下载、解析完按序执行（在 `DOMContentLoaded` 前）；`async` 下完即跑、不保证顺序；`type="module"` 默认 `defer` 行为

## 控件事件：`input` 与 `change` 的分工

表单控件（输入框、下拉、复选）最常用两个「值变化」事件，区别要分清：

```js
const box = document.querySelector("#search");

// input：用户每敲一个字符就立即触发，适合实时搜索 / 即时校验
box.addEventListener("input", () => {
  console.log("当前值：", box.value); // 读 .value 属性拿实时内容
});

// change：控件【失去焦点】且值确实改变了才触发，适合「最终确认」类逻辑
box.addEventListener("change", () => {
  console.log("最终值：", box.value);
});
```

- **`input`**：内容一变**立即**触发（连续敲字会连续触发）——做实时反馈用它；
- **`change`**：要等控件**失焦**、且值相比聚焦前有变化才触发——对 `<select>` 下拉、`<input type="checkbox">` 这类则是选中即触发。

取值始终用**属性**（上一页讲过：`value` 属性=当前值，特性=初始值）：文本框 `el.value`、复选框 `el.checked`（布尔）、下拉 `select.value`。

## 聚焦事件：`focus` / `blur` 不冒泡

```js
input.addEventListener("focus", () => input.classList.add("active")); // 获得焦点
input.addEventListener("blur", () => validate(input)); // 失去焦点，常用于校验
```

::: warning `focus` / `blur` 默认不冒泡，委托要换门路
和 `click` 不同，`focus` / `blur` **不会冒泡**，所以不能直接在父容器上委托监听它们。两条出路：
- 用它们会冒泡的**孪生版本** `focusin` / `focusout`（语义相同、但能冒泡），即可委托；
- 或给 `addEventListener` 传 `{ capture: true }`，在**捕获阶段**监听（捕获阶段会经过祖先）。
:::

## 表单提交：拦住默认提交

监听 `<form>` 的 `submit` 事件，**不是**监听提交按钮的 `click`——回车提交、JS 触发提交都会走 `submit`，更可靠：

```js
const form = document.querySelector("#login-form");

form.addEventListener("submit", (event) => {
  event.preventDefault(); // 关键：拦住浏览器默认的「整页刷新式提交」

  // 取各控件的值，自行处理（校验、用 fetch 异步提交等）
  const data = new FormData(form); // 也可直接 form.elements.xxx.value
  console.log("用户名：", data.get("username"));
});
```

`event.preventDefault()` 是表单 JS 化的核心——拦下默认提交后，页面不再刷新，由你接管校验与提交流程。

## 页面加载：`DOMContentLoaded` vs `load`

脚本想操作 DOM，前提是 DOM 已经存在。两个里程碑事件标记了加载的不同阶段：

| 事件 | 触发对象 | 触发时机 |
| --- | --- | --- |
| `DOMContentLoaded` | `document` | **HTML 解析完、DOM 树就绪**；图片 / 样式表**未必**加载完 |
| `load` | `window` | 连图片、样式表、子框架等**全部外部资源**都加载完 |

```js
// 最常用：DOM 一就绪就初始化（此时所有元素都能 querySelector 到）
document.addEventListener("DOMContentLoaded", () => {
  init(); // 绑事件、读元素、渲染……
});

// 需要等图片真正加载完（如读图片真实尺寸）时才用 load
window.addEventListener("load", () => {
  console.log("含图片在内的一切都好了");
});
```

绝大多数初始化逻辑挂 `DOMContentLoaded` 即可——它**早于** `load`，能让页面更快「活」起来；只有确实依赖图片 / 样式表加载完成的逻辑（如测量图片尺寸）才用 `load`。

### `readyState`：随时查当前处于哪个阶段

`document.readyState` 反映文档加载所处阶段，状态变化会派发 `readystatechange` 事件：

| 值 | 含义 |
| --- | --- |
| `"loading"` | 文档正在加载（还在解析 HTML） |
| `"interactive"` | 解析完成、DOM 就绪（与 `DOMContentLoaded` 大致同时） |
| `"complete"` | 全部资源加载完（与 `window.load` 大致同时） |

```js
// 健壮写法：脚本若在 DOMContentLoaded 之后才执行，直接跑；否则等事件
if (document.readyState !== "loading") {
  init();
} else {
  document.addEventListener("DOMContentLoaded", init);
}
```

还有两个离场事件：`beforeunload`（用户将离开页面时触发，可弹出「确认离开」提示）、`unload`（页面正在卸载，只宜做极简的收尾，如发送统计）。

## 脚本加载时机：`defer` / `async` / `module`

「脚本拿不到元素」的根因常是**脚本执行时 DOM 还没解析到那里**。理解脚本与 HTML 解析的关系，就能从根上避免：

```html
<!-- 普通脚本：下载与执行都【阻塞】HTML 解析，后面的 DOM 此刻还不存在 -->
<script src="app.js"></script>

<!-- defer：后台并行下载，【不阻塞】解析；等整篇文档解析完、DOMContentLoaded 前执行 -->
<script defer src="app.js"></script>

<!-- async：后台并行下载，【下完立即执行】，不等其它脚本、也不保证顺序 -->
<script async src="analytics.js"></script>

<!-- 模块脚本：默认就是 defer 行为，天然等 DOM 解析完 -->
<script type="module" src="app.js"></script>
```

三者关键差异：

| 方式 | 是否阻塞解析 | 执行时机 | 多脚本顺序 | `DOMContentLoaded` 是否等它 |
| --- | --- | --- | --- | --- |
| 普通 `<script>` | **阻塞** | 立即（边解析边停下执行） | 按文档顺序 | 等（在它之后才触发） |
| `defer` | 不阻塞 | 文档解析完、`DOMContentLoaded` 前 | **保持文档顺序** | 等 |
| `async` | 不阻塞 | **下载完立即**执行 | 谁先下完谁先跑（无序） | **不等** |
| `type="module"` | 不阻塞 | 同 `defer`（默认） | 保持顺序 | 等 |

实战选择：

- **依赖完整 DOM、或多个脚本有先后依赖** → 用 `defer`（或 `type="module"`）：保证 DOM 已就绪、且按顺序执行；
- **完全独立的第三方脚本**（统计、广告等，不依赖你的 DOM 与其它脚本） → 用 `async`：下完即跑、不拖慢页面。

::: tip 补充：`defer` / `async` 只对外部脚本生效
`defer` 与 `async` 只对**带 `src` 的外部脚本**有意义，内联脚本会忽略它们。另外，用 `document.createElement("script")` 动态创建插入的脚本，**默认就是 `async` 行为**（可手动把 `.async = false` 改回有序）。
:::

## 小结

控件事件里 `input`（实时）与 `change`（失焦确认）分工明确，`focus` / `blur` 不冒泡、委托需改用 `focusin` / `focusout` 或捕获阶段；表单提交监听 `submit` 并 `preventDefault` 拦默认刷新。页面加载用 `DOMContentLoaded`（DOM 就绪、最常用）与 `load`（全资源就绪）两个里程碑，`readyState` 可随时查阶段。脚本统一用 `defer` / `type="module"` 控制时机，从根上杜绝「DOM 还没就绪」。本叶到此把「操作 DOM 树 + 响应事件」两条主线讲完——速查与全表见 [参考](../reference)。
