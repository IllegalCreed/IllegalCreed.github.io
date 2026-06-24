---
layout: doc
outline: [2, 3]
---

# 私有字段 #

> 基于现代 JavaScript（ES2025 · 核于 2026-06）

## 速查

- **`#field`**（ES2022）：硬私有实例字段，**必须先在类体声明**，类外访问 `obj.#x` 是**语法错误**
- **硬私有**：JavaScript 不提供任何「绕过」机制（不同于 `_name` 这种纯约定）
- **同类实例互通**：方法里可读写**另一个同类实例**的私有字段 `other.#x`
- **不可动态创建、不可删除、不可重名**：均为早期语法错误；不能 `delete this.#x`
- **`#method()`**：私有方法，类外不可调用；同理有私有 `get #x()` / `set #x()` 访问器
- **`static #x` / `static #m()`**：私有静态成员（见 [静态成员](./static-members)）
- **品牌检查**：`#x in obj`（ES2022）安全判断「`obj` 是不是本类实例」，不抛错、返回布尔
- **不继承**：子类访问不到父类的 `#field`
- **误区**：`#` 不是「下划线约定」的新写法——`_x` 仍是公开属性，只有 `#x` 才真正私有

## `#field`：真正的私有

在 ES2022 之前，JavaScript 没有语言级私有，社区只能靠 `_name` 这种命名约定「假装私有」——但谁都能 `obj._name` 直接读写。`#` 前缀的私有字段补上了这块：

```js
class BankAccount {
  #balance = 0; // 私有字段，必须先声明

  deposit(amount) {
    this.#balance += amount;
    return this.#balance;
  }

  get balance() {
    return this.#balance; // 只读对外暴露
  }
}

const acc = new BankAccount();
acc.deposit(100);
console.log(acc.balance); // 100
// console.log(acc.#balance);  // SyntaxError：Private field '#balance' must be declared in an enclosing class
```

它是**硬私有**：和某些语言「私有只是约定、反射仍能访问」不同，JavaScript **不提供任何**从类外读取 `#` 字段的途径。

::: warning `#x` 必须先声明，且不能用下划线代替
两个常被混淆的点：

1. **必须声明**：用到的每个 `#x` 都要在类体里出现声明，不能像普通属性那样在构造函数里凭空 `this.#x = 1` 创建一个未声明的私有字段。
2. **`_x` ≠ 私有**：`this._balance` 只是个普通公开属性，命名上提示「别碰」，但语言层面毫无保护。真要私有，必须用 `#`。
   :::

## 同类实例之间可以互访

私有性是「按类」而非「按实例」隔离的——在类的方法内部，可以访问**另一个同类实例**的私有字段。这让「比较两个对象」这类操作能拿到对方的内部状态：

```js
class Money {
  #cents;
  constructor(cents) {
    this.#cents = cents;
  }

  // 访问参数对象的私有字段（同类）
  add(other) {
    return new Money(this.#cents + other.#cents);
  }
}

const a = new Money(150);
const b = new Money(250);
console.log(a.add(b)); // Money { #cents: 400 }
```

## 私有方法与私有访问器

不只是字段，方法和访问器也能私有——`#` 前缀的方法只能在类体内调用，适合「不想暴露给外部的内部步骤」：

```js
class Counter {
  #count = 0;

  // 私有访问器
  get #value() {
    return this.#count;
  }
  set #value(v) {
    this.#count = v;
  }

  // 私有方法
  #render() {
    return `当前：${this.#value}`;
  }

  // 公有方法编排私有逻辑
  tick() {
    this.#value++;
    return this.#render();
  }
}

const c = new Counter();
console.log(c.tick()); // "当前：1"
// c.#render();  // SyntaxError：类外不可调用私有方法
```

## `#x in obj`：安全的品牌检查

直接对「不确定是不是本类实例」的对象访问 `obj.#x` 会**抛错**（而非返回 `undefined`）。ES2022 引入了 `#x in obj` 这个**品牌检查（brand check）**语法，用来安全判断某对象是否「带有本类的私有字段」，返回布尔、不抛错：

```js
class Color {
  #values;
  constructor(r, g, b) {
    this.#values = [r, g, b];
  }

  redDifference(other) {
    // 先确认 other 确实是 Color 实例，再访问其私有字段
    if (!(#values in other)) {
      throw new TypeError("需要一个 Color 实例");
    }
    return this.#values[0] - other.#values[0];
  }
}

const a = new Color(255, 0, 0);
const b = new Color(100, 0, 0);
console.log(a.redDifference(b)); // 155
console.log(#values in a); // true（只能写在类体内）
console.log(#values in {}); // false —— 普通对象没有这个品牌
```

品牌检查的价值：它比 `instanceof` 更可靠——`instanceof` 可被 `Symbol.hasInstance` 或原型篡改欺骗（见 [访问器与 instanceof](./getters-instanceof)），而「是否拥有某私有字段」无法伪造，是判断「真的由本类构造出来」的硬证据。

## 几条硬性限制

- **不可重名**：同一个类里 `#x` 只能声明一次，重复声明是语法错误。
- **不可删除**：`delete this.#x` 是语法错误（普通属性可 `delete`，私有字段不行）。
- **不可动态访问**：没有 `obj[#x]` 这种动态形式，私有名不是字符串属性键。
- **不继承**：子类拿不到父类的 `#field`——私有性不沿继承链开放（见 [继承与 super](./inheritance-super)）。

## 接下来

封装的另一面是「受控地暴露」——用访问器把内部状态包装成像属性一样读写的接口，并搞清类型判定。下一页：[访问器与 instanceof](./getters-instanceof)，讲 `get`/`set`、`instanceof`、`Symbol.hasInstance` 定制与 `new.target`。
