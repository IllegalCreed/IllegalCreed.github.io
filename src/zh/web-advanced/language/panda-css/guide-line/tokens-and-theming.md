---
layout: doc
outline: [2, 3]
---

# Tokens 与主题

> 基于 Panda CSS 1.11.4 · 核于 2026-07

## 速查

- **Token = 设计决策的平台无关键值对**；定义在 `theme.tokens`（新增用 `theme.extend.tokens`）下，按类型分组（colors/spacing/fonts/sizes/radii……）。
- **必须用 `value` 包裹**：`colors: { primary: { value: '#0FEE0F' } }`；可选 `description`。扁平写法 `primary: '#0FEE0F'` 非法。
- **20+ token 类型**：colors、gradients、sizes、spacing、fonts、fontSizes、fontWeights、letterSpacings、lineHeights、radii、borders、borderWidths、shadows、easings、opacity、zIndex、assets、durations、animations、aspectRatios、cursors。
- **落地为 CSS 变量**：token 自动生成 `--colors-primary` 等，声明在 `:where(:root, :host)`（`@layer tokens`）；改变量即换主题。
- **消费**：样式里直接写 token 名 `css({ color: 'primary' })`；按路径取值用 `token('colors.red.400')`（`styled-system/tokens`），`token.var()` 给 `var()` 形式。
- **`DEFAULT` 键**：嵌套 token 用 `DEFAULT` 作默认，`bg` 取默认、`bg.muted` 取子项。
- **语义 token `semanticTokens`**：用花括号引用原始 token——`danger: { value: '{colors.red.500}' }`，把「设计意图」与「具体值」解耦。
- **明暗模式**：语义 token 用条件值 `value: { base: '{colors.red.600}', _dark: '{colors.red.400}' }`，切主题自动切换、样式不改。
- **textStyles**：`defineTextStyles` 定义命名排版组合（fontFamily/fontSize/lineHeight/letterSpacing…），用 `css({ textStyle: 'body' })` 套用；建议不混入布局/颜色。
- **cascade layers**：`@layer reset, base, tokens, recipes, utilities`——后声明者优先级更高，`utilities` 最高；`:where()` 保持低特异性、便于局部覆盖/换主题。
- **老浏览器**：不支持 `@layer` 时用 `@csstools/postcss-cascade-layers` polyfill。

## 一、定义 token

Token 是「管理设计决策的平台无关键值对」。在 `panda.config.ts` 的 `theme` 下按类型分组定义，**每个 token 的值必须嵌套在带 `value` 键的对象里**（为将来的 `description` 等元数据留位置）：

```ts
import { defineConfig } from '@pandacss/dev';

export default defineConfig({
  theme: {
    extend: {
      tokens: {
        colors: {
          primary: { value: '#0FEE0F' },
          secondary: { value: '#EE0F0F' },
        },
        fonts: {
          body: { value: 'system-ui, sans-serif' },
        },
        spacing: {
          gutter: { value: '24px' },
        },
      },
    },
  },
});
```

Panda 支持 20+ 种 token 类型：颜色、渐变、尺寸、间距、字体、字号、字重、字距、行高、圆角、边框、边框宽度、阴影、缓动、透明度、层级、资源、时长、动画、宽高比、光标等。

嵌套 token 用 `DEFAULT` 键表达「该组的默认值」：

```ts
colors: {
  bg: {
    DEFAULT: { value: '{colors.gray.100}' },
    muted: { value: '{colors.gray.200}' },
  },
}
// 用 bg 取默认、bg.muted 取子项
```

## 二、消费 token

样式对象里**直接写 token 名**即可（属性会限定到对应 token 类型）：

```tsx
import { css } from '../styled-system/css';

<p className={css({ color: 'primary', fontFamily: 'body' })}>Hello</p>;
```

需要在样式里按路径拿 token 的**原始值/变量引用**（比如拼进 `boxShadow`、`gradient` 这类复合值）时，用 `token()`：

```ts
import { token } from '../styled-system/tokens';

token('colors.red.400'); // 取该 token 的值
token.var('colors.red.400'); // 直接给 var(--colors-red-400) 形式
```

## 三、token 如何变成 CSS 变量

每个 token 会自动生成对应的 **CSS 自定义属性（CSS 变量）**，声明在低特异性的根选择器下（落在 `@layer tokens`）：

```css
:where(:root, :host) {
  --colors-primary: #0fee0f;
  --colors-secondary: #ee0f0f;
}
```

用 `:where()` 包裹是为了让变量声明**特异性为 0**——容易被后续样式覆盖，也便于在某个容器/组件作用域内重定义变量（局部换主题）。样式里用到 token 时引用的正是这些变量，所以「改变量 = 整体换肤」。

## 四、语义 token 与明暗模式

原始 token 描述「具体值」（`red.500`），**语义 token** 描述「设计意图」（`danger`），后者用**花括号引用语法**指向前者：

```ts
semanticTokens: {
  colors: {
    danger: { value: '{colors.red.500}' },
    success: { value: '{colors.green.500}' },
  },
}
```

意图与具体值解耦后，实现**明暗模式**只需给语义 token 一个**条件值对象**，为明暗分别引用：

```ts
semanticTokens: {
  colors: {
    danger: {
      value: { base: '{colors.red.600}', _dark: '{colors.red.400}' },
    },
    'bg.canvas': {
      value: { base: '{colors.white}', _dark: '{colors.gray.900}' },
    },
  },
}
```

切到暗色（`.dark` / `[data-theme=dark]` 触发 `_dark` 条件）时，`danger` 自动指向暗色引用，**所有用到 `danger` 的样式代码一行都不用改**——因为切换发生在 CSS 变量层。

## 五、textStyles：命名排版组合

把一组常用字体属性打包成命名的排版样式，用 `defineTextStyles` 定义、注册进 `theme.textStyles`：

```ts
// text-styles.ts
import { defineTextStyles } from '@pandacss/dev';

export const textStyles = defineTextStyles({
  body: {
    description: '正文排版',
    value: {
      fontFamily: 'Inter',
      fontWeight: '500',
      fontSize: '16px',
      lineHeight: '24px',
      letterSpacing: '0',
    },
  },
  heading: {
    DEFAULT: { value: { fontSize: '1.5rem', fontWeight: '700' } },
    h1: { value: { fontSize: '2.5rem', fontWeight: '800' } },
  },
});
```

```ts
// panda.config.ts
import { defineConfig } from '@pandacss/dev';
import { textStyles } from './text-styles';

export default defineConfig({ theme: { extend: { textStyles } } });
```

消费时用 `textStyle` 属性一次套用整组（嵌套变体用 `heading.h1`）：

```tsx
<p className={css({ textStyle: 'body' })}>正文</p>
<h1 className={css({ textStyle: 'heading.h1' })}>大标题</h1>
```

官方建议：textStyle 里只放排版属性，**别混入布局（margin/padding）或颜色**——那些交给别的样式/token 管理，保持组合的纯粹与可复用。

## 六、cascade layers 控制特异性

Panda 把生成的 CSS 组织进 5 个级联层，样式表顶部用一行声明它们的优先级顺序：

```css
@layer reset, base, tokens, recipes, utilities;
```

| 层 | 内容 | 优先级 |
| --- | --- | --- |
| `reset` | CSS reset（`preflight: true` 时） | 最低 |
| `base` | `globalStyles` 全局样式 | ↑ |
| `tokens` | token / semanticToken 的 CSS 变量 | ↑ |
| `recipes` | 配置配方的组件样式 | ↑ |
| `utilities` | 原子工具类（`css()` 产出） | 最高 |

**后声明的层优先级更高**：`utilities` 稳定压过 `recipes` 与 `base`，无需靠 `!important` 或加长选择器。配合 token 的 `:where()` 低特异性，样式覆盖变得可预测——这是 Panda「用现代 CSS 管理特异性」哲学的核心。老浏览器不支持 `@layer` 时，可用 `@csstools/postcss-cascade-layers` 插件做 polyfill。

---

样式、配方、token 都齐了，下一页拆开 Panda 的构建期原理与工程配置：[静态提取原理与配置](./static-extraction-and-config)。
