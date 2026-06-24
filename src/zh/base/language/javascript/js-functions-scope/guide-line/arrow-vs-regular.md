---
layout: doc
outline: [2, 3]
---

# 箭头函数 vs 普通函数

> 基于现代 JavaScript（ES2025 · 核于 2026-06）

## 速查

- **`this`**：箭头函数**没有自己的 `this`**，从定义处的外层词法作用域继承；普通函数的 `this` 在**调用时**决定（见 [`this` 的四条规则](./this-rules)）
- **`arguments`**：箭头函数没有 `arguments`，要拿全部实参用剩余参数 `...args`；普通函数有 `arguments`
- **`new`**：箭头函数**不能**当构造器，`new arrow()` 抛 `TypeError`；它也没有 `prototype` 属性
- **`call`/`apply`/`bind` 改 `this`**：对箭头函数**无效**（`this` 已锁定外层），对普通函数有效
- 箭头函数也没有自己的 `super` 与 `new.target`
- **适合箭头**：回调、数组方法的迭代器、需要继承外层 `this` 的场景（如 `setTimeout`/事件处理里访问实例）
- **不适合箭头**：对象方法（`this` 会指向外层而非对象）、构造函数、需要动态 `this` 或 `arguments` 的函数、原型方法
- 老写法 `const self = this` 已被箭头函数取代——这是箭头函数被发明的核心动机之一

## 核心差异一：`this` 的来源

这是箭头函数与普通函数**最本质**的区别。

普通函数的 `this` 取决于「**怎么被调用**」（详见 [`this` 的四条规则](./this-rules)）；箭头函数则根本**没有自己的 `this`**，它直接用「**定义时所处的外层 `this`**」。

经典对比——定时器里访问实例属性：

```js
// ❌ 普通函数：回调被独立调用，this 丢失
function Timer() {
  this.seconds = 0;
  setInterval(function () {
    this.seconds++; // this 是全局对象 / undefined，不是 Timer 实例
  }, 1000);
}

// ✅ 箭头函数：从外层 Timer 继承 this
function Timer() {
  this.seconds = 0;
  setInterval(() => {
    this.seconds++; // this 正确指向 Timer 实例
  }, 1000);
}
```

在箭头函数出现之前，人们用一个中间变量「存住」外层 `this`：

```js
// 前 ES6 的老写法（now obsolete）
function Timer() {
  const self = this; // 把外层 this 存下来
  this.seconds = 0;
  setInterval(function () {
    self.seconds++;
  }, 1000);
}
```

箭头函数的「继承外层 `this`」正是为了取代这种 `const self = this` 样板。

::: warning 反例：别拿箭头函数当对象方法
正因为箭头函数从「定义处的外层」取 `this`，把它用作对象方法会出错——此时外层往往是模块顶层或全局，而不是对象本身：

```js
const counter = {
  count: 0,
  // ❌ 箭头函数：this 不是 counter，而是外层（模块 / 全局）
  inc: () => {
    this.count++; // this.count 是 undefined → NaN
  },
  // ✅ 普通方法（含简写）：this 隐式绑定到 counter
  dec() {
    this.count--;
  },
};
```

对象方法请用普通函数 / 方法简写，让隐式绑定生效。
:::

## 核心差异二：没有 `arguments`

箭头函数内部访问 `arguments`，拿到的是**外层函数**的 `arguments`（若外层也没有则报错），而非自己的实参：

```js
function outer() {
  // 箭头函数里的 arguments 是 outer 的 arguments
  const inner = () => arguments[0];
  return inner();
}
outer("A", "B"); // "A"
```

要在箭头函数里收集自己的全部实参，使用剩余参数：

```js
const sum = (...nums) => nums.reduce((a, b) => a + b, 0);
sum(1, 2, 3); // 6
```

## 核心差异三：不能 `new`、没有 `prototype`

普通函数可以当构造器（配合 `new` 创建实例），箭头函数不行：

```js
const Person = (name) => {
  this.name = name;
};
// new Person("Ann"); // TypeError: Person is not a constructor
```

原因是箭头函数没有 `[[Construct]]` 内部方法，也**没有 `prototype` 属性**：

```js
const arrow = () => {};
function regular() {}
console.log(arrow.prototype); // undefined
console.log(typeof regular.prototype); // "object"
```

因此构造函数、需要挂在 `prototype` 上共享的方法，都必须用普通函数。

## 核心差异四：`call`/`apply`/`bind` 改不动 `this`

对普通函数，`call`/`apply`/`bind` 能显式指定 `this`（见 [`call` / `apply` / `bind`](./call-apply-bind)）；对箭头函数，这些方法**改不了 `this`**——因为它的 `this` 已在定义时锁死：

```js
const arrow = () => this;
const obj = { name: "X" };
arrow.call(obj); // 仍是外层 this，obj 被忽略

function regular() {
  return this;
}
regular.call(obj); // obj —— 普通函数能被改写
```

（不过传参数仍然有效，只是 `thisArg` 那一项对箭头函数无意义。）

## 何时用哪个

| 场景 | 选择 | 原因 |
| --- | --- | --- |
| 数组方法回调（`map`/`filter`…） | 箭头 | 简洁，且通常不需要自己的 `this` |
| `setTimeout` / 事件回调里访问实例 | 箭头 | 自动继承外层 `this`，省去 `bind` |
| 对象方法 | 普通 / 方法简写 | 需要 `this` 指向对象本身 |
| 构造函数 | 普通 | 箭头不能 `new` |
| 原型方法 | 普通 | 需要动态 `this` 且要挂 `prototype` |
| 需要 `arguments` 的函数 | 普通 | 箭头没有 `arguments` |

## 小结对照表

| 特性 | 箭头函数 | 普通函数 |
| --- | --- | --- |
| 自己的 `this` | ❌ 继承外层 | ✅ 调用时决定 |
| `arguments` | ❌ | ✅ |
| 能否 `new` | ❌ | ✅ |
| `prototype` 属性 | ❌ | ✅ |
| `call`/`apply`/`bind` 改 `this` | ❌ 无效 | ✅ 有效 |
| `super` / `new.target` | ❌ | ✅ |
| 语法 | 最简洁，可隐式返回 | 完整 |

## 下一步

箭头函数从「定义处的外层」继承 `this`，这背后正是**词法作用域**在起作用。下一页深入 [作用域链与闭包](./scope-closures)，讲清变量是如何被「闭住」并跨越函数生命周期被记住的。
