---
layout: doc
outline: [2, 3]
---

# Object 静态方法

> 基于现代 JavaScript（ES2025 · 核于 2026-06）

## 速查

- `Object.keys(o)` / `values(o)` / `entries(o)`：取**自有可枚举**（字符串键）属性的 键 / 值 / `[键,值]` 数组
- 三者都**跳过**：继承属性、不可枚举属性、Symbol 键；顺序为「整数键升序 → 其余按插入序」
- `Object.assign(target, ...src)`：把多个源的**自有可枚举**属性**浅拷贝**进 `target` 并返回它（会触发 getter / setter）
- 展开 `{ ...o }` 与 `Object.assign({}, o)` 都是浅合并；`assign` 写进已有 target，展开总建新对象
- `Object.fromEntries(iterable)`：把 `[键,值]` 对的可迭代物（数组 / `Map`）**装回**对象；是 `Object.entries` 的逆
- 「转换对象」三件套：`Object.fromEntries(Object.entries(o).map(([k, v]) => [k, f(v)]))`
- `Object.hasOwn(o, k)`：检测**自有**属性的现代写法，取代 `o.hasOwnProperty(k)`（后者遇 `Object.create(null)` 会报错）
- 遍历选型：只要自有 → `Object.keys` / `entries`；要含继承 → `for...in`（配 `Object.hasOwn` 过滤）
- 要含不可枚举 → `Object.getOwnPropertyNames(o)`；要含 Symbol → `Object.getOwnPropertySymbols(o)`
- `Object.entries` 只返回字符串键属性，`fromEntries` 却能造 Symbol 键属性

## keys / values / entries：把对象拆成数组

对象本身不能直接 `for...of` 或 `.map`，得先「拆」成数组。三个方法分别取键、值、键值对：

```js
const user = { name: "Ada", age: 27 };

console.log(Object.keys(user)); // ["name", "age"]
console.log(Object.values(user)); // ["Ada", 27]
console.log(Object.entries(user)); // [["name", "Ada"], ["age", 27]]

// 配 for...of 遍历
for (const [key, value] of Object.entries(user)) {
  console.log(`${key} = ${value}`);
}
// name = Ada
// age = 27
```

三者的取值范围完全一致——**只取自有、可枚举、字符串键**的属性，统统跳过：

- 从原型链**继承**的属性；
- `enumerable: false` 的**不可枚举**属性；
- **Symbol** 键的属性。

```js
const base = { inherited: 1 };
const obj = Object.create(base); // inherited 在原型上
obj.own = 2;
Object.defineProperty(obj, "hidden", { value: 3, enumerable: false });
obj[Symbol("s")] = 4;

console.log(Object.keys(obj)); // ["own"] —— 继承 / 不可枚举 / Symbol 都被排除
```

::: tip 枚举顺序是确定的
现代 JavaScript 里这几个方法的顺序有保证：**整数样式的键按升序，其余字符串键按插入顺序，Symbol 键最后**。所以 `{ 2: "b", 1: "a", x: "c" }` 的 `keys` 是 `["1", "2", "x"]`——别依赖「我先写哪个就先出哪个」。
:::

## assign 与展开：浅合并

`Object.assign(target, ...sources)` 把若干源对象的**自有可枚举**属性**浅拷贝**进 `target`，并返回 `target`：

```js
const target = { a: 1 };
const result = Object.assign(target, { b: 2 }, { c: 3 });
console.log(result); // { a: 1, b: 2, c: 3 }
console.log(result === target); // true —— 改的是 target 本身并返回它

// 常见用法：以空对象为 target，合并出新对象（不污染源）
const merged = Object.assign({}, defaults, overrides);
```

它和展开运算符 `{ ...o }` 高度相似，区别有二：

- `Object.assign` 写进一个**已有**的 `target`（可能改动它）；展开**总是**建新对象；
- 两者都是**浅**合并（嵌套对象仍共享引用，见 [引用与拷贝](./reference-copy)），且都会**触发 getter / 调用 setter**——拷贝的是 getter 求值后的结果，而非访问器本身（要连描述符一起拷见 [属性描述符](./property-descriptors)）。

```js
// 多数场景下，展开更直观
const merged = { ...defaults, ...overrides };
```

## fromEntries：把键值对装回对象

`Object.fromEntries` 是 `Object.entries` 的**逆操作**——吃一个 `[键, 值]` 对的可迭代物（数组或 `Map`），吐出一个对象：

```js
// 数组 → 对象
console.log(Object.fromEntries([["a", 1], ["b", 2]])); // { a: 1, b: 2 }

// Map → 对象（Map 本身就是 [键,值] 的可迭代物）
const map = new Map([["foo", "bar"], ["baz", 42]]);
console.log(Object.fromEntries(map)); // { foo: "bar", baz: 42 }
```

它和 `entries` 配上数组方法，构成「**转换对象**」的经典套路——把对象拆成键值对、用 `map` / `filter` 处理、再装回去：

```js
const prices = { apple: 1, banana: 2, cherry: 3 };

// 所有值翻倍
const doubled = Object.fromEntries(
  Object.entries(prices).map(([k, v]) => [k, v * 2]),
);
console.log(doubled); // { apple: 2, banana: 4, cherry: 6 }

// 只保留值 >= 2 的项
const filtered = Object.fromEntries(
  Object.entries(prices).filter(([, v]) => v >= 2),
);
console.log(filtered); // { banana: 2, cherry: 3 }
```

一个细节：`Object.entries` 只返回**字符串键**属性，但 `Object.fromEntries` 能创建 **Symbol 键**属性（键传 Symbol 即可），两者并非完全对称。

## hasOwn：检测自有属性的现代写法

`Object.hasOwn(obj, key)`（ES2022）判断 `key` 是不是 `obj` 的**自有属性**，是 `obj.hasOwnProperty(key)` 的现代替代：

```js
const obj = { a: 1 };
console.log(Object.hasOwn(obj, "a")); // true
console.log(Object.hasOwn(obj, "toString")); // false —— 继承的不算自有
console.log("toString" in obj); // true —— in 含原型链，对比一下
```

为什么不再直接用 `obj.hasOwnProperty`？两个原因：

- **`Object.create(null)` 的对象没有 `hasOwnProperty`**（它不继承 `Object.prototype`），直接调会抛 `TypeError`；`Object.hasOwn` 不受影响；
- 对象自身若**恰好有个属性也叫 `hasOwnProperty`**，会遮蔽掉继承的方法，调用结果错乱；`Object.hasOwn` 从 `Object` 上调，绕开这个坑。

```js
const dict = Object.create(null);
dict.key = 1;
// dict.hasOwnProperty("key"); // ❌ TypeError：dict 没有这个方法
console.log(Object.hasOwn(dict, "key")); // ✅ true
```

## 遍历选型：到底该用哪个

把前面散落的遍历手段汇总成一张选型表——核心区别就是「要不要继承属性」「要不要不可枚举 / Symbol」：

| 需求 | 用什么 | 含继承 | 含不可枚举 | 含 Symbol |
| --- | --- | :-: | :-: | :-: |
| 自有可枚举的键 / 值 / 键值对 | `Object.keys` / `values` / `entries` | ✗ | ✗ | ✗ |
| 含继承的可枚举键 | `for...in`（配 `Object.hasOwn` 过滤） | ✓ | ✗ | ✗ |
| 自有全部字符串键（含不可枚举） | `Object.getOwnPropertyNames` | ✗ | ✓ | ✗ |
| 自有 Symbol 键 | `Object.getOwnPropertySymbols` | ✗ | ✓ | ✓ |
| 检测单个键是否自有 | `Object.hasOwn` | ✗ | ✓ | ✓ |
| 检测单个键是否存在（含链） | `key in obj` | ✓ | ✓ | ✓ |

`for...in` 因为会枚举继承属性，是最易出错的——典型修法是循环里加一道过滤：

```js
const proto = { inherited: 1 };
const obj = Object.create(proto);
obj.own = 2;

for (const key in obj) {
  if (!Object.hasOwn(obj, key)) continue; // 过滤掉继承属性
  console.log(key); // 只打印 "own"
}
```

要列出**含继承**的全部属性（罕见，如调试），手动沿原型链走：

```js
function listAll(o) {
  let result = [];
  let cur = o;
  while (cur !== null) {
    result = result.concat(Object.getOwnPropertyNames(cur));
    cur = Object.getPrototypeOf(cur); // 上溯一层
  }
  return result;
}
```

## 小结

`keys` / `values` / `entries` 把对象拆成数组（只含自有可枚举字符串键），`fromEntries` 装回去（与 `entries` 互逆），`assign` / 展开做浅合并（会跑 getter），`hasOwn` 是检测自有属性的现代写法（对 `Object.create(null)` 安全）。遍历选型的关键永远是「要不要继承、要不要不可枚举 / Symbol」——`for...in` 含继承需过滤，`Object.keys` 系列只看自有可枚举。至此本叶六个深页走完——从对象字面量到原型链再到这套工具箱，你已掌握 JavaScript 对象模型的全貌。完整速查与权威链接见 [参考](../reference)。
