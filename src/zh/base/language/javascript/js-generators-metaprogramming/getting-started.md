---
layout: doc
outline: [2, 3]
---

# 入门

> 基于现代 JavaScript（ES2025 · 核于 2026-06）

## 速查

- **生成器** `function*` + `yield`：调用不执行，返回**生成器对象**；`next()` 跑到下一个 `yield` 暂停并返回 `{ value, done }`
- 生成器对象**既是迭代器也是可迭代对象**（`gen[Symbol.iterator]() === gen`），可直接 `for...of` / `...` / 解构，但**只能迭代一次**
- `yield*` 委托：把另一个生成器 / 可迭代对象的产出「透传」出去（组合生成器）
- 双向通信：`next(v)` 把 `v` 作为当前 `yield` 表达式的值传回；`return()` 提前结束、`throw()` 在暂停处抛错
- **异步生成器** `async function*`：内部可 `await`，外部用 `for await...of` 消费；实现 `Symbol.asyncIterator`（**ES2018**）
- **自定义迭代器**：给对象写 `*[Symbol.iterator]()` 生成器方法，三五行即可接入 `for...of` / 扩展 / 解构
- **Proxy**：`new Proxy(target, handler)`，用 **13 个陷阱**拦截 `get` / `set` / `has` / `deleteProperty` / `apply` / `construct` 等底层操作
- **Reflect**：与 13 个陷阱**一一对应**的静态方法命名空间，陷阱里 `Reflect.*(...)` 即「执行默认行为」；`Reflect.get(t, k, receiver)` 保留正确的 getter `this`
- **well-known symbols**：语言内置协议钩子——`Symbol.iterator` / `asyncIterator` / `toPrimitive` / `toStringTag` / `hasInstance` / `dispose` …
- **资源管理（ES2026）**：`using x = ...`（块尾自动调 `[Symbol.dispose]()`）、`await using`（调 `[Symbol.asyncDispose]()`），手动版 `DisposableStack`；Stage 4 但**尚未 Baseline**

## 四块拼图，一张全景

本叶讲的是两件相关但不同的事——**「让函数能暂停」（生成器）**与**「让对象按你的规则运转」（元编程）**——它们经由 `Symbol.iterator` 这道协议汇到一处：

```text
                 ┌─────────────────────────────────────────────┐
   生成器  ──────┤ function* / yield  → 可暂停的状态机          │
                 │   ├─ yield* 委托、next(v)/return/throw 双向   │
                 │   ├─ 惰性求值 → 无限序列                      │
                 │   └─ async function* → for await...of（异步） │
                 └───────────────┬─────────────────────────────┘
                                 │ 生成器对象本身就是迭代器
   自定义迭代器 ◀────────────────┘  *[Symbol.iterator]() 三行接入 for...of
                                 │
                 ┌───────────────┴─────────────────────────────┐
   元编程   ─────┤ Proxy（13 陷阱拦截） + Reflect（转发默认行为）│
                 │ well-known symbols（语言钩子插孔）           │
                 │ using / await using / DisposableStack（ES2026）│
                 └─────────────────────────────────────────────┘
```

下面用最小例子把每块点一遍，每块都指向对应深页。

## ① 生成器：能暂停的函数

普通函数一旦调用就一口气跑完。**生成器函数**（`function*`）不同——调用它**不执行任何代码**，而是返回一个**生成器对象**；每次 `next()` 才把代码推进到下一个 `yield`，吐出一个值后**就地暂停**：

```js
function* count() {
  yield 1;
  yield 2;
  yield 3;
}

const g = count(); // 此刻函数体一行都没跑
g.next(); // { value: 1, done: false }
g.next(); // { value: 2, done: false }
g.next(); // { value: 3, done: false }
g.next(); // { value: undefined, done: true }
```

因为它「要一个才算一个」，所以能表达**无限序列**而不卡死。详见 [生成器基础](./guide-line/generators)。

## ② 自定义迭代器：生成器是捷径

手写迭代器要自己维护 `next()` 和 `{ value, done }`，很啰嗦。直接给对象写一个 `*[Symbol.iterator]()` 生成器方法，就能接入 `for...of`、扩展、解构：

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
```

这正是数组、字符串、`Map`、`Set` 之所以都能 `for...of` 的同一套协议。详见 [用生成器实现自定义迭代器](./guide-line/custom-iterators)。

## ③ 异步生成器：流式数据的归宿

当每个值都需要 `await`（分页请求、读流），用 `async function*`，外部用 `for await...of` 逐个等待消费：

```js
async function* pages() {
  let url = "/api/items?page=1";
  while (url) {
    const res = await fetch(url);
    const data = await res.json();
    yield data.items; // 每页产出一批
    url = data.nextPage;
  }
}

for await (const items of pages()) {
  console.log(items.length); // 逐页处理，不必一次拉全
}
```

详见 [异步生成器](./guide-line/async-generators)。

## ④ Proxy + Reflect：拦截对象的一切

`Proxy` 在对象外面包一层，用「陷阱」拦截读、写、删、调用等底层操作；`Reflect` 提供与陷阱同名的方法，让你在拦截后「执行默认行为」：

```js
const user = new Proxy(
  { name: "Ada" },
  {
    get(target, key, receiver) {
      console.log(`读取 ${String(key)}`);
      return Reflect.get(target, key, receiver); // 转发默认读取
    },
    set(target, key, value, receiver) {
      if (key === "age" && typeof value !== "number") {
        throw new TypeError("age 必须是数字");
      }
      return Reflect.set(target, key, value, receiver);
    },
  },
);

user.name; // 打印「读取 name」→ "Ada"
user.age = 30; // OK
// user.age = "老" // TypeError
```

这就是 Vue 3 响应式、数据校验层、Mock 框架的内核。详见 [Proxy 与 Reflect](./guide-line/proxy-reflect)。

## ⑤ 语言钩子与资源管理

`Proxy` 拦截「操作」，**well-known symbols** 则挂接「协议」——把对象插进语言内置行为。例如 `Symbol.toPrimitive` 决定对象怎样被转成原始值：

```js
const money = {
  amount: 42,
  [Symbol.toPrimitive](hint) {
    return hint === "string" ? `¥${this.amount}` : this.amount;
  },
};

`${money}`; // "¥42"（字符串场景）
money * 2; // 84（数字场景）
```

而 ES2026 的 `using` 让资源（文件、锁、连接）在**块作用域结束时自动释放**，免去手写 `try/finally`：

```js
function readConfig() {
  using file = openFileSync("config.json"); // 退出本函数时自动 file[Symbol.dispose]()
  return file.readAll();
} // ← 这里自动释放，即使中途 return / 抛错
```

详见 [元编程进阶与资源管理](./guide-line/metaprogramming-resources)。

## 心智模型：三句话

1. **生成器 = 可暂停的函数**：`function*` 把「顺序代码」变成「按需吐值的状态机」，是迭代与惰性流的统一机制。
2. **Proxy/Reflect = 改写底层操作**：`Proxy` 拦截、`Reflect` 转发，二者配套才能既定制又不破坏默认语义（`receiver` 是关键）。
3. **symbols/using = 挂接语言协议**：well-known symbols 是语言留好的插孔，`using` 把「确定性释放」补进了 JS。

## 下一步

从 [生成器基础](./guide-line/generators) 开始顺读，或直接跳到你最关心的一页——[异步生成器](./guide-line/async-generators)、[自定义迭代器](./guide-line/custom-iterators)、[Proxy/Reflect](./guide-line/proxy-reflect)、[元编程进阶与资源管理](./guide-line/metaprogramming-resources)。
