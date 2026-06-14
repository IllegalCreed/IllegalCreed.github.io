---
layout: doc
outline: [2, 3]
---

# 入门

> 本篇讲 **`lodash-es`（Lodash 的 ESM 版）** 的上手：它是什么、怎么按需引入、最常用的几族方法速览。版本基线 **Lodash 4.18.1**（`lodash` 与 `lodash-es` 同版本）。对比对象：普通 `lodash`（CJS）、原生 ES2023+、es-toolkit。

## 速查

- 安装：`pnpm add lodash-es`，TS 项目再加 `pnpm add -D @types/lodash-es`
- 按需引入（推荐）：`import { debounce, cloneDeep } from 'lodash-es'` → 打包器自动 tree-shaking
- 要避免：`import _ from 'lodash'`（整体导入 CJS 版，无法摇树）
- 深拷贝：`cloneDeep(obj)`；深合并：`merge(a, b)`（⚠️ 变异 a）；深比较：`isEqual(a, b)`
- 安全取值：`get(obj, 'a[0].b', 默认值)`；安全设值：`set(obj, 'a.b', v)`（⚠️ 变异 obj）
- 防抖：`debounce(fn, 300)`；节流：`throttle(fn, 300)`；都带 `.cancel()` / `.flush()`
- ⚠️ `lodash-es` 不内置 TS 类型，需 `@types/lodash-es`
- ⚠️ 简单的 `map/filter/find/flat` 原生即可，不必为它们引入 lodash

## 一、lodash-es 是什么

`lodash-es` 是 Lodash 官方用 `lodash-cli`（命令 `lodash modularize exports="es"`）构建出的 **ES modules** 版本。三个关键点：

1. **同源同版本**：与 `lodash` 完全一致的 API、一致的版本号（当前 4.18.1），只是模块格式不同。
2. **每方法一个模块**：`node_modules/lodash-es/` 下每个方法都是独立 `.js` 文件（如 `debounce.js`、`cloneDeep.js`），用 `export default` 导出。
3. **可摇树**：`package.json` 里 `"type": "module"` + `"sideEffects": false`，告诉打包器「无副作用、可安全删除未用导出」，于是按需引入时只打包你用到的方法。

```js
// lodash-es 入口 lodash.js 的结构（节选）：逐方法具名再导出
export { default as debounce } from "./debounce.js";
export { default as cloneDeep } from "./cloneDeep.js";
export { default as get } from "./get.js";
// ……共数百个
```

> 边界提醒：本篇所有示例默认在 **ESM + 现代打包器**（Vite/Rollup/webpack5）环境下，这是 lodash-es 的主战场。

## 二、为什么用它（而不是整体导入 lodash）

| 写法 | 模块格式 | tree-shaking | 结果 |
|---|---|---|---|
| `import _ from 'lodash'` | CJS 整体 | ❌ 不可摇 | 全部 ~300 方法进 bundle |
| `import { x } from 'lodash-es'` | ESM 具名 | ✅ 可摇 | 只打包 x 及其内部依赖 |
| `import x from 'lodash-es/x.js'` | ESM 子路径 | ✅ 可摇 | 同上，更显式 |
| `import 'lodash.x'`（per-method 包） | CJS | — | ⚠️ 重复内联依赖，反而更大 |

核心结论：**ESM 项目用 `lodash-es` 的具名导入**，让打包器去摇树。

## 三、安装与第一段代码

```bash
# 安装 lodash-es
pnpm add lodash-es
# TypeScript 项目：补类型（lodash-es 不内置 d.ts）
pnpm add -D @types/lodash-es
```

```js
import { cloneDeep, get, debounce } from "lodash-es";

// 深拷贝：打破引用，修改副本不影响原值
const copy = cloneDeep({ user: { roles: ["admin"] } });

// 安全取深层值：路径不存在时返回默认值，不抛错
const city = get(form, "address.city", "未知");

// 防抖：高频输入只在静默 300ms 后触发一次
const onSearch = debounce((kw) => fetchList(kw), 300);
```

## 四、最常用的方法族（速览）

### 集合 / 数组（Collection / Array）

```js
import { groupBy, keyBy, orderBy, uniqBy, chunk } from "lodash-es";

groupBy([6.1, 4.2, 6.3], Math.floor); // { '4': [4.2], '6': [6.1, 6.3] }
keyBy([{ id: "a" }, { id: "b" }], "id"); // { a: {id:'a'}, b: {id:'b'} }
orderBy(users, ["age", "name"], ["asc", "desc"]); // 多键、各自方向
uniqBy([{ id: 1 }, { id: 1 }], "id"); // 按 id 去重
chunk(["a", "b", "c", "d"], 2); // [['a','b'],['c','d']]
```

### 对象（Object）

```js
import { get, set, pick, omit, merge, defaults } from "lodash-es";

pick(obj, ["a", "b"]); // 白名单：只留 a、b（新对象）
omit(obj, ["a", "b"]); // 黑名单：去掉 a、b（新对象）
merge({ a: { x: 1 } }, { a: { y: 2 } }); // 深合并 → { a: { x:1, y:2 } }（⚠️ 变异第一个参数）
```

### lang（类型 / 拷贝 / 比较）

```js
import { cloneDeep, isEqual, isEmpty, isNil } from "lodash-es";

isEqual({ a: [1] }, { a: [1] }); // true（深比较，SameValueZero）
isEmpty({}); // true；isEmpty([]) → true；注意 isEmpty(0) 也是 true
isNil(null); // true（null 或 undefined）
```

### 函数（Function）

```js
import { debounce, throttle, memoize, once, curry } from "lodash-es";

const debounced = debounce(fn, 300); // 防抖：静默后触发
const throttled = throttle(fn, 300); // 节流：每周期最多一次
const memoized = memoize(calc); // 缓存（⚠️ 默认只用第一个参数当 key）
const init = once(setup); // 只执行一次
```

---

掌握基本引入与常用方法后，进入 [指南 · 基础](./guide-line/base)：tree-shaking 原理、变异 vs 不可变、iteratee 简写、与原生方法的取舍。
