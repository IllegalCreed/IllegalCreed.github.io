---
layout: doc
---

# UnoCSS

**即时按需的原子化 CSS 引擎**（The instant on-demand Atomic CSS engine）——由 Anthony Fu 发起、被视为 Windi CSS 精神续作的下一代原子化方案，当前主线 **v66.7.4**。它与 Tailwind 最根本的分野是「引擎 vs 框架」：UnoCSS 内核**不预置任何工具类**（no core utilities），`m-4`、`flex`、`text-red` 这些全部来自 **preset（预设）**——想要 Tailwind 那套就装 `presetWind3`/`presetWind4`，想自建设计系统就用 `presetMini` 甚至从零写 `rules`。它是**同构（isomorphic）引擎**而非 PostCSS 插件，能跑在 Vite、CLI、ESLint、乃至一行 script 的 **CDN 运行时**里；「按需」意味着只为源码里真实用到的类生成 CSS，天生无冗余、无需 purge。性能上主打**无解析、无 AST、无扫描**的轻量匹配，官方称约为 Windi/Tailwind JIT 的 5 倍，零依赖、内核约 6kb（min+brotli）。围绕它生长出 `presetIcons`（纯 CSS 图标）、`presetAttributify`（属性化模式）、`transformerDirectives`（`@apply`/`theme()`）、变体分组等一整套可编程能力，是当下前端原子化 CSS 里灵活性与性能兼顾的代表。

## 评价

**优点**

- **极致灵活可编程**：一切皆 preset/rule——静态规则 `['flex', { display: 'flex' }]`、动态正则规则 `[/^m-([\.\d]+)$/, ...]`、shortcuts、variants 都能自定义，团队设计系统可封装成自定义 preset 跨项目复用
- **性能第一**：无 AST、无大范围扫描的轻量匹配 + 彻底按需生成，构建快、产物小；零依赖、内核约 6kb
- **同构引擎、集成面广**：不绑定 PostCSS，Vite/Nuxt/Astro/Webpack/CLI/ESLint 全覆盖，还能一行 CDN script 在浏览器**运行时**实时生成 CSS
- **纯 CSS 图标一绝**：`presetIcons` 把 Iconify 十万级图标做成 `i-carbon-sun` 这样的单类，无字体无雪碧图，随需内联
- **属性化 / 变体分组等 DX 创新**：`bg="blue-500"` 属性化、`hover:(bg-blue text-white)` 变体分组、`@apply`/`theme()` 指令，书写体验丰富
- **Tailwind 兼容**：`presetWind3/Wind4` 提供与 Tailwind/Windi 高度一致的工具类，迁移门槛低

**缺点**

- **不含 Tailwind 插件生态**：官方明确不支持 Tailwind 的插件系统与配置，重度定制的 Tailwind 项目迁移需重写这部分
- **无预置即需配置**：no core utilities 意味着「装了 UnoCSS 但不配 preset 就啥类都没有」，新手容易困惑
- **preset 版本差异要留意**：`presetUno` 已弃用更名 `presetWind3`；`presetWind4` 主题键重命名、改 CSS 变量 + oklch，Wind3→Wind4 有破坏性迁移点
- **工程集成有坑**：pnpm 严格依赖隔离下 `presetIcons` 自动发现会失效（生产 build 报 `failed to load icon`），需显式传 `collections`——踩过才知道
- **生态相对年轻**：相比 Tailwind 庞大的社区组件/模板资源，UnoCSS 周边沉淀仍在积累

## 文档地址

[UnoCSS 官网](https://unocss.dev/) ｜ [Getting Started](https://unocss.dev/guide/) ｜ [Presets](https://unocss.dev/presets/) ｜ [Config](https://unocss.dev/config/)

## GitHub 地址

[unocss/unocss](https://github.com/unocss/unocss)

## 幻灯片地址

<a href="/SlideStack/unocss-slide/" target="_blank">UnoCSS</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=unocss" target="_blank" rel="noopener noreferrer">UnoCSS 测试题</a>
