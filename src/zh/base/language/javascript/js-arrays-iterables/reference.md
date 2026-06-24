---
layout: doc
outline: [2, 3]
---

# 参考

> 基于现代 JavaScript（ES2025 · 核于 2026-06）

## 速查

- 变更方法（改原数组）九个：`push` / `pop` / `shift` / `unshift` / `splice` / `sort` / `reverse` / `fill` / `copyWithin`
- 不可变孪生（**ES2023**）：`toSorted` / `toReversed` / `toSpliced` / `with`，返回新数组、原数组不动
- 反向查找（**ES2023**）：`findLast` / `findLastIndex`，从末尾往前
- 变换三件套：`map`（变形）/ `filter`（筛选）/ `reduce`（聚合，**必传初始值**）
- `slice`（复制·不改原）vs `splice`（就地改）；`includes` 能识别 `NaN`，`indexOf` 不能
- 解构：`[a, b] = arr` 按位、`{ x, y } = obj` 按名；默认值仅对 `undefined`；剩余 `...` 须最后
- 扩展 `...`：摊开/合并/传参，**浅拷贝**；深拷贝用 `structuredClone`
- 协议：`[Symbol.iterator]()` 让对象可 `for...of`/扩展/解构；类数组无此方法，需 `Array.from`
- Iterator Helpers（**ES2025**）：迭代器上的 `map`/`filter`/`take`/`drop`/`toArray`，惰性、可处理无限序列
- 异步源：`Array.fromAsync`（**ES2024**）返回 Promise

## 变更 vs 不变更对照表

| 操作意图 | 变更方法（改原数组） | 不变更替代（返回新数组） |
| --- | --- | --- |
| 排序 | `sort(fn)` | `toSorted(fn)`（ES2023）/ `[...arr].sort(fn)` |
| 反转 | `reverse()` | `toReversed()`（ES2023）/ `[...arr].reverse()` |
| 增删改（任意位） | `splice(s, n, ...x)` | `toSpliced(s, n, ...x)`（ES2023） |
| 替换单项 | `arr[i] = v` | `with(i, v)`（ES2023） |
| 尾部追加 | `push(...x)` | `[...arr, ...x]` / `concat(x)` |
| 尾部删除 | `pop()` | `slice(0, -1)` |
| 头部追加 | `unshift(...x)` | `[...x, ...arr]` |
| 头部删除 | `shift()` | `slice(1)` |
| 区间填充 | `fill(v, s, e)` | `map((x, i) => …)` |

## 数组方法速查

### 增删改（多为变更方法）

| 方法 | 改原 | 返回 |
| --- | --- | --- |
| `push(...items)` / `pop()` | ✅ | 新长度 / 被删元素 |
| `unshift(...items)` / `shift()` | ✅ | 新长度 / 被删元素 |
| `splice(start, n, ...items)` | ✅ | 被删元素数组 |
| `fill(value, start, end)` | ✅ | 同一数组引用 |
| `copyWithin(target, start, end)` | ✅ | 同一数组引用 |

### 查询与复制（不变更）

| 方法 | 返回 | 备注 |
| --- | --- | --- |
| `slice(start, end)` | 新数组 | 浅拷贝片段，支持负索引 |
| `concat(...items)` | 新数组 | 合并 |
| `indexOf` / `lastIndexOf(v)` | 索引或 `-1` | `===` 比较，找不到 `NaN` |
| `includes(v)` | 布尔 | SameValueZero，能识别 `NaN` |
| `at(i)` | 元素或 `undefined` | 支持负索引 |
| `join(sep)` | 字符串 | 默认逗号分隔 |

### 遍历与变换（不变更，回调签名 `(el, i, arr)`）

| 方法 | 返回 | 用途 |
| --- | --- | --- |
| `map(fn)` | 等长新数组 | 一对一变形 |
| `filter(fn)` | 子集新数组 | 条件筛选 |
| `reduce(fn, init)` / `reduceRight` | 累加结果 | 折叠成单值（空数组无 `init` 抛错） |
| `forEach(fn)` | `undefined` | 仅遍历副作用，不可 break |
| `find(fn)` / `findIndex(fn)` | 元素 / 索引 | 首个匹配 |
| `findLast(fn)` / `findLastIndex(fn)` | 元素 / 索引 | 末个匹配（ES2023） |
| `some(fn)` / `every(fn)` | 布尔 | 存在 / 全称（短路） |
| `flat(depth)` / `flatMap(fn)` | 新数组 | 拍平 / 映射并拍平一层 |

### 迭代器视图

| 方法 | 产出 |
| --- | --- |
| `keys()` | 索引迭代器 |
| `values()` / `[Symbol.iterator]()` | 值迭代器（`for...of` 默认走它） |
| `entries()` | `[索引, 值]` 迭代器 |

### 静态方法

| 方法 | 作用 |
| --- | --- |
| `Array.isArray(v)` | 是否为数组（区分于普通对象） |
| `Array.of(...items)` | 用参数逐个造数组（避开 `Array(n)` 坑） |
| `Array.from(x, mapFn?)` | 可迭代 / 类数组 → 数组，可顺带映射 |
| `Array.fromAsync(x, mapFn?)` | 异步可迭代 → `Promise<Array>`（ES2024） |

## 解构与扩展速查

```js
// 数组解构：按位、跳过、默认、剩余
const [a, , c = 0, ...rest] = arr;
// 对象解构：按名、重命名、默认、剩余
const { x, y: yy = 1, ...others } = obj;
// 函数参数解构（带整体默认，避免不传参崩溃）
function f({ size = "big" } = {}) {}
// 扩展：复制 / 合并 / 传参（浅拷贝）
const copy = [...arr];
const merged = { ...a, ...b }; // 后者覆盖前者
Math.max(...nums);
// 剩余参数：收集成真数组
function g(...args) {}
// 给已声明变量解构对象：整句加括号
;({ a, b } = obj);
```

## 可迭代 / 迭代器速查

```js
// 迭代器协议：next() → { value, done }
const it = [1, 2][Symbol.iterator]();
it.next(); // { value: 1, done: false }

// 生成器：写迭代器的捷径
function* gen() {
  yield 1;
  yield 2;
}

// Iterator Helpers（ES2025）：惰性、无中间数组、可处理无限序列
set.values()
  .filter((n) => n > 0)
  .map((n) => n * 2)
  .take(3)
  .toArray();
```

## 现代特性 Baseline 状态（2026-06 核）

| 特性 | 版本 | 状态 | 用法建议 |
| --- | --- | --- | --- |
| `map` / `filter` / `reduce` / `find` / `flat` / `flatMap` | ES5～ES2019 | ✅ Baseline 广泛可用 | 放心用 |
| 解构、扩展 `...`、剩余、生成器、`Array.from` | ES2015 | ✅ Baseline 广泛可用 | 放心用 |
| 对象扩展 `{ ...obj }` | ES2018 | ✅ Baseline 广泛可用 | 放心用 |
| `Array.prototype.at` | ES2022 | ✅ Baseline 广泛可用 | 放心用 |
| `toSorted` / `toReversed` / `toSpliced` / `with` | ES2023 | ✅ Baseline 广泛可用 | 放心用，不可变更新首选 |
| `findLast` / `findLastIndex` | ES2023 | ✅ Baseline 广泛可用 | 放心用 |
| `Array.fromAsync` | ES2024 | 🟡 Baseline 新近可用（2024-01） | 异步源用；老环境检测/降级 |
| Iterator Helpers（`map`/`take`/`drop`/`toArray`/`Iterator.from`…） | ES2025 | 🟡 Baseline 新近可用 | 渐进增强；旧环境 polyfill 或退回 `[...it]` |

## 权威链接

**标准 / 参考**

- [MDN: Array（方法全表）](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array) · [Iterator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Iterator)
- [MDN: Iteration protocols（迭代协议）](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols)
- [MDN: Destructuring assignment](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment) · [Spread syntax](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax)
- [TC39: ECMAScript 规范](https://tc39.es/ecma262/)

**指南 / 教程**

- [MDN: Indexed collections（索引集合指南）](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Indexed_collections)
- [javascript.info: 数组](https://javascript.info/array) · [数组方法](https://javascript.info/array-methods) · [可迭代对象](https://javascript.info/iterable)

**兼容性 / 查询**

- [Baseline 浏览器兼容查询：webstatus.dev](https://webstatus.dev/) · [caniuse.com](https://caniuse.com/)

## 相关页

- [入门](./getting-started) · [数组基础](./guide-line/array-basics) · [变更 vs 不变更方法](./guide-line/mutating-vs-immutable)
- [高阶遍历方法](./guide-line/higher-order-iteration) · [解构赋值](./guide-line/destructuring)
- [扩展与剩余 `...`](./guide-line/spread-rest) · [可迭代协议与 Iterator Helpers](./guide-line/iterables-iterator-helpers)
