---
layout: doc
outline: [2, 3]
---

# 混合、守卫与循环：Less 的复用与逻辑

> 基于 Less 4.6.7 · 核于 2026-07

## 速查

- **定义/调用**：`.card() { ... }` 定义、`.card();` 调用，**括号必需**；带括号定义**不单独输出**到 CSS。
- **参数化**：`.radius(@r) {}`；**默认值** `.radius(@r: 4px)`；**命名参数**（分号分隔、可乱序）`.m(@color: red; @size: 12px)`；**剩余参数** `.m(@a; @rest...)`。
- **`@arguments`**：混合体内代表**全部入参**（空格连接），如 `box-shadow: @arguments;`。
- **`!important`**：`.mixin() !important;` 把混合展开出的所有声明都标记为 important。
- **守卫 `when`**：`.m(@a) when (条件) {}`，条件真才生效；只有 `true` 是真值。
- **守卫逻辑**：`and` = 且；逗号 `,` = 或；`not` = 非。比较符 `>` `>=` `=` `<`。
- **类型守卫函数**：`isnumber` `iscolor` `isstring` `iskeyword` `isurl` `ispixel` `isem` `ispercentage` `isunit`；`default()` 仅在守卫内做「兜底匹配」。
- **CSS 守卫**：把 `when` 直接加在选择器上：`button when (@flag = true) {}`——整条规则条件输出。
- **模式匹配**：同名混合按「参数个数/字面量」选择匹配版本，如 `.m(dark, @c)` / `.m(light, @c)`。
- **混合当函数**（v3.5+）：取混合内部变量当返回值 `padding: .avg(16px, 50px)[@result];`。
- **循环**：Less 无 `@for/@while`；用**递归守卫混合**或 `each(@list, {...})`（3.7+）在编译期展开。

## 一、参数、默认值、命名与剩余参数

```less
// 参数 + 默认值
.border-radius(@radius: 5px) {
  border-radius: @radius;
}

// 命名参数：分号分隔、可乱序、可只传部分
.box(@margin: 20px; @color: #333) {
  margin: @margin;
  color: @color;
}
.a { .box(@color: #f00); }   // margin 用默认 20px，color 传 #f00

// 剩余参数：收集其余全部参数为列表
.transition(@rest...) {
  transition: @rest;
}
.b { .transition(color .2s, background .3s); }
```

- **默认值**让混合可无参调用；**命名参数**在参数多时更清晰，注意用**分号**分隔以避开值内逗号；**剩余参数** `@rest...` 承接可变数量入参。
- `@arguments` 代表全部入参、按空格连接，常直接铺给多值属性：

```less
.box-shadow(@x: 0; @y: 0; @blur: 1px; @color: #000) {
  box-shadow: @arguments;   // 把四个参数原样铺给 box-shadow
}
```

## 二、`!important` 与混合展开

在调用后加 `!important`，会把混合展开出的**所有声明**都标记为 important：

```less
.important-mixin() {
  color: red;
  font-weight: bold;
}
.foo { .important-mixin() !important; }
// → color: red !important; font-weight: bold !important;
```

::: warning 慎用 !important
批量 important 会污染优先级、给后续覆盖埋雷。它只应作为极少数「必须压过第三方样式」的兜底手段。
:::

## 三、守卫 `when`：Less 的条件表达

Less 没有 `@if`/`@else` 指令，条件靠**混合守卫**：`when (...)` 为真时混合才被应用。

```less
.text-contrast(@bg) when (lightness(@bg) >= 50%) {
  color: #000;   // 背景偏亮 → 用黑字
}
.text-contrast(@bg) when (lightness(@bg) < 50%) {
  color: #fff;   // 背景偏暗 → 用白字
}
.panel { .text-contrast(#eee); }   // → color: #000;
```

守卫的逻辑组合：

```less
// and = 且
.m(@a) when (isnumber(@a)) and (@a > 0) { ... }

// 逗号 = 或（任一为真即匹配）
.m(@a) when (@a > 100), (@a < 0) { ... }

// not = 非
.m(@a) when not (@a > 0) { ... }
```

- 比较运算符：`>`、`>=`、`=`、`<`（`=` 也可与 `<`/`>` 组合）。
- 守卫里**只有 `true` 是真值**，其它值都视为不匹配。
- 类型判断函数：`isnumber` / `iscolor` / `isstring` / `iskeyword` / `isurl` / `ispixel` / `isem` / `ispercentage` / `isunit` 等；`default()` 只能用在守卫里，表示「其它匹配都不成立时的兜底」。

## 四、CSS 守卫：给整条规则加条件

把 `when` 直接加在**选择器**上（而非混合定义上），条件为真时整条规则才输出——相当于「对一段 CSS 块做 if」：

```less
@theme: dark;
.navbar when (@theme = dark) {
  background: #1a1a1a;
  color: #fff;
}
```

它是 Less 缺少 `@if` 指令时，表达「按开关产出不同规则」的替代方式。

## 五、模式匹配：同名混合的多态

定义多个同名混合，Less 会按「参数个数 + 字面量匹配」选择合适的版本——第一个参数传字面量（关键字）时尤其有用：

```less
.setColor(dark, @c) { color: darken(@c, 10%); }
.setColor(light, @c) { color: lighten(@c, 10%); }
.setColor(@_, @c)   { display: block; }   // @_ 通配，任何调用都会匹配

.a { .setColor(dark, #1677ff); }   // 命中第 1、3 个
```

`@_` 作为「通配位」，让某些声明对所有调用都生效，常用于放公共部分。

## 六、混合当函数用：取回「返回值」（v3.5+）

Less 没有 `@function` 指令，但可以「调用混合并取其内部变量」当返回值：

```less
.average(@a, @b) {
  @result: ((@a + @b) / 2);
}
.box {
  padding: .average(16px, 50px)[@result];   // → 33px
}
```

`[@result]` 取的是混合内部同名变量的值，弥补了缺少 `@function` 的复用需求。

## 七、Less 怎么「循环」

没有 `@for`/`@while`，两种主流手段：

### 递归守卫混合

混合自我调用，用守卫做终止条件与计数递减：

```less
.gen-cols(@n) when (@n > 0) {
  .col-@{n} { width: (@n * 100% / 12); }
  .gen-cols(@n - 1);   // 递归，计数减 1
}
.gen-cols(0) {}         // 终止条件
.gen-cols(12);          // 生成 .col-1 ~ .col-12
```

### `each()` 函数（3.7+）

遍历列表或映射，内部可用 `@value` / `@key` / `@index`：

```less
@sizes: sm 12px, md 16px, lg 20px;
each(@sizes, {
  .text-@{value} { }   // 也可结合下标取子项
});
```

::: tip 选择建议
简单序列（如栅格 1～12）用递归守卫混合直观；遍历「已有列表/映射」用 `each()` 更清晰。两者都在**编译期**展开成多条静态规则。
:::

---

复用与逻辑讲透后，进入 [嵌套、运算与函数](./nesting-operations-functions)：`&` 的多种组合、v4 数学模式、颜色/字符串/列表函数、`merge` 合并与 `~"..."` 转义。
