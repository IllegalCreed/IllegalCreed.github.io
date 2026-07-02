---
layout: doc
outline: [2, 3]
---

# 核心 API

> 基于 qiankun 2.10（3.0 rc 追踪） · 核于 2026-07

## 速查

- 主应用两条主线：**路由型** `registerMicroApps(apps, lifeCycles) + start(opts)`（activeRule 命中自动加载）、**手动型** `loadMicroApp(app, config)`（自己控制挂载时机）
- `registerMicroApps` 的每个 app 四个必填：**`name`**（唯一名）、**`entry`**（HTML 地址或 `{ scripts, styles }`）、**`container`**（挂载 DOM）、**`activeRule`**（前缀串 / `location => boolean` / 数组）；可选 `loader`（loading 回调）、`props`（透传数据）
- 全局生命周期 `lifeCycles`：**`beforeLoad`/`beforeMount`/`afterMount`/`beforeUnmount`/`afterUnmount`**，每个可为单函数或函数数组，对**所有**子应用生效
- `start(opts)` 常用项：**`prefetch`**（默认 `true`）、**`sandbox`**（默认 `true`）、**`singular`**（默认 `true`）、`fetch`（自定义、跨域带 cookie）、`getPublicPath`/`getTemplate`/`excludeAssetFilter`
- **`singular` 是理解单/多实例的钥匙**：路由型默认 `singular: true` → **同一时刻只挂一个子应用**（挂新的前先卸旧的）；设 `false` 才允许多个子应用**同屏并存**
- **`loadMicroApp` 不受 `singular` 约束**——它天生支持**多实例并存**（同一子应用可 `loadMicroApp` 多次得到多个实例），返回带 `mount/unmount/update` 的 `MicroApp` 句柄，生命周期你自己管
- `loadMicroApp` 返回值含 `getStatus()` 与 `loadPromise`/`bootstrapPromise`/`mountPromise`/`unmountPromise`——手动型要自己 `await` 这些 Promise、自己 `unmount`（忘了就泄漏）
- **`setDefaultMountApp(appLink)`**：主应用启动后，浏览器首次打开默认跳转/挂载哪个子应用（如根路径 `/` 默认进 `/home`）
- **`runAfterFirstMounted(effect)`**：第一个子应用挂载完成后执行一次——常用来移除全局 loading、上报首屏时间
- **`initGlobalState(state)`** 建全局通信状态，返回 `onGlobalStateChange`/`setGlobalState`/`offGlobalStateChange`（只支持一级属性变更）——通信详见[演进与现状](./evolution-status)
- `addGlobalUncaughtErrorHandler` / `removeGlobalUncaughtErrorHandler`：注册/移除全局未捕获错误处理器（子应用加载失败、生命周期抛错的兜底）

## 一、registerMicroApps：路由型注册

`registerMicroApps(apps, lifeCycles?)` 是最常用的入口——登记一份子应用清单，之后由 qiankun 按路由自动加载。它底层就是 single-spa 的 `registerApplication`，只是把「加载函数」换成了「HTML entry + 沙箱执行」。

```js
import { registerMicroApps } from "qiankun";

registerMicroApps(
  [
    {
      name: "react-app", // 必填：子应用唯一名
      entry: "//localhost:7100", // 必填：HTML entry 或 { scripts, styles, html }
      container: "#subapp", // 必填：挂载容器（选择器或 HTMLElement）
      activeRule: "/react", // 必填：激活规则
      loader: (loading) => renderLoading(loading), // 可选：loading 状态回调
      props: { authToken: "xxx" }, // 可选：透传给子应用的数据
    },
  ],
  {
    // 第二参：全局生命周期钩子，对所有子应用生效（可选）
    beforeLoad: (app) => console.log("before load", app.name),
    beforeMount: (app) => console.log("before mount", app.name),
    afterMount: (app) => console.log("after mount", app.name),
    beforeUnmount: (app) => console.log("before unmount", app.name),
    afterUnmount: (app) => console.log("after unmount", app.name),
  }
);
```

**app 字段**：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `name` | string | 子应用唯一名，qiankun 据此取生命周期、命名沙箱 |
| `entry` | string / 对象 | HTML 地址 `'//host'`，或 `{ scripts, styles, html }` 显式清单 |
| `container` | string / HTMLElement | 子应用渲染到的 DOM 节点 |
| `activeRule` | string / 函数 / 数组 | 前缀 `/react`、或 `(location) => boolean`、或数组（命中其一即激活） |
| `loader` | 函数 | 可选，`(loading: boolean) => void`，渲染加载态 |
| `props` | object | 可选，挂载时并进子应用 `props` |

`activeRule` 写成函数时是完全自定义的判定（如按 `location.hash` 激活，配合 hash 路由）：

```js
// activeRule 用函数：按 hash 前缀激活（hash 路由场景）
const genActiveRule = (routerPrefix) => (location) =>
  location.hash.startsWith(routerPrefix);
// activeRule: genActiveRule("#/react")
```

**全局 `lifeCycles`** 与 app 内的钩子不同：它对**所有**子应用统一生效，适合做统一的埋点、loading、鉴权拦截；每个钩子可传函数数组按序执行。

## 二、start：全局启动配置

`start(opts?)` 拉闸——在此之前 `registerMicroApps` 只是登记，不会真正加载挂载。它的配置项决定了 qiankun 的全局行为：

```js
import { start } from "qiankun";

start({
  prefetch: true, // 预取策略：见下表（默认 true）
  sandbox: true, // 沙箱：true / { strictStyleIsolation } / { experimentalStyleIsolation }
  singular: true, // 单实例：同一时刻只挂一个子应用（默认 true）
  fetch: window.fetch, // 自定义 fetch（跨域带 cookie 时改这里）
  // getPublicPath、getTemplate、excludeAssetFilter 为高级项
});
```

| 配置项 | 类型 / 默认 | 说明 |
| --- | --- | --- |
| `prefetch` | `boolean` / `'all'` / `string[]` / 函数，默认 `true` | 预取子应用静态资源的策略（四形态详见[演进与现状](./evolution-status)） |
| `sandbox` | `boolean` / 对象，默认 `true` | `true` 开 JS 沙箱 + 默认样式隔离；`{ strictStyleIsolation }` Shadow DOM；`{ experimentalStyleIsolation }` 属性改写（见[样式隔离](./style-isolation)） |
| `singular` | `boolean` / 函数，默认 `true` | 是否单实例（见第四节）；函数形态 `(app) => Promise<boolean>` 按应用动态决定 |
| `fetch` | 函数 | 自定义 HTTP，覆盖默认 `window.fetch`——跨域带 cookie 的 entry 靠它加 `credentials: 'include'` |
| `getPublicPath` | 函数 | 自定义子应用 publicPath 推断 |
| `getTemplate` | 函数 | 处理/改写子应用 HTML 模板 |
| `excludeAssetFilter` | 函数 | 指定哪些资源不被沙箱劫持（放行第三方 JSONP 等） |

## 三、loadMicroApp：手动加载（多实例）

`registerMicroApps` 是「声明式、按路由」，`loadMicroApp(app, configuration?)` 是「命令式、你说了算」——不绑路由，什么时候加载、加载到哪、什么时候卸载全由你调 API：

```js
import { loadMicroApp } from "qiankun";

// 手动加载一个子应用，拿到实例句柄
const microApp = loadMicroApp({
  name: "chart-widget",
  entry: "//localhost:7200",
  container: "#widget-a",
  props: { data: [1, 2, 3] },
});

await microApp.mountPromise; // 可 await 各阶段 Promise
microApp.update({ data: [4, 5, 6] }); // 推新 props（子应用需导出 update 生命周期）
microApp.unmount(); // 用完必须手动卸载，否则泄漏
```

返回的 `MicroApp` 句柄：

| 成员 | 说明 |
| --- | --- |
| `mount()` / `unmount()` | 手动挂载 / 卸载 |
| `update(customProps)` | 推送新 props（子应用要导出 `update` 生命周期才生效） |
| `getStatus()` | 当前状态（`NOT_MOUNTED`/`MOUNTED`…，复用 single-spa 状态机） |
| `loadPromise` / `bootstrapPromise` / `mountPromise` / `unmountPromise` | 各阶段完成的 Promise，供 `await` 编排 |

`loadMicroApp` 的第二参 `configuration` 与 `start` 的部分选项对齐（`sandbox`、`singular`、`fetch`、`getPublicPath` 等），作用于这一次加载。

## 四、singular：单实例 vs 多实例

这是 qiankun 最容易混的语义，务必分清两条线：

- **路由型（`registerMicroApps` + `start`）默认 `singular: true`**——**同一时刻只挂载一个子应用**：路由切到新子应用时，qiankun 会**先把当前子应用 `unmount`、再挂新的**。这符合「一个页面主区域同时只显示一个子应用」的常见场景，也让沙箱走单实例的 `legacyProxySandbox`。
- **要多个子应用同屏并存**（如仪表盘同时嵌好几个微应用），得显式 `start({ singular: false })`——此时走多实例 `proxySandbox`，每个子应用一个独立 `fakeWindow`。
- **`loadMicroApp` 天生多实例**——它不参与 `singular` 的「切换即互斥」逻辑：你可以对**同一个**子应用 `loadMicroApp` 多次，得到多个独立实例并排渲染。手动型的代价是**生命周期自管**：qiankun 不会替你在路由离开时卸载，忘了 `unmount` 就内存泄漏。

```js
// 多实例：同一子应用加载两次，两个独立实例并存
const appA = loadMicroApp({ name: "chart", entry: "//host", container: "#a" });
const appB = loadMicroApp({ name: "chart", entry: "//host", container: "#b" });
// appA、appB 各自一个沙箱，互不干扰；用完各自 unmount
```

沙箱如何随 `singular` 自动切换（`snapshotSandbox`/`legacyProxySandbox`/`proxySandbox`），见[沙箱实现](./sandbox-impl)。

## 五、辅助 API：默认应用、首挂钩子、错误兜底

- **`setDefaultMountApp(appLink)`**：主应用启动、浏览器首次打开时，默认「跳」到哪个子应用的路由。适合做「根路径重定向到首页子应用」：

```js
import { setDefaultMountApp } from "qiankun";
setDefaultMountApp("/home"); // 首次进站默认挂载 /home 对应的子应用
```

- **`runAfterFirstMounted(effect)`**：**第一个**子应用挂载完成后执行一次回调——最常见用途是移除全局骨架屏 loading、上报首屏时间：

```js
import { runAfterFirstMounted } from "qiankun";
runAfterFirstMounted(() => hideGlobalLoading()); // 首个子应用挂好后收起 loading
```

- **`addGlobalUncaughtErrorHandler(handler)` / `removeGlobalUncaughtErrorHandler(handler)`**：注册/移除全局未捕获错误处理器，兜底子应用加载失败（entry 404/CORS）、生命周期抛错等：

```js
import { addGlobalUncaughtErrorHandler } from "qiankun";
addGlobalUncaughtErrorHandler((event) => {
  // 子应用加载/运行出错的统一兜底：上报、降级、提示
  console.error("qiankun error", event);
});
```

- **`initGlobalState(state)`** 与 **`prefetchApps(apps)`** 分别负责通信与手动预取，放在[演进与现状](./evolution-status)细讲。

## 小结

qiankun 的核心 API 只有薄薄一层，但语义分岔要吃准：**路由型** `registerMicroApps + start` 声明式、按 `activeRule` 自动加载、默认 `singular: true` 单实例（切换即互斥）；**手动型** `loadMicroApp` 命令式、返回句柄、天生多实例、生命周期自管。`start` 的三个开关 `prefetch`/`sandbox`/`singular` 决定全局行为，全局 `lifeCycles` 做统一拦截，`setDefaultMountApp`/`runAfterFirstMounted` 处理启动与首挂时机。这些 API 背后真正扎手的是「沙箱怎么随 `singular` 切换、拦得住什么」——下一页：[沙箱实现](./sandbox-impl)。
