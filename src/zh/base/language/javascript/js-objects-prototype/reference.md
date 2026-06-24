---
layout: doc
outline: [2, 3]
---

# 参考

> 基于现代 JavaScript（ES2025 · 核于 2026-06）

## 速查

- 创建对象：字面量 `{}`、`new 构造函数()`、`Object.create(proto)`、`Object.create(null)`（无原型字典）
- 读属性沿原型链上溯，写 / 删只动自身（setter 例外）；`in` 含链、`Object.hasOwn` 仅自有
- 属性三标志：`writable` / `enumerable` / `configurable`；普通赋值默认全 `true`，`defineProperty` 默认全 `false`
- 收紧对象：`preventExtensions` ⊂ `seal` ⊂ `freeze`；`freeze` 是**浅冻结**
- 引用语义：对象按引用，`===` 比引用；浅拷贝 `{...o}`，深拷贝 `structuredClone`（含循环引用，但拷不了函数）
- `__proto__`（对象「继承自谁」）≠ 函数 `prototype`（「给实例用的模板」）
- 继承范式：`class` / `extends` / `super`（语法糖）；底层是构造函数 + 寄生组合继承
- 遍历：`Object.keys/values/entries`（自有可枚举字符串键）；`for...in`（含继承，需过滤）
- 别污染内置原型（`Array.prototype.xxx`）；JavaScript 单继承（mixin 模拟混入）

## 创建对象速查

```js
const a = { x: 1 }; // 字面量（最常用）
const b = new Box(1); // 构造函数（new 接 Box.prototype）
const c = Object.create(proto); // 以 proto 为原型
const d = Object.create(null); // 无原型的纯字典（无 toString 等）
const e = { __proto__: proto, x: 1 }; // 字面量里设原型（标准语法）
```

## 属性访问 / 增删查速查

| 操作 | 写法 | 说明 |
| --- | --- | --- |
| 读（标识符键） | `o.a` | 沿原型链查找 |
| 读（动态 / 特殊键） | `o["a"]` / `o[key]` | 方括号支持任意键 |
| 写 | `o.a = 1` | 只作用于自身（新建自有属性） |
| 删 | `delete o.a` | 只删自有，删不掉继承的 |
| 存在性（含链） | `"a" in o` | 含原型链与不可枚举 |
| 自有性 | `Object.hasOwn(o, "a")` | 现代写法，取代 `hasOwnProperty` |
| 计算属性名 | `{ [expr]: v }` | `expr` 求值后转字符串作键 |
| 简写 / 方法 | `{ x, greet() {} }` | `{ x: x, greet: function () {} }` |

## 属性描述符速查

| API | 作用 |
| --- | --- |
| `Object.getOwnPropertyDescriptor(o, k)` | 读单个属性的 `{ value, writable, enumerable, configurable }` |
| `Object.getOwnPropertyDescriptors(o)` | 读全部（含 Symbol / 不可枚举），可做带标志克隆 |
| `Object.defineProperty(o, k, desc)` | 建 / 改单个属性（未写标志默认 `false`） |
| `Object.defineProperties(o, descs)` | 批量建 / 改 |
| `get` / `set`（访问器描述符） | 读写跑函数；与 `value` / `writable` 互斥 |

| 标志 | `false` 时的行为 |
| --- | --- |
| `writable` | 改值在严格模式报错，非严格静默失败 |
| `enumerable` | 不出现在 `for...in` / `Object.keys` |
| `configurable` | 不可删、不可改标志（单向不可逆）；`writable` 若仍 `true` 则值可改 |

## 对象级保护速查

| 方法 | 禁加 | 禁删 | 禁改值 | 检测 |
| --- | :-: | :-: | :-: | --- |
| `Object.preventExtensions(o)` | ✓ | | | `Object.isExtensible(o)` → `false` |
| `Object.seal(o)` | ✓ | ✓ | | `Object.isSealed(o)` |
| `Object.freeze(o)` | ✓ | ✓ | ✓ | `Object.isFrozen(o)` |

> `freeze` / `seal` 都是**浅**的——嵌套对象不受影响，深冻结需递归。

## 拷贝方式对比

| 方式 | 深度 | 函数 | `Date`/`Map`/`Set` | 循环引用 | 描述符 / 原型 |
| --- | --- | --- | --- | --- | --- |
| `{ ...o }` / `Object.assign({}, o)` | 一层 | 复制引用 | 复制引用 | 一层内 OK | 丢标志 / 不拷原型 |
| `JSON.parse(JSON.stringify(o))` | 深 | **丢失** | **变字符串 / `{}`** | **抛错** | 丢失 |
| `structuredClone(o)` | 深 | **抛 `DataCloneError`** | 正确深拷 | **正确保留** | 丢失 |
| `defineProperties + getOwnPropertyDescriptors` | 一层 | 复制引用 | 复制引用 | 一层内 OK | **保留标志**（不拷原型） |

## 原型相关速查

| API / 概念 | 说明 |
| --- | --- |
| `[[Prototype]]` | 对象内部槽，指向原型对象或 `null`，组成原型链 |
| `Object.getPrototypeOf(o)` | 读原型（标准） |
| `Object.setPrototypeOf(o, p)` | 写原型（标准，但运行时改会触发去优化） |
| `obj.__proto__` | `[[Prototype]]` 的历史访问器；字面量里 `__proto__: x` 是标准语法 |
| `Fn.prototype` | 函数属性，`new Fn()` 实例的原型；带 `constructor` 指回 `Fn` |
| `Object.create(p)` | 以 `p` 为原型建对象（推荐的「创建时定原型」方式） |
| 属性遮蔽 | 自有属性同名时遮住原型的；写不上溯，故赋值不改原型 |

## 继承范式速查

```js
// 现代：class（首选）
class Animal {
  constructor(name) {
    this.name = name;
  }
  speak() {
    return `${this.name} sound`;
  }
}
class Dog extends Animal {
  // extends 接原型链
  speak() {
    return `${super.speak()}, woof`; // super 调父原型方法
  }
}

// 底层等价：寄生组合继承
function Animal2(name) {
  this.name = name;
}
Animal2.prototype.speak = function () {
  return `${this.name} sound`;
};
function Dog2(name) {
  Animal2.call(this, name); // 初始化父实例属性
}
Object.setPrototypeOf(Dog2.prototype, Animal2.prototype); // 接方法链
```

> 链接子原型用 `Object.setPrototypeOf(Child.prototype, Parent.prototype)`，别用 `Child.prototype = Object.create(...)`（断已建实例的链、丢 `constructor`）。

## Object 静态方法速查

| 方法 | 作用 | 范围 |
| --- | --- | --- |
| `Object.keys(o)` | 键数组 | 自有可枚举字符串键 |
| `Object.values(o)` | 值数组 | 同上 |
| `Object.entries(o)` | `[键,值]` 数组 | 同上 |
| `Object.fromEntries(it)` | `[键,值]` 可迭代物 → 对象 | `entries` 的逆 |
| `Object.assign(t, ...s)` | 浅合并进 `t` 并返回 | 自有可枚举（跑 getter/setter） |
| `Object.hasOwn(o, k)` | 是否自有属性 | 取代 `hasOwnProperty` |
| `Object.getOwnPropertyNames(o)` | 全部字符串键 | 含不可枚举 |
| `Object.getOwnPropertySymbols(o)` | 全部 Symbol 键 | 含不可枚举 |

## 遍历选型速查

| 需求 | 用什么 | 含继承 | 含不可枚举 | 含 Symbol |
| --- | --- | :-: | :-: | :-: |
| 自有可枚举键 | `Object.keys` | ✗ | ✗ | ✗ |
| 含继承可枚举键 | `for...in`（配过滤） | ✓ | ✗ | ✗ |
| 自有全部字符串键 | `getOwnPropertyNames` | ✗ | ✓ | ✗ |
| 自有 Symbol 键 | `getOwnPropertySymbols` | ✗ | ✓ | ✓ |
| 单键自有性 | `Object.hasOwn` | ✗ | ✓ | ✓ |
| 单键存在性 | `key in o` | ✓ | ✓ | ✓ |

## 现代特性 Baseline 状态（2026-06 核）

| 特性 | 状态 | 说明 |
| --- | --- | --- |
| `Object.keys` / `values` / `entries` | ✅ Baseline 广泛可用 | 放心用 |
| `Object.assign` / `defineProperty` | ✅ Baseline 广泛可用 | 放心用 |
| `Object.getPrototypeOf` / `setPrototypeOf` | ✅ Baseline 广泛可用 | `setPrototypeOf` 慎在热路径用 |
| `Object.create` / `freeze` / `seal` | ✅ Baseline 广泛可用 | 放心用 |
| `class` / `extends` / `super` | ✅ Baseline 广泛可用 | 类式继承首选 |
| 私有字段 `#x` | ✅ Baseline 广泛可用（2021 起） | 放心用 |
| `Object.fromEntries` | ✅ Baseline 广泛可用（2020 起） | 放心用 |
| `structuredClone` | ✅ Baseline 广泛可用（2022 起） | 深拷贝首选（含函数会抛错） |
| `Object.hasOwn` | ✅ Baseline 广泛可用（2022 起） | 取代 `hasOwnProperty` 调用 |

## 权威链接

**标准 / 规范**

- [ECMAScript: Object 对象](https://tc39.es/ecma262/#sec-object-objects) · [Ordinary Object Internal Methods](https://tc39.es/ecma262/#sec-ordinary-object-internal-methods-and-internal-slots)
- [MDN: `Object`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object) · [`Object.create`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/create) · [`Object.defineProperty`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty)
- [MDN: `structuredClone`](https://developer.mozilla.org/en-US/docs/Web/API/Window/structuredClone) · [`Object.hasOwn`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/hasOwn)

**指南 / 教程**

- [MDN: Working with objects](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Working_with_objects) · [Inheritance and the prototype chain](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Inheritance_and_the_prototype_chain)
- [javascript.info: Prototypal inheritance](https://javascript.info/prototype-inheritance) · [Property flags and descriptors](https://javascript.info/property-descriptors) · [Native prototypes](https://javascript.info/native-prototypes)

**兼容性 / 调试**

- [Baseline 浏览器兼容查询：webstatus.dev](https://webstatus.dev/) · [caniuse.com](https://caniuse.com/)

## 相关页

- [入门](./getting-started) · [对象基础](./guide-line/object-basics) · [属性描述符](./guide-line/property-descriptors)
- [引用与拷贝](./guide-line/reference-copy) · [原型链](./guide-line/prototype-chain)
- [基于原型的继承](./guide-line/prototypal-inheritance) · [Object 静态方法](./guide-line/object-static-methods)
