---
layout: doc
outline: [2, 3]
---

# 依赖共享三路线

> 基于微前端 2026 生态 · 核于 2026-07

## 速查

- 问题面（Fowler 原文）：「如果每个微前端都带一份自己的 React，就是在强迫用户下载 n 次 React」；但共享的对价是**构建耦合回潮**——「重新引入了构建时耦合……可能落得一场大规模协同升级」
- 三路线按**版本协商发生的时机**分：**externals + import maps**（部署时集中裁定）、**Module Federation shared**（运行时现场协商）、**不共享**（各自打包，接受重复）
- single-spa 立场：**大库共享、小库各自带**——React/Vue/Angular/moment/rxjs 这类大库「只加载一次至关重要」；react-router 级别的小库「小到可以重复」；共享越多，升级越要全体同步
- **import maps 已 Baseline Widely available（2023-03 起）**：JSON 控制裸说明符（bare specifier）→ URL 的解析；必须在**任何模块加载之前**声明；`type="importmap"` 的 script **不能用 `src` 外链**
- import maps 三键：`imports`（全局映射，尾斜杠做前缀匹配）、`scopes`（**按引用者路径给不同映射 → 同页多版本共存**，最具体 scope 优先、逐级回退）、`integrity`（模块级 SRI 校验）
- **SystemJS 是历史兼容层**：import maps 未原生化年代的 polyfill（System.register 格式）；2026 年新项目用原生 ESM + 原生 import maps 即可
- **MF shared 双端声明**：共享是「注册 + 消费」双向协议——生产者和消费者**都要**在 `shared` 里声明同一依赖（shareKey 一致）；只有一端声明时，另一端照旧打包/回退自己的副本
- **singleton**（默认 `false`）：开启后共享作用域（share scope）内只留一个版本——**版本不一致时加载较高版本，低版本一方收控制台警告**；React 这类全局内部状态库必须开
- singleton 的反直觉后果：你实际运行的 React 版本**由页面里版本最高的参与者决定**，本地 lockfile 说了不算——「可能加载出乎意料的版本」不是 bug 是协商结果
- **requiredVersion**（默认取自 package.json）：声明可接受的版本范围，不满足时**警告**并使用共享域中可用版本；**strictVersion** 把警告升级为**拒绝**——有本地 fallback 就用 fallback，配了 `import: false` 没有 fallback 则**运行时抛错**
- **eager**（默认 `false`）：共享模块打进入口同步可用（不必等异步协商），代价是**入口体积膨胀**且提供的模块总会被下载；**shareStrategy**：`version-first`（默认，初始化即拉全部 remote 保证最高版本，**远端挂了启动就炸**）vs `loaded-first`（按需、容错好）
- **子路径坑**：`shared: ['react-dom']` 只拦精确的 `import 'react-dom'`——`react-dom/client` 会**打进本地副本**，第二份 React DOM 直接破坏单例（hydration 报错）；要写 **`'react-dom/'` 尾斜杠前缀匹配**
- **混用禁忌**（single-spa 原文立场）：同一依赖**不要**同时走 import maps 与 MF shared——两套解析各自为政，双份加载、版本漂移；一个页面选一条路线当权威源

## 一、问题面：n 份 React 与共享的对价

五个子应用各自打包，用户就下载五份 React——Fowler 把这笔账算得直白：「重复依赖增加了用户必须下载的字节数」。但他同一段里就把另一头的代价也标了价：一旦为了去重把公共依赖抽出来，「我们就**重新引入了构建时耦合**」，升级 React 变成全体子应用的**协同升级战役**——这恰恰背叛了微前端「自治」的初衷。

所以依赖共享不是「要不要去重」的技术题，而是**拿部署独立性换字节**的架构交易。三条路线本质是三种成交方式：

| 路线 | 版本协商时机 | 裁决者 |
| --- | --- | --- |
| externals + import maps | 部署时 | import map 的维护者（集中裁定） |
| Module Federation shared | **运行时** | share scope 里的 semver 协商（现场裁定) |
| 不共享 | 无 | 各应用自己（不交易） |

「不共享」是严肃选项而非摆烂——Fowler 指出独立编译天然自带按页 code-split，性能账未必输（详见[预加载与性能代价](./perf-preload)）。下面展开前两条。

## 二、externals + import maps：集中裁定路线

这是 single-spa 官方立场的做法，机制分两半。**构建侧**：webpack `externals`（或等价配置）把 React 这类大库从每个应用的产物里剔除，产物里只留 `import "react"` 这个裸说明符。**运行时侧**：浏览器原生 [import map](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/script/type/importmap) 告诉模块加载器这个裸说明符去哪取：

```html
<!-- 必须出现在任何模块加载之前；type="importmap" 的 script 不能用 src 外链 -->
<script type="importmap">
  {
    "imports": {
      "react": "https://cdn.example.com/react@18.3.1/index.js",
      "react-dom": "https://cdn.example.com/react-dom@18.3.1/index.js",
      "@org/api": "https://cdn.example.com/org-api/v42/api.js",
      "lodash/": "https://cdn.example.com/lodash@4.17.21/"
    },
    "scopes": {
      "/legacy-app/": {
        "react": "https://cdn.example.com/react@17.0.2/index.js"
      }
    },
    "integrity": {
      "https://cdn.example.com/react@18.3.1/index.js": "sha384-…"
    }
  }
</script>
```

这张 JSON 就是全页面依赖的**权威裁定书**，三个键各管一件事（MDN 一手语义）：

- **`imports`**：裸说明符 → URL 的全局映射。键以 `/` 结尾即**前缀匹配**（`"lodash/"` 覆盖 `lodash/debounce` 等全部子路径），多键可匹配时**最具体的键优先**；值必须是绝对 URL 或 `/`、`./`、`../` 开头的路径。
- **`scopes`**：**按引用者（referrer）URL 路径**给出不同映射——上例中 `/legacy-app/` 目录下加载的模块拿到 React 17，其余拿 18。这是**同页多版本共存**的原生方案，渐进升级的直接工具；匹配规则是最具体 scope 优先、没命中逐级回退到 `imports`。
- **`integrity`**：给模块 URL 挂 SRI 哈希，锁死 CDN 内容（与 `<script integrity>` 同格式）。

工程约束同样来自一手文档：import map **必须在首个模块加载前声明并处理完**（晚了不生效）；`type="importmap"` 的 script **禁止 `src`/`async`/`defer` 等属性**——不能外链，得内联或由服务端渲染进 HTML；多张 map 会合并进全局表，但**已解析/已映射的说明符先者优先**（后来的映射被丢弃）；映射只作用于 `import` 语句与 `import()`，不影响 `<script src>` 与 worker。

single-spa 在这条路线上的配套立场值得整体吸收：**什么该共享**——「大型库只加载一次对 Web 应用至关重要」（React/Vue/Angular/moment/rxjs 点名）；**什么不该**——react-router 这类「小到可以重复」的库各自带，保留独立升级权；**为什么不全共享**——共享的依赖必须全体微前端同步升级，共享名单越长，被锁死的自由越多。运维上，import map 本身成了一等部署产物：CI 经 import-map-deployer 并发安全地更新映射、本地用 import-map-overrides 把某个模块指回 localhost——「改一行 JSON 就是一次发布」。至于教程里常见的 **SystemJS**：那是 import maps 未原生化年代的 polyfill（把代码编译成 System.register 格式模拟模块语义）。**import maps 自 2023-03 起已 Baseline Widely available**，新项目直接原生 ESM + 原生 import map，SystemJS 只在需要兼容化石浏览器时才请回来。

## 三、Module Federation shared：运行时协商路线

MF 的 shared 机制不设集中裁定者：**每个应用照常打包自己的依赖副本**，运行时把副本注册进**共享作用域**（share scope，默认名 `'default'`），用的时候按 semver 现场协商「页面里已有的副本能不能用、用谁的」。所有关键行为都从这个模型推得出来。

**双端声明**。共享是「注册 + 消费」的双向协议：生产者在 `shared` 里声明，副本才进 scope；消费者也在 `shared` 里声明（同一 shareKey），构建器才会把 `import 'react'` 改写成「先查 scope」的运行时查找。只有一端声明的后果分别是：消费者没声明 → 照旧打包并使用自己的副本（共享完全没发生）；消费者声明了但 scope 里没人提供 → 回退到自己的 fallback 副本（`import` 配置项所指），配了 `import: false` 则没有 fallback 可回。

**singleton：最高版本获胜**。默认 `false`（版本不一致时各用各的副本）。开启后 scope 里同一 shareKey 只允许一个实例——MF 文档的裁决规则：**版本不一致时加载较高版本，低版本一方在控制台收到警告**。React、Vue 这类**依赖全局内部状态**的库必须开 singleton（两份 React 实例 = hooks 报错、context 断裂）。由此推出一个反直觉但必然的后果：**你实际运行的版本由页面里最高版本的参与者决定**——你 lockfile 锁的 18.2.0，遇上某个 remote 带着 18.3.1 进场，全页面跑的就是 18.3.1。「singleton 可能加载出乎意料的版本」不是 bug，是协商机制的定义行为——治理手段是让所有参与方的版本范围收敛（配合 requiredVersion），而不是指望 lockfile。

**requiredVersion 与 strictVersion：从警告到拒绝**。`requiredVersion`（默认从自家 package.json 推断）声明「我能接受的版本范围」；scope 里的版本不满足时，默认行为是**控制台警告**然后照用可用版本——宽容但危险。`strictVersion` 把宽容关掉：版本不满足即**拒绝**该共享模块——有本地 fallback 就静默用 fallback；配了 `import: false`（无 fallback）则**运行时直接抛错**。webpack 一手文档还给了默认值规则：有本地 fallback 且非 singleton 时默认 `true`，其余默认 `false`。三档语义排成一条治理光谱：**不设 requiredVersion（全凭 semver）→ requiredVersion（不合就警告）→ strictVersion（不合就拒绝）**。

**eager 与 shareStrategy：时机的代价**。共享模块默认**异步**加载（要等 scope 初始化完成，这也是 MF 应用入口普遍要 `import('./bootstrap')` 动态引导的原因）。`eager: true` 把共享模块直接打进入口、同步可用——代价是入口体积膨胀，且提供的模块**总会被下载**（不管最后用没用上）。`shareStrategy` 决定协商的积极程度：默认 **`version-first`**——初始化阶段就**把所有 remote 的入口文件拉一遍**，登记各家版本以保证「最高版本」裁决准确；代价写在 MF 文档的 warning 里——**任何一个 remote 离线，启动期就触发 `beforeLoadShare` 阶段的加载失败**，没配错误兜底就是白屏。**`loaded-first`** 反过来：优先复用已加载的副本、remote 按需再拉——版本裁决可能「非全局最优」，换来启动性能与离线容错。生产系统若 remote 可用性没有保证，`loaded-first` + 错误兜底是更稳的组合。

**子路径坑：尾斜杠前缀匹配**。现代库大量走子路径导出（`react-dom/client`、`lodash/debounce`），而 `shared` 的键默认**精确匹配**：

```ts
// ❌ 只拦截 import 'react-dom' —— react-dom/client 打进本地副本：
//    页面出现第二份 React DOM，singleton 破裂，hydration 报错
shared: { 'react-dom': { singleton: true } }

// ✅ 尾斜杠 = 前缀匹配，拦下该命名空间全部子路径（MF 文档原方案）
shared: {
  'react-dom': { singleton: true },
  'react-dom/': { singleton: true }, // 覆盖 react-dom/client、react-dom/server……
}
```

MF 文档把这条列为 Common mistake：漏了尾斜杠时「`import { createRoot } from 'react-dom/client'` 会加载第二份 React DOM，破坏 React 的单例要求并引发 hydration 错误」。以上是机制层全貌；`exposes`/`remotes` 等插件配置细节见 [webpack 深入](/zh/frontend-toolchain/build/webpack/guide-line/expert)，MF 的架构层与 2.0 运行时生态见 [Module Federation 叶](../../module-federation/)。

## 四、对比与混用禁忌

| 维度 | externals + import maps | MF shared | 不共享 |
| --- | --- | --- | --- |
| **协商时机** | 部署时（改 map 即发布） | 运行时（scope 内 semver 协商） | 无 |
| **裁决者** | map 维护者（集中、可审计） | 最高版本参与者（分散、动态） | 各应用 |
| **多版本共存** | `scopes` 按路径显式指派 | 非 singleton 时各用各的 | 天然多版本 |
| **失败模式** | map 指错 URL → 全页面同错（好排查） | 版本漂移、意外版本获胜（难排查） | 重复下载、体积上浮 |
| **构建工具要求** | 产 ESM + externals 即可（工具无关） | 构建器需 MF 支持（webpack/Rspack/官方 Vite 插件） | 无 |
| **对 ESM 的态度** | 原生模块图，天生 ESM | 自有运行时容器，ESM/非 ESM 皆可 | 无所谓 |
| **代表立场** | single-spa 官方 | Module Federation 本命 | Fowler 的性价比提醒 |

最后是**混用禁忌**。single-spa 文档在共享依赖一节明确建议**不要**对同一依赖混用两套机制：import maps 与 MF shared 是**两套互不知晓的解析体系**——前者活在浏览器模块图里，后者活在 MF 运行时容器里。同一个 React 两边各挂一份，结果就是双份下载、两个模块实例（singleton 名存实亡）、以及「哪边的版本在跑」无从推理。原则一句话：**一个页面里，一个依赖只能有一个权威解析源**。工程混用（如 single-spa 编排 + MF 共享）是成熟模式，但依赖名单必须二选一划界。

## 小结

依赖共享是拿部署独立性换字节的交易，三条路线对应三种成交方式。import maps 路线把裁决权交给一张集中维护的 JSON——`imports` 定全局映射、`scopes` 供同页多版本、`integrity` 锁内容，Baseline Widely available（2023-03 起）意味着 SystemJS 已退居历史兼容层；配套的 single-spa 立场是「大库共享、小库各自带」。MF shared 路线把裁决搬到运行时——双端声明才成交、singleton 让最高版本获胜（你的 lockfile 说了不算）、requiredVersion/strictVersion 决定不合规时是警告还是拒绝、`version-first` 用启动期全量拉取换版本最优、子路径必须尾斜杠前缀匹配。两条路线不要在同一依赖上混用。共享名单本身则永远从「不共享」起步——每加一个共享项，就多一分 Fowler 警告的构建耦合。下一页算总账：[预加载与性能代价](./perf-preload)。
