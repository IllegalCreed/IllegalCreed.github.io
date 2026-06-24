---
layout: doc
outline: [2, 3]
---

# 入门

> 基于现代 JavaScript（ES2025 · 核于 2026-06）

## 速查

- **数值**：JS 只有一种 `number`（IEEE 754 双精度）；`0.1 + 0.2 !== 0.3`，比较小数用 `Number.EPSILON`
- **安全整数**：`Number.MAX_SAFE_INTEGER` = 2⁵³−1 = `9007199254740991`；超出用 `BigInt`（字面量加 `n` 后缀）
- **Math**：`Math.round`/`floor`/`ceil`/`trunc`/`abs`/`sign`/`min`/`max`/`random`/`hypot`，常量 `Math.PI`/`Math.E`
- **字符串**：单/双引号 + 反引号模板（`` `${x}` `` 插值、可多行）；`length` 是 UTF-16 码元数，emoji 占 2
- **正则**：字面量 `/p/flags` 或 `new RegExp("p","flags")`；八标志 `g`/`i`/`m`/`s`/`u`/`y`/`d`/`v`
- **Map / Set**：`Map` 键可为任意值且有序，`Set` 自动去重；`[...new Set(arr)]` 一行去重
- **弱引用**：`WeakMap` / `WeakSet` 键为对象、不阻止垃圾回收、不可枚举
- **JSON**：`JSON.stringify(v, replacer, space)` / `JSON.parse(text, reviver)`；丢 `undefined`/函数，`BigInt` 抛错
- **Symbol**：`Symbol("desc")` 每次唯一、`new Symbol()` 报错；`Symbol.iterator` 等 well-known symbols 是协议
- **时间**：`Date` 月份从 0 开始、可变、毫秒精度；`Temporal`（ES2026·Chrome/FF 已发）不可变、纳秒精度、月份从 1 开始

## 一段「内建对象全景」代码

下面这段示例把本叶要讲的内建对象几乎都用了一遍，其余各页就是逐块拆解它：

```js
// 1. 数值与 Math：IEEE 754 浮点的经典坑
console.log(0.1 + 0.2); // 0.30000000000000004（不是 0.3）
console.log(Math.round(4.5), Math.max(1, 2, 3)); // 5 3
console.log(Number.MAX_SAFE_INTEGER); // 9007199254740991（2^53 - 1）

// 2. BigInt：超出安全整数用 n 后缀，任意精度
const big = 9007199254740993n;
console.log(big + 1n); // 9007199254740994n（普通 number 会算错）

// 3. 字符串与模板字面量（反引号 + 插值 + 多行）
const user = "Ada";
const greet = `你好，${user}！
这是第二行`;
console.log(greet);

// 4. 正则：匹配 + 命名捕获组
const m = "2026-06-25".match(/(?<y>\d{4})-(?<mo>\d{2})-(?<d>\d{2})/);
console.log(m.groups.y, m.groups.mo); // "2026" "06"

// 5. Set 去重 + Map 计数
const tags = ["js", "ts", "js", "css"];
console.log([...new Set(tags)]); // ["js", "ts", "css"]
const count = new Map([["a", 1]]);
count.set("a", count.get("a") + 1); // Map 键值随取随改

// 6. JSON 往返（注意它会丢掉 undefined 与函数）
const json = JSON.stringify({ name: user, fn: () => 1, x: undefined });
console.log(json); // {"name":"Ada"}（fn 与 x 被悄悄丢弃）

// 7. Symbol：唯一标识，永不与他人键冲突
const id = Symbol("id");
const obj = { [id]: 42 };
console.log(obj[id]); // 42（Object.keys 看不到它）

// 8. 时间：Date 月份从 0 开始（经典坑）
const d = new Date(2026, 5, 25); // 第 6 个月是 5！结果是 2026 年 6 月
console.log(d.getMonth()); // 5（getMonth 也从 0 开始）
```

::: tip 这段代码的取舍
这些都是「不导入任何包就能用」的标准库。注意里头藏着三个最常被坑的点：`0.1 + 0.2` 不等于 `0.3`、`JSON.stringify` 会悄悄丢值、`Date` 月份从 0 开始——它们都**不报错**，错了你也未必察觉。
:::

## 逐块拆解

### ① 数值、Math 与 BigInt

JavaScript 只有一种数字类型 `number`，底层是 IEEE 754 双精度浮点——整数和小数共用它。这带来两个必须知道的事实：小数运算有精度误差（`0.1 + 0.2`），整数只在 ±2⁵³−1 内精确。需要更大的精确整数时用 `BigInt`。`Math` 则提供取整、幂、随机数等一整套数学工具。详见 [数值、Math 与 BigInt](./guide-line/number-math-bigint)。

### ② 字符串与模板字面量

字符串字面量有单引号、双引号、反引号三种。反引号的**模板字面量**支持 `${}` 插值与多行，几乎取代了字符串拼接。要警惕的是 `length` 数的是 UTF-16 码元而非「人眼字符」——emoji 等增补字符占两个码元，需用 `for...of` 或展开按码点遍历。详见 [字符串与模板字面量](./guide-line/string-template)。

### ③ 正则表达式

正则用来做模式匹配。两种创建方式（字面量编译于解析期、构造器适合动态拼接），八个标志位（`g`/`i`/`m`/`s`/`u`/`y`/`d`/`v`），以及捕获组、命名组、断言。`matchAll` 是带 `g` 标志取所有匹配＋捕获组的现代正解。详见 [正则表达式](./guide-line/regexp)。

### ④ Map / Set 与弱引用

`Map` 是有序、键可为任意值的键值集合，许多场景比普通对象更合适；`Set` 自动去重。它们的「弱引用版」`WeakMap` / `WeakSet` 不阻止键被垃圾回收，专用于给对象挂私有数据 / 元数据而不造成内存泄漏。详见 [Map / Set 与弱引用](./guide-line/map-set-weak)。

### ⑤ JSON 与 Symbol

`JSON.stringify` / `JSON.parse` 是前后端数据交换的标准手段，但有一串「悄悄丢值」的规则（`undefined`、函数、`Symbol` 被丢，`BigInt` 直接抛错）。`Symbol` 是保证唯一的原始值，既能做不冲突的对象键，其 well-known 成员（`Symbol.iterator` 等）还是语言内部行为的「协议钩子」。详见 [JSON 与 Symbol](./guide-line/json-symbol)。

### ⑥ Date 与 Temporal

`Date` 是 JavaScript 用了 30 年的日期 API，坑极多（月份从 0 开始、可变、只到毫秒、时区支持薄弱）。新一代 `Temporal` 已进入 ES2026、并在 Chrome/Edge 144+ 与 Firefox 139+ 落地——不可变、纳秒精度、显式时区、月份从 1 开始。Safari 尚未支持，生产用需配 polyfill 降级。详见 [Date 与 Temporal](./guide-line/date-temporal)。

## 内建对象速览

| 内建 | 主要职责 | 一句话提醒 |
| --- | --- | --- |
| `Number` | 数值表示与判定 | 只有一种数字类型，浮点有精度坑 |
| `Math` | 数学运算 | 静态工具集，不能 `new Math()` |
| `BigInt` | 任意精度整数 | 字面量加 `n`，不能与 `number` 混算 |
| `String` | 文本处理 | `length` 数的是 UTF-16 码元 |
| `RegExp` | 模式匹配 | `g` 标志带 `lastIndex` 副作用 |
| `Map` / `Set` | 键值 / 去重集合 | 键可为任意值、有序、可直接迭代 |
| `WeakMap` / `WeakSet` | 弱引用集合 | 不阻止 GC、不可枚举、键必须是对象 |
| `JSON` | 序列化 | 丢 `undefined`/函数，`BigInt` 抛错 |
| `Symbol` | 唯一标识 | 不冲突的键 + 语言协议钩子 |
| `Date` / `Temporal` | 日期时间 | `Date` 坑多，`Temporal` 是未来 |

## 下一步

按本叶地图依次深入，或直接跳到你最关心的一页——[数值](./guide-line/number-math-bigint)、[字符串](./guide-line/string-template)、[正则](./guide-line/regexp)、[集合](./guide-line/map-set-weak)、[JSON/Symbol](./guide-line/json-symbol)、[时间](./guide-line/date-temporal)。下一页从最基础也最易踩坑的 [数值、Math 与 BigInt](./guide-line/number-math-bigint) 开始。
