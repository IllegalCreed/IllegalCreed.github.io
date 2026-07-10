---
layout: doc
outline: [2, 3]
---

# 指南 · 基础

> 版本基线 **Lodash 4.18.1**。本篇把「会用」推进到「懂机制」：tree-shaking 是怎么生效的、哪些方法会变异入参、iteratee 简写的三种形态、以及和原生方法的取舍边界。

## 速查

- **模块基线**：`lodash-es@4.18.1` 的包元数据同时声明 `"type": "module"`、`"module": "lodash.js"` 与 `"sideEffects": false`，面向 ESM 静态分析与 tree-shaking。
- **导入建议**：优先 `import { debounce } from 'lodash-es'`；子路径直达在原生 ESM 中写成 `lodash-es/debounce.js`。
- **变异警戒**：`merge`、`set`、`assign`、`defaults`、`pull`、`remove` 会修改目标入参；`pick`、`omit`、`mapValues`、`uniq` 返回新值。
- **iteratee 简写**：字符串是 `property`，对象是 `matches`，`[path, value]` 是 `matchesProperty`；复杂条件直接写函数更清楚。
- **原生优先**：静态路径用 `?.` / `??`，普通数组映射过滤用原生方法，原始值去重用 `Set`。
- **仍适合 Lodash**：动态深路径、深合并、深比较、防抖节流，以及需要自定义遍历语义的集合操作。
- **深拷贝边界**：纯结构化数据优先评估 `structuredClone`；含函数时它会抛 `DataCloneError`，`cloneDeep` 会保留函数引用。

## 一、tree-shaking 到底是怎么生效的

`lodash-es` 能按需打包，靠的是三件事**同时**成立：

1. **ESM 模块格式**：`package.json` 里 `"type": "module"`，每个方法是独立的 `export default` 模块——静态可分析的 `import`/`export`，打包器能确定「谁用了谁」。
2. **`sideEffects: false`**：声明「仅 import 而不使用某导出时，删掉它不影响程序」，打包器据此放心摇掉未引用的方法。
3. **具名导入**：`import { debounce } from 'lodash-es'`，让打包器精确知道你只要 `debounce`。

```js
// ✅ 摇树友好：只有 cloneDeep 及其内部依赖进 bundle
import { cloneDeep } from "lodash-es";

// ⚠️ 整体导入 CJS lodash：打包器无法像 ESM 那样可靠静态摇树
import _ from "lodash";
_.cloneDeep(x);
```

::: tip 三者缺一不可
即使用了 lodash-es，如果写成 `import * as _ from 'lodash-es'` 再到处 `_.xxx`，虽然技术上仍可被部分摇树，但容易让人误以为全量引入；最稳妥、最直观的还是**具名导入**。
:::

## 二、变异（mutate）还是不可变（immutable）？

这是 Lodash 最该先分清的一类陷阱：**一部分方法会直接修改你传入的对象**，另一部分返回新值不改原值。

| 会变异入参（改原对象） | 返回新值（不改原对象） |
|---|---|
| `merge` / `mergeWith` | `cloneDeep` / `clone` |
| `assign` / `assignIn` | `pick` / `omit` |
| `defaults` / `defaultsDeep` | `mapValues` / `mapKeys` |
| `set` / `unset` / `update` | `get` / `has` |
| `pull` / `remove` / `fill` | `filter` / `map` / `uniq` |

```js
import { merge, pick } from "lodash-es";

const a = { x: { p: 1 } };
merge(a, { x: { q: 2 } }); // a 被改成 { x: { p:1, q:2 } }
console.log(a.x); // { p: 1, q: 2 } —— a 变了！

const b = { m: 1, n: 2 };
const c = pick(b, ["m"]); // c = { m: 1 }，b 不变
```

::: warning 不可变场景别直接用变异方法
Redux reducer、Vue/React 的状态更新要求「返回新对象、不改原值」。这时**不能**直接 `set(state, path, v)` / `merge(state, patch)`——它们会变异 `state`。做法见[专家篇](./expert)：用 `lodash/fp` 的不可变版本、先 `cloneDeep` 再改、或用 immer。
:::

## 三、iteratee 简写：三种形态

集合方法（`map`/`filter`/`find`/`sortBy`…）的回调（iteratee）支持三种简写，理解它们等价于哪个函数很重要：

```js
import { find, map, filter } from "lodash-es";

// ① 字符串 → _.property 简写：取该属性值
map(users, "name"); // 等价 users.map(u => u.name)

// ② 对象 → _.matches 简写：匹配「属性全部相等」的元素
find(users, { active: true, role: "admin" }); // 找 active 且 role 匹配的

// ③ [key, value] → _.matchesProperty 简写：匹配「某属性等于某值」
filter(users, ["active", false]); // 找 active === false 的
```

> 简写让代码简洁，但要清楚它在做「取值」还是「匹配」。复杂逻辑仍传完整函数 `u => ...`。

## 四、和原生方法的取舍边界

不是所有 Lodash 方法都值得用——很多已被原生平替：

| 需求 | Lodash | 原生平替（ES2023+） | 建议 |
|---|---|---|---|
| 遍历/映射/过滤 | `map`/`filter`/`forEach` | `Array.prototype.map/filter/forEach` | **用原生** |
| 查找 | `find`/`findIndex` | `Array.prototype.find/findIndex` | **用原生** |
| 扁平化 | `flatten`/`flattenDeep` | `arr.flat()`/`arr.flat(Infinity)` | **用原生** |
| 去重（原始值） | `uniq` | `[...new Set(arr)]` | **用原生** |
| 深拷贝（无函数） | `cloneDeep` | `structuredClone` | 看是否含函数 |
| 安全取值（静态路径） | `get` | 可选链 `?.` + `??` | **用原生** |
| 深合并 | `merge` | —（无原生） | **用 Lodash** |
| 深比较 | `isEqual` | —（无原生） | **用 Lodash** |
| 防抖/节流 | `debounce`/`throttle` | —（需手写，易错） | **用 Lodash** |
| 动态路径取值/设值 | `get`/`set` | —（路径是变量时麻烦） | **用 Lodash** |

::: tip 一句话原则
**简单且原生已覆盖的 → 用原生**；**复杂、容错要求高、原生没有的（深合并 / 深拷贝含循环引用 / 深比较 / 防抖节流 / 动态路径）→ 交给 lodash-es。**
:::

## 五、`cloneDeep` vs `structuredClone`

两者都是深拷贝，但能力不同：

```js
import { cloneDeep } from "lodash-es";

const obj = { fn: () => 42, when: new Date(), tags: new Set([1]) };

cloneDeep(obj); // ✅ 保留函数（按引用）、Date、Set，不报错
structuredClone(obj); // ❌ 抛 DataCloneError —— 结构化克隆无法克隆函数
```

- **含函数 / 类实例方法** → 用 `cloneDeep`（`structuredClone` 会抛错）。
- **纯数据（无函数）且想零依赖** → 原生 `structuredClone` 即可（也支持循环引用、`ArrayBuffer` 等）。
- 都比 `JSON.parse(JSON.stringify(obj))` 强：后者丢函数/`undefined`、`Date` 变字符串、遇循环引用直接抛错。

---

进入 [指南 · 进阶](./advanced)：`debounce`/`throttle` 的 `leading`/`trailing`/`maxWait`、`memoize` 的缓存坑、`flow` 组合、`get/set` 与可选链的对比实战。
