---
layout: doc
outline: [2, 3]
---

# 入门

> 基于现代 JavaScript（ES2025 · 核于 2026-06）

## 速查

- 创建对象：字面量 `const o = { a: 1 }`（最常用）、`new 构造函数()`、`Object.create(原型)`
- 读写属性：点号 `o.a`（标识符合法时）；方括号 `o["a"]` / `o[key]`（带空格 / 数字开头 / 动态键）
- 不存在的属性返回 `undefined`（不是 `null`）；检测用 `"a" in o`（含原型链）或 `Object.hasOwn(o, "a")`（仅自有）
- 删除属性：`delete o.a` —— 只删自有属性，删不掉继承来的
- 计算属性名：`const o = { [key]: 1 }`；简写：`{ x, y }` 等价 `{ x: x, y: y }`；方法 `{ greet() {} }`
- 属性带三标志：`writable`（可改）/ `enumerable`（可枚举）/ `configurable`（可删可改标志），字面量建的默认全 `true`
- 引用语义：对象是引用类型，`===` 比的是「是不是同一个对象」，不是内容；赋值 / 传参传的是引用
- 浅拷贝：`{ ...o }` / `Object.assign({}, o)`（只拷一层）；深拷贝：`structuredClone(o)`（原生，含循环引用）
- 原型链：每个对象有隐藏的 `[[Prototype]]`，读属性时自身没有就顺着它往上找，直到 `null`
- `__proto__` 是 `[[Prototype]]` 的访问器（历史遗留）；函数上的 `prototype` 是给 `new` 出来的实例当原型用，两者别混
- `class` 是原型机制的语法糖；`[].push` 来自 `Array.prototype`，全局共享
- 遍历选型：`Object.keys/values/entries`（自有可枚举）；`for...in`（含继承，需 `Object.hasOwn` 过滤）

## 一张「对象全景」

下面这段代码把本叶六个深页的核心串在一起——后续每页都是在拆解它的某一块：

```js
// ① 对象基础：字面量、属性、方法、计算属性名
const KEY = "level";
const user = {
  name: "Ada", // 普通属性
  [KEY]: 9, // 计算属性名 → 键为 "level"
  greet() {
    // 方法简写
    return `Hi, I'm ${this.name}`;
  },
};
user.age = 27; // 随时新增属性
delete user.age; // 删除自有属性
console.log("name" in user); // true（in 含原型链）

// ② 属性描述符：给属性加「开关」
Object.defineProperty(user, "id", {
  value: 1001,
  writable: false, // 不可改
  enumerable: false, // 不出现在 for...in / Object.keys
});

// ③ 引用与拷贝：引用语义 + 浅拷贝 / 深拷贝
const alias = user; // 同一个对象（引用）
const shallow = { ...user }; // 浅拷贝（只复制一层）
const deep = structuredClone(user); // 深拷贝（递归，原生）

// ④ 原型链：自身没有的属性顺着 [[Prototype]] 往上找
const animal = { eats: true };
const rabbit = Object.create(animal); // rabbit 的原型是 animal
console.log(rabbit.eats); // true（继承自 animal）
console.log(Object.hasOwn(rabbit, "eats")); // false（不是自有）

// ⑤ 基于原型的继承：class 落到原型上
class Base {
  hello() {
    return "hi";
  }
}
class Derived extends Base {}
console.log(new Derived().hello()); // "hi"（沿原型链找到 Base.prototype.hello）

// ⑥ Object 静态方法：日常工具箱
console.log(Object.keys(user)); // ["name", "level"]（id 不可枚举，被排除）
const merged = Object.assign({}, user, { vip: true });
const fromPairs = Object.fromEntries([["a", 1]]); // { a: 1 }
```

::: tip JavaScript 没有「类」，只有对象
其他语言里「类是蓝图、对象是产品」；JavaScript 里**只有对象**——一个对象通过 `[[Prototype]]` 指向另一个对象来「借用」它的属性和方法。`class` 关键字（ES2015）只是把这套原型操作包装得更顺手，底层依然是原型链。理解了这一点，后面所有看似奇怪的行为都顺理成章。
:::

## 逐块拆解

### ① 对象基础

对象字面量 `{}` 是创建对象最朴素也最常用的方式。属性键本质都是**字符串或 Symbol**（其余类型会被转成字符串）；访问用点号或方括号，动态键只能用方括号。`in` 检测属性是否存在（含原型链），`delete` 删除自有属性。详见 [对象基础](./guide-line/object-basics)。

### ② 属性描述符

你平时写的 `o.a = 1`，其实创建了一个三个开关都为 `true` 的属性。`writable`（能否改值）、`enumerable`（能否被枚举）、`configurable`（能否删除 / 改标志）才是属性的完整画像。getter/setter 让「读写属性」背后跑函数；`Object.freeze` / `Object.seal` 批量收紧这些开关。详见 [属性描述符](./guide-line/property-descriptors)。

### ③ 引用与拷贝

对象是**引用类型**：变量存的是「指向对象的引用」，赋值和传参复制的都是这个引用，而非对象本身。这导致 `===` 只在「同一个对象」时为真，也导致「改了一处，处处都变」。要真正复制，得区分**浅拷贝**（`{...o}`，只一层）和**深拷贝**（`structuredClone`，递归且能处理循环引用）。详见 [引用与拷贝](./guide-line/reference-copy)。

### ④ 原型链

每个对象都有一个隐藏的 `[[Prototype]]` 槽，指向另一个对象或 `null`。读取属性时若自身没有，引擎就沿 `[[Prototype]]` 一路上溯查找，直到命中或到达 `null`（返回 `undefined`）。这就是「原型链」。`Object.create` 显式指定原型；`__proto__` 与函数的 `prototype` 是两个极易混淆的概念。详见 [原型链](./guide-line/prototype-chain)。

### ⑤ 基于原型的继承

把方法挂在构造函数的 `prototype` 上，所有 `new` 出来的实例就能共享——这是 `class` 出现前的继承基石。「寄生组合继承」是社区花了多年才打磨出的正确范式，而 `extends` 一行就替代了它。详见 [基于原型的继承](./guide-line/prototypal-inheritance)。

### ⑥ Object 静态方法

`Object.keys` / `values` / `entries` 把对象「拆」成数组以便遍历；`Object.assign` / 展开运算符做浅合并；`Object.fromEntries` 把键值对数组「装」回对象；`Object.hasOwn` 是检测自有属性的现代写法。它们共同构成处理对象的日常工具箱，选错会枚举到继承属性或漏掉不可枚举属性。详见 [Object 静态方法](./guide-line/object-static-methods)。

## 三个最容易踩的坑

1. **把引用当成了拷贝**：`const b = a` 之后改 `b` 也会改 `a`——它们是同一个对象。需要副本就显式浅拷贝或深拷贝。
2. **`for...in` 枚举出继承属性**：它会遍历整条原型链上所有可枚举属性。要只看自有属性，用 `Object.keys` 或在循环里 `Object.hasOwn(obj, key)` 过滤。
3. **`Object.freeze` 是浅冻结**：只冻结对象本身的属性，嵌套对象依然可改。深冻结需要递归处理。

## 下一步

按本叶地图依次深入，或直接跳到你最关心的一页——[对象基础](./guide-line/object-basics)、[属性描述符](./guide-line/property-descriptors)、[引用与拷贝](./guide-line/reference-copy)、[原型链](./guide-line/prototype-chain)、[基于原型的继承](./guide-line/prototypal-inheritance)、[Object 静态方法](./guide-line/object-static-methods)。
