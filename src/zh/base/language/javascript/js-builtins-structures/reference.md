---
layout: doc
outline: [2, 3]
---

# 参考

> 基于现代 JavaScript（ES2025 · 核于 2026-06）

## 速查

- **数值**：只有 `number`（IEEE 754）；`0.1 + 0.2 !== 0.3` 用 `Number.EPSILON` 比；超 `2⁵³−1` 用 `BigInt`（`n` 后缀）
- **判定**：`Number.isInteger` / `isNaN` / `isFinite` / `isSafeInteger`（不隐式转换，优于全局版）
- **字符串**：`length` 数 UTF-16 码元（emoji 占 2），按码点用 `for...of` / 展开 / `codePointAt`；模板字面量插值＋多行
- **正则**：八标志 `gimsuyd v`；取所有匹配＋捕获组用 `matchAll`；当心全局正则 `lastIndex` 副作用
- **集合**：`Map` 任意键/有序/有 size，`Set` 一行去重 `[...new Set(a)]` ＋集合运算；弱引用版不阻 GC、不可枚举
- **JSON**：丢 `undefined`/函数/`Symbol`，`BigInt` 抛错，`Date` 变串；深拷贝优先 `structuredClone`
- **Symbol**：唯一键、半隐藏（须 `getOwnPropertySymbols`）；well-known symbols 是语言协议钩子
- **时间**：`Date` 月份从 0／可变／毫秒；`Temporal`（ES2026·Chrome/FF 已发·Safari 未）不可变／纳秒／月份从 1，生产配 polyfill

## 数值速查

```js
Number.MAX_SAFE_INTEGER; // 9007199254740991（2^53 - 1）
Number.EPSILON; // 2.220446049250313e-16（小数比较阈值）
Number.isInteger(x) / isNaN(x) / isFinite(x) / isSafeInteger(x); // 静态判定，不转换
Number(x); // 严格转数字（整串须合法）
parseInt(x, 10) / parseFloat(x); // 容忍后缀；parseInt 第二参基数必传
(n).toFixed(2) / toPrecision(5) / toString(16); // 格式化（toFixed 返回字符串）
0xff / 0o755 / 0b1010 / 1e6 / 1_000_000; // 字面量：十六/八/二进制、指数、分隔符
```

## Math 速查

| 类别 | 方法 / 常量 |
| --- | --- |
| 取整 | `round`（.5 向上）/ `floor`（向负无穷）/ `ceil`（向正无穷）/ `trunc`（砍小数） |
| 数值 | `abs` / `sign` / `pow`（= `**`）/ `sqrt` / `cbrt` / `hypot` |
| 极值 | `min(...)` / `max(...)` |
| 随机 | `random()` → [0, 1) |
| 对数指数 | `log` / `log2` / `log10` / `exp` |
| 常量 | `PI` ≈ 3.14159 / `E` ≈ 2.71828 |

## BigInt 速查

```js
10n / BigInt(10) / BigInt("10"); // 创建（构造器传字符串防精度丢失）
1n + 1; // ❌ TypeError：不能与 number 混算
5n / 2n; // 2n（除法截断，无小数）
Math.sqrt(16n); // ❌ 无 Math 支持
typeof 1n; // "bigint"
```

## 字符串方法速查

| 类别 | 方法 |
| --- | --- |
| 查找 | `includes` / `startsWith` / `endsWith` / `indexOf` / `at`（负索引） |
| 截取 | `slice`（负数）/ `substring` / `split` |
| 增补 | `padStart` / `padEnd` / `repeat` / `trim` / `trimStart` / `trimEnd` |
| 替换 | `replace`（首个）/ `replaceAll`（全部，传正则须带 `g`） |
| 大小写 | `toUpperCase` / `toLowerCase` / `normalize`（比较前规范化） |
| 码点 | `codePointAt` / `String.fromCodePoint`（正确处理 emoji） |
| 模板 | `` `${expr}` ``（插值＋多行）/ 标签模板 `` tag`...` `` / `String.raw` |

## 正则速查

| 标志 | 作用 |
| --- | --- |
| `g` | 全局 |
| `i` | 忽略大小写 |
| `m` | `^`/`$` 匹配每行 |
| `s` | `.` 匹配换行 |
| `u` | Unicode 码点，启用 `\p{...}` |
| `y` | 粘性（从 `lastIndex` 起匹配） |
| `d` | 结果带捕获组索引 |
| `v` | `u` 升级版（ES2024），集合运算 |

```js
/(?<name>...)/; // 命名捕获组 → match.groups.name
(?=...) (?!...); // 前瞻：正 / 负
(?<=...) (?<!...); // 后顾：正 / 负（ES2018）
str.matchAll(/.../g); // 取所有匹配＋捕获组（正解）
re.test(s) / re.exec(s); // 布尔 / 匹配数组
```

## Map / Set 速查

| 类型 | 键 | 有序 | 可枚举 | size | clear | 主要方法 |
| --- | --- | --- | --- | --- | --- | --- |
| `Map` | 任意值 | ✓ | ✓ | ✓ | ✓ | `set`/`get`/`has`/`delete`/`keys`/`values`/`entries` |
| `Set` | 任意值 | ✓ | ✓ | ✓ | ✓ | `add`/`has`/`delete`；集合运算见下 |
| `WeakMap` | 对象 | — | ✗ | ✗ | ✗ | `set`/`get`/`has`/`delete` |
| `WeakSet` | 对象 | — | ✗ | ✗ | ✗ | `add`/`has`/`delete` |

```js
[...new Set(arr)]; // 一行去重
a.union(b) / intersection(b) / difference(b) / symmetricDifference(b); // 集合运算（2024）
a.isSubsetOf(b) / isSupersetOf(b) / isDisjointFrom(b);
Object.groupBy(items, fn); // → 普通对象（ES2024）
Map.groupBy(items, fn); // → Map（键可为对象）
```

## JSON 行为速查

| 值 | `JSON.stringify` 结果 |
| --- | --- |
| `undefined` | 对象中丢弃 / 数组中变 `null` |
| 函数 | 对象中丢弃 / 数组中变 `null` |
| `Symbol` | 对象中丢弃 / 数组中变 `null` |
| `NaN` / `Infinity` | `null` |
| `Date` | 调 `toJSON()` → ISO 字符串 |
| `BigInt` | **抛 `TypeError`** |

```js
JSON.stringify(v, replacer, space); // replacer 过滤 / space 缩进
JSON.parse(text, reviver); // reviver 逐键转换（如日期串 → Date）
structuredClone(x); // 深拷贝优先用它（支持 Date/Map/Set/循环引用，不拷函数）
```

## Symbol 速查

```js
Symbol("d") !== Symbol("d"); // 每次唯一；new Symbol() 抛错；.description 只读
Symbol.for(k) / Symbol.keyFor(s); // 全局注册表：跨模块共享 / 反查 key
Object.getOwnPropertySymbols(o); // 取 Symbol 键（for...in / keys / stringify 都看不到）
```

| well-known symbol | 钩子作用 |
| --- | --- |
| `Symbol.iterator` / `asyncIterator` | 可迭代 / 异步可迭代协议 |
| `Symbol.hasInstance` | 定制 `instanceof` |
| `Symbol.toPrimitive` | 定制类型转换 |
| `Symbol.toStringTag` | 定制 `toString` 标签 |
| `Symbol.match`/`replace`/`search`/`split` | 类正则协议 |
| `Symbol.dispose` / `asyncDispose` | `using` 资源释放 |

## Date / Temporal 速查

```js
// Date（坑：月份从 0、getDay 是星期、可变、毫秒）
new Date(2026, 5, 25); // 5 = 6 月！
d.getMonth(); // 0–11；getDate() 几号；getDay() 星期
Date.now() / d.getTime(); // 毫秒时间戳

// Temporal（ES2026；Chrome/Edge 144+、Firefox 139+；Safari 未；配 polyfill）
import { Temporal } from "@js-temporal/polyfill";
Temporal.Now.zonedDateTimeISO("Asia/Tokyo"); // 当前带时区
Temporal.PlainDate.from("2026-06-25").month; // 6（从 1 开始）
date.add({ months: 1 }); // 不可变，返回新对象

// Intl 格式化
new Intl.DateTimeFormat("zh-CN", { dateStyle: "long" }).format(new Date());
new Intl.NumberFormat("zh-CN", { style: "currency", currency: "CNY" }).format(99.5);
```

## 现代特性 Baseline 状态（2026-06 核）

| 特性 | ES 版本 | 状态 | 用法建议 |
| --- | --- | --- | --- |
| `BigInt` | ES2020 | ✅ Baseline 广泛可用 | 放心用 |
| `String.prototype.replaceAll` | ES2021 | ✅ 广泛可用 | 放心用 |
| `String.prototype.at` | ES2022 | ✅ 广泛可用 | 放心用 |
| `structuredClone` | — | ✅ Baseline（2022 起） | 深拷贝首选 |
| `WeakRef` / `FinalizationRegistry` | ES2021 | ✅ 可用，但**慎用** | GC 时机不可控，业务一般用不到 |
| 正则 `d` 标志（hasIndices） | ES2022 | ✅ 广泛可用 | 需要匹配位置时用 |
| Set 集合运算（`union` 等） | — | 🟡 Baseline 新近（2024） | 主流新版可用，老环境降级 |
| `Object.groupBy` / `Map.groupBy` | ES2024 | 🟡 新近可用 | 老环境降级为手写 reduce |
| `Array.fromAsync` | ES2024 | 🟡 新近可用 | 渐进增强 |
| 正则 `v` 标志（unicodeSets） | ES2024 | 🟡 新近可用 | 锦上添花 |
| `RegExp.escape` | ES2025 | 🟡 新近可用 | 动态拼正则时用，老环境自行转义 |
| **`Temporal`** | **ES2026** | 🟠 **有限可用**（Safari 未支持，约 65%） | **配 polyfill 用**，纯渐进增强 |

## 权威链接

**标准 / 规范**

- [MDN: `Number`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number) · [`Math`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math) · [`BigInt`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt)
- [MDN: `String`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) · [`RegExp`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp) · [`JSON`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON) · [`Symbol`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol)
- [MDN: `Map`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map) · [`Set`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set) · [`WeakMap`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakMap) · [`WeakRef`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakRef)
- [MDN: `Date`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date) · [`Temporal`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal) · [`Intl`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl)

**指南 / 提案**

- [MDN: Numbers and strings](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Numbers_and_strings) · [Regular expressions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions) · [Keyed collections](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Keyed_collections)
- [TC39 Temporal 提案](https://github.com/tc39/proposal-temporal) · [Temporal 文档站](https://tc39.es/proposal-temporal/docs/) · polyfill [@js-temporal/polyfill](https://www.npmjs.com/package/@js-temporal/polyfill)

**兼容性 / 调试**

- [Baseline 浏览器兼容查询：webstatus.dev](https://webstatus.dev/) · [caniuse.com](https://caniuse.com/)
- [regex101.com](https://regex101.com/)（正则在线测试 / 可视化）

## 相关页

- [入门](./getting-started) · [数值、Math 与 BigInt](./guide-line/number-math-bigint) · [字符串与模板字面量](./guide-line/string-template)
- [正则表达式](./guide-line/regexp) · [Map / Set 与弱引用](./guide-line/map-set-weak)
- [JSON 与 Symbol](./guide-line/json-symbol) · [Date 与 Temporal](./guide-line/date-temporal)
