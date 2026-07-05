---
layout: doc
outline: [2, 3]
---

# 语法、嵌套与变量

> 基于 Dart Sass 1.101.0 · 核于 2026-07

## 速查

- **两种语法等价**：SCSS（`.scss`，花括号+分号，CSS 超集）与缩进语法（`.sass`，缩进+换行）。缩进语法里 mixin 定义用 `=`、引入用 `+`。
- **嵌套**：选择器可按结构层层嵌套，编译展开成后代选择器。嵌套过深会生成又长又强耦合的选择器，**建议不超过 3 层**。
- **`&` 父选择器**：指代外层选择器。用法：伪类 `&:hover`、BEM 后缀 `&__title`/`&--active`、反转上下文 `[dir=rtl] &`。
- ⚠️ **`&` 只能放在复合选择器开头**：`span&` 非法（因为 `&` 可能被替换成 `h1` 这类类型选择器）。
- **SassScript 里的 `&`**：在样式规则内返回当前父选择器（逗号分隔的列表格式）；在样式规则**外返回 `null`**，可用于判断「是否在选择器内」。
- **嵌套属性**：`font: { family: serif; weight: bold; }` 展开成 `font-family`/`font-weight`，把公共前缀成组书写。
- **变量**：`$name: value;`，编译期求值消除。命名用连字符 `kebab-case`。
- **作用域**：顶层变量在模块内全局可见；写在花括号块内的是**局部变量**，同名会**遮蔽（shadow）**全局而不改全局。
- ⚠️ **`@if`/循环块不创建新作用域**：里面对已有变量赋值会直接改外层同名变量。
- **`!default`**：仅当变量未定义或为 `null` 时才赋值（库给默认值、允许被 `with` 覆盖）。
- **`!global`**：在局部作用域内修改**已在顶层声明**的全局变量；**不能**用它新建全局变量。
- **插值 `#{}`**：把变量/表达式的值嵌入选择器、属性名、字符串等位置。

## 一、嵌套与 `&` 父选择器

### 基础嵌套

嵌套让选择器贴合 HTML 结构，编译器自动展开成后代选择器：

```scss
nav {
  ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  li { display: inline-block; }
  a { text-decoration: none; }
}
```

编译后 `nav ul`、`nav li`、`nav a` 各自成规则。

::: warning 嵌套别太深
每多嵌一层，生成的选择器就更长、特异性更高、与 HTML 结构耦合更死。**一般不超过 3 层**，否则维护和覆盖都痛苦。嵌套是组织手段，不是「越深越好」。
:::

### `&` 父选择器的四种主力用法

`&` 指代**外层选择器**，编译时被替换成它。这是 Sass 嵌套里最灵活的一环：

```scss
.button {
  // 1) 拼接伪类 → .button:hover
  &:hover { opacity: 0.8; }

  // 2) BEM 后缀 → .button__icon / .button--primary
  &__icon { margin-right: 4px; }
  &--primary { background: royalblue; }

  // 3) 反转上下文 → [dir=rtl] .button（& 放后面）
  [dir=rtl] & { margin-left: 8px; }

  // 4) 与其它选择器组合 → .button.is-active
  &.is-active { font-weight: bold; }
}
```

::: danger `&` 只能放在复合选择器的开头
因为 `&` 可能被替换成像 `h1` 这样的类型选择器，Sass 规定它只允许出现在复合选择器**开头**。`span&` 这样的写法是非法的（会报错）。想表达「span 且匹配父选择器」得换思路。
:::

### SassScript 里的 `&`

在 mixin/表达式里，`&` 返回当前父选择器（逗号分隔的列表格式）；在**任何样式规则之外**使用，`&` 是 `null`。这可用于写「既能在选择器内、也能在顶层」的 mixin：

```scss
@mixin app-background($color) {
  // 在选择器内就拼 &.app-background，否则单独写 .app-background
  #{if(&, '&.app-background', '.app-background')} {
    background-color: $color;
  }
}
```

## 二、嵌套属性

对于共享同一前缀的成组属性（`font-family`、`font-weight`…），可以用嵌套属性语法把前缀提出来：

```scss
.title {
  font: {
    family: "Iowan Old Style", serif;
    weight: 700;
    size: 2rem;
  }
}
```

编译成：

```css
.title {
  font-family: "Iowan Old Style", serif;
  font-weight: 700;
  font-size: 2rem;
}
```

它纯是书写便利，适合 `font`、`margin`、`background`、`border` 等前缀密集的属性组。

## 三、变量与作用域

### 声明与命名

Sass 变量以 `$` 开头，写法像属性声明，编译期求值后从产物中消除：

```scss
$primary: #c6538c;
$content-width: 960px;
$font-stack: system-ui, sans-serif;
```

Sass 把 `-` 和 `_` 在标识符里视为等价，`$content-width` 与 `$content_width` 指同一变量（历史兼容）。习惯上统一用连字符 `kebab-case`。

### 局部作用域与遮蔽

顶层声明的变量在整个模块可见；写在花括号块（选择器/mixin/函数体）内的是**局部变量**，只在该块内有效。局部变量与全局同名时是**遮蔽（shadowing）**——不改全局：

```scss
$width: 100px;          // 全局

.a {
  $width: 50px;         // 局部，仅遮蔽本块
  width: $width;        // 50px
}

.b {
  width: $width;        // 100px（全局未被改动）
}
```

::: warning 流控块不是新作用域
`@if`、`@each`、`@for`、`@while` 的块**不创建新作用域**。在其中给一个外层已存在的变量赋值，会直接改到外层那个变量上——这常被用来在循环里累加：

```scss
@function sum($numbers...) {
  $total: 0;
  @each $n in $numbers {
    $total: $total + $n;   // 改的是函数作用域里的 $total
  }
  @return $total;
}
```
:::

### `!default`：可被覆盖的默认值

`!default` 表示「仅当变量尚未定义或为 `null` 时才赋此值」。库作者用它给默认值、又允许使用方通过 `@use ... with (...)` 覆盖：

```scss
// _theme.scss（库内）
$primary: #c6538c !default;
$radius: 4px !default;

// 使用方：with 里的值会赢过 !default
@use 'theme' with ($primary: #6b46c1);
```

### `!global`：修改全局变量

默认情况下，在块内给全局同名变量赋值只是遮蔽。要真正改到全局变量，赋值时加 `!global`：

```scss
$theme: light;              // 顶层已声明

@mixin dark-mode {
  $theme: dark !global;     // 改的是全局 $theme
}
```

⚠️ `!global` **只能用于已在文件顶层声明过的变量**，不能用它来「新建」一个全局变量。

## 四、插值 `#{}`

插值把变量/表达式的**值**嵌入到「原本不能直接放变量」的位置：选择器名、属性名、属性值中间、字符串等。

```scss
$name: warning;
$prop: border;
$path: "/assets";

.icon-#{$name} {                 // → .icon-warning
  #{$prop}-color: orange;        // → border-color: orange
  background: url("#{$path}/x.png"); // → url("/assets/x.png")
}
```

::: tip 什么时候需要插值
在属性值里用变量**通常不需要**插值（`width: $w;` 直接可用）。只有当变量要出现在**选择器、属性名、或字符串中间**这些「语法位置」时，才必须用 `#{}` 把它插进去。
:::

---

语法与变量掌握后，进入 [mixin、函数与 @extend](./mixins-functions-extend)：三大复用机制的完整用法与取舍——`@mixin`/`@include`/`@content`、`@function`/`@return`、`@extend` 与占位符 `%`。
