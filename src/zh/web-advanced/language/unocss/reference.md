---
layout: doc
outline: [2, 3]
---

# 参考：UnoCSS 速查与对照表

> 基于 UnoCSS v66.7.4 · 核于 2026-07

## 速查

- **定位**：即时按需的原子化 CSS 引擎，no core utilities，一切来自 preset；同构引擎（非 PostCSS 插件）。
- **接入**：`unocss/vite` 插件 + 入口 `import 'virtual:uno.css'`；配置 `uno.config.ts` + `defineConfig()`。
- **工具类来源**：`presetWind3`（TW3/Windi）/ `presetWind4`（TW4）/ `presetMini`（精简）；`presetUno` 已弃用更名 Wind3。
- **可编程**：`rules`（静态 `['flex',{...}]` / 动态 `[/^m-.../,fn]`）、`shortcuts`、`variants`、变体分组 `hover:(...)`。
- **指令**（transformerDirectives）：`@apply` / `--at-apply` / `theme()` / `@screen`。
- **属性化**（presetAttributify）：`bg="blue-500"`、无值 `<div flex>`、`~`、`un-` 前缀。
- **图标**（presetIcons）：`i-carbon-sun`，`@iconify-json/*`，模式 mask/bg/auto。
- **踩坑**：pnpm 严格隔离下图标自动发现失效 → 显式传 `collections`；动态类名 → `safelist`。
- **性能**：无解析/AST/扫描，约 5x 于 Windi/TW JIT；零依赖，内核约 6kb。

## 一、配置字段速查

| 字段 | 作用 |
| --- | --- |
| `presets` | 预设数组，工具类的来源（后者优先） |
| `rules` | 自定义原子规则：静态 `[str, CSSObj]` / 动态 `[regex, fn]` |
| `shortcuts` | 工具类组合别名：静态对象 / 动态正则 |
| `variants` | 前缀 → 选择器改写（`hover:`/`dark:` 等） |
| `theme` | 设计令牌（颜色/间距/断点/字体） |
| `transformers` | 源码转换器（directives / variant-group / attributify-jsx） |
| `extractors` | 如何从源码切出候选类名 token |
| `layers` | 各类别工具类的层叠/输出顺序 |
| `safelist` | 强制生成（动态类兜底） |
| `blocklist` | 禁止生成（收窄设计系统） |
| `preflights` | 注入全局原始 CSS（reset/变量） |
| `content` | 扫描范围：`filesystem`/`inline`/`pipeline` |
| `outputToCssLayers` / `cssLayerName` | 输出映射到原生 CSS `@layer` |
| `autocomplete` | 编辑器/Inspector 补全模板 |

## 二、官方预设速查

| 预设 | 一句话 |
| --- | --- |
| `presetMini` | 最小但必要的规则与变体，Wind 系基础子集 |
| `presetWind3` | 对标 Tailwind 3 / Windi 的完整工具类 |
| `presetWind4` | 对标 Tailwind 4：主题 CSS 变量化 + 内建 reset + oklch |
| `presetUno` | **已弃用**，更名为 presetWind3 |
| `presetAttributify` | 属性化模式（`bg="blue-500"`） |
| `presetIcons` | 纯 CSS 图标（`i-carbon-sun`），数据来自 Iconify |
| `presetTypography` | `prose` 富文本排版 |
| `presetWebFonts` | 集成 Google Fonts 等网络字体 |
| `presetTagify` | 标签化模式（工具类当标签名） |
| `presetRemToPx` | rem → px（Wind4 已内建） |

## 三、rules / shortcuts 写法速查

```ts
rules: [
  ['flex', { display: 'flex' }],                          // 静态
  [/^m-([\.\d]+)$/, ([, n]) => ({ margin: `${n}px` })],   // 动态
]
shortcuts: {
  btn: 'py-2 px-4 rounded bg-blue-500 text-white',        // 静态
}
shortcuts: [
  [/^btn-(\w+)$/, ([, c]) => `bg-${c}-500 text-white py-2 px-4 rounded`], // 动态
]
```

- 动态规则第一参是正则匹配数组（`[全匹配, 组1, ...]`），第二参含 `theme`。
- 函数返回 `undefined` = 本规则不处理，交后续规则。
- 优先级：`rules` 后定义者优先；静态优先于动态；跨类别看 `layers`。

## 四、指令速查（transformerDirectives）

| 指令 | 用途 | 示例 |
| --- | --- | --- |
| `@apply` | CSS 里复用工具类 | `@apply text-center font-medium;` |
| `--at-apply` | 纯 CSS 兼容的 @apply | `--at-apply: text-center my-2;` |
| `theme()` | 内联主题令牌值 | `color: theme('colors.blue.500');` |
| `@screen` | 断点 → 媒体查询 | `@screen sm { ... }`、`lt-sm`、`at-xl` |

> `applyVariable` 默认识别 `--at-apply`/`--uno-apply`/`--uno`。变体分组 `hover:(...)` 需 `transformerVariantGroup`。

## 五、属性化速查（presetAttributify）

| 写法 | 含义 |
| --- | --- |
| `bg="blue-500"` | = `bg-blue-500` |
| `text="sm white"` | = `text-sm text-white` |
| `<div flex>` | 无值属性 = `class="flex"` |
| `border="~ red"` | `~` 引用属性名本身 = `border border-red` |
| `un-text="red"` | `un-` 前缀防与 prop 冲突（`prefixedOnly` 更严格） |

⚠️ JSX 无值属性 `<div grid>` 会被编译成 `grid={true}` 破坏匹配 → 需 `@unocss/transformer-attributify-jsx`。

## 六、图标速查（presetIcons）

| 项 | 说明 |
| --- | --- |
| 类名 | `i-[集合]-[图标]`，如 `i-carbon-sun`、`i-mdi-account` |
| 安装 | 按需装 `@iconify-json/[集合]` |
| 模式 | `mask`（单色可变色）/ `bg`（多色不可变色）/ `auto`（默认） |
| Node | 自动发现已装的 `@iconify-json/*` |
| 浏览器 | 无扫描，须 `collections` 显式提供（动态 import / CDN） |

## 七、UnoCSS vs Tailwind CSS 对照

| 维度 | UnoCSS | Tailwind CSS |
| --- | --- | --- |
| 本质 | 引擎（内核无工具类） | 框架（内建约定与工具类） |
| 工作形态 | 同构引擎（Vite/CLI/CDN 运行时） | 主要是 PostCSS 插件 |
| 工具类来源 | preset（可自定义/封装复用） | 框架内建 + 插件 |
| 独有能力 | 纯 CSS 图标、属性化、变体分组、CDN 运行时 | 成熟插件生态、海量社区模板 |
| 插件系统 | 不支持 Tailwind 插件 | 有官方/社区插件体系 |
| 性能 | 无 AST/扫描，约 5x（官方） | 现代版本 JIT 按需 |

## 八、Wind3 → Wind4 迁移速查

| 项 | Wind3 | Wind4 |
| --- | --- | --- |
| `fontFamily` | `fontFamily` | `font` |
| `fontSize`/`lineHeight` | 各自 | 归入 `text` |
| `borderRadius` | `borderRadius` | `radius` |
| `easing` | `easing` | `ease` |
| 尺寸键 | `width`/`height` 等 | `spacing` |
| 主题输出 | 常规值 | CSS 变量（默认 on-demand） |
| reset | 自引 `@unocss/reset` | 内建 |
| 色彩 | 常规 | oklch |
| `presetRemToPx` | 引入 | 内建，移除 |
| `presetLegacyCompat` | 可用 | 与 oklch 冲突，移除 |

## 九、常见错误对照

| 现象 | 根因 | 解法 |
| --- | --- | --- |
| 工具类完全不生效 | 没引任何 preset，或漏 `import 'virtual:uno.css'` | 引 `presetWind4()` + 入口导入虚拟模块 |
| `@apply` 报错/残留 | 没启用 `transformerDirectives` | `transformers: [transformerDirectives()]` |
| 生产 build `failed to load icon "carbon-*"` | pnpm 严格隔离下图标自动发现失效 | 显式 `collections: { carbon: () => carbonIcons }` |
| 动态拼接的类/图标不显示 | 扫描不到字面量 | 加进 `safelist` |
| 变体分组 `hover:(...)` 不展开 | 没启用 `transformerVariantGroup` | 加该 transformer |
| JSX 无值属性 `<div grid>` 不生效 | 被编译成 `grid={true}` | 加 `transformer-attributify-jsx` |
| shortcut 被工具类覆盖/覆盖不了 | layer 顺序 | 调 `layers` / `outputToCssLayers` |
| 用 `presetUno` 收到弃用提示 | 旧别名 | 改用 `presetWind3` |
| Wind4 主题定制失效 | 用了旧主题键名 | 改新键名（`font`/`radius`/`ease` 等） |

## 十、权威链接

- [UnoCSS 官网](https://unocss.dev/) —— 首页与特性总览
- [Getting Started](https://unocss.dev/guide/) —— 入门指南
- [Why UnoCSS?](https://unocss.dev/guide/why) —— 与 Tailwind/Windi 的对比与设计哲学
- [Presets](https://unocss.dev/presets/) —— 全部官方预设
- [Config](https://unocss.dev/config/) —— 配置字段完整参考
- [Transformers](https://unocss.dev/transformers/) —— directives / variant-group / attributify-jsx
- [Vite 集成](https://unocss.dev/integrations/vite) —— 插件与运行模式
- [presetWind4](https://unocss.dev/presets/wind4) —— Tailwind 4 预设与迁移
- [presetIcons](https://unocss.dev/presets/icons) —— 纯 CSS 图标
- [presetAttributify](https://unocss.dev/presets/attributify) —— 属性化模式
- [GitHub · unocss/unocss](https://github.com/unocss/unocss) —— 源码与 Issue
- [unocss#2905](https://github.com/unocss/unocss/issues/2905) —— pnpm 图标自动发现问题
- [Iconify](https://iconify.design/) —— 图标数据来源
