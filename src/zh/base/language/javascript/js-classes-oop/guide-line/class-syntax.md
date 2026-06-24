---
layout: doc
outline: [2, 3]
---

# 类语法：构造与成员

> 基于现代 JavaScript（ES2025 · 核于 2026-06）

## 速查

- **声明**：`class C {}` 不提升、有 TDZ；**表达式**：`const C = class {}` 可匿名或具名
- **具名类表达式**的名字只在类体内可见，类外引用该名报 `ReferenceError`
- **`constructor`**：初始化实例、每类至多一个（写两个抛 `SyntaxError`）；可省略（引擎补隐式构造函数）
- **构造函数返回值**：默认返回 `this`；若 `return` 一个**对象**会**顶替**实例，返回原始值则被忽略
- **实例方法**：`m() {}` 挂 `C.prototype`、所有实例共享、默认**不可枚举**
- **方法变体**：`*gen() {}`（生成器）、`async m() {}`、`[expr]() {}`（计算属性名）
- **类字段**（ES2022）：`x = 1` 挂在**每个实例**上；不写 `let`/`const`；构造前初始化
- **共享请用方法、独占才用字段**：把函数写进 `constructor` 会每实例新建一份，浪费内存

## `class` 声明 vs 类表达式

类有两种写法，区别主要在「名字」和「提升」上。

```js
// 声明式
class Rectangle {
  constructor(h, w) {
    this.h = h;
    this.w = w;
  }
}

// 表达式（匿名）
const Rectangle2 = class {
  constructor(h, w) {
    this.h = h;
    this.w = w;
  }
};

// 表达式（具名）—— 名字 Inner 只在类体内部可见
const Rectangle3 = class Inner {
  whoami() {
    return Inner.name;
  }
};
new Rectangle3().whoami(); // "Inner"
// Inner;  // ReferenceError：类外不可见
```

::: warning 类声明不提升（TDZ）
与函数声明不同，`class` 声明存在**暂时性死区**——在声明之前访问会抛错，而非得到 `undefined`：

```js
new Foo(); // ReferenceError: Cannot access 'Foo' before initialization
class Foo {}
```

所以「先用后定义」对类不成立，写代码时类要放在使用之前。
:::

## `constructor`：实例的初始化器

`constructor` 在 `new C()` 时执行，`this` 指向新建的实例：

```js
class Color {
  constructor(r, g, b) {
    this.values = [r, g, b];
  }
}
const red = new Color(255, 0, 0);
```

几条容易踩的规则：

- **至多一个**：一个类里写两个 `constructor` 是 `SyntaxError`。
- **可省略**：不写 `constructor`，引擎会补一个隐式的（子类里隐式构造函数会自动 `super(...args)`）。
- **返回值有讲究**：构造函数默认返回 `this`；如果你显式 `return` 一个**对象**，这个对象会**顶替**掉本该返回的实例；`return` 原始值（数字、字符串等）则被忽略，仍返回 `this`：

```js
class Weird {
  constructor() {
    this.a = 1;
    return { b: 2 }; // 顶替实例
  }
}
console.log(new Weird().a); // undefined
console.log(new Weird().b); // 2
```

- 支持剩余参数：`constructor(...values) { this.values = values; }`。

## 实例方法：挂在原型上，共享一份

类体里的方法都被装到 `C.prototype`，因此所有实例共享同一份函数实现：

```js
class Color {
  constructor(r, g, b) {
    this.values = [r, g, b];
  }
  getRed() {
    return this.values[0];
  }
}

const c = new Color(255, 0, 0);
console.log(c.getRed()); // 255
console.log(Color.prototype.hasOwnProperty("getRed")); // true
console.log(c.hasOwnProperty("getRed")); // false
```

类方法与对象字面量方法的一个差异：类里的方法**默认不可枚举**（`Object.keys` / `for...in` 遍历不到），而对象字面量里的方法是可枚举的。

### 方法的几种变体

方法名位置可以放生成器、异步、计算属性名：

```js
class Stream {
  // 生成器方法
  *[Symbol.iterator]() {
    yield 1;
    yield 2;
  }
  // 异步方法
  async load(url) {
    return (await fetch(url)).json();
  }
  // 计算属性名
  ["get" + "Size"]() {
    return 42;
  }
}

console.log([...new Stream()]); // [1, 2]
console.log(new Stream().getSize()); // 42
```

## 类字段：挂在每个实例上

类字段（ES2022）是直接写在类体里的实例属性声明，**不带 `let`/`const`**：

```js
class Profile {
  name = "匿名"; // 有默认值
  age; // 无默认值 → undefined
  createdAt = Date.now(); // 每个实例求值一次
}

const p = new Profile();
console.log(p.name, p.age); // "匿名" undefined
```

字段等价于在构造函数最前面写 `this.xxx = ...`，但有两点值得记：

- 字段在**每个实例上各存一份**（不像方法挂原型共享）。
- 字段初始化发生在构造函数体之前（子类里是在 `super()` 返回之后）——所以构造函数里能直接读到已初始化的字段。

### 该用字段还是方法？

判断标准是「这份东西是否该被所有实例共享」：

| 想要的东西 | 写法 | 存储位置 |
| --- | --- | --- |
| 所有实例共享的行为 | 实例方法 `m() {}` | 原型，一份 |
| 每个实例独立的数据 | 类字段 `x = ...` | 实例，各一份 |
| 每个实例独立、且要绑死 `this` 的回调 | 箭头函数字段 `m = () => {}` | 实例，各一份 |

反例——把共享逻辑写成字段里的函数，会让每个实例都新建一份函数对象：

```js
class Bad {
  // ❌ 每个实例都新建一份 getRed，浪费内存
  getRed = function () {
    return this.values[0];
  };
}
console.log(new Bad().getRed === new Bad().getRed); // false
```

除非你是**故意**用箭头函数字段换取 `this` 绑定（见 [入门](../getting-started) 第 ③ 节），否则共享行为一律写成原型方法。

## 接下来

单个类的「构造 + 成员」已经成型。下一页进入面向对象的核心机制——类之间的复用：[继承与 super](./inheritance-super)，讲 `extends`、`super()` 构造链、`super.method()` 改写父类，以及继承内置类。
