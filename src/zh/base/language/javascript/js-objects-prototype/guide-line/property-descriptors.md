---
layout: doc
outline: [2, 3]
---

# 属性描述符

> 基于现代 JavaScript（ES2025 · 核于 2026-06）

## 速查

- 每个属性除了值，还带三个标志：`writable`（能否改值）、`enumerable`（能否被枚举）、`configurable`（能否删除 / 改标志）
- 默认值分两种：**普通赋值**（`o.a = 1`）建的属性三标志全 `true`；`Object.defineProperty` 没写的标志默认全 `false`
- 读描述符：`Object.getOwnPropertyDescriptor(o, key)` → `{ value, writable, enumerable, configurable }`
- 改 / 建：`Object.defineProperty(o, key, desc)`；批量：`Object.defineProperties(o, { ... })`
- 全量读：`Object.getOwnPropertyDescriptors(o)`——含 Symbol 键与不可枚举键，可做「带标志的克隆」
- `writable: false`：改值在严格模式报错，非严格模式静默失败
- `enumerable: false`：不出现在 `for...in` 与 `Object.keys`（`hasOwnProperty`、`toString` 等就是这样隐身的）
- `configurable: false`：**单向不可逆**——不可删、不可改其余标志；但若 `writable` 仍为 `true`，值还能改
- 访问器描述符用 `get` / `set`（不能与 `value` / `writable` 同时出现）；数据描述符用 `value` / `writable`
- 对象级收紧：`preventExtensions`（禁加新属性）⊂ `seal`（再禁删 + 全部 `configurable:false`）⊂ `freeze`（再禁改值）
- 检测：`Object.isExtensible` / `Object.isSealed` / `Object.isFrozen`；`freeze` 是**浅冻结**

## 属性不止是「值」

你写 `user.name = "John"` 时，引擎不只存了一个值，还给这个属性配了三个开关：

- **`writable`**：值能否被重新赋值；
- **`enumerable`**：属性能否出现在 `for...in` / `Object.keys` 等枚举中；
- **`configurable`**：属性能否被删除，以及它的标志能否再被修改。

通过**普通赋值**创建的属性，三个标志默认全是 `true`——这就是为什么平时感觉不到它们存在。用 `Object.getOwnPropertyDescriptor` 可以把它们看出来：

```js
const user = { name: "John" };
console.log(Object.getOwnPropertyDescriptor(user, "name"));
// { value: "John", writable: true, enumerable: true, configurable: true }
```

## 读与改标志

`Object.defineProperty` 既能改已有属性的标志，也能新建属性并指定标志：

```js
const user = { name: "John" };

// 改已有属性：把 name 设为不可写
Object.defineProperty(user, "name", { writable: false });
```

::: warning 两套不同的默认值
- **普通赋值**（`o.a = 1`）建的属性，三标志默认 `true`；
- **`Object.defineProperty`** 建新属性时，**没显式写的标志默认 `false`**。

```js
const o = {};
Object.defineProperty(o, "name", { value: "John" });
// 等价于 writable: false, enumerable: false, configurable: false
console.log(Object.keys(o)); // []（enumerable 默认 false，枚举不到）
```
这个差异是 `defineProperty` 最常见的「坑」——以为只是设了个值，结果属性既不可改也枚举不到。
:::

## 三个标志各自的行为

### `writable: false` —— 只读

```js
"use strict";
const user = { name: "John" };
Object.defineProperty(user, "name", { writable: false });
user.name = "Pete"; // 严格模式：TypeError；非严格模式：静默失败
console.log(user.name); // "John"
```

### `enumerable: false` —— 枚举时隐身

不可枚举的属性不出现在 `for...in` 和 `Object.keys` 中。内置方法正是靠这个「隐身」——`toString`、`hasOwnProperty` 都是 `enumerable: false`，所以 `for...in` 不会把它们列出来：

```js
const user = { name: "John" };
user.toString = function () {
  return this.name;
};
Object.defineProperty(user, "toString", { enumerable: false });

for (const key in user) console.log(key); // 只打印 "name"
console.log(Object.keys(user)); // ["name"]
```

### `configurable: false` —— 单向锁死

`configurable: false` 是**一条不可逆的单行道**：一旦设上，就不能删除该属性，也不能再修改它的标志。但有个例外——**如果 `writable` 还是 `true`，值仍可改**：

```js
const user = { name: "John" };
Object.defineProperty(user, "name", { configurable: false });

user.name = "Pete"; // 仍可改（writable 还是 true）
console.log(user.name); // "Pete"
delete user.name; // TypeError（configurable: false）
Object.defineProperty(user, "name", { enumerable: false }); // TypeError（不能再改标志）
```

唯一允许的例外是把 `writable: true` 改成 `false`（收紧方向），反过来不行。

## 批量操作

### 一次定义多个：`Object.defineProperties`

```js
const user = {};
Object.defineProperties(user, {
  name: { value: "John", writable: false },
  surname: { value: "Smith", writable: false },
});
```

### 全量读取：`Object.getOwnPropertyDescriptors`

它返回对象**所有**自有属性的描述符，包括 Symbol 键和不可枚举键——这正是「带标志的克隆」的关键。普通展开 `{...obj}` 会丢掉标志、还会触发 getter；下面这种写法连标志一起复制：

```js
const clone = Object.defineProperties({}, Object.getOwnPropertyDescriptors(obj));
```

（这种克隆仍是浅拷贝，且不复制原型；深拷贝见 [引用与拷贝](./reference-copy)。）

## 数据描述符 vs 访问器描述符

描述符分两类，**互斥**：

- **数据描述符**：用 `value` + `writable` 描述一个「存值」的属性；
- **访问器描述符**：用 `get` / `set` 描述一个「读写时跑函数」的属性。

同一个描述符里不能既有 `value` 又有 `get`（会报错）。访问器属性最直观的写法是在字面量里用 `get` / `set`：

```js
const obj = {
  a: 7,
  get b() {
    // 读 obj.b 时跑这个函数
    return this.a + 1;
  },
  set c(x) {
    // 写 obj.c = ... 时跑这个函数
    this.a = x / 2;
  },
};
console.log(obj.b); // 8（getter：7 + 1）
obj.c = 50; // setter：this.a = 25
console.log(obj.a); // 25
```

getter 不接收参数，setter 恰好接收一个参数。也可用 `defineProperty` 定义访问器：

```js
const o = { a: 0 };
Object.defineProperty(o, "doubled", {
  get() {
    return this.a * 2;
  },
  enumerable: true,
});
o.a = 5;
console.log(o.doubled); // 10
```

::: tip 访问器的典型用途
getter/setter 适合「计算属性」（值由其他属性算出，如全名 = 姓 + 名）、「写入校验」（setter 里检查参数合法性）、「只读视图」（只给 getter 不给 setter）。它对外表现得像普通属性，调用方无需知道背后跑了函数。
:::

## 对象级收紧：preventExtensions / seal / freeze

除了逐个属性设标志，还能一次性收紧整个对象。三者是**层层递进**的包含关系：

| 方法 | 效果 | 对应检测 |
| --- | --- | --- |
| `Object.preventExtensions(o)` | 禁止**新增**属性（已有的仍可改 / 删） | `Object.isExtensible(o)` → `false` |
| `Object.seal(o)` | 在前者基础上，再**禁止删除**，并把所有属性设为 `configurable: false` | `Object.isSealed(o)` |
| `Object.freeze(o)` | 在密封基础上，再把所有属性设为 `writable: false`（值也不能改） | `Object.isFrozen(o)` |

```js
const o = { a: 1, nested: { b: 2 } };
Object.freeze(o);
o.a = 99; // 静默失败（严格模式报错）
o.c = 3; // 加不进去
console.log(o.a); // 1
```

::: warning freeze 是「浅冻结」
`Object.freeze` 只冻结对象**本身的属性**，嵌套对象不受影响：

```js
const o = { nested: { b: 2 } };
Object.freeze(o);
o.nested.b = 999; // 改得动！nested 没被冻结
console.log(o.nested.b); // 999
```
要「深冻结」得自己递归遍历，对每个嵌套对象都调用 `Object.freeze`。
:::

## 小结

属性的完整画像是「值 + 三个标志」。`writable` / `enumerable` / `configurable` 决定它能否改、能否被枚举、能否删；`getOwnPropertyDescriptor(s)` 读、`defineProperty`/`defineProperties` 写；访问器描述符让读写背后跑函数；`preventExtensions` ⊂ `seal` ⊂ `freeze` 层层收紧整个对象（但 `freeze` 是浅的）。这套机制理解了，下一页换个角度看对象——它在内存里到底是「值」还是「引用」，以及由此而来的拷贝陷阱：[引用与拷贝](./reference-copy)。
