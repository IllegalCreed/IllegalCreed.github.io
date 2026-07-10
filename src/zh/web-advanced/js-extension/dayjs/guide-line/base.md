---
layout: doc
outline: [2, 3]
---

# 指南 · 基础

> 版本基线 **Day.js 1.11.x**。本篇把「会用」升级到「懂机制」：不可变原理、插件系统 `extend`、UTC 模式、本地化 locale、常用查询/格式化插件。

## 速查

- **不可变**：`add`、`subtract`、`set`、`startOf` 等修改型 API 返回新实例；原对象保持不变，迁移 Moment 时要重新赋值。
- **插件启用**：只 import 不生效，必须 `dayjs.extend(plugin)`；插件会修改全局 Day.js 工厂，通常在应用入口集中挂载。
- **UTC**：extend `utc` 后可用 `dayjs.utc()`、`.utc()`、`.local()` 与 `.isUTC()`；核心 `.utcOffset()` 只读写固定偏移，不代表 IANA 时区。
- **IANA 时区**：核心与 UTC 插件只处理本地 / UTC / 偏移；地区时区需要依赖 UTC 的 timezone 插件。
- **locale**：默认仅英文；先导入 `dayjs/locale/xx`，再全局 `dayjs.locale()` 或实例 `.locale()`。
- **格式化插件**：`L` / `LL` 等来自 LocalizedFormat，`Q` / `Do` / `X` / `x` 来自 AdvancedFormat。
- **查询插件**：核心只有 `isBefore` / `isAfter` / `isSame`；区间、含等比较、闰年和相对时间均按需 extend。

## 一、不可变（Immutable）：Day.js 的地基

官方原文：**「All API operations that change the Day.js object in some way will return a new instance of it.」**

也就是说，`add`/`subtract`/`set`/`startOf`/`year(value)` 等任何「修改型」操作都**不动原对象**，而是返回一个**新实例**：

```js
const a = dayjs('2024-01-15')
const b = a.add(1, 'day')
a.format('YYYY-MM-DD') // '2024-01-15'（原对象没变）
b.format('YYYY-MM-DD') // '2024-01-16'
a === b                // false（两个不同对象）
```

这与 Moment 的**可变**行为相反——Moment 的 `m.add(1,'day')` 会**就地修改** `m`。不可变带来两个好处：① 链式调用安全，每步独立；② 杜绝「函数内部偷偷改了传进来的日期」这类隐蔽 bug。

::: tip 克隆
通常无需手动克隆。需要时用 `.clone()`，或 `dayjs(已有实例)`——把一个 Day.js 对象传给构造器也会克隆它。
:::

## 二、插件系统：核心精简，能力按需挂载

Day.js **核心只带核心代码、不含任何插件**。要用额外能力，先 `import` 插件再 `dayjs.extend()`：

```js
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)        // 挂载后才有 .fromNow()
dayjs('1999-01-01').fromNow()     // 'x years ago'
```

::: warning 只 import 不 extend 不生效
`import 'dayjs/plugin/utc'` 只引入模块，**必须再 `dayjs.extend(utc)`** 才把方法挂到原型/工厂上。忘了 extend 就会遇到 `dayjs(...).xxx is not a function`。
:::

这套机制就是 Day.js 把体积压到极小的关键：**没用到的插件不会进打包产物**，配合现代打包器的 Tree Shaking，最终体积接近核心的 ~2KB。

### 常见误区

| 误区 | 真相 |
|---|---|
| `dayjs.use(plugin)` | 不对，方法名是 `extend`（`use` 是 Vue 等的 API） |
| import 后自动生效 | 必须显式 `extend` |
| 插件是付费功能 | 全部 MIT 开源免费 |
| extend 拖慢运行时 | extend 是一次性挂载，开销可忽略 |

## 三、UTC 模式（UTC 插件）

UTC 模式相关方法由 UTC 插件提供；核心已有 `.utcOffset()`，但它只读写固定偏移：

```js
import utc from 'dayjs/plugin/utc'
dayjs.extend(utc)

dayjs.utc()                       // 以 UTC 模式创建/解析
dayjs.utc('2024-01-15T10:00:00')  // 按 UTC 解释
dayjs().utc()                     // 把本地时间转为 UTC 显示
dayjs.utc().local()               // 转回本地时间
dayjs.utc().isUTC()               // true
dayjs().utcOffset()               // 核心方法：取/设固定 UTC 偏移
```

> UTC 转换是基于偏移的**纯本地计算**，不联网。要处理 IANA 时区（`'America/New_York'`）则需 Timezone 插件，它依赖 UTC，见[进阶篇](./advanced)。

## 四、本地化：locale

Day.js 默认**只内置英文 `en`**，其它语言要先导入对应 locale 文件：

```js
import 'dayjs/locale/zh-cn'  // 先导入语言文件

// 全局切换：影响之后所有实例
dayjs.locale('zh-cn')

// 实例级：只影响这一个实例，不动全局
dayjs().locale('zh-cn').format('YYYY年MM月DD日 dddd')
```

::: warning 只 locale 不 import 无效
不 `import 'dayjs/locale/xx'` 就没有该语言数据，光调 `dayjs.locale('xx')` 不会生效。Day.js 也**不会**自动探测浏览器语言。
:::

## 五、本地化格式化（LocalizedFormat 插件）

`L`/`LL`/`LLL`/`LLLL`/`LT`/`LTS` 这类本地化 token 由 LocalizedFormat 插件提供：

```js
import localizedFormat from 'dayjs/plugin/localizedFormat'
dayjs.extend(localizedFormat)

dayjs('2024-01-15').format('LL')  // 依当前 locale，如 'January 15, 2024'
```

> 不装该插件时 `format('L')` 会原样输出字符 `'L'`。`L` 系列归 LocalizedFormat；`Q`/`Do`/`X`/`x` 归 AdvancedFormat，两者是不同插件。

## 六、常用查询/相对时间插件

核心只内置 `isBefore`/`isAfter`/`isSame`。下面这些都需 `extend`：

```js
import isBetween from 'dayjs/plugin/isBetween'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import relativeTime from 'dayjs/plugin/relativeTime'
import isLeapYear from 'dayjs/plugin/isLeapYear'

dayjs.extend(isBetween)
dayjs.extend(isSameOrBefore)
dayjs.extend(relativeTime)
dayjs.extend(isLeapYear)

dayjs('2024-06-01').isBetween('2024-01-01', '2024-12-31') // true
dayjs('2024-01-01').isSameOrBefore('2024-01-01')          // true
dayjs('1999-01-01').fromNow()                             // 相对时间文案
dayjs('2024-01-01').isLeapYear()                          // true（2024 是闰年）
```

| 方法 | 来源 |
|---|---|
| `isBefore` / `isAfter` / `isSame` | **核心** |
| `isBetween` | IsBetween 插件 |
| `isSameOrBefore` / `isSameOrAfter` | 两个独立插件 |
| `isToday` / `isYesterday` / `isTomorrow` | 三个独立插件 |
| `isLeapYear` | IsLeapYear 插件 |
| `fromNow` / `from` / `toNow` / `to` | RelativeTime 插件 |

---

进入 [指南 · 进阶](./advanced)：CustomParseFormat 自定义解析、Timezone 时区、Duration 时长、quarter/week 插件、Moment 迁移实战。
