---
layout: doc
outline: [2, 3]
---

# 高阶函数

> 基于现代 JavaScript（ES2025 · 核于 2026-06）

## 速查

- **高阶函数（HOF）**：接收函数作参数、或返回函数的函数；JS 里函数是「一等公民」，这才成立
- 内置 HOF：`map` / `filter` / `reduce` / `forEach` / `sort` / `some` / `every`——都接收回调
- **柯里化（currying）**：把 `f(a, b, c)` 改造成 `f(a)(b)(c)`，每次只收一个参数、返回收下一个参数的函数（靠闭包记住已收的）
- **偏函数（partial application）**：预先固定函数的**部分**参数，得到参数更少的新函数（`bind(null, …)` 即偏函数）
- 柯里化 vs 偏函数：柯里化是「一次一个、链式」；偏函数是「一次固定几个、剩下一起传」
- **函数组合（compose / pipe）**：把多个单参函数串成流水线——`compose` 从右往左、`pipe` 从左往右执行
- 这些范式的共同基础是**闭包**（见 [作用域链与闭包](./scope-closures)）：返回的函数「记住」外层已固定的参数
- 实践价值：复用、消除重复、声明式数据处理；但层层包裹会增加调试与可读成本，按需使用

## 什么是高阶函数

在 JavaScript 里，函数和数字、字符串一样是**值**——可以赋给变量、放进数组、当参数传、被返回。凡是「**接收函数作参数**」或「**返回一个函数**」的函数，就叫高阶函数：

```js
// ① 接收函数作参数
function repeat(n, action) {
  for (let i = 0; i < n; i++) action(i);
}
repeat(3, console.log); // 0 1 2

// ② 返回函数
function multiplier(factor) {
  return (n) => n * factor; // 返回的箭头函数记住了 factor（闭包）
}
const triple = multiplier(3);
triple(5); // 15
```

最常用的高阶函数其实是数组内置方法——它们都接收一个回调：

```js
const nums = [1, 2, 3, 4];
nums.map((x) => x * x); // [1, 4, 9, 16]
nums.filter((x) => x % 2 === 0); // [2, 4]
nums.reduce((sum, x) => sum + x, 0); // 10
```

## 柯里化

**柯里化**把「一次接收多个参数」的函数，改造成「一次接收一个参数、逐步返回新函数」的链式形式。`f(a, b, c)` 变成 `f(a)(b)(c)`：

```js
// 普通三参函数
function add(a, b, c) {
  return a + b + c;
}

// 手写柯里化版本
function addCurried(a) {
  return function (b) {
    return function (c) {
      return a + b + c; // 闭包记住了 a、b
    };
  };
}
addCurried(1)(2)(3); // 6
```

用箭头函数可写得很紧凑：

```js
const addC = (a) => (b) => (c) => a + b + c;
addC(1)(2)(3); // 6
```

它的价值在于「**先固定一部分、稍后复用**」：

```js
const add10 = addC(10); // 固定 a = 10
const add10and5 = add10(5); // 再固定 b = 5
add10and5(1); // 16
add10and5(2); // 17
```

::: tip 通用 curry 工具
实践中常用一个通用 `curry`，让函数既能 `f(a)(b)(c)` 也能 `f(a, b)(c)` 灵活调用——Lodash 的 `_.curry` 即此类。手写时核心思路：实参够了就执行，不够就返回继续收集参数的函数（同样靠闭包累积已收参数）。
:::

## 偏函数

**偏函数**是「预先固定函数的**部分**参数」，得到一个参数更少的新函数。它和柯里化目标相近，但形式不同——偏函数一次可固定若干个，剩下的一起传：

```js
function multiply(a, b) {
  return a * b;
}

// 用 bind 做偏函数：固定 a = 2（this 用不到传 null）
const double = multiply.bind(null, 2);
double(5); // 10
double(8); // 16
```

也可以手写一个通用 `partial`：

```js
function partial(fn, ...fixed) {
  return (...rest) => fn(...fixed, ...rest); // 闭包记住已固定的 fixed
}
const greet = (greeting, name) => `${greeting}, ${name}!`;
const sayHi = partial(greet, "Hi");
sayHi("Ann"); // "Hi, Ann!"
```

### 柯里化 vs 偏函数

| 维度 | 柯里化 | 偏函数 |
| --- | --- | --- |
| 每次接收参数数 | 一个 | 任意个 |
| 调用形式 | `f(a)(b)(c)` 链式 | `g(剩余参数)` 一次补齐 |
| 目的 | 把多参函数拆成单参链 | 预填部分参数、降低元数 |
| 常见实现 | 通用 `curry` | `bind` / 手写 `partial` |

## 函数组合

**组合**把多个「单输入单输出」的小函数拼成一条流水线，前一个的输出喂给后一个。两种方向：

- `compose(f, g, h)(x)` = `f(g(h(x)))`——**从右往左**执行；
- `pipe(f, g, h)(x)` = `h(g(f(x)))`——**从左往右**执行（更贴近阅读顺序）。

```js
const compose =
  (...fns) =>
  (x) =>
    fns.reduceRight((acc, fn) => fn(acc), x); // 右→左

const pipe =
  (...fns) =>
  (x) =>
    fns.reduce((acc, fn) => fn(acc), x); // 左→右

const inc = (x) => x + 1;
const double = (x) => x * 2;
const square = (x) => x * x;

compose(square, double, inc)(3); // ((3+1)*2)² = 64
pipe(inc, double, square)(3); // 同样 64，但按书写顺序执行
```

组合让数据处理变得声明式——把「做什么」拆成一串命名清晰的小步骤，再拼起来：

```js
const clean = pipe(
  (s) => s.trim(),
  (s) => s.toLowerCase(),
  (s) => s.replace(/\s+/g, "-")
);
clean("  Hello World  "); // "hello-world"
```

## 都建立在闭包之上

柯里化、偏函数、组合返回的函数，无一例外靠**闭包**记住「已经固定的参数 / 待串联的函数列表」。理解了 [作用域链与闭包](./scope-closures)，这些范式就只是闭包的不同应用姿势：

```js
const multiplier = (factor) => (n) => n * factor;
//                  ↑ 外层参数 factor 被内层箭头函数闭住
const byTen = multiplier(10);
byTen(7); // 70 —— factor=10 一直被记着
```

::: warning 别为了函数式而函数式
高阶函数能显著提升复用与可读性，但层层 `compose` / 深度柯里化也会让调用栈变深、调试变难、新人读起来吃力。在团队代码里，优先保证**直观**——简单逻辑直接写循环 / 内置数组方法，比强行组合更清晰。
:::

## 小结

高阶函数把「函数」当成可传递、可加工的数据，催生了柯里化（拆成单参链）、偏函数（预填部分参数）、组合（拼成流水线）三种范式，底层全靠闭包支撑。它们是 JavaScript 函数式风格的核心，用对了能让数据处理既简洁又可复用。

## 下一步

本叶六个深度页到此结束。最后一页是 [参考](../reference)——把函数四形态、`this` 四规则、`call`/`apply`/`bind`、闭包要点汇成速查表，并附标准与权威文档链接。
