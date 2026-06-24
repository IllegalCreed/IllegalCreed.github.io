---
layout: doc
outline: [2, 3]
---

# 基于原型的继承

> 基于现代 JavaScript（ES2025 · 核于 2026-06）

## 速查

- 构造函数：约定首字母大写，`new Fn()` 时新对象的 `[[Prototype]]` 接到 `Fn.prototype`，方法挂在 `prototype` 上全实例共享
- `Fn.prototype` 自带一个 `constructor` 属性，指回 `Fn`；改原型时小心别丢了它
- 改 `Fn.prototype.method` 会影响**所有**实例（含已创建的）——原型是动态共享的
- 经典继承难点：要既继承父类方法（在原型上）、又正确初始化父类实例属性（在实例上），还不能调用两遍父构造
- **寄生组合继承**是社区最终范式：`Object.setPrototypeOf(Child.prototype, Parent.prototype)` 接方法链 + 在子构造里 `Parent.call(this, ...)` 初始化属性
- 链接子原型用 `Object.setPrototypeOf(Child.prototype, Parent.prototype)`，**别**用 `Child.prototype = Object.create(Parent.prototype)`（会断已建实例的链、丢 `constructor`）
- `class` / `extends` 是上述模式的语法糖：`extends` 接原型链，`super()` 等价 `Parent.call(this)`，`super.m()` 沿父原型调方法
- `class` 额外给了纯原型给不了的能力：私有字段 `#x`、`super` 关键字、更清晰的语法
- **绝不要给内置原型加属性**（`Array.prototype.xxx = ...`）——会与未来标准冲突、污染全局；polyfill 缺失标准方法是唯一例外
- 单继承：一个对象只有一个原型，JavaScript 没有多继承（可用 mixin 模拟「混入」）

## 构造函数 + prototype：共享方法的基石

`class` 出现前，搭建「一类对象」靠**构造函数**——一个约定首字母大写、配合 `new` 使用的普通函数。`new` 做三件事：建新对象、把它的 `[[Prototype]]` 接到 `构造函数.prototype`、让 `this` 指向新对象并执行函数体。

实例**各自的状态**写在构造函数体里（`this.xxx`），**共享的方法**挂在 `prototype` 上：

```js
function Box(value) {
  this.value = value; // 每个实例各有一份
}
Box.prototype.getValue = function () {
  return this.value; // 所有实例共享同一个函数
};

const a = new Box(1);
const b = new Box(2);
console.log(a.getValue(), b.getValue()); // 1 2
console.log(a.getValue === b.getValue); // true —— 真的是同一个函数
```

把方法放原型而非构造函数体，是为了**不给每个实例都复制一份方法**——一千个实例共用一个 `getValue`，省内存。

### `constructor` 属性

每个函数的 `prototype` 对象上，都自带一个 `constructor` 属性指回函数本身：

```js
console.log(Box.prototype.constructor === Box); // true
console.log(a.constructor === Box); // true（从原型继承到的）
```

### 原型是动态共享的

改动 `构造函数.prototype` 会立刻反映到**所有**实例上，包括已经创建的——因为它们共享同一个原型对象：

```js
function Box(value) {
  this.value = value;
}
Box.prototype.getValue = function () {
  return this.value;
};
const box = new Box(1);

// 创建之后再改原型上的方法
Box.prototype.getValue = function () {
  return this.value + 1;
};
console.log(box.getValue()); // 2 —— 已存在的实例也跟着变了
```

## 继承的难点：方法在原型，属性在实例

要让 `Child` 继承 `Parent`，得同时满足两件看似矛盾的事：

1. `Child` 的实例要能调用 `Parent.prototype` 上的方法 → 需要把 `Child.prototype` 的原型接到 `Parent.prototype`；
2. `Child` 的实例要带上 `Parent` 在构造函数里初始化的**实例属性**（如 `this.name`）→ 需要在 `Child` 构造里执行 `Parent` 的初始化逻辑。

历史上社区试过几种方案，各有缺陷，最终收敛到「寄生组合继承」。

### 错误示范一：只接原型，不初始化属性

```js
function Parent(name) {
  this.name = name;
}
Parent.prototype.hello = function () {
  return `Hi, ${this.name}`;
};

function Child() {}
Object.setPrototypeOf(Child.prototype, Parent.prototype); // 只接了方法链

const c = new Child();
console.log(c.hello()); // "Hi, undefined" —— name 没被初始化！
```

方法继承到了，但 `Parent` 的构造逻辑（`this.name = name`）从没跑过，实例属性缺失。

### 错误示范二：把父实例当原型（旧式「原型链继承」）

早期有人用 `Child.prototype = new Parent()`，问题是：父构造被提前调用一次（可能有副作用 / 需要参数），且父的实例属性变成了**所有子实例共享的原型属性**（引用类型会互相串改）。这是已被淘汰的写法。

## 寄生组合继承：最终范式

正确做法是**分工**——用 `Object.setPrototypeOf` 接「方法链」，用 `Parent.call(this, ...)` 在子构造里跑「属性初始化」：

```js
function Parent(name) {
  this.name = name; // 实例属性
}
Parent.prototype.hello = function () {
  return `Hi, ${this.name}`;
};

function Child(name, age) {
  Parent.call(this, name); // ① 借 Parent 初始化实例属性（this 指向子实例）
  this.age = age; // 子自己的属性
}
// ② 把 Child.prototype 的原型接到 Parent.prototype（继承方法）
Object.setPrototypeOf(Child.prototype, Parent.prototype);

Child.prototype.intro = function () {
  return `${this.hello()}, age ${this.age}`;
};

const c = new Child("Ada", 27);
console.log(c.hello()); // "Hi, Ada" —— 方法继承到、属性也初始化了
console.log(c.intro()); // "Hi, Ada, age 27"
// c ──▶ Child.prototype ──▶ Parent.prototype ──▶ Object.prototype ──▶ null
```

之所以叫「寄生组合」：**组合**指「`call` 初始化属性 + 原型链继承方法」两者结合；**寄生**指中间那层原型用「无副作用地链接」（现代直接用 `Object.setPrototypeOf`，历史上用 `Object.create(Parent.prototype)`）避免调用父构造。

::: warning 用 setPrototypeOf 接原型，别用赋值
链接子原型推荐 `Object.setPrototypeOf(Child.prototype, Parent.prototype)`，**不要**写 `Child.prototype = Object.create(Parent.prototype)`：

```js
// 不推荐：整体替换 prototype
Child.prototype = Object.create(Parent.prototype);
```
整体替换会：①断掉「替换前已创建的实例」的原型链；②丢失原 `prototype` 上的 `constructor` 引用（需手动补回）。`setPrototypeOf` 只调整链接、保留原对象，更安全。
:::

## `class`：把上面这套包成语法糖

ES2015 的 `class` 不是新模型，而是**把构造函数 + 原型链继承这一整套包装得更顺手**。下面两段代码等价：

```js
// class 写法
class Rectangle {
  constructor(h, w) {
    this.height = h;
    this.width = w;
  }
  getArea() {
    return this.height * this.width;
  }
}

// 等价的原型写法
function Rectangle(h, w) {
  this.height = h;
  this.width = w;
}
Rectangle.prototype.getArea = function () {
  return this.height * this.width;
};
```

继承时，`extends` 接原型链，`super(...)` 等价于「调用父构造初始化属性」，`super.method()` 沿父原型调方法：

```js
class Animal {
  constructor(name) {
    this.name = name;
  }
  speak() {
    return `${this.name} makes a sound`;
  }
}
class Dog extends Animal {
  // extends ≈ 接原型链
  speak() {
    // super.speak() ≈ 沿父原型调方法
    return `${super.speak()}, woof!`;
  }
}
const d = new Dog("Rex");
console.log(d.speak()); // "Rex makes a sound, woof!"
// d ──▶ Dog.prototype ──▶ Animal.prototype ──▶ Object.prototype ──▶ null
```

`class` 相比手写原型，多了纯原型**给不了**的能力——私有字段 `#x`、`super` 关键字、更不易写错的语法；代价是比传统构造函数略微难优化、且老环境支持差。但在现代项目里，需要「类式继承」时**应优先用 `class`**，只在理解底层时才回看原型写法。

## 绝不要污染内置原型

可以给内置原型加方法（`Array.prototype.last = ...`），但**几乎永远不该这么做**：

```js
// ❌ 不要这样：给内置原型加属性
Array.prototype.myMethod = function () {
  /* ... */
};
```

风险：①与**未来标准方法**重名冲突（你的 `myMethod` 某天可能成为标准，行为不一致导致诡异 bug）；②污染全局，所有数组都被影响，`for...in` 还会枚举到它；③让代码脆弱、难维护。

**唯一可接受的例外**是 polyfill——为老引擎补上「标准已定义但当前环境缺失」的方法：

```js
// ✅ 可接受：补齐缺失的标准方法
if (!Array.prototype.at) {
  Array.prototype.at = function (n) {
    /* 按标准实现 */
  };
}
```

## 单继承与 mixin

一个对象**只有一个**原型，所以 JavaScript 是单继承——没有多继承。需要「从多个来源借能力」时，用 **mixin**（把多个对象的属性拷贝进目标，常借 `Object.assign`）模拟「混入」，而非真正的多原型：

```js
const serializable = {
  serialize() {
    return JSON.stringify(this);
  },
};
class User {}
Object.assign(User.prototype, serializable); // 把 serialize 混入 User 的原型
console.log(new User().serialize !== undefined); // true
```

## 小结

继承的本质是「方法挂原型共享、属性在实例各持」。构造函数 + `prototype` 是基石，`constructor` 指回函数，改原型影响所有实例。寄生组合继承用 `Parent.call(this)` 初始化属性 + `setPrototypeOf` 接方法链，是 `class` 之前的正确范式；`class` / `extends` / `super` 只是它的语法糖，并额外提供私有字段等能力。切记别污染内置原型，且 JavaScript 只有单继承（mixin 模拟混入）。下一页收尾——把日常处理对象的 `Object` 静态方法工具箱过一遍：[Object 静态方法](./object-static-methods)。
