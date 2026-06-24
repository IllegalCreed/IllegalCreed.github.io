---
layout: doc
outline: [2, 3]
---

# 生成器基础

> 基于现代 JavaScript（ES2025 · 核于 2026-06）

## 速查

- 声明：`function* name() {}` 或 `function*`（星号位置不限 `function *` / `function* `，惯例贴 `function`）
- 调用生成器函数**不执行函数体**，而是返回一个**生成器对象**（一个迭代器）
- `gen.next()`：从上次暂停处跑到下一个 `yield`，返回 `{ value, done }`；`yield` 表达式产出 `value`
- `return x`：结束生成器，最后一次 `next()` 给 `{ value: x, done: true }`——但 `for...of` / 扩展**会忽略**这个值
- `yield*` 委托：`yield* iterable` 逐个透传另一个生成器 / 可迭代对象的产出（不是 `yield [一个数组]`）
- 生成器**可迭代**：`for...of`、`[...gen]`、解构都能用；但**只能消费一次**（`[Symbol.iterator]()` 返回自身）
- 惰性求值：值在被 `next()` 索取时才计算，故能表达 `while (true) yield` 的**无限序列**
- 双向通信：`gen.next(v)` 把 `v` 作为**当前 `yield` 表达式的返回值**传回（首个 `next()` 的参数被忽略）
- `gen.return(v)`：从外部提前结束（会触发函数内 `try...finally` 的 `finally`）
- `gen.throw(err)`：在当前 `yield` 暂停点「抛出」错误，可被生成器内 `try...catch` 接住

## `function*`：调用即得状态机

生成器函数用 `function*` 声明。它最反直觉的一点是：**调用它并不运行函数体**，而是返回一个**生成器对象**。代码要等到你对这个对象调用 `next()` 才逐段执行：

```js
function* gen() {
  console.log("开始");
  yield 1;
  console.log("中间");
  yield 2;
  console.log("结束");
  return 3;
}

const g = gen(); // 什么都没打印——函数体还没跑
g.next(); // 打印「开始」→ { value: 1, done: false }
g.next(); // 打印「中间」→ { value: 2, done: false }
g.next(); // 打印「结束」→ { value: 3, done: true }（return 值进了 value，done 变 true）
g.next(); // { value: undefined, done: true }（之后恒为 done）
```

每个 `yield` 是一个「暂停点」：执行到这里，把 `yield` 后面的值放进 `{ value, done }` 交出去，函数**冻结现场**（局部变量、执行位置全部保留），直到下一次 `next()` 再从原地解冻继续。这正是生成器与普通函数的根本区别——普通函数只能「一次跑完」，生成器能「跑一段、停、再跑一段」。

::: tip `return` 的值去哪了
`return x` 会让 `done` 变 `true` 且 `value` 为 `x`。但 `for...of` 和扩展 `...` 在 `done: true` 时就停止、**不收集**那一帧的 `value`。所以「想被遍历到的值用 `yield`，`return` 只用来提前收尾」。
:::

## 生成器既是迭代器，也是可迭代对象

生成器对象自带 `next()`（所以是**迭代器**），同时它的 `[Symbol.iterator]()` 返回**它自己**（所以也是**可迭代对象**）。于是 `for...of`、扩展、解构都能直接作用于它：

```js
function* abc() {
  yield "a";
  yield "b";
  yield "c";
}

for (const ch of abc()) console.log(ch); // a b c
[...abc()]; // ["a", "b", "c"]
const [first, second] = abc(); // first="a", second="b"

const g = abc();
g[Symbol.iterator]() === g; // true —— 迭代器就是它自己
```

::: warning 只能消费一次
正因为 `[Symbol.iterator]()` 返回自身、而迭代器一旦走到 `done` 就停在那里，**同一个生成器对象不能重复遍历**。下面第二个循环什么都不打印：

```js
const g = abc();
for (const ch of g) console.log(ch); // a b c
for (const ch of g) console.log(ch); // （空——g 已耗尽）
```

需要重复遍历就**每次重新调用** `abc()` 拿一个新生成器，或把它包成一个「每次返回新生成器」的可迭代对象（见 [自定义迭代器](./custom-iterators)）。
:::

## `yield*`：委托给另一个生成器

`yield*`（带星号）把**另一个生成器或可迭代对象**的产出逐个「透传」出去，是组合生成器的标准手段。注意它和 `yield 一个数组` 完全不同——后者吐出整个数组，前者吐出数组里的每个元素：

```js
function* range(start, end) {
  for (let i = start; i <= end; i++) yield i;
}

function* asciiCodes() {
  yield* range(48, 57); // 0-9 的码位
  yield* range(65, 90); // A-Z
  yield* range(97, 122); // a-z
}

let str = "";
for (const code of asciiCodes()) str += String.fromCharCode(code);
str; // "0123456789ABC...XYZabc...xyz"
```

`yield*` 右侧只要是可迭代对象即可，所以也能委托数组、字符串、`Set`：

```js
function* flatten() {
  yield* [1, 2]; // 委托数组 → 1, 2
  yield* "ab"; // 委托字符串 → "a", "b"
  yield 3;
}
[...flatten()]; // [1, 2, "a", "b", 3]
```

## 惰性求值与无限序列

生成器**按需计算**：`while (true) yield ...` 不会卡死，因为每个值只在被 `next()` 索取时才生成。这让「无限序列」成为可写、可控的东西：

```js
function* naturals() {
  let n = 1;
  while (true) yield n++; // 无限，但只在被索取时推进一步
}

const g = naturals();
g.next().value; // 1
g.next().value; // 2
g.next().value; // 3 …… 永远可以继续，但不占无限内存
```

配合 ES2025 的 **Iterator Helpers**（`take` / `map` / `filter` 等），无限生成器能被安全地「截断使用」：

```js
naturals()
  .map((n) => n * n) // 惰性：平方
  .take(5) // 取够 5 个就停止向上游索取
  .toArray(); // [1, 4, 9, 16, 25]
```

> Iterator Helpers 属 ES2025（Baseline 新近可用），旧环境需 polyfill；这套惰性管道在 [数组与可迭代协议](../../js-arrays-iterables/guide-line/iterables-iterator-helpers) 一叶有完整展开。

## `yield` 是双向的：把值传回生成器

到目前为止 `yield` 都在「往外吐」。其实它也能「往里收」——`gen.next(v)` 传入的 `v`，会成为**当前那个 `yield` 表达式的求值结果**。于是生成器既能产出，也能接收，形成一来一回的对话：

```js
function* dialog() {
  const name = yield "你叫什么？"; // 第 2 次 next 的入参落到这里
  const age = yield `你好 ${name}，几岁？`; // 第 3 次 next 的入参落到这里
  return `${name}, ${age} 岁`;
}

const g = dialog();
g.next().value; // "你叫什么？"（首个 next 不传参，只是启动）
g.next("Ada").value; // "你好 Ada，几岁？"（"Ada" → name）
g.next(28).value; // "Ada, 28 岁"（28 → age；done: true）
```

::: warning 首个 `next()` 的参数被丢弃
第一次 `next()` 只负责「启动到第一个 `yield`」，此时还没有任何 `yield` 表达式在等待赋值，所以传给它的参数**永远被忽略**。要往里传值，从第二次 `next()` 开始。
:::

这种双向能力让生成器可写出「带反馈的状态机」，例如一个可重置的斐波那契序列：

```js
function* fib() {
  let [a, b] = [0, 1];
  while (true) {
    const reset = yield a; // 外部可通过 next(true) 要求重置
    [a, b] = reset ? [0, 1] : [b, a + b];
  }
}

const f = fib();
f.next().value; // 0
f.next().value; // 1
f.next().value; // 1
f.next().value; // 2
f.next(true).value; // 0（被重置）
```

## 外部控制：`return()` 与 `throw()`

除了 `next()`，生成器对象还有两个从外部干预执行的方法：

```js
function* withCleanup() {
  try {
    yield 1;
    yield 2;
    yield 3;
  } finally {
    console.log("清理"); // return() / 正常结束 / throw 都会经过这里
  }
}

const g = withCleanup();
g.next(); // { value: 1, done: false }
g.return("强制结束"); // 打印「清理」→ { value: "强制结束", done: true }
g.next(); // { value: undefined, done: true }
```

- **`gen.return(v)`**：立即结束生成器（仿佛在当前暂停点执行了 `return v`），并触发沿途未完成的 `try...finally`。`for...of` 中途 `break` 时，引擎正是替你调用了 `return()`。
- **`gen.throw(err)`**：在当前 `yield` 暂停点「抛出」`err`，可被生成器内部的 `try...catch` 捕获并继续：

```js
function* guarded() {
  try {
    yield 1;
  } catch (e) {
    console.log("内部捕获:", e.message);
    yield 2; // 捕获后还能继续产出
  }
}

const g = guarded();
g.next(); // { value: 1, done: false }
g.throw(new Error("出错")); // 打印「内部捕获: 出错」→ { value: 2, done: false }
```

若 `throw()` 抛出的错误未被生成器内部接住，它会向调用处冒泡，且生成器进入 `done` 状态。

## 小结

生成器用 `function*` + `yield` 把函数变成可暂停、可恢复的状态机：调用得到生成器对象，`next()` 驱动它走到下一个 `yield`；`yield*` 组合多个生成器；惰性求值让无限序列成为可能；`next(v)` / `return()` / `throw()` 构成双向通信与外部控制。它既是迭代器也是可迭代对象，因而能无缝接入 `for...of`。当每一步产出都要 `await` 时，就该升级到下一页的 [异步生成器](./async-generators)。
