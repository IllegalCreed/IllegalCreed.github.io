---
layout: doc
outline: [2, 3]
---

# 指南 · 进阶

> 版本基线 **Day.js 1.11.x**。把 Day.js 用进真实项目：自定义格式解析、IANA 时区、Duration 时长、quarter/week 插件、对象/数组解析、从 Moment 迁移。

## 一、CustomParseFormat：解析非 ISO 字符串

核心**只可靠解析 ISO 8601**。要按自定义格式解析（如 `DD/MM/YYYY`），用 CustomParseFormat 插件：

```js
import customParseFormat from 'dayjs/plugin/customParseFormat'
dayjs.extend(customParseFormat)

dayjs('15/01/2024', 'DD/MM/YYYY')               // 按 token 解析
dayjs('05/02/69 1:02:03 PM -05:00', 'MM/DD/YY H:mm:ss A Z')
dayjs('2018 一月 15', 'YYYY MMMM DD', 'zh-cn')   // 配 locale 解析本地化月名
dayjs('1970-00-00', 'YYYY-MM-DD', true)          // 第三参 true → 严格模式
```

> 严格模式（strict）要求输入与格式**完全匹配**，否则 `isValid()` 为 false。处理用户输入时强烈建议「自定义格式 + 严格模式 + isValid 校验」三件套。

## 二、Timezone：IANA 时区（依赖 UTC）

Timezone 插件**依赖 UTC 插件**，两个都要 extend；它**不打包时区数据**，底层用宿主的 `Intl.DateTimeFormat`：

```js
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
dayjs.extend(utc)
dayjs.extend(timezone)

dayjs.tz('2024-01-15 10:00', 'Asia/Shanghai')  // 按该时区解析字符串
dayjs('2024-01-15T10:00:00Z').tz('America/New_York') // 把已有时刻换算到纽约
dayjs.tz.guess()                                // 推测当前环境时区，如 'Asia/Shanghai'
dayjs.tz.setDefault('America/New_York')         // 设默认时区
```

::: warning dayjs.tz(str, zone) ≠ dayjs(str).tz(zone)
- `dayjs.tz(str, zone)`：把字符串**按该时区解释**（「这串就是纽约时间」）。
- `dayjs(str).tz(zone)`：先按**本地/默认时区**解析，再**换算显示**为目标时区。

两者代表的**绝对时刻可能不同**。要「保持墙上时间不变地改时区」，用 `.tz(zone, true)` 的 keepLocalTime 参数。
:::

## 三、Duration：时长

`dayjs.duration()` 由 Duration 插件提供（注意：`.diff()` 返回数字，**不是** Duration 对象）：

```js
import duration from 'dayjs/plugin/duration'
import relativeTime from 'dayjs/plugin/relativeTime'
dayjs.extend(duration)
dayjs.extend(relativeTime) // humanize 依赖它

dayjs.duration(2, 'days')          // 2 天
dayjs.duration({ days: 2, hours: 3 })
dayjs.duration('P1Y2M3D')          // ISO 8601 时长串：1 年 2 月 3 天
dayjs.duration(90, 'minutes').asHours() // 1.5
dayjs.duration(3, 'days').humanize()    // '3 days'（需 relativeTime）
```

## 四、quarter / week / dayOfYear 等

这些方法**各自是插件**，按需 extend：

```js
import quarterOfYear from 'dayjs/plugin/quarterOfYear'
import weekOfYear from 'dayjs/plugin/weekOfYear'
import isoWeek from 'dayjs/plugin/isoWeek'
import dayOfYear from 'dayjs/plugin/dayOfYear'
dayjs.extend(quarterOfYear)
dayjs.extend(weekOfYear)
dayjs.extend(isoWeek)
dayjs.extend(dayOfYear)

dayjs('2024-05-01').quarter()    // 2（季度）
dayjs('2024-05-01').week()       // 一年第几周
dayjs('2024-05-01').isoWeek()    // ISO 周
dayjs('2024-05-01').dayOfYear()  // 一年第几天
```

> 不装对应插件时直接调用会抛 `not a function`。

## 五、对象 / 数组解析（ObjectSupport / ArraySupport）

用对象构造日期需 ObjectSupport 插件（核心不支持，会得到 Invalid Date）：

```js
import objectSupport from 'dayjs/plugin/objectSupport'
dayjs.extend(objectSupport)

dayjs({ year: 2024, month: 0, day: 15 })  // month 仍是零基！
dayjs().set({ hour: 9, minute: 30 })
dayjs().add({ months: 1, days: 2 })
```

> 数组解析 `dayjs([2024, 0, 15])` 由 ArraySupport 插件增强；`.toArray()`/`.toObject()` 输出则分别由 ToArray/ToObject 插件提供。

## 六、从 Moment.js 迁移

| 维度 | Moment | Day.js |
|---|---|---|
| 可变性 | **可变**（add 就地改） | **不可变**（add 返回新实例） |
| 体积 | 大（含全部能力 + locale） | ~2KB 核心 + 按需插件 |
| API / token | `YYYY-MM-DD` | **基本一致** |
| 月份 | 零基 | 零基（一致） |
| 时区 | moment-timezone（打包数据） | Timezone 插件（靠 Intl） |

::: warning 迁移头号陷阱：可变 → 不可变
Moment 代码常依赖就地修改的副作用：

```js
const d = moment(); d.add(1, 'day'); use(d)  // Moment：d 已被改
```

照搬到 Day.js 会失败（`d` 不变）。必须改成**重新赋值**：

```js
let d = dayjs(); d = d.add(1, 'day'); use(d)  // Day.js 正确写法
```
:::

---

进入 [指南 · 专家](./expert)：自定义插件开发、badMutable 取舍、updateLocale 定制、时区在 SSR 的 ICU 坑、体积优化清单。
