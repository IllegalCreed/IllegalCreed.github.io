---
layout: doc
outline: [2, 3]
---

# 入门：四大机制全景

> 基于微前端 2026 生态 · 核于 2026-07

## 速查

- 微前端把「一个页面一个团队」变成「一个页面多个团队」，浏览器却没有为此准备任何原生边界：`window` 全局唯一、CSS 全局作用域、依赖各自打包——**四大机制就是补出这些边界**
- **隔离两件套**：**JS 沙箱**（防全局变量污染、事件残留、定时器泄漏）+ **CSS 隔离**（防样式互踩）——先保证「拆开的应用互不伤害」
- **协作两件套**：**通信**（props / CustomEvent / 发布订阅 / URL / utility module，跨域 iframe 用 postMessage）+ **依赖共享**（import maps / MF shared）——再解决「拆开的应用如何配合」
- 第五件事**加载与性能**贯穿始终：怎么拿到子应用（JS entry vs **HTML entry**）、怎么提前拿（prefetch / 预执行 / keep-alive）、拆分的代价怎么算（重复运行时、请求瀑布）
- JS 沙箱四代路线：**快照**（diff `window`，单实例）→ **Proxy**（fakeWindow，多实例，qiankun 代表）→ **with + Proxy**（作用域链拦截，micro-app 默认）→ **iframe**（物理隔离，wujie 路线）
- CSS 隔离四路线：**Shadow DOM**（双向隔离，弹窗逃逸是死穴）/ **属性前缀改写**（`@keyframes` 等 at-rule 不支持）/ **动态样式表劫持**（只管子应用之间）/ **命名约定**（零运行时，靠纪律）
- 依赖共享三路线：**externals + import maps**（single-spa 立场：大库共享、小库各自带）/ **MF shared**（运行时 semver 协商，singleton 最高版本获胜）/ **不共享**（Fowler：独立编译自带按页 code-split）
- **机制先于框架**：选框架本质上是在四大机制上各选一条路线——qiankun ≈ Proxy 沙箱 + HTML entry + 属性改写；wujie ≈ iframe 沙箱 + WebComponent 容器；micro-app ≈ with 沙箱 + CustomElement；MF ≈ 不管隔离、只管共享
- Module Federation 与前三者**不在同一层**：它是模块级共享与组合机制，本身不提供沙箱和样式隔离——「MF 没有沙箱」是选型时最常被忽略的一句话
- 一次子应用挂载 = 五机制接力：**加载**（fetch HTML/remoteEntry）→ **沙箱**（构建执行环境接住生命周期）→ **样式隔离**（改写/入 Shadow DOM/记账）→ **通信**（`mount(props)` 下行通道就位）→ **依赖共享**（`import "react"` 被解析）；卸载反向执行，任何一步偷工都是一类线上事故
- 沙箱防的是**意外冲突**不是恶意代码——跑不可信代码是 iframe `sandbox` 属性与进程隔离的领域，别拿微前端沙箱当安全边界
- 跨章分工先记牢：WC 标准 API 归 Web API 章（待产出）、iframe 标签属性与安全加固归 HTML 章与浏览器安全章、MF 插件配置细节归 webpack 章——本章只讲它们**作为微前端机制载体**的那一面
- 本叶只讲机制通论与横向对比；每个框架的完整 API 与工程化细节见各框架叶

## 一、浏览器没有为「多应用同页」准备边界

微前端的承诺是让多个团队的应用独立开发、独立部署、同页运行（动机与判据见[微前端基础](../mfe-basics/)）。但浏览器的单页面模型天生是「一家人过日子」：

| 浏览器的假设 | 多应用同页时的现实 | 谁来补 |
| --- | --- | --- |
| `window` 全局唯一，谁都能读写 | A 应用的 `window.config` 被 B 覆盖；A 卸载后定时器、事件监听还在跑 | JS 沙箱 |
| CSS 选择器全局生效，后来者覆盖先来者 | 两个应用都写了 `.title`，谁后加载谁说了算 | CSS 隔离 |
| 一个页面一份代码，模块间直接 import | 拆成独立部署的应用后，跨应用传数据没有天然通道 | 通信 |
| 依赖打进自己的 bundle | 五个子应用 = 用户下载五份 React | 依赖共享 |
| 资源在 HTML 里声明，浏览器顺序加载 | 子应用的 HTML/JS/CSS 要被主应用**在运行时**拉取执行 | 加载与预加载 |

这五行就是本叶的目录。前两行是**隔离**——保证拆开的应用互不伤害；中间两行是**协作**——解决拆开之后如何配合；最后一行是**加载与性能**——上面四件事共同的运行时成本。

## 二、隔离两件套：JS 沙箱 + CSS 隔离

**JS 沙箱**回答「子应用的代码在哪个 `window` 上跑」。不隔离的后果有三类典型现场：全局变量互踩（`window.__APP_STATE__` 被覆盖）、事件监听残留（子应用卸载了，`window.addEventListener('resize', …)` 还挂着）、定时器泄漏（`setInterval` 随组件销毁而无人清理）。四代路线的演进主线是**隔离越来越彻底、恢复成本越来越低**：

- **快照沙箱**：应用挂载时给 `window` 拍快照，卸载时 diff 恢复——`window` 还是那一个，所以**同一时刻只能活一个应用**；
- **Proxy 沙箱**：每个应用发一个 fakeWindow，写操作全落在自己的假对象上——多应用并存，卸载即丢弃；
- **with + Proxy**：把子应用代码包进 `with(proxyWindow){}`，作用域链第一站就被换掉，连未声明变量都拦得住——代价是每次变量查找都过一遍代理；
- **iframe 沙箱**：干脆把 JS 挪进 iframe 里跑，`window`/`history`/`location` 全是浏览器原生隔离——wujie 用「iframe 跑逻辑 + 主文档渲染 DOM」把体验问题也解了。

**CSS 隔离**回答「子应用的样式作用在哪棵树上」。它和 JS 沙箱是独立的两件事——JS 沙箱再强，一个 `<style>` 标签插进 `document.head` 照样全局生效。四条路线（Shadow DOM / 属性前缀改写 / 动态样式表劫持 / 命名约定）没有一条是全能的，实践中通常「命名约定打底 + 运行时手段兜底」。细节与坑位见 [JS 沙箱谱系](./guide-line/js-sandbox)与 [CSS 隔离](./guide-line/css-isolation)。

## 三、协作两件套：通信 + 依赖共享

**通信**的第一原则是**少通信**——single-spa 官方文档的立场很直白：UI 状态极少需要跨应用共享，如果两个微前端之间频繁通信，说明它们本就不该拆开。真需要通信时有五种模式，先记方向再记名字：

| 模式 | 方向 | 一句话 | 代表形态 |
| --- | --- | --- | --- |
| props 下行 | 主→子 | 挂载时把数据与回调递进去 | mount props、CE 属性 + `attributeChangedCallback` |
| CustomEvent 上行 | 子→主 | 子应用冒泡广播领域事实 | `dispatchEvent` + 团队前缀事件名 |
| 发布订阅/全局状态 | 多↔多 | 框架内置广播台，共享少量全局态 | qiankun `initGlobalState`、wujie EventBus |
| URL 即通信 | 多↔多 | 页面级状态写进地址栏 | 路由参数即状态（Fowler 力荐） |
| utility module | 调用方→模块 | 共享逻辑做成模块直接 import | single-spa 首选，反对全局 Redux |

跨域 iframe 场景则只有 **postMessage** 一条通道，`targetOrigin` 与 `origin` 校验是必须做对的安全动作。全景与安全写法见[应用间通信](./guide-line/communication)。

**依赖共享**处理「五份 React」问题。三条路线的分界线是**协商发生在什么时候**：

- **externals + import maps**：构建时把大库标记为外部依赖，运行时由浏览器原生 import map 把裸说明符（bare specifier）指到唯一 URL——版本由 import map 的维护者**集中裁定**；
- **Module Federation shared**：每个应用照常打包，运行时把依赖注册进共享作用域（share scope），按 semver **现场协商**用谁的副本；
- **不共享**：接受重复下载，换取彻底的部署独立——Fowler 的提醒是这条路未必更慢，独立编译等于天然按页 code-split。

三路线的取舍与「同一依赖别混用两条路线」的禁忌见[依赖共享三路线](./guide-line/dependency-sharing)。

## 四、外加一层：加载与性能

主应用怎么「拿到」子应用，是机制层最工程化的一环。**JS entry** 约定每个子应用暴露一个全局渲染函数（Fowler 演示的 `window.renderBrowse(containerId, history)` 型契约）；**HTML entry** 直接给子应用的 HTML 地址，把 HTML 本身当资源清单解析——qiankun 依赖的 import-html-entry 是这条路线的事实标准实现。加载有了，还要**提前加载**：qiankun `prefetch` 有四种形态，wujie 更激进地做到「预执行 + 保活秒开」。

而所有机制叠加起来的**性能账**是上线前必须算清的——切换一次应用要走完整条冷启动链：

```text
点击 → 下载 HTML → 解析资源清单 → 下载 JS/CSS → 沙箱初始化 → 执行 → mount
```

链条上每一环都可能被四笔结构性开销拖慢：重复运行时下载（n 份 React）、公共依赖抽取带来的构建耦合回潮、逐级发现依赖的请求瀑布、沙箱与样式改写的运行时税。见 [HTML entry 与资源加载](./guide-line/html-entry-loading)与[预加载与性能代价](./guide-line/perf-preload)。

## 五、一次子应用挂载，五个机制怎么接力

把四大机制串回一条真实的时间线，能看清它们各自的位置——以「用户从主应用点进子应用」为例：

1. **加载**：主应用按路由命中子应用，fetch 它的 HTML（HTML entry）或 remoteEntry（MF），解析出脚本与样式清单——若配置了预加载，这一步在用户点击前就已完成；
2. **JS 沙箱**：框架为子应用构建执行环境（fakeWindow / with 包裹 / iframe），脚本在沙箱上下文里求值，生命周期导出被框架接住；
3. **CSS 隔离**：子应用的样式被处理后进场——或改写加前缀、或装进 Shadow DOM、或被劫持记账以便卸载时清场；
4. **通信**：`mount(props)` 把主应用的数据与回调递进去（下行通道就位），子应用挂载后按需注册事件/订阅（上行与广播通道就位）；
5. **依赖共享**：子应用代码里的 `import "react"` 被解析——走 import map 指向的公共 URL，或在 MF share scope 里协商出一个副本，或干脆用自己打包的那份。

用户离开时反向执行：卸载 → 沙箱恢复/丢弃 → 样式摘除 → 订阅解绑。**任何一步偷工，都对应一类线上事故**——沙箱不清理是全局污染，样式不摘除是残留污染，订阅不解绑是内存泄漏。

## 六、旧认知快检：这些说法值得先纠正

| 常见说法 | 校准 | 详见 |
| --- | --- | --- |
| 「开了 JS 沙箱就万事大吉」 | 沙箱是**软隔离**，防意外不防恶意；`window.top`、原生构造都是逃逸面；样式是另一条战线 | [JS 沙箱谱系](./guide-line/js-sandbox) |
| 「Shadow DOM 是完美的样式隔离」 | 继承属性与 CSS 变量照常穿透；挂 `body` 的弹窗样式全丢是逻辑必然 | [CSS 隔离](./guide-line/css-isolation) |
| 「qiankun 的样式隔离开了就能防主应用」 | 沙箱自动隔离的是**子应用之间**；主应用样式需自治（组件库改前缀） | 同上 |
| 「微前端通信就是搞个全局事件总线」 | 事件总线是五模式里风险最高的一种；single-spa 首选 utility module，Fowler 力荐 URL | [应用间通信](./guide-line/communication) |
| 「postMessage 加个监听就能用」 | 不校验 `event.origin` = 给 XSS 开门；发送端 `targetOrigin` 绝不写 `*` | 同上 |
| 「import maps 还要等浏览器支持」 | **Baseline Widely available（2023-03 起）**；SystemJS 已退居历史兼容层 | [依赖共享三路线](./guide-line/dependency-sharing) |
| 「MF shared 配了就能去重」 | 共享是**双端协议**：一端没声明就没共享；子路径要尾斜杠前缀匹配 | 同上 |
| 「微前端一定比单体慢」 | Fowler：独立编译天然按页 code-split，单页可能反而更快——结论只能来自实测 | [预加载与性能代价](./guide-line/perf-preload) |
| 「qiankun 不支持 Vite 是没来得及适配」 | 是**结构性不支持**：HTML entry 的 eval 执行模型装不下 ESM（语法/作用域/严格模式三重冲突） | [HTML entry 与资源加载](./guide-line/html-entry-loading) |
| 「ShadowRealm 快了，等它就行」 | 提案停在 **Stage 2.7**，无生产可用实现——关注，不排期 | [JS 沙箱谱系](./guide-line/js-sandbox) |
| 「iframe 方案早被微前端框架淘汰了」 | wujie 用「iframe 跑 JS + 主文档渲染 DOM」复活了这条路线，隔离最强且天然兼容 ESM | [JS 沙箱谱系](./guide-line/js-sandbox) |

## 七、机制与框架的映射

选框架，本质是在四大机制上各选一条路线。这张表是本叶与后面五个框架叶之间的索引：

| 机制 | single-spa | qiankun | wujie | micro-app | Module Federation |
| --- | --- | --- | --- | --- | --- |
| **JS 沙箱** | 不提供（只管生命周期编排） | 快照（降级）/ Proxy 沙箱 | **iframe 沙箱** | **with + Proxy**（默认）/ iframe（可选） | 不提供 |
| **CSS 隔离** | 不提供 | Shadow DOM（strict）/ 属性改写（experimental）+ 样式表劫持 | WebComponent 容器（Shadow DOM 型） | 元素隔离 + 样式隔离 | 不提供 |
| **加载方式** | 生命周期协议 + import maps 加载 ESM | **HTML entry**（import-html-entry） | HTML entry（资源解析进 iframe/容器） | HTML entry（CustomElement 触发） | remoteEntry / mf-manifest 模块加载 |
| **通信** | utility module 直接 import（官方首选） | props + `initGlobalState` 型发布订阅 | props / `window.parent` 直通 / EventBus | 属性下行 `setData` + 事件上行 | 直接 import 共享模块 |
| **依赖共享** | **externals + import maps**（官方立场) | 无内置（可配 externals） | 无内置 | 无内置 | **shared 版本协商**（本命机制） |

两条读表提示：

1. **纵向看空格**：single-spa 与 MF 的「不提供」不是缺陷而是定位——前者只做生命周期编排、后者只做模块共享，隔离要么不需要（同栈自治团队）要么自己补（组合 qiankun 型方案）。
2. **横向看代表**：后面每个指南页讲一条机制时，都会点名一个「路线代表」深挖原理——qiankun 之于 Proxy 沙箱、wujie 之于 iframe 沙箱、micro-app 之于 with 沙箱、MF 之于依赖共享——但只讲到机制层为止，框架完整 API 见各框架叶。

隔离是一切的地基，先从 [JS 沙箱谱系](./guide-line/js-sandbox)读起。
