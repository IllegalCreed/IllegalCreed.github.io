---
layout: doc
---

# Day.js

::: tip 本篇范围
本篇聚焦 **Day.js —— 一个 2KB、不可变、与 Moment.js API 基本兼容的轻量日期时间库**。它与 Luxon（富类型、基于 Intl）、date-fns（纯函数式）同属「日期时间」选型方向，本篇在对比与定位时一笔带过另两者。版本基线 **Day.js 1.11.x**。
:::

Day.js 由 iamkun 维护，官方定位是「**a 2KB immutable date-time library alternative to Moment.js with the same modern API**」。它最想解决 Moment.js 的两个老问题：**体积太大**与**对象可变**。设计哲学可浓缩成三点：**极小体积**（核心约 2KB，「Less JavaScript to download, parse and execute」）、**不可变**（`add`/`subtract`/`set` 等所有修改型操作都返回新实例，绝不原地修改）、**Moment 风格的链式 API**（`dayjs(x).add(1, 'day').format(...)`，从 Moment 迁移几乎零学习成本）。

它最该被记牢的一条边界是：**核心只内置「英文 locale + 基础解析/格式化/操作/查询」**。其余能力——UTC、IANA 时区、相对时间、自定义格式解析、时长（Duration）、季度/周、闰年判断等——全部拆成**可选插件**，用到才 `dayjs.extend(plugin)`。这正是它把体积压到极小的核心手段：未引用的插件不会进打包产物。**2026 年的现状**：Day.js 1.11.x 已是事实标准的轻量首选；时区插件（Timezone）不打包时区数据，底层借助宿主的 `Intl.DateTimeFormat`（同 Luxon），因此能力随运行环境的 ICU 数据而变。

## 评价

**优点**

- **极小体积**：核心约 2KB（gzip），配合按需插件 + Tree Shaking，最终产物远小于 Moment「全家桶」
- **不可变**：所有修改型操作返回新实例，杜绝「别处偷偷改了我的日期」这类 Moment 时代的隐蔽 bug
- **Moment 兼容 API**：方法名、format token（`YYYY-MM-DD HH:mm:ss`）与 Moment 高度一致，迁移成本低
- **插件机制清爽**：`dayjs.extend(plugin)` 按需挂载；官方插件覆盖 UTC、时区、相对时间、duration、自定义解析等
- **链式调用**：`dayjs(x).add(1,'day').startOf('day').format(...)`，可读性好
- **浏览器 / Node 通吃**：ESM、CommonJS、UMD（CDN）皆可，所有单元测试两端都跑
- **本地化丰富**：内置 140+ locale 文件，按需 `import 'dayjs/locale/zh-cn'` 即可

**缺点**

- **能力都在插件里**：忘了 `extend` 就会遇到「`.tz is not a function`」「`.fromNow is not a function`」这类错误
- **时区依赖环境 Intl**：Timezone 插件不打包时区数据，缺完整 ICU 的老 Node / 受限 WebView 可能失灵
- **可变 → 不可变的迁移陷阱**：照搬 Moment 的 `m.add(1,'day')`（期望就地改）会失效，必须改成重新赋值
- **核心解析仅可靠支持 ISO**：非 ISO 字符串（如 `DD/MM/YYYY`）需 CustomParseFormat 插件才稳
- **不是纯函数式**：面向对象 + 不可变，不像 date-fns 那样按函数极致 tree-shaking
- **复杂时区/区间运算偏弱**：重度时区与区间（Interval）场景，Luxon 的富类型可能更顺手

## 文档地址

[Day.js Documentation](https://day.js.org)

## GitHub 地址

[iamkun/dayjs](https://github.com/iamkun/dayjs)

## 幻灯片地址

<a href="/SlideStack/dayjs-slide/" target="_blank">Day.js</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=day-js" target="_blank" rel="noopener noreferrer">Day.js 测试题</a>
