---
layout: doc
outline: [2, 3]
---

# 入门

> 基于现代 JavaScript（ES2025 · 核于 2026-06）

## 速查

- 函数四形态：声明 `function f(){}`（提升）、表达式 `const f = function(){}`（不提升）、箭头 `const f = () => {}`（无自己的 `this`）、IIFE `(function(){})()`（即定义即执行）
- 参数三机制：默认参数 `function f(a, b = 1){}`、剩余参数 `function f(...args){}`、`arguments` 类数组对象（箭头函数没有）
- 作用域：`let`/`const` 块级作用域，`var` 函数作用域；内层能读外层，外层读不到内层——这是**词法作用域**
- 闭包：函数 + 它创建时的词法环境；函数即使被返回到外部，也「记得」外层变量。每次调用外层函数都生成**独立**的闭包
- `this` 四规则：默认（独立调用 → 严格模式 `undefined`）、隐式（`obj.f()` → `obj`）、显式（`f.call(x)` → `x`）、`new`（→ 新对象）
- `this` 在**调用时**决定，不在定义时——把方法当回调传出去，`this` 就丢了
- 箭头函数不参与上面四规则：它从**定义处的外层**借 `this`，因此适合做回调、不适合做对象方法 / 构造器
- 改写 `this`：`call(thisArg, a, b)` 立即调用、`apply(thisArg, [a, b])` 参数用数组、`bind(thisArg)` 返回永久绑定的新函数

## 一段代码串起三条主线

下面这段代码同时演示了「函数形态」「闭包」「`this` 的四种指向」——本叶其余各页就是逐块拆解它：

```js
"use strict";

// ① 函数声明（会提升，可在定义前调用）
function greet(name) {
  return `你好，${name}`;
}

// ② 闭包：makeCounter 返回的函数「记住」了 count
function makeCounter() {
  let count = 0; // 私有变量，外部无法直接访问
  return () => ++count; // 箭头函数从外层借 this（这里用不到）
}
const counter = makeCounter();
console.log(counter(), counter()); // 1 2 —— 同一个闭包，count 持续累加

// ③ this 在调用时决定，同一个函数四种指向
const person = {
  name: "小明",
  sayHi() {
    return `我是 ${this.name}`; // this 取决于「怎么调用」
  },
};

console.log(person.sayHi()); // 隐式绑定：this === person → "我是 小明"

const fn = person.sayHi;
// fn();                       // 默认绑定：严格模式 this 是 undefined → 报错（this 丢了）

console.log(person.sayHi.call({ name: "小红" })); // 显式绑定 → "我是 小红"
```

::: tip 三条主线的关系
「函数形态」决定**语法与提升**，「作用域 / 闭包」决定**变量怎么被记住**，「`this`」决定**运行时上下文**。三者常常在同一行代码里同时起作用——比如「箭头函数 + 闭包 + 回调」就是现代 JS 最常见的组合。
:::

## 逐块拆解

### ① 函数的四种形态

```js
function declared() {}            // 声明：提升到作用域顶部
const expressed = function () {}; // 表达式：赋值后才存在
const arrow = () => {};           // 箭头：最短、无自己的 this
(function () {})();               // IIFE：定义后立即执行一次
```

四者各有适用场景：声明适合顶层工具函数（能在定义前调用）、表达式适合按条件赋值、箭头适合回调、IIFE 适合开辟一块私有作用域。详见 [函数的多种形态](./guide-line/function-forms)。

### ② 参数：默认 / 剩余 / arguments

```js
function fn(a, b = 10, ...rest) {
  // b 缺省时取 10；rest 收集剩余实参为真数组
  return [a, b, rest];
}
fn(1); // [1, 10, []]
fn(1, 2, 3, 4); // [1, 2, [3, 4]]
```

剩余参数 `...rest` 是真正的数组（能用 `map`/`filter`），而老的 `arguments` 只是「类数组」对象，且**箭头函数里根本没有 `arguments`**。详见 [函数的多种形态](./guide-line/function-forms)。

### ③ 作用域链与闭包

```js
function outer() {
  const secret = 42; // 外层变量
  return function inner() {
    return secret; // 内层「闭住」了 secret
  };
}
const f = outer(); // outer 已执行完
console.log(f()); // 42 —— secret 没被回收，闭包记得它
```

变量查找沿「内层 → 外层 → 全局」逐级向上，这条链在**函数定义时**就由代码位置确定（词法作用域）。闭包就是「函数 + 它定义处的词法环境」。详见 [作用域链与闭包](./guide-line/scope-closures)。

### ④ this 的四种指向

```js
function show() {
  return this;
}
const obj = { show };

show(); // 默认绑定 → 严格模式 undefined
obj.show(); // 隐式绑定 → obj
show.call("X"); // 显式绑定 → "X"（包装对象）
new show(); // new 绑定 → 新创建的对象
```

记住一句话：**`this` 看的是「谁在调用」，不是「在哪定义」**。把 `obj.show` 赋值出来再单独调用，`this` 立刻丢失。详见 [`this` 的四条规则](./guide-line/this-rules)。

### ⑤ 箭头函数为何「不一样」

```js
const timer = {
  seconds: 0,
  start() {
    setInterval(() => {
      this.seconds++; // 箭头从 start 借 this → 正确指向 timer
    }, 1000);
  },
};
```

箭头函数**不参与**上面四条规则——它没有自己的 `this`，而是从定义处的外层继承。这正是回调里最想要的行为，所以它取代了老式的 `const self = this`。详见 [箭头函数 vs 普通函数](./guide-line/arrow-vs-regular)。

## 三种函数形态对比

| 特性 | 函数声明 | 函数表达式 | 箭头函数 |
| --- | --- | --- | --- |
| 提升 | 是（整体提升） | 否（受变量声明规则约束） | 否 |
| 自己的 `this` | 有（调用时决定） | 有（调用时决定） | 无（继承外层） |
| `arguments` 对象 | 有 | 有 | 无 |
| 可否命名 | 必须命名 | 可选 | 永远匿名 |
| 能否 `new` | 能 | 能 | 不能 |
| `prototype` 属性 | 有 | 有 | 无 |

## 为什么「调用时决定」如此重要

JavaScript 的 `this` 不像 Java/C++ 那样在编译期绑定到「当前对象」，而是**每次调用现场计算**。这带来灵活性（同一个函数可被多个对象借用），也带来最常见的事故：

```js
const user = {
  name: "Ann",
  greet() {
    return `Hi, ${this.name}`;
  },
};

const btn = { onClick: user.greet };
btn.onClick(); // this 变成 btn，btn.name 不存在 → "Hi, undefined"
```

解决方式有三：`bind` 永久绑定、用箭头函数包一层、或改用 `call`/`apply` 显式传入。详见 [`call` / `apply` / `bind`](./guide-line/call-apply-bind)。

## 下一步

按本叶地图依次深入，或直接跳到你最关心的一页——[函数形态](./guide-line/function-forms)、[箭头 vs 普通](./guide-line/arrow-vs-regular)、[作用域与闭包](./guide-line/scope-closures)、[`this` 规则](./guide-line/this-rules)、[`call`/`apply`/`bind`](./guide-line/call-apply-bind)、[高阶函数](./guide-line/higher-order-functions)。
