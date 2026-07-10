---
layout: doc
outline: [2, 3]
---

# 指南 · 基础

> 版本基线 **date-fns 4.x**。本篇把「会用函数」升级到「懂心智」：纯函数 / 不可变模型、token 体系（与 Moment 的差异）、locale 本地化、`Invalid Date` 处理、原生 Date 的固有坑。

## 速查

- **不可变主线**：`addDays`、`setHours` 等转换函数不修改传入的 `Date`，而是返回新实例；原生 `date.setHours()` 仍会原地修改。
- **纯函数边界**：大多数转换与比较函数由显式参数决定；`formatDistanceToNow` / `isToday` 等“现在”函数和 `setDefaultOptions` 会读取或修改外部上下文。
- **格式 token**：date-fns 遵循 Unicode TR#35，日历年与月内日写 `yyyy-MM-dd`；Moment 的 `YYYY` / `DD` 在这里分别表示周编号年 / 年内日。
- **字面量**：固定文字用单引号包裹，连续 `''` 输出一个单引号；未转义拉丁字母会触发 `RangeError`。
- **本地化**：从 `date-fns/locale` 具名导入 locale 并通过 options 传入；默认 en-US，不自动跟随浏览器语言。
- **无效值**：解析失败通常得到 `Invalid Date`，先用 `isValid()` 守卫，再格式化或计算。
- **原生 Date 边界**：构造函数月份从 0 开始，format 的月份按 1–12 输出；date-fns 不会消除 JavaScript Date 的历史语义。

## 一、纯函数 / 不可变心智

date-fns 的核心转换与比较 API 以**纯函数 + 不可变**为主：显式参数相同就得到相同结果，且不修改日期入参。这意味着：

```js
import { addDays, setHours } from "date-fns";

const d = new Date(2024, 0, 1, 9, 0);
const d2 = addDays(d, 5); // 返回新 Date
const d3 = setHours(d, 14); // 又一个新 Date

// d 始终是 2024-01-01 09:00，从未被改动
```

对比 Moment（可变）：`moment().add(1, 'day')` 会**原地改**那个 moment 实例，多处引用同一对象时容易互相干扰。date-fns 没有这个隐患——它根本不持有可变状态。

但“纯函数”不能无限外推：`formatDistanceToNow`、`isToday` 等函数会读取当前时间，`setDefaultOptions()` 会修改全局默认配置。需要可重复测试时固定系统时钟，并优先把 locale、周起始等 options 显式传入。

::: tip 与 React 数据流天然契合
React/Vue 推崇不可变更新。date-fns「输入旧值、返回新值」正好匹配：`setState(prev => addDays(prev, 1))` 不会意外改到旧 state。
:::

⚠️ 注意区分**原生方法**与 date-fns 函数：`date.setHours(14)` 是原生 `Date` 的方法，会**原地修改**并返回时间戳；而 `setHours(date, 14)` 是 date-fns 的纯函数，返回新 Date。二者同名但语义相反，别混用。

## 二、format token 体系（与 Moment 的关键差异）

date-fns 的格式串遵循 **Unicode Technical Standard #35**，与 Moment.js 的 token **不通用**。最该背下来的对照：

| 含义 | date-fns（正确） | Moment 习惯（在 date-fns 里是错的） |
|---|---|---|
| 四位日历年 | `yyyy` | `YYYY`（这是「周编号年」！） |
| 两位年 | `yy` | `YY`（周编号年） |
| 月内日 | `dd` | `DD`（这是「一年中的第几天」！） |

```js
// ❌ 照搬 Moment：format(date, "YYYY-MM-DD")
//    YYYY=周编号年、DD=年内日，年末跨周会得到诡异结果，且默认会告警/抛错

// ✅ date-fns 正确写法：
format(new Date(2024, 1, 11), "yyyy-MM-dd"); //=> '2024-02-11'
```

**为什么 date-fns 要这么设计**：`YYYY`（周编号年）与 `DD`（年内日）是真实存在、ISO 8601 也用到的概念，只是和「日历年 / 月内日」极易混淆。date-fns 默认把它们列为「**受保护 token**」，不开额外选项就拦截，逼你确认意图：

```js
format(new Date(2018, 9, 10), "D", { useAdditionalDayOfYearTokens: true }); //=> '283'
format(date, "YYYY", { useAdditionalWeekYearTokens: true }); // 确实要周编号年时
```

## 三、字面量转义

格式串里的字母都会被当 token。要输出固定文字，用**单引号**包裹（不是 Moment 的方括号 `[]`）：

```js
format(new Date(2024, 1, 11), "yyyy '年' MM '月'"); //=> '2024 年 02 月'
format(new Date(), "h 'o''clock'"); // '' 表示一个真正的单引号 → ...o'clock
```

> 写了未转义的拉丁字母（且不是合法 token）会抛 `RangeError: Format string contains an unescaped latin alphabet character`。

## 四、locale 本地化

date-fns 内置 80+ 语言，但**按需导入**（不自动全量加载，否则破坏 tree-shaking）：

```js
import { format, formatDistance } from "date-fns";
import { zhCN } from "date-fns/locale";

format(new Date(2024, 1, 11), "PPP", { locale: zhCN }); //=> '2024年2月11日'
formatDistance(subDays(new Date(), 3), new Date(), { locale: zhCN, addSuffix: true });
//=> '3 天前'
```

::: tip 导入方式影响 tree-shaking
官方推荐 `import { zhCN } from "date-fns/locale"`（具名），尽量避免 `import zhCN from "date-fns/locale/zh-CN"`（默认/深路径），后者在某些打包配置下可能影响摇树。
:::

不传 `locale` 时，默认是 **en-US**（不会自动跟随系统语言）。想全局改默认语言用 `setDefaultOptions({ locale: zhCN })`。

## 五、Invalid Date 处理

date-fns 的有效性模型：坏输入多数返回 **`Invalid Date`**（一个时间值为 `NaN` 的 Date），而不是抛异常。用 `isValid` 守卫：

```js
import { isValid, parseISO } from "date-fns";

const d = parseISO("not-a-date");
isValid(d); //=> false

if (isValid(d)) {
  // 安全使用
}
```

> `parse` 在格式不匹配、`referenceDate` 无效等情况下也返回 `Invalid Date`。处理用户输入时务必先 `isValid`。

## 六、原生 Date 的固有坑（date-fns 沿用，不替你纠正）

date-fns 直接操作原生 `Date`，所以原生 `Date` 的坑依然存在：

```js
// 构造函数月份是 0-based！
new Date(2024, 1, 11); //=> 2024-02-11（1 是二月，不是一月）

// 但 format 的 MM 是人类习惯的 1-based
format(new Date(2024, 1, 11), "MM"); //=> '02'
```

> 记法：**构造时月份从 0 数，格式化时按人类习惯显示**。日（第三参数）是 1-based。这不是 date-fns 的 bug，是 JavaScript `Date` 的历史设计。

---

进入 [指南 · 进阶](./advanced)：区间 Interval、Duration、fp 子模块、与 Moment/Day.js/Luxon 的选型对比。
