---
layout: doc
outline: [2, 3]
---

# 参考：Sass 速查与对照表

> 基于 Dart Sass 1.101.0 · 核于 2026-07

## 速查

- **定位**：CSS 预处理器，编译成 CSS。两种语法：SCSS（`.scss`，CSS 超集，最流行）/ 缩进语法（`.sass`）。当前实现 **Dart Sass 1.101.0**；LibSass/Ruby Sass 已 EOL。
- **变量**：`$x`，编译期消除；`!default`（未定义才赋）、`!global`（改已声明的全局）。
- **嵌套**：`&` 父选择器（`&:hover`/`&__el`/`&--mod`/`[dir] &`），只能放复合选择器开头；嵌套属性 `font: { family; weight }`。
- **复用**：`@mixin`/`@include`/`@content`（出样式）、`@function`/`@return`（算值）、`@extend` + `%`（并选择器）。
- **控制流**：`@if`/`@else if`/`@else`、`@each`（列表/map 解构）、`@for`（`through` 含终点/`to` 不含）、`@while`。
- **模块系统**：`@use`（命名空间加载、只加载一次、`as`/`as *`/`with`）、`@forward`（转发、`show`/`hide`/`as prefix-*`/`with !default`）；私有成员 `-`/`_` 前缀。
- **`@import` 弃用**：1.80.0 弃用、计划 3.0.0 移除，改用 `@use`；官方 `sass-migrator` 自动迁移。
- **内置模块**：`sass:math`/`color`/`string`/`list`/`map`/`selector`/`meta`，`@use 'sass:xxx'` 加载。
- **两大迁移**：`/` 除法（1.33.0 弃用）→ `math.div()`；`darken`/`lighten` 等（1.79.0 弃用）→ `color.adjust`/`color.scale`。

## 一、核心 at-rule 速查

| at-rule | 作用 |
| --- | --- |
| `@use` | 带命名空间加载模块（推荐，取代 `@import`） |
| `@forward` | 转发模块公共成员给下游，搭库入口 |
| `@import` | 引入文件（**已弃用**，1.80.0 起，3.0.0 移除） |
| `@mixin` / `@include` | 定义 / 引入可复用样式块 |
| `@content` | mixin 内占位，接收 `@include` 传入的样式块 |
| `@function` / `@return` | 定义 / 返回计算值 |
| `@extend` | 继承并合并选择器 |
| `@if` / `@else if` / `@else` | 条件分支 |
| `@each` | 遍历列表 / map |
| `@for` | 按数值范围循环 |
| `@while` | 条件循环 |
| `@at-root` | 把嵌套规则提升到根层输出 |
| `@debug` / `@warn` / `@error` | 调试输出 / 告警 / 报错 |

## 二、变量标志速查

| 标志 | 含义 | 约束 |
| --- | --- | --- |
| `!default` | 仅当变量未定义或为 `null` 时才赋值 | 库给默认值、允许 `with` 覆盖 |
| `!global` | 在局部作用域修改全局变量 | 只能改**已在顶层声明**的变量，不能新建 |

> 局部块内同名赋值默认是**遮蔽**（不改全局）；`@if`/循环块**不创建新作用域**。

## 三、`&` 父选择器速查

| 写法 | 编译结果 | 用途 |
| --- | --- | --- |
| `&:hover` | `.parent:hover` | 伪类 |
| `&__title` | `.parent__title` | BEM 元素 |
| `&--active` | `.parent--active` | BEM 修饰符 |
| `[dir=rtl] &` | `[dir=rtl] .parent` | 反转上下文 |
| `&.is-open` | `.parent.is-open` | 与其它选择器组合 |

> `&` 只能放在复合选择器**开头**（`span&` 非法）；样式规则外 `&` 为 `null`。

## 四、模块系统速查

| 语法 | 作用 |
| --- | --- |
| `@use 'file'` | 加载，命名空间 = 文件名，`file.$x` / `file.fn()` |
| `@use 'file' as x` | 自定义命名空间 `x` |
| `@use 'file' as *` | 并入全局（慎用，仅限自己的文件） |
| `@use 'file' with ($x: 1)` | 加载并配置带 `!default` 的变量（`as` 须在 `with` 前） |
| `@forward 'file'` | 转发公共成员给下游 |
| `@forward 'file' show a, $b` | 白名单转发 |
| `@forward 'file' hide a` | 黑名单转发 |
| `@forward 'file' as p-*` | 转发时批量加前缀 |
| `@forward 'file' with ($x: 1 !default)` | 改上游默认、留下游可覆盖 |
| `$-name` / `%-name` | 私有成员 / 私有占位符（仅本文件） |

> 每个模块只加载一次；`@use` 须在文件开头；模块只在首次加载时接受配置。

## 五、内置模块速查

| 模块 | 代表函数 |
| --- | --- |
| `sass:math` | `math.div`、`math.round`/`ceil`/`floor`、`math.percentage`、`math.abs`、`math.min`/`max`、`math.pow`/`sqrt`、`math.$pi`/`math.$e` |
| `sass:color` | `color.adjust`、`color.scale`、`color.change`、`color.mix`、`color.complement`、`color.invert`、`color.grayscale` |
| `sass:string` | `string.length`、`string.slice`、`string.index`、`string.insert`、`string.to-upper-case`、`string.unquote`/`quote` |
| `sass:list` | `list.length`、`list.nth`、`list.append`、`list.join`、`list.index`、`list.zip`（不可变、1-based） |
| `sass:map` | `map.get`、`map.has-key`、`map.set`、`map.merge`、`map.keys`、`map.values` |
| `sass:selector` | `selector.nest`、`selector.unify`、`selector.append`、`selector.is-superselector` |
| `sass:meta` | `meta.keywords`、`meta.load-css`、`meta.type-of`、`meta.inspect`、`meta.module-variables`、`meta.call` |

> 全局别名逐步弃用、改走命名空间；例外：颜色构造器 `rgb()`/`hsl()`/`hwb()` 仍仅全局。

## 六、破坏性变更 / 弃用时间线（节选）

| 特性 | Dart Sass 版本 | 迁移 |
| --- | --- | --- |
| `@import` | 1.80.0 弃用 → 3.0.0 移除 | `@use`/`@forward`（`sass-migrator`） |
| 旧全局颜色函数（`darken`/`lighten` 等） | 1.79.0 弃用 | `color.adjust`/`color.scale` |
| `/` 作除法运算符 | 1.33.0 弃用 | `math.div()` |
| 以 `--` 开头的函数/mixin 名 | 1.76.0 | 改名 |
| 声明与嵌套规则混排 | 1.77.7 | 调整顺序 |

> 完整清单见官方 [Breaking Changes](https://sass-lang.com/documentation/breaking-changes/)。

## 七、`@use` vs `@import` 对照

| 维度 | `@use`（推荐） | `@import`（已弃用） |
| --- | --- | --- |
| 成员可见性 | 命名空间隔离、可私有 | 全部全局 |
| 加载次数 | 每模块一次 | 每次引入都执行输出 |
| `@extend` 范围 | 限上游模块、可控 | 全局、不可预测 |
| 配置库 | `with` + `!default` | 先改全局变量再 import（脆弱） |
| 私有成员 | 支持（`-`/`_`） | 不支持 |
| 书写位置 | 文件开头 | 任意位置 |
| 状态 | 官方主推 | 1.80.0 弃用、计划 3.0.0 移除 |

## 八、`@extend` vs `@mixin` 对照

| 维度 | `@extend` | `@mixin` |
| --- | --- | --- |
| 机制 | 合并选择器（`.a, .b { }`） | 复制展开样式 |
| 参数 | 不支持 | 支持（默认/关键字/可变参数） |
| 语义 | 「A 是一种 B」 | 「复用一段样式模式」 |
| 跨 `@media` | ❌ 不能 | ✅ 可以 |
| 隐式牵连 | 会影响所有出现被继承选择器处 | 无，独立 |
| 产物体积 | 更紧凑 | 有重复（现代压缩可消化） |

## 九、选型对比：Sass vs Less vs PostCSS vs CSS 自定义属性

| 维度 | Sass | Less | PostCSS | CSS 自定义属性 |
| --- | --- | --- | --- | --- |
| 类型 | 预处理器 | 预处理器 | 后处理/转换平台 | 浏览器**原生**运行时 |
| 变量 | `$x`，编译期 | `@x`，编译期 | 靠插件 | `--x`，运行时可变 |
| 逻辑能力 | 强（mixin/函数/控制流/模块） | 中 | 取决于插件 | 无 |
| 需构建 | 是 | 是 | 是 | 否 |
| 运行时动态 | 无（编译期消除） | 无 | 无 | 有（随元素/主题变） |
| 典型定位 | 成熟工程化样式抽象 | 轻量、JS 生态 | 加前缀/降级新语法/原子化管线 | 主题换肤、运行时可变值 |

**选型速记**：要成熟全能的样式工程化 → **Sass**；更轻或在 Less 生态 → **Less**；按标准做转换（Autoprefixer、未来语法降级）→ **PostCSS**（常与 Sass **叠用**）；运行时随主题动态变化的值 → **CSS 自定义属性**（与 Sass 互补）。

## 十、常见坑对照

| 现象 | 根因 | 解法 |
| --- | --- | --- |
| `/` 除法告警/结果异常 | `/` 作除法已弃用 | 用 `math.div($a, $b)` |
| `darken()` 告警 | 旧全局颜色函数弃用 | 用 `color.scale`/`color.adjust` |
| `@import` 告警 | 1.80.0 起弃用 | 改 `@use`/`@forward`，或跑 `sass-migrator` |
| `@use ... with` 报错 | `as` 写在了 `with` 后 / 重复配置同一模块 | `as` 在前；配置只在首次加载 |
| `@extend` 报错 | 跨 `@media` 或扩展了复合选择器 | 改用 mixin，或只扩展简单选择器 |
| 拼错函数名不报错 | 未知函数被当普通 CSS 输出 | 对产物跑 CSS lint |
| `span&` 报错 | `&` 只能放复合选择器开头 | 换写法（如 `& span` 或调整结构） |
| 用了 `node-sass` 却缺特性 | LibSass/node-sass 已 EOL | 换 Dart Sass（`sass` 包） |

## 十一、权威链接

- [Sass 官网](https://sass-lang.com/) —— 首页与在线 Playground
- [文档首页](https://sass-lang.com/documentation/) —— 全量导航
- [语法 Syntax](https://sass-lang.com/documentation/syntax/) —— SCSS vs 缩进语法
- [变量](https://sass-lang.com/documentation/variables/) ｜ [父选择器 &](https://sass-lang.com/documentation/style-rules/parent-selector/) ｜ [占位符选择器](https://sass-lang.com/documentation/style-rules/placeholder-selectors/)
- [@mixin](https://sass-lang.com/documentation/at-rules/mixin/) ｜ [@function](https://sass-lang.com/documentation/at-rules/function/) ｜ [@extend](https://sass-lang.com/documentation/at-rules/extend/)
- [控制流](https://sass-lang.com/documentation/at-rules/control/) —— `@if`/`@each`/`@for`/`@while`
- [@use](https://sass-lang.com/documentation/at-rules/use/) ｜ [@forward](https://sass-lang.com/documentation/at-rules/forward/) ｜ [@import（弃用）](https://sass-lang.com/documentation/at-rules/import/)
- [内置模块](https://sass-lang.com/documentation/modules/) —— `sass:math`/`color`/`string`/`list`/`map`/`selector`/`meta`
- [Breaking Changes](https://sass-lang.com/documentation/breaking-changes/) —— 弃用与破坏性变更清单
- [博客：@import is Deprecated](https://sass-lang.com/blog/import-is-deprecated/) —— 弃用时间线一手来源
- [GitHub · sass/dart-sass](https://github.com/sass/dart-sass) ｜ [sass/migrator](https://github.com/sass/migrator) —— 源码与迁移工具
- [npm · sass](https://registry.npmjs.org/sass/latest) —— 版本实测：`1.101.0`
