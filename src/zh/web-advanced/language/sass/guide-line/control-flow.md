---
layout: doc
outline: [2, 3]
---

# 控制流：@if / @each / @for / @while

> 基于 Dart Sass 1.101.0 · 核于 2026-07

## 速查

- **四条流控 at-rule**：`@if`/`@else`、`@each`、`@for`、`@while`。可在**顶层**条件产出样式，也可在 mixin/函数里写算法。
- **`@if` / `@else if` / `@else`**：条件分支，语义同常见语言的 if-else 链。
- **`if()` 函数 ≠ `@if`**：`if($cond, $a, $b)` 是**三元表达式函数**（返回值），`@if` 是控制样式是否输出的**语句**，二者用途不同。
- **`@each $item in $list`**：遍历列表每个元素；`@each $k, $v in $map` 遍历 map 键值对（**解构**）；还能解构嵌套列表 `@each $a, $b in $list-of-pairs`。
- **`@for`**：`@for $i from 1 through 3`（**含**终点：1,2,3）vs `@for $i from 1 to 3`（**不含**终点：1,2）。
- **`@while`**：条件为真时反复执行；能力最强但可读性差，多数场景 `@each`/`@for` 就够，少用。
- **常见坑**：`@for` 记混 `through`（闭）/`to`（半开）；`@each` map 别忘了带上两个变量解构键值。
- **典型用途**：遍历颜色/尺寸 map 批量生成工具类、按索引生成栅格列宽、条件切换主题样式。
- **配合插值**：循环里几乎都要 `#{$var}` 把值插进选择器名或属性名。

## 一、`@if` / `@else if` / `@else`

条件分支，按条件决定输出哪段样式或走哪条逻辑：

```scss
@mixin theme-text($theme) {
  @if $theme == light {
    color: #222;
  } @else if $theme == dark {
    color: #eee;
  } @else {
    color: gray;
  }
}

.title { @include theme-text(dark); }   // color: #eee
```

Sass 里除了 `false` 和 `null`，**其它值都视为真**（包括 `0`、空字符串、空列表）。

::: tip `@if` 语句 vs `if()` 函数
两者别混：`@if` 是**控制流语句**，决定「要不要输出这段样式/走这段逻辑」；`if($condition, $if-true, $if-false)` 是一个内置**函数**，像三元表达式一样**返回一个值**：

```scss
.box {
  // 用 if() 在表达式里二选一
  padding: if($compact, 4px, 12px);
}
```
:::

## 二、`@each`：遍历列表与 map

### 遍历列表

```scss
$sizes: 8px, 16px, 24px, 32px;

@each $size in $sizes {
  .m-#{$size} { margin: $size; }   // .m-8px { margin: 8px } ...
}
```

### 遍历 map（解构键值对）

`@each` 对 map 迭代时用两个变量解构出**键**和**值**——这是按配置批量生成样式最常用的套路：

```scss
$colors: (
  "primary": #c6538c,
  "success": #2e7d32,
  "danger":  #c62828,
);

@each $name, $color in $colors {
  .text-#{$name}  { color: $color; }
  .bg-#{$name}    { background: $color; }
}
```

编译出 `.text-primary`、`.bg-primary`、`.text-success`…… 一组工具类。

### 解构嵌套列表

若列表的每项本身是子列表，可一次解构多个变量：

```scss
$icons: ("mail" "\f0e0" 16px), ("bell" "\f0f3" 20px);

@each $name, $glyph, $size in $icons {
  .icon-#{$name}::before {
    content: $glyph;
    font-size: $size;
  }
}
```

## 三、`@for`：按次数循环

`@for` 按数值范围循环，有两种边界形式，**区别只在是否包含终点**：

```scss
// through：包含终点 → 1, 2, 3
@for $i from 1 through 3 {
  .col-#{$i} { width: math.percentage(math.div($i, 3)); }
}

// to：不包含终点 → 1, 2
@for $i from 1 to 3 {
  .order-#{$i} { order: $i; }
}
```

::: warning `through` 闭区间，`to` 半开区间
最容易记混的点：`from 1 through 3` 遍历 **1、2、3**（含 3）；`from 1 to 3` 只遍历 **1、2**（不含 3）。想「到 N 为止都要」用 `through`。
:::

（上例用到了 `sass:math`，实际文件需先 `@use 'sass:math';`，详见[内置模块页](./built-in-modules)。）

## 四、`@while`：条件循环

`@while` 在条件为真时反复执行，能力最强、也最容易写出难读或死循环的代码：

```scss
@use 'sass:math';

$i: 6;
@while $i > 0 {
  .pad-#{$i} { padding: $i * 4px; }
  $i: $i - 2;        // 记得更新条件，否则死循环
}
```

::: tip `@while` 少用
`@while` 能表达的绝大多数场景，`@each`（遍历数据）或 `@for`（按次数）都能更清晰地表达。只有当循环步进不是简单等差、或终止条件复杂时才考虑 `@while`。
:::

## 五、实战：用循环生成一套间距工具类

把 map + `@each` + 插值组合起来，是生成设计系统工具类的标准做法：

```scss
$spacers: (0: 0, 1: 4px, 2: 8px, 3: 16px, 4: 24px);

@each $key, $val in $spacers {
  .m-#{$key}  { margin: $val; }
  .mt-#{$key} { margin-top: $val; }
  .p-#{$key}  { padding: $val; }
  .px-#{$key} { padding-left: $val; padding-right: $val; }
}
```

一份 map 即可驱动出几十个一致的工具类，改设计令牌只需改 map——这正是 Sass 相对手写 CSS 的工程化价值所在。

---

控制流掌握后，进入 [模块系统 @use/@forward](./module-system)：命名空间加载、`as`/`show`/`hide`/`with`、私有成员，以及 `@import` 的弃用时间线与迁移。
