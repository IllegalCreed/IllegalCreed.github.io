---
layout: doc
outline: [2, 3]
---

# 入门

> 基于现代 JavaScript（ES2025 · 核于 2026-06）

## 速查

- **本质**：`class` 是原型机制的语法糖——`typeof MyClass === "function"`，方法被放进 `MyClass.prototype`
- **类体永远严格模式**：无需写 `"use strict"`，类体内自动启用
- **必须 `new`**：直接调用 `MyClass()` 抛 `TypeError: Class constructor cannot be invoked without 'new'`
- **不提升**：`class` 声明存在暂时性死区（TDZ），定义前访问报错（与 `let`/`const` 一致，不同于函数声明）
- **方法 vs 字段**：方法挂在**原型上、所有实例共享一份**；字段（`x = 1`）挂在**每个实例上、各存一份**
- **`constructor`**：每类最多一个；子类里必须先 `super()` 再用 `this`
- **私有用 `#`**：`#field` 是硬私有，类外访问是**语法错误**，`_field` 只是约定不是私有
- **`this` 不自动绑定**：方法被当回调取出单独调用时 `this` 为 `undefined`（严格模式）
- **核心成员**：实例方法 / 类字段 / `get`·`set` / `static` / 私有 `#` / `extends`·`super`

## 一段最小的类，拆出三条主线

下面这段类几乎用到了本叶要讲的全部基础概念，后续各页就是逐块展开它：

```js
class Counter {
  // ① 公有实例字段：每个实例各存一份
  label = "计数器";

  // ② 私有字段：类外不可见，必须先声明
  #count = 0;

  // ③ 构造函数：用 new 创建实例时调用
  constructor(label) {
    if (label) this.label = label;
  }

  // ④ 实例方法：挂在 Counter.prototype 上，所有实例共享
  increment() {
    this.#count++;
    return this.#count;
  }

  // ⑤ 访问器（getter）：像属性一样读取
  get value() {
    return this.#count;
  }

  // ⑥ 静态方法：挂在类自身，不在实例上
  static create(label) {
    return new Counter(label);
  }
}

const c = new Counter("访客数");
c.increment(); // 1
console.log(c.value); // 1
console.log(c.label); // "访客数"
```

## ① `class` 到底做了什么

最该先建立的认知：**类是一种函数**。声明一个类，等价于「创建一个以 `constructor` 为函数体的函数，并把所有方法塞进它的 `prototype`」：

```js
class User {
  constructor(name) {
    this.name = name;
  }
  sayHi() {
    console.log(this.name);
  }
}

console.log(typeof User); // "function"
console.log(User === User.prototype.constructor); // true
console.log(User.prototype.sayHi); // [Function: sayHi]
```

所以 `class` 并没有引入新的对象模型，它是**原型继承之上的语法糖**。但它也不只是「换个写法」——类比普通构造函数多了几条硬性约束：必须 `new` 调用、类体强制严格模式、方法默认不可枚举（`for...in` 遍历不到）、声明不提升。详见 [类语法：构造与成员](./guide-line/class-syntax)。

## ② 方法在原型，字段在实例

这是理解类内存模型与 `this` 的关键分水岭：

```js
class Point {
  x = 0; // 字段：每个实例一份
  dist() {
    return Math.hypot(this.x);
  } // 方法：原型上共享一份
}

const a = new Point();
const b = new Point();

console.log(a.dist === b.dist); // true —— 同一个原型方法
console.log(a.hasOwnProperty("dist")); // false —— 方法不在实例上
console.log(Point.prototype.hasOwnProperty("dist")); // true
console.log(a.hasOwnProperty("x")); // true —— 字段在实例上
```

把本该共享的函数写进 `constructor`（`this.dist = function(){}`）会让每个实例都新建一份函数，浪费内存。除非你是**故意**要用箭头函数字段来绑定 `this`（见下一条）。详见 [类语法：构造与成员](./guide-line/class-syntax)。

## ③ `this` 取决于「怎么调用」，不是「在哪定义」

类方法**不会自动绑定**到实例。一旦把方法当回调单独取出来调用，`this` 就丢了：

```js
class Button {
  text = "提交";
  click() {
    console.log(this.text);
  }
}

const btn = new Button();
btn.click(); // "提交"

const handler = btn.click;
handler(); // TypeError：严格模式下 this 是 undefined
```

两种常见修法——用 `.bind(btn)`，或把方法写成**箭头函数字段**（字段在实例上初始化，箭头函数捕获定义时的 `this`）：

```js
class Button {
  text = "提交";
  // 箭头函数字段：this 永远指向实例，可安全当回调
  click = () => {
    console.log(this.text);
  };
}
const btn = new Button();
const handler = btn.click;
handler(); // "提交" ✅
```

代价是这个 `click` 变成了**每实例一份**的字段（不在原型上、子类也不易 `super` 改写），是一种用内存换绑定确定性的权衡。

## 接下来

地基已经搭好——「类是函数、方法在原型、字段在实例、`this` 看调用点」。下一页正式拆解类体里第一类成员：[类语法：构造与成员](./guide-line/class-syntax)，把 `class` 声明/表达式、`constructor`、原型方法与类字段讲透。
