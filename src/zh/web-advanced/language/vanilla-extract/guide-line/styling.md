---
layout: doc
outline: [2, 3]
---

# Styling：`style()` 深入与全局样式

> 基于 vanilla-extract 1.21.1 · 核于 2026-07

## 速查

- **`style(obj)`** → 作用域类名；属性 camelCase，数字补 `px`（无单位属性除外），前缀属性 PascalCase。
- **简单伪类**（`:hover`/`::before`/`:first-of-type`）直接作顶层键；**复杂选择器**放 `selectors`，且**目标必须是当前元素**（`&` 在主语位）。
- ⚠️ `selectors` 里 `'& .child'`（目标是子元素）**不允许**——给后代上样式改用 `globalStyle`。
- **at-rule 嵌套**：`@media`、`@supports`、`@container`（配 `createContainer()`）、`@layer`（配 `layer()`），键内层是「条件字符串 → 样式对象」。
- **CSS 变量**：`vars: { [myVar]: 'blue', '--global': 'red' }`；`createVar()` 造引用（创建时不生成 CSS）；`fallbackVar(a, b)` 提供回退；`createVar({ syntax, inherits, initialValue })` 生成 `@property` 类型化变量。
- **属性回退值**：用数组 `overflow: ['auto', 'overlay']`（旧浏览器取前、新浏览器取后）。
- **样式组合**：`style([base, sprinkles({...}), { ':hover': {...} }])`。
- **`globalStyle(selector, styles)`**：不作用域化的全局样式；给作用域 class 的**后代**上样式（选择器形如 `${parent} a`）。
- **`styleVariants(map[, mapper])`**：一组命名样式 → `styles[props.variant]`。
- **`keyframes(steps)`** → 作用域动画名（赋 `animationName`）；步骤里 `vars` 可给变量做动画；`globalKeyframes` 全局名。
- **`fontFace(cfg)`** → 作用域 font-family 名；传数组定义多字重；`globalFontFace` 全局名。
- **循环选择器依赖**：用 `get selectors() { return {...} }` getter 延迟求值。

## 一、样式对象与选择器规则

`style()` 的对象里，普通属性与「简单伪类/伪元素」可以并列写在顶层：

```ts
import { style } from '@vanilla-extract/css';

export const link = style({
  color: 'blue',
  ':hover': { color: 'pink' },     // 简单伪类，顶层直接写
  '::before': { content: '""' },   // 简单伪元素
});
```

**复杂选择器**（带 `:not()`、组合器、引用其它 class 等）必须放进 `selectors` 键，且选择器里要用 `&` 指向当前元素：

```ts
import { style } from '@vanilla-extract/css';

export const parent = style({});

export const item = style({
  selectors: {
    '&:hover:not(:active)': { border: '2px solid aquamarine' },
    'nav li > &': { textDecoration: 'underline' },          // & 是目标，合法
    [`${parent}:focus &`]: { background: '#fafafa' },        // 引用别的 class
  },
});
```

::: warning 选择器的「目标」必须是当前元素
`selectors` 只允许「当前元素是被选中的那个」，即 `&` 处在主语位。像 `'& .child'` 那样把目标指向**子元素**是**不允许的**——那是在给别的元素上样式，应改用 `globalStyle`。原因：这样能保证每条规则的归属清晰、可被静态分析与作用域化。
:::

**循环选择器依赖**：两个 class 的选择器互相引用时，模块顶层可能出现「引用时对方还没初始化」。用 JS getter 延迟求值即可：

```ts
export const parent = style({});
export const child = style({
  get selectors() {
    return { [`${parent} &`]: { color: 'red' } };
  },
});
```

## 二、媒体查询、@supports、容器查询、级联层

这些 at-rule 都以「键 + 内层条件对象」的两层结构书写：

```ts
import { style, createContainer, layer } from '@vanilla-extract/css';

const sidebar = createContainer();          // 作用域化容器名，避免全局冲突
const typography = layer();                  // 作用域化级联层引用

export const panel = style({
  containerName: sidebar,

  '@media': {
    'screen and (min-width: 768px)': { padding: 20 },
  },
  '@supports': {
    '(display: grid)': { display: 'grid' },
  },
  '@container': {
    [`${sidebar} (min-width: 400px)`]: { flexDirection: 'row' },
  },
  '@layer': {
    [typography]: { fontSize: '1rem' },
  },
});
```

- `@media` 规则会被渲染到文件末尾，以获得比基础规则更高的优先级。
- `@container` 引用具名容器时，用 `createContainer()` 生成作用域名，配合 `containerName` 声明容器。
- `@layer` 归入的层用 `layer()`（或 `globalLayer` 定义全局命名层）创建引用。

## 三、CSS 变量：`vars`、`createVar`、`fallbackVar`

在 `style()` 里通过 `vars` 键设置 CSS 自定义属性，键可以是 `createVar()` 的引用，也可以是普通 `--x` 名：

```ts
import { style, createVar, fallbackVar } from '@vanilla-extract/css';

export const accent = createVar();           // 造引用，创建时不生成任何 CSS

export const blue = style({
  vars: { [accent]: 'blue' },                // 赋值
});

export const text = style({
  color: accent,                             // 作为属性值使用（即 var(...)）
  background: fallbackVar(accent, 'white'),  // 提供回退：accent 未定义时用 white
});
```

`createVar()` 还能传入 `@property` 配置，生成**带类型的注册自定义属性**——从而支持平滑动画（如角度、颜色插值）与语法校验：

```ts
const angle = createVar({
  syntax: '<angle>',
  inherits: false,
  initialValue: '0deg',
});
```

## 四、属性回退值（fallback）

给同一属性传**数组**即可为旧浏览器提供回退——vanilla-extract 会输出多条声明，浏览器识别不了后者时退回前者：

```ts
export const box = style({
  overflow: ['auto', 'overlay'],   // 旧浏览器用 auto，支持的用 overlay
});
```

## 五、样式组合：`style([...])`

给 `style()` 传数组即可把多份样式合并成一个类，元素可以是别处的类名、`sprinkles()` 结果或行内样式对象：

```ts
import { style } from '@vanilla-extract/css';

const base = style({ padding: 12, borderRadius: 6 });

export const primary = style([
  base,                                   // 复用基础样式
  { background: 'blue', color: 'white' }, // 叠加变体
]);
```

## 六、全局样式：`globalStyle`

`globalStyle(selector, styles)` 定义**不被作用域化**的全局规则，适合重置与给作用域 class 的后代上样式：

```ts
import { style, globalStyle } from '@vanilla-extract/css';

globalStyle('html, body', { margin: 0, padding: 0 });

export const article = style({});
// 给 article 内所有 a 上样式（后代——不能写在 selectors 里）
globalStyle(`${article} a[href]`, { color: 'pink' });
```

同类还有 `globalKeyframes`、`globalFontFace`、`globalLayer`——分别定义全局命名的动画、字体、级联层。

## 七、命名样式集：`styleVariants`

`styleVariants(map)` 一次生成一组命名样式，返回「键 → 类名」对象，天然映射组件 prop：

```ts
import { styleVariants } from '@vanilla-extract/css';

export const background = styleVariants({
  primary: { background: 'blue' },
  secondary: { background: 'gray' },
});
// 使用：<button className={background[props.variant]} />
```

传第二个「映射函数」可从数据批量生成变体，减少重复：

```ts
const palette = { primary: 'blue', danger: 'red' } as const;
export const bg = styleVariants(palette, (color) => ({ background: color }));
```

## 八、动画与字体：`keyframes`、`fontFace`

`keyframes()` 返回作用域化的动画名，赋给 `animationName`；关键帧步骤里还能用 `vars` 给 CSS 变量做动画：

```ts
import { style, keyframes, createVar } from '@vanilla-extract/css';

const rotate = keyframes({
  '0%': { transform: 'rotate(0deg)' },
  '100%': { transform: 'rotate(360deg)' },
});

export const spinner = style({
  animationName: rotate,
  animationDuration: '1s',
  animationIterationCount: 'infinite',
});

// 也能对变量做动画（配合 @property 类型化变量）
const angle = createVar({ syntax: '<angle>', inherits: false, initialValue: '0deg' });
const spin = keyframes({
  '0%': { vars: { [angle]: '0deg' } },
  '100%': { vars: { [angle]: '360deg' } },
});
```

`fontFace()` 生成 `@font-face` 并返回作用域化字体名；传数组可为同一 family 定义多种字重：

```ts
import { fontFace, style } from '@vanilla-extract/css';

const gentium = fontFace([
  { src: 'local("Gentium")', fontWeight: 'normal' },
  { src: 'local("Gentium Bold")', fontWeight: 'bold' },
]);

export const body = style({ fontFamily: gentium });
```

---

样式写法掌握后，下一步进入 [主题系统](./theming)：`createTheme` 生成主题 class + 类型化令牌、`createThemeContract` 契约先行、`createGlobalTheme` 全局主题与 `assignVars` 批量赋值。
