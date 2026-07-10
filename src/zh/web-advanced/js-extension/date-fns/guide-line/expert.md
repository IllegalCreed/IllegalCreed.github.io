---
layout: doc
outline: [2, 3]
---

# 指南 · 专家

> 版本基线 **date-fns 4.x**。深入内核与演进：v2→v3→v4 破坏性变更全梳理、v4 时区 `in` 选项与类型推断、`@date-fns/tz` 机制、`UTCDate`、迁移实战与陷阱。

## 速查

- **版本节奏**：v3 完成 ESM / CJS 双包、扁平结构、具名导出与 TypeScript 重写；v4 增加官方一等时区支持，主要破坏点在类型层。
- **v3 导入迁移**：深路径 CommonJS 默认导出改为具名导出，constants 从 `date-fns/constants` 引入，运行时参数检查更多交给类型系统。
- **v4 时区上下文**：相关函数通过 `{ in: tz('Asia/Tokyo') }` 明确计算时区；`format` 系列从 v4.1 起补齐该能力。
- **类型归一化**：混用原生 `Date`、`TZDate`、`UTCDate`、字符串和时间戳时，显式 `in` 优先；否则首个对象参数决定返回上下文。
- **官方时区包**：`@date-fns/tz` 提供 `TZDate` / `TZDateMini`、`tz`、`tzOffset`、`tzScan`、`tzName`。
- **不要混包名**：官方 `@date-fns/tz` 与第三方 `date-fns-tz` 是不同实现，不是改名或别名。
- **纯 UTC**：`@date-fns/utc` 的 `UTCDate` 让 date-fns 按 UTC 日历规则计算，并尽量保留扩展 Date 类型。
- **迁移高风险点**：Moment token、月份零基、原生可变 setter、命名空间导入、`parse` 的 referenceDate 与跨时区缺少 `in`。

## 一、版本演进与节奏

| 版本 | 时间 | 头条 |
|---|---|---|
| v2.0 | 2019 | 引入 tree-shaking 友好的具名导入、`formatRelative` 等 |
| v3.0 | 2023-12 | **ESM 化大重构**（dual-package、扁平结构、具名导出、弃 IE） |
| v4.0 | 2024-09 | **首次内置一等时区支持**（`@date-fns/tz` + `in` 选项） |
| v4.1 | 2024-09 | 给 `format` 系列补全时区支持 |

> 官方在 v4 说明里点明：v2 与 v3 间隔约**四年**，而 v3→v4 不到**一年**，并承诺今后保持节奏、尽量减少破坏性变更。v4 本身的破坏性变更主要是**类型层面**。

## 二、v3 破坏性变更全梳理（从 v2 升级必读）

v3 是一次彻底的现代化重构，核心 **BREAKING**：

1. **dual-package（ESM + CommonJS）**：导出在 `package.json` 显式声明，ESM 文件改用 `.mjs` 扩展名。
2. **扁平结构**：函数文件直接是 `node_modules/date-fns/add.mjs`，locale 是 `date-fns/locale/enUS.mjs`。
3. **具名导出取代默认导出**：

   ```js
   // v2
   const addDays = require("date-fns/addDays");
   // v3：改为解构
   const { addDays } = require("date-fns/addDays"); // 或从 "date-fns" 顶层解构
   ```

4. **`constants` 移出顶层**：`import { daysInYear } from "date-fns/constants"`（改善 Next.js 等的 modularizeImports 兼容）。
5. **不再校验参数个数 / 不再显式转换参数类型**：交给类型检查器，函数更精简；代价是纯 JS 误用少了运行时拦截。
6. **接受字符串日期**：所有接受日期参数的函数现在也接受字符串（自动规范化）。
7. **Interval 函数不再抛错**：`start` 晚于 `end` 按负向区间处理（详见进阶篇）；`intervalToDuration` 跳过 0 值字段。
8. **`roundToNearestMinutes`**：`nearestTo` < 1 或 > 30 时返回 `Invalid Date`（不再抛错）。
9. **统一 `Math.trunc` 舍入**：`differenceInX` 新增 `roundingMethod` 选项，默认向零截断。
10. **弃 IE、弃 Flow**：拥抱现代 JS / ESM；TypeScript 类型完全重写。
11. **新增 `interval()` 函数**：校验无效日期；要拒绝反向端点并模拟 v2 行为，需传 `{ assertPositive: true }`。

## 三、v4 时区支持深入

v4 的头条：「ten years after its release, date-fns finally gets first-class time zone support」。机制有两层：

### 1) context `in` 选项

所有相关函数新增 `in` 选项，指定计算所在时区；若函数返回日期，结果也在该时区：

```js
import { addDays, startOfDay } from "date-fns";
import { tz } from "@date-fns/tz";

startOfDay(addDays(Date.now(), 5, { in: tz("Asia/Singapore") }));
//=> "2024-09-16T00:00:00.000+08:00"
```

跨时区「同一天」判断是最典型的用例——同一 UTC 时刻在不同时区可能跨日：

```js
import { isSameDay } from "date-fns";
const sg = new Date("2024-03-13T22:00:00+08:00");
const la = new Date("2024-03-13T06:00:00-07:00"); // 同一 UTC 时刻

isSameDay(sg, la, { in: tz("Asia/Singapore") }); //=> true
isSameDay(sg, la, { in: tz("America/New_York") }); //=> false
```

### 2) 混合类型与类型推断

v4 允许函数参数（及 Interval 的 `start`/`end`）是**不同类型**（`TZDate`、`UTCDate`、原生 `Date`、字符串、数字混用），库会归一化后计算，并返回与上下文一致的类型。推断优先级：

- 若传了 `in` 选项 → 用它；
- 否则取**第一个遇到的对象类型**；
- Interval 的 `start` 与 `end` 分开判断，**`start` 优先**。

```js
clamp(Date.now(), {
  start: new TZDate(start, "Asia/Singapore"),
  end: new UTCDate(),
});
//=> TZDate（首参是数字，start 优先于 end）
```

## 四、@date-fns/tz 机制

`@date-fns/tz`（v4 官方时区包）的核心导出：

- **`TZDate`**：扩展自原生 `Date`、携带时区信息的类，能与所有 date-fns 函数协作并保留该时区；`TZDateMini` 是不含格式化器的轻量版。

  ```js
  import { TZDate } from "@date-fns/tz";
  import { addDays } from "date-fns";
  const d = new TZDate(2024, 2, 13, "Asia/Singapore");
  addDays(d, 1).toString(); //=> '... GMT+0800 (Singapore Standard Time)'
  d.withTimeZone("America/New_York"); // 同一时刻换时区表示
  ```

- **`tz(timeZone)`**：上下文提供器，专供 date-fns 函数的 `in` 选项；内部把输入转时间戳并按指定时区构造 `TZDate`。
- 辅助：`tzOffset`（偏移分钟）、`tzScan`（探测 DST 切换）、`tzName`（时区名）。

> **与 `date-fns-tz`（第三方 marnusw 维护）的关系**：是两个不同的包。`date-fns-tz` 在 v4 之前补时区，提供 `formatInTimeZone` / `toZonedTime` / `fromZonedTime`，基于 Intl、不打包时区数据。`@date-fns/tz` 是官方在 v4 推出的「一等公民」方案。二者非改名、非别名，按需择一。

## 五、UTCDate：纯 UTC 计算

需要「就好像本地时区是 UTC」地做计算（避免本地时区干扰），用 `@date-fns/utc` 的 `UTCDate`：

```js
import { UTCDate } from "@date-fns/utc";
import { addHours, startOfDay } from "date-fns";

const d = new UTCDate(2024, 0, 1);
startOfDay(d); // 以 UTC 视角取当天起点
```

> v3 起函数就能检测这类自定义 Date 扩展，按入参构造器返回**同类型**结果，因此 `UTCDate` 与全部函数无缝协作。

## 六、迁移实战与陷阱清单

- **Moment → date-fns**：格式串先改 token（`YYYY`→`yyyy`、`DD`→`dd`）；链式 `.add().format()` 改成函数组合 `format(addDays(d,1), '...')`（或用 `date-fns/fp` 管道）；`moment.utc()` → `UTCDate`；`moment.tz()` → `TZDate` / `in: tz(...)`。
- **v2 → v3**：把 `require('date-fns/x')` 默认导入改解构；`constants` 改从 `date-fns/constants` 导入；依赖运行时参数校验的代码补上 TS 类型。
- **常见陷阱**：
  - 构造函数月份 0-based（`new Date(2024,1,11)` 是二月）；
  - 误用原生 `date.setHours()`（原地改）当成 date-fns 的 `setHours(date, h)`（返新值）；
  - 命名空间导入 `import * as` 破坏 tree-shaking；
  - 忘了 `parse` 必须传第三个 `referenceDate`；
  - 跨时区场景不传 `in` 选项，结果默默用了系统时区。

---

回到 [入门](../getting-started) 复习用法，或查 [参考](../reference) 速览函数与 token。
