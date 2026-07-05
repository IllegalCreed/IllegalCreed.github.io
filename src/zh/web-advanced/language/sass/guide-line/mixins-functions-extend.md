---
layout: doc
outline: [2, 3]
---

# mixin、函数与 @extend

> 基于 Dart Sass 1.101.0 · 核于 2026-07

## 速查

- **三大复用机制**：`@mixin`（产出样式块）、`@function`（计算返回值）、`@extend`（继承/合并选择器）。核心区别——**函数算值、mixin 出样式、@extend 并选择器**。
- **`@mixin`/`@include`**：`@mixin name { ... }` 定义，`@include name` 引入；带参 `@mixin name($a, $b)`。
- **参数默认值**：`@mixin square($size, $radius: 0)`，让参数可选；默认值可为任意表达式、可引用前面的参数。
- **关键字参数**：`@include square(40px, $radius: 4px)`，按名传参、可读性好、可跳过中间的默认参数。
- **可变参数**：`@mixin box($args...)` 收集多个位置实参为列表；调用处 `@include box($list...)` 则是**展开**列表/映射。
- **捕获关键字参数**：`meta.keywords($args)` 把额外的关键字实参取成一个 map（需 `@use 'sass:meta'`）。
- **`@content`**：mixin 里的占位，接收 `@include name { ... }` 传入的样式块；可用 `@content($x)` 传参、调用端 `using ($x)` 接收。
- **`@function`/`@return`**：`@function fn($a) { @return ...; }`；`@return` 立即结束并返回。函数名**不能以 `--` 开头**。
- ⚠️ **函数拼错名不报错**：未知函数会被当**普通 CSS 函数**原样输出，建议对产物跑 CSS lint。
- **`@extend`**：`@extend .base` 让当前选择器继承 `.base`，编译时把选择器**并入** `.base` 的规则（`.base, .cur { ... }`），而非复制样式。
- **占位符 `%`**：`%base { ... }` 只在被 `@extend` 时才输出，自身不产出 CSS——纯复用基座。
- **`@extend` 限制**：只能扩展**简单选择器**（`.a.b`、`.x .y` 复合/后代选择器不行）；**不能跨 `@media`**；用 `@extend .x !optional` 可在目标不存在时不报错。
- **`@extend` vs mixin**：`@extend` 表达「是一种…」语义、产物紧凑但会牵连全局；mixin 更独立、可传参、无耦合。现代压缩对重复 CSS 处理良好，**按语义选，别只为省体积**。

## 一、`@mixin` 与 `@include`

### 定义与引入

```scss
@mixin reset-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

nav ul {
  @include reset-list;   // 展开 mixin 的样式
}
```

### 参数、默认值与关键字参数

```scss
// $radius 有默认值 → 可选参数
@mixin square($size, $radius: 0) {
  width: $size;
  height: $size;
  border-radius: $radius;
}

.avatar {
  @include square(48px, $radius: 8px);  // 关键字参数，按名传
}

.thumb {
  @include square(64px);                // 省略 $radius，取默认 0
}
```

默认值可以是任意 SassScript 表达式，甚至能引用**前面的参数**。关键字参数（`$radius: 8px`）在参数多、含义不直观时能显著提升可读性。

### 可变参数与展开

参数名后跟 `...` 表示**可变参数**——把调用时多余的位置实参收集成一个列表：

```scss
@mixin shadows($shadows...) {
  box-shadow: $shadows;         // $shadows 是一个列表
}
.card { @include shadows(0 1px 2px #0002, 0 4px 8px #0001); }
```

反过来，把 `...` 放在**调用处**的实参上，是把列表/映射**展开**成多个实参：

```scss
$corner: 4px, 8px, 8px, 4px;
.box { @include square(100px, $corner...); } // 展开传入
```

要捕获额外的**关键字**实参，用 `sass:meta` 的 `meta.keywords()` 取成 map：

```scss
@use 'sass:meta';

@mixin syntax-colors($args...) {
  @each $name, $color in meta.keywords($args) {
    pre span.stx-#{$name} { color: $color; }
  }
}
@include syntax-colors($string: #080, $comment: #888);
```

### `@content`：把样式块传进 mixin

`@content` 是占位，接收 `@include` 时以花括号传入的样式：

```scss
@mixin on-hover {
  &:not([disabled]):hover { @content; }
}

.button {
  @include on-hover {
    border-width: 2px;      // 这段被塞进 @content 位置
  }
}
```

进阶：mixin 可用 `@content($x)` 给内容块**传参**，调用端用 `using ($x)` 接收——常用于把当前上下文（如媒体类型）传进外部样式：

```scss
@mixin media($types...) {
  @each $type in $types {
    @media #{$type} { @content($type); }
  }
}

@include media(screen, print) using ($type) {
  h1 {
    font-size: 40px;
    @if $type == print { font-family: "Calluna", serif; }
  }
}
```

## 二、`@function` 与 `@return`

函数用于**计算并返回一个值**，供表达式使用。用 `@function` 定义、`@return` 返回：

```scss
@use 'sass:math';

// 把 px 换算成 rem（基准 16px）
@function rem($px, $base: 16px) {
  @return math.div($px, $base) * 1rem;
}

.title { font-size: rem(24px); }   // → 1.5rem
```

`@return` 会**立即结束函数**并返回，可用于提前处理边界情况。函数体只能包含通用语句（变量、控制流等）加 `@return`，不能产出样式声明。

::: warning 函数名与「拼错不报错」
函数名可以是任意 Sass 标识符，但**不能以 `--` 开头**。另外要小心：如果调用了一个 Sass 不认识的函数（比如把 `math.div` 拼错），Sass 会把它当成**普通 CSS 函数**原样输出到 CSS 里、而**不报错**。所以建议对编译产物跑一遍 CSS lint。
:::

### 函数 vs mixin：怎么选

| | `@function` | `@mixin` |
| --- | --- | --- |
| 产物 | 一个**值**（用于表达式） | 一段**样式声明**（`@include` 展开） |
| 用途 | 单位换算、颜色计算、列表/映射处理 | 复用样式模式、包裹 `@content` |
| 关键字 | `@return` | `@content`（可选） |

官方建议：**函数只用来算值**，不要在函数里搞样式副作用（如设全局变量当返回值用）；需要产出样式就用 mixin。

## 三、`@extend` 与占位符 `%`

### `@extend`：继承与选择器合并

`@extend` 让一个选择器继承另一个选择器的样式。它**不复制样式**，而是把当前选择器**并入**被继承者的选择器列表：

```scss
.error {
  border: 1px solid #f00;
  background: #fdd;
}

.error--serious {
  @extend .error;
  border-width: 3px;
}
```

编译后 `.error` 的规则被追加 `.error--serious`：

```css
.error, .error--serious {
  border: 1px solid #f00;
  background: #fdd;
}
.error--serious { border-width: 3px; }
```

因为是「按选择器合并」，`@extend .error` 会让当前元素在**所有出现 `.error` 的地方**（含 `.error:hover` 等）都被视作匹配——这是它的威力，也是它的坑。

### 占位符选择器 `%`

占位符以 `%` 开头，**专为被 `@extend` 而生**：它自身不会出现在编译后的 CSS 里，只有被继承时样式才附着到继承它的选择器上。适合定义可复用的「样式基座」而不产生无用类：

```scss
%card-base {
  border-radius: 8px;
  box-shadow: 0 1px 3px #0002;
}

.product-card { @extend %card-base; }
.user-card    { @extend %card-base; }
// 输出里没有 %card-base，只有 .product-card, .user-card { ... }
```

以 `-`/`_` 开头的占位符（如 `%-private`）是私有的，只能在定义它的文件内被 `@extend`。

### `@extend` 的三个限制

```scss
// 1) 只能扩展「简单选择器」，复合/后代选择器非法
.x {
  @extend .a.b;   // ❌ 报错：不能扩展复合选择器
  @extend .p .q;  // ❌ 报错：不能扩展后代选择器
}

// 2) 目标不存在会报错，加 !optional 可容忍
.y { @extend .maybe-missing !optional; }  // 不存在也不报错

// 3) 不能跨 @media 边界继承外部规则
@media screen {
  .z { @extend .error; }  // ❌ 若 .error 定义在 @media 外 → 报错
}
```

此外在模块系统下，`@extend` 只影响通过 `@use`/`@forward` 引入的**上游模块**里的规则，不会反向影响下游——这让继承范围可控（对比 `@import` 时代 `@extend` 全局生效、不可预测）。

### `@extend` vs mixin：按语义选

- 用 `@extend`：当存在**「A 是一种 B」的语义关系**（`.error--serious` 是一种 `.error`），且不需要参数化。产物更紧凑。
- 用 mixin：需要**传参**、想要**独立不耦合**、或涉及 `@media`（`@extend` 跨不了）。

官方特别提醒：现代压缩算法对重复 CSS 片段处理得很好，**不要单纯为了「减少重复字节」而硬上 `@extend`**——应按语义清晰度与可预测性来选。很多团队因 `@extend` 的隐式牵连而更偏向 mixin。

---

复用机制掌握后，进入 [控制流](./control-flow)：`@if`/`@else`、`@each`（含 map 解构）、`@for`（`through` vs `to`）、`@while`，以及用它们批量生成样式的实战套路。
