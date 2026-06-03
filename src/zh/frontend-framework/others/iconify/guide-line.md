---
layout: doc
outline: [2, 3]
---

# 指南

> 本篇深入 Iconify 的框架组件差异、Web Component 渲染模式、API 与离线方案、工具链集成，并汇总常见坑。

## 框架组件深度

各框架组件 API **大体一致但细节有别**，跨框架迁移时最易踩：

| 组件 | 导入 | 翻转属性 | 事件 / 备注 |
|---|---|---|---|
| `@iconify/react` | **named** `import { Icon }` | `hFlip` / `vFlip`（布尔）+ `flip`（字符串） | `onLoad`；还有 `InlineIcon`；client-only |
| `@iconify/vue` | **named** `import { Icon }` | `horizontalFlip` / `verticalFlip` + `flip` | 发 `load` 事件；`ssr` 布尔属性（v4.1.2+） |
| `@iconify/svelte` | **default** `import Icon` | `hFlip` / `vFlip` + `flip` | 无事件；v6+ 需 Svelte 5 |
| `iconify-icon`（Web Component） | `import 'iconify-icon'` | 单个 `flip` 字符串（**无 hFlip/vFlip**） | `mode` 属性；SSR 安全 |

公共 props：`icon`（必填，字符串名或 IconifyIcon 数据对象）、`inline`、`width`、`height`、`color`、`rotate`。

```tsx
// React：其它 props 透传给 <svg>（onClick / style / title…）
<Icon icon="mdi:home" width={24} hFlip rotate={1} onClick={...} />
```

### SSR 行为

`@iconify/react` / `@iconify/vue` **挂载后才渲染 SVG**（服务端 HTML 无图标，避免 hydration 错）。SSR 首屏出图的办法：

1. 用 `iconify-icon` Web Component（Shadow DOM，服务端/客户端 HTML 一致）
2. 用构建时 Tailwind / UnoCSS 方案（图标内联进 CSS）
3. 给组件传**图标数据对象**而非名字字符串（数据已在手，立即渲染）；Vue 另有 `ssr` 属性

### 离线预注册：addIcon / addCollection

```ts
import { addIcon, addCollection } from '@iconify/react'
import homeIcon from '@iconify-icons/mdi/home' // 单个图标数据

addIcon('mdi:home', homeIcon)           // 注册单个
addCollection(iconSetJSON)               // 注册整个图标集（IconifyJSON）
```

> 预注册后该图标**不再走 API**、立即可用——适合离线/内网/SSR。

## Web Component 四种渲染模式

`iconify-icon` 独有的 `mode` 属性（React/Vue 总是渲染 `<svg>`）：

| mode | 渲染 | 适用 |
|---|---|---|
| `svg` | `<svg>` 元素 | 默认；可被 CSS 完整控制 |
| `style` | 自动按调色板选 bg 或 mask | 让组件自己决定 |
| `bg` | `<span>` + `background-image` | **彩色/调色板**图标 |
| `mask` | `<span>` + `mask-image` + `background-color: currentColor` | **单色**图标 |

> `bg` / `mask` 模式避免 SVG 模式在页面加载时的动画起始延迟。

## API 与离线方案

### 公共 API + 故障切换

- 默认从 **`api.iconify.design`** 按需加载图标数据
- 备份主机 **`api.simplesvg.com`** / **`api.unisvg.com`**，**0.75s 超时自动切换**
- 只下载用到的图标，自动批量请求
- ⚠️ **旧的 localStorage 图标缓存已于 2025 年废弃**（`enableCache` 失效）；现代构建用构建时方案或自建 API 更可靠

### 自建 API / 完全离线

```ts
// 完全离线：装数据包 + addCollection
import { addCollection } from '@iconify/react'
import mdiIcons from '@iconify-json/mdi/icons.json'
addCollection(mdiIcons)
```

- `@iconify/json`：**全量**图标数据（很大，仅离线全量需要）
- `@iconify-json/<prefix>`：**单集合**数据（如 `@iconify-json/carbon`，推荐）

### IconifyJSON 数据格式

```jsonc
{
  "prefix": "mdi",            // 必填：图标集前缀
  "icons": {                  // 必填：图标 body（SVG path 等）
    "home": { "body": "<path d='...'/>" }
  },
  "width": 24, "height": 24   // 默认 viewBox 尺寸（不填则 0 0 16 16）
}
```

## 工具链集成

### Tailwind 插件（T3 与 T4 分两个包）

| | Tailwind 3 | Tailwind 4 |
|---|---|---|
| 包 | `@iconify/tailwind` | `@iconify/tailwind4` |
| 用法 | 插件函数 `addDynamicIconSelectors()` / `addIconSelectors([prefixes])` | CSS 内 `@plugin "@iconify/tailwind4"` |

```js
// Tailwind 3
const { addDynamicIconSelectors } = require('@iconify/tailwind')
plugins: [addDynamicIconSelectors()]  // 动态：用到才生成
```

```html
<!-- 动态 class：图标名内部 - 写成双连字符 -- -->
<span class="icon-[mdi--home]"></span>
<span class="icon-[mdi-light--home]"></span>
```

> `addCleanIconSelectors` 已弃用 → 用 `addIconSelectors`。动态 selector 里图标名的连字符要写成双连字符（`mdi-light--home`）。

### UnoCSS presetIcons（本项目）

```ts
import { presetIcons } from '@unocss/preset-icons'
// 默认 prefix 'i-'、scale 1.2、warn false
presetIcons({ scale: 1.2, collections: { carbon: () => carbonIcons } })
```

```html
<div class="i-mdi-home" />  <!-- i-{prefix}-{name} -->
```

### @iconify/utils 五大函数

| 函数 | 作用 |
|---|---|
| `getIconData(data, name)` | 从图标集数据取单个图标（解析 alias） |
| `iconToSVG(icon, customisations?)` | 图标数据 → `{ body, attributes, viewBox }`（不含 xmlns） |
| `iconToHTML(body, attributes)` | 拼成完整 `<svg>` 字符串 |
| `replaceIDs(body)` | 替换 body 内 id 防多图标 id 冲突 |
| `calculateSize(size, ratio)` | 按比例算另一维度尺寸 |

## 常见坑

- **彩色/emoji 图标不能改色**：只有单色（`currentColor`）图标可重新着色
- **不要设 `fill`**：很多图标用 `stroke`，改色应调文字 `color`
- **各端 `flip` 命名不同**：React/Svelte `hFlip`/`vFlip`，Vue `horizontalFlip`/`verticalFlip`，Web Component `flip` 字符串
- **导出方式不同**：React/Vue 是 named 导出 `{ Icon }`，**Svelte 是 default 导出**
- **React/Vue 默认不 SSR**：挂载后才出 SVG；SSR 用 Web Component / 构建时 / 传数据对象
- **`rotate` 数字含义**：`1/2/3` = `90/180/270` 度（也可写 `90deg`）
- **localStorage 缓存已废弃**（2025）：别再依赖 `enableCache`
- **pnpm + UnoCSS presetIcons**：自动发现 `@iconify-json/*` 失效，**必须显式 `collections`**（本项目 CLAUDE.md 已记）
- **`@iconify/json` 很大**：通常按 `@iconify-json/<prefix>` 单集合装，别全量
- **动态 Tailwind class 双连字符**：`icon-[mdi-light--home]`
