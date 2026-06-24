---
layout: doc
outline: [2, 3]
---

# 自定义属性与 var()

> 基于 CSS 现代标准 · 核于 2026-06

## 速查

- 声明：`--名字: 值;`——名字必须以**两个连字符** `--` 开头；**大小写敏感**（`--c` 与 `--C` 是两个变量）
- 取值：`var(--名字)`；带回退 `var(--名字, 默认值)`；回退可再套 `var(--a, var(--b, #333))`
- 作用域：自定义属性**默认继承**且参与层叠——写在 `:root` 全局可用，写在某选择器内只覆盖它和后代
- 换肤：给祖先元素**重定义同名变量**（如 `.dark { --bg: #000 }`），整棵子树的 `var(--bg)` 一起变，零 JS 改样式
- 值是「文本片段」：`--gap: 10px 20px;` 可存任意 token，甚至半截值，用时再拼
- 非法兜底：`var()` 解析出的值类型不合法时，属性变成**「计算值时非法」**——退回**继承值或初始值**，而非忽略整条
- 限制：媒体查询条件里**不能**用 `var()`；变量**不被 `all` 简写重置**
- JS 读：`getComputedStyle(el).getPropertyValue("--x")`（返回字符串，记得 `.trim()`）
- JS 写：`el.style.setProperty("--x", "blue")` / 删 `el.style.removeProperty("--x")`
- Baseline：**广泛可用**（自 2017-04 起全主流浏览器支持），可无脑用

## 声明与取值

自定义属性的名字必须以**两个连字符** `--` 打头，这是为了和未来可能新增的标准属性名彻底区分：

```css
.card {
  --base-size: 1em;
  --card-bg: #f5f5f5;
}
```

> 名字**大小写敏感**：`--my-color` 和 `--My-color` 是两个不同的变量，别写混。

用 `var()` 函数把值取出来，可以和别的函数嵌套使用：

```css
.card .card-title {
  font-size: calc(2 * var(--base-size));
}
```

### 回退值

`var()` 的第二个参数是**回退值**——当那个变量没有被定义时启用：

```css
.button {
  /* --btn-bg 没定义时，退而用 hotpink */
  background: var(--btn-bg, hotpink);
}
```

回退可以层层嵌套，常用于「优先用变体色、没有就用主色」这种降级链：

```css
#my-element {
  background: var(--alert-variant-background, var(--alert-primary-background));
}
```

::: warning 回退 ≠「变量值非法时的兜底」
回退值只在变量**完全没定义**时生效。如果变量**有定义但值非法**（比如把一个长度赋给了颜色属性），走的是另一套「计算值时非法」逻辑（见下文），**不会**用回退值。两者要分清。
:::

## 作用域：默认继承 + 参与层叠

自定义属性最容易被低估的一点：它**默认继承**，并且**完整参与 CSS 层叠**。把它声明在 `:root`（即 `<html>` 元素）上，整页任何元素都能读到：

```css
:root {
  --first-color: #1166ff;
  --second-color: #ffff77;
}

#firstParagraph {
  background-color: var(--first-color);
  color: var(--second-color);
}
```

而在更具体的选择器里**重新声明同名变量**，就会就近覆盖——只对该元素及其后代生效：

```css
:root {
  --first-color: #1166ff;
}

#container {
  /* 仅 #container 子树里，--first-color 变成绿色 */
  --first-color: #229900;
}

#thirdParagraph {
  /* 若它在 #container 内，这里取到的是 #229900 */
  background-color: var(--first-color);
}
```

这套「就近覆盖 + 自动向下继承」的机制，正是下面运行时换肤的全部原理。

## 运行时主题切换：自定义属性的杀手锏

传统换肤要么准备两套 CSS 来回切，要么用 JS 逐个元素改样式——都很笨重。自定义属性把这件事化简成「**重定义一次根变量**」：

```css
/* 1. 在 :root 定义一套语义化令牌（亮色） */
:root {
  --bg: #ffffff;
  --fg: #1a1a1a;
  --accent: #0066ff;
}

/* 2. 暗色主题：只需覆盖这几个变量 */
:root.dark {
  --bg: #0d1117;
  --fg: #e6edf3;
  --accent: #58a6ff;
}

/* 3. 所有组件都只引用变量，不写死颜色 */
body {
  background: var(--bg);
  color: var(--fg);
}
.link {
  color: var(--accent);
}
```

切换时，JS 只需在 `<html>` 上加/去掉一个类：

```js
// 一行切换整站主题——CSS 自动把新值向下继承到每个 var(--bg)
document.documentElement.classList.toggle("dark");
```

关键在于：**JS 完全不碰具体样式**，只翻一个开关；真正的「整页同步变色」由 CSS 的继承机制完成，性能好、代码少、组件零耦合。还可以叠加 `prefers-color-scheme` 媒体查询做「跟随系统」：

```css
@media (prefers-color-scheme: dark) {
  :root:not(.light) {
    --bg: #0d1117;
    --fg: #e6edf3;
  }
}
```

## 值是「文本片段」，不只是单个值

自定义属性存的其实是一段**未解析的 token 流**，可以是多个值、半截值，用的时候再拼起来：

```css
.box {
  --shadow-color: rgb(20 32 54 / 30%);
  --shadow-geometry: 0 4px 12px;
  /* 拼接两个变量组成完整 box-shadow */
  box-shadow: var(--shadow-geometry) var(--shadow-color);
}
```

这种「拼装」能力让变量不止能存颜色 / 尺寸，还能存一组可复用的样式参数。

## 非法值：「计算值时非法」的特殊规则

当 `var()` 替换进去的值在该属性上**类型不合法**时，行为和「直接写非法值」不同。直接写非法值（如 `color: #zzz`）会**只忽略那一条声明**、保留同属性上其他有效声明；但 `var()` 导致的非法属于**「计算值时非法」**（invalid at computed-value time），结果是该属性退回**继承值**（若该属性可继承）或**初始值**（若不可继承）：

```css
.content {
  background-color: blue;
}
.content.invalid {
  --length: 2rem; /* 一个长度 */
  /* background-color 不接受长度 → 计算值时非法 */
  background-color: var(--length);
  /* 结果不是 blue，而是退回到背景色的初始值 transparent！ */
}
```

::: tip 为什么要知道这条
因为它反直觉：你可能以为「非法就用上一条 blue 兜底」，实际却是退到 `transparent`。给关键属性的 `var()` **带上类型安全的回退值**，或用 `@property` 声明 `initial-value`（见 [`@property` 类型化变量](./property-typed)），都能避免这种悄无声息的「变透明」。
:::

## 两条易踩的限制

1. **媒体查询条件里用不了 `var()`**——下面这种写法无效，浏览器不会去解析变量：

   ```css
   :root {
     --bp: 600px;
   }
   /* ❌ 无效：媒体查询的条件部分不接受 var() */
   @media (min-width: var(--bp)) {
   }
   ```

   需要「变量化的断点」请改用容器查询或构建期方案。

2. **`all` 简写不会重置自定义属性**——`all: initial` 能把元素的标准属性全部重置，但**碰不到** `--x`，它们仍保留继承来的值。

## 与 JavaScript 双向交互

自定义属性是活在 DOM 里的真实值，JS 可以读也可以写。

### 读取

```js
// 拿到「计算后」的最终值（字符串），常有前导空格，记得 trim
const accent = getComputedStyle(document.documentElement)
  .getPropertyValue("--accent")
  .trim();
```

### 写入

```js
// 在元素的内联样式上设置变量——立刻向下继承生效
element.style.setProperty("--accent", "#ff5722");

// 删除
element.style.removeProperty("--accent");
```

一个经典用法：把指针坐标实时写进变量，让纯 CSS 实现「跟随鼠标的光效」，JS 只负责喂数据：

```js
card.addEventListener("pointermove", (e) => {
  const r = card.getBoundingClientRect();
  card.style.setProperty("--mx", `${e.clientX - r.left}px`);
  card.style.setProperty("--my", `${e.clientY - r.top}px`);
});
```

```css
.card {
  background: radial-gradient(
    200px circle at var(--mx, 50%) var(--my, 50%),
    rgb(255 255 255 / 15%),
    transparent
  );
}
```

## 小结

自定义属性是「活在运行时」的 CSS 变量：`--x` 声明、`var()` 取值带回退、默认继承让它能就近覆盖——由此长出「重定义一次根变量即整页换肤」的杀手锏，以及和 JS 双向交互的能力。记住两条坑：媒体查询条件用不了 `var()`、`var()` 非法时退回初始值而非上一条。它自 2017 年起 Baseline 广泛可用，可放心使用。下一页给变量「加上类型」，顺带解锁过去做不到的动画——[`@property` 类型化变量](./property-typed)。
