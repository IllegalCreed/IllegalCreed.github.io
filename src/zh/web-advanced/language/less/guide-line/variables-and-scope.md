---
layout: doc
outline: [2, 3]
---

# 变量、作用域与插值：Less 最反直觉的一层

> 基于 Less 4.6.7 · 核于 2026-07

## 速查

- **声明/取值**：`@color: #1677ff;` 声明；`color: @color;` 取值。前缀 `@`（对比 Sass `$`）。
- **惰性求值**：变量**可先用后声明**，Less 在需要时才解析。
- **最后定义生效**：同一作用域内多次定义同名变量，**整个作用域取最后一次的值**（非逐行覆盖）。
- **词法作用域**：变量从**当前作用域向外**查找；内层可覆盖外层同名变量，只在内层生效。
- **插值 `@{var}`**：把变量嵌进**选择器名/属性名/URL/import 路径/字符串**：`.@{name} {}`、`@{prop}: red;`、`url("@{path}/a.png")`、`@import "@{theme}.less";`。取值处仍用 `@var`。
- **变量变量 `@@name`**：先取 `@name` 的值当作变量名，再取同名变量——间接/动态取值。
- **属性作为变量 `$prop`**（v3.0+）：取当前规则内同名 CSS 属性最后设置的值，如 `background: $color;`。
- **`@var` ≠ `--var`**：Less 变量是**编译期静态替换**；CSS 自定义属性是**运行时、可级联、可被 JS 改**。可 `--c: @c;` 把 Less 值烘焙进运行时变量。
- **私有作用域技巧**：用 `& { ... }` 包裹可把变量隔离在一个块内，避免泄漏。

## 一、声明与惰性求值

Less 变量用 `@` 前缀声明，用 `@var` 取值：

```less
@link-color: #428bca;
a { color: @link-color; }
```

**惰性求值（lazy evaluation）**：变量不必先声明后使用——下面的写法完全合法，`.lazy` 会取到 `@var` 最终解析出的 `white`：

```less
.lazy-eval {
  @var: @a;   // 此刻 @a 还没定义，也没关系
  @a: 100%;
}
// @var 用到时才解析，得到 100%
```

## 二、最后定义生效：一个高频坑

因为惰性求值，Less 在同一作用域内多次定义同名变量时，**整个作用域都采用最后一次的定义**，而不是「逐行覆盖」：

```less
@var: 0;
.class {
  @var: 1;
  .brass {
    @var: 2;
    three: @var;   // 3 —— 取本作用域最后一次定义
    @var: 3;
  }
  one: @var;        // 1 —— 取 .class 作用域最后一次定义
}
```

::: warning 与命令式直觉相反
如果你带着 JS/Sass 的「从上到下逐行赋值」直觉，会以为 `one` 是先前的值。实际上 Less 先扫描整个作用域、取最后一次定义。想要「顺序覆盖」的效果，请拆分作用域或改用参数传递。
:::

## 三、作用域：由内向外查找

Less 变量遵循**词法作用域**：解析一个变量时，从**当前作用域**开始，逐层向外查找，直到找到定义。内层可以定义同名变量覆盖外层，且只在内层生效：

```less
@color: black;
.outer {
  @color: blue;
  .inner { color: @color; }   // blue（就近取 .outer 的定义）
}
.other { color: @color; }     // black（取全局）
```

官方还提供一个「私有作用域」技巧：用 `& { ... }` 包一层，可把内部变量与全局隔离，避免命名泄漏：

```less
& {
  @private: 100px;
  .test { height: @private; }
}
// 这里访问不到 @private
```

## 四、变量插值 `@{var}`：嵌进名字与字符串

普通「取值」直接写 `@var`；但要把变量嵌进**选择器名、属性名、URL、import 路径、字符串**这类「名字/字符串上下文」，必须用花括号插值 `@{var}`：

```less
@my-selector: banner;
@images: "../img";
@property: color;
@themes: "../themes";

// 选择器名
.@{my-selector} { font-weight: bold; }   // → .banner { ... }

// 属性名
.widget { @{property}: #0ee; }            // → color: #0ee;

// URL
.logo { background: url("@{images}/logo.png"); }

// import 路径
@import "@{themes}/tidal-wave.less";
```

::: tip 记住分工
- **取值** → `@var`（如 `color: @var;`）
- **嵌名字/字符串** → `@{var}`（如 `.@{var} {}`、`url("@{var}")`）

误在取值处写 `@{var}`、或在名字处写 `@var`，都得不到预期结果。这是插值最常见的困惑点。
:::

## 五、变量变量 `@@name`：间接取值

`@@` 双 at 符号做「变量的变量」——先解析里层变量得到一个「名字」，再用这个名字去取变量的值：

```less
@primary: #1677ff;
@theme: primary;      // @theme 的值是「primary」这个名字

.btn { color: @@theme; }   // @@theme → 取 @primary → #1677ff
```

它适合按开关/主题名动态选取变量，属于「元编程」式用法，但也会降低可读性，慎用。

## 六、属性作为变量 `$prop`（v3.0+）

`$prop` 引用「**当前规则里同名 CSS 属性最后设置的值**」——注意这里的 `$` 语义是「取属性值」，和 Less 变量 `@`、Sass 变量 `$` 都不同：

```less
.widget {
  color: #efefef;
  background-color: $color;   // 取本规则里 color 的值 → #efefef
}
```

## 七、`@var` 与 CSS 自定义属性 `--var` 的本质区别

这是最需要辨清的一点：

| 维度 | Less 变量 `@var` | CSS 自定义属性 `--var` |
| --- | --- | --- |
| 生效时机 | **编译期**（静态替换） | **运行时** |
| 产物 CSS 里是否保留 | 否（已被替换成值） | 是（`--var` 与 `var()` 都在） |
| 参与级联 / 媒体查询 | 否 | 是（可在不同上下文取不同值） |
| 能否被 JS 动态改 | 否 | 是（`el.style.setProperty`） |
| 作用域 | 词法（编译期） | DOM 树（运行时继承） |

两者可以**配合**：把 Less 变量的值「烘焙」进一个运行时自定义属性，兼得编译期组织与运行时动态：

```less
@brand: #1677ff;
:root {
  --brand: @brand;   // 编译后 → --brand: #1677ff;
}
.btn { background: var(--brand); }  // 运行时可被 JS/主题切换覆盖
```

::: danger 别把 `@var` 当运行时变量
`@primary` 编译后就消失了，运行时无法通过它做主题切换。要运行时切主题，请落到 `--var` 或 `modifyVars`（浏览器端 less.js）方案上。
:::

---

变量与作用域理清后，进入 [混合、守卫与循环](./mixins-and-guards)：参数化混合、默认/命名/rest 参数、`!important`、守卫 `when` 与逻辑组合、CSS 守卫、模式匹配、混合当函数、以及 Less 如何「循环」。
