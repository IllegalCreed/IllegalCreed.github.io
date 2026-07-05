---
layout: doc
outline: [2, 3]
---

# 纯 CSS 图标与 pnpm 自动发现踩坑

> 基于 UnoCSS v66.7.4 · 核于 2026-07

## 速查

- **presetIcons = 纯 CSS 图标**：把 Iconify 十万级图标做成单个 class，无字体、无 SVG 文件、无雪碧图。
- **类名约定**：`i-[图标集]-[图标名]`，如 `i-carbon-sun`、`i-mdi-account`（冒号形式 `i-carbon:sun` 亦可）。
- **图标集按需装**：`@iconify-json/[集合]`（carbon → `@iconify-json/carbon`）。
- **渲染模式**：`mask`（单色，随 `color` 变色）/ `bg`（保留原多色，不可变色）/ `auto`（默认，按图标自动选）。
- **Node vs 浏览器**：Node 构建能**自动发现**已装的 `@iconify-json/*`；浏览器运行时无文件系统扫描，必须用 `collections` **显式提供**。
- ⚠️ **本仓真实坑**：pnpm 严格依赖隔离下 `presetIcons` 自动发现**失效**，生产 build 报 `[unocss] failed to load icon "carbon-*"`、图标全不显示（unocss#2905）。
- ✅ **解法**：`uno.config.ts` 里 `import { icons } from '@iconify-json/carbon'`，`presetIcons({ collections: { carbon: () => icons } })` 显式传入；**只加 `.npmrc` 的 `public-hoist-pattern` 不够**。
- **动态图标类名**：运行时拼接的类扫描不到，加进 `safelist` 兜底。

## 一、纯 CSS 图标怎么工作

传统图标方案要么加载图标字体（体积大、FOUT）、要么内联一堆 SVG（重复、难维护）。`presetIcons` 走的是「**纯 CSS 图标**」：图标数据来自 Iconify，构建时把对应 SVG **内联进 CSS**，一个 class 就渲染一个图标。

```bash
pnpm add -D @unocss/preset-icons @iconify-json/carbon
```

```ts
import { defineConfig, presetIcons } from 'unocss'

export default defineConfig({
  presets: [presetIcons({ scale: 1.2, warn: true })],
})
```

```html
<span class="i-carbon-sun"></span>
<span class="i-mdi-account text-red-500"></span> <!-- 单色图标可随 text-* 变色 -->
```

类名约定是 `i-[图标集]-[图标名]`。每个图标集以 `@iconify-json/[集合]` 独立发布，用哪个装哪个——用 carbon 装 `@iconify-json/carbon`，用 mdi 装 `@iconify-json/mdi`。

## 二、三种渲染模式

| 模式 | 原理 | 适合 |
| --- | --- | --- |
| `mask` | CSS mask + `background-color` | **单色**图标，需跟随 `color`/`text-*` 变色 |
| `bg`（background-img） | 图标作静态背景图 | **多色**图标，保留原本配色（不可变色） |
| `auto`（默认） | 按图标是否单色自动选择 | 大多数情况交给它 |

也可对单个图标用查询后缀覆盖模式，如 `i-vscode-icons:file-type-light-pnpm?mask`。

## 三、Node 自动发现 vs 浏览器显式提供

这是理解下一节那个坑的前提：

- **Node 构建环境**：`presetIcons` 会**自动发现**已安装的 `@iconify-json/*` 包，无需手动列出——装了就能用。
- **浏览器运行时**（CDN runtime / 纯浏览器构建）：**没有文件系统扫描**，必须通过 `collections` 选项**显式提供**，用动态 import 或 CDN 拉取图标 JSON：

```ts
presetIcons({
  collections: {
    carbon: () => import('@iconify-json/carbon/icons.json').then(i => i.default),
  },
})
```

「自动发现」依赖 Node 能从 `node_modules` 里正常解析到 `@iconify-json/*` 包。**一旦这个解析被破坏，自动发现就失效**——这正是 pnpm monorepo 会踩的坑。

## 四、⚠️ 本仓真实坑：pnpm 严格隔离下自动发现失效

### 现象

开发环境图标一切正常，**生产构建后所有 `i-carbon-*` 图标不显示**，构建日志出现：

```
[unocss] failed to load icon "carbon-home"
[unocss] failed to load icon "carbon-settings"
...
```

### 根因

pnpm 的**严格依赖隔离**（非扁平 `node_modules`、依赖不提升）下，`presetIcons` 的「自动发现 `@iconify-json/*`」机制**找不到已安装的图标集包**——即使 `@iconify-json/carbon` 确实装在了项目里。开发时有时因缓存/提升侥幸能过，**生产构建把问题暴露**。这是 pnpm monorepo 的已知问题（[unocss#2905](https://github.com/unocss/unocss/issues/2905)）。

::: warning 关键认知
不是「图标没装」，也不是「图标集下架」，更不是「生产环境断网」（纯 CSS 图标是本地构建内联、根本不联网）。是**自动发现机制在严格隔离下解析不到包**。
:::

### ✅ 解决方案：显式传入 collections

不依赖自动发现，**显式导入图标集并传给 `collections`**：

```ts
// uno.config.ts
import { defineConfig, presetIcons } from 'unocss'
import { icons as carbonIcons } from '@iconify-json/carbon'

export default defineConfig({
  presets: [
    presetIcons({
      scale: 1.2,
      warn: true,
      collections: {
        carbon: () => carbonIcons, // 显式提供，不走自动发现
      },
    }),
  ],
})
```

显式提供 `collections` 后，引擎不再依赖文件系统自动发现，生产构建稳定可靠。

::: tip 注意
仅在 `.npmrc` 里加 `public-hoist-pattern[]=@iconify-json/*` **不足以**解决此问题——它只影响提升，不改变 `presetIcons` 的发现逻辑。**必须在配置里显式导入并传入 `collections`**。
:::

这个坑的道理其实和上一节相通：**严格隔离让 Node 侧的「自动发现」退化到接近「浏览器侧」的处境——既然自动发现不可靠，就走浏览器那套「显式提供」**，问题迎刃而解。

## 五、动态图标类名要 safelist

图标类名如果是运行时拼出来的（菜单配置常见 `'i-carbon-' + item.icon`），静态扫描器看不到完整字符串，不会生成对应 CSS，图标同样不显示。此时把这些类加进 `safelist` 强制生成：

```ts
export default defineConfig({
  safelist: [
    'i-carbon-home', 'i-carbon-settings', 'i-carbon-user',
    // ... 所有动态用到的图标类
  ],
})
```

> 这与第四节的自动发现坑是**两个不同问题**：一个是「图标集包发现不到」，一个是「类名字面量扫描不到」。前者靠 `collections`，后者靠 `safelist`，别混淆。

---

图标与踩坑过完，最后进入 [集成·配置全景·Wind4 迁移](./integration-and-wind4)：Vite 集成的各种模式、配置字段全景，以及 Wind3 → Wind4 的破坏性迁移清单。
