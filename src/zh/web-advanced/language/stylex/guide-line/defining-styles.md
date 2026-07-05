---
layout: doc
outline: [2, 3]
---

# 定义与应用样式：create / props 全解

> 基于 StyleX 0.19 · 核于 2026-07

## 速查

- **`stylex.create(obj)`**：`obj` 顶层键是命名空间，其下是驼峰 CSS 属性-值对；值可为数字/字符串/条件对象/函数。
- **伪类**（`:hover`）= **属性级条件值**：`backgroundColor: { default: 'lightblue', ':hover': 'blue' }`，`default` 是基态。
- **伪元素**（`::placeholder`）= **命名空间顶层键**：`{ '::placeholder': { color: '#999' } }`，层级比伪类高一层。
- **媒体查询** = 属性级条件值：`width: { default: 800, '@media (max-width: 800px)': '100%' }`，可叠多个断点。
- **嵌套条件**：伪类内可再嵌媒体查询，用 `null` 表示该分支不生效的兜底。
- **`stylex.props(...)`**：接收多个样式或数组，返回 `{ className, style }`；忽略 `null`/`undefined`/`false`。
- **后者胜**：冲突属性只看应用顺序，最后一个赢；底层是合并时按 CSS 属性只保留最后一个原子类。
- **`null` 清除**：把属性设为 `null` 可移除它，用于重置/覆盖。
- **变体 recipe**：各变体做成命名空间，`styles[variant]` 键入；多维变体各一个 `create` 后组合。
- **动态样式**：`bar: (h) => ({ height: h })`，应用 `styles.bar(h)`；编译成 CSS 变量、运行时经 `style` 内联赋值；**函数体必须是对象字面量**。
- **`stylex.keyframes(...)`**：定义关键帧，返回引用赋给 `animationName`。
- **`stylex.firstThatWorks(a, b, c)`**：多候选值回退，浏览器取支持的第一个（如 `sticky`/`-webkit-sticky`/`fixed`）。
- ⚠️ **AOT 约束**：`create` 内只允许字面量/常量/StyleX 函数，禁任意函数调用、对象展开、导入值（CSS 变量除外）。

## 一、create：命名空间与条件样式

`stylex.create()` 接收「命名空间对象」，每个命名空间是一组可独立引用的样式：

```tsx
import * as stylex from '@stylexjs/stylex';

const styles = stylex.create({
  base: { fontSize: 16, color: 'rgb(60,60,60)' },
  active: { color: 'blue' },
});
```

StyleX 把「状态条件」收进属性内部，而不是像传统 CSS 那样另写选择器。三类条件写法：

### 伪类：属性级条件值

伪类（`:hover` / `:focus` / `:active` / `:invalid` 等）写成属性的条件对象，`default` 是基态：

```tsx
const styles = stylex.create({
  button: {
    backgroundColor: {
      default: 'lightblue',
      ':hover': 'blue',
      ':active': 'darkblue',
    },
  },
});
```

### 伪元素：命名空间顶层键

伪元素（`::placeholder` / `::before` 等）是**命名空间下的顶层键**，其值是一组样式——层级比伪类高一层，别混：

```tsx
const styles = stylex.create({
  input: {
    color: { default: '#333', ':invalid': 'red' }, // 伪类在属性内
    '::placeholder': { color: '#999' },            // 伪元素在顶层
  },
});
```

### 媒体查询与嵌套条件

媒体查询同样是属性级条件值，可叠多个断点；条件还能多层嵌套，用 `null` 兜底不生效的分支：

```tsx
const styles = stylex.create({
  card: {
    width: {
      default: 800,
      '@media (max-width: 800px)': '100%',
      '@media (min-width: 1540px)': 1366,
    },
    transform: {
      default: 'scale(1)',
      ':hover': {
        default: null,                       // 无 hover 媒体支持时不变换
        '@media (hover: hover)': 'scale(1.1)',
      },
    },
  },
});
```

## 二、props：合并、优先级与条件应用

`stylex.props()` 把一个或多个样式转成 `{ className, style }`，用扩展语法铺到元素上。它接收多个参数，也接收（可嵌套的）数组：

```tsx
<div {...stylex.props(styles.base, styles.active)} />
<div {...stylex.props([styles.base, isActive && styles.active])} />
```

**核心规则：后应用者胜。** 定义顺序不影响优先级，只看 `props()` 里的应用顺序：

```tsx
// 紫色：highlighted 在后
<div {...stylex.props(styles.base, styles.highlighted)} />
// 灰色：base 在后
<div {...stylex.props(styles.highlighted, styles.base)} />
```

**条件应用**靠忽略假值实现——这是 StyleX 里最常见的写法：

```tsx
<div
  {...stylex.props(
    styles.base,
    props.isHighlighted && styles.highlighted, // false 被忽略
    isActive ? styles.active : styles.inactive,
    props.style,                               // 外部透传样式惯例放最后，便于覆盖
  )}
/>
```

把某属性设为 `null` 可**清除**它（重置场景常用）：

```tsx
const styles = stylex.create({
  noBorder: { borderWidth: null }, // 抵消之前应用的边框
});
```

## 三、变体 recipe

「变体」（variants）是组件库最常见的模式：把每个变体维度做成一个 `create`，运行时按 prop 键入并组合，冲突交给 last-wins 自动解决：

```tsx
const base = stylex.create({ button: { borderRadius: 8, paddingInline: 16 } });

const color = stylex.create({
  primary: { backgroundColor: 'blue', color: 'white' },
  secondary: { backgroundColor: 'gray', color: 'white' },
});

const size = stylex.create({
  small: { fontSize: '1rem', paddingBlock: 4 },
  medium: { fontSize: '1.2rem', paddingBlock: 8 },
});

function Button({ color: c = 'primary', size: s = 'small', disabled, style }) {
  return (
    <button
      {...stylex.props(
        base.button,
        color[c],
        size[s],
        disabled && sharedStyles.disabled,
        style,
      )}
    />
  );
}
```

配合 TypeScript 的 `keyof typeof color` 可让 `c`/`s` 只接受合法变体名，声明式又类型安全。

## 四、动态样式：函数样式

样式值要依赖运行时变量（随 props 变化的高度、随数据变化的颜色）时，用**函数样式**——命名空间写成一个返回对象字面量的函数：

```tsx
const styles = stylex.create({
  bar: (height: number) => ({ height }),
});

function Bar({ height }: { height: number }) {
  return <div {...stylex.props(styles.bar(height))} />;
}
```

原理：StyleX 编译期为 `height` 生成一个 CSS 变量，运行时通过 `props()` 返回的 `style` 把变量值内联设置到元素上——**既动态又保持零运行时注入**（不会每次渲染都生成新的 CSS）。

⚠️ **函数体必须是纯对象字面量**：不能有 `if`/`for`/中间变量/异步，因为 StyleX 要在编译期静态分析出它生成哪些原子类与 CSS 变量。

## 五、keyframes 与 firstThatWorks

**关键帧动画**用 `stylex.keyframes()` 定义，返回引用赋给 `animationName`：

```tsx
const fadeIn = stylex.keyframes({
  from: { opacity: 0 },
  to: { opacity: 1 },
});

const styles = stylex.create({
  box: { animationName: fadeIn, animationDuration: '1s' },
});
```

**多值回退**用 `stylex.firstThatWorks()`——给一个属性提供多个候选值，浏览器采用它支持的第一个，绕开了 JS 对象「同键只能有一个值」的限制：

```tsx
const styles = stylex.create({
  header: {
    position: stylex.firstThatWorks('sticky', '-webkit-sticky', 'fixed'),
  },
});
```

## 六、AOT 约束：为什么有些写法被禁

StyleX 要在**构建期**把样式静态编译成原子类，因此 `create` 内部只允许可静态分析的内容：对象/字符串/数字/数组字面量、`null`、常量与简单表达式、StyleX 自家函数。**禁止**任意函数调用、对象展开（`...spread`）、导入的值——唯一例外是从 `.stylex.js` 文件导入的 CSS 变量。这套 AOT（ahead-of-time）约束正是「零运行时」的前提：编译器能提前算清所有类，运行时才无需再生成任何样式。

---

样式定义与应用掌握后，下一步进入 [变量与主题](./theming)：`defineVars` 设计令牌、`.stylex.js` 文件约定、条件值与派生变量、`createTheme` 子树主题。
