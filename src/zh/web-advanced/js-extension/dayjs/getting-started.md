---
layout: doc
outline: [2, 3]
---

# 入门

> 本篇带你从安装到「解析 → 格式化 → 增减 → 查询」跑通 Day.js 的主线。版本基线 **Day.js 1.11.x**。对比对象：Moment.js（可变、体积大）、Luxon、date-fns。

## 速查

- 安装：`npm install dayjs`
- 导入：`import dayjs from 'dayjs'`（默认导出；CJS 用 `const dayjs = require('dayjs')`）
- 现在：`dayjs()` → 当前时刻（本地时区）
- 解析：`dayjs('2024-01-15')`（ISO）｜`dayjs(1705276800000)`（毫秒戳）｜`dayjs.unix(1705276800)`（秒戳）
- 格式化：`dayjs().format('YYYY-MM-DD HH:mm:ss')`；无模板 → ISO 8601 字符串
- 增减：`dayjs().add(1, 'day')` ｜ `dayjs().subtract(2, 'month')`（**返回新实例**）
- 查询：`a.isBefore(b)` ｜ `a.isAfter(b)` ｜ `a.isSame(b, 'year')`（核心内置）
- 时间戳：`.valueOf()`（毫秒）｜`.unix()`（秒）｜`.toDate()`（原生 Date）
- ⚠️ **不可变**：所有修改型操作返回新实例，原对象不变
- ⚠️ UTC / 时区 / 相对时间 / duration / 自定义解析等都是**插件**，用到要 `dayjs.extend()`

## 一、Day.js 是什么

官方一句话定位：「**a 2KB immutable date-time library alternative to Moment.js with the same modern API**」。三个关键点：

1. **轻**：核心约 2KB，「Less JavaScript to download, parse and execute」。
2. **不可变**：「All API operations that change the Day.js object will return a new instance instead.」——任何会改变对象的操作都返回新实例。
3. **像 Moment**：API 与 Moment 高度兼容，从 Moment 迁移几乎零学习成本。

> 边界提醒：核心**只内置英文 locale 和基础能力**。UTC、时区、相对时间等都在插件里，本篇主线只用核心，插件在[指南](./guide-line/base)展开。

## 二、安装与第一行代码

```bash
npm install dayjs
```

```js
import dayjs from 'dayjs' // ESM
// const dayjs = require('dayjs') // CommonJS

dayjs()                       // 当前日期时间（本地时区）
dayjs('2024-01-15')           // 解析 ISO 字符串
dayjs('2024-01-15').format()  // → '2024-01-15T00:00:00+08:00'（默认 ISO 8601）
```

> `dayjs()` 返回的是 **Day.js 包装对象**，不是原生 `Date`；要拿原生 Date 用 `.toDate()`。

## 三、解析：把各种输入变成 Day.js 对象

```js
dayjs()                       // 现在
dayjs('2024-01-15T10:30:00')  // ISO 8601 字符串（核心可靠支持）
dayjs(new Date())             // 原生 Date 对象
dayjs(1705276800000)          // Unix 毫秒时间戳（同 new Date(ms)）
dayjs.unix(1705276800)        // Unix 秒时间戳（内部 × 1000）
dayjs('2024-01-15').clone()   // 克隆；dayjs(已有实例) 也会克隆
```

::: warning 秒戳 vs 毫秒戳
直接 `dayjs(数字)` 按**毫秒**解析。手上是**秒**级时间戳必须用 `dayjs.unix(秒)`，否则会差 1000 倍，落到 1970 年附近。
:::

> 解析**非 ISO** 格式（如 `'15/01/2024'`）核心不可靠，需 CustomParseFormat 插件，见[基础篇](./guide-line/base)。

## 四、格式化：format

```js
dayjs().format()                          // ISO 8601，如 '2024-01-15T10:30:00+08:00'
dayjs('2024-01-15').format('YYYY-MM-DD')  // '2024-01-15'
dayjs().format('YYYY年MM月DD日 HH:mm:ss')  // 中文夹字面文本
dayjs().format('[Year] YYYY')             // 方括号转义 → 'Year 2024'
```

常用 token（与 Moment 一致）：

| token | 含义 | 示例 |
|---|---|---|
| `YYYY` / `YY` | 四位 / 两位年 | 2024 / 24 |
| `MM` / `M` | 月（补零 / 不补零） | 01-12 / 1-12 |
| `DD` / `D` | 日（补零 / 不补零） | 01-31 / 1-31 |
| `HH` / `H` | 24 时制（补零 / 不补零） | 00-23 / 0-23 |
| `hh` / `h` | 12 时制（需配 `A`/`a`） | 01-12 / 1-12 |
| `mm` / `ss` | 分 / 秒（补零） | 00-59 |
| `dddd` / `ddd` / `dd` | 星期全称 / 缩写 | Sunday / Sun / Su |
| `A` / `a` | 上下午 | AM PM / am pm |

> 想要本地化长日期 `L`/`LL`/`LLL` 需 LocalizedFormat 插件；`Q`/`Do`/`X`/`x` 需 AdvancedFormat 插件。

## 五、增减与取整（不可变）

```js
const d = dayjs('2024-01-15')
d.add(1, 'day')           // 新实例：2024-01-16；d 仍是 01-15
d.subtract(2, 'month')    // 新实例：2023-11-15
d.startOf('month')        // 当月 1 号 00:00:00.000
d.endOf('day')            // 当天 23:59:59.999
// 链式：每步返回新实例，安全
dayjs('2019-01-25').add(1, 'day').subtract(1, 'year').year(2009).format('YYYY-MM-DD')
// → '2009-01-26'
```

支持单位：`year/y`、`month/M`、`week/w`、`day/d`、`hour/h`、`minute/m`、`second/s`、`millisecond/ms`。

## 六、取值 / 设值

```js
dayjs('2024-01-15').year()    // 2024
dayjs('2024-01-15').month()   // 0 —— 月份从 0 开始（一月=0）！
dayjs('2024-01-15').date()    // 15 —— 月中第几天
dayjs('2024-01-15').day()     // 1 —— 星期几（0=周日, 6=周六）
dayjs().hour(9).minute(30)    // 设值，返回新实例
dayjs().set('hour', 9)        // 通用设值器，等价于 .hour(9)
```

::: warning 两个易错点
① `month()` **从 0 开始**（一月返回 0）。② `day()` 是**星期几**（0=周日），别和 `date()`（月中第几天）混淆。
:::

## 七、查询与差值

```js
const a = dayjs('2024-01-15'), b = dayjs('2024-06-01')
a.isBefore(b)            // true（核心内置）
a.isAfter(b)             // false
a.isSame(b, 'year')      // true —— 第二参指定比较粒度，同年即视为相同
a.isValid()              // true；解析失败的对象返回 false

b.diff(a)                // 默认毫秒差
b.diff(a, 'day')         // 相差天数（整数截断）
b.diff(a, 'month', true) // 第三参 true → 浮点月数
```

> `isBetween`、`isSameOrBefore`、`isSameOrAfter`、`isToday`/`isYesterday`/`isTomorrow` 都需**插件**，见[基础篇](./guide-line/base)。

---

掌握主线后，进入 [指南 · 基础](./guide-line/base)：不可变原理、插件机制 `extend`、UTC 与本地化、常用查询插件。
