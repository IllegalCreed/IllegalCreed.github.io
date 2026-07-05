---
layout: doc
outline: [2, 3]
---

# JS 中的 JSON API：parse / stringify 全解与坑

> 基于 RFC 8259 / ECMA-404 · JSON Schema 2020-12 · 核于 2026-07

## 速查

- **`JSON.stringify(value, replacer?, space?)`**：值 → JSON 文本。`replacer` = 函数（转换/过滤）或**字符串数组（键白名单）**；`space` = 缩进空格数（≤10）或缩进字符串。
- **`JSON.parse(text, reviver?)`**：文本 → 值。`reviver(key, value)` 自底向上转换；**返回 `undefined` = 删除该属性**。
- **`toJSON()` 钩子**：值若有 `toJSON()`，stringify 先调用它再序列化其返回值。`Date.prototype.toJSON` → ISO 字符串。
- ⚠️ **`undefined` / 函数 / Symbol**：在**对象属性**里 → **整个属性被忽略**；在**数组元素**里 → 转成 **`null`**；作为**顶层值** → `stringify` 返回**值 `undefined`**（非字符串）。
- ⚠️ **`NaN` / `Infinity` / `-Infinity`** → 序列化成 **`null`**（静默丢失）。
- ⚠️ **循环引用** → 抛 **`TypeError`**（Converting circular structure to JSON）。
- ⚠️ **`BigInt`** → `stringify` 抛 **`TypeError`**（不支持）；需先 `toString()` 或用 replacer。
- ⚠️ **大整数精度**：`parse` 超过 2^53−1 的裸数字**静默丢精度**；reviver **救不回**（进 reviver 时已是 number）→ 用 `json-bigint`/`lossless-json` 或 reviver 的 `context.source` 在文本层面处理。
- ⚠️ **`Date` 往返**：`stringify` → ISO 字符串；`parse` **不还原**成 `Date`，需 reviver 手动 `new Date()`。
- **`-0`**：`stringify(-0)` → `"0"`（丢符号）；`parse('-0')` → `-0`（保号）。
- **`JSON.parse` 严格**：单引号、尾逗号、注释、无引号键 → 全部抛 `SyntaxError`；**别用 `eval`** 解析不可信数据。

## 一、JSON.stringify：三个参数

```js
JSON.stringify(value, replacer, space)
```

### space：美化缩进

第三参 `space` 控制输出缩进：传数字 N（最多 10）= 每层 N 个空格；传字符串 = 用它做缩进符：

```js
JSON.stringify({ a: 1, b: 2 }, null, 2);
// {
//   "a": 1,
//   "b": 2
// }
JSON.stringify({ a: 1 }, null, "\t"); // 用制表符缩进
```

### replacer：函数或数组

`replacer` 有两种形态：

```js
// 形态一：字符串数组 = 键白名单，只保留列出的属性
JSON.stringify({ id: 1, name: "Ada", secret: "x" }, ["id", "name"]);
// '{"id":1,"name":"Ada"}'

// 形态二：函数 (key, value) => newValue，返回 undefined 省略该属性（常用于脱敏）
JSON.stringify(user, (key, value) =>
  key === "password" ? undefined : value
);
```

::: tip 函数 replacer 的首次调用
函数 replacer 首次被调用时 `key` 是空字符串 `""`、`value` 是被包裹的整个对象——如果你在里面无条件转换，别忘了处理这个根节点。
:::

### toJSON()：自定义序列化

若被序列化的值有 `toJSON()` 方法，`stringify` 会**先调用它**，再序列化它的返回值。这是 `Date` 变成 ISO 字符串的原因，也是自定义对象控制输出的钩子：

```js
class Money {
  constructor(cents) { this.cents = cents; }
  toJSON() { return (this.cents / 100).toFixed(2); }
}
JSON.stringify({ price: new Money(1999) }); // '{"price":"19.99"}'
```

## 二、值丢失的三张脸：undefined / 函数 / Symbol

`undefined`、函数、Symbol 都不是 JSON 合法值。它们的处理**取决于所处位置**——这是高频考点：

```js
// 对象属性：整个属性被忽略
JSON.stringify({ a: undefined, b: () => {}, c: Symbol(), d: 1 });
// '{"d":1}'

// 数组元素：转成 null（保持索引/长度）
JSON.stringify([1, undefined, () => {}, 4]);
// '[1,null,null,4]'

// 顶层值：返回「值 undefined」本身，不是字符串
JSON.stringify(undefined);   // undefined  ← 注意不是 "undefined"
JSON.stringify(() => {});    // undefined
```

| 位置 | `undefined` / 函数 / Symbol 的结果 |
| --- | --- |
| 对象属性值 | 整个属性被**忽略** |
| 数组元素 | 转成 **`null`** |
| 顶层值 | `stringify` 返回**值 `undefined`** |

::: warning 顶层 undefined 的连锁坑
`JSON.stringify(maybeUndefined)` 可能返回 `undefined` 而非字符串。若直接 `fs.writeFileSync(path, result)` 或 `res.send(result)`，会写入/发送字面的 `undefined` 甚至报错。序列化结果应先判空。
:::

## 三、特殊数值：NaN / Infinity → null

`NaN`、`Infinity`、`-Infinity` 不是合法 JSON 数值，`stringify` 会静默把它们转成 `null`：

```js
JSON.stringify({ a: NaN, b: Infinity, c: -Infinity });
// '{"a":null,"b":null,"c":null}'
```

往返序列化会**悄悄丢失**这些值，排查「怎么变成 null 了」时要想到这一层。

## 四、循环引用 → TypeError

JSON 是**树**结构，无法表达图/环。遇到循环引用直接抛错：

```js
const a = {}; a.self = a;
JSON.stringify(a);
// TypeError: Converting circular structure to JSON
```

解法：用 replacer 剪掉已访问过的引用（`WeakSet` 记录）、序列化前做去环、或用支持循环的库（如 `flatted`）。

## 五、BigInt 与大整数精度

### BigInt 直接抛错

```js
JSON.stringify({ big: 10n });
// TypeError: Do not know how to serialize a BigInt
```

必须自己处理——转字符串或用 replacer：

```js
JSON.stringify({ big: 10n }, (k, v) =>
  typeof v === "bigint" ? v.toString() : v
);
// '{"big":"10"}'
```

### parse 阶段的精度丢失

关键陷阱：`JSON.parse` 的 **reviver 救不回精度**——进入 reviver 时值**已经**是被解析成的 `number`，精度早丢了：

```js
JSON.parse('{"id": 9007199254740993}').id; // 9007199254740992 ← 已失真
```

正确方向是**在文本层面接管数值**：

- 用专用解析库：`json-bigint`、`lossless-json`（把大数解析成 `BigInt` 或字符串）。
- 用较新引擎为 reviver 提供的 `context.source`（原始源文本片段），在它变成 number 前拿到原文。
- 从源头设计：**大整数一律用 JSON 字符串承载**（`{"orderId": "1234567890123456789"}`），这是跨端最稳妥的做法。

## 六、Date 的往返

JSON 没有日期类型。`Date` 序列化时经 `toJSON()` 变成 ISO 字符串；`parse` 时无从得知它原本是日期，只当普通字符串还原：

```js
const s = JSON.stringify({ t: new Date("2026-07-05") });
// '{"t":"2026-07-05T00:00:00.000Z"}'
JSON.parse(s).t; // 字符串，不是 Date

// 用 reviver 手动还原
JSON.parse(s, (key, value) =>
  key === "t" ? new Date(value) : value
);
```

## 七、-0 与解析严格性

```js
JSON.stringify(-0);   // '0'   ← 负号丢失
JSON.parse('-0');     // -0    ← Object.is(_, -0) === true

// JSON.parse 是严格解析器
JSON.parse("{ 'a': 1 }"); // SyntaxError（单引号非法）
JSON.parse('{"a":1,}');   // SyntaxError（尾逗号非法）
```

::: danger 永远不要用 eval 解析 JSON
`eval('(' + text + ')')` 会执行任意代码，解析不可信数据等于开后门。始终用 `JSON.parse`。
:::

---

原生 API 与坑吃透后，进入 [变体：JSON5 / JSONC / NDJSON](./variants)：当 JSON 不够用时，生态用哪些超集/衍生格式补位。
