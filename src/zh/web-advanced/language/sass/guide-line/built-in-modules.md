---
layout: doc
outline: [2, 3]
---

# 内置模块与迁移

> 基于 Dart Sass 1.101.0 · 核于 2026-07

## 速查

- **内置模块**（前缀统一 `sass:`）：`sass:math`、`sass:color`、`sass:string`、`sass:list`、`sass:map`、`sass:selector`、`sass:meta`——共 7 个，都用 `@use 'sass:xxx'` 加载。
- **加载后用命名空间调用**：`@use 'sass:math';` 后 `math.round(...)`、`math.div(...)`。
- **`sass:math`**：`math.div($a,$b)`（除法）、`math.round`/`ceil`/`floor`、`math.percentage`、`math.abs`、`math.min`/`max`、`math.pow`/`sqrt`、常量 `math.$pi`/`math.$e`。
- **`sass:color`**：`color.adjust`（增减通道）、`color.scale`（按比例趋近极值）、`color.change`（直接设通道）、`color.mix`、`color.complement`、`color.invert`、`color.grayscale`。
- **`sass:string`**：`string.length`、`string.slice`、`string.index`、`string.insert`、`string.to-upper-case`、`string.unquote`/`quote`。
- **`sass:list`**：`list.length`、`list.nth`、`list.append`、`list.join`、`list.index`、`list.zip`（列表**不可变**，函数返回新列表）。
- **`sass:map`**：`map.get`、`map.has-key`、`map.set`、`map.merge`、`map.keys`、`map.values`。
- **`sass:meta`**：`meta.keywords`（捕获关键字参数）、`meta.load-css`、`meta.type-of`、`meta.inspect`、`meta.module-variables`。
- ⚠️ **除法迁移**：`/` 作除法自 **1.33.0** 弃用（与 CSS 简写斜杠 `font: 16px/1.5` 歧义）→ 改用 `math.div()`。
- ⚠️ **颜色迁移**：全局 `darken`/`lighten`/`saturate`/`desaturate`/`adjust-hue` 自 **1.79.0** 弃用 → 改用 `color.adjust`/`color.scale`。
- **全局函数别名**：多数将逐步弃用、改走命名空间；但颜色构造器 `rgb()`/`hsl()`/`hwb()` 因需处理特殊 CSS 函数语法，**仍只作为全局函数**存在。
- **实现现状**：**Dart Sass**（`1.101.0`）是唯一活跃实现；**LibSass 已 EOL（2025-10）**、`node-sass` EOL、Ruby Sass 早废弃。

## 一、内置模块总览与加载

Sass 的「标准库」被组织成 7 个内置模块，前缀统一为 `sass:`，都通过 `@use` 加载：

```scss
@use 'sass:math';
@use 'sass:color';
@use 'sass:string';
@use 'sass:list';
@use 'sass:map';
@use 'sass:meta';
// 还有 sass:selector（选择器引擎）
```

| 模块 | 职责 | 代表函数 |
| --- | --- | --- |
| `sass:math` | 数值运算 | `math.div`、`math.round`、`math.percentage`、`math.pow` |
| `sass:color` | 颜色生成/调整 | `color.adjust`、`color.scale`、`color.change`、`color.mix` |
| `sass:string` | 字符串处理 | `string.length`、`string.slice`、`string.to-upper-case` |
| `sass:list` | 列表访问/变换 | `list.nth`、`list.append`、`list.join`、`list.length` |
| `sass:map` | 映射查改 | `map.get`、`map.has-key`、`map.merge`、`map.keys` |
| `sass:selector` | 选择器引擎 | `selector.nest`、`selector.unify`、`selector.append` |
| `sass:meta` | 内省/元编程 | `meta.keywords`、`meta.load-css`、`meta.type-of` |

::: tip 全局别名正在退场
历史上这些函数都有全局名（如 `percentage()`、`map-get()`）。进入模块系统后，官方推荐统一用 `@use 'sass:xxx'` + 命名空间调用，并会逐步弃用大部分全局别名。**例外**：颜色构造器 `rgb()`、`hsl()`、`hwb()` 因为要处理特殊的 CSS 函数语法，被有意保留为**仅全局**函数，不进命名空间模块。
:::

## 二、`sass:math` 与除法迁移

```scss
@use 'sass:math';

.box {
  width: math.div(100%, 3);        // 除法：33.333%
  height: math.percentage(0.5);    // 50%
  margin: math.round(2.6px);       // 3px
  z-index: math.max(10, 20, 30);   // 30
  --pi: #{math.$pi};               // 3.1415926536
}
```

::: danger `/` 作除法已弃用，改用 `math.div()`
自 Dart Sass **1.33.0** 起，`/` 作为除法运算符被弃用。根本原因是 `/` 在 CSS 里**本身就有语义**——用于分隔简写属性的值，例如 `font: 16px/1.5 serif`、`grid-row: 1/3`、`aspect-ratio: 16/9`。若 Sass 继续把 `/` 当除法，就会与这些 CSS 原生写法**产生歧义**。因此现代 Sass 一律用显式的 `math.div($a, $b)` 做除法：

```scss
// ❌ 旧写法（已弃用，会告警）
$half: $width / 2;

// ✅ 新写法
$half: math.div($width, 2);
```
:::

## 三、`sass:color` 与颜色迁移

`sass:color` 提供比旧全局函数更可控的颜色操作：

```scss
@use 'sass:color';

$brand: #c6538c;

.a { color: color.scale($brand, $lightness: -20%); }  // 按比例调暗
.b { color: color.adjust($brand, $hue: 30deg); }      // 增减某通道
.c { color: color.change($brand, $alpha: 0.5); }      // 直接设通道
.d { color: color.mix(#fff, $brand, 25%); }           // 混色
```

- `color.adjust()`：给指定通道**增减固定量**。
- `color.scale()`：让通道**按比例趋近其极值**，效果比线性增减更自然。
- `color.change()`：把通道**直接设为**新值。

::: warning 旧全局颜色函数已弃用
`darken()`、`lighten()`、`saturate()`、`desaturate()`、`adjust-hue()` 等全局颜色调整函数自 Dart Sass **1.79.0** 起弃用。官方认为 `darken()` 这类**线性减亮度**通常不是让颜色「变暗」的最佳方式，`color.scale`/`color.adjust` 更可控。迁移对照：

```scss
// darken($c, 20%)   → color.scale($c, $lightness: -20%)
// lighten($c, 20%)  → color.adjust($c, $lightness: 20%, $space: hsl)
// saturate($c, 20%) → color.adjust($c, $saturation: 20%, $space: hsl)
```
:::

## 四、`sass:string` / `sass:list` / `sass:map` / `sass:meta`

```scss
@use 'sass:string';
@use 'sass:list';
@use 'sass:map';
@use 'sass:meta';

// 字符串
$u: string.to-upper-case("scss");     // "SCSS"
$s: string.slice("hello", 1, 3);      // "hel"（1-based，含端点）

// 列表（不可变，返回新列表）
$l: list.append((a b), c);            // a b c
$n: list.nth((a b c), 2);             // b（1-based 索引）

// 映射
$conf: ("gap": 8px, "cols": 12);
$gap: map.get($conf, "gap");          // 8px
$has: map.has-key($conf, "cols");     // true
$m2: map.set($conf, "gap", 16px);     // 返回新 map

// 元编程
$t: meta.type-of(42);                 // number
```

::: tip Sass 的列表/映射是不可变的
`list.append`、`map.set`、`map.merge` 等都**返回新值**，不修改原值。索引是 **1-based**（`list.nth($l, 1)` 取第一个）。`sass:meta` 偏元编程（拿关键字参数、按名调函数、动态加载 CSS），日常较少用但写库时很有用。
:::

## 五、实现现状：只用 Dart Sass

- **Dart Sass**（npm 包名 `sass`，实测 `1.101.0`）：官方主力，也是所有新特性与内置模块的首发/唯一平台。**新项目一律用它。**
- **LibSass**（C++ 实现）：曾因速度流行，但长期落后于规范；官方博客于 **2025-10** 宣告其达到 **End-Of-Life**。其 Node 绑定 **`node-sass` 也已 EOL**。
- **Ruby Sass**：最早的实现，早已停止维护。

因此，凡是搜索到基于 `node-sass`/LibSass 的教程或依赖，都应视为过时——迁移到 Dart Sass（`sass` 包）即可，API 与语法在 SCSS 层面基本一致，差异集中在已弃用特性（`/` 除法、`@import`、全局颜色函数）上，正好用本章介绍的现代写法替换。

---

至此，Sass 工具层（语法/嵌套/复用/控制流/模块/内置模块）已成体系。速查与对照表汇总见 [参考](../reference)。
