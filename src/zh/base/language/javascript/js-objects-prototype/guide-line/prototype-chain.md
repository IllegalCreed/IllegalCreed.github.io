---
layout: doc
outline: [2, 3]
---

# 原型链

> 基于现代 JavaScript（ES2025 · 核于 2026-06）

## 速查

- 每个对象有一个隐藏的内部槽 `[[Prototype]]`，指向另一个对象或 `null`——这条指向链就是「原型链」
- 读属性：自身没有 → 沿 `[[Prototype]]` 逐级上溯查找 → 命中即返回，到 `null` 仍没有则返回 `undefined`
- 写 / 删属性：**只作用于对象自身**，不沿链上溯（setter 例外，会跑原型上的 setter，`this` 仍是当前对象）
- 标准存取原型：`Object.getPrototypeOf(o)` / `Object.setPrototypeOf(o, proto)`
- `__proto__`：`[[Prototype]]` 的历史访问器（已不推荐 API 形式），但**对象字面量里的 `__proto__: x` 是标准语法**
- 函数的 `prototype` 属性 ≠ 对象的 `[[Prototype]]`：前者是「`new` 出来的实例将用的原型」，别混
- `Object.create(proto)`：以 `proto` 为原型新建对象；`Object.create(null)`：无原型的纯字典对象
- 属性遮蔽：自身属性与原型同名时，自身的「遮住」原型的；给实例赋值是新建自有属性，不改原型
- 字面量自带原型：`{}`→`Object.prototype`，`[]`→`Array.prototype`，`/x/`→`RegExp.prototype`
- 性能：链越长查找越慢，「查不存在的属性」最慢；避免运行时 `setPrototypeOf`（触发引擎去优化）
- 检测自有：`Object.hasOwn(o, k)`（或 `o.hasOwnProperty(k)`）；`in` 含原型链，`for...in` 枚举含继承

## `[[Prototype]]`：对象指向对象

JavaScript 没有「类作为蓝图」这回事。它的继承靠一个藏在每个对象里的内部槽 `[[Prototype]]`——它指向**另一个对象**（或 `null`）。当你读一个属性而对象自身没有时，引擎就去它的 `[[Prototype]]` 上找；那个对象也没有，就再上一层……如此形成一条**原型链**，直到找到属性，或抵达 `null`（此时返回 `undefined`）。

```js
const o = {
  a: 1,
  b: 2,
  // 对象字面量里的 __proto__ 是标准语法，用来设原型
  __proto__: {
    b: 3,
    c: 4,
  },
};

console.log(o.a); // 1 —— 自有属性
console.log(o.b); // 2 —— 自有 b 遮蔽了原型上的 b（属性遮蔽）
console.log(o.c); // 4 —— 自身没有，沿原型链找到
console.log(o.d); // undefined —— 整条链都没有
```

这条链可以画成：

```
o ──▶ { b: 3, c: 4 } ──▶ Object.prototype ──▶ null
```

链的尽头通常是 `Object.prototype`（`toString`、`hasOwnProperty` 等就住在这里），它的 `[[Prototype]]` 是 `null`。

## 读 vs 写：只有读会上溯

一个关键的不对称：**读属性会沿原型链查找，但写 / 删属性只作用于对象自身**。给对象写一个原型上已有的属性，不会改动原型，而是在对象自身**新建一个属性**遮住它：

```js
const animal = {
  walk() {
    console.log("Animal walk");
  },
};
const rabbit = { __proto__: animal };

rabbit.walk = function () {
  console.log("Rabbit bounce!");
};
rabbit.walk(); // "Rabbit bounce!" —— 用的是 rabbit 自有的，没碰 animal
animal.walk(); // "Animal walk" —— 原型原封不动
```

**唯一例外是访问器（setter）**：如果原型上定义的是 setter，给该属性赋值会触发那个 setter 函数，而它运行时的 `this` 仍是发起赋值的对象。

## `this`：永远指向「点号前的对象」

方法即使是从原型继承来的，调用时 `this` 也**指向点号前那个对象**，而非定义方法的原型。这条规则让「共享方法、各自状态」成为可能：

```js
const animal = {
  sleep() {
    this.isSleeping = true; // this 是调用者，不是 animal
  },
};
const rabbit = { __proto__: animal };

rabbit.sleep(); // 调用继承来的方法
console.log(rabbit.isSleeping); // true —— 写在了 rabbit 上
console.log(animal.isSleeping); // undefined —— animal 没被碰
```

所以把方法放在原型上、状态放在各实例上，是 JavaScript 共享行为的标准姿势。

## 标准存取：getPrototypeOf / setPrototypeOf

读写一个对象的原型，标准 API 是这两个：

```js
const a = { a: 1 };
const b = { b: 2 };

Object.setPrototypeOf(b, a); // 把 b 的原型设为 a
console.log(Object.getPrototypeOf(b) === a); // true
console.log(b.a); // 1 —— 现在能从 a 继承到了
// b ──▶ a ──▶ Object.prototype ──▶ null
```

## `__proto__` vs `prototype`：两个极易混淆的名字

这是初学者最大的混淆点。它们是**完全不同**的两样东西：

| | `__proto__` | `prototype` |
| --- | --- | --- |
| 出现在 | **任意对象**上 | **只有函数**上 |
| 是什么 | `[[Prototype]]` 的访问器（历史遗留） | 一个普通属性，指向一个对象 |
| 作用 | 访问 / 设置「这个对象的原型」 | 指定「用 `new` 调用此函数时，新实例的原型」 |
| 现代替代 | `Object.getPrototypeOf` / `setPrototypeOf` | 类用 `extends` |

```js
function Box(v) {
  this.value = v;
}
// Box.prototype 是「将来 new Box() 出来的实例的原型」
Box.prototype.getValue = function () {
  return this.value;
};

const b = new Box(42);
// 实例的 [[Prototype]]（即 __proto__）=== 构造函数的 prototype
console.log(Object.getPrototypeOf(b) === Box.prototype); // true
console.log(b.getValue()); // 42 —— 沿原型链找到 Box.prototype.getValue
// b ──▶ Box.prototype ──▶ Object.prototype ──▶ null
```

记忆口诀：**`prototype` 是函数身上的「给后代用的模板」，`__proto__`（即 `[[Prototype]]`）是对象身上的「我继承自谁」**。`new X()` 做的事，本质就是把新对象的 `[[Prototype]]` 接到 `X.prototype` 上。

::: warning `__proto__` 的两种身份
- **对象字面量里的 `__proto__: x`** 是 ECMAScript **标准语法**，可放心用来设原型；
- **作为属性访问器**（`obj.__proto__` 读写）是 Web 兼容附录里的历史遗留，规范建议改用 `Object.getPrototypeOf` / `setPrototypeOf`。

`Object.create(null)` 造出的对象没有原型，因此连 `__proto__` 这个访问器都没有——它是真正「干净」的字典。
:::

## `Object.create`：显式指定原型

`Object.create(proto)` 新建一个对象，并把它的 `[[Prototype]]` 直接设为 `proto`——不需要构造函数：

```js
const animal = {
  type: "Invertebrates",
  displayType() {
    console.log(this.type);
  },
};

const fish = Object.create(animal); // fish 的原型是 animal
fish.type = "Fishes"; // 自有属性遮蔽原型的 type
fish.displayType(); // "Fishes"
```

一个常被用到的特例是 `Object.create(null)`——造出**没有原型**的对象。它不继承 `Object.prototype` 上的任何东西，因此是一个绝对干净的字典，没有 `toString`、`hasOwnProperty`，也不怕「键恰好叫 `__proto__` / `constructor`」造成的原型污染：

```js
const dict = Object.create(null);
dict.anyKey = 1;
console.log(dict.hasOwnProperty); // undefined —— 没有继承任何东西
```

## 字面量自带原型

某些字面量在创建时就自动接好了原型——这正是「为什么数组能直接 `.push`」的答案：

```js
console.log(Object.getPrototypeOf({}) === Object.prototype); // true
console.log(Object.getPrototypeOf([]) === Array.prototype); // true
console.log(Object.getPrototypeOf(/x/) === RegExp.prototype); // true
```

`[].push` 之所以能用，是因为 `push` 住在 `Array.prototype` 上，而每个数组的原型都指向它——全局共享一份方法。这也解释了「改了 `Array.prototype` 全世界数组都变」的现象（详见 [基于原型的继承](./prototypal-inheritance) 关于「不要污染内置原型」的告诫）。

## 属性遮蔽

当对象自身的属性与原型上的同名时，自身的会「遮住」原型的——读到的是自身那个，原型的依然存在、原封不动：

```js
const parent = { value: 2 };
const child = { __proto__: parent };

console.log(child.value); // 2 —— 继承自 parent
child.value = 4; // 在 child 上新建自有属性
console.log(child.value); // 4 —— 自有遮蔽了继承
console.log(parent.value); // 2 —— parent 没变
```

再次印证「写不上溯」：`child.value = 4` 没有改 `parent`，而是在 `child` 上造了个新属性。

## 性能与注意事项

- **链越长，查找越慢**：每次属性访问都可能要走完整条链，深层继承有代价；
- **查「不存在的属性」最慢**：必须走到链尾 `null` 才能确定没有；
- **避免运行时改原型**：`Object.setPrototypeOf(obj, x)` 会让 JS 引擎放弃对该对象的优化，明显拖慢后续访问。需要指定原型，优先在**创建时**用 `Object.create(x)` 或 `class extends`，而不是事后修改；
- **`for...in` 会枚举继承属性**：遍历时若只想要自有属性，用 `Object.hasOwn(obj, key)` 过滤，或改用 `Object.keys`（详见 [Object 静态方法](./object-static-methods)）。

```js
// 不推荐：运行时改原型，触发去优化
Object.setPrototypeOf(obj, anotherObj);

// 推荐：创建时就定好原型
const obj = Object.create(anotherObj);
```

## 自有属性 vs 继承属性

区分一个属性是「对象自己的」还是「从原型继承的」，用 `Object.hasOwn`（现代写法）或 `hasOwnProperty`：

```js
function Graph() {
  this.vertices = [];
}
Graph.prototype.addVertex = function (v) {
  this.vertices.push(v);
};

const g = new Graph();
console.log(Object.hasOwn(g, "vertices")); // true —— 实例自有
console.log(Object.hasOwn(g, "addVertex")); // false —— 来自原型
console.log("addVertex" in g); // true —— in 含原型链
console.log(Object.getPrototypeOf(g).hasOwnProperty("addVertex")); // true
```

## 小结

`[[Prototype]]` 把对象串成一条链：读属性逐级上溯，写 / 删只动自身，方法里的 `this` 永远是调用者。`Object.create` / `getPrototypeOf` / `setPrototypeOf` 是标准存取手段；`__proto__`（对象的「继承自谁」）与函数的 `prototype`（「给实例用的模板」）务必分清；属性遮蔽源于「写不上溯」；长链与运行时改原型都有性能代价。原型链是机制，下一页讲怎样用它来**搭建继承**——从构造函数到寄生组合，再到 `class`：[基于原型的继承](./prototypal-inheritance)。
