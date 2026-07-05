---
layout: doc
outline: [2, 3]
---

# 生态与选型

> 基于 Panda CSS 1.11.4 · 核于 2026-07

## 速查

- **本组四叶**（语言章 · CSS-in-JS）：CSS Modules（零运行时作用域基线）/ StyleX（Meta）/ **Panda CSS**（Chakra）/ vanilla-extract——都偏「零/轻运行时」，API 风格各异。
- **vs StyleX**：同为构建期提取、几乎零运行时；StyleX 偏「原子样式原语」（`stylex.create` + `stylex.props`），Panda 是含 token/recipe/pattern 的**完整设计系统层**。
- **vs vanilla-extract**：ve **构建期执行 `.css.ts` 求值**生成作用域 class（需 bundler 插件）；Panda **静态分析普通源码**提取原子 CSS（走 PostCSS）。
- **vs CSS Modules**：CSS Modules 是「原生 CSS + 局部作用域类名」，零运行时但无 token/变体/类型体系；Panda 是完整样式引擎。
- **vs Tailwind**：都产原子 CSS；Tailwind 写 class 字符串扫描生成，Panda 在 TS 里写**类型安全的样式对象/配方**并静态提取，内建 token/recipe/pattern。
- **vs styled-components / Emotion**：它们是**运行时**注入、与 RSC 不兼容（Panda 正为解决此而生）；现代场景多被构建期方案替代。
- **vs Chakra UI v3**：同 Chakra 团队；Chakra v3 是**成品组件库**（底层用 Panda 供样式），Panda 是**无组件的样式引擎**。
- **选型速记**：要现成组件→Chakra UI；只要局部作用域最简方案→CSS Modules；已在 Meta 系/极致原子样式→StyleX；要文件内 TS 求值式样式契约→vanilla-extract；**要一套类型安全、含设计系统层（token/recipe/pattern）、RSC 友好的样式引擎→Panda CSS**。

## 一、放进「CSS-in-JS 组」看 Panda

在语言章的 CSS-in-JS 组里，四个叶子代表四种「尽量把样式开销挪到构建期」的思路，但落点各不相同：

| 方案 | 提取机制 | 运行时 | 设计系统层 | 一句话 |
| --- | --- | --- | --- | --- |
| **CSS Modules** | 打包器把 `.module.css` 类名做局部作用域 | 零 | 无 | 原生 CSS + 作用域，最朴素的基线 |
| **StyleX**（Meta） | 构建期编译 `stylex.create` | 极轻 | 少（偏原语） | 可预测合并的原子样式原语 |
| **Panda CSS**（Chakra） | 静态分析源码 → PostCSS 原子 CSS | 极轻 | **完整**（token/recipe/pattern） | 类型安全、开箱即用的样式引擎 |
| **vanilla-extract** | 构建期执行 `.css.ts` 求值 | 零 | 中（有 recipe/sprinkles） | TS 文件即样式契约，作用域 class |

## 二、Panda vs StyleX（本组邻叶）

两者机制同源——都在**构建期提取、几乎零运行时**，但 API 与范畴不同：

- **StyleX** 更聚焦「原子样式本身」：`stylex.create({...})` 定义样式、`stylex.props(...)` 应用，核心卖点是**可预测的样式合并**（后者稳定覆盖前者），偏底层原语，设计系统层需要自己在上面搭。
- **Panda** 是一整套「设计系统层」：`css()` + tokens/semanticTokens + recipes（`cva`/slot）+ patterns（布局）+ 可选 `styled` JSX 工厂，开箱即用度更高、更贴近 Chakra 式 DX。

选择信号：已在 Meta 技术栈或追求极致可预测的原子样式合并 → StyleX；想要「装一套就有 token/变体/布局/类型」的完整方案 → Panda。

## 三、Panda vs vanilla-extract（本组邻叶）

区别在「样式怎么被提取」：

- **vanilla-extract**：样式写在专门的 `.css.ts` 文件里，**构建期执行这些 TS**（求值得到样式对象）再生成作用域 class——是『执行 TS 文件』的思路，需要对应 bundler 插件（Vite/webpack/esbuild）。
- **Panda**：**静态分析普通源码**里的 `css()`/recipe 调用提取原子 CSS，走 PostCSS 管线——是『分析调用点』的思路。

因此 ve 天然支持在 `.css.ts` 里用完整 TS 逻辑组织样式（因为真的会执行），Panda 则受静态分析约束（值须可静态穷举）。两者都以类型安全著称，选谁多看团队更习惯「文件内 TS 求值」还是「源码里写样式对象 + 完整设计系统 API」。

## 四、Panda vs Tailwind CSS

都产**原子 CSS**，但作者体验与类型化程度不同：

| 维度 | Tailwind CSS | Panda CSS |
| --- | --- | --- |
| 写在哪 | HTML/JSX 的 `class` 字符串 | JS/TS 的样式对象/配方 |
| 生成方式 | 扫描类名生成对应 CSS | 静态分析样式对象提取原子 CSS |
| 类型安全 | 弱（字符串，靠插件补全） | 强（codegen 出全量类型推导） |
| 设计系统 | 配置 theme + 工具类 | token/semanticToken/recipe/pattern 一体 |
| 变体 | 需 `tailwind-variants` 等外挂 | 内建 `cva`/config recipe |

想「HTML 里堆类、生态资源多」选 Tailwind；想「TS 里写类型安全样式 + 内建设计系统层」选 Panda。

## 五、Panda vs 运行时 CSS-in-JS / Chakra v3

- **vs styled-components / Emotion**：它们**运行时**生成并注入样式，与 React Server Components 不兼容、有运行时开销——Panda 正是为解决这两点而生，现代 SSR/RSC 场景多用构建期方案替代。（这也是本组把 styled-components/Emotion 归为「衰退期」、只在对比中带过的原因。）
- **vs Chakra UI v3**：同出 Chakra 团队，但**分工互补**：Chakra v3 是**成品组件库**（提供 Button/Modal 等现成组件，v3 底层正是用 Panda 做样式引擎）；Panda 是**无组件的样式引擎**，只产样式原语。要现成组件用 Chakra，要给自建组件/设计系统当样式底座用 Panda。

## 六、什么时候选 Panda CSS

适合：

- 用 **Next.js App Router / RSC / SSR**，需要样式在构建期定稿、运行时不注入；
- 想要**一套装齐**的设计系统层（token + 语义 token + 明暗模式 + 变体配方 + 布局原语），而不是拼装多个库；
- 重视**类型安全**，希望「只准用 token」这类约束能落到编译期；
- 团队接受 codegen 心智（生成并维护 `styled-system` 目录）。

不必上：

- 只想给几个组件加局部作用域样式、不需要设计系统 → **CSS Modules** 更轻；
- 已深度绑定 Tailwind 生态与现成模板 → 继续 Tailwind；
- 想要现成组件而非自建 → 直接用 **Chakra UI**（其底层已是 Panda）。

---

到此 Panda 的核心已过一遍，速查/对照表/资源汇总见[参考](../reference)。
