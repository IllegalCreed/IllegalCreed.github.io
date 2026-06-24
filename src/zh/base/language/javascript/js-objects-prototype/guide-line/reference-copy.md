---
layout: doc
outline: [2, 3]
---

# 引用与拷贝

> 基于现代 JavaScript（ES2025 · 核于 2026-06）

## 速查

- 原始值（number / string / boolean / null / undefined / symbol / bigint）按**值**存取；对象按**引用**存取
- 变量存的是「指向对象的引用」；赋值 / 传参复制的是引用，不是对象本身——「改一处，处处变」
- `===` 比较对象时比的是「是不是同一个引用」，不是内容；两个内容相同的字面量永远不相等
- 浅拷贝：`{ ...obj }` / `Object.assign({}, obj)`——只复制第一层，嵌套对象仍共享引用
- 深拷贝：`structuredClone(obj)`——递归复制，原生（2022 起广泛可用），且**正确处理循环引用**
- `structuredClone` 能拷：对象 / 数组 / `Map` / `Set` / `Date` / `RegExp` / `ArrayBuffer` / TypedArray / `Blob` 等
- `structuredClone` **不能拷**：函数 / 方法、DOM 节点、getter/setter 与属性描述符、原型链——遇到函数抛 `DataCloneError`
- `JSON.parse(JSON.stringify(o))` 是老式深拷贝：会丢函数 / `undefined` / Symbol，`Date` 变字符串，循环引用直接抛错
- 「带描述符的浅克隆」：`Object.defineProperties({}, Object.getOwnPropertyDescriptors(o))`
- `const` 锁的是「引用不可重新赋值」，不锁对象内容；要锁内容用 `Object.freeze`（且是浅冻结）

## 原始值 vs 对象：值还是引用

JavaScript 的数据分两大类，存取方式根本不同：

- **原始值**（number、string、boolean、null、undefined、symbol、bigint）：变量直接持有**值本身**；
- **对象**（含数组、函数）：变量持有的是一个**指向对象的引用**，对象数据存在别处。

赋值时，原始值复制的是值的副本，对象复制的是引用——两个变量从此指向**同一个对象**：

```js
// 原始值：各存各的副本
let a = 1;
let b = a;
b = 2;
console.log(a); // 1（互不影响）

// 对象：共享同一个引用
const obj = { count: 1 };
const ref = obj;
ref.count = 2;
console.log(obj.count); // 2（改 ref 等于改 obj，它们是同一个对象）
```

传参同理——把对象传进函数，函数内对它的属性修改会反映到外部，因为传进去的是引用：

```js
function mutate(o) {
  o.touched = true; // 改的是同一个对象
}
const data = {};
mutate(data);
console.log(data.touched); // true
```

## `===` 比的是引用，不是内容

正因为对象按引用存取，相等运算符比较的也是「是不是同一个引用」，而非内容是否一致：

```js
const fruit = { name: "apple" };
const another = { name: "apple" };
console.log(fruit === another); // false —— 两个不同对象，尽管内容相同
console.log(fruit == another); // false —— == 对对象同样比引用

const same = fruit;
console.log(fruit === same); // true —— 同一个引用
```

要比较「内容是否相等」，没有内置运算符，得自己逐字段比，或借助序列化 / 工具库——但要注意序列化对键顺序、特殊值敏感，并非通用方案。

## 浅拷贝：只复制一层

要得到一个**新对象**而非共享引用，最常用的是浅拷贝——展开运算符或 `Object.assign`：

```js
const original = { a: 1, nested: { b: 2 } };

const copy1 = { ...original }; // 展开运算符
const copy2 = Object.assign({}, original); // Object.assign

copy1.a = 99;
console.log(original.a); // 1（第一层是新的，互不影响）

copy1.nested.b = 999;
console.log(original.nested.b); // 999 —— 坑！嵌套对象仍是同一个引用
```

「浅」的含义就在最后两行：**只有第一层属性被复制，嵌套对象 / 数组仍与原对象共享同一引用**。改 `copy1.a` 不影响原对象，但改 `copy1.nested.b` 会，因为 `nested` 这个引用被原样复制了过来。

::: tip 浅拷贝够用的场景
当对象只有一层（扁平结构），或你明确知道不会去改嵌套子对象时，浅拷贝又快又简单。React/Vue 里更新不可变状态、合并配置默认值，大量用的就是浅拷贝。需要改嵌套层时，逐层展开（`{ ...o, nested: { ...o.nested, b: 3 } }`）或上深拷贝。
:::

## 深拷贝：`structuredClone`

要彻底独立的副本（连嵌套层都不共享），用原生的 `structuredClone`——它递归复制整棵对象树：

```js
const original = { a: 1, nested: { b: 2 }, list: [1, 2, 3] };
const deep = structuredClone(original);

deep.nested.b = 999;
console.log(original.nested.b); // 2（完全独立，嵌套层也是新的）
```

它的能力远超 `JSON` 方案，支持一大批内置类型：

```js
const rich = {
  date: new Date(),
  map: new Map([["k", "v"]]),
  set: new Set([1, 2]),
  regexp: /abc/g,
  buffer: new Uint8Array([1, 2, 3]),
};
const clone = structuredClone(rich); // 以上类型都被正确深拷贝
```

可拷的类型包括：普通对象与数组、`Map`、`Set`、`Date`、`RegExp`、`ArrayBuffer` 与各类 TypedArray、`Blob` / `File` 等。

### structuredClone 的限制

它不是万能的，遇到下列内容会抛 `DataCloneError`（`DOMException`）：

- **函数 / 方法**——这是最常见的拦路虎，对象里只要有方法就会抛错；
- **DOM 节点**；
- **getter / setter 与属性描述符**——只拷「值」，访问器与 `writable` 等标志全部丢失；
- **原型链**——只复制自有属性，克隆出来的对象原型是 `Object.prototype`，类实例会「降级」成普通对象。

```js
structuredClone({ fn: () => {} }); // 抛 DataCloneError（含函数）
```

### 循环引用：structuredClone 能搞定

对象里出现「自己引用自己」的环时，`structuredClone` 能正确处理并保留环结构：

```js
const o = { name: "MDN" };
o.itself = o; // 循环引用

const clone = structuredClone(o);
console.log(clone !== o); // true（是新对象）
console.log(clone.itself === clone); // true（环被正确重建，指向克隆自身）
```

这正是 `JSON.stringify` 做不到的——它遇到循环引用直接抛 `TypeError`。

## 各种拷贝方式对比

| 方式 | 深度 | 函数 | `Date` / `Map` / `Set` | 循环引用 | 属性描述符 / 原型 |
| --- | --- | --- | --- | --- | --- |
| `{ ...o }` / `Object.assign` | 仅一层 | 复制引用 | 复制引用 | 一层内 OK | 丢标志 / 不拷原型 |
| `JSON.parse(JSON.stringify(o))` | 深 | **丢失** | **变字符串 / 变 `{}`** | **抛错** | 丢失 |
| `structuredClone(o)` | 深 | **抛错** | 正确深拷 | **正确保留** | 丢失 |
| `defineProperties + getOwnPropertyDescriptors` | 仅一层 | 复制引用 | 复制引用 | 一层内 OK | **保留标志**（仍不拷原型） |

经验法则：

- 扁平对象、要快 → **浅拷贝**（`{...o}`）；
- 含 `Date` / `Map` / `Set`、有嵌套、可能有环、且**没有函数** → **`structuredClone`**；
- 要保留 getter/setter 与标志 → `getOwnPropertyDescriptors` 方案（但仅一层）；
- 含函数 / 类实例且要深拷 → 通常得手写或用成熟库（`structuredClone` 在这里会抛错）。

## `const` 不等于「内容不可变」

容易混淆的一点：`const` 只保证**变量不能被重新赋值**（不能再指向另一个对象），但对象的**内容照样能改**：

```js
const o = { a: 1 };
o.a = 2; // ✅ 合法：改的是内容，不是重新赋值
o.b = 3; // ✅ 合法：加属性
console.log(o); // { a: 2, b: 3 }
// o = {};      // ❌ TypeError：重新赋值才被 const 禁止
```

要真正禁止改内容，得用上一页的 `Object.freeze`（且记得它是浅冻结）。

## 小结

原始值按值、对象按引用——这一条决定了「改一处处处变」「`===` 比引用」「浅拷贝只复制一层」这一连串行为。需要副本时分清深浅：扁平用 `{...o}`，含特殊类型 / 嵌套 / 循环且无函数用 `structuredClone`，要保留描述符用 `getOwnPropertyDescriptors`。`const` 锁引用不锁内容。下一页进入本叶的核心——对象之间靠 `[[Prototype]]` 串成的查找链：[原型链](./prototype-chain)。
