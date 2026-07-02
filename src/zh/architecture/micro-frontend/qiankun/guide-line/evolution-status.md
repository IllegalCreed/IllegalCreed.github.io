---
layout: doc
outline: [2, 3]
---

# 演进与现状

> 基于 qiankun 2.10（3.0 rc 追踪） · 核于 2026-07

## 速查

- **prefetch 四形态**（`start({ prefetch })`）：**`true`**（默认，第一个子应用挂载后空闲时预取其余）、**`'all'`**（`start` 后立即预取全部，配合 `loadMicroApp`）、**`string[]`**（指定 name 列表预取）、**函数** `(apps) => { criticalAppNames, minorAppsName }`（自定义关键/次要）
- 预取的**通论**（浏览器空闲预载、`requestIdleCallback`）见[核心机制·性能与预加载](../../mfe-mechanisms/guide-line/perf-preload)——本页只列 qiankun 的四形态取值
- **通信** `initGlobalState(state)` 返回 `MicroAppStateActions`：**`onGlobalStateChange(cb, fireImmediately?)`** 订阅、**`setGlobalState(state)`** 更新（**只支持一级属性**）、**`offGlobalStateChange()`** 取消订阅
- 通信**通论**（props 下发 / 全局状态 / 事件总线的取舍）见[核心机制·通信](../../mfe-mechanisms/guide-line/communication)；qiankun 的 `initGlobalState` 是「全局状态」路线的具体实现，3.0 计划**移除** globalState
- **2.10.16（2023-11-15）是事实稳定线**：2.x 长期只做小维护（性能微调），无新特性——生产就用它
- **3.0 三年难产史**：2021-04 发起 roadmap（[#1378](https://github.com/umijs/qiankun/discussions/1378)）→ 2022-06 社区吐槽「一年多只做了个新 logo」→ 2024-09 rc.0 → 2026-02 rc.21，**始终 rc、无 stable**
- **3.0 重构要点**：拆成 **`@qiankunjs/*` 可插拔模块**（`loader`/`sandbox`）、沙箱去 `eval`（TC39 Realms 思路）、新 loader 用 DOMParser + streaming 原生吃 **ESM/Vite**、样式隔离弃 Shadow DOM 转 `@scope`、支持 **CSP**、rc.21 加 **legacy API 兼容层**
- **2026 复苏迹象**：@scope 样式隔离方向、`create-qiankun` 脚手架（`npx create-qiankun`）——活动恢复但离 stable 尚远
- **选型定位**：qiankun = **国内存量最大、面试必考**的微前端框架；开箱即用（webpack + 要沙箱/样式/HTML entry 的首选），但 **Vite 之痛 + 样式隔离不完美**是硬伤
- **新项目建议**：Vite 主力 → 优先 [wujie](../../wujie/)/[micro-app](../../micro-app/)；存量 webpack + 要开箱 → qiankun 仍稳妥；要极致控制 → [single-spa](../../single-spa/)

## 一、prefetch：四种预取形态

预取（prefetch）是 qiankun 的一项性能优化——在浏览器空闲时提前把**还没挂载的子应用**的静态资源下下来，等真要挂载时秒开。预载的通用原理（`requestIdleCallback`、空闲预载的取舍）见[核心机制·性能与预加载](../../mfe-mechanisms/guide-line/perf-preload)。qiankun 通过 `start({ prefetch })` 提供四种策略：

| 取值 | 行为 | 适用 |
| --- | --- | --- |
| **`true`**（默认） | **第一个子应用挂载后**，空闲时预取**其余未挂载**子应用的资源 | 通用默认，兼顾首屏与后续切换 |
| **`'all'`** | `start` 之后**立即**预取**全部**子应用资源 | 子应用少、都可能很快用到（常配 `loadMicroApp`） |
| **`string[]`** | 只预取**指定 name** 的子应用 | 明确知道哪几个高频，精准预载 |
| **函数** | `(apps) => ({ criticalAppNames, minorAppsName })` 自定义关键/次要分级 | 复杂场景按业务逻辑分优先级 |

```js
// 四形态示例
start({ prefetch: true }); // 默认：首个挂载后预取其余
start({ prefetch: "all" }); // 立即全预取
start({ prefetch: ["react-app", "vue-app"] }); // 指定预取
start({
  prefetch: (apps) => ({
    criticalAppNames: ["dashboard"], // 关键：优先预取
    minorAppsName: apps.map((a) => a.name), // 次要：稍后预取
  }),
});
```

也可脱离 `start` 用 **`prefetchApps(apps)`** 手动触发预取：

```js
import { prefetchApps } from "qiankun";
prefetchApps([{ name: "chart", entry: "//localhost:7200" }]); // 手动预取指定子应用
```

## 二、通信：initGlobalState 全局状态

qiankun 内置的应用间通信是**全局状态**方案——`initGlobalState(state)` 建一个所有应用共享的状态对象，返回一组操作方法。通信的三条路线（props 单向下发 / 全局状态 / 事件总线）的取舍见[核心机制·通信](../../mfe-mechanisms/guide-line/communication)，这里是 qiankun 的具体 API：

```js
// 主应用：初始化全局状态
import { initGlobalState } from "qiankun";

const actions = initGlobalState({ user: null, theme: "light" });

// 订阅变更：state 是最新值，prev 是旧值
actions.onGlobalStateChange((state, prev) => {
  console.log("全局状态变了", state, prev);
});

// 更新状态：注意只支持「一级属性」的变更
actions.setGlobalState({ user: { id: 1, name: "Zhang" } });
```

子应用侧通过 `props` 拿到同一组 `actions`（qiankun 在 `mount(props)` 时注入 `onGlobalStateChange`/`setGlobalState`），从而双向读写：

```js
// 子应用：从 props 拿到通信方法
export async function mount(props) {
  props.onGlobalStateChange((state, prev) => updateUI(state));
  props.setGlobalState({ theme: "dark" }); // 子应用也能改全局状态
}
```

`MicroAppStateActions` 三个方法：

| 方法 | 说明 |
| --- | --- |
| `onGlobalStateChange(cb, fireImmediately?)` | 订阅变更；`fireImmediately: true` 注册时立即用当前值触发一次 |
| `setGlobalState(state)` | 更新全局状态——**仅支持第一级属性**的修改（深层嵌套改动不会触发通知） |
| `offGlobalStateChange()` | 取消当前应用的订阅（子应用 `unmount` 时应调用，避免泄漏） |

值得注意：**3.0 roadmap 计划移除 globalState API**（认为它耦合过重）。实践中很多团队本就用更成熟的方案替代（主应用装 Redux/Pinia 走 props 下发、或独立事件总线）——qiankun 的 `initGlobalState` 是「够用但不强大」的内置项。

## 三、2.10.16：事实稳定线

qiankun 的版本现状要认清一个事实：**2.10.16（2023-11-15）是长期的稳定线**。2.x 分支在此之后基本只做**极小维护**（如 2.10.16 那次改动只是「移除对象展开运算符以在大数组迭代中提速」这类性能微调），**没有新特性**。也就是说，今天你在生产用的 qiankun，功能面就是 2.10 那套——两开关样式隔离、三沙箱、import-html-entry 加载、globalState 通信。

这个「停滞」不完全是坏事：核心稳定、少变、生态资料多；但它也意味着 **Vite 之痛、样式隔离不完美这些老问题在 2.x 不会被解决**——要解决得等 3.0。

## 四、3.0：三年难产史与重构要点

qiankun 3.0 是微前端圈一个著名的「跳票」案例。时间线：

| 时间 | 节点 |
| --- | --- |
| 2021-04 | 发起 3.0 roadmap（[discussion #1378](https://github.com/umijs/qiankun/discussions/1378)） |
| 2022-06 | 社区吐槽「一年多过去，只完成了一个新 logo」 |
| 2024-09 | 3.0.0-rc.0 发布（首个 rc，跑通新架构） |
| 2026-02 | 3.0.0-rc.21——**仍是 rc，无 stable** |

三年多、二十余个 rc，至今没有正式版。但 3.0 的重构方向是清晰且有价值的（roadmap + rc changelog）：

- **模块化拆分**：拆成 `@qiankunjs/*` 独立包——`@qiankunjs/loader`（加载）、`@qiankunjs/sandbox`（沙箱）**可插拔**，沙箱对齐 TC39 Realms 思路、**去掉对 `eval` 的依赖**。
- **新 loader 原生吃 ESM**：**DOMParser 替代正则**解析 HTML、**streaming** 流式加载、原生支持 `<script type="module">` 与 **Vite / Webpack 5 Module Federation**（这是最被期待的一条，详见[Vite 与 ESM 之痛](./vite-esm-pain)）。
- **样式隔离转向**：**弃 Shadow DOM**（兼容性差），以 `experimentalStyleIsolation` / 原生 CSS **`@scope`** 为标准（与 scoped-css 合作，见[样式隔离](./style-isolation)）。
- **安全**：支持 **CSP**（Content Security Policy）。
- **兼容层**：rc.21 加入 **legacy API**，让 2.x 用户能平滑迁移到 3.0。
- **破坏性变更**：移除废弃的 `render` 配置、Shadow DOM 方案、`globalState` API 等。

## 五、2026 复苏迹象

沉寂几年后，qiankun 在 **2026 年有活动恢复的迹象**：

- **@scope 样式隔离方向**：把长期实验的运行时样式隔离，往原生 CSS `@scope` 与 scoped-css 合作的方向做扎实，试图根治 Shadow DOM 弹窗与属性改写 at-rule 两条老路的缺陷。
- **`create-qiankun` 脚手架**：提供 `npx create-qiankun` 一键起项目（3.0 roadmap 里「CLI scaffolding」的落点），降低从零接入的成本。

这些是积极信号，但要克制预期：**离 3.0 stable 仍有距离**，做选型时应以「2.x 是现实、3.0 是关注项」为准，不押未发布版本的排期。

## 六、选型定位

把 qiankun 放进 2026 的微前端全景（完整横评见[微前端基础·2026 选型全景](../../mfe-basics/guide-line/landscape-2026)）：

- **它是什么地位**：**国内存量最大、面试必考**的微前端框架。蚂蚁出品、生态成熟、中文资料最全，大量存量系统跑在它上面——学微前端绕不开它。
- **它的甜区**：**存量 webpack 项目**，要**开箱即用**的 JS 沙箱 + 样式隔离 + HTML entry，团队想少写隔离代码。
- **它的硬伤**：**Vite/ESM 之痛**（2.x 接不了 Vite，硬接丢沙箱）、**样式隔离不完美**（Shadow DOM 弹窗逃逸、属性改写不支持 `@keyframes`）、**3.0 长期难产**。
- **对比与替代**：新项目 **Vite 主力 → [wujie](../../wujie/)（iframe 沙箱、原生 ESM）/ [micro-app](../../micro-app/)（低侵入、支持 module）**；要**极致控制、自建底座 → [single-spa](../../single-spa/) + import maps**；要**开箱 + 存量 webpack → qiankun**。

一句话选型：**qiankun 是「存量 webpack + 要开箱」的稳妥解，不是「新项目 + Vite」的顺路解**——后者应先看 wujie/micro-app。

## 小结

qiankun 的现状是一组要一起记的事实：功能面停在 **2.10.16（2023-11）事实稳定线**，`prefetch` 四形态与 `initGlobalState`（一级属性、3.0 拟移除）通信是它内置能力的两个代表；**3.0 三年难产**（2021 发起、2024 rc.0、2026 rc.21 仍无 stable），但重构方向清晰——`@qiankunjs/*` 可插拔模块、新 loader 原生吃 ESM/Vite、样式隔离转 `@scope`、CSP、legacy 兼容层；2026 有 @scope 与 `create-qiankun` 的复苏迹象但离 stable 尚远。选型定位上，它是**国内存量最大、面试必考**的框架，甜区是「存量 webpack + 要开箱」，硬伤是 Vite 之痛与样式隔离不完美——新项目 Vite 主力应先看 wujie/micro-app。想要一页表格速查全部 API、沙箱、样式、版本，见[参考](../reference)。
