---
layout: doc
outline: [2, 3]
---

# `@supports` 特性查询

> 基于 CSS 现代标准 · 核于 2026-06

## 速查

- 基本形：`@supports (property: value) { … }`——浏览器支持该「属性: 值」时生效，声明须带括号
- 取反：`@supports not (gap: 1rem) { … }`——**不支持**时生效，最常用来写降级
- 组合：`and`（全真）、`or`（任一真）；混用 `and` / `or` **必须加括号**定优先级，否则整条作废
- `selector()`：`@supports selector(:has(a)) { … }`——探测**选择器**是否被支持（如 `:has()`）
- `font-tech()` / `font-format()`：探测字体技术（如 `color-COLRv1`）/ 格式（如 `woff2`）支持
- `at-rule()`：`@supports at-rule(@scope) { … }`——探测某个 at-rule 是否支持
- 渐进增强范式：基础样式写在外面（人人可用），增强样式裹进 `@supports` 里
- JS 等价：`CSS.supports("display", "grid")` 或 `CSS.supports("(display: grid)")`
- 与媒体 / 容器查询可互相嵌套
- Baseline：`@supports` 自 2015-09 起广泛可用；`selector()` 支持较晚但已普及

## 为什么需要特性查询

新 CSS 特性总是分批落地——你想用某个新属性，但又不能让老浏览器上的用户看到塌掉的页面。`@supports`（特性查询）让你**先问浏览器「你支不支持这个」，再决定怎么写**。这是「渐进增强」的核心工具：先保证一份人人可用的基础体验，再给有能力的浏览器叠加更好的实现。

## 基本语法：探测「属性: 值」

把要测试的声明放进括号，浏览器支持时其中的规则才生效：

```css
@supports (display: grid) {
  .gallery {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(12rem, 1fr));
  }
}
```

声明**必须带括号**。`@supports (transform-origin: 5% 5%)` 这种「属性 + 具体值」都会被如实检测——它测的是「这个属性能否接受这个值」，而不仅是属性名是否认识。

## 逻辑操作符

### `not`——不支持时降级

`not` 是写回退最常用的形式：浏览器**不支持**时才生效。

```css
/* 现代浏览器：用 aspect-ratio 锁比例 */
.box {
  aspect-ratio: 16 / 9;
}

/* 老浏览器：退回 padding-top 撑高的老技巧 */
@supports not (aspect-ratio: 1) {
  .box {
    position: relative;
    padding-top: 56.25%; /* 9/16 */
  }
}
```

### `and` / `or`——组合条件

```css
/* 两个都支持 */
@supports (display: grid) and (gap: 1rem) {
  /* … */
}

/* 任一前缀支持（处理远古前缀场景） */
@supports (position: sticky) or (position: -webkit-sticky) {
  .toolbar { position: sticky; }
}
```

::: warning 混用 `and` 与 `or` 必须加括号
当 `and` 和 `or` 同时出现时，**必须用括号显式指定优先级**，否则整条查询无效、会被直接忽略：

```css
/* 对：括号明确了优先级 */
@supports (display: grid) and ((gap: 1rem) or (grid-gap: 1rem)) {
  /* … */
}
```
:::

## `selector()`——探测选择器支持

`@supports` 不止能测属性，还能用 `selector()` 测**某个选择器语法是否被支持**——这对刚普及的 `:has()`、`:is()` 等很有用：

```css
/* 支持 :has() 时用它做父选择 */
@supports selector(:has(img)) {
  .card:has(img) {
    grid-template-rows: auto 1fr;
  }
}

/* 不支持时的回退 */
@supports not selector(:has(a, b)) {
  .legacy-fallback {
    /* 给老浏览器的展开写法 */
  }
}
```

## 字体与 at-rule 探测

```css
/* 探测彩色字体技术 */
@supports font-tech(color-COLRv1) {
  .logo { font-family: "Bungee Spice", fantasy; }
}

/* 探测字体格式 */
@supports font-format(woff2) {
  /* … */
}

/* 探测某个 at-rule 是否支持 */
@supports at-rule(@scope) {
  @scope (.light) {
    a { color: darkmagenta; }
  }
}
```

## 渐进增强范式

`@supports` 的正确用法是**「基础在外、增强在内」**：把人人可用的基础样式写在 `@supports` 外面，把依赖新特性的增强写在里面。这样即使浏览器完全不认识 `@supports`，也能拿到可用的基础体验。

```css
/* 基础：所有浏览器都能用的浮动布局 */
.menu > * {
  float: left;
  padding: 0.5rem;
}

/* 增强：支持 flex 的浏览器升级为弹性布局 */
@supports (display: flex) {
  .menu {
    display: flex;
    gap: 0.5rem;
  }
  .menu > * {
    float: none;
  }
}
```

::: tip 何时不必用 `@supports`
如果某特性**不支持时浏览器会自动忽略、且忽略后不破坏布局**（比如 `gap` 在不支持的远古浏览器里只是没间距、不会错位），那直接写、让它自然降级即可，不必套 `@supports`。特性查询真正的价值在于「新旧两套实现需要二选一」的场景——尤其用 `not` 给老浏览器单独喂回退。
:::

## 在 JavaScript 里探测

`@supports` 的能力在脚本里对应 `CSS.supports()`，两种调用形式：

```js
// 形式一：属性、值分开传
CSS.supports("display", "grid"); // true / false

// 形式二：整条声明（带括号）
CSS.supports("(display: grid) and (gap: 1rem)");
```

可据此在运行时给 `<html>` 加类名，供 CSS 钩取。

## 小结

`@supports` 让你在用新 CSS 前先探测能力，再以「基础在外、增强在内」的方式渐进增强——`not` 写降级、`selector()` 测选择器、`and`/`or` 组合条件。到这里，「按环境查询」的三条线（视口、容器、能力）都讲完了。下一页转向另一类「自适应」：不靠查询，而是让方向相关的属性**自动跟随书写方向**——逻辑属性：[逻辑属性与书写模式](./logical-properties)。
