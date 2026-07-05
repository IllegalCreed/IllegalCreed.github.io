---
layout: doc
outline: [2, 3]
---

# recipes 与 sprinkles：多变体与原子化

> 基于 vanilla-extract 1.21.1 · 核于 2026-07

## 速查

- **`@vanilla-extract/recipes`**：多变体组件样式，灵感来自 Stitches，用法贴近 cva。
- **`recipe({ base, variants, compoundVariants, defaultVariants })`** → 返回可调用函数 `button({ color, size })` 得类名。
  - `base` 基础样式；`variants` 变体分组；`compoundVariants` 特定变体**组合**时才叠加；`defaultVariants` 默认变体。
- **`RecipeVariants<typeof button>`**：类型工具，抽取变体 props 类型给组件复用。
- **`@vanilla-extract/sprinkles`**：零运行时、类型安全的**原子化工具类**框架（自建 Tailwind/Styled System）。
- **搭建**：`defineProperties({ properties, conditions, defaultCondition, responsiveArray, shorthands })` → `createSprinkles(...collections)` → `sprinkles()`。
- **条件值三写法**：条件对象 `{ mobile: 'x', desktop: 'y' }`、响应式数组 `['x', null, 'z']`、原始值 `'x'`（走 `defaultCondition`）。
- **仍是零运行时**：`sprinkles()` 运行时只**查表**拼预生成的原子类名，不生成新 CSS。
- **组合**：`style([sprinkles({...}), { ':hover': {...} }])`；recipe 的 base/variant 也可吃 sprinkles 结果。
- ⚠️ 定位：`sprinkles` = 原子工具类；`recipe` = 组件级多变体；二者互补，可叠用。

## 一、recipes：多变体组件样式

`@vanilla-extract/recipes` 解决「一个组件有多个变体维度（颜色 × 尺寸 × 状态）」的样式管理，形态非常接近 `cva`（class-variance-authority）。安装：

```bash
npm install @vanilla-extract/recipes
```

`recipe()` 接受四段配置，返回一个**可调用的函数**：

```ts
// button.css.ts
import { recipe } from '@vanilla-extract/recipes';

export const button = recipe({
  // 1) 所有变体共享的基础样式
  base: {
    borderRadius: 6,
    fontWeight: 600,
  },

  // 2) 变体分组：每组多个可选值
  variants: {
    color: {
      neutral: { background: '#e5e7eb', color: '#111' },
      brand: { background: '#5b21b6', color: '#fff' },
    },
    size: {
      small: { padding: 8 },
      large: { padding: 16 },
    },
  },

  // 3) 特定组合时才叠加的样式
  compoundVariants: [
    {
      variants: { color: 'brand', size: 'large' },
      style: { boxShadow: '0 4px 12px rgba(91,33,182,.4)' },
    },
  ],

  // 4) 未指定时的默认变体
  defaultVariants: {
    color: 'neutral',
    size: 'small',
  },
});
```

调用它得到组合好的类名：

```tsx
import { button } from './button.css';

// 只传需要覆盖的维度，其余走 defaultVariants
<button className={button({ color: 'brand', size: 'large' })}>Buy</button>;
```

**`compoundVariants`** 是关键能力：它定义「当多个变体**同时**取到某组合时」才生效的样式（上例仅 `color=brand 且 size=large` 时加阴影），避免在 `variants` 里穷举所有组合。

### `RecipeVariants`：变体类型复用

用 `RecipeVariants` 从 recipe 抽取变体 props 的 TS 类型，让样式与组件类型**单一事实来源**：

```ts
import { recipe, type RecipeVariants } from '@vanilla-extract/recipes';

export const button = recipe({ /* ...同上... */ });

// 得到 { color?: 'neutral' | 'brand'; size?: 'small' | 'large' }
export type ButtonVariants = RecipeVariants<typeof button>;
```

```tsx
type ButtonProps = ButtonVariants & { children: React.ReactNode };
function Button({ color, size, children }: ButtonProps) {
  return <button className={button({ color, size })}>{children}</button>;
}
```

## 二、sprinkles：零运行时原子化工具类

`@vanilla-extract/sprinkles` 是官方的**零运行时、类型安全的原子化 CSS 框架**：它在构建期生成一批预定义的原子工具类，让你「像 Tailwind 一样用类型安全的 props 拼样式」，却没有运行时样式生成开销。一句话——**自建一个类型安全版的 Tailwind / Styled System**。安装：

```bash
npm install @vanilla-extract/sprinkles
```

### 定义属性集合：`defineProperties`

```ts
// sprinkles.css.ts
import { defineProperties, createSprinkles } from '@vanilla-extract/sprinkles';

// 一组：响应式属性（带断点条件）
const responsiveProperties = defineProperties({
  conditions: {
    mobile: {},
    tablet: { '@media': 'screen and (min-width: 768px)' },
    desktop: { '@media': 'screen and (min-width: 1024px)' },
  },
  defaultCondition: 'mobile',
  responsiveArray: ['mobile', 'tablet', 'desktop'],
  properties: {
    display: ['none', 'flex', 'block'],
    flexDirection: ['row', 'column'],
    paddingTop: { none: 0, small: '4px', medium: '8px', large: '16px' },
  },
  shorthands: {
    padding: ['paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight'],
    paddingX: ['paddingLeft', 'paddingRight'],
  },
});

// 另一组：带深浅模式条件的颜色
const colorProperties = defineProperties({
  conditions: {
    lightMode: {},
    darkMode: { '@media': '(prefers-color-scheme: dark)' },
  },
  defaultCondition: 'lightMode',
  properties: {
    color: { 'gray-700': '#374151', 'blue-50': '#eff6ff' },
    background: { 'gray-700': '#374151', 'blue-50': '#eff6ff' },
  },
});

export const sprinkles = createSprinkles(responsiveProperties, colorProperties);
```

- `properties`：把 CSS 属性映射到可选值（数组=直接值，对象=语义别名 → 值）。
- `conditions`：定义媒体查询/选择器/容器查询等条件；`defaultCondition` 指定无条件值时用哪个。
- `responsiveArray`：定义条件顺序，从而支持响应式数组写法。
- `shorthands`：把一个简写属性映射到多个底层属性（如 `paddingX`）。
- `createSprinkles(...)`：把多组属性合并成一个类型安全的 `sprinkles()` 函数。

### 使用：三种条件值写法

```ts
// 在 .css.ts 里静态使用
export const container = sprinkles({
  display: 'flex',
  paddingX: 'small',                              // 原始值 → 走 defaultCondition
  flexDirection: { mobile: 'column', desktop: 'row' },  // 条件对象
  background: ['blue-50', null, 'gray-700'],      // 响应式数组（null 跳过该断点）
});
```

三种写法可混用：**条件对象**（`{ mobile, desktop }`）、**响应式数组**（`['x', null, 'z']`）、**原始值**（走 `defaultCondition`）。

### 为什么「运行时可调用」还叫零运行时？

`sprinkles()` 能在运行时调用（`sprinkles({ display: 'flex' })`），但它**只是查表**——按参数拼出**构建期就生成好的**原子类名字符串，**不生成任何新 CSS**。所以没有运行时样式注入开销，仍属零运行时：运行时只做极轻量的类名查找。

### 与 style 组合

sprinkles 结果可与普通 `style` 组合，补齐原子类覆盖不到的样式：

```ts
import { style } from '@vanilla-extract/css';
import { sprinkles } from './sprinkles.css';

export const card = style([
  sprinkles({ display: 'flex', padding: 'medium' }),
  { ':hover': { outline: '2px solid currentColor' } },
]);
```

## 三、recipes vs sprinkles：怎么选

| 维度 | recipes | sprinkles |
| --- | --- | --- |
| 定位 | 组件级**多变体**样式 | **原子化**工具类 |
| 类比 | cva / Stitches | 类型安全版 Tailwind |
| 粒度 | 一个组件一份 recipe，含 base+变体 | 一个个原子属性，随处拼 |
| 典型场景 | Button/Badge 等有变体维度的组件 | 布局间距/颜色等高频原子样式 |
| 可组合 | base/variant 可吃 sprinkles 结果 | 可与 style 数组组合 |

二者**互补**：常见做法是用 sprinkles 铺底层原子样式，用 recipes 封装带变体的组件——recipe 的 `base`/变体值里直接调用 `sprinkles({...})`。

---

多变体与原子化就绪后，下一步进入 [dynamic 与构建集成](./dynamic-and-build)：`assignInlineVars` 运行时动态主题、各打包器插件配置与 SSR/RSC 友好性。
