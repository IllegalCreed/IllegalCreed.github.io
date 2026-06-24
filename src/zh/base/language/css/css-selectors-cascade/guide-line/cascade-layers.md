---
layout: doc
outline: [2, 3]
---

# `@layer` 级联层实战

> 基于 CSS 现代标准 · 核于 2026-06

## 速查

- `@layer` 把作者样式切成有序的「层」，**层序压过特异性**——低特异性也能稳赢
- 声明层序：`@layer reset, base, theme, components;`——**先声明的层优先级最低**，后者更高
- 写入层：`@layer reset { … }`；同名层可**多次追加**，按首次声明的位置排座次
- 未分层样式 vs 分层样式：**普通声明里，未分层的永远赢过任何已分层的**（无视特异性）
- `!important` **反转层序**：`!important` 声明里，**先声明的层反而最强**，且分层 `!important` 强于未分层
- 层内：特异性照常规则比；层之间：只看层序，不看特异性
- 嵌套层：`@layer framework { @layer utils {} }` 或点号 `@layer framework.utils { … }`
- 导入即分层：`@import url("lib.css") layer(vendor);`（`@import` 须在样式表最前）
- `revert-layer` 撤销本层声明、露出下层的值
- **Baseline 2022**（广泛可用，2022-03 起）——可放心用于驯服第三方 CSS、组织设计系统

## 为什么需要级联层

特异性是把双刃剑。一旦引入 UI 框架，它内部可能写了 `.dropdown .menu li a`（`0-3-1`）这类高特异性选择器；你想覆盖它，要么写出**更高特异性**的选择器（越写越长、越难维护），要么祭出 `!important`（引发军备竞赛）。两条路都把代码推向失控。

`@layer` 给出第三条路：把样式归入**有序的层**，让**层的先后**直接决定优先级——**与选择器特异性脱钩**。把框架塞进「低层」，你的样式放「高层」或干脆不分层，就能用一个简单的 `.btn` 覆盖框架里 `0-3-1` 的规则，再不必比谁的选择器更长。

## 声明层与层序

最关键的一步：**先用一行语句把层的顺序定下来**。

```css
/* 一次性声明层序——这一行决定了优先级高低 */
@layer reset, base, theme, components, utilities;
```

铁律：**写在前面的层优先级最低，写在后面的最高**。上面 `utilities` 最强、`reset` 最弱。**强烈建议**在样式表开头集中声明一次层序，之后无论各层样式分散在多少文件里追加，座次都由这一行锁定，避免「谁先加载谁说了算」的混乱。

## 往层里写样式

声明完层序，用块语法把规则放进对应层：

```css
@layer reset {
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
}

@layer base {
  body {
    font-family: system-ui;
    line-height: 1.5;
  }
}

@layer components {
  .btn {
    padding: 0.5rem 1rem;
    border-radius: 6px;
  }
}
```

同一个层可以**多次声明、不断追加**，它的优先级始终由**首次出现在层序里的位置**决定，而不是某段代码写在文件多靠后：

```css
@layer base, special; /* 定序：base 低，special 高 */

@layer special {
  .item {
    color: rebeccapurple;
  }
}

@layer base {
  /* 即便这段写在 special 之后，base 仍然弱于 special */
  .item {
    color: green;
  }
}
/* 结果：.item 是 rebeccapurple——special 层赢，与代码先后无关 */
```

## 核心规则一：层序压过特异性

这是 `@layer` 最反直觉、也最有用的特性——**层之间只看层序，完全无视特异性**：

```css
@layer theme, utilities; /* theme 低，utilities 高 */

@layer theme {
  .box p {
    color: green; /* 特异性 0-1-1，按常理更高 */
  }
}

@layer utilities {
  p {
    color: red; /* 特异性 0-0-1，按常理更低 */
  }
}
/* 结果：文字是红色！utilities 层在后 → 整层胜出，特异性不参与比较 */
```

只有**同一层内部**的多条规则冲突时，才回到「比特异性」的常规赛道。

## 核心规则二：未分层样式赢过所有分层样式

没有放进任何 `@layer` 的普通样式（「未分层」样式），在普通声明里**优先级高于一切分层样式**，同样无视特异性：

```css
@layer framework {
  .btn {
    background: blue; /* 分层 */
  }
}

/* 未分层 */
.btn {
  background: green; /* 未分层 → 赢，哪怕特异性相同甚至更低 */
}
/* 结果：按钮是绿色 */
```

把这两条规则合起来看，普通声明的优先级阶梯（低 → 高）是：

```
第一个声明的层  <  …  <  最后一个声明的层  <  未分层样式
```

这正是「驯服第三方 CSS」的原理：**把框架导入一个低层，你自己的业务样式不分层**，于是你总能轻松覆盖框架，且用的是简单选择器、零 `!important`。

## 核心规则三：`!important` 把层序整个反转

`!important` 声明遵循一套**完全相反**的层序——和 [上一页](./cascade-inheritance) 讲的「`!important` 反转来源顺序」是同一种精神：

```css
@layer a, b; /* 普通声明：a 弱 b 强 */

@layer a {
  p {
    color: green !important;
  }
}
@layer b {
  p {
    color: red !important;
  }
}
/* 结果：绿色！!important 下，先声明的 a 层反而最强 */
```

而且 `!important` 下，**分层样式强于未分层样式**（也与普通声明相反）。把含 `!important` 的完整阶梯接上来（低 → 高）：

```
未分层 !important  <  最后声明的层 !important  <  …  <  第一个声明的层 !important
```

这个设计让「reset / 框架层」即便用 `!important` 也能被有意识地置于高位或低位，逻辑自洽。日常记住一句即可：**普通声明「后来的层」赢、未分层最赢；`!important` 一切反转**。

## 嵌套层与匿名层

层可以嵌套，形成 `父.子` 的层级，便于在一个框架命名空间下再细分：

```css
/* 嵌套块语法 */
@layer framework {
  @layer reset {
    /* … */
  }
  @layer components {
    /* … */
  }
}

/* 点号语法追加到嵌套层 */
@layer framework.components {
  .card {
    border: 1px solid #ddd;
  }
}
```

还有**匿名层**（不写名字）——它按出现顺序参与排序，但**之后无法再追加**（没名字可引用）：

```css
@layer {
  p {
    margin-block: 1rem;
  }
}
```

匿名层适合「一次性、不需要再追加」的样式块；需要跨文件追加的层务必命名。

## 把外部样式表导入到层

`@import` 配合 `layer()` 函数，可以在引入第三方样式表的同时就把它**装进指定层**——这是 MDN 推荐的、替代 `!important` 来管理第三方 CSS 的范式：

```css
/* 把整个框架塞进低优先级的 vendor 层 */
@import url("normalize.css") layer(reset);
@import url("bootstrap.css") layer(vendor);

/* 之后你的未分层样式天然覆盖它们，无需 !important */
.btn {
  background: var(--brand);
}
```

::: warning `@import` 的位置约束
`@import` 语句**必须出现在样式表最前面**，只能排在 `@charset` 和「纯声明层序的 `@layer` 语句」之后；一旦前面出现了任何普通规则，后面的 `@import` 就会被忽略。所以「先 `@layer` 定序、再 `@import ... layer()` 导入、最后写普通规则」是标准顺序。
:::

## `revert-layer`：撤销本层、露出下层

在分层场景里，`revert-layer` 关键字能让某属性**回退到上一个层叠层**里的值，等于「撤销本层对它的设定」：

```css
@layer base {
  p {
    color: red;
  }
}

@layer override {
  p {
    color: blue;
  }
  p.reset {
    color: revert-layer; /* 撤销 override 层 → 露出 base 层的 red */
  }
}
/* p.reset 最终是红色 */
```

## 一份可直接套用的层架构

实战中一套清晰的层序往往是这样（从低到高）：

```css
/* 1) 先集中定序——优先级一目了然 */
@layer reset, tokens, base, layout, components, utilities;

/* 2) 第三方框架导入到低层 */
@import url("normalize.css") layer(reset);

/* 3) 各层填充 */
@layer tokens {
  :root {
    --brand: #0066ff;
    --space: 8px;
  }
}
@layer base {
  body {
    font: 16px/1.5 system-ui;
  }
}
@layer components {
  .card {
    padding: var(--space);
  }
}
@layer utilities {
  .hidden {
    display: none;
  }
}

/* 4) 极少数「一锤定音」的覆盖，放在未分层（最高普通优先级） */
.theme-dark .card {
  background: #111;
}
```

它的好处：`utilities`（工具类）天然压过 `components`（组件），`components` 压过 `base`，第三方 `reset` 永远在最底；任何时候想强制覆盖，把规则写成**未分层**即可，全程不需要 `!important`，也不必把选择器越写越长。

## 小结

`@layer` 把「谁优先」从**特异性的暗箱**搬到**层序的明面**：普通声明里「后声明的层 > 先声明的层，未分层 > 已分层」，`!important` 全反转；层内仍按特异性比。它自 2022 年 3 月起 Baseline 广泛可用，是 2026 年组织大型样式、驯服第三方 CSS、告别 `!important` 军备竞赛的首选机制。下一页转向另一面——选择器写法对**性能与可维护性**的影响：[选择器性能与最佳实践](./selector-performance)。
