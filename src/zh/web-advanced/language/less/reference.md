---
layout: doc
outline: [2, 3]
---

# 参考：Less 速查与对照表

> 基于 Less 4.6.7 · 核于 2026-07

## 速查

- **定位**：向后兼容 CSS 的预处理器，JS 实现，编译期出标准 CSS；当前版本 **4.6.7**。
- **变量**：`@` 前缀；惰性求值 + 最后定义生效；插值 `@{var}`；变量变量 `@@name`；属性即变量 `$prop`（3.0+）。
- **混合**：`.m()` 定义/调用括号必需；参数/默认/命名(分号)/剩余 `@rest...`；`@arguments`；`!important`。
- **守卫**：`when (...)`；`and`/逗号`,`(或)/`not`；类型函数 `isnumber` 等；CSS 守卫加在选择器上。
- **嵌套/`&`**：`&:hover`、`&--x`、`&&`(复合)、`& &`(后代)、`& + &`(兄弟)、`.x &`(前置)。
- **运算**：`+ - *` 直接算；**除法 `/` 需括号**（v4 默认 `parens-division`）；`parens`=全需括号。
- **`@import` 选项**：`reference`/`inline`/`less`/`css`/`once`/`multiple`/`optional`。
- **组织**：命名空间 `#lib()`、映射 `@m[key]`(3.5+)、脱离规则集 `@r: {..}`、`:extend(... all)`。
- **CLI**：`lessc [opts] in.less out.css`；`--math` `--modify-var` `--source-map` `--include-path` `--strict-units`。
- **vs Sass**：`@`vs`$`、惰性vs命令式、无模块系统vs`@use`、守卫vs`@if/@each`、JS vs Dart。

## 一、语法元素速查

| 元素 | 语法 | 示例 |
| --- | --- | --- |
| 变量声明/取值 | `@name: 值;` / `@name` | `@c: #333; color: @c;` |
| 变量插值 | `@{name}` | `.@{x} {}`、`url("@{p}/a.png")` |
| 变量变量 | `@@name` | `@@theme` |
| 属性作为变量 | `$prop` | `background: $color;` |
| 混合定义/调用 | `.m() {}` / `.m();` | `.radius(8px);` |
| 参数默认值 | `.m(@r: 4px)` | 无参用默认 |
| 命名参数 | `.m(@a: 1; @b: 2)` | 分号分隔、可乱序 |
| 剩余参数 | `.m(@rest...)` | 承接多余入参 |
| 守卫 | `.m() when (...)` | `when (@a > 0)` |
| 父选择器 | `&` | `&:hover`、`&--active` |
| 转义 | `~"..."` | `~"(min-width: 768px)"` |
| 注释 | `//`（静默）/ `/* */`（保留） | — |

## 二、父选择器 `&` 组合对照

| 写法（父为 `.link`） | 编译结果 | 用途 |
| --- | --- | --- |
| `&:hover` | `.link:hover` | 伪类 |
| `&--active` | `.link--active` | BEM 修饰符 |
| `&&` | `.link.link` | 复合类，提权重 |
| `& &` | `.link .link` | 后代 |
| `& + &` | `.link + .link` | 相邻兄弟 |
| `.no-js &` | `.no-js .link` | 把父级前置 |

## 三、v4 数学模式对照

| 模式 | `+ - *` | `/` | 备注 |
| --- | --- | --- | --- |
| `always`（v3 默认） | 算 | 算 | 会误算 `font: 14px/1.5` |
| **`parens-division`（v4 默认）** | 算 | **需括号** | 裸斜杠原样保留 |
| `parens` / strict | **需括号** | 需括号 | 最保守 |

```less
// v4 默认下
width: 3 + 5;       // 8
width: 100px / 4;   // 100px / 4（保留）
width: (100px / 4); // 25px
```

## 四、`@import` 选项对照

| 选项 | 作用 |
| --- | --- |
| `reference` | 只引用不输出，仅 extend/mixin 用到才产出（控体积） |
| `inline` | 原样包含、不编译 |
| `less` | 强制按 Less 编译（无视扩展名） |
| `css` | 强制当 CSS，输出原生 `@import` |
| `once` | 默认，只引一次 |
| `multiple` | 允许多次引入 |
| `optional` | 缺失则跳过、不报错 |

> 扩展名默认行为：`.less`/无扩展名 → 内联编译；`.css` → 保留成原生 `@import`。

## 五、常用内置函数速查

| 类别 | 函数 |
| --- | --- |
| 颜色定义 | `rgb` `rgba` `hsl` `hsla` `hsv` `argb` |
| 颜色通道 | `hue` `saturation` `lightness` `red` `green` `blue` `alpha` `luma` |
| 颜色操作 | `lighten` `darken` `saturate` `desaturate` `fade` `fadein` `fadeout` `spin` `mix` `tint` `shade` `greyscale` `contrast` |
| 数学 | `ceil` `floor` `round` `percentage` `sqrt` `abs` `pow` `mod` `min` `max` `pi` |
| 字符串 | `e` `escape` `replace` `%()` |
| 列表 | `length` `extract` `range` `each` |
| 类型 | `isnumber` `iscolor` `isstring` `iskeyword` `isurl` `ispixel` `isem` `ispercentage` `isunit` `isdefined` |
| 杂项 | `if` `boolean` `unit` `get-unit` `convert` `data-uri` `default` `svg-gradient` |

> 顺序提醒：`spin(saturate(#aaa, 10%), 10)` 优于 `saturate(spin(#aaa, 10), 10%)`（减少色彩损失）；`image-size` 等需 Node 环境；`default()` 仅在守卫内有效。

## 六、lessc 命令行常用选项

| 选项 | 作用 |
| --- | --- |
| `--source-map[=file]` | 生成 source map |
| `--math=[always\|parens-division\|parens]` | 数学模式 |
| `--strict-units[=on]` | 严格单位（不兼容单位运算报错） |
| `--modify-var="name=value"` | 外部覆盖变量（多主题） |
| `--global-var="name=value"` | 注入全局变量 |
| `--include-path=PATH1;PATH2` | `@import` 搜索路径 |
| `--rewrite-urls=[all\|local\|off]` | URL 重写策略 |
| `-x` / `--compress` | 压缩（已不推荐，用专门工具） |

```bash
lessc --source-map --math=parens styles.less styles.css
lessc --modify-var="primary=#f00" theme.less theme-red.css
```

## 七、Less vs Sass 核心差异

| 维度 | Less | Sass（Dart Sass） |
| --- | --- | --- |
| 变量前缀 | `@` | `$` |
| 求值 | 惰性 + 最后定义生效 | 命令式、逐行覆盖（`!default`/`!global`） |
| 模块系统 | 无正式模块（`@import (reference)` 近似） | **`@use` / `@forward`**（命名空间/私有） |
| 条件 | 守卫混合 `when` + CSS 守卫 | `@if` / `@else` |
| 循环 | 递归守卫 / `each()` | `@each` / `@for` / `@while` |
| 函数 | 混合当函数 `[@result]` | `@function` / `@return` |
| 映射 | `@m[key]`（3.5+，弱） | 一等 `map`（可迭代） |
| 实现 | JavaScript | Dart（Ruby/LibSass 已弃用） |

## 八、常见坑对照

| 现象 | 根因 | 解法 |
| --- | --- | --- |
| 同名变量取到「意料外」的值 | 惰性 + 最后定义生效 | 拆作用域 / 用参数传值 |
| `width: 100px/4` 没被计算 | v4 除法需括号 | 写成 `(100px / 4)` |
| `font: 14px/1.5` 被算成怪值 | 用了 `always` 旧模式 | 用默认 `parens-division` |
| 插值不生效 | 名字处漏了 `@{}` | 名字/字符串用 `@{var}`，取值用 `@var` |
| 引入库后 CSS 暴涨 | 未用 reference | `@import (reference)` 按需产出 |
| 混合多了一条 `.m {}` 规则 | 定义漏了括号 | 定义写 `.m() {}` |
| `2px + 3em` 结果可疑 | 单位不兼容 | 开 `--strict-units` 提前报错 |
| 运行时切不了主题 | `@var` 是编译期 | 改用 CSS 自定义属性 `--var` |
| 颜色链式结果偏色 | 函数顺序不当 | 先饱和度后 `spin` |
| `.css` 没被内联 | 默认保留成 `@import` | `@import (less) "x.css"` |

## 九、权威链接

- [lesscss.org 官方站](https://lesscss.org/) —— 概览与心智
- [语言特性 Features](https://lesscss.org/features/) —— 变量/混合/嵌套/运算/导入全解
- [内置函数 Functions](https://lesscss.org/functions/) —— 颜色/数学/字符串/列表/类型函数
- [使用方式 Usage](https://lesscss.org/usage/) —— CLI / 浏览器 / 编程 API / 数学模式
- [less/less.js（GitHub）](https://github.com/less/less.js) —— 源码、Issue、Releases
- [less-loader](https://github.com/webpack-contrib/less-loader) —— webpack 集成
- [MDN: CSS 自定义属性](https://developer.mozilla.org/zh-CN/docs/Web/CSS/--*) —— 辨析运行时变量
