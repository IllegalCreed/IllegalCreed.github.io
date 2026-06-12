---
layout: doc
outline: [2, 3]
---

# 指南 · 基础

> 语法全家桶的细节与边界、静态结构带来的约束与红利、浏览器侧完整行为。版本基线 **2026-06**。

## 一、导出的四张面孔

```js
// 1. 命名导出：声明式 / 列表式，任意多个
export const name = "square";
export { draw, area as getArea };

// 2. 默认导出：本质是名为 default 的绑定，至多一个、可匿名
export default class Canvas {}
// import { default as Canvas } from "./canvas.js" 与 import Canvas 等价

// 3. 重导出：聚合 barrel 的基石——转发但不进当前作用域
export { Square } from "./square.js";   // 文件内用不了 Square！
export { default as Modal } from "./modal.js";

// 4. 整体重导出
export * from "./shapes.js";     // 全部命名导出（明确不含 default）
export * as shapes from "./shapes.js"; // 打包成命名空间转发
```

三个易错点：

- **第二个 `export default` 是语法错误**，不存在「后者覆盖前者」；
- 命名导出必须有名字：`export function () {}`、`export 42` 都非法；
- `export * ` 遇到多个来源的**同名导出会被静默忽略**（歧义导出），barrel 文件要小心。

## 二、静态结构：约束即红利

静态 import 两条铁律：**只能在模块顶层**（if/函数体内非法）、**说明符必须是字符串字面量**（变量/模板拼接非法）。看似不便，换来的是「不执行代码即可知道依赖图长什么样」：

- **tree-shaking**：导出与使用面静态可求解，没人用的导出可安全删除（配合 package.json `"sideEffects": false` 还能整文件剪枝）；
- **提前报错**：拼错导入名是加载期错误，而不是运行到那行才 undefined；
- **工具链红利**：IDE 跳转/重构、依赖可视化、打包器并行加载全靠它。

需要运行时决定加载什么，出口是动态 `import()`——说明符可以是变量，返回 `Promise<命名空间对象>`：

```js
const locale = await import(`./locales/${lang}.js`); // 打包器会做有限的 glob 预分析
```

## 三、模块作用域、严格模式与单次执行

每个模块三件「自动发生」的事：

1. **独立模块作用域**：顶层 `const`/`var`/`function` 都不挂全局对象——全局污染问题从根上消失；跨模块共享只能走 import/export（或显式 `window.x = ...`）。
2. **自动严格模式**：无法关闭；模块顶层 `this` 是 `undefined` 而非 `window`。
3. **单次执行**：模块图按**解析后的 URL** 缓存，无论被静态/动态导入多少次，顶层代码只执行一次，所有导入方共享同一份命名空间——模块天然是单例容器。注意浏览器中 `./m.js?v=2` 因 URL 不同会被当成新模块。

## 四、浏览器侧：type=module 的完整行为

```html
<script type="module" src="main.js"></script>
<script type="module">
  import { init } from "./app.js"; // 内联模块同样可以 import
  init();
</script>
```

| 行为 | 说明 |
| --- | --- |
| **默认 defer** | 并行下载不阻塞解析，文档解析完按出现顺序执行；写 `defer` 属性是冗余 |
| `async` 可选 | 下载完立刻执行（不保证顺序），适合独立分析脚本 |
| **CORS/同源** | 模块请求带 CORS 语义：`file://` 直开被拦（需本地服务器）；跨域 CDN 需正确响应头 |
| MIME | 浏览器认 `Content-Type: text/javascript`，不看扩展名；用 `.mjs` 需确认服务器 MIME 正确 |
| 单次执行 | 同 URL 多个 script 标签只执行一遍 |

### nomodule 双发回退

```html
<script type="module" src="modern.js"></script>
<script nomodule src="legacy-bundle.js"></script>
```

支持 ESM 的浏览器忽略 `nomodule` 脚本；不认识 `type="module"` 的老浏览器跳过模块、照常执行 `nomodule`——一份 HTML 服务新老两代，且互不重复执行。2026 年原生 ESM 支持率已极高，该手法主要存在于历史项目。

## 五、第一次用 import maps

浏览器原生不认裸说明符（`import "lodash"` 直接报错），import maps 补上这块：

```html
<script type="importmap">
{
  "imports": {
    "lodash": "https://cdn.jsdelivr.net/npm/lodash-es@4/lodash.js",
    "lodash/": "https://cdn.jsdelivr.net/npm/lodash-es@4/"
  }
}
</script>
<script type="module">
  import debounce from "lodash/debounce.js"; // 尾斜杠映射支持子路径
</script>
```

两条使用规则：import map 必须出现在**首个模块加载之前**；特性检测用 `HTMLScriptElement.supports?.("importmap")`。scopes 分区映射、支持度与 es-module-shims 回退见[进阶篇](./advanced)。

---

语法与浏览器行为打牢后，进入[指南 · 进阶](./advanced)：live bindings 与 CJS 值拷贝的对决、TDZ 与循环依赖、Node ESM 规则与互操作全图。
