---
layout: doc
outline: [2, 3]
---

# 入门

> 本篇带你上手 **Luxon 3.x** 的核心：创建 `DateTime`、不可变地修改、解析与格式化、时区与本地化、`Duration` 与 `Interval` 速览。对比对象：Moment（不可变 vs 可变、token 差异）、Day.js / date-fns（选型定位）。

## 速查

- 安装：`npm install luxon`（包名就是 `luxon`）
- 引入：`import { DateTime, Duration, Interval, Info, Settings } from "luxon"`（ESM 具名导入）
- 当前时刻：`DateTime.now()`（等价无参 `DateTime.local()`，更清楚）
- 取字段：**getter 属性** `dt.year` / `dt.month` / `dt.day`（不是 `dt.year()`）
- 解析 ISO：`DateTime.fromISO("2024-05-15T09:30")`
- 给人看：`dt.toLocaleString(DateTime.DATE_FULL)` + `dt.setLocale("zh")`
- 给机器：`dt.toISO()` / `dt.toISODate()`
- 自定义格式：`dt.toFormat("yyyy-MM-dd")`（注意 token 与 Moment 不同）
- 核心认知：**所有类型不可变**——`plus`/`set` 返回新实例，原对象不变
- ⚠️ **时区/i18n 依赖宿主 Intl**，不打包 tz/locale 数据
- ⚠️ 月份 **1-based**（`5` = 五月），与原生 `Date` 的 0-based 不同

## 一、Luxon 是什么

官方定位：一个处理 JS 日期时间的库，主打**不可变类型**、**明确 API**，并**基于原生 Intl** 提供时区与本地化。它由 Moment 维护者 Isaac Cambron 重写，是 Moment 的现代继任者。三个关键认知：

1. **不可变**：「Luxon objects are immutable. That means that you can't alter them in place, just create altered copies.」
2. **Intl 驱动**：时区与 i18n 复用宿主的 `Intl`（底层 ICU），库不打包 tz/locale 数据。
3. **富类型**：`DateTime`（时刻）、`Duration`（时长）、`Interval`（区间）各司其职。

> 选型边界：以极小体积著称的是 **Day.js**；纯函数式、操作原生 `Date`、可极致 tree-shaking 的是 **date-fns**。Luxon 走的是「面向对象 + 不可变 + 富功能」路线。

## 二、创建 DateTime

```ts
import { DateTime } from "luxon";

DateTime.now();                          // 当前时刻（系统本地时区）
DateTime.local(2024, 5, 15, 8, 30);      // 本地时区，月份 1-based（5=五月）
DateTime.utc(2024, 5, 15, 8, 30);        // UTC 时区，zoneName 为 'UTC'
DateTime.fromObject(
  { year: 2024, month: 5, day: 15, hour: 12 },
  { zone: "America/Los_Angeles" }
);
DateTime.fromISO("2024-05-15");          // => 2024-05-15 午夜
DateTime.fromISO("2024-05-15T08:30:00"); // => 2024-05-15 08:30
```

> ⚠️ Luxon **不鼓励 `new DateTime(...)`**，一律用工厂方法（`now`/`local`/`utc`/`fromXxx`）。

## 三、访问字段：用 getter，不是方法

这是与 Moment 最直观的差异。文档原话：「Luxon uses getters instead of accessor methods, so `dateTime.year` instead of `dateTime.year()`」。

```ts
const dt = DateTime.now();
dt.year;     // 2024（属性，不是 dt.year()）
dt.month;    // 5（1-based）
dt.day;      // 15
dt.hour;     // 8
dt.weekday;  // 1~7（周一=1，ISO）
dt.zoneName; // 'America/New_York'
```

## 四、不可变地修改

```ts
const d1 = DateTime.now();
const d2 = d1.plus({ hours: 1 });
d1 === d2;            // false —— plus 返回新实例
d1.set({ hour: 3 }).hour; // 3，而 d1 本身不变
```

`set` 接受对象一次改多个字段；`plus`/`minus` 做加减；它们**永远返回新对象**。

## 五、解析：按格式各就各位

Luxon 不提供「万能 parse」，而是按格式分方法：

```ts
DateTime.fromISO("2024-05-15T09:24:15");        // ISO 8601（宽松）
DateTime.fromRFC2822("Tue, 01 Nov 2016 13:23:12 +0630");
DateTime.fromHTTP("Sun, 06 Nov 1994 08:49:37 GMT");
DateTime.fromSQL("2024-05-15 09:24:15");
DateTime.fromMillis(1542674993410);
DateTime.fromSeconds(1542674993);
DateTime.fromJSDate(new Date(), { zone: "America/New_York" }); // 原生 Date → DateTime
```

人类输入的自定义格式用 `fromFormat`（**严格按 token**）：

```ts
DateTime.fromFormat("May 25 1982", "LLLL dd yyyy");
DateTime.fromFormat("mai 25 1982", "LLLL dd yyyy", { locale: "fr" });
```

> 对位 Moment：Moment 解析宽松，Luxon「parsers are very strict」。给程序读的数据请用 ISO，别依赖宽松解析。

## 六、格式化：机器看 ISO，人类看 toLocaleString

文档铁律：「If you intend for a computer to read the string, prefer ISO 8601. If a human will read it, prefer `toLocaleString`.」

```ts
// 机器可读：接口 / 存储 / 传输
dt.toISO();        // '2024-05-15T11:32:00.000-04:00'
dt.toISODate();    // '2024-05-15'
dt.toISOTime();    // '11:32:00.000-04:00'

// 人类可读：本地化
dt.toLocaleString();                       // '5/15/2024'（默认）
dt.toLocaleString(DateTime.DATE_FULL);     // 'May 15, 2024'
dt.setLocale("fr").toLocaleString(DateTime.DATE_FULL); // '15 mai 2024'

// 自定义 token（仅在确需时）
dt.toFormat("yyyy-MM-dd");                 // '2024-05-15'
dt.toFormat("HH 'hours and' mm 'minutes'"); // 单引号转义字面量
```

> ⚠️ `toFormat` 的 token 与 Moment **不通用**：Luxon 年份 `yyyy`、日 `dd`（小写）；Moment 是 `YYYY`/`DD`（大写）。且 `toFormat`/`fromFormat` **默认回退 en-US**，要非英文须显式 `setLocale`。

## 七、时区：复用原生 Intl

```ts
const local = DateTime.local(2024, 5, 15, 12);
local.zoneName;                       // 'America/New_York'

const tokyo = local.setZone("Asia/Tokyo");  // 同一时刻，换展示时区
local.toMillis() === tokyo.toMillis();      // true（绝对时刻不变）

local.setZone("Asia/Tokyo", { keepLocalTime: true }); // 保持钟点，时间戳改变
local.toUTC();                        // 转 UTC
DateTime.utc(2024, 5, 15);            // 直接在 UTC 构造
```

> 因为依赖 Intl，能用哪些时区取决于环境。不支持的时区会得到无效 DateTime（`invalidReason` 为 `'unsupported zone'`）。全局默认时区用 `Settings.defaultZone`。

## 八、Duration 与 Interval 速览

```ts
import { Duration, Interval, DateTime } from "luxon";

// Duration：抽象时长（无锚点）
const dur = Duration.fromObject({ hours: 2, minutes: 7 });
dur.as("seconds"); // 7620（数字）
dur.toISO();       // 'PT2H7M'
DateTime.now().plus(dur);

// Interval：带起止点的区间
const i = Interval.fromDateTimes(DateTime.now(), DateTime.local(2030, 1, 1));
i.contains(DateTime.local(2027));     // true
i.length("days");                     // 区间天数（每次查询重算）
i.splitBy({ months: 1 });             // 按月切片 → Interval[]
```

---

掌握上手后，进入 [指南 · 基础](./guide-line/base)：不可变、日历数学 vs 时间数学、`startOf`/`endOf`、`diff` 与 `Duration`。
