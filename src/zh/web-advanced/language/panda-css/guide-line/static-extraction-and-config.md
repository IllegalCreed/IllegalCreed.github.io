---
layout: doc
outline: [2, 3]
---

# 静态提取原理与配置

> 基于 Panda CSS 1.11.4 · 核于 2026-07

## 速查

- **三步管线**：① 静态分析源码提取样式定义 → ② PostCSS 把它们转成原子 CSS 文件 → ③ codegen 产出轻量运行时工具与 `styled-system` 目录。
- **零/轻运行时的真相**：仍带一小段运行时 JS（拼类名的优化函数），但**不在浏览器生成样式、不注入 `<head>`**；样式构建期定稿为静态 CSS。
- **静态分析约束**：值须可静态分析——运行时才算出的动态值、运行时重命名属性会**漏提**；改用 token/CSS 变量/recipe 变体（可枚举）。
- **`styled` JSX 工厂**：`styled.div`/`styled('button', recipe)`（`styled-system/jsx`）；`<styled.button bg="blue.500">` 把 CSS 属性当 props，构建期提取。
- **`jsxFramework`**：`react`/`preact`/`vue`/`qwik`/`solid`——设了才生成 JSX 组件运行时；改后 `panda codegen --clean`。
- **工厂选项**：`defaultProps` / `dataAttr` / `shouldForwardProp` / `forwardProps`（控制哪些 props 透传到 DOM）。
- **自定义组件吃样式 props**：`splitCssProps`（`styled-system/jsx`）+ `HTMLStyledProps<'div'>` 类型。
- **配置字段**：`preflight` / `include` / `exclude` / `outdir`(默认 `styled-system`) / `jsxFramework` / `strictTokens` / `strictPropertyValues` / `theme` / `conditions` / `patterns` / `staticCss` / `globalCss`。
- **`staticCss`**：强制全量生成未被静态命中的配方/工具变体（组件库分发）。
- **RSC/SSR 友好**：样式构建期定稿、运行时不注入、不依赖 hydration，天然兼容 Server Components。
- **上手流程**：`install @pandacss/dev` → `panda init -p` → 配 include/postcss → 入口 CSS 写 `@layer` → `panda codegen`（挂 `prepare`）→ 写 `css()`。

## 一、静态提取三步管线

Panda 的构建期工作可拆成三个机制：

1. **静态分析（Static Analysis）**：在构建期解析源码，识别并提取出 `css()` / `cva()` / recipe / pattern / `styled` 里的样式定义。
2. **PostCSS 管线**：把提取到的样式数据转成**原子 CSS** 文件（这也是 Panda「兼容任何支持 PostCSS 的框架」的原因）。
3. **Codegen**：生成一小段轻量运行时工具，以及 `styled-system` 输出目录（`css`/`tokens`/`recipes`/`patterns`/`jsx`/`types`）。

关键结论：**样式在构建期就定稿成静态 CSS**，运行时那段 JS 只负责「把样式对象的键值拼成类名字符串」，既不生成样式也不注入 `<head>`。这正是它相对 Emotion/styled-components 的根本不同。

## 二、静态分析的边界（重要）

因为提取靠**静态分析源码**，Panda 只能看见「构建期可确定」的值。两类写法会踩坑：

**① 运行时才算出的动态值**——提取不到：

```ts
// ❌ getColorFromApi() 运行时才知道结果，构建期分析拿不到
css({ color: getColorFromApi() });

// ✅ 改用 token / CSS 变量，或有限取值做成 recipe 变体（可枚举）
css({ color: 'brand.primary' });
button({ tone: userTone }); // tone 的取值集合在配方里是静态穷举的
```

**② 运行时重命名属性**——静态分析追不到映射：

```tsx
// ❌ 把自定义 prop 名在运行时映射回样式属性，Panda 看不到这层动态映射
function Circle({ circleSize }) {
  return <div className={css({ size: circleSize })} />; // circleSize→size 的映射漏提
}

// ✅ 让 prop 名与样式属性直接对应，或走 recipe 变体
```

一句话：**能被静态穷举/直接书写的值才安全**；需要「无穷动态」时，走 CSS 变量在运行时改变量，而不是让 Panda 提取一个它看不见的值。

## 三、styled JSX 工厂与样式 props

设置 `jsxFramework` 后，`styled-system/jsx` 会生成一个 `styled` 工厂，做出「能直接接收 CSS 属性作为 props」的组件。两种用法：

```tsx
import { styled } from '../styled-system/jsx';

// ① 直接创建元素，样式当 props 写（构建期静态提取）
const StyledButton = styled('button');
<StyledButton bg="blue.500" color="white" py="2" px="4" rounded="md">
  Button
</StyledButton>;

// ② 带配方定义（等价于把 recipe 绑到组件上）
const Button = styled('button', {
  base: { py: '2', px: '4', rounded: 'md' },
  variants: {
    variant: {
      primary: { bg: 'blue.500', color: 'white' },
      secondary: { bg: 'gray.500', color: 'white' },
    },
  },
});
```

也可以用命名空间形式 `<styled.button bg="blue.500" />`。启用它需在配置里声明框架：

```ts
// panda.config.ts
export default defineConfig({ jsxFramework: 'react' }); // 或 preact/vue/qwik/solid
// 改动后跑 panda codegen --clean 重生 JSX 运行时
```

### 工厂选项与自定义组件

`styled()` 第三参可配置行为，重点是**控制哪些 props 透传到 DOM**（样式 props 默认被消费、不落 DOM）：

| 选项 | 作用 |
| --- | --- |
| `defaultProps` | 默认 props 与样式覆盖 |
| `dataAttr` | 加 `data-recipe` 属性（便于测试） |
| `shouldForwardProp` | 用函数自定义哪些 prop 透传到 DOM |
| `forwardProps` | 用列表指定要透传的 prop 名 |

想让**自己写的组件**也吃样式 props，用 `splitCssProps` 把样式 props 与其余 props 拆开：

```tsx
import { css } from '../styled-system/css';
import { splitCssProps } from '../styled-system/jsx';
import type { HTMLStyledProps } from '../styled-system/types';

export function Card(props: HTMLStyledProps<'div'>) {
  const [cssProps, restProps] = splitCssProps(props);
  const className = css({ display: 'flex' }, cssProps);
  return <div {...restProps} className={className} />;
}
```

⚠️ 注意 Panda 的静态本质：**不能在运行时重命名属性**——别把 `circleSize` 之类的自定义 prop 名运行时映射回 `size`，静态分析看不到会漏提。

## 四、panda.config.ts 常用字段

```ts
import { defineConfig } from '@pandacss/dev';

export default defineConfig({
  preflight: true, // CSS reset
  include: ['./src/**/*.{ts,tsx,js,jsx}'], // 扫描范围（漏配→样式不生成）
  exclude: [], // 排除个别文件
  outdir: 'styled-system', // 生成目录（默认）
  jsxFramework: 'react', // 启用 JSX 组件
  strictTokens: true, // 只准 token 值
  theme: {
    extend: {
      tokens: {
        /* ... */
      },
      semanticTokens: {
        /* ... */
      },
      recipes: {
        /* ... */
      },
      textStyles: {
        /* ... */
      },
    },
  },
  // 组件库分发：强制全量生成未被静态命中的变体
  staticCss: { recipes: { button: [{ size: ['sm', 'lg'], visual: ['solid'] }] } },
});
```

其它常见字段：`conditions`（自定义条件）、`patterns`（自定义布局原语）、`globalCss`（全局样式）、`utilities`（自定义工具属性）、`hooks`（构建钩子）。

## 五、为什么天然适配 RSC / SSR

传统运行时 CSS-in-JS 依赖「运行时注入样式」，与 React Server Components 不兼容（Server 端没有 DOM/上下文去挂样式，客户端要靠 hydration 补）。Panda 把这条链彻底前移：

- 样式**构建期就提取成静态 CSS**，浏览器直接引入，不需要运行时生成/注入；
- 不依赖 React 上下文或客户端 hydration 去挂样式，也就没有样式闪烁（FOUC）问题；
- 因此在 Next.js App Router 的 Server Components、各种 SSR/SSG 场景里都能直接用。

这正是 Panda 设计的初衷——为「服务端优先」的现代前端提供一套不牺牲开发体验的样式方案。

---

理解了原理与配置，最后一页把 Panda 放进整个样式方案格局里横向对比：[生态与选型](./ecosystem-and-selection)。
