---
layout: doc
outline: [2, 3]
---

# 预设体系：一切工具类的来源

> 基于 UnoCSS v66.7.4 · 核于 2026-07

## 速查

- **preset = 复用单元**：一个 preset 打包 `rules`/`variants`/`shortcuts`/`theme`/`preflights` 等，是 UnoCSS「一切来自 preset」哲学的载体。
- **presetMini**：最小但必要的规则与变体集合，是 Wind 系的基础子集；想极致精简/自建设计系统用它。
- **presetWind3**：对标 **Tailwind 3 / Windi CSS** 的完整工具类，构建在 presetMini 之上。
- **presetWind4**：对标 **Tailwind 4**，兼容 Wind3 全部特性并增强（主题以 CSS 变量输出、内建 reset、oklch 色彩）。
- ⚠️ **presetUno 已弃用**：更名为 `presetWind3`，仅作兼容别名，新代码别用。
- **presetAttributify**：启用属性化模式（`bg="blue-500"`）。
- **presetIcons**：纯 CSS 图标（`i-carbon-sun`），数据来自 Iconify。
- **presetTypography**：`prose` 类给富文本成套排版。
- **presetWebFonts**：集成 Google Fonts 等网络字体，绑定到 `font-sans` 等。
- **presetTagify**：标签化模式（把工具类当标签名用）。
- **presetRemToPx**：把 rem 工具类转成 px（Wind4 已内建，迁移时移除）。
- **组合**：`presets` 是数组，多个预设叠加生效；顺序影响同名规则的覆盖。

## 一、preset 是什么，为什么重要

UnoCSS 内核不含任何工具类，**preset 才是工具类的来源**。一个 preset 本质是返回一个配置对象的函数，里面可以带 `rules`、`variants`、`shortcuts`、`theme`、`preflights`、`extractors` 等——把一整套「设计系统 + 语法约定」打包起来。

这带来两个直接后果：

1. **你至少要引一个 preset**，否则页面上一个工具类都不生成。
2. **团队的设计系统可以封装成自定义 preset**，各项目 `presets: [myPreset()]` 即可复用——这正是「no core utilities、一切来自 preset」的落地方式。

```ts
import { defineConfig, presetWind4, presetIcons, presetTypography } from 'unocss'

export default defineConfig({
  presets: [
    presetWind4(),      // Tailwind 4 风格工具类
    presetIcons(),      // 纯 CSS 图标
    presetTypography(), // prose 排版
  ],
})
```

`presets` 是数组，多个预设的规则会叠加；当不同预设定义了同名规则时，**靠后的预设优先**（覆盖前者），这点在混用时要留意。

## 二、核心三兄弟：Mini / Wind3 / Wind4

这三个是「工具类主体」的预设，关系是**递进的超集**：

| 预设 | 对标 | 定位 |
| --- | --- | --- |
| `presetMini` | —— | 最小但必要的规则与变体，Wind 系的基础子集 |
| `presetWind3` | Tailwind 3 / Windi CSS | 在 Mini 之上补齐完整 Tailwind 风格工具类 |
| `presetWind4` | Tailwind 4 | 兼容 Wind3 全部特性，主题 CSS 变量化 + 内建 reset |

选型口径：

- 只想要**极少数基础类、自己搭一套设计系统** → `presetMini`。
- 想要**Tailwind 那套齐全工具类**、走成熟约定 → `presetWind3`（TW3 时代）或 `presetWind4`（TW4 时代）。

::: warning presetUno 已弃用
`presetUno` 是 UnoCSS 早期的默认预设，现已**弃用并更名为 `presetWind3`**。它仍作为兼容别名保留，但新项目应直接用 `presetWind3`/`presetWind4`。看到老教程里的 `presetUno()`，心里换成 `presetWind3()` 即可。
:::

Wind3 → Wind4 是一次带破坏性的升级（主题键重命名、主题以 CSS 变量输出、oklch 色彩、内建 reset），详见[集成与 Wind4 迁移页](./integration-and-wind4)。

## 三、功能型预设

除了工具类主体，UnoCSS 官方还提供一批「功能型」预设，按需叠加：

### presetAttributify —— 属性化模式

把工具类按前缀拆进 HTML 属性，而不是全塞进一个 `class` 字符串：

```html
<!-- 传统写法 -->
<button class="bg-blue-500 text-sm text-white font-bold p-4">Button</button>

<!-- 属性化写法：按语义分组进属性，长标签更易读 -->
<button bg="blue-500" text="sm white" font="bold" p="4">Button</button>
```

支持无值属性（`<div flex>` 等价 `class="flex"`）、`~` 引用属性名本身、`un-` 前缀避免与组件 prop 冲突，详见[指令与属性化页](./directives-and-attributify)。

### presetIcons —— 纯 CSS 图标

把 Iconify 十万级图标做成单个 class，无需图标字体或 SVG 文件：

```html
<span class="i-carbon-sun"></span>
<span class="i-mdi-account text-red-500"></span>
```

类名约定 `i-[图标集]-[图标名]`，图标集以 `@iconify-json/[集合]` 独立安装。这块在 pnpm monorepo 下有一个著名的自动发现坑，专门在[图标与踩坑页](./icons-and-pitfalls)讲。

### presetTypography —— 富文本排版

给富文本容器加 `prose`，其中的标题/段落/列表/代码块等一键获得成套排版样式，常用于渲染 Markdown/CMS 内容：

```html
<article class="prose">
  <!-- 这里的 h1/p/ul/code 自动获得美观排版 -->
</article>
```

### presetWebFonts —— 网络字体

集成 Google Fonts 等在线字体，声明字体族与字重后自动生成引入逻辑，并让 `font-sans` 之类工具类用上该字体：

```ts
presetWebFonts({
  fonts: {
    sans: 'Inter:400,600,700',
    mono: 'Fira Code',
  },
})
```

### 其它

- `presetTagify`：标签化模式，把工具类当作标签名书写（少见但独特）。
- `presetRemToPx`：把 rem 单位的工具类输出转成 px；**`presetWind4` 已内建此能力**，从 Wind3 迁移时应移除它以免重复处理。

## 四、一个真实项目的预设组合

本站管理后台的 `uno.config.ts` 就是典型组合——Wind4 打底 + 图标 + 排版 + 网络字体：

```ts
import { defineConfig, presetWind4, presetIcons, presetTypography, presetWebFonts } from 'unocss'
import { icons as carbonIcons } from '@iconify-json/carbon'

export default defineConfig({
  presets: [
    presetWind4(),
    presetIcons({
      scale: 1.2,
      collections: { carbon: () => carbonIcons }, // 显式传入，见踩坑页
    }),
    presetTypography(),
    presetWebFonts({ fonts: { sans: 'Inter:400,600,700' } }),
  ],
})
```

`presetIcons` 里那句 `collections: { carbon: () => carbonIcons }` 不是可有可无的写法——它是为规避 pnpm 严格隔离下自动发现失效而**必须**显式传入的，下文有专门一页剖析。

---

工具类的来源理清了，下一步进入 [规则·快捷方式·变体](./rules-shortcuts-variants)：看 UnoCSS 真正的可编程内核——静态/动态 rules、shortcuts、variants 是怎么写的。
