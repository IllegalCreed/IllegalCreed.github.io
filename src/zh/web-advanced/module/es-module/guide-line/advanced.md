---
layout: doc
outline: [2, 3]
---

# 指南 · 进阶

> live bindings、提升与 TDZ、Top-level await、import.meta 全家、Node ESM 规则、从 ESM 消费 CJS、import maps 进阶。版本基线 **2026-06**。

## 一、live bindings：与 CJS 值拷贝的本质分野

```js
// counter.js
export let count = 0;
export function inc() { count++; }

// main.js
import { count, inc } from "./counter.js";
inc();
console.log(count); // 1 —— 实时看到导出方的更新
count = 5;          // TypeError！导入绑定只读
```

ESM 导入的是**指向导出变量的实时只读视图**：读永远最新，写一律禁止（单一写入方是该语义成立的前提）。CommonJS 则是 `require` 时的**值拷贝**——解构出来的原始值此后与源模块脱钩（机制细节见 [CommonJS 篇](../../commonjs/)）。命名空间对象同理：`ns.count` 实时、`ns.count = 5` 抛错。

## 二、提升、TDZ 与循环依赖

模块经历**解析 → 实例化 → 求值**三阶段：import/export 绑定在求值前已全部建立（即「import 提升」），且依赖先于依赖方执行。于是：

```js
sayHi();                          // ✓ 合法：绑定已建立、函数声明整体提升
import { sayHi } from "./a.js";   // import 写在底部也一样
```

循环依赖下这套机制的表现（对比 CJS 的「不完整快照」）：

- **函数互调通常没事**：函数声明提升 + live binding，等真正调用时绑定早已初始化；
- **过早取值立刻炸**：初始化前读取 `let`/`const` 导出 → **TDZ ReferenceError**——错误早而明确，好排查；
- CJS 在循环点拿到执行一半的 exports 快照，缺的属性是 `undefined`，往往运行很久才暴露。

## 三、Top-level await（ES2022）

```js
// config.js —— 模块顶层直接 await
const resp = await fetch("/api/config");
export default await resp.json();
```

- **模块专属**：普通脚本/CJS 里是语法错误；Node v14.8 起免 flag；
- **真实的等待语义**：导入方会等它完成再执行——整条依赖链被异步化；
- 两个代价：含 TLA 的模块**不能被 `require(esm)`**（见[专家篇](./expert)）；Node 中顶层 await 永不 resolve 时进程以**退出码 13** 结束。

## 四、import.meta 全家桶

```js
import.meta.url      // file:///app/src/mod.js —— 起步即有
import.meta.dirname  // /app/src   （v21.2/v20.11+，替代 __dirname）
import.meta.filename // /app/src/mod.js（同上，替代 __filename）
import.meta.resolve("pkg/style.css") // 同步返回解析后 URL 字符串，不加载（v20.6/v18.19 稳定）
import.meta.main     // 是否入口模块（v24.2+，替代 require.main === module）
```

兼容写法与资源定位：

```js
import { fileURLToPath } from "node:url";
const dir = path.dirname(fileURLToPath(import.meta.url)); // Node 20.11 之前
const data = readFileSync(new URL("./data.json", import.meta.url)); // 模块相对资源
```

## 五、Node ESM 规则清单

| 规则 | 内容 |
| --- | --- |
| 启用 | 最近 package.json `"type": "module"`（管 `.js`）或 `.mjs`（无条件）；反向 `"type": "commonjs"`/`.cjs` |
| **扩展名必须** | `./util` ✗ → `./util.js` ✓；`./dir` ✗ → `./dir/index.js` ✓（与浏览器对齐，不补全、不找 index） |
| 裸说明符 | 走 node_modules + `exports` 字段解析；包无 exports 时子路径同样要写全扩展名 |
| 作用域缺席 | 无 `require`/`module`/`__dirname`/`__filename`——替代见上表 |
| JSON | `import pkg from "./package.json" with { type: "json" }`，**强制** attributes，内容在 default |
| 历史 | v8.5 实验起步 → v12.22/v14.17/v15.3 正式稳定；如今 `--experimental-modules` 早已成历史 |

ESM 里确需同步 require（加载旧 CJS 插件等）的官方逃生舱：

```js
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const legacy = require("./legacy-plugin.cjs");
```

## 六、从 ESM 消费 CJS：interop 全图

```js
import pkg from "cjs-pkg";        // default = module.exports（官方规则）
import { readFile } from "node:fs"; // 命名导入也常常可用——为什么？
import * as ns from "cjs-pkg";    // namespace：{ default, ...猜出的命名导出 }
```

命名导入能用的功臣是 Node 内置的 **cjs-module-lexer**：加载 CJS 时**静态词法分析**源码，识别 `exports.foo = ...`、`module.exports = { foo }` 等模式，把猜出的名字提升为命名导出。限制也来自「静态猜测」：

- 运行时动态挂的导出（循环/条件赋值、`Object.assign` 构造）**识别不到**——命名导入报错，回退 `import pkg` 再解构；
- `default` 永远可靠（就是 `module.exports` 本体）；
- Node v23+ 的 namespace 上还有一个字符串键 `'module.exports'`，精确指向完整导出（解决转译产物 default 被 `__esModule` 协议重定向的歧义）。

反方向（CJS `require` ESM）已转正，但属于发布侧决策的核心背景，放在[专家篇](./expert)展开；require 的解析/缓存本身见 [CommonJS 篇](../../commonjs/)。

## 七、import maps 进阶与工程化

```html
<script type="importmap">
{
  "imports": { "vue": "https://cdn.../vue.esm-browser.prod.js" },
  "scopes": {
    "/legacy/": { "vue": "https://cdn.../vue@2/dist/vue.esm.js" }
  }
}
</script>
```

- **scopes**：按引用方路径前缀分区映射——同页共存两个版本的依赖（渐进迁移利器）；
- **支持度（2026）**：Chrome/Edge 89+、Firefox 108+、Safari 16.4+（2023-03 补齐），全球约 **94.5%**；
- **回退**：[es-module-shims](https://github.com/guybedford/es-module-shims)——在具备基础 ESM 能力的老浏览器上 polyfill import maps / import attributes 等新特性，生产级方案；
- **就位时机**：必须在首个模块解析前；稳妥做法是单份 import map 置于 `<head>` 顶部；
- **modulepreload**：`<link rel="modulepreload" href="app.js">` 提前下载并**解析、编译入模块图**（普通 preload 只缓存字节），且按模块 CORS 凭据模式请求避免二次下载——给关键依赖链每个模块都写一条。

---

机制吃透后，进入[指南 · 专家](./expert)：发布侧主场——exports 字段设计、dual package hazard、require(esm) 与 2026 的 ESM-only 决策。
