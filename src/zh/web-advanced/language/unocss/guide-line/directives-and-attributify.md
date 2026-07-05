---
layout: doc
outline: [2, 3]
---

# 指令与属性化：transformer 的两大主场

> 基于 UnoCSS v66.7.4 · 核于 2026-07

## 速查

- **transformer = 处理前改写源码**，放 `uno.config.ts` 的 `transformers` 数组。
- **transformerDirectives** 提供四件套：
  - `@apply text-center font-medium`——在 CSS 里复用工具类。
  - `--at-apply: text-center font-medium`——纯原生 CSS 兼容的 `@apply`（自定义属性形式）。
  - `theme('colors.blue.500')`——按点路径读主题令牌并**内联具体值**（如 `#3b82f6`）。
  - `@screen sm { ... }`——按主题断点生成 `@media`；支持 `lt-sm`（max-width）、`at-xl`（区间）。
- **transformerVariantGroup** 提供变体分组 `hover:(...)`。
- **transformerAttributifyJsx** 修复 JSX 无值属性坑。
- **属性化（presetAttributify）**：`bg="blue-500" text="sm white"`；无值 `<div flex>`；`~` 引用属性名本身；`un-` 前缀防冲突，`prefixedOnly: true` 更严格。
- ⚠️ **JSX 坑**：`<div grid>` 被 JSX 编译成 `<div grid={true}>` 破坏匹配，需 `transformerAttributifyJsx`；HTML/Vue 模板无此问题。

## 一、transformer 是什么

transformer（转换器）在类被引擎处理**之前**先改写源码——展开 `@apply`、展开变体分组、修正 JSX 属性等。它和 preset 是不同字段：

```ts
import { defineConfig, presetWind4, transformerDirectives, transformerVariantGroup } from 'unocss'

export default defineConfig({
  presets: [presetWind4()],
  transformers: [
    transformerDirectives(),   // @apply / --at-apply / theme() / @screen
    transformerVariantGroup(), // hover:(...) 变体分组
  ],
})
```

**不配对应 transformer，这些语法就不会被处理**——`@apply` 会原样残留在样式表里导致报错或无效。这是「`@apply` 没生效」的头号原因。

## 二、@apply：在 CSS 里复用工具类

`@apply` 让你在手写的 CSS/SCSS 规则里，直接套用 UnoCSS 工具类：

```css
.custom-btn {
  @apply text-center my-2 font-medium rounded bg-blue-500 text-white;
}
```

构建后展开成对应的原生 CSS 声明。它适合「组件级样式还是想写在 `<style>` 里，但不想重复手写属性值」的场景。

### --at-apply：纯原生 CSS 更友好

`@apply` 是自定义 at-rule，某些纯 CSS 工具链/编辑器会对未知 at-rule 报错或提示不友好。`--at-apply` 用**自定义属性**承载，语法上是合法 CSS 声明，兼容性更好：

```css
.custom-btn {
  --at-apply: text-center my-2 font-medium;
}
```

二者**语义等价**。`applyVariable` 选项默认识别 `--at-apply`、`--uno-apply`、`--uno` 三种变量名，可自定义。

## 三、theme()：把设计令牌内联进 CSS

`theme()` 按点路径读取主题配置的值，并在构建期**内联成具体值**：

```css
.btn-blue {
  background-color: theme('colors.blue.500'); /* → background-color: #3b82f6 */
  padding: theme('spacing.4');
}
```

它让手写 CSS 也能复用 `theme` 里的设计令牌，避免把色值/间距硬编码得到处都是。注意是**构建期内联具体值**，不是留一个运行时 `var(--x)`。

## 四、@screen：手写 CSS 里的响应式

`@screen` 把主题断点名翻译成媒体查询：

```css
.grid { --uno: grid grid-cols-2; }

@screen sm {
  .grid { --uno: grid-cols-3; } /* → @media (min-width: 640px) { ... } */
}
```

还支持两种变体：`@screen lt-sm`（max-width，比断点更小）、`@screen at-xl`（区间范围查询）。手写响应式不必再记具体像素值。

## 五、属性化模式完整用法

属性化由 `presetAttributify` 提供，把工具类按前缀拆进 HTML 属性：

```html
<button
  bg="blue-500 hover:blue-600"
  text="sm white"
  font="bold"
  p="4"
  border="2 rounded blue-600"
>
  Button
</button>
```

三个进阶点：

### 无值属性（valueless）

对于「工具类名与属性名相同」的类（`flex`/`grid`/`border`），可直接写无值属性：

```html
<div flex></div>       <!-- 等价 class="flex" -->
<div grid gap-2></div>
```

### `~` 引用属性名本身

当属性名自己就是一个有效类时，用 `~` 把它补进来：

```html
<button border="~ red"></button> <!-- 展开为 border border-red -->
```

没有 `~` 时 `border="red"` 只展开为 `border-red`，会漏掉单独的 `border`。

### `un-` 前缀防冲突

属性名可能和组件框架的 prop 撞名（如某组件本身有 `text` prop）。启用 `un-` 前缀隔离，必要时用 `prefixedOnly: true` 强制「只识别带前缀的属性化」：

```html
<a un-text="red" un-font="bold">Safe from prop conflicts</a>
```

## 六、⚠️ JSX/TSX 里的无值属性坑

JSX 编译器会把无值属性 `<div grid>` 转成 `<div grid={true}>`——属性值变成布尔 `true` 而非空字符串，导致 UnoCSS 的属性化匹配**失败、样式不生成**。

官方对策是加 `@unocss/transformer-attributify-jsx`，它在编译前把这类无值属性改写回能被匹配的形式：

```ts
import transformerAttributifyJsx from '@unocss/transformer-attributify-jsx'

export default defineConfig({
  transformers: [transformerAttributifyJsx()],
})
```

> 纯 HTML / Vue 模板**没有**这个问题——只有 JSX/TSX 需要。另外在 React + 属性化预设时，Vite 插件顺序上 UnoCSS 应放在 React 插件之前。

---

指令与属性化过完，下一步进入 [纯 CSS 图标与 pnpm 踩坑](./icons-and-pitfalls)：presetIcons 的工作原理，以及本仓踩过的 pnpm 严格隔离下图标自动发现失效的真实经验。
