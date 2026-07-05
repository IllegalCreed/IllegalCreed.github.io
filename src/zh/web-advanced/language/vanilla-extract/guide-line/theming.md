---
layout: doc
outline: [2, 3]
---

# 主题系统：类型安全的令牌与契约

> 基于 vanilla-extract 1.21.1 · 核于 2026-07

## 速查

- **`createTheme(tokens)`** → 返回元组 `[themeClass, vars]`：主题 class（挂元素上生效）+ 类型化令牌契约（每个叶子是 CSS 变量引用）。用法 `export const [themeClass, vars] = createTheme({...})`。
- **多主题复用契约**：`createTheme(vars, {...新值})`——复用同一批 CSS 变量、在**新 class** 里赋新值；组件里读的 `vars.x` 引用不变，切换 class 即切主题。
- **`createThemeContract(shape)`** → **只定义契约、不生成 CSS**；契约先行，配合按主题代码分割。
- **`createGlobalTheme(selector, tokens)`** → 把令牌赋到**全局选择器**（如 `:root`），**不返回 class**；`createGlobalTheme(selector, contract, tokens)` 实现既有契约。
- **`createGlobalThemeContract(map, mapFn)`** → 契约映射到**全局 CSS 变量名**，`mapFn` 自定义变量名（对接已有 `--设计系统` 命名）。
- **`assignVars(contract, values)`** → 在某个 style/选择器/媒体查询里**一次性给整个契约赋值**（如深浅模式条件覆盖）。
- **类型安全**：契约结构变更、漏赋值 → **编译期报错**，杜绝令牌漂移。
- **令牌即 CSS 变量**：编译后形如 `var(--color-brand__hash)`，自动作用域化。
- ⚠️ 令牌值都是**字符串**（`'16px'`/`'#333'`），因为它们最终是 CSS 变量值。

## 一、`createTheme`：主题 class + 类型化令牌

`createTheme(tokens)` 一步到位：生成一份 CSS 变量声明、返回**元组** `[themeClass, vars]`。

```ts
// theme.css.ts
import { createTheme } from '@vanilla-extract/css';

export const [themeClass, vars] = createTheme({
  color: {
    brand: '#5b21b6',
    text: '#1f2937',
  },
  space: {
    small: '4px',
    medium: '8px',
    large: '16px',
  },
});
```

- `themeClass`：一个 class 名，挂到某个元素上，其子树即可通过 `vars` 读到这套值。
- `vars`：一份**和传入结构同形**的对象，但每个叶子已变成对应 CSS 变量的引用（如 `vars.color.brand` 编译成 `var(--color-brand__hash)`）。

在样式里引用令牌：

```ts
// button.css.ts
import { style } from '@vanilla-extract/css';
import { vars } from './theme.css';

export const button = style({
  background: vars.color.brand,
  color: vars.color.text,
  padding: vars.space.medium,
});
```

在应用根挂上 `themeClass`：

```tsx
import { themeClass } from './theme.css';
import { button } from './button.css';

export function App() {
  return (
    <div className={themeClass}>
      <button className={button}>Buy</button>
    </div>
  );
}
```

::: tip 令牌值是字符串
注意 `space.medium: '8px'` 是字符串，因为令牌最终成为 CSS 变量的值。用的时候直接 `padding: vars.space.medium` 即可，不必再补单位。
:::

## 二、多主题：复用同一套契约

要做深/浅两套主题，**不要**再 `createTheme({...})` 生成一套全新变量（那样组件里读的引用会对不上）。正确做法是把**已有契约 vars** 作为第一个参数传入，复用同一批 CSS 变量、只在新 class 里赋新值：

```ts
import { createTheme } from '@vanilla-extract/css';

// 亮色主题：同时产出契约
export const [lightClass, vars] = createTheme({
  color: { bg: '#ffffff', text: '#111111' },
});

// 暗色主题：复用 vars 契约，仅赋新值 → 新 class
export const darkClass = createTheme(vars, {
  color: { bg: '#111111', text: '#eeeeee' },
});
```

组件始终读 `vars.color.bg`——把根元素的 class 在 `lightClass`/`darkClass` 间切换，整棵子树的取值随之切换，且**零运行时**（只是换了个 class）。

## 三、契约先行：`createThemeContract`

`createThemeContract(shape)` 只**定义契约的结构**、**不生成任何 CSS**。它把「契约」与「实现」解耦，从而支持**按主题代码分割**：主契约文件很小，各主题实现文件各自 import 自己的 CSS，用户只加载当前主题。

```ts
// contract.css.ts —— 只定义结构，不产出 CSS
import { createThemeContract } from '@vanilla-extract/css';

export const vars = createThemeContract({
  color: {
    bg: null,     // 占位，值由各实现提供
    text: null,
  },
});
```

```ts
// theme-dark.css.ts —— 实现契约（这里才产出 CSS）
import { createTheme } from '@vanilla-extract/css';
import { vars } from './contract.css';

export const darkClass = createTheme(vars, {
  color: { bg: '#111', text: '#eee' },
});
```

::: warning createThemeContract vs createTheme
`createThemeContract` **不生成 CSS**、也不返回 class，只返回可复用的 `vars`；`createTheme` 会生成一个作用域 class 与对应 CSS。契约先行更利于大型设计系统的代码分割与多主题管理。
:::

## 四、全局主题：`createGlobalTheme` 与 `createGlobalThemeContract`

`createGlobalTheme(selector, tokens)` 把令牌赋到**指定的全局选择器**（如 `:root`），**不生成也不返回 class**——适合一套全站默认主题：

```ts
import { createGlobalTheme } from '@vanilla-extract/css';

export const vars = createGlobalTheme(':root', {
  color: { brand: 'blue' },
  font: { body: 'arial' },
});
// 变量直接挂在 :root 下，全站可用，无需挂 class
```

也能用它**实现一个既有契约**（三参形式）：`createGlobalTheme(selector, contract, tokens)`。

`createGlobalThemeContract(map, mapFn)` 用于对接**已有命名约定**的全局 CSS 变量：`mapFn` 自定义每个 token 映射到的变量名，从而与设计系统现有的 `--color-brand` 之类对齐，而非自动哈希：

```ts
import { createGlobalThemeContract } from '@vanilla-extract/css';

export const vars = createGlobalThemeContract(
  {
    color: { brand: 'color-brand', text: 'color-text' },
  },
  (value) => `--ds-${value}`,   // 生成 --ds-color-brand 等固定名
);
```

## 五、批量赋值：`assignVars`

`assignVars(contract, values)` 在**某个 style / 选择器 / 媒体查询**里，一次性给整个契约（或其子树）赋值——常用于深浅模式的条件覆盖：

```ts
import { style, assignVars } from '@vanilla-extract/css';
import { vars } from './contract.css';

export const root = style({
  vars: assignVars(vars.color, { bg: '#fff', text: '#111' }),  // 默认亮色

  '@media': {
    '(prefers-color-scheme: dark)': {
      vars: assignVars(vars.color, { bg: '#111', text: '#eee' }), // 系统暗色时整组覆盖
    },
  },
});
```

`assignVars` 会按契约结构**完整赋值**（漏项类型报错），比逐个 `[var]: value` 更安全。

## 六、类型安全带来的价值

主题契约是**类型化**的：`vars` 的结构由 TS 记住，因此——

- 引用不存在的令牌（`vars.color.brnad`）→ 编译期报错；
- 实现契约时漏赋某个值 → 编译期报错（`All theme values must be provided`）；
- 契约结构调整（新增/改名令牌）→ 所有实现处编译期暴露，不会静默漂移。

这把「设计令牌」从「一堆约定俗成的字符串」升级为**编译期可校验的契约**，是 vanilla-extract 相对 CSS Modules（无类型令牌）的关键增量。

---

主题掌握后，下一步进入 [recipes 与 sprinkles](./recipes-and-sprinkles)：`recipe()` 管多变体组件样式、`sprinkles()` 造零运行时原子化工具类。
