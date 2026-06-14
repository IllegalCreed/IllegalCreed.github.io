---
layout: doc
outline: [2, 3]
---

# 指南 · 进阶

> 版本基线 **date-fns 4.x**。把 date-fns 用进真实业务：区间 Interval、Duration 与人类可读时长、`date-fns/fp` 函数式组合、tree-shaking 实操、与 Moment/Day.js/Luxon 的选型对比。

## 一、区间 Interval

date-fns 用普通对象 `{ start, end }` 表示区间，配套一组函数：

```js
import { isWithinInterval, areIntervalsOverlapping, eachDayOfInterval } from "date-fns";

const interval = { start: new Date(2024, 0, 1), end: new Date(2024, 0, 7) };

// 是否在区间内（默认含端点）
isWithinInterval(new Date(2024, 0, 3), interval); //=> true
isWithinInterval(new Date(2024, 0, 1), interval); //=> true（等于 start 也算）

// 两区间是否重叠（inclusive 控制是否把「相切」算重叠）
areIntervalsOverlapping(i1, i2, { inclusive: true });

// 生成区间内每一天（做日历、按天聚合）
eachDayOfInterval({ start: new Date(2024, 0, 1), end: new Date(2024, 0, 5) });
//=> [1/1, 1/2, 1/3, 1/4, 1/5]
```

同族 `eachXOfInterval`：`eachHourOfInterval`、`eachWeekOfInterval`、`eachMonthOfInterval`、`eachYearOfInterval`、`eachWeekendOfInterval`，部分支持 `step` 选项。

::: tip v3 起区间不再抛错
v3 起，接受 Interval 的函数对「start 晚于 end」的处理改为**归一化**而非抛错：`eachDayOfInterval` 返回**反向数组**；`isWithinInterval` 把 `{start:a,end:b}` 视同 `{start:b,end:a}`；端点为 `Invalid Date` 时返回 `false` / 空数组 / `0`。想要显式校验区间，用新增的 `interval(start, end)`（非法时抛错）。
:::

## 二、Duration 与人类可读时长

`Duration` 是 `{ years, months, days, hours, minutes, seconds }` 形态的对象：

```js
import { intervalToDuration, formatDuration } from "date-fns";

const dur = intervalToDuration({
  start: new Date(2024, 0, 1),
  end: new Date(2024, 2, 6),
});
//=> { months: 2, days: 5 }（v3 起跳过为 0 的字段，更紧凑）

formatDuration(dur); //=> '2 months 5 days'
formatDuration(dur, { delimiter: ", ", locale: zhCN }); //=> 本地化 + 自定义分隔
```

> v3 起：`intervalToDuration` 对负向区间返回负 duration；端点无效返回空对象 `{}`。

## 三、相对时间的三种函数

```js
import { formatDistance, formatDistanceToNow, intlFormatDistance } from "date-fns";

// 1) 两个日期之间
formatDistance(past, new Date(), { addSuffix: true }); //=> '3 days ago'

// 2) 以「现在」为基准的便捷版
formatDistanceToNow(past, { addSuffix: true }); //=> '3 days ago'

// 3) 基于内置 Intl.RelativeTimeFormat，无需导入 date-fns locale
intlFormatDistance(past, new Date(), { locale: "zh" }); //=> '3天前'
```

> `intlFormatDistance`（v2.29 引入）借运行时 `Intl.RelativeTimeFormat` 做本地化，省去 locale 包导入；`formatDistance` 则用 date-fns 自带的 locale 数据，需显式传 `locale`。严格版 `formatDistanceStrict` / `formatDistanceToNowStrict` 不取整到最大单位。

## 四、date-fns/fp：函数式组合

`date-fns/fp` 提供同名函数的**柯里化 + 参数重排（数据放最后）** 变体，适合 point-free 组合与管道：

```js
import { addYears, formatWithOptions } from "date-fns/fp";
import { zhCN } from "date-fns/locale";

const addFiveYears = addYears(5); // 柯里化：先给数量
addFiveYears(new Date(2024, 0, 1)); //=> 2029-01-01

// fp 版 format 叫 formatWithOptions（选项位置不同）
const toCnDate = formatWithOptions({ locale: zhCN }, "yyyy年MM月dd日");
toCnDate(new Date(2024, 1, 11)); //=> '2024年02月11日'
```

> fp 版同样是纯函数、不可变，只是调用风格变成「先配置、后喂数据」，便于 `pipe`/`compose`。

## 五、tree-shaking 实操

```js
// ✅ 具名导入：打包器只保留 format + addDays
import { format, addDays } from "date-fns";

// ❌ 命名空间导入：打包器难以判定用到哪些，可能整库打进
import * as dateFns from "date-fns";
```

生效条件（两端配合）：
- **库侧**：date-fns 提供 ESM、独立具名导出（v3 起 dual-package，ESM 用 `.mjs`，`package.json` 显式声明 exports）；
- **使用侧**：用支持静态分析的打包器（Rollup / webpack / Vite / esbuild）+ **具名导入**。

> tree-shaking 是**构建期**的死代码消除，不是运行时按需加载。纯 CJS（`require`）或命名空间导入都会削弱效果。

## 六、选型对比：date-fns vs Moment / Day.js / Luxon

| 维度 | date-fns | Moment | Day.js | Luxon |
|---|---|---|---|---|
| API 形态 | **纯函数**（函数组合） | 链式 OO（可变） | 链式 OO（不可变） | 链式 OO（不可变） |
| 操作对象 | 原生 `Date` | Moment 对象 | Dayjs 对象 | DateTime 对象 |
| tree-shaking | **极佳**（按函数） | 差（单体） | 较好（核心小+插件） | 一般 |
| 体积 | 随用量增长 | 大 | **最小**（~2KB 核心） | 中等 |
| 时区 | `@date-fns/tz`（v4） | moment-timezone | utc/timezone 插件 | **内置**（基于 Intl） |
| 维护状态 | 活跃（v4/v5 alpha） | **维护模式** | 活跃 | 活跃（Moment labs） |
| token | Unicode TR#35（`yyyy`） | 自有（`YYYY`） | 类 Moment | Unicode（`yyyy`） |

选型建议：
- **追求最小包体 + 链式顺手** → Day.js；
- **重时区 / 富类型（Duration/Interval）+ 接受 OO** → Luxon；
- **函数式 + 极致 tree-shaking + 直接用原生 Date** → date-fns；
- **老项目仍在用 Moment** → 新代码迁出（Moment 已停止新增特性）。

---

进入 [指南 · 专家](./expert)：v2→v3→v4 破坏性变更全梳理、v4 时区 `in` 选项深入、`@date-fns/tz` 内部、迁移实战。
