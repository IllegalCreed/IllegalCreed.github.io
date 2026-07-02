---
layout: doc
outline: [2, 3]
---

# 参考

> 基于微前端 2026 生态 · 核于 2026-07

## 速查

- 本页汇总六张表：**JS 沙箱四代路线** / **CSS 隔离四路线** / **通信五模式 + postMessage 安全清单** / **依赖共享三路线 + MF shared 键** / **预加载形态** / **机制×框架映射**
- 沙箱一句话谱系：快照（diff window、单实例）→ Proxy（fakeWindow、多实例）→ with + Proxy（拦自由变量、有查找税）→ iframe（物理隔离）；ShadowRealm 停在 **Stage 2.7** 前瞻位
- CSS 隔离一句话谱系：Shadow DOM（双向隔离、弹窗逃逸）→ 属性改写（`@keyframes`/`@font-face` 不支持）→ 样式表劫持（只管子应用之间）→ 命名约定（零运行时）
- 通信一句话谱系：URL（页面级状态）→ props / CustomEvent（单向）→ 发布订阅（全局态克制用）→ utility module（显式契约首选）→ postMessage（跨域 iframe 唯一正门）
- 依赖共享一句话谱系：import maps（集中裁定、Baseline 2023-03）vs MF shared（运行时协商、singleton 最高版本获胜）vs 不共享（Fowler：未必更慢）；**同一依赖勿混用两条路线**
- 预加载一句话谱系：资源预拉（qiankun prefetch）→ 实例化 + 预执行（wujie）→ 保活（内存换秒开）；MF `version-first` 是隐性全量预拉
- postMessage 安全七条（发送 targetOrigin 精确、接收 origin 白名单、语法校验、不滥挂监听、纯数据协议、`event.source` 回信、MessageChannel 专线）见第三节检查单
- 读机制×框架映射表的姿势：**纵向空格是定位不是缺陷**（single-spa 只编排、MF 只共享），**横向代表只到机制层**——完整 API 进各框架叶

## 一、JS 沙箱路线对比表

| 维度 | 快照沙箱 | Proxy 沙箱 | with + Proxy | iframe 沙箱 | ShadowRealm（前瞻） |
| --- | --- | --- | --- | --- | --- |
| 隔离原理 | mount/unmount diff `window` 恢复 | fakeWindow 写时隔离 | 作用域链首站换成代理 | 浏览器原生独立 `window` | 语言层独立 `globalThis` + intrinsics 副本 |
| 多实例 | ✗（共用真 window） | ✓ | ✓ | ✓ | ✓ |
| 拦截隐式全局（顶层 `var`） | ✗（事后才清） | ✗ | ✓ | ✓（天然独立） | ✓（真隔离） |
| `history`/`location` 隔离 | ✗ | ✗（需额外处理） | ✗（需额外处理） | ✓ 原生 | 无 DOM 概念 |
| 性能特征 | 切换全量遍历 ×2 | 读写过 Proxy 陷阱 | 每次变量查找过 `has`/`get`，`with` 不可优化 | 无查找税；iframe 实例成本 | 同步调用、共享引擎 |
| ESM 子应用兼容 | — | 差（依赖全局导出） | ✗（`with` 与严格模式互斥） | ✓（iframe 原生执行） | ✓（`importValue` 原生模块） |
| 兼容性门槛 | 无 ES6 依赖 | 需 `Proxy`（不可 polyfill） | 需 `Proxy` + 非严格语境 | 需 WebComponent 容器配套 | **Stage 2.7，无生产实现** |
| 路线代表 | qiankun 降级态（IE，强制 `singular`） | qiankun `proxySandbox` | micro-app 默认沙箱 | wujie；micro-app 可选模式 | TC39 提案 |
| 典型坏法 | 双实例互吞状态 | `this` 绑定（Illegal invocation）、副作用需专项收集 | `xxx is not defined`、性能劣化 | micro-app 的 src 同域坑（empty.html / `window.stop()`） | 拿「即将可用」做排期 |

详见 [JS 沙箱谱系](./guide-line/js-sandbox)。

## 二、CSS 隔离四路线表

| 维度 | Shadow DOM | 属性前缀改写 | 动态样式表劫持 | 命名约定 |
| --- | --- | --- | --- | --- |
| 隔离方向 | 双向（进不来出不去） | 单向（防泄漏不防入侵） | 时间维度（防残留/互踩） | 预防性（防撞名） |
| 执行者 | 浏览器原生 | 框架运行时改写选择器 | 框架劫持 `appendChild` 记账 | 构建工具 / 团队纪律 |
| 穿透/盲区 | 继承属性、CSS 变量、`dir`/`lang` 穿透（主题通道）；**弹窗挂 body 样式全丢** | **`@keyframes`/`@font-face`/`@import`/`@page` 不支持**；弹窗选不中 | **主应用样式不管辖**（需自治：antd 改 `@ant-prefix` + `ConfigProvider`） | 第三方全局样式、不守约的队友 |
| 运行时成本 | 低（原生）；`adoptedStyleSheets` 一份表喂多树 | 每条规则解析改写 | 劫持 + 账本 | **零** |
| 路线代表 | qiankun `strictStyleIsolation`、wujie/micro-app 容器 | qiankun `experimentalStyleIsolation` | qiankun 沙箱默认（「自动隔离微应用之间的样式」） | BEM / CSS Modules / CSS-in-JS（Fowler 立场） |

落地三层叠：命名约定打底 → 框架运行时兜底 → 主应用自治。详见 [CSS 隔离](./guide-line/css-isolation)。

## 三、通信五模式表

| 模式 | 方向 | 耦合物 | 跨域 iframe | 甜区 | 典型坏法 |
| --- | --- | --- | --- | --- | --- |
| props 下行 | 主→子 | props 形状契约 | ✗ | 登录态/主题/回调下发；CE 形态走 `attributeChangedCallback` | 万能 props 袋 |
| CustomEvent 上行 | 子→主 | 事件名 + `detail` 结构 | ✗ | 广播领域事实（`team-x:` 前缀命名） | 无前缀撞名、当请求-响应用 |
| 发布订阅/全局状态 | 多↔多 | 状态字段隐式约定 | ✗ | 少量全局态（`initGlobalState` 型 / EventBus） | 事件满天飞、卸载不 `offGlobalStateChange` |
| URL 即通信 | 多↔多 | 路由结构（公开契约） | ✓ | 页面级状态、深链接（Fowler：倒逼忠实建模） | 敏感数据进 URL |
| utility module | 调用方→模块 | 显式导出 API | ✗ | 共享逻辑/请求缓存（single-spa 首选；反对全局 Redux） | 演化成全局 store |
| postMessage | 双向 | 消息 schema + origin 白名单 | **✓ 唯一正门** | 跨域 iframe 集成 | `targetOrigin: "*"`、不校验 origin |

**postMessage 安全检查单**（MDN 一手）：

| # | 检查项 | 要点 |
| --- | --- | --- |
| 1 | 发送端 `targetOrigin` | 精确 origin，**绝不 `*`**；省略默认 `"/"`（仅同源） |
| 2 | 接收端 `event.origin` | 白名单校验；它是**发送时刻**的 origin，不代表窗口现状 |
| 3 | 消息语法校验 | 身份过了还要验 schema——对方的洞会顺通道变成你的 XSS |
| 4 | 监听器策略 | 不期望收消息就**不挂** `message` 监听（万无一失） |
| 5 | 数据形态 | 结构化克隆：函数/DOM 节点不可传、类实例原型丢失 |
| 6 | 回信 | `event.source.postMessage(reply, event.origin)` |
| 7 | 高频升级 | `MessageChannel` 转移 `port2` 建专线；transfer 对象**转移后原端不可用** |

详见[应用间通信](./guide-line/communication)。

## 四、依赖共享三路线表

| 维度 | externals + import maps | MF shared | 不共享 |
| --- | --- | --- | --- |
| 协商时机 | 部署时（改 map 即发布） | 运行时 semver 协商 | 无 |
| 裁决者 | map 维护者（集中） | share scope 内最高版本参与者 | 各应用 |
| 多版本共存 | `scopes` 按引用者路径指派 | 非 singleton 各用各的 | 天然 |
| 标准化程度 | **Baseline Widely available（2023-03）** | MF 运行时私有协议 | — |
| 构建工具 | 产 ESM + externals 即可 | 需 MF 支持（webpack/Rspack/官方 Vite 插件） | 任意 |
| 失败模式 | map 指错 → 全页同错（好排查） | 版本漂移、意外版本获胜 | 重复下载 |
| 立场代表 | single-spa（大库共享、小库各自带） | Module Federation | Fowler（独立编译自带 code-split） |

**MF shared 关键键速查**（机制层；插件配置细节见 [webpack 深入](/zh/frontend-toolchain/build/webpack/guide-line/expert)）：

| 键 | 默认 | 语义与坑 |
| --- | --- | --- |
| `singleton` | `false` | scope 只留一份；**版本冲突最高版本获胜、低版本方警告**——实际版本由页面最高版本参与者决定 |
| `requiredVersion` | 取自 package.json | 可接受范围；不满足**警告**后照用可用版本 |
| `strictVersion` | 有 fallback 且非 singleton 时 `true` | 不满足即**拒绝**：有 fallback 用 fallback，`import: false` 时**运行时抛错** |
| `eager` | `false` | 打进入口同步可用；入口膨胀、提供模块必下载 |
| `import` | 键名 | 本地 fallback 来源；`false` = 只消费不提供 fallback |
| `shareScope` / `shareKey` | `'default'` / 键名 | 作用域名 / 查找键——**双端必须一致** |
| `shareStrategy` | `'version-first'` | 初始化拉全部 remote 保版本最优（**离线 remote 启动即炸**）；`'loaded-first'` 按需、容错好 |
| 尾斜杠 `'react-dom/'` | — | 前缀匹配全部子路径；漏写 = `react-dom/client` 本地副本 → **双 React DOM、hydration 报错** |

**import maps 键速查**（MDN 一手）：`imports`（裸说明符→URL；尾斜杠前缀匹配、最具体键优先）、`scopes`（按引用者路径分域→同页多版本；最具体 scope 优先逐级回退）、`integrity`（模块级 SRI）；**必须先于一切模块加载声明、不能 `src` 外链**；多 map 合并时先注册者优先。禁忌：**同一依赖勿混用 import maps 与 MF shared**。详见[依赖共享三路线](./guide-line/dependency-sharing)。

## 五、预加载形态表

| 形态 | 提前做到哪一步 | 触发时机 | 代价 | 代表 |
| --- | --- | --- | --- | --- |
| 资源预拉 `prefetch: true` | 下载进 HTTP 缓存 | 首个子应用 mount 后 | 带宽 | qiankun 默认 |
| 资源预拉 `'all'` | 同上，全量 | 主应用 `start()` 时 | 抢首屏带宽 | qiankun |
| 资源预拉 `string[]` / `function` | 同上，定向/两级（`criticalAppNames` + `minorAppsName`） | 首个 mount 后 / 自定义 | 可控 | qiankun |
| 预加载 `preloadApp` | 下载 + **iframe 实例化** | 手动 / `requestIdleCallback` | 内存 | wujie |
| 预执行 `exec` | 下载 + 实例化 + **执行渲染**（类 SSR 体验） | 预加载阶段 | 主线程 + 内存 | wujie |
| 保活 keep-alive | 切走**不销毁**，回访秒开 | 常驻 | 内存常驻（须设上限） | wujie |
| `version-first` 隐性预拉 | 初始化拉**全部 remote entry**（为版本协商） | 应用启动 | 启动网络放大、离线脆弱 | MF 默认 |

性能代价四连背诵：重复运行时（n 份 React）、共享 → 构建耦合回潮、请求瀑布（MF 2.0 公告点名）、沙箱运行时税。详见[预加载与性能代价](./guide-line/perf-preload)。

## 六、机制×框架映射表

| 机制 | single-spa | qiankun | wujie | micro-app | Module Federation |
| --- | --- | --- | --- | --- | --- |
| JS 沙箱 | 不提供 | 快照（降级）/ Proxy | **iframe** | **with + Proxy** / iframe 可选 | 不提供 |
| CSS 隔离 | 不提供 | Shadow DOM / 属性改写 + 样式表劫持 | WebComponent 容器 | 元素隔离 + 样式隔离 | 不提供 |
| 加载方式 | 生命周期协议 + import maps | **HTML entry**（import-html-entry） | HTML entry → iframe/容器 | HTML entry（CustomElement 触发） | remoteEntry / mf-manifest |
| 通信 | **utility module import** | props + `initGlobalState` | props / `window.parent` / EventBus | 属性 `setData` + 事件 | 直接 import 共享模块 |
| 依赖共享 | **externals + import maps** | 无内置 | 无内置 | 无内置 | **shared 协商** |
| 预加载 | — | `prefetch` 四形态 | 预加载/预执行/保活 | 资源缓存 | `version-first` / manifest 预载 |
| ESM/Vite 子应用 | ✓（本就 ESM 工作流） | ✗（2.x 结构性不支持） | ✓（iframe 原生执行） | iframe 模式 ✓ | ✓（官方 Vite 插件） |

各框架完整 API 见框架叶：[single-spa](../single-spa/) / [qiankun](../qiankun/) / [wujie](../wujie/) / [micro-app](../micro-app/) / [Module Federation](../module-federation/)。

## 权威链接

- [qiankun FAQ](https://qiankun.umijs.org/faq) · [qiankun API](https://qiankun.umijs.org/api) —— 沙箱降级、样式隔离限制、prefetch 四形态、publicPath 注入
- [wujie 原理指南](https://wujie-micro.github.io/doc/guide/) —— iframe 沙箱、WC 容器、路由同步、保活/预执行
- [micro-app 沙箱文档](https://github.com/jd-opensource/micro-app/blob/master/docs/zh-cn/sandbox.md) —— with/iframe 双沙箱、src 同域坑
- [import-html-entry](https://github.com/kuitos/import-html-entry) —— importHTML/importEntry/execScripts 三 API
- [Module Federation: shared](https://module-federation.io/configure/shared.html) · [shareStrategy](https://module-federation.io/configure/sharestrategy.html) —— 版本协商与加载策略
- [webpack: ModuleFederationPlugin Sharing hints](https://webpack.js.org/plugins/module-federation-plugin/#sharing-hints) —— strictVersion/eager 等 hint 的原始定义
- [MDN: import map](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/script/type/importmap) —— Baseline 状态、imports/scopes/integrity
- [MDN: Using Shadow DOM](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_shadow_DOM) —— 隔离边界、继承穿透、adoptedStyleSheets
- [MDN: window.postMessage](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage) —— targetOrigin/origin 校验安全告诫
- [TC39: ShadowRealm 提案](https://github.com/tc39/proposal-shadowrealm) —— Stage 2.7、callable boundary
- [single-spa: Recommended Setup](https://single-spa.js.org/docs/recommended-setup/) —— utility module、共享依赖立场
- [Martin Fowler: Micro Frontends](https://martinfowler.com/articles/micro-frontends.html) —— JS entry 契约、URL 通信、性能实测原则
- [Module Federation 2.0 公告](https://module-federation.io/blog/announcement.html) —— 运行时化、mf-manifest、请求瀑布问题

## 相关页

- [微前端基础](../mfe-basics/) —— 定义动机、判据与反判据、组合模式：机制之前先问要不要拆
- [single-spa](../single-spa/) / [qiankun](../qiankun/) / [wujie](../wujie/) / [micro-app](../micro-app/) / [Module Federation](../module-federation/) —— 各路线代表的完整框架叶
- [webpack 深入](/zh/frontend-toolchain/build/webpack/guide-line/expert) —— MF 插件 exposes/remotes/shared 配置细节
- [Vue 其他生态](/zh/frontend-framework/ui/vue/guide-line/other) —— qiankun/wujie/micro-app 的 Vue 接入实操
- [浏览器安全](/zh/base/browser/browser-security/) —— origin 模型、iframe sandbox 与点击劫持防护
- [iframe 嵌入](/zh/base/language/html/html-media/guide-line/iframe-embedding) —— iframe 标签属性与嵌入加固
- [跨源与 CORS](/zh/base/network/net-cors/) —— HTML entry fetch 资源的跨域前提
