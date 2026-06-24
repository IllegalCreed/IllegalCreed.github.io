---
layout: doc
outline: [2, 3]
---

# `this` 的四条规则

> 基于现代 JavaScript（ES2025 · 核于 2026-06）

## 速查

- `this` 在**调用时**确定，不在定义时——同一个函数，不同调用方式 `this` 不同
- **默认绑定**：独立调用 `f()` → 严格模式 `this` 是 `undefined`，非严格模式是全局对象（浏览器里 `window`）
- **隐式绑定**：作为方法 `obj.f()` → `this` 是点号前的对象 `obj`；只看**调用现场**最后一个点
- **显式绑定**：`f.call(o)` / `f.apply(o)` / `f.bind(o)` → `this` 是手动指定的 `o`（详见 [`call`/`apply`/`bind`](./call-apply-bind)）
- **`new` 绑定**：`new F()` → `this` 是新创建的对象（并自动返回它）
- **优先级**：`new` > 显式（`bind`）> 隐式（`obj.f()`）> 默认
- **箭头函数例外**：不参与以上四条，`this` 从定义处外层继承、且无法被改写（见 [箭头函数 vs 普通函数](./arrow-vs-regular)）
- **最常见事故——`this` 丢失**：把 `obj.method` 取出单独调用、当回调传给 `setTimeout`/`forEach` 时，隐式绑定失效，退回默认绑定
- 三种修复：`bind` 永久绑定 / 用箭头函数包一层 / 传 `thisArg`（如 `forEach(cb, thisArg)`）

## 核心心法：调用时决定

JavaScript 的 `this` 不绑定到「定义它的对象」，而是在**每次调用现场**计算。判断 `this` 指向，要看「这个函数是**怎么被调用**的」：

```js
function whoAmI() {
  return this;
}
const obj = { name: "X", whoAmI };

whoAmI(); // 默认绑定
obj.whoAmI(); // 隐式绑定 → obj
whoAmI.call("A"); // 显式绑定 → "A"
new whoAmI(); // new 绑定 → 新对象
```

同一个 `whoAmI`，四种调用方式给出四种 `this`。下面逐条拆解。

## 规则一：默认绑定

函数被「光秃秃」地独立调用（前面没有对象、没有 `call`/`new`），走默认绑定：

- **严格模式**（`"use strict"` 或 ES 模块里）：`this` 是 `undefined`；
- **非严格模式**：`this` 退回**全局对象**（浏览器里是 `window`，Node 里是 `global`）。

```js
"use strict";
function show() {
  return this;
}
show(); // undefined（严格模式）

// 非严格模式下：
// function show() { return this; }
// show(); // window
```

::: tip 严格模式是更安全的默认
非严格模式让 `this` 悄悄变成全局对象，容易在不知情时往全局挂属性、引发难查的 bug。ES 模块和 `class` 内部默认就是严格模式，这也是现代代码推荐的状态。
:::

## 规则二：隐式绑定

函数作为某个对象的方法、用 `对象.方法()` 形式调用时，`this` 指向**点号前的那个对象**：

```js
const user = {
  name: "John",
  sayHi() {
    return this.name; // this 是 user
  },
};
user.sayHi(); // "John"
```

关键是看**调用现场**，而非定义位置。只有「最后一个点」前的对象算数：

```js
const a = { name: "A", who() { return this.name; } };
const b = { name: "B", who: a.who };
b.who(); // "B" —— 调用现场是 b.who()，this 是 b
```

链式调用同理，只认最贴近的那一层：

```js
const obj = {
  name: "outer",
  inner: { name: "inner", who() { return this.name; } },
};
obj.inner.who(); // "inner"
```

## 规则三：显式绑定

用 `call` / `apply` / `bind` **手动指定** `this`，可以把任意对象塞给函数（详见 [`call` / `apply` / `bind`](./call-apply-bind)）：

```js
function greet() {
  return `Hi, ${this.name}`;
}
greet.call({ name: "Ann" }); // "Hi, Ann"
greet.apply({ name: "Bob" }); // "Hi, Bob"
const greetCarol = greet.bind({ name: "Carol" });
greetCarol(); // "Hi, Carol" —— bind 返回永久绑定的新函数
```

显式绑定优先级高于隐式绑定：即使写成 `obj.method()`，只要它本身是 `bind` 出来的，`this` 仍是 `bind` 时指定的对象。

## 规则四：`new` 绑定

用 `new` 调用函数（构造器）时，引擎会：①新建一个空对象；②把它作为 `this`；③执行函数体；④若函数没显式返回对象，则**自动返回这个新对象**：

```js
function Person(name) {
  this.name = name; // this 是新建的对象
}
const p = new Person("Ann");
p.name; // "Ann"
```

`new` 绑定的优先级最高，超过显式绑定（`bind` 出来的函数被 `new` 调用时，`new` 仍胜出）。

## 优先级总表

从高到低：

| 优先级 | 规则 | 形式 | `this` 指向 |
| --- | --- | --- | --- |
| 1（最高） | `new` 绑定 | `new F()` | 新创建的对象 |
| 2 | 显式绑定 | `f.call(o)` / `f.bind(o)` | 手动指定的 `o` |
| 3 | 隐式绑定 | `obj.f()` | 点号前的 `obj` |
| 4（最低） | 默认绑定 | `f()` | 严格 `undefined` / 非严格全局对象 |

> 箭头函数不在此表内——它根本没有自己的 `this`，永远继承定义处外层，且 `call`/`bind`/`new` 都改不动。

## 最常见的坑：`this` 丢失

当你把一个方法**从对象里取出来单独调用**，或**当回调传出去**时，调用现场已经没有「点号前的对象」了，隐式绑定失效，退回默认绑定（严格模式下 `this` 为 `undefined`，访问属性直接报错）：

```js
const user = {
  name: "Ann",
  greet() {
    return `Hi, ${this.name}`;
  },
};

const fn = user.greet;
fn(); // this 丢失 → 严格模式报错 / 非严格 "Hi, undefined"

setTimeout(user.greet, 100); // 同样：回调被独立调用，this 不是 user

[1].forEach(function () {
  // 普通函数回调里 this 也不是 user
});
```

### 三种修复

```js
// 方法 1：bind 永久绑定（见 call-apply-bind 页）
const bound = user.greet.bind(user);
setTimeout(bound, 100); // this 锁定为 user

// 方法 2：用箭头函数包一层，保留调用现场的 this
setTimeout(() => user.greet(), 100); // 实际调用仍是 user.greet()

// 方法 3：传 thisArg（部分 API 支持）
[1].forEach(function () {
  /* 这里 this 是 user */
}, user); // forEach 第二参数指定 this
```

::: warning 类方法当回调要尤其小心
把 `class` 实例的方法直接传给事件监听 / 定时器，是 React 等场景里 `this is undefined` 的常见根因。常用对策：构造函数里 `this.handler = this.handler.bind(this)`，或用类字段写成箭头函数 `handler = () => {…}`。
:::

## 下一步

显式绑定是改写 `this` 最直接的手段。下一页深入 [`call` / `apply` / `bind`](./call-apply-bind)——三者的区别、函数借用，以及如何用 `bind` 做偏函数。
