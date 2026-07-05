---
layout: doc
outline: [2, 3]
---

# 参考：Panda CSS API 速查

> 基于 Panda CSS 1.11.4 · 核于 2026-07

## 速查

- **定位**：构建期类型安全 CSS-in-JS 引擎，静态分析 → PostCSS 原子 CSS → codegen；Chakra 团队出品，`@pandacss/dev` 实测 `1.11.4`（MIT）。运行时**不生成/不注入**样式。
- **核心链路**：`install @pandacss/dev` → `panda init -p` → 配 `include`/PostCSS → 入口 CSS `@layer reset,base,tokens,recipes,utilities;` → `panda codegen` → 写 `css()`。
- **运行期 API**（来自 `styled-system`）：`css`/`cva`/`sva`/`cx`（`/css`）、`token`（`/tokens`）、配方函数（`/recipes`）、pattern 函数（`/patterns`）、`styled`/`Box`/`splitCssProps`（`/jsx`）。
- **配置期 API**（来自 `@pandacss/dev`）：`defineConfig`/`defineRecipe`/`defineSlotRecipe`/`defineTokens`/`defineTextStyles`/`definePattern`。
- **级联层**：`@layer reset, base, tokens, recipes, utilities`（右者优先级最高）。
- **断点**：`sm`/`md`/`lg`/`xl`/`2xl`；响应式用 `{ base, md, ... }` 条件对象。
- **官方资源**：[panda-css.com](https://panda-css.com) ｜ [GitHub](https://github.com/chakra-ui/panda) ｜ [npm @pandacss/dev](https://www.npmjs.com/package/@pandacss/dev)。

## 一、导入路径速查

| 导入 | 来源 | 用途 |
| --- | --- | --- |
| `css` / `cva` / `sva` / `cx` | `styled-system/css` | 写样式 / 原子配方 / 插槽配方 / 拼类名 |
| `token` | `styled-system/tokens` | 按路径读 token 值（`token.var()` 给 var()） |
| 配方函数（如 `button`） | `styled-system/recipes` | 消费配置配方 |
| `stack` / `grid` / `flex` … | `styled-system/patterns` | 布局原语（函数式） |
| `styled` / `Box` / `Stack` / `splitCssProps` | `styled-system/jsx` | JSX 工厂/组件（需 `jsxFramework`） |
| `HTMLStyledProps` / `RecipeVariantProps` | `styled-system/types` | 类型工具 |
| `defineConfig` / `defineRecipe` / `defineTokens` / `defineTextStyles` | `@pandacss/dev` | 配置期 API |

## 二、核心 API 速查

| API | 说明 |
| --- | --- |
| `css(obj[, obj2])` | 样式对象 → 原子类名字符串；多参**深合并、后者覆盖前者** |
| `cva({ base, variants, compoundVariants, defaultVariants })` | 原子配方：全量生成、不支持响应式变体、可与组件共置 |
| `defineRecipe({...})` | 配置配方：JIT 生成、支持响应式变体、须注册进 config |
| `sva({ slots, base, variants })` / `defineSlotRecipe` | 插槽配方：多部件组件，返回各 slot 类名映射 |
| `cx(...classes)` | 拼接 className（类似 clsx） |
| `token('colors.red.400')` | 按路径读 token；`token.var()` 给 `var(--...)` |
| `styled('button', recipe?, options?)` | JSX 工厂：样式当 props；选项含 `forwardProps`/`shouldForwardProp`/`defaultProps`/`dataAttr` |
| `splitCssProps(props)` | 拆样式 props 与其余 props（自定义组件吃样式 props） |
| `recipe.splitVariantProps(props)` | 拆变体 props 与其余 props |

## 三、条件 / 伪状态速查

| 类别 | 示例 |
| --- | --- |
| 交互态 | `_hover` `_active` `_focus` `_focusVisible` `_disabled` |
| 子元素 | `_first` `_last` `_odd` `_even` |
| 伪元素 | `_before` `_after` `_placeholder` |
| ARIA/data | `_expanded`(aria-expanded) `_checked` `_selected`；任意 `'&[data-state=closed]'` |
| 朝向/方向 | `_horizontal` `_vertical` `_portrait` `_landscape` `_ltr` `_rtl` |
| 明暗 | `_dark` `_light` |
| 组/兄弟 | `_groupHover` `_groupFocus` `_peerHover`（父/兄加 `group`/`peer` 类） |
| at-rule 键 | `'@media (...)'` `'@container'` `'@supports'` `'@layer'` |

> Panda 内置 80+ 条件；属性级条件用 `{ base, _hover, md, ... }` 对象，`base` 为默认值，可嵌套。

## 四、配置字段速查（panda.config.ts）

| 字段 | 作用 |
| --- | --- |
| `preflight` | 启用 CSS reset（`@layer reset`） |
| `include` / `exclude` | 静态分析的扫描范围（漏配→样式不生成） |
| `outdir` | 生成目录，默认 `styled-system` |
| `jsxFramework` | `react`/`preact`/`vue`/`qwik`/`solid`，启用 JSX 组件运行时 |
| `strictTokens` / `strictPropertyValues` | 只准 token 值 / 校验属性值；破例用 `'[任意值]'` 逃生舱 |
| `theme.tokens` / `theme.semanticTokens` | 原始 token / 语义 token（花括号引用 `{colors.red.500}`、明暗 `{ base, _dark }`） |
| `theme.textStyles` | 命名排版组合（`textStyle` 消费） |
| `theme.recipes` | 注册配置配方 |
| `staticCss` | 强制全量生成未被静态命中的变体（组件库分发） |
| `conditions` / `patterns` / `utilities` / `globalCss` / `hooks` | 自定义条件 / 布局原语 / 工具属性 / 全局样式 / 构建钩子 |

## 五、tokens 类型速查

colors、gradients、sizes、spacing、fonts、fontSizes、fontWeights、letterSpacings、lineHeights、radii、borders、borderWidths、shadows、easings、opacity、zIndex、assets、durations、animations、aspectRatios、cursors（共 20+ 种）。

- **必须 `value` 包裹**：`{ value: '#0FEE0F' }`；嵌套默认用 `DEFAULT` 键。
- **落地**：`--colors-primary` 等 CSS 变量，声明在 `:where(:root, :host)`（低特异性，便于局部换主题）。

## 六、静态分析约束（易踩坑）

| 坑 | 结果 | 正解 |
| --- | --- | --- |
| 传运行时动态值给 `css()`（`css({ color: fromApi() })`） | 漏提 | 用 token/CSS 变量，或有限取值做 recipe 变体 |
| 运行时重命名属性（`circleSize`→`size`） | 漏提 | prop 名直接对应样式属性，或走 recipe |
| 以为「零运行时 = 无 JS」 | 误解 | 仍带拼类名的轻量运行时，只是不在浏览器产/注 CSS |
| 配置配方变体没被静态用到却想分发 | CSS 里没有该变体 | 用 `staticCss` 全量生成 |
| `cva` 想传响应式变体 props | 不支持 | 改用 `defineRecipe`（配置配方支持） |
| 老浏览器不支持 `@layer` | 层失效 | `@csstools/postcss-cascade-layers` polyfill |

## 七、选型对比：CSS-in-JS 组

| 维度 | Panda CSS | StyleX | vanilla-extract | CSS Modules | Tailwind |
| --- | --- | --- | --- | --- | --- |
| 出品 | Chakra 团队 | Meta | Seek（开源社区） | 打包器生态 | Tailwind Labs |
| 提取机制 | 静态分析源码 → PostCSS | 构建期编译 | 构建期执行 `.css.ts` | 打包器作用域类名 | 扫描 class 生成 |
| 运行时 | 极轻（不注入） | 极轻 | 零 | 零 | 零 |
| 产物 | 原子 CSS | 原子 CSS | 作用域 class | 作用域 class | 原子 CSS |
| 设计系统层 | 完整（token/recipe/pattern） | 少（偏原语） | 中（recipe/sprinkles） | 无 | 中（theme+工具类） |
| 类型安全 | 强 | 强 | 强 | 弱 | 弱（靠插件） |
| RSC/SSR | 友好 | 友好 | 友好 | 友好 | 友好 |
| 一句话 | 类型安全的完整样式引擎 | 可预测的原子样式原语 | 文件即样式契约 | 局部作用域基线 | class 字符串原子化 |

## 八、权威链接

- [Panda CSS 官网](https://panda-css.com) —— 首页与文档入口
- [文档首页](https://panda-css.com/docs) —— overview / installation / concepts / theming / customization
- [Why Panda?](https://panda-css.com/docs/overview/why-panda) —— 定位与构建期机制
- [Writing Styles](https://panda-css.com/docs/concepts/writing-styles) ｜ [Recipes](https://panda-css.com/docs/concepts/recipes) ｜ [Patterns](https://panda-css.com/docs/concepts/patterns) ｜ [Conditional Styles](https://panda-css.com/docs/concepts/conditional-styles)
- [Tokens](https://panda-css.com/docs/theming/tokens) ｜ [Text Styles](https://panda-css.com/docs/theming/text-styles) ｜ [Cascade Layers](https://panda-css.com/docs/concepts/cascade-layers)
- [GitHub · chakra-ui/panda](https://github.com/chakra-ui/panda) —— 源码与 Issue
- [npm · @pandacss/dev](https://www.npmjs.com/package/@pandacss/dev) —— 版本实测 `1.11.4`
