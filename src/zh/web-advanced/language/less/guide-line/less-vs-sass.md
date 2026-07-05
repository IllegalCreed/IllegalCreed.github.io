---
layout: doc
outline: [2, 3]
---

# Less vs Sass 与选型：客观对比与现状定位

> 基于 Less 4.6.7 · 核于 2026-07

## 速查

- **变量前缀**：Less `@var` vs Sass `$var`（最直观差异）。
- **求值语义**：Less **惰性求值 + 最后定义生效**（更像常量）；Sass 变量**命令式、逐行覆盖**，有 `!default`/`!global`。
- **模块系统**：Sass（Dart Sass）有一等模块 **`@use` / `@forward`**（带命名空间、私有成员）；Less **无正式模块系统**，靠 `@import (reference)` 近似。
- **控制流**：Sass 有真正指令 `@if`/`@else`/`@each`/`@for`/`@while`/`@function`/`@mixin`+`@include`；Less 用**守卫混合 + 递归 + `each()`** 替代。
- **数据结构**：Sass 有一等 **map**（可迭代、`map.get`）；Less 3.5+ 有映射查找但能力更弱。
- **实现语言**：Less = **JavaScript**；Sass 参考实现 = **Dart Sass**（Ruby Sass、LibSass 均已弃用）。
- **复用机制**：Less mixin vs Sass `@mixin/@include`；Less `:extend` vs Sass `@extend`/`%placeholder`。
- **生态现状**：Less 成熟稳定、仍维护、**存量庞大**（Ant Design 早期招牌）；**新项目主流**偏向 Sass/PostCSS 与**原生 CSS**（自定义属性/嵌套/`@layer`）。
- **选型**：维护存量/Ant 生态 → 留 Less；新项目要强模块化/复杂逻辑 → Sass；要贴近标准/后处理 → PostCSS + 原生 CSS。

## 一、语法与求值：@ vs $，惰性 vs 命令式

最直观的是变量前缀，但更深的差异在**求值语义**：

```less
// Less：惰性求值 + 最后定义生效
@x: 1;
.a { width: @x; }   // 3！整个作用域取最后一次定义
@x: 3;
```

```scss
// Sass：命令式、逐行覆盖
$x: 1;
.a { width: $x; }   // 1，就是当前行的值
$x: 3;
.b { width: $x; }   // 3
```

- **Less 变量**更像「惰性常量」：一个作用域内以最后定义为准，顺序无关——这对带着命令式直觉的人是高频坑。
- **Sass 变量**是命令式的：从上到下覆盖，且提供 `!default`（未定义时才赋值，做可覆盖配置）与 `!global`（在局部改全局）等精细控制。

## 二、模块系统：Sass 的 `@use` vs Less 的 `@import (reference)`

这是两者**最大的能力差距**。

Sass（Dart Sass）有一等模块系统：

```scss
// _colors.scss
$primary: #1677ff;
@function tint($c) { @return mix(white, $c, 20%); }

// main.scss
@use "colors";                 // 带命名空间引入
.btn { color: colors.$primary; background: colors.tint(colors.$primary); }
@use "colors" as c;            // 起别名
@forward "colors";             // 再导出给上层
```

`@use` 带**命名空间**、只加载一次、支持**私有成员**（`_`/`-` 前缀），彻底解决了 `@import` 的全局污染与重复加载问题（Sass 的 `@import` 已被官方标注弃用、计划移除）。

Less **没有等价的正式模块系统**，只能用 `@import (reference)` 做「按需引用」，配合命名空间 `#lib()` 做一定的命名隔离，但没有 `@use` 那样的加载语义、别名与私有可见性管理。大型工程的依赖组织，Less 明显偏弱。

## 三、控制流与数据结构

| 能力 | Sass | Less |
| --- | --- | --- |
| 条件 | `@if` / `@else if` / `@else` | 守卫混合 `when` + 同名多定义 + CSS 守卫 |
| 循环 | `@each` / `@for` / `@while` | 递归守卫混合 / `each()`（3.7+） |
| 函数 | `@function ... @return` | 「混合当函数」取内部变量 `[@result]`（3.5+） |
| 映射 | 一等 `map`（`map.get`、可迭代） | 映射查找 `@cfg[key]`（3.5+，能力更弱） |
| 混合 | `@mixin` + `@include` | 直接写 `.mixin()` 调用 |
| 继承 | `@extend` / `%placeholder` | `:extend` / `:extend(... all)` |

Sass 的控制流是「真正的语言指令」，写复杂逻辑（主题矩阵、工具类生成）更直观、可读性更好；Less 靠守卫/递归/模式匹配拼凑，能做到但更绕。

## 四、实现与工具链

- **Less**：JavaScript 实现，`lessc` CLI + `less.render()` API + `less-loader`/Vite/gulp 集成；浏览器端 less.js（仅开发）。
- **Sass**：参考实现是 **Dart Sass**（`sass` npm 包 / dart-sass）；早期的 **Ruby Sass** 与 **LibSass（node-sass）均已弃用**，新项目应直接用 Dart Sass。

两者都属「预处理器」，产物都是静态 CSS；差别在语言能力与生态活跃度，而非编译目标。

## 五、和 PostCSS、原生 CSS 的关系

预处理器不是唯一路线：

- **PostCSS** 是「后处理器 / 插件平台」，用 `autoprefixer` 自动补前缀、`postcss-preset-env` 让你提前用未来 CSS、`postcss-nesting` 提供嵌套——它与预处理器**思路不同**（转换标准 CSS 而非发明新语法），常与 Sass/Less 叠加或替代使用。
- **原生 CSS** 近年大幅增强：**自定义属性 `--var`/`var()`**（运行时变量）、**原生嵌套**、**`@layer`** 级联层、**`color-mix()`**、相对颜色语法……很多曾经要预处理器才能做的事，浏览器已原生支持，持续挤压预处理器的「必要性」。

::: tip 别用 `@var` 冒充运行时变量
Less/Sass 变量是编译期的，无法运行时切主题；要运行时动态，请落到 CSS 自定义属性 `--var`。现代做法常是「预处理器管组织 + 自定义属性管运行时」。
:::

## 六、现状定位：客观陈述

- **Less**：语言特性趋于**成熟稳定**、版本**仍在维护**（4.x）；**存量庞大**，在 **Ant Design** 生态（早期以 `@ant-prefix`/`modifyVars` 主题定制著称；Ant Design v5 起转向 **CSS-in-JS 设计令牌**）与大量企业老项目中广泛使用。但新项目热度相对停滞。
- **Sass**：在预处理器里**声量更大**，Dart Sass 活跃演进（模块系统、内置模块 `sass:math`/`sass:map` 等）；**Bootstrap 从 v4 起由 Less 转 Sass** 是标志性事件。
- **PostCSS / 原生 CSS**：在「贴近标准 + 按需增强」的路线上持续扩张。

**一句话**：Less **成熟、稳定、存量大**，维护老项目与 Ant 生态时它依然称职；但**新项目的预处理器主流已让位于 Sass/PostCSS，并被增强的原生 CSS 持续挤压**。

## 七、选型决策

| 场景 | 建议 |
| --- | --- |
| 维护存量 Less 项目 / Ant Design 早期主题 | **留在 Less**，无需为迁移而迁移 |
| 新项目、需要强模块化与复杂逻辑 | **Sass（Dart Sass）**，模块系统与控制流更强 |
| 想贴近标准、渐进增强、自动补前缀 | **PostCSS + 原生 CSS**（`--var`/嵌套/`@layer`） |
| 需要运行时切主题 | **CSS 自定义属性 `--var`**（叠加任意预处理器） |
| 团队已熟 Less、项目样式简单 | **Less 够用**，学习成本最低 |

---

至此 Less 的定位、变量、混合、嵌套运算、导入组织与对比选型全部走完。速查、对照表与常见坑汇总见 [参考](../reference)。
