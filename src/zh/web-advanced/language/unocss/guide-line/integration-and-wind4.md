---
layout: doc
outline: [2, 3]
---

# 集成、配置全景与 Wind4 迁移

> 基于 UnoCSS v66.7.4 · 核于 2026-07

## 速查

- **Vite 集成**：`import UnoCSS from 'unocss/vite'` → `plugins: [UnoCSS()]` → 入口 `import 'virtual:uno.css'`。
- **Vite 模式**：global（默认，注入全局样式表）/ vue-scoped（注入 SFC `<style scoped>`）/ per-module（实验）/ dist-chunk（实验，多页应用按 chunk 出 CSS）/ shadow-dom（Web Components，用 `@unocss-placeholder`）。
- **配置字段全景**：`presets`/`rules`/`shortcuts`/`variants`/`theme`/`transformers`/`extractors`/`layers`/`safelist`/`blocklist`/`preflights`/`content`。
- **safelist**：强制生成（动态类兜底）；**blocklist**：禁止生成（收窄设计系统）。
- **content**：`filesystem`（glob）/`inline`/`pipeline`（include/exclude）配置扫描范围。
- **layers + outputToCssLayers**：控制层叠顺序，可映射到原生 CSS `@layer`。
- **CDN 运行时**：`@unocss/runtime` 一行 script，浏览器端实时生成 CSS，无需构建。
- ⚠️ **Wind3 → Wind4**：主题键重命名（`fontFamily`→`font`、`borderRadius`→`radius`、`easing`→`ease`）；主题改 CSS 变量（默认 on-demand）；内建 reset（不再需 `@unocss/reset`）；**移除** `presetRemToPx`（已内建）与 `presetLegacyCompat`（与 oklch 不兼容）。

## 一、Vite 集成与模式

UnoCSS 与 Vite 是一等公民配合。基础三步（插件 + 虚拟模块导入）已在[入门页](../getting-started)讲过，这里补充**运行模式**：

| 模式 | 行为 | 场景 |
| --- | --- | --- |
| global（默认） | 注入一份全局样式表，需 `import 'virtual:uno.css'` | 绝大多数应用 |
| vue-scoped | 把生成的 CSS 注入 Vue SFC 的 `<style scoped>` | 需要样式隔离的 SFC |
| per-module（实验） | 按模块生成 CSS，可选 scoped | 精细化拆分 |
| dist-chunk（实验） | 构建时按代码 chunk 出 CSS | 多页应用（MPA） |
| shadow-dom | 用 `@unocss-placeholder` 占位内联 CSS | Web Components |

React 项目要注意插件顺序：**UnoCSS 应放在 React 插件之前**（尤其用属性化预设时）：

```ts
import UnoCSS from 'unocss/vite'
import React from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [UnoCSS(), React()], // UnoCSS 在前
})
```

除 Vite 外，UnoCSS 还官方支持 Nuxt、Astro、Svelte Scoped、Webpack、PostCSS、CLI、ESLint、以及 VS Code / JetBrains / Zed 插件——得益于它是**同构引擎**而非绑死 PostCSS。

## 二、配置字段全景

`uno.config.ts` 里除了前几页讲过的 `presets`/`rules`/`shortcuts`/`variants`/`theme`/`transformers`，还有一批常用字段：

```ts
export default defineConfig({
  // 扫描哪些文件、哪些内联内容
  content: {
    filesystem: ['src/**/*.{vue,js,ts,jsx,tsx}'],
  },
  // 强制生成（动态拼接、扫描不到的类兜底）
  safelist: ['i-carbon-home', 'i-carbon-settings'],
  // 禁止生成（即使出现也不生成，收窄可用工具类）
  blocklist: ['container', /^text-(gray|slate)-\d+$/],
  // 注入全局原始 CSS（reset、:root 变量、body 基础样式）
  preflights: [
    { getCSS: () => ':root { --gap: 8px }' },
  ],
})
```

- **`content`**：`filesystem` 指定 glob、`inline` 内联字符串、`pipeline` 配置构建管线的 include/exclude。默认提取器（extractors）按空白/引号等切分候选类名，特殊模板语法可写自定义 `extractors`。
- **`safelist`**：无条件强制生成，专治「运行时动态拼接的类名扫描不到」。
- **`blocklist`**：黑名单，列出的类即使出现也不生成，用于禁用不希望被使用的工具类、收窄设计系统。与 `safelist` 互为反向。
- **`preflights`**：注入全局原始 CSS，输出到 preflights layer（产物顶部）。

## 三、layers：层叠顺序与原生 @layer

UnoCSS 把 preflights、shortcuts、default 等分到不同 **layer**，按数值排序输出——数值小的先输出（优先级低）。这决定了「shortcut 和直接写的工具类冲突时谁覆盖谁」：

```ts
export default defineConfig({
  layers: {
    components: -1, // 数值越小越靠前（优先级越低）
    default: 1,
    utilities: 2,
  },
})
```

需要接入原生 CSS `@layer` 级联时，开 `outputToCssLayers: true`，并可用 `cssLayerName` 给各内部层命名到原生 `@layer`。**`layers` 排序 + `outputToCssLayers` 映射**是精确控制 preflights/shortcuts/工具类优先级的结构化手段——比到处打 `!important` 干净得多。

## 四、CDN 运行时：无构建也能用

UnoCSS 是同构引擎，所以能做到 Tailwind（PostCSS 插件形态）难有的事：**一行 CDN script 在浏览器端实时生成 CSS，完全不走构建**。

```html
<script src="https://cdn.jsdelivr.net/npm/@unocss/runtime"></script>
<div class="m-4 p-2 bg-blue-500 text-white rounded">运行时生成</div>
```

`@unocss/runtime` 会在浏览器端扫描 DOM 上的类名并动态生成 CSS，适合原型、演示、无构建的静态页。注意配置文件不能直接当运行时用，要用 `@unocss/runtime` 提供的接口。

## 五、⚠️ Wind3 → Wind4 迁移清单

`presetWind4` 对标 Tailwind 4，兼容 Wind3 全部特性但带一批**破坏性变化**，迁移时逐条核对：

| 变化 | Wind3 | Wind4 |
| --- | --- | --- |
| 主题键：字体族 | `fontFamily` | `font` |
| 主题键：字号/行高 | `fontSize` / `lineHeight` | 归入 `text` |
| 主题键：圆角 | `borderRadius` | `radius` |
| 主题键：缓动 | `easing` | `ease` |
| 主题键：尺寸 | `width`/`height` 等 | 统一到 `spacing` |
| 主题输出 | 常规值 | **CSS 变量**（properties/theme/base 三层，默认 `on-demand` 只生成用到的键） |
| reset | 需自引 `@unocss/reset` | **内建**（收进 base 层） |
| 色彩模型 | 常规 | **oklch** |
| `presetRemToPx` | 按需引入 | **已内建，应移除** |
| `presetLegacyCompat` | 可用 | **与 oklch 不兼容，应移除** |

三个最容易翻车的点：

1. **主题定制失效**：还用旧键名（`fontFamily`/`borderRadius`/`easing`）→ 定制不生效，逐个改成新键名。
2. **reset 重复/缺失**：Wind4 已内建 reset，别再手动引 `@unocss/reset`（Wind3 时代通常要 `import '@unocss/reset/tailwind.css'`）。
3. **残留 legacy 预设**：`presetRemToPx` 会与内建能力重复处理；`presetLegacyCompat` 与 Wind4 的 oklch 色彩冲突——两者都要从 `presets` 移除。

---

到这里 UnoCSS 的核心与工程实践就系统过了一遍。速查、对照表、常见错误汇总见 [参考页](../reference)。
