---
layout: doc
outline: [2, 3]
---

# 指南 · 专家

> 版本基线 **Day.js 1.11.x**。深入内核与工程实践：自定义插件签名、badMutable 取舍、updateLocale 定制、Timezone 在 SSR 的 ICU 坑、extend 幂等与依赖顺序、体积优化。

## 一、写一个自定义插件

Day.js 插件是一个函数，官方签名为 **`(option, dayjsClass, dayjsFactory)`**：

- `option`：`extend(plugin, option)` 时传入的配置；
- `dayjsClass`：Dayjs 类——在 `prototype` 上加**实例方法**；
- `dayjsFactory`：dayjs 工厂函数——在其上加**静态方法**（如 `dayjs.utc`）。

```js
// myPlugin.js
export default (option, dayjsClass, dayjsFactory) => {
  // 加实例方法
  dayjsClass.prototype.isWeekend = function () {
    const d = this.day()
    return d === 0 || d === 6
  }
  // 加静态方法
  dayjsFactory.unixMs = (ms) => dayjsFactory(ms)
  // 覆盖并增强已有方法（保存旧引用）
  const oldFormat = dayjsClass.prototype.format
  dayjsClass.prototype.format = function (...args) {
    return oldFormat.bind(this)(...args)
  }
}
```

```js
import myPlugin from './myPlugin'
dayjs.extend(myPlugin)
dayjs('2024-01-13').isWeekend() // true（周六）
```

## 二、badMutable：要不要「可变」

极少数场景需兼容依赖**就地修改**的老 Moment 代码，官方提供 BadMutable 插件：

```js
import badMutable from 'dayjs/plugin/badMutable'
dayjs.extend(badMutable) // 之后对象变为可变
```

::: warning 命名即警示
插件名带 `bad`，明确表示**仅供过渡/兼容，不推荐常规使用**——它会破坏 Day.js 不可变这一核心优势。更好的做法是把代码改造成不可变写法（重新赋值），而不是引入 badMutable。
:::

## 三、updateLocale：定制语言细节

`dayjs.locale('x')` 是**切换**语言；UpdateLocale 插件是**修改某个已加载语言的配置**：

```js
import updateLocale from 'dayjs/plugin/updateLocale'
dayjs.extend(updateLocale)

dayjs.updateLocale('en', {
  weekStart: 1,                       // 周一作为一周起始
  relativeTime: { future: 'in %s', past: '%s ago', /* … */ },
  months: ['January', /* … */],
})
```

> 一个负责「选哪个语言」，一个负责「定制该语言的细节」。新增语言仍靠 `import 'dayjs/locale/xx'`，updateLocale 不下载语言包。

## 四、Timezone 在 SSR：ICU 坑

Timezone 插件依赖宿主的 `Intl.DateTimeFormat` + **ICU 时区数据**。在某些精简运行时（旧版 `small-icu`、未带完整 ICU 的 Node、受限 WebView、React Native 旧版）会缺时区数据，导致 IANA 时区解析回退或出错。

```text
现象：服务端 dayjs().tz('Asia/Shanghai') 偶尔得到 UTC 或换算异常
根因：运行环境 Intl/ICU 缺少完整时区数据（不是 Day.js 的锅——它本就不打包时区数据）
解决：使用 full-icu，或 Node 18+（默认完整 ICU）的运行环境
```

> 与「忘了 extend timezone/utc」是两个层次的问题：前者方法存在但数据不全，后者方法根本不存在（`not a function`）。

## 五、extend 幂等与依赖顺序

- **幂等**：重复 `dayjs.extend(同一插件)` 是**安全**的，不会报错或叠加副作用。
- **依赖顺序**：有依赖关系的插件必须**先加载被依赖者**：

```js
dayjs.extend(utc)        // 必须先于 timezone
dayjs.extend(timezone)   // 依赖 utc
dayjs.extend(isLeapYear) // 必须先于 isoWeeksInYear
dayjs.extend(isoWeeksInYear)
```

> 工程实践：在**应用入口**集中、按依赖序 `extend` 一次即可，全局生效，无需每次调用前重复。

## 六、体积优化清单

| 手段 | 说明 |
|---|---|
| 只 import 用到的插件 | 未引用的插件不进产物（核心 ~2KB） |
| 只 import 需要的 locale | 140+ locale 别全引，按需 `import 'dayjs/locale/zh-cn'` |
| 入口集中 extend | 一处挂载，避免散落重复 |
| 善用 Tree Shaking | 现代打包器自动剔除未引用代码 |
| 优先核心能力 | 仅格式化就别引 relativeTime/timezone |

## 七、辨析：核心 vs 插件（记牢这张表）

| 核心（开箱即用） | 插件（需 extend） |
|---|---|
| `format` / `add` / `subtract` / `diff` | `fromNow`（relativeTime） |
| `startOf` / `endOf` / `set` / `get` | `utc` / `tz`（utc / timezone） |
| `isBefore` / `isAfter` / `isSame` | `isBetween` / `isSameOrBefore` |
| `valueOf` / `unix` / `toDate` / `toISOString` | `isLeapYear` / `quarter` / `week` |
| `isValid` / `clone` | `duration` / 自定义格式解析（customParseFormat） |

---

回到 [入门](../getting-started) 复习主线，或查 [参考](../reference) 速览 API 与插件清单。
