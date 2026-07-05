---
layout: doc
outline: [2, 3]
---

# 组合复用：composes 与 @value 值变量

> 基于 CSS Modules 规范 + Vite/webpack 实现 · 核于 2026-07

## 速查

- **`composes`**：样式**组合复用**——让一个类继承另一个类，映射值变成**多个类名的空格拼接**（不是合并成一条规则）。
- **三种来源**：同文件 `composes: base;`、跨文件 `composes: base from './x.css';`、全局 `composes: x from global;`。
- **约束**：只能组合**单个局部类名**（不能复合选择器/标签）；`composes` 必须写在规则内**其他声明之前**；可一次组合多个 `composes: a b;`（空格分隔）。
- **带伪类会带过来**：被组合类的 `:hover` 等伪类样式会一并生效。
- ⚠️ **跨文件同属性冲突 = 未定义行为**：不要在不同文件、组合进同一个类的多个来源里，为同一属性给不同值。
- ⚠️ **输出顺序不由 composes 位置决定**：composes 表达的是**依赖**，最终 CSS 层叠顺序由工具按依赖排布，别靠书写位置控制优先级。
- **`@value`**：定义**编译期**值变量（颜色/断点/选择器名），`@value primary: #BF4040;`；源自 ICSS 的 css-modules-values。
- **跨文件导入 `@value`**：`@value primary from './colors.css';`，集中管理设计令牌。
- ⚠️ **`@value` ≠ 原生 `var()`**：`@value` 是编译期文本替换（构建后固化，不能运行时改）；`var(--x)` 是运行时级联、可 JS 读写、可动态主题。

## 一、composes：CSS Modules 的样式复用

`composes` 是 CSS Modules 特有的复用机制。它**不是**把样式合并成一条规则，而是在 JS 侧把**多个类名拼接**起来：

```css
/* buttons.module.css */
.base {
  padding: 8px 16px;
  border-radius: 6px;
}

.primary {
  composes: base;      /* 组合 base */
  background: #3b82f6;
  color: white;
}
```

```js
// styles.primary 实际是两个类名的拼接：
// '_base_a1b2 _primary_c3d4'
```

在 JSX 里 `className={styles.primary}` 会同时挂上 `base` 和 `primary` 两个哈希类，浏览器按 CSS 层叠合成最终样式。这个「多类名叠加」的心智比 Sass 的 `@extend` 更直观。

::: warning composes 的两条硬约束
1. **只能组合单个局部类名**——不能 `composes: .a .b`（复合选择器）或标签选择器。
2. **必须写在规则内其他声明之前**——`composes` 要放在 `background` 等属性之前，否则报错。
:::

## 二、三种组合来源

```css
/* 1) 同文件：直接写类名 */
.primary {
  composes: base;
}

/* 2) 跨文件：composes ... from '文件路径' */
.card {
  composes: shadow from './effects.module.css';
}

/* 3) 全局：composes ... from global（组合一个未哈希的全局类） */
.toast {
  composes: animated from global;   /* animated 是全局类，保持原名 */
}

/* 一次组合多个：空格分隔 */
.fancy {
  composes: base shadow;            /* 同文件多个 */
}
```

- `from './x.module.css'`：跨文件复用，`styles.card` 会带上 effects.module.css 里 `shadow` 的哈希名。
- `from global`：组合一个**全局作用域**的类（第三方库类、全局动画等），它保持原名不哈希。

## 三、composes 的两个进阶坑

**坑一：跨文件同属性冲突是未定义行为。** 官方明确警告——不要在「组合进同一个类的、来自不同文件的多个来源」里，为同一 CSS 属性定义不同的值：

```css
/* a.module.css: .a { color: red } */
/* b.module.css: .b { color: blue } */
.mixed {
  composes: a from './a.module.css';
  composes: b from './b.module.css';
  /* a、b 都设了 color → 最终谁赢「未定义」，不要这么写 */
}
```

**坑二：CSS 输出顺序不由 composes 书写位置决定。** `composes` 表达的是**组合依赖**，被组合类的 CSS 在产物里的先后由构建工具按依赖排布，**不是**你写 composes 的位置。所以别靠 composes 顺序来控制哪条样式最终胜出——要覆盖就用更明确的选择器或避免冲突。

## 四、@value：编译期值变量

`@value` 让你在 CSS Modules 里定义可复用的值（源自 ICSS 的 css-modules-values 能力），可用于颜色、断点、甚至选择器名：

```css
/* colors.module.css */
@value primary: #BF4040;
@value breakpointLarge: (min-width: 960px);

.header {
  color: primary;
}

@media breakpointLarge {
  .header { padding: 20px; }
}
```

跨文件导入（集中管理设计令牌，改一处即可）：

```css
/* card.module.css */
@value primary from './colors.module.css';

.card {
  border-color: primary;
}
```

## 五、@value vs 原生 CSS 变量 var()

这是高频混淆点，本质是**编译期 vs 运行时**：

| 维度 | `@value`（CSS Modules） | `var(--x)`（原生自定义属性） |
| --- | --- | --- |
| 生效时机 | **编译期**文本替换（构建后固化） | **运行时**级联求值 |
| 能否 JS 动态改 | ❌ 构建后写死 | ✅ `el.style.setProperty('--x', ...)` |
| 参与 CSS 级联 | ❌ | ✅ 随选择器/媒体查询/主题变化 |
| 可用作 | 值、断点、选择器名（更灵活） | 属性值（不能当选择器名） |
| 动态主题切换 | 不适合 | ✅ 首选 |

**结论**：需要「构建期共享的固定令牌」（团队统一色板、断点）用 `@value` 顺手；需要「运行时可变」（暗色模式切换、JS 驱动的动态值）一律用原生 `var()`。两者可共存。

---

组合与值变量掌握后，进入 [框架集成与 TypeScript](./framework-and-typescript)：Vite / Next.js / webpack / CRA 的接入方式，以及给 CSS Modules 补 TypeScript 类型的三条路。
