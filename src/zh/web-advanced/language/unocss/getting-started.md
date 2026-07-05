---
layout: doc
outline: [2, 3]
---

# 入门：定位、与 Tailwind 的分野、Vite 接入

> 基于 UnoCSS v66.7.4 · 核于 2026-07

## 速查

- **定位**：UnoCSS 是**即时按需的原子化 CSS 引擎**（不是框架、不是组件库、不是预处理器），由 Anthony Fu 发起，Windi CSS 的精神续作。
- **核心哲学 no core utilities**：内核**不预置任何工具类**，`m-4`/`flex`/`text-red` 全部来自 **preset**；不引 preset 就一个类都没有。
- **vs Tailwind**：Tailwind 是带预置约定的**框架**（PostCSS 插件）；UnoCSS 是无预置、纯靠 preset/rules 配置的**同构引擎**，能跑在 Vite/CLI/CDN 运行时等多种宿主。
- **按需（on-demand）**：只为源码里**真实出现过**的类生成 CSS，天生无冗余，无需 purge。
- **性能**：无解析、无 AST、无扫描的轻量匹配，官方称约 Windi/Tailwind JIT 的 5 倍；零依赖，内核约 6kb（min+brotli）。
- **安装**：`pnpm add -D unocss`（meta 包，含 `defineConfig` 与各 preset/transformer）。
- **Vite 插件**：`import UnoCSS from 'unocss/vite'` → 放进 `plugins`。
- ⚠️ **入口必须导入虚拟模块**：`import 'virtual:uno.css'`（旧写法 `uno.css`），漏了则所有工具类不生效——接入后最常见的「样式没出来」。
- **配置文件**：`uno.config.ts`，用 `defineConfig()` 包裹，含 `presets`/`rules`/`shortcuts`/`theme`/`transformers` 等字段。
- **要 Tailwind 风格工具类**：`presets: [presetWind3()]`（对标 TW3/Windi）或 `presetWind4()`（对标 TW4）。
- ⚠️ **`presetUno` 已弃用**，更名为 `presetWind3`，新项目别再用旧名。
- **调试利器 Inspector**：开发时访问 `/__unocss`，可视化查看每个类命中的规则与生成的 CSS。
- **进阶顺序**：本页 → [预设体系](./guide-line/presets) → [规则·快捷方式·变体](./guide-line/rules-shortcuts-variants) → [指令与属性化](./guide-line/directives-and-attributify) → [纯 CSS 图标与 pnpm 踩坑](./guide-line/icons-and-pitfalls) → [集成·配置全景·Wind4 迁移](./guide-line/integration-and-wind4) → [参考](./reference)。

## 一、UnoCSS 是什么：引擎，不是框架

UnoCSS 官方的一句话定位是「**即时按需的原子化 CSS 引擎**」。三个关键词值得逐一拆开：

- **即时（instant）**：不构建完整 AST、不做大范围文件扫描，用高效的 token 提取 + 规则匹配直接生成 CSS。
- **按需（on-demand）**：只为源码里真实用到的工具类生成对应 CSS，没用到的一律不生成——所以产物体积只与你实际使用的类相关，**不需要**像早期 Tailwind 那样配 purge 去删无用类。
- **引擎（engine）**：这是它和 Tailwind 最大的不同。UnoCSS 内核**不内建任何工具类**，`flex`、`m-4`、`text-red-500` 这些常见类**全部来自 preset**。

最容易让新手困惑的一点：**装了 UnoCSS 但没配任何 preset，页面上一个工具类都不会生成**。这正是「no core utilities」哲学——一切皆可配置、也必须配置。

## 二、与 Tailwind CSS 的根本分野

| 维度 | UnoCSS | Tailwind CSS |
| --- | --- | --- |
| 本质 | **引擎**：内核无工具类，一切来自 preset | **框架**：内建一整套预置约定与工具类 |
| 工作形态 | **同构引擎**，可跑 Vite/CLI/ESLint/CDN 运行时 | 主要作为 **PostCSS 插件** |
| 工具类来源 | preset（`presetWind3`/`Wind4`/自定义） | 框架内建 + 官方/社区插件 |
| 可编程性 | 规则/变体/快捷方式全可自定义，可封装成 preset | 通过配置与插件扩展，定制深度受约定约束 |
| 独有能力 | 纯 CSS 图标、属性化、变体分组、CDN 运行时 | 成熟插件生态、海量社区模板 |
| 按需 | 天生只生成用到的类 | 现代版本亦按需（内容扫描） |

一句话：**要 Tailwind 那套齐全工具类** → `presetWind3/Wind4`（兼容度高）；**要自建设计系统、极致灵活/性能** → `presetMini` 或从零写 `rules`。UnoCSS 官方明确**不支持** Tailwind 的插件系统与配置，重度定制的 Tailwind 项目迁移时这部分需重写。

## 三、安装与 Vite 接入

UnoCSS 是一个 meta 包，主入口 `unocss` 同时 re-export 了 `defineConfig` 和各个 preset/transformer，方便统一导入。

```bash
pnpm add -D unocss
# 图标集按需装：用 carbon 就装 @iconify-json/carbon
pnpm add -D @iconify-json/carbon
```

在 `vite.config.ts` 注册插件（插件从 `unocss/vite` 子路径导入）：

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import UnoCSS from 'unocss/vite'

export default defineConfig({
  plugins: [
    UnoCSS(),
  ],
})
```

⚠️ **关键一步**：UnoCSS 的 Vite 插件通过「虚拟模块」注入生成的样式表，必须在入口文件导入它，否则页面上工具类**全部失效**：

```ts
// main.ts
import 'virtual:uno.css' // 旧写法 uno.css 亦可
```

> 「接入后样式完全没出来」十有八九就是漏了这一行。UnoCSS 的默认全局模式必须导入 `virtual:uno.css`。

## 四、最小 uno.config.ts

约定用 `uno.config.ts` 存放配置，`defineConfig()` 提供完整类型提示。要得到 Tailwind 风格的工具类，至少引入一个 Wind 预设：

```ts
// uno.config.ts
import { defineConfig, presetWind4 } from 'unocss'

export default defineConfig({
  presets: [
    presetWind4(), // 对标 Tailwind 4；要对标 TW3/Windi 用 presetWind3()
  ],
  theme: {
    colors: {
      primary: '#6366f1', // 定义后即可用 text-primary / bg-primary
    },
  },
})
```

配置里最常用的几个字段一览（后续各页展开）：

- `presets`：预设数组，工具类的来源。
- `rules`：自定义原子规则（静态字符串 / 动态正则）。
- `shortcuts`：把一串工具类组合成新类名。
- `variants`：自定义前缀 → 选择器改写（如 `hover:`）。
- `theme`：设计令牌（颜色/间距/断点/字体）。
- `transformers`：源码转换器（`@apply`、变体分组等）。

## 五、写下第一个类，并验证它

配好之后，在模板里直接写工具类即可：

```html
<button class="px-4 py-2 rounded bg-primary text-white hover:bg-indigo-600">
  UnoCSS Button
</button>
```

想确认「某个类到底生成了什么 CSS、有没有被匹配到」，用官方 **Inspector**：开发服务器运行时访问 `http://localhost:5173/__unocss`，能交互式查看被扫描的模块、每个工具类命中的规则、以及 shortcuts/preset 的展开情况——排查「为什么这个类没生效」的第一现场。

一个常见坑要先记住：**运行时动态拼接的类名**（如 `'i-carbon-' + name`）扫描器看不到完整字符串，不会生成，需要加进 `safelist` 兜底（详见[集成页](./guide-line/integration-and-wind4)）。

---

打好地基后，下一步进入 [预设体系](./guide-line/presets)：presetWind3/Wind4/Mini 的关系、presetAttributify/Icons/Typography/WebFonts 各自的能耐，以及 `presetUno` 弃用更名的来龙去脉。
