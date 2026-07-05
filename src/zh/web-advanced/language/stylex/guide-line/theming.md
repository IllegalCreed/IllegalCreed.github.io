---
layout: doc
outline: [2, 3]
---

# 变量与主题：defineVars / createTheme

> 基于 StyleX 0.19 · 核于 2026-07

## 速查

- **`stylex.defineVars({...})`**：声明一组设计令牌（变量），编译期自动生成唯一的 CSS 自定义属性名。
- **文件约定**：变量必须放在 `*.stylex.js`/`.ts`/`.mjs` 等**专用扩展名**文件里，且必须**具名导出**（不能默认导出/包在中间对象里）。
- **本质是 CSS 变量**：`defineVars` 编译成真正的 `--xxx` 自定义属性，享受 CSS 级联/继承，主题切换零运行时。
- **条件值**：变量值可写成 `{ default: 'black', '@media (prefers-color-scheme: dark)': 'white' }`，深浅模式纯靠 CSS 媒体查询，无需 JS。
- **派生变量**：值可为函数，编译期求值并引用同组变量，如 `() => color-mix(in srgb, colors.text, transparent 50%)`；编译器检测循环引用。
- **`stylex.createTheme(varGroup, {...})`**：针对某变量组生成主题对象，**差量覆盖**部分变量；未覆盖的回退默认值。
- **应用主题**：`stylex.props(theme, styles.container)` 铺到子树根元素，其下所有引用该组变量处改用新值。
- **主题叠加**：同一变量组多个主题作用于同一元素，最后应用的胜。
- **`stylex.defineConsts({...})`**：声明编译期常量（如断点字符串），编译时内联，**不生成 CSS 变量、不可运行时切换**——与 `defineVars` 用途不同。
- ⚠️ **需开 `unstable_moduleResolution`**：主题 API 依赖编译器跨文件解析变量，Babel 配置不开则不工作。

## 一、defineVars：声明设计令牌

主题化的起点是 `stylex.defineVars()`，声明一组变量（设计令牌）。它**必须放在专用扩展名文件**（`tokens.stylex.ts`）里、**具名导出**：

```tsx
// tokens.stylex.ts
import * as stylex from '@stylexjs/stylex';

export const colors = stylex.defineVars({
  accent: 'blue',
  background: 'white',
  primaryText: 'black',
  secondaryText: '#333',
});

export const spacing = stylex.defineVars({
  small: '4px',
  medium: '8px',
  large: '16px',
});
```

这些变量编译后是**真正的 CSS 自定义属性**（`--xxx`，名字由编译器自动生成且唯一），因此天然享受 CSS 的级联与继承。在 `create` 里像值一样引用它们：

```tsx
// Card.tsx
import * as stylex from '@stylexjs/stylex';
import { colors, spacing } from './tokens.stylex';

const styles = stylex.create({
  card: {
    color: colors.primaryText,
    backgroundColor: colors.background,
    padding: spacing.medium,
  },
});
```

> 提示：从 `.stylex.js` 导入的变量是 `create` 内部唯一被允许的「导入值」——正因为它们编译期可解析。这需要在插件里开启 `unstable_moduleResolution`。

## 二、条件值与派生变量

变量本身就能带条件值，**深浅模式**因此不必写两套样式、也不必切 className，纯靠 CSS 媒体查询：

```tsx
// tokens.stylex.ts
const DARK = '@media (prefers-color-scheme: dark)';

export const colors = stylex.defineVars({
  primaryText: { default: 'black', [DARK]: 'white' },
  background: { default: 'white', [DARK]: 'black' },
  accent: { default: 'blue', [DARK]: 'lightblue' },
});
```

变量还能**相互派生**：值写成函数，编译期求值并可引用同组其它变量，让令牌之间形成可维护的推导关系；编译器会检测缺失或循环引用：

```tsx
export const colors = stylex.defineVars({
  text: 'black',
  textMuted: () => `color-mix(in srgb, ${colors.text}, transparent 50%)`,
  textSubtle: () => `color-mix(in srgb, ${colors.textMuted}, transparent 50%)`,
});
```

## 三、createTheme：为子树换主题

`stylex.createTheme()` 针对某个变量组生成一份「主题对象」，**差量覆盖**其中部分变量，再用 `props()` 应用到某个元素，它的**整棵子树**内引用这些变量的地方都会改用新值：

```tsx
// themes.ts
import * as stylex from '@stylexjs/stylex';
import { colors } from './tokens.stylex';

const DARK = '@media (prefers-color-scheme: dark)';

export const dracula = stylex.createTheme(colors, {
  primaryText: { default: 'purple', [DARK]: 'plum' },
  accent: 'red',
  background: { default: '#555', [DARK]: 'black' },
  // 未列出的变量（如 secondaryText）自动回退 defineVars 的默认值
});
```

应用主题——把主题对象作为 `props()` 的一个参数铺到子树根：

```tsx
import { dracula } from './themes';

function Panel({ children }) {
  return <div {...stylex.props(dracula, styles.container)}>{children}</div>;
}
```

三条规则要记牢：

- **差量覆盖**：只有列出的变量被改写，未列出的回退到 `defineVars` 的默认值。
- **作用于子树**：主题应用在哪个元素，效果就覆盖到它及其后代（靠 CSS 变量级联）。
- **后者胜**：同一变量组的多个主题作用到同一元素时，最后应用的主题生效。

主题对象可以在代码库任意处创建、跨文件传递，这让「多品牌 / 多皮肤 / 局部换色」都变成零运行时的纯 CSS 变量切换。

## 四、defineVars vs defineConsts

别把 `defineConsts` 和 `defineVars` 搞混，它们机制不同、用途不同：

| API | 产物 | 能否运行时切换 | 典型用途 |
| --- | --- | --- | --- |
| `stylex.defineVars()` | 真正的 CSS 自定义属性（`--xxx`） | 能（`createTheme` / 级联） | 可主题化的设计令牌：颜色、间距、字体 |
| `stylex.defineConsts()` | 编译期常量，直接**内联**进 CSS | 不能 | 复用的固定值：媒体查询字符串、断点、动画时长常量 |

```tsx
// constants.stylex.ts
export const breakpoints = stylex.defineConsts({
  small: '@media (max-width: 640px)',
  large: '@media (min-width: 1024px)',
});
```

一句话：**要能换值（主题）→ `defineVars`；只是复用一个固定常量 → `defineConsts`。**

---

主题体系搞定后，下一步进入 [类型安全与现代 API](./types-and-modern-apis)：`StyleXStyles` 约束、`StaticStyles`/`StyleXStylesWithout`，以及 `when.*`/`positionTry`/`viewTransitionClass` 等前沿能力。
