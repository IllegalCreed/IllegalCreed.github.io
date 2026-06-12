---
layout: doc
outline: [2, 3]
---

# 入门

> 版本基线 **2026-06**：ESM 语法自 ES2015 起步，Top-level await（ES2022）、import attributes（ES2025）均已入标准；浏览器三引擎全支持 import maps；Node 在维 LTS（20.19+/22.12+）均默认支持 `require(esm)`。

## 速查

- 定位：**ECMAScript 标准模块系统**，静态结构 + live bindings，浏览器/Node 原生支持
- 浏览器：`<script type="module">`——默认 defer、自动严格模式、受 CORS 约束（不能 `file://` 直开）
- Node：最近 package.json `"type": "module"` 或 `.mjs` 扩展名；相对导入**必须带扩展名**
- 导出：命名导出任意多个 + 默认导出至多一个，可共存；`as` 重命名
- 动态加载：`import()` 返回 Promise（普通脚本、CJS 里也能用）
- ⚠️ ESM 里没有 `require`/`__dirname`/`__filename`——替代见[进阶篇](./guide-line/advanced)
- ⚠️ 同一模块全图只执行一次，所有导入方共享实例

## 一、ES Module 是什么

ES2015 之前 JS 没有语言级模块，社区各自造轮子（CommonJS、AMD……前史与 require 体系见 [CommonJS 篇](../commonjs/)）。ESM 把模块写进了语言标准，两个关键词：

1. **静态结构**：`import`/`export` 只能在模块顶层，说明符必须是字符串字面量。依赖关系**不执行代码**就能确定——tree-shaking、循环依赖提前检错、编辑器精确分析全部建立在这上面。
2. **live bindings**：导入的不是值的拷贝，而是指向导出变量的**实时只读视图**——导出方更新，导入方立即可见（对比 CJS 的值拷贝，详见[进阶篇](./guide-line/advanced)）。

## 二、第一组导入导出

```js
// square.js —— 命名导出：任意多个
export const name = "square";
export function draw(ctx, length) { /* ... */ }

// main.js —— 命名导入 + as 重命名
import { name, draw as drawSquare } from "./square.js";
```

```js
// modal.js —— 默认导出：至多一个，可匿名
export default function createModal() { /* ... */ }

// main.js —— 默认导入：名字随意取
import createModal from "./modal.js";
```

两者可共存；还有两种聚合形态：

```js
// 命名空间导入：所有导出聚成一个只读对象，default 在 ns.default 上
import * as Square from "./square.js";

// 重导出（barrel 文件）：转发但不引入当前作用域
export { Square } from "./shapes/square.js";
export * from "./shapes/circle.js"; // 注意：export * 不转发 default
```

## 三、浏览器里跑起来

```html
<script type="module" src="main.js"></script>
```

三件事自动发生：**默认 defer**（并行下载、文档解析完按序执行）、**自动严格模式**、**模块作用域**（顶层声明不挂 window）。两个新手必踩的坑：

- **不能双击 HTML 直接打开**：模块加载受 CORS/同源策略约束，`file://` 协议直接被拦——起个本地服务器（`npx http-server` 或 Vite）即解决；
- **同一模块只执行一次**：写两遍 `<script type="module" src="a.js">`，顶层代码也只跑一遍。

老浏览器回退用 `nomodule` 双发：支持 ESM 的浏览器忽略 `<script nomodule>`，老浏览器反之只执行它。

## 四、Node 里跑起来

```bash
mkdir esm-demo && cd esm-demo && npm init -y
```

package.json 加一行，包内 `.js` 全按 ESM 解析：

```json
{ "type": "module" }
```

```js
// util.js
export function add(a, b) { return a + b; }

// index.js —— 相对导入必须写全扩展名！
import { add } from "./util.js"; // ✓
// import { add } from "./util";    ✗ ERR_MODULE_NOT_FOUND
console.log(add(1, 2));
```

```bash
node index.js # 3
```

Node ESM 的解析有意与浏览器对齐：**不补扩展名、不找目录 index**——`./startup` 必须写成 `./startup/index.js`。打包器平时帮你补全了，纯 Node 环境下这是头号报错来源。不想动 `type` 字段时，单文件可直接用 `.mjs` 扩展名（无条件按 ESM）。

## 五、动态 import()：按需加载

静态 import 必须顶层 + 字面量，按条件/按需加载用函数形态的 `import()`：

```js
button.addEventListener("click", async () => {
  const { Chart } = await import("./chart.js"); // 返回 Promise<命名空间对象>
  new Chart().render();
});
```

它在普通 `<script>`、甚至 CommonJS 里都能用——也是 CJS 加载异步 ESM 的唯一通道。

## 六、与 CommonJS 的一句话边界

| 维度     | ES Module              | CommonJS（详见 [CommonJS 篇](../commonjs/)） |
| -------- | ---------------------- | -------------------------------------------- |
| 归属     | 语言标准               | Node 起家的社区规范                          |
| 结构     | 静态，编译期定依赖     | 动态，`require()` 运行时求值                 |
| 导入语义 | live binding（只读）   | 值拷贝（require 时快照）                     |
| 加载     | 异步友好（支持 TLA）   | 同步                                         |

---

跑通第一个模块后，进入[指南 · 基础](./guide-line/base)：语法全家桶细节、静态结构的约束与红利、浏览器侧完整行为。
