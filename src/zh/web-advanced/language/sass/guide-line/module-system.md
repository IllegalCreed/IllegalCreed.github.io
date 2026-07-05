---
layout: doc
outline: [2, 3]
---

# 模块系统：@use / @forward 与 @import 弃用

> 基于 Dart Sass 1.101.0 · 核于 2026-07

## 速查

- **模块系统 = `@use` + `@forward`**，2019 年随 Dart Sass 引入，用来**取代 `@import`**。
- **`@use 'url'`**：加载模块，成员带**命名空间**访问，命名空间默认由**文件名**派生：`file.$var`、`file.func()`、`@include file.mixin()`。
- **`@use 'url' as x`**：自定义命名空间为 `x`。**`@use 'url' as *`**：并入全局、可不带前缀（官方建议只对自己写的文件用）。
- **每个模块只加载一次**：无论被多少文件 `@use`，只执行一次、CSS 不重复（对比 `@import` 每次都执行输出）。
- **`@use` 须在文件开头**、每条只接一个 URL、URL 必须带引号。
- **私有成员**：名字以 `-`/`_` 开头 → 只在本文件可用，不进公共 API。
- **`@use 'lib' with ($x: 1)`**：加载时配置库里带 `!default` 的变量。⚠️ **`as` 必须在 `with` 之前**。
- **`@forward 'url'`**：把模块公共成员**转发给下游**，当前文件不直接可用（要用需另写 `@use`）。搭「库入口」用。
- **`@forward` 修饰**：`show`（白名单）/`hide`（黑名单）/`as prefix-*`（批量加前缀）/`with (... !default)`（改上游默认、仍留下游可覆盖）。
- ⚠️ **`@import` 已弃用**：Dart Sass **1.80.0** 起弃用（官方博客《@import is Deprecated》2024-10-17），计划 **3.0.0** 移除（只给版本号、无具体日期）。
- **弃用 5 大理由**：全局污染难追踪 / 逼库作者加前缀防冲突 / `@extend` 全局化不可预测 / 每次引入都重复执行输出 / 无法定义私有成员与占位符。
- **迁移**：官方 `sass-migrator` 工具可把 `@import` 代码自动转成 `@use`。
- **内置模块**：`@use 'sass:math'` 等同样走 `@use`（详见[内置模块页](./built-in-modules)）。

## 一、`@use`：带命名空间地加载模块

`@use 'url'` 加载另一个 Sass 文件（模块），其变量、mixin、函数默认以**命名空间**方式访问。命名空间默认取**文件名**（去掉路径、扩展名、以及可能的下划线前缀）：

```scss
// _corners.scss
$radius: 8px;
@mixin rounded { border-radius: $radius; }
```

```scss
// style.scss
@use 'corners';

.button {
  @include corners.rounded;   // 用命名空间访问 mixin
  padding: corners.$radius;   // 用命名空间访问变量
}
```

这与 `@import` 把成员一股脑塞进全局根本不同——你一眼就能看出 `rounded`、`$radius` 来自 `corners` 模块。

### `as`：自定义命名空间

文件名太长或需要区分时，用 `as` 改名：

```scss
@use 'src/list-helpers' as list;

.menu { @include list.reset; }
```

### `as *`：并入全局命名空间

`as *` 让成员可不带前缀直接用：

```scss
@use 'corners' as *;

.button { @include rounded; }   // 不用写 corners.
```

::: warning `as *` 慎用
官方建议**只对你自己写的文件**用 `as *`。如果对第三方库这么做，一旦库在新版本里新增了同名成员，就会和你的名字冲突。带命名空间是更安全的默认。
:::

### 模块只加载一次

无论一个模块被多少个文件 `@use`，它**只被加载和执行一次**，成员在各处共享、其 CSS 也只输出一次。这从根本上避免了 `@import` 时代同一文件被多处引入、CSS 重复膨胀的问题。

::: tip `@use` 的书写约束
`@use` 规则必须出现在**文件开头**（在任何样式规则之前）；每条 `@use` 只接一个 URL；URL 两侧的引号**不能省**。
:::

## 二、私有成员与配置

### 私有成员：`-`/`_` 前缀

名字以 `-` 或 `_` 开头的变量/mixin/函数是**私有**的——在定义它的文件里照常使用，但不会成为模块公共 API，`@use`/`@forward` 的人访问不到：

```scss
// _theme.scss
$-secret-base: #123456;              // 私有，外部拿不到
$primary: lighten($-secret-base, 20%) !default;  // 公开
```

这是模块系统独有的封装能力，`@import` 做不到。

### `with`：配置模块的默认变量

库内用 `!default` 给默认值，使用方在 `@use ... with (...)` 里传入配置覆盖它：

```scss
// _library.scss
$black: #000 !default;
$border-radius: 0.25rem !default;

// style.scss
@use 'library' with (
  $black: #222,
  $border-radius: 0.1rem,
);
```

::: danger `as` 必须在 `with` 之前
既要自定义命名空间又要配置时，顺序是固定的——`as` 在前、`with` 在后：

```scss
@use 'library' as lib with ($black: #222);   // ✅
// @use 'library' with (...) as lib;         // ❌ 报错
```

另外，一个模块**只在首次加载时**接受配置。若它已被某文件 `@use ... with` 配置过，另一处再 `@use ... with` 配置同一模块会**报错**（配置一次定终身，保证状态一致）。
:::

## 三、`@forward`：搭建库入口

`@forward 'url'` 像 `@use` 一样加载模块，但作用是把它的**公共成员转发给「下游使用者」**——让别人 `@use` 你这个文件时，能像用你自己定义的成员一样用被转发的成员。注意：被 `@forward` 的成员在**当前文件里并不直接可用**（要用得再单独 `@use` 一次）。

它的典型场景是**库入口文件（barrel / index）**：把分散在多个子文件的公共 API 汇聚成一个入口。

```scss
// src/_list.scss、src/_table.scss 各定义若干 mixin
// src/_index.scss —— 库入口，转发全部子模块
@forward 'list';
@forward 'table';

// 使用方只需 @use 一个入口
@use 'src';           // 即可访问 src.list-reset()、src.table-base() 等
```

### `show` / `hide`：控制转发范围

```scss
@forward 'list' show list-reset, $horizontal-gap;  // 白名单：只转发这些
@forward 'list' hide list-reset;                    // 黑名单：转发其余、藏起它
```

列举变量时要带 `$`（如 `$horizontal-gap`）。

### `as prefix-*`：批量加前缀

给转发的成员统一加前缀，避免不同子模块间命名冲突：

```scss
@forward 'list' as list-*;   // 源里的 reset → 下游用 list-reset
```

### `with` + `!default`：改上游默认、留下游可覆盖

`@forward ... with` 的独特能力是配置里**可以带 `!default`**：中间层既能改上游库的默认值，又允许更下游继续覆盖：

```scss
// 中间库：把上游 $border-radius 默认改成 0.5rem，但下游仍可覆盖
@forward 'upstream' with ($border-radius: 0.5rem !default);
```

::: tip `@forward` 与 `@use` 同一模块时
如果一个文件既要转发某模块给下游、又要自己使用它，把 `@forward` 写在 `@use` **之前**，以确保使用方提供的配置能正确生效。
:::

## 四、`@import` 的弃用：时间线与迁移

`@import` 是 Sass 早期引入其它文件的方式，如今已被模块系统取代。**准确的时间线是**：

- **弃用**：Dart Sass **1.80.0** 起，`@import` 被正式标记为 deprecated（官方博客《`@import` is Deprecated》，2024-10-17，作者 Jennifer Thakar）。触发弃用的门槛是 Dart Sass 使用份额越过 80%。
- **移除**：官方计划在 **Dart Sass 3.0.0** 从语言中移除 `@import`。官方只给出了**版本号**，**没有承诺具体日历日期**。
- 现阶段 `@import` 仍可用，但编译时会打**弃用告警**。新代码应一律用 `@use`/`@forward`。

::: warning 官方给出的 `@import` 五大问题
官方文档列出弃用 `@import` 的五条理由，正好对应模块系统解决的痛点：

1. **全局污染**：让所有变量/mixin/函数全局可访问，难以追踪某名字定义在哪，易冲突。
2. **逼库作者加前缀**：为避免命名碰撞，库不得不给成员手工加长前缀。
3. **`@extend` 全局化**：使 `@extend` 影响全局，样式继承变得不可预测。
4. **重复执行输出**：每 `@import` 一次就执行并输出一次 CSS，拖慢编译、膨胀产物。
5. **无法定义私有成员**：没有私有成员，也没有「不可访问的占位符选择器」的手段。
:::

### 用官方迁移工具

不必手工改。官方提供 `sass-migrator`，可把基于 `@import` 的代码自动转换成 `@use`/`@forward`：

```bash
# 安装
npm install -g sass-migrator

# 迁移入口文件及其依赖（自动补命名空间、拆全局引用）
sass-migrator module --migrate-deps style.scss
```

### `@use` vs `@import` 一览

| 维度 | `@use`（推荐） | `@import`（已弃用） |
| --- | --- | --- |
| 成员可见性 | 命名空间隔离，可私有 | 全部全局 |
| 加载次数 | 每模块只一次 | 每次引入都执行输出 |
| `@extend` 范围 | 限上游模块，可控 | 全局，不可预测 |
| 配置库 | `with` + `!default` | 先改全局变量再 import（脆弱） |
| 书写位置 | 必须文件开头 | 任意位置 |
| 状态 | 官方主推 | 1.80.0 弃用，计划 3.0.0 移除 |

---

模块系统掌握后，进入 [内置模块与迁移](./built-in-modules)：`sass:math`/`sass:color`/`sass:string`/`sass:list`/`sass:map`/`sass:meta`，以及 `math.div()` 取代 `/` 除法、`color.adjust`/`color.scale` 取代 `darken`/`lighten` 的迁移。
