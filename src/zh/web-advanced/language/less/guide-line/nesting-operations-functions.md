---
layout: doc
outline: [2, 3]
---

# 嵌套、运算与函数：`&` 组合、数学模式与内置函数

> 基于 Less 4.6.7 · 核于 2026-07

## 速查

- **嵌套**：`.a { .b {} }` → `.a .b`；层级别超 3 层。
- **父选择器 `&`**：`&:hover` → `a:hover`；`&--x` → `.blk--x`（BEM）；`.no-js &` → 把父级放到 `.no-js` 之后。
- **多个 `&`**：`&&` → `.link.link`（复合类，提权重）；`& &` → `.link .link`（后代）；`& + &` → `.link + .link`（相邻兄弟）。
- **运算**：`+ - *` 作用于数字/颜色/变量；带单位自动转换（`2cm + 3mm` → `2.3cm`）；无单位与带单位相加取带单位者。
- **v4 数学模式**：默认 `parens-division`——**只有除法 `/` 需括号**，加减乘直接算。`parens`/strict = 所有运算都要括号；`always` = 全部直接算（v3 旧默认）。
- **`calc()`**：Less 保留 `calc()` 交由浏览器运行时计算；内部变量用插值或直接引用。
- **颜色函数**：定义 `rgb/rgba/hsl/hsla`；通道 `hue/saturation/lightness/alpha/luma`；操作 `lighten/darken/saturate/desaturate/fade/fadein/fadeout/spin/mix/tint/shade/greyscale/contrast`；混合 `multiply/screen/overlay/difference` 等。
- **其它函数**：字符串 `e`/`escape`/`replace`/`%()`；列表 `length`/`extract`/`range`/`each`；数学 `ceil/floor/round/percentage/min/max/pow/sqrt/abs`；类型 `isnumber/iscolor/...`；杂项 `if`/`boolean`/`unit`/`convert`/`data-uri`/`default`。
- **合并 merge**：`prop+:` 逗号连接多值、`prop+_:` 空格连接多值。
- **转义 `~"..."`**：原样输出、不做 Less 解析（媒体查询条件、含特殊字符的字符串）。

## 一、父选择器 `&` 的多种组合

`&` 代表父选择器，可以出现多次、也可放在选择器**后面**改变拼接顺序：

```less
.link {
  & + & { margin-left: 8px; }   // .link + .link（相邻兄弟）
  && { font-weight: bold; }       // .link.link（同元素复合类，提权重）
  & & { opacity: .6; }            // .link .link（后代）
}

.header .menu {
  .no-borderradius & { border-radius: 0; }
  // → .no-borderradius .header .menu（& 在后 → 把父级整体前置到 .no-borderradius 之后）
}
```

逗号分隔的选择器与 `&` 组合会展开**所有排列**：

```less
p, a {
  & + & { color: red; }
  // 展开成 p+p, p+a, a+p, a+a 全部组合
}
```

## 二、运算：数字、单位与颜色

Less 支持 `+ - * /` 作用于数字、颜色与变量，并**自动处理单位换算**：

```less
@base: 16px;
.ops {
  width: @base * 2;      // 32px
  gap: @base + 4;        // 20px（无单位跟随带单位者 → px）
  size: 2cm + 3mm;       // 2.3cm（兼容单位自动换算，结果取第一个操作数单位）
  color: #224488 / 2;    // 各通道整除 → #112244
}
```

::: warning 单位不兼容
`2px + 3em` 这类不兼容单位相加，默认可能给出「以第一个单位强行相加」的可疑结果。开启严格单位模式（`--strict-units` / `strictUnits: true`）后会**报错**，帮你在编译期发现单位错误。
:::

## 三、v4 数学模式：除法为何需要括号

Less 4 把默认数学模式从 v3 的 `always` 改成了 **`parens-division`**。三种模式对比：

| 模式 | `+ - *` | `/` 除法 | 说明 |
| --- | --- | --- | --- |
| `always`（v3 默认） | 直接算 | 直接算 | 会把 `font: 14px/1.5` 里的斜杠误当除法 |
| **`parens-division`（v4 默认）** | 直接算 | **需括号** | 裸斜杠原样保留，`(a / b)` 才做除法 |
| `parens` / strict | **需括号** | 需括号 | 所有运算都要 `( )`，最保守 |

```less
// v4 默认 parens-division 下：
.a { width: 3 + 5; }         // 8
.b { width: 100px / 4; }     // 100px / 4（原样保留！）
.c { width: (100px / 4); }   // 25px（加括号才算）
.d { font: 14px/1.5 sans-serif; }   // 保留斜杠，不被误算
```

改成 `parens-division` 的根本动机是**消除 `/` 的歧义**：CSS 里 `/` 大量用于简写分隔（`font: 字号/行高`、`aspect-ratio: 16/9`、`grid-row: 1/3`），而非除法。让裸斜杠原样保留、只有显式括号才做除法，既安全又保留了运算能力。

### `calc()` 交互

Less 不会去计算 `calc()` 内部（交给浏览器运行时），但你可以在其中用插值或变量：

```less
@gap: 16px;
.grid { width: calc(100% - @gap); }   // 变量被替换，calc 保留给浏览器
```

## 四、内置函数速览

Less 内置函数按类别记：

- **颜色定义**：`rgb` `rgba` `argb` `hsl` `hsla` `hsv` `hsva`
- **颜色通道**：`hue` `saturation` `lightness` `red` `green` `blue` `alpha` `luma` `luminance`
- **颜色操作**：`saturate` `desaturate` `lighten` `darken` `fadein` `fadeout` `fade` `spin` `mix` `tint` `shade` `greyscale` `contrast`
- **颜色混合**：`multiply` `screen` `overlay` `softlight` `hardlight` `difference` `exclusion` `average` `negation`
- **数学**：`ceil` `floor` `round` `percentage` `sqrt` `abs` `pow` `mod` `min` `max` `pi`
- **字符串**：`escape` `e`（编译期转义）、`%("fmt", ...)`（格式化）、`replace`
- **列表**：`length` `extract`（取第 n 项）、`range` `each`
- **类型**：`isnumber` `iscolor` `isstring` `iskeyword` `isurl` `ispixel` `isem` `ispercentage` `isunit` `isruleset` `isdefined`
- **杂项**：`if(条件, 真值, 假值)`、`boolean` `unit` `get-unit` `convert` `data-uri` `svg-gradient` `default` `color`

```less
.demo {
  width: percentage(0.5);          // 50%
  size: unit(@base, rem);          // 换单位
  color: if(iscolor(@c), @c, #000);
  content: e("no-quotes");         // 去引号
}
```

::: tip 颜色函数链式顺序
官方提示：`saturate(spin(#aaa, 10), 10%)` 这类**顺序不当会损失色彩保真**，建议改成 `spin(saturate(#aaa, 10%), 10)`——先做饱和度类操作、再转色相，减少中间色彩空间转换的信息损失。图像尺寸类函数（`image-size`/`image-width`）需要 Node 环境。
:::

## 五、合并 merge 与转义 `~"..."`

**合并**允许多处向同一属性追加值，避免相互覆盖：

```less
.mixin() {
  box-shadow+: inset 0 0 10px #555;   // +:  逗号连接
  transform+_: scale(2);              // +_: 空格连接
}
.box {
  .mixin();
  box-shadow+: 0 0 20px black;        // 逗号追加 → 两条阴影
}
```

**转义 `~"..."`** 把引号内内容原样输出、不做 Less 解析，常用于媒体查询条件或含特殊字符的字符串：

```less
@query: ~"(min-width: 768px)";
@media @query { .a { display: flex; } }
```

---

嵌套、运算与函数走完，进入 [导入、命名空间与组织](./import-and-organization)：`@import` 的精细选项、命名空间、映射查找、脱离规则集与 `:extend`，看 Less 如何做模块化组织。
