---
layout: doc
outline: [2, 3]
---

# 可迭代协议与 Iterator Helpers

> 基于现代 JavaScript（ES2025 · 核于 2026-06）

## 速查

- **可迭代协议**：对象实现 `[Symbol.iterator]()` 方法、返回一个迭代器，就能用 `for...of` / `...` / 数组解构
- **迭代器协议**：对象有 `next()` 方法、每次返回 `{ value, done }`，`done: true` 表示结束
- 内置可迭代：数组、字符串、`Map`、`Set`、`arguments`、`NodeList`——所以它们都能 `for...of` 和扩展
- **类数组**（有 `length` 无 `Symbol.iterator`，如旧 `arguments`）：不可 `for...of`，需先转换
- 类数组/可迭代转真数组：`Array.from(x)` 或 `[...x]`（后者要求**可迭代**，前者两者都吃）
- `Array.from(obj, mapFn)`：转换时顺带映射，等价 `Array.from(obj).map(mapFn)` 但更省一趟
- **生成器** `function*` + `yield`：写自定义迭代器最简单的方式，能 `yield` 出无限序列
- **Iterator Helpers（ES2025**，Baseline 新近可用）：`map`/`filter`/`take`/`drop`/`flatMap`/`reduce`/`toArray`/`some`/`every`/`find`/`forEach`
- 迭代器方法是**惰性**的：不生成中间数组、按需求值，能安全处理**无限**迭代器（配 `take`）
- `Iterator.from(x)`：把任意可迭代对象包装成带 helper 方法的迭代器；`Array.fromAsync`（**ES2024**）处理异步源

## 数组之上的真正抽象

为什么 `for...of`、扩展 `...`、数组解构这套语法，对数组、字符串、`Map`、`Set` 全都管用？因为它们并非「为数组特制」，而是面向一个更通用的契约——**可迭代协议**。数组只是众多「可迭代对象」中最常见的一个。理解这层，才算从「会用数组」升级到「理解 JS 的迭代体系」。

## 两个协议：可迭代 vs 迭代器

它们是配套的两层约定：

- **可迭代协议（iterable）**：一个对象若有名为 `Symbol.iterator` 的方法、且该方法返回一个**迭代器**，它就是「可迭代的」，可用于 `for...of`、`...`、数组解构。
- **迭代器协议（iterator）**：一个对象若有 `next()` 方法、每次调用返回 `{ value, done }` 形状的结果（`done: true` 表示迭代结束），它就是「迭代器」。

```js
const arr = [10, 20];
const it = arr[Symbol.iterator](); // 拿到数组的迭代器

it.next(); // { value: 10, done: false }
it.next(); // { value: 20, done: false }
it.next(); // { value: undefined, done: true }（结束）
```

`for...of` 在背后做的，正是「调用 `[Symbol.iterator]()` 拿迭代器，反复 `next()` 直到 `done`」。

### 手写一个可迭代对象

任意对象只要实现 `[Symbol.iterator]`，就能接入语言级语法：

```js
const range = {
  from: 1,
  to: 3,
  [Symbol.iterator]() {
    let current = this.from;
    const last = this.to;
    return {
      next() {
        return current <= last
          ? { value: current++, done: false }
          : { value: undefined, done: true };
      },
    };
  },
};

[...range]; // [1, 2, 3]（扩展可用）
for (const n of range) console.log(n); // 1 2 3（for...of 可用）
const [a, b] = range; // a=1, b=2（解构可用）
```

## 类数组 ≠ 可迭代

「类数组对象」有数字索引和 `length`，但**没有** `Symbol.iterator`，因此**不能** `for...of`、不能用 `...` 扩展。典型代表是旧式 `arguments`、某些 DOM 集合：

```js
const arrayLike = { 0: "a", 1: "b", length: 2 };

// for (const x of arrayLike) {} // ❌ TypeError: not iterable
// [...arrayLike]                // ❌ TypeError: not iterable

// 但 Array.from 能吃「类数组」（它认 length，不强求可迭代）
Array.from(arrayLike); // ["a", "b"] ✅
```

## 转成真数组：`Array.from` vs 扩展 `...`

两者都能把「别的东西」变成真数组，但适用面不同：

```js
const set = new Set([1, 2, 2, 3]);

[...set]; // [1, 2, 3]（扩展：要求对象「可迭代」）
Array.from(set); // [1, 2, 3]（Array.from：可迭代 或 类数组都行）

// Array.from 独有：第二参是映射函数，转换时顺带变形
Array.from(set, (x) => x * 10); // [10, 20, 30]
Array.from({ length: 3 }, (_, i) => i); // [0, 1, 2]（凭空造序列）
```

| 能力 | `[...x]` | `Array.from(x)` |
| --- | --- | --- |
| 可迭代对象 | ✅ | ✅ |
| 类数组（仅 `length`） | ❌ | ✅ |
| 转换时映射 | ❌（需再 `.map`） | ✅（第二参 `mapFn`） |

## 生成器：写迭代器的捷径

手写 `next()` 很啰嗦。**生成器函数**（`function*` + `yield`）让你用「顺序代码」描述「逐个产出值」，返回的生成器对象**本身就是迭代器**：

```js
function* range(from, to) {
  for (let i = from; i <= to; i++) {
    yield i; // 每个 yield 产出一个值，函数在此「暂停」
  }
}

[...range(1, 4)]; // [1, 2, 3, 4]
for (const n of range(1, 3)) console.log(n); // 1 2 3
```

生成器能 `yield` 出**无限序列**，因为它惰性求值、要一个才算一个：

```js
function* naturals() {
  let n = 1;
  while (true) yield n++; // 无限，但不会卡死——只在被 next 时推进
}
```

::: tip 生成器 vs 迭代器
**迭代器**是「有 `next()` 的对象」这个运行时契约；**生成器**是「用 `function*` 写出迭代器」的便捷语法。所有生成器都是迭代器，但内置迭代器（如数组的 `.values()`）并不是生成器。
:::

## Iterator Helpers（ES2025）

过去要对迭代器做 `map` / `filter`，得先 `[...it]` 摊成数组——这会**立即跑完**整个迭代器、生成中间数组，对无限序列更是直接死循环。**ES2025** 给迭代器原型加上了一组与数组同名的方法（**Iterator Helpers**，Baseline 新近可用），它们**惰性**工作、不产生中间数组：

| 迭代器方法 | 作用 |
| --- | --- |
| `map(fn)` / `filter(fn)` | 惰性变形 / 筛选 |
| `take(n)` / `drop(n)` | 取前 `n` 个 / 跳过前 `n` 个 |
| `flatMap(fn)` | 映射后摊平一层 |
| `reduce(fn, init)` | 折叠成单值（**会跑完**） |
| `toArray()` | 物化成真数组 |
| `some` / `every` / `find` / `forEach` | 与数组同名的终结操作 |

```js
const set = new Set([1, 2, 3, 4, 5, 6]);

// 在迭代器上链式调用，全程不生成中间数组
const result = set
  .values() // 拿到迭代器
  .filter((n) => n % 2 === 0) // 惰性筛偶数
  .map((n) => n * 10) // 惰性 ×10
  .toArray(); // 到此才真正迭代一遍 → [20, 40, 60]
```

### 惰性的杀手锏：驯服无限序列

惰性意味着「只算到够用为止」，于是无限生成器 + `take` 成了可能：

```js
function* naturals() {
  let n = 1;
  while (true) yield n++;
}

// 从无限自然数里，取前 5 个平方数 —— 不会死循环
naturals()
  .map((n) => n * n)
  .take(5) // take 一旦集满 5 个就停止向上游索取
  .toArray(); // [1, 4, 9, 16, 25]
```

### `Iterator.from`：给任意可迭代对象装上 helper

如果手头是个普通可迭代对象（没继承 `Iterator` 原型），用 `Iterator.from(x)` 包一层即可获得这些方法：

```js
Iterator.from([1, 2, 3, 4])
  .filter((n) => n > 2)
  .toArray(); // [3, 4]
```

## `Array.fromAsync`：异步可迭代的归宿（ES2024）

`Array.from` 只认同步源。当数据来自**异步可迭代对象**（如异步生成器、分页拉取的流），用 **ES2024** 的 `Array.fromAsync`，它会**逐个 await** 并返回一个 **Promise**：

```js
async function* fetchPages() {
  yield await Promise.resolve(["a", "b"]);
  yield await Promise.resolve(["c"]);
}

// 返回 Promise<Array>，逐个等待异步产出
const pages = await Array.fromAsync(fetchPages()); // [["a", "b"], ["c"]]

// 也能把「元素是 Promise 的同步可迭代」逐个等待
await Array.fromAsync([Promise.resolve(1), Promise.resolve(2)]); // [1, 2]
```

## Baseline 与版本一览

| 特性 | 版本 | 状态（2026-06 核） |
| --- | --- | --- |
| 可迭代 / 迭代器协议、生成器、`Array.from` | ES2015 | ✅ Baseline 广泛可用 |
| `Array.fromAsync` | ES2024 | 🟡 Baseline 新近可用（2024-01 起） |
| Iterator Helpers（`map`/`filter`/`take`/`drop`/…、`Iterator.from`） | ES2025 | 🟡 Baseline 新近可用，旧环境需 polyfill / 降级为 `[...it]` |

::: warning Iterator Helpers 的兼容性
Iterator Helpers 是新近落地的能力，面向较旧的浏览器 / 运行时需做特性检测或引 polyfill；降级方案是退回「先 `[...iter]` 成数组再用数组方法」（代价是失去惰性、对无限序列不可用）。
:::

## 小结

可迭代协议（`Symbol.iterator`）是数组、字符串、`Map`、`Set` 共享的底层契约，`for...of`、扩展、解构都建立在它之上；生成器是手写迭代器的捷径，能产出无限序列；ES2025 的 Iterator Helpers 让迭代器获得惰性、无中间数组的链式能力，配 `take` 即可安全处理无限流；异步数据则交给 ES2024 的 `Array.fromAsync`。至此本叶从「数组容器」走到了「迭代协议」的全貌——所有要点与 Baseline 状态汇总见 [参考](../reference)。
