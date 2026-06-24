---
layout: doc
outline: [2, 3]
---

# 用生成器实现自定义迭代器

> 基于现代 JavaScript（ES2025 · 核于 2026-06）

## 速查

- **可迭代协议**：对象有 `[Symbol.iterator]()` 方法、返回一个**迭代器**，即可用于 `for...of` / 扩展 `...` / 解构
- **迭代器协议**：对象有 `next()`、每次返回 `{ value, done }`，`done: true` 表示结束
- 手写迭代器要自己维护状态与 `{ value, done }`；用**生成器方法** `*[Symbol.iterator]()` 三五行替代之
- 「可迭代对象」与「迭代器」是两层：前者**每次** `[Symbol.iterator]()` 应返回**新**迭代器 → 可重复遍历
- 生成器对象本身既是迭代器又是可迭代对象，但只能消费一次；故**可复用容器**应在 `[Symbol.iterator]()` 里**每次新建**生成器
- 无限序列：`while (true) yield`，配 `for...of` + `break` 或 Iterator Helpers 的 `take` 安全截断
- 与数组同源：数组、字符串、`Map`、`Set`、`NodeList` 都靠 `Symbol.iterator`，所以都能 `for...of` / 扩展
- 类数组（有 `length` 无 `Symbol.iterator`）不可 `for...of`；用 `Array.from` 或先实现 `Symbol.iterator`

## 两个协议，一层关系

JavaScript 的 `for...of`、扩展 `...`、数组解构并非「为数组特制」，而是面向一对配套的契约：

- **可迭代协议（iterable）**：对象若有名为 `Symbol.iterator` 的方法、且该方法返回一个**迭代器**，它就是「可迭代的」。
- **迭代器协议（iterator）**：对象若有 `next()` 方法、每次返回 `{ value, done }`（`done: true` 表结束），它就是「迭代器」。

数组只是「最常见的可迭代对象」之一。理解这层，就能把**任意**对象接入语言级的遍历语法。

```js
const arr = [10, 20];
const it = arr[Symbol.iterator](); // 取数组的迭代器
it.next(); // { value: 10, done: false }
it.next(); // { value: 20, done: false }
it.next(); // { value: undefined, done: true }
```

`for...of` 在背后做的，正是「调 `[Symbol.iterator]()` 拿迭代器，反复 `next()` 直到 `done`」。

## 手写迭代器：能用，但啰嗦

不借助生成器，让一个 `range` 对象可迭代，得自己维护游标和 `{ value, done }`：

```js
const range = {
  from: 1,
  to: 5,
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

[...range]; // [1, 2, 3, 4, 5]
for (const n of range) console.log(n); // 1 2 3 4 5
```

能跑，但样板代码（`current` / `last` / 手拼 `{ value, done }`）淹没了真正的逻辑「从 from 数到 to」。

## 生成器：把样板代码消掉

生成器对象**本身就是迭代器**，于是把 `[Symbol.iterator]` 写成**生成器方法**（`*[Symbol.iterator]()`），就能用顺序代码描述「逐个产出」，`{ value, done }` 由引擎自动包装：

```js
const range = {
  from: 1,
  to: 5,
  *[Symbol.iterator]() {
    for (let v = this.from; v <= this.to; v++) yield v;
  },
};

[...range]; // [1, 2, 3, 4, 5]
for (const n of range) console.log(n); // 1 2 3 4 5
const [a, b] = range; // a=1, b=2
```

逻辑只剩「`for` + `yield`」一行，可读性远胜手写版。这是「用生成器实现自定义迭代器」的核心范式。

::: tip 为什么这里能重复遍历，上一页的生成器对象却不能
关键在层次：`range` 是**可迭代对象**，每次 `for...of` 都会**重新调用** `[Symbol.iterator]()`、从而**每次得到一个全新的生成器**（新迭代器）。而 [生成器基础](./generators) 里直接拿到的是**单个生成器对象**——它的 `[Symbol.iterator]()` 返回自身，耗尽即止。所以「可复用的容器」要把生成器**藏在 `[Symbol.iterator]()` 方法里**，让它每次新建。
:::

## 无限序列：迭代器最擅长的事

迭代器「要一个算一个」，因此能表达数组根本装不下的**无限序列**。用生成器写无限自然数、斐波那契：

```js
const naturals = {
  *[Symbol.iterator]() {
    let n = 1;
    while (true) yield n++; // 无限，但惰性
  },
};

// 用 break 安全截断
for (const n of naturals) {
  if (n > 5) break;
  console.log(n); // 1 2 3 4 5
}
```

更优雅的截断方式是 ES2025 的 **Iterator Helpers**——直接在迭代器上 `take`：

```js
function* fib() {
  let [a, b] = [0, 1];
  while (true) {
    yield a;
    [a, b] = [b, a + b];
  }
}

fib().take(8).toArray(); // [0, 1, 1, 2, 3, 5, 8, 13]
```

> `take` / `map` / `filter` 这些惰性迭代器方法是 ES2025（Baseline 新近可用），它们让无限序列「按需取用」而不死循环；完整清单见 [数组与可迭代协议](../../js-arrays-iterables/guide-line/iterables-iterator-helpers)。

## 与数组迭代协议呼应

自定义迭代器和数组并非两套东西——它们共用同一个 `Symbol.iterator` 协议。这也解释了三件「为什么」：

- **为什么数组、字符串、`Map`、`Set` 都能 `for...of` 和 `[...x]`**：因为它们的原型上都实现了 `Symbol.iterator`。
- **为什么类数组对象（如旧式 `arguments`、`{ 0: 'a', length: 1 }`）不能 `for...of`**：它们只有 `length` 和索引，**没有** `Symbol.iterator`。
- **为什么给自定义对象加上 `[Symbol.iterator]` 后，它就「长得像数组一样好用」**：扩展、解构、`for...of` 全都基于这一个方法。

```js
const arrayLike = { 0: "a", 1: "b", length: 2 };
// for (const x of arrayLike) {} // ❌ TypeError: not iterable

// 方案一：Array.from 认 length，无需 Symbol.iterator
Array.from(arrayLike); // ["a", "b"]

// 方案二：补一个生成器方法，让它真正可迭代
arrayLike[Symbol.iterator] = function* () {
  for (let i = 0; i < this.length; i++) yield this[i];
};
[...arrayLike]; // ["a", "b"] ✅
```

::: tip 一个实用模式：让类自带迭代能力
给类写 `*[Symbol.iterator]()`，它的实例就能直接 `for...of`：

```js
class Stack {
  #items = [];
  push(x) {
    this.#items.push(x);
    return this;
  }
  // 从栈顶到栈底遍历
  *[Symbol.iterator]() {
    for (let i = this.#items.length - 1; i >= 0; i--) yield this.#items[i];
  }
}

const s = new Stack().push(1).push(2).push(3);
[...s]; // [3, 2, 1]
```
:::

## 小结

可迭代协议（`Symbol.iterator`）与迭代器协议（`next()` 返回 `{ value, done }`）是 `for...of` / 扩展 / 解构的共同地基；手写迭代器要维护游标与样板，而把 `[Symbol.iterator]` 写成**生成器方法**能把它压缩成「`for` + `yield`」。把生成器藏在方法里、每次新建，就得到可重复遍历的可迭代容器；惰性特性让无限序列可写可控。这套协议正是数组、字符串、`Map`、`Set` 共享的同一套机制。接下来从「定制遍历」走向「定制对象的一切操作」——[Proxy 与 Reflect](./proxy-reflect)。
