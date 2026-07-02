---
layout: doc
outline: [2, 3]
---

# MF 2.0 生态

> 基于 Module Federation 2.0（v2.6 2026-06） · 核于 2026-07

## 速查

- 2.0 运行时化（见 [MF 2.0 运行时化](./mf2-runtime)）之后，围绕那个独立 runtime 长出一整圈工具，把 MF 从「打包特性」补成「**微前端基础设施**」。四大块：**类型联邦、DevTools、预加载优化、跨构建工具**。
- **类型联邦（Type Federation）**：MF 2.0 能「**自动生成并使用 remote 的类型**」，本地开发时**实时同步**——解决联邦模块「运行时能拿到、TS 却不认识」的类型丢失问题（DTS 插件 + manifest 的 `types` 字段）。
- **Chrome DevTools 插件**：可视化整张联邦依赖图（谁加载谁、各 remote 的 config），支持**本地代理 + 热更新**——把某个线上 remote 指到本机联调。
- **预加载 / 请求瀑布优化**：`preloadRemote` 可按 `resourceCategory`（all/sync）、`filter`、`exposes` 精准预取——把「加载 remote 才发现还要加载它的依赖」的**串行瀑布**提前拍平；再叠加 SSR / data prefetch 方案。
- **跨构建工具是 2.0 最大红利**：官方支持已覆盖 **webpack、Rspack（内置）、Vite（官方 `@module-federation/vite`）、Rollup、Rolldown、Rsbuild、Metro**——同一套 runtime 协议，不同打包器产物可**互相联邦**。
- **Rspack 内置 MF**：Rspack「为 MF 提供一等支持」，**内置 MF v1.5**（`rspack.container.ModuleFederationPlugin`）；要 2.0 全套能力（类型/DevTools）再装 `@module-federation/enhanced`。
- **Vite：官方取代社区**：官方 **`@module-federation/vite`** 活跃（把 Vite 直接接到 `@module-federation/runtime`）；社区 **`originjs/vite-plugin-federation` 已停滞**（自造运行时、v1.4.1 停更约一年、2026-01 起与 Vite 7 不兼容）——新项目用官方版。
- **框架 / 库集成**：Next.js、Modern.js、Rspress、Storybook 等框架集成，React / Vue / React Native 的 bridge——联邦不只共享裸模块，也能桥接带路由的整页面。
- **manifest 是生态的地基**：类型、DevTools、预加载都读同一份 **mf-manifest.json**——2.0 把元信息结构化，工具才有统一数据源（见 [MF 2.0 运行时化](./mf2-runtime)）。
- **差异化壁垒**（InfoQ 观察）：MF 的「**运行时版本协商 + 内建错误边界**」在规模化场景仍是相对 single-spa/import maps/Piral 的差异点。
- 这些能力**大多是运行时插件**（retry、preload、DTS）——统一底座是 2.0 的运行时插件系统；配置侧见[构建工具章 · webpack 深入](/zh/frontend-toolchain/build/webpack/guide-line/expert)。

## 一、类型联邦：补上跨 remote 的 TypeScript

联邦模块有一个天生的「类型黑洞」：`import("shop/Button")` 在**运行时**能拿到真实模块，但**编译时** TS 并不知道 `shop/Button` 长什么样——因为它是另一个独立部署应用的产物，不在你的 `node_modules` 里。1.0 时代大家只能手写 `.d.ts` 声明，随 remote 改动而腐烂。

MF 2.0 的**类型联邦**把这条补上：remote 构建时用 DTS 插件**自动生成类型包**、写进 mf-manifest.json 的 `types` 字段；host 拉取后获得 remote 模块的**真实 TS 类型**，官方描述是能「**自动生成并使用 remote 类型**」并在本地开发时**实时同步**。架构意义：**联邦模块从此享有和本地模块一样的类型安全与 IDE 智能提示**——跨应用共享代码不再牺牲类型。这是 MF 相对「裸 `import()` + 手写声明」的 import maps 路线的一个实打实优势。

## 二、Chrome DevTools：让联邦可观测

去中心化的代价是**难排查**——一个页面里到底加载了哪些 remote、各自哪个版本、shared 协商成了谁，肉眼看不见。MF 2.0 的 **Chrome DevTools 插件**把这张图**可视化**：展示模块依赖关系、各 remote 的配置，并支持**本地代理 + 热更新**——把线上某个 remote 的清单指向本机 dev server，就能在完整线上环境里联调单个 remote。

这解决的是**运维/联调**层面的痛点。对比 import maps 路线只能靠「读 JSON + 看 network 面板」推断依赖解析，MF 的 DevTools 把「哪份 React 在跑、谁加载了谁」变成可点开的图——这也是 InfoQ 把「工具化成熟度」列为 MF 规模化差异点的原因之一。

## 三、预加载：拍平请求瀑布

联邦的默认加载是**串行瀑布**：host 先拉 remote 的 manifest，解析后才知道要拉 `Button` 的 chunk，执行时又发现 `Button` 依赖某个还没加载的 shared……每一步都要等上一步返回，网络往返叠加成可感知的延迟。

MF 2.0 用 `preloadRemote` 把这条瀑布**提前拍平**——在真正用到之前，就按需预取 remote 的资源：

```ts
// 运行时预加载：把「用到才发现要加载」的串行往返，提前并行拉好
mf.preloadRemote([
  {
    nameOrAlias: "shop",
    resourceCategory: "all", // all=同步+异步资源；sync=仅同步
    exposes: ["Button"], // 只预取 shop 的 Button 这个 expose，不整包拉
    filter: (assetUrl) => assetUrl.indexOf("ignore") === -1, // 过滤掉不需要的资源
  },
]);
```

配合 `resourceCategory`（`all`/`sync`）、`exposes`（只预取用得到的导出）、`filter`（排除无关资源）三个旋钮，可以**精准**预取而不是无脑全拉。再往上，官方生态还提供 SSR、data prefetch 等方案继续压缩首屏——共同目标是把去中心化带来的额外网络往返**代价降回可接受**。预加载与性能代价的通论见[核心机制 · 预加载与性能代价](../../mfe-mechanisms/guide-line/perf-preload)。

## 四、跨构建工具：2.0 最大的红利

运行时化最直接的兑现，是**摆脱对 webpack 的绑定**。因为联邦逻辑活在与构建工具无关的 runtime 里，任何能产出「符合协议的 chunk + manifest」的打包器都能加入联邦。2026 年官方支持的矩阵：

| 构建工具 | MF 支持方式 | 状态 |
| --- | --- | --- |
| **webpack 5** | `ModuleFederationPlugin`（1.0 内置）+ `@module-federation/enhanced`（2.0） | 发源地，一等支持 |
| **Rspack** | **内置 MF v1.5**（`rspack.container.ModuleFederationPlugin`）+ `@module-federation/enhanced`（2.0） | **一等支持、开箱内置** |
| **Vite** | **官方 `@module-federation/vite`**（接入 `@module-federation/runtime`） | **活跃**（v1.15.x、周级更新） |
| **Vite（社区旧方案）** | `originjs/vite-plugin-federation`（自造运行时） | **已停滞**（v1.4.1、停更约一年、Vite 7 不兼容）→ 被官方取代 |
| Rollup / Rolldown / Rsbuild | 官方插件 | 支持 |
| Metro（React Native） | 官方支持 | 支持（RN 联邦） |

两个要点要钉死：

- **Rspack 内置**：Rspack 团队与 MF 团队紧密协作、「提供一等支持」，**内置 MF v1.5**（不用额外装包即可用 `rspack.container.ModuleFederationPlugin`）；要 2.0 的类型联邦、DevTools 等增强，再叠 `@module-federation/enhanced`。官方明确**不推荐 v1.0**（已停止迭代），用 v1.5 或 v2.0。
- **Vite 官方取代社区**：`@module-federation/vite` 由 MF 2.0 团队维护，**直接把 Vite 接到官方 runtime**（而非另造一套运行时）；社区的 `originjs/vite-plugin-federation` 曾是 Vite 联邦的唯一选择，但**长期未随 MF 2.0 演进、约一年未发版、2026-01 起与 Vite 7 不兼容**——新项目应选官方版，「MF 在 Vite 上只有 originjs」是过时信息。

架构含义：**同一套 runtime 协议下，webpack 产的 host 可以联邦 Rspack 产的 remote，Vite 产的 remote 也能被两者消费**——构建工具选择与联邦能力**解耦**了。这正是「MF = webpack 插件」认知过时的最硬证据。

## 五、框架集成与差异化壁垒

生态的最外圈是**框架 / 库集成**：Next.js、Modern.js、Rspress、Storybook 等提供了 MF 集成，React / Vue / React Native 有对应的 **bridge**——让联邦不止共享「裸模块」，也能桥接**带路由、带生命周期的整页面**（在模块级基础上叠加一层应用级适配）。

回到定位：InfoQ 2026 的观察是，尽管有人觉得 monorepo 工具「开发体验更好」，但 MF 的 **「运行时版本协商 + 内建错误边界集成」在规模化场景仍是相对 single-spa、import maps、Piral 的差异点**。换句话说，MF 生态的护城河不是「能加载远程模块」（这谁都能做），而是**围绕运行时协商长出的这一整圈治理与工具**——类型、可观测、预加载、跨工具、错误边界。

## 六、@module-federation/\* 包地图

生态能力分散在一组包里，认清分工能少走弯路：

| 包 | 角色 | 说明 |
| --- | --- | --- |
| `@module-federation/runtime` | **运行时内核** | 与构建工具无关的联邦 runtime（`createInstance`/`loadRemote`/`registerRemotes`） |
| `@module-federation/enhanced` | **增强插件 + runtime** | webpack/Rspack 的 2.0 插件，含类型联邦、DTS、DevTools 接线；`/runtime` 子入口再导出内核 |
| `@module-federation/vite` | **Vite 官方插件** | 把 Vite 接到官方 runtime，取代 originjs |
| `@module-federation/rsbuild-plugin` | Rsbuild 插件 | Rsbuild 侧接入 |
| `@module-federation/nextjs-mf` | Next.js 集成 | 在 Next.js 里跑 MF |
| `@module-federation/bridge-react` · `-vue3` | 框架 **bridge** | 桥接带路由/生命周期的整页面（模块级 + 应用级适配） |
| `@module-federation/dts-plugin` | 类型联邦 | 生成/消费 remote 的 `.d.ts` |
| `@module-federation/node` | SSR / Node | 服务端联邦、SSR 支持 |

一句话记忆：**`runtime` 是内核、`enhanced` 是给 webpack/Rspack 的 2.0 全家桶、`vite` 是给 Vite 的官方入口、`bridge-*` 把模块级联邦补出应用级页面桥接、`dts-plugin` 管类型、`node` 管 SSR。** 它们跟随 `@module-federation/enhanced` 的 **v2.6.x** 节奏月度迭代。

## 七、SSR 与数据预取：把联邦带上服务端

MF 2.0 的运行时不止活在浏览器——`@module-federation/node` 把联邦带到 **Node / SSR**：服务端也能 `loadRemote` 远程模块、参与 shared 协商，实现**跨应用的服务端渲染**。再叠加官方规划中的 **data prefetch**（加载 remote 组件的同时并行拉取它要的数据，把「组件到手才发请求」的第二段瀑布再压一层），共同目标是把去中心化在**首屏**上的性能代价降到可接受。这些能力都建立在**运行时内核 + mf-manifest.json** 之上——正是它们，让 MF 从「一个打包技术」长成了「一套覆盖 CSR/SSR 的微前端运行时」。

## 八、bridge：让模块级联邦也能承载整页面

MF 天生是**模块级**的（`loadRemote` 拿到的是一个组件/函数），但实践中常需要联邦**一整个带路由、带自己生命周期的页面**。这正是 `@module-federation/bridge-react` / `-vue3` 的作用：它在模块级联邦之上包一层**应用级适配**——remote 把「整个子应用」`exposes` 成一个可被 host 挂载的桥接单元，host 用 bridge 把它渲染进容器并托管其路由。

于是 MF 覆盖了从「共享一个 Button」到「联邦一个完整子应用」的**全谱**：细粒度用裸 `loadRemote`，整页面用 bridge。这也是 MF 与应用级方案（qiankun/wujie）在能力上的交汇点——区别在于 **bridge 仍是无沙箱的**（同 realm），隔离靠自律，而不是 qiankun 那样的框架兜底（对比见[与应用级方案的选型](./vs-qiankun-selection)）。换句话说：bridge 让 MF 也能「挂整应用」，但它挂的是**不隔离**的整应用——要不要这层隔离，正是模块级与应用级路线的分水岭。

## 小结

MF 2.0 运行时化之后，围绕独立 runtime 长出的生态把它补成了完整的微前端基础设施：**类型联邦**补上跨 remote 的 TypeScript、**DevTools** 让去中心化可观测、**预加载**拍平请求瀑布、**跨构建工具**（Rspack 内置、官方 Vite 插件取代停滞的 originjs、直到 Metro/RN）兑现「联邦与打包器解耦」的红利。这些能力共享同一份 mf-manifest.json 作数据源、大多以运行时插件实现。生态之强，正是「MF = webpack 插件」过时的证据。但联邦的心智不只 MF 一种实现——把同样的心智搬到**浏览器原生**（ESM + Import Maps）上，就是下一页的 [Native Federation](./native-federation)。
