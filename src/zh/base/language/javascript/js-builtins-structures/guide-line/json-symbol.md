---
layout: doc
outline: [2, 3]
---

# JSON 与 Symbol

> 基于现代 JavaScript（ES2025 · 核于 2026-06）

## 速查

- `JSON.stringify(value, replacer, space)`：对象转 JSON 字符串；`replacer` 过滤、`space` 缩进
- `stringify` 会**悄悄丢弃**：`undefined`、函数、`Symbol`（在对象中直接消失，在数组中变 `null`）
- `stringify` 特例：`NaN` / `Infinity` → `null`；`Date` → 调 `toISOString()`；`BigInt` → **抛 `TypeError`**
- `toJSON()` 钩子：对象定义此方法可自定义序列化结果（`Date` 即靠它输出 ISO 串）
- `JSON.parse(text, reviver)`：JSON 字符串转对象；`reviver` 逐键转换（常用于把日期串转回 `Date`）
- JSON 不是 JS：键必须**双引号**、不能有尾逗号、不能有注释、无 `undefined` / 函数 / `Symbol`
- 深拷贝慎用 `JSON.parse(JSON.stringify(x))`：会丢函数/`undefined`、`Date` 变字符串、不支持循环引用（优先 `structuredClone`）
- `Symbol("desc")`：每次调用都**唯一**，`Symbol("x") !== Symbol("x")`；`new Symbol()` 抛错；只读 `description`
- 全局注册表：`Symbol.for(key)` 跨模块共享同一 Symbol，`Symbol.keyFor(sym)` 反查 key
- well-known symbols：`Symbol.iterator`（可迭代协议）/ `Symbol.toPrimitive`（类型转换）/ `Symbol.hasInstance`（`instanceof`）/ `Symbol.toStringTag` 等，是语言内部行为的钩子
- Symbol 键「半隐藏」：`for...in` / `Object.keys` / `JSON.stringify` 都看不到，须 `Object.getOwnPropertySymbols`

## `JSON.stringify`：对象 → 字符串

```js
const user = { name: "Ada", age: 36, roles: ["admin"] };
JSON.stringify(user); // '{"name":"Ada","age":36,"roles":["admin"]}'

// 第三参 space：美化缩进（数字=空格数，或传字符串）
JSON.stringify(user, null, 2);
// {
//   "name": "Ada",
//   "age": 36,
//   "roles": ["admin"]
// }
```

### `replacer`：过滤 / 改写

第二参 `replacer` 可以是**函数**（逐键改写，返回 `undefined` 则该键被剔除）或**数组**（白名单，只保留列出的键）：

```js
const data = { name: "Ada", password: "secret", age: 36 };

// 函数形式：剔除敏感字段
JSON.stringify(data, (key, value) => (key === "password" ? undefined : value));
// '{"name":"Ada","age":36}'

// 数组形式：只保留白名单键
JSON.stringify(data, ["name", "age"]);
// '{"name":"Ada","age":36}'
```

### 「悄悄丢值」的规则（必背）

`stringify` 对几类值的处理常让人意外——它们不报错，只是默默消失或变形：

```js
JSON.stringify({
  a: undefined, // 对象中：整个键被丢弃
  b: () => 1, // 函数：被丢弃
  c: Symbol("x"), // Symbol：被丢弃
  d: NaN, // NaN → null
  e: Infinity, // Infinity → null
  f: new Date(), // Date → 调用 toJSON()，输出 ISO 字符串
});
// '{"d":null,"e":null,"f":"2026-06-25T..."}'（a/b/c 都没了！）

// 在数组里，undefined / 函数 / Symbol 不是消失而是变 null（保持下标）
JSON.stringify([undefined, () => 1, Symbol()]); // "[null,null,null]"

// BigInt 不是丢弃，而是直接抛错
JSON.stringify({ n: 1n }); // ❌ TypeError: Do not know how to serialize a BigInt
```

::: warning 这些坑的实战影响
后端期望某字段，但前端传了 `undefined`，序列化后字段直接消失，接口收到的是「没有这个键」而非 `null`——排查时容易懵。需要显式空值就传 `null`。要序列化 `BigInt` 需自定义 `toJSON` 或先 `.toString()`。
:::

### `toJSON()` 钩子

对象若定义了 `toJSON()` 方法，`stringify` 会用其返回值替代对象本身。`Date` 正是靠它输出 ISO 串：

```js
class Money {
  constructor(cents) {
    this.cents = cents;
  }
  toJSON() {
    return (this.cents / 100).toFixed(2); // 自定义序列化形式
  }
}
JSON.stringify({ price: new Money(1999) }); // '{"price":"19.99"}'
```

## `JSON.parse`：字符串 → 对象

```js
JSON.parse('{"name":"Ada","age":36}'); // { name: "Ada", age: 36 }
```

第二参 `reviver` 是个逐键回调，可在解析时转换值——最经典用途是把 ISO 日期字符串还原成 `Date` 对象（因为 JSON 没有日期类型，`stringify` 把 `Date` 变成了字符串，`parse` 不会自动转回）：

```js
const text = '{"name":"Firefox","born":"2004-11-09T00:00:00.000Z"}';

const obj = JSON.parse(text, (key, value) => {
  if (key === "born") return new Date(value); // 字符串 → Date
  return value;
});
obj.born instanceof Date; // true
```

## JSON 不是 JavaScript

JSON 是一种数据格式，语法**比 JS 字面量严格得多**，写手写 JSON 时常踩：

```text
✅ 合法 JSON         ❌ 非法（但在 JS 里合法）
{"a": 1}            {a: 1}          // 键必须加双引号
{"a": 1}            {"a": 1,}       // 不允许尾逗号
"text"              'text'          // 字符串必须双引号
{"a": null}         {"a": undefined} // 无 undefined
// 无注释            { /* x */ }      // 不允许注释
```

::: warning 别用 `JSON.parse(JSON.stringify(x))` 做深拷贝
这个老技巧能用，但坑很多：函数、`undefined`、`Symbol` 会丢，`Date` 变成字符串、`NaN`/`Infinity` 变 `null`、遇到循环引用直接抛错。现代深拷贝优先用内建的 `structuredClone(x)`（2022 起广泛可用，支持 `Date` / `Map` / `Set` / 循环引用，但仍不拷函数）。
:::

## `Symbol`：保证唯一的原始值

`Symbol` 是第 7 种原始类型，每次 `Symbol()` 调用都产生一个**全局唯一、不可变**的值——哪怕描述相同也互不相等：

```js
const a = Symbol("id");
const b = Symbol("id");
a === b; // false（描述只是给人看的标签，不影响唯一性）

a.description; // "id"（只读）
typeof a; // "symbol"
new Symbol(); // ❌ TypeError：Symbol 不能 new
```

它最直接的用途是做**绝不会和他人冲突的对象键**——给对象挂内部属性时，用 Symbol 键就不怕和现有键或将来别人加的键撞名：

```js
const ID = Symbol("id");
const user = { name: "Ada", [ID]: 123 };
user[ID]; // 123
```

### Symbol 键是「半隐藏」的

Symbol 键不会出现在常规枚举里——这正是它适合做「内部 / 元数据」键的原因：

```js
const SECRET = Symbol("secret");
const obj = { visible: 1, [SECRET]: 2 };

Object.keys(obj); // ["visible"]（看不到 Symbol 键）
for (const k in obj) console.log(k); // 只打印 "visible"
JSON.stringify(obj); // '{"visible":1}'（Symbol 键被忽略）

// 要拿到 Symbol 键，得用专门的 API
Object.getOwnPropertySymbols(obj); // [Symbol(secret)]
```

### 全局注册表：`Symbol.for` / `Symbol.keyFor`

`Symbol()` 造的符号是局部的。若想跨模块、跨文件**共享同一个 Symbol**，用 `Symbol.for(key)`——它在全局注册表里按 key 查找，存在则返回已有的、否则新建：

```js
Symbol.for("app.id") === Symbol.for("app.id"); // true（同 key 拿到同一个）
Symbol.keyFor(Symbol.for("app.id")); // "app.id"（反查 key）
```

## well-known symbols：语言行为的钩子

`Symbol` 构造器上挂着一批**预定义符号**，它们是 JS 内部操作的「协议接口」——把它们作为方法键实现到对象上，就能定制 `for...of`、`instanceof`、类型转换等语言级行为。

| well-known symbol | 作用 |
| --- | --- |
| `Symbol.iterator` | 实现它即「可迭代」，支持 `for...of` 与展开 `...` |
| `Symbol.asyncIterator` | 异步可迭代，支持 `for await...of` |
| `Symbol.hasInstance` | 定制 `instanceof` 的判定逻辑 |
| `Symbol.toPrimitive` | 定制对象转原始值（数字 / 字符串 / 默认）的行为 |
| `Symbol.toStringTag` | 定制 `Object.prototype.toString` 的标签（`[object Xxx]`） |
| `Symbol.match` / `replace` / `search` / `split` | 让对象能像正则一样被 `String` 对应方法调用 |
| `Symbol.dispose` / `asyncDispose` | 配合 `using` / `await using` 的资源自动释放（较新） |

```js
// 用 Symbol.iterator 让普通对象变得可迭代
const range = {
  from: 1,
  to: 3,
  [Symbol.iterator]() {
    let cur = this.from;
    const last = this.to;
    return {
      next: () => (cur <= last ? { value: cur++, done: false } : { value: undefined, done: true }),
    };
  },
};
[...range]; // [1, 2, 3]（展开运算符触发了 Symbol.iterator）

// 用 Symbol.toPrimitive 定制类型转换
const money = {
  amount: 100,
  [Symbol.toPrimitive](hint) {
    return hint === "string" ? `¥${this.amount}` : this.amount;
  },
};
`${money}`; // "¥100"（string hint）
money + 1; // 101（number/default hint）
```

可迭代协议（`Symbol.iterator`）在「数组与可迭代」叶有完整展开，这里只点出它本质上就是 well-known symbol 协议的一个应用。

## 小结

`JSON.stringify` / `parse` 是数据交换的标准手段，但要牢记它「悄悄丢 `undefined`/函数/`Symbol`、`BigInt` 抛错、`Date` 变字符串」的规则，深拷贝优先 `structuredClone`。`Symbol` 提供唯一且半隐藏的对象键，而其 well-known 成员是定制语言级行为（迭代、`instanceof`、类型转换）的协议钩子。下一页进入时间处理：[Date 与 Temporal](./date-temporal)。
