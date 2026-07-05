---
layout: doc
outline: [2, 3]
---

# 入门：定位、四大特性与编译方式

> 基于 Less 4.6.7 · 核于 2026-07

## 速查

- **定位**：Less = **向后兼容 CSS 的预处理器**，由 **JavaScript 实现**，编译期把 `.less` 转成**标准 CSS**；合法 CSS 基本都是合法 Less。
- **变量**：`@` 前缀（对比 Sass 用 `$`）：`@color: #1677ff;`，取值 `color: @color;`。**惰性求值**（可先用后声明）+ 同作用域**最后定义生效**。
- **变量插值**：把变量嵌进选择器名/属性名/URL/import 路径等**字符串上下文**，用 `@{var}`：`.@{name} {}`；普通取值直接 `@var`。
- **嵌套 + 父选择器 `&`**：`.a { .b {} }` → `.a .b`；`.btn { &--primary {} }` → `.btn--primary`（BEM）；`a { &:hover {} }` → `a:hover`。
- **混合 mixin**：定义 `.card() { ... }`、调用 `.card();`——**括号必需**（无括号写法已 deprecated）。带括号的定义**不单独输出**到 CSS，只在调用处展开。
- **参数化混合**：`.radius(@r: 4px) { border-radius: @r; }`，调用 `.radius(8px);`；`@arguments` 代表全部入参。
- **运算**：`+ - *` 直接算（`3 + 5` → `8`）；**除法 `/` 在 v4 默认 `parens-division` 模式下需括号**：`(@w / 2)`。
- **颜色函数**：`lighten/darken/saturate/fade/spin/mix` 等，如 `darken(@c, 10%)`。
- **注释**：`//` 静默（不输出），`/* */` 保留输出到 CSS。
- **编译**：CLI `lessc src.less out.css`；编程 `less.render(src, opts)`；浏览器 less.js（仅开发）；工程走 `less-loader`/Vite 等构建集成。
- **进阶顺序**：本页 → [变量、作用域与插值](./guide-line/variables-and-scope) → [混合、守卫与循环](./guide-line/mixins-and-guards) → [嵌套、运算与函数](./guide-line/nesting-operations-functions) → [导入、命名空间与组织](./guide-line/import-and-organization) → [Less vs Sass 与选型](./guide-line/less-vs-sass) → [参考](./reference)。

## 一、Less 是什么：定位与心智

Less（**Le**aner **S**tyle **S**heets）是一门 **CSS 预处理器**：你用一套「加了变量、混合、嵌套、运算」的增强语法写样式，再由 Less 编译器输出成浏览器能认的**标准 CSS**。

三条心智先立住：

1. **它是 CSS 的「向后兼容扩展」**——官方原话 backwards-compatible language extension for CSS。几乎所有合法 CSS 都是合法 Less，迁移成本极低。
2. **它由 JavaScript 实现**——编译器本身是 JS，可跑在 Node（`lessc`、编程 API）与浏览器（less.js）。这也是它与「用 Dart 实现的 Sass」「用 Ruby 实现的旧 Sass」的实现层区别。
3. **它是编译期工具**——变量、嵌套、混合都在**编译时**被解析掉，产物 CSS 里不再有 Less 语法。它**不是**运行时 CSS-in-JS，也**不是**浏览器原生方言。

::: tip 与原生 CSS / 自定义属性的边界
`@var` 是**编译期**变量：编译后被替换成静态值，产物里看不到它，也不能被 JS 或级联改变。CSS 的 `--var` / `var()` 是**运行时**自定义属性：保留在 CSS 里、参与级联、可被 JS 动态改。二者本质不同，别混为一谈（详见[变量页](./guide-line/variables-and-scope)）。
:::

## 二、变量：`@` 前缀与最反直觉的语义

Less 变量以 `@` 开头（这是与 Sass `$` 的标志性差异）：

```less
@primary: #1677ff;
@radius: 4px;

.button {
  color: @primary;
  border-radius: @radius;
}
```

两条容易踩的语义：

- **惰性求值**：变量「不必先声明后使用」，可以先引用、后定义，Less 在需要时才解析。
- **最后定义生效**：同一作用域内多次定义同名变量，**整个作用域采用最后一次的值**——这与命令式语言「逐行覆盖」的直觉相反：

```less
@x: 1;
.a { width: @x; }  // 结果是 3，不是 1
@x: 3;
```

## 三、嵌套与父选择器 `&`

嵌套让样式跟随结构层级书写，`&` 代表父选择器：

```less
.card {
  padding: 16px;

  .title { font-weight: 600; }   // → .card .title（后代）

  &:hover { box-shadow: 0 2px 8px rgba(0,0,0,.1); }  // → .card:hover
  &--active { border-color: @primary; }              // → .card--active（BEM 修饰符）
}
```

- 无 `&`：拼成**后代选择器**（多一个空格）。
- 有 `&`：贴合成伪类 / 伪元素 / 状态类 / BEM 修饰符。

::: warning 嵌套别太深
嵌套 3 层以上会生成又长又脆的选择器、抬高优先级、难以覆盖。经验上控制在 2～3 层，多用 `&` 平铺 BEM，而非深挖层级。
:::

## 四、混合（mixin）：复用样式片段

混合把一段声明复用到多处，定义与调用**都带括号**：

```less
// 定义（带括号 → 不单独输出到 CSS）
.ellipsis() {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

// 参数化混合 + 默认值
.radius(@r: 4px) {
  border-radius: @r;
}

.title {
  .ellipsis();     // 展开三行声明
  .radius(8px);    // → border-radius: 8px;
}
```

- **括号必需**：`.radius()` 是现代写法；不带括号的 `.radius`（optional parentheses）已被官方标注 deprecated。
- **不污染产物**：带括号的定义不会作为独立规则输出，只在被调用处展开。
- `@arguments` 在混合体内代表**全部入参**（按空格连接），如 `box-shadow: @arguments;`。

## 五、运算与颜色函数

```less
@base: 16px;
.box {
  width: @base * 2;        // 32px（乘法直接算）
  height: @base + 4px;     // 20px（加法直接算）
  margin: (@base / 2);     // 8px（除法需括号，v4 默认 parens-division）
  background: darken(#1677ff, 10%);   // 颜色调暗
}
```

- **加减乘无需括号**即计算；**除法 `/` 需括号**（v4 默认模式保护 `font: 14px/1.5` 这类 CSS 简写不被误算）。
- 颜色函数丰富：`lighten` / `darken`（调亮度）、`saturate` / `desaturate`（调饱和度）、`fade` / `fadeout`（调透明度）、`spin`（转色相）、`mix`（混色）等。

## 六、怎么把 Less 编译成 CSS

Less 是 JS 实现，运行方式有三类：

```bash
# 1) 命令行（全局或项目安装 less）
lessc styles.less styles.css
lessc --source-map styles.less styles.css   # 带 source map
```

```js
// 2) Node 编程式
const less = require("less");
const { css } = await less.render("@c: red; .a{ color:@c; }");
```

```html
<!-- 3) 浏览器端（仅开发用，生产请预编译） -->
<link rel="stylesheet/less" type="text/css" href="styles.less" />
<script src="less.js"></script>
```

工程实践里更常见的是通过构建工具集成：webpack 的 **less-loader**、Vite 内置的 Less 支持（装 `less` 即可）、gulp-less 等。

---

打好地基后，下一步进入 [变量、作用域与插值](./guide-line/variables-and-scope)：把惰性求值、最后定义生效、`@{}` 插值、变量变量 `@@`、属性作为变量 `$prop` 与作用域规则一次讲透。
