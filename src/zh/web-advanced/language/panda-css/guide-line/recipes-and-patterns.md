---
layout: doc
outline: [2, 3]
---

# Recipes 配方与 Patterns 布局

> 基于 Panda CSS 1.11.4 · 核于 2026-07

## 速查

- **Recipe = 多变体样式**，四要素：`base`（基础样式）/ `variants`（变体）/ `compoundVariants`（组合变体）/ `defaultVariants`（默认取值）。
- **原子配方 `cva`**：从 `styled-system/css` 导入，就地定义；**所有变体提前全量生成**原子类；**不支持响应式变体 props**；可与组件同文件共置。
- **配置配方 `defineRecipe`**：从 `@pandacss/dev` 导入，注册进 `panda.config.ts` 的 `theme.extend.recipes`；用 `styled-system/recipes` 里生成的函数消费；**JIT 只生成用到的变体**；**支持响应式变体 props**（不含 compoundVariants 时）。
- **Slot recipes（多部件组件）**：原子式 `sva`、配置式 `defineSlotRecipe`；声明 `slots: [...]`，各 slot 分写 base/variants，一次调用返回各部件类名映射。
- **compoundVariants**：多个变体取到指定组合值时才应用；支持数组批量匹配。
- **defaultVariants**：缺省变体值时的回退。
- **类型工具**：`RecipeVariant<T>`（变体取值联合）/ `RecipeVariantProps<T>`（组件变体 props 类型，各键可选）。
- **配方方法**：`recipe.variantKeys` / `recipe.variantMap` / `recipe.splitVariantProps(props)`（拆变体 props 与其余 props）。
- **`staticCss`**：强制全量生成未被静态命中的配方变体（组件库分发常用）。
- **Patterns = 布局原语**：`stack`/`hstack`/`vstack`/`wrap`/`flex`/`grid`/`gridItem`/`container`/`center`/`aspectRatio`/`float`/`circle`/`square`/`divider`/`bleed`/`visuallyHidden`/`cq`。
- **Pattern 两种形态**：函数式 `stack({ gap: '6' })`（`styled-system/patterns`）/ JSX 式 `<Stack gap="6">`（`styled-system/jsx`）。
- ⚠️ **Pattern 响应式**：断点直接把响应式对象传给 pattern 的 prop（如给 `columns` 传 base/md 对象，见正文示例），**别**把断点嵌成单独的 `md` prop。

## 一、原子配方 cva

`cva`（class variance authority 风格、为 Panda 设计）用于就地定义带变体的组件样式：

```ts
import { cva } from '../styled-system/css';

const button = cva({
  base: { display: 'flex', alignItems: 'center' },
  variants: {
    visual: {
      solid: { bg: 'red.200', color: 'white' },
      outline: { borderWidth: '1px', borderColor: 'red.200' },
    },
    size: {
      sm: { padding: '4', fontSize: '12px' },
      lg: { padding: '8', fontSize: '24px' },
    },
  },
  defaultVariants: { visual: 'solid', size: 'lg' },
});

// 调用传变体值，返回对应类名
<button className={button({ visual: 'outline', size: 'sm' })}>Click</button>;
```

`cva` 会把**所有变体组合的样式提前全量生成**为原子类；它可以和组件写在同一文件（共置），但**不支持把响应式对象传给变体 props**。

## 二、配置配方 defineRecipe

需要 JIT（只出用到的变体）、或需要响应式变体 props 时，用**配置配方**：单独文件定义、注册进配置、从生成目录消费。

```ts
// button.recipe.ts
import { defineRecipe } from '@pandacss/dev';

export const buttonRecipe = defineRecipe({
  className: 'button',
  description: 'Button 组件样式',
  base: { display: 'flex' },
  variants: {
    visual: { funky: { bg: 'red.200', color: 'white' } },
    size: { sm: { padding: '4', fontSize: '12px' } },
  },
});
```

```ts
// panda.config.ts
import { defineConfig } from '@pandacss/dev';
import { buttonRecipe } from './button.recipe';

export default defineConfig({
  theme: { extend: { recipes: { button: buttonRecipe } } },
});
```

```tsx
// 消费：从生成目录导入同名函数
import { button } from '../styled-system/recipes';

<button className={button({ size: 'sm' })}>Click</button>;
// 配置配方支持响应式变体（不含 compoundVariants 时）：
<button className={button({ size: { base: 'sm', md: 'lg' } })} />;
```

### 原子配方 vs 配置配方

| 维度 | 配置配方 `defineRecipe` | 原子配方 `cva` |
| --- | --- | --- |
| 生成时机 | JIT——只出用到的变体 | 所有变体提前全量生成 |
| 响应式变体 props | ✅（不含 compoundVariants 时） | ❌ |
| 与组件共置 | ❌（需注册进 config） | ✅（可同文件） |
| 产出类 | 命名的配方类 | 原子类 |

组件库对外分发、变体不被静态命中的场景，用配置里的 `staticCss` 强制全量产出变体。

## 三、Slot recipes：多部件组件

带多个子部件的组件（如 root / control / label 的 Checkbox），用**插槽配方**统一管理各部件的变体样式：原子式 `sva`（`styled-system/css`）、配置式 `defineSlotRecipe`（`@pandacss/dev`）。

```ts
import { sva } from '../styled-system/css';

const checkbox = sva({
  slots: ['root', 'control', 'label'],
  base: {
    root: { display: 'flex', alignItems: 'center', gap: '2' },
    control: { borderWidth: '1px', rounded: 'sm' },
    label: { color: 'fg' },
  },
  variants: {
    size: {
      sm: { control: { w: '8', h: '8' }, label: { fontSize: 'sm' } },
      md: { control: { w: '10', h: '10' }, label: { fontSize: 'md' } },
    },
  },
});

const classes = checkbox({ size: 'sm' });
// classes.root / classes.control / classes.label 分别是各部件类名
```

## 四、compoundVariants 与类型工具

`compoundVariants` 表达「多个变体同时取到某组合值时才追加的样式」，避免为每种组合硬造独立变体：

```ts
cva({
  base: {},
  variants: {
    size: { small: {}, medium: {} },
    color: { primary: {}, secondary: {} },
  },
  compoundVariants: [
    { size: 'small', color: 'primary', css: { border: '2px solid blue' } },
    // 数组批量匹配多个取值
    { size: ['small', 'medium'], color: 'secondary', css: { fontWeight: 'extrabold' } },
  ],
});
```

配方自带一批实用方法与类型工具：

```ts
import { cva, type RecipeVariant, type RecipeVariantProps } from '../styled-system/css';

const buttonStyle = cva({ variants: { size: { small: {}, large: {} } } });

type V = RecipeVariant<typeof buttonStyle>; // { size: 'small' | 'large' }
type P = RecipeVariantProps<typeof buttonStyle>; // { size?: 'small' | 'large' }

buttonStyle.variantKeys; // ['size']
buttonStyle.splitVariantProps({ size: 'small', onClick() {} });
// [{ size: 'small' }, { onClick }] —— 拆出变体 props 与其余 props
```

`RecipeVariantProps` 常用于给包裹配方的组件写 props 类型，让配方变体与组件 props 自动同步。

## 五、Patterns：布局原语

Patterns 把常见 flex/grid 布局封装成可复用的原语，接收语义化 props。两种形态：

```tsx
// 函数式：从 styled-system/patterns 导入，返回类名
import { stack, grid } from '../styled-system/patterns';

<div className={stack({ gap: '6', padding: '4' })}>
  <div>First</div>
</div>;

// JSX 式：从 styled-system/jsx 导入（需设 jsxFramework）
import { Stack, Grid } from '../styled-system/jsx';

<Stack gap="6" padding="4">
  <div>First</div>
</Stack>;
```

内置 pattern 一览：

| Pattern | 用途 | 关键 props |
| --- | --- | --- |
| `stack` / `hstack` / `vstack` | 纵向/横向排列 | `gap`、`direction`、`align`、`justify` |
| `flex` | 弹性容器 | `direction`、`wrap`、`align`、`justify`、`grow` |
| `grid` / `gridItem` | 网格布局/网格子项 | `columns`、`gap`、`minChildWidth` / `colSpan` |
| `wrap` | 自动换行 | `gap`、`columnGap`、`rowGap` |
| `container` | 居中限宽容器 | `maxWidth`、`marginX`、`paddingX` |
| `center` | 内容居中 | `inline` |
| `aspectRatio` | 固定宽高比 | `ratio` |
| `circle` / `square` | 圆形/正方形 | `size` |
| `float` / `bleed` | 边角浮动/满宽出血 | `placement` / `inline`、`block` |
| `divider` / `visuallyHidden` / `cq` | 分隔线/仅读屏可见/容器查询 | `orientation` / — / `name`、`type` |

⚠️ **Pattern 的响应式 props 直接写在 prop 上**，别嵌套：

```tsx
<Grid columns={{ base: 1, md: 2 }} /> // ✅ 正确
<Grid columns={1} md={{ columns: 2 }} /> // ❌ 错误
```

---

样式与配方之上，是贯穿全局的设计值——tokens 与主题，见下一页：[Tokens 与主题](./tokens-and-theming)。
