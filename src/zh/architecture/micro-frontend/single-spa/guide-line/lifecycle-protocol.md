---
layout: doc
outline: [2, 3]
---

# 生命周期协议

> 基于 single-spa v6 · 核于 2026-07

## 速查

- single-spa 与子应用之间**唯一的契约**是生命周期：子应用导出 **`bootstrap` / `mount` / `unmount`**（parcel 多一个可选 **`update`**），**每个都返回 Promise**
- **`bootstrap`**：应用**首次加载后只跑一次**的一次性初始化；**`mount`**：应用被激活时渲染进 DOM；**`unmount`**：应用停用时从 DOM 移除并清理副作用；**`update`**：仅 parcel，父应用推新 props 时不重挂更新
- 每个钩子可以是**单个函数**，也可以是**函数数组**（按序 `reduce` 成一条 Promise 链）——用来把「注册路由」「初始化状态」等拆成多步
- single-spa 用一台**状态机**追踪每个应用：`NOT_LOADED → LOADING_SOURCE_CODE → NOT_BOOTSTRAPPED → BOOTSTRAPPING → NOT_MOUNTED → MOUNTING → MOUNTED`，卸载走 `UNMOUNTING → NOT_MOUNTED`
- 两个「坏掉」的终点态：**`LOAD_ERROR`**（加载失败，**下次路由会重试**）、**`SKIP_BECAUSE_BROKEN`**（生命周期出错或超时死亡，**永久隔离、不再尝试**）
- parcel 专属中间态 **`UPDATING`**；重新加载路径上有 **`UNLOADING`**（`unloadApplication` 触发）把应用打回 `NOT_LOADED`
- **超时配置**：`setBootstrapMaxTime` / `setMountMaxTime` / `setUnmountMaxTime` / `setUnloadMaxTime`，参数 `(millis, dieOnTimeout, warningMillis)`——`dieOnTimeout: true` 超时即判 `SKIP_BECAUSE_BROKEN`
- **错误处理**：`addErrorHandler(fn)` 注册全局钩子，error 对象带 **`appOrParcelName`**；生命周期抛错/超时死亡 → 应用进 `SKIP_BECAUSE_BROKEN` 被永久跳过
- **`unloadApplication(name, { waitForUnmount })`**：默认（`false`）**先 unmount 再 unload**、把应用打回 `NOT_LOADED`，下次激活会**重新 bootstrap**——用于热更新/强制重置；`true` 则等它自然卸载
- 查询 API：`getAppStatus(name)`（取状态）、`getMountedApps()`（当前已挂）、`getAppNames()`（全部已注册）
- 心智锚点：**mount 里做的每件事，unmount 里都要有对应的清理**——事件监听、定时器、订阅，谁挂谁摘，否则内存泄漏

## 一、生命周期契约：四个钩子，都返回 Promise

single-spa **不关心你的子应用用什么框架**，它只认一件事：子应用导出一组**返回 Promise 的生命周期函数**。这组函数就是编排器和子应用之间的全部契约：

```js
// 子应用入口导出的生命周期契约（框架无关；实务中由适配器生成）
export function bootstrap(props) {
  // 首次加载后只跑一次的一次性初始化（建实例、读配置……）
  return Promise.resolve();
}
export function mount(props) {
  // 应用被激活：把自己渲染进 DOM。props 里带 name / customProps / singleSpa 等
  return Promise.resolve();
}
export function unmount(props) {
  // 应用被停用：从 DOM 移除，清理事件/定时器/订阅
  return Promise.resolve();
}
```

**返回 Promise** 是硬要求——single-spa 靠这个 Promise 知道「这一步做完了没」，从而串起整条挂载/卸载链。任何一个钩子的 Promise **reject 或超时不结算**，都会让应用被判定为「坏掉」。

每个钩子既可以是**单个函数**，也可以是**函数数组**：single-spa 会把数组里的函数按序 `reduce` 成一条 Promise 链依次执行。这在 `mount` 里很实用——把「注册全局路由」「初始化状态管理」「渲染根组件」拆成三个独立函数，可读性更好：

```js
// mount 可以是数组：按序执行、每个返回 Promise
export const mount = [
  (props) => registerRoutes(props), // 步骤 1
  (props) => initStore(props), // 步骤 2
  (props) => renderRoot(props), // 步骤 3
];
```

## 二、每个钩子该做什么

| 钩子 | 触发时机 | 该做的事 | 常见错误 |
| --- | --- | --- | --- |
| **`bootstrap`** | 首次 load 之后、首次 mount 之前，**只一次** | 一次性初始化：建单例、注入全局配置 | 把「每次挂载都要做的事」放进来（应放 mount） |
| **`mount`** | 应用被激活（activity function 变真） | 渲染进 DOM、挂事件/定时器/订阅 | 忘了记下要清理的副作用 |
| **`unmount`** | 应用被停用（activity function 变假） | 从 DOM 卸载、**逐一清理** mount 里挂的东西 | 只 remove DOM，不摘监听器 → 泄漏 |
| **`update`**（仅 parcel） | 父应用调 `parcel.update(newProps)` | 不重挂地把新 props 应用上去 | 用在 application 上（application 无此钩子） |

一条铁律：**`mount` 与 `unmount` 必须镜像对称**。mount 里 `addEventListener`/`setInterval`/`store.subscribe` 的每一笔，unmount 里都要有对应的 `removeEventListener`/`clearInterval`/`unsubscribe`。single-spa 只负责调用你的 `unmount`，**它不知道你在 mount 里偷偷挂了什么**——清理是你的责任。（沙箱能兜住一部分全局副作用，但 single-spa 本身不提供沙箱，见[现状与定位](./status-positioning)。）

## 三、状态机：一个应用的一生

single-spa 内部为**每个注册的应用**维护一台状态机。理解它，线上排错时看一眼 `getAppStatus(name)` 就知道卡在哪：

| 状态 | 含义 | 下一步 |
| --- | --- | --- |
| `NOT_LOADED` | 已注册，源码还没加载 | 命中路由 → 开始加载 |
| `LOADING_SOURCE_CODE` | 正在下载/执行源码（load 函数进行中） | 成功 → `NOT_BOOTSTRAPPED`；失败 → `LOAD_ERROR` |
| `NOT_BOOTSTRAPPED` | 源码就绪，还没 bootstrap | 进入挂载流程 → `BOOTSTRAPPING` |
| `BOOTSTRAPPING` | `bootstrap` 执行中 | 完成 → `NOT_MOUNTED` |
| `NOT_MOUNTED` | 已 bootstrap，未挂载（或刚卸载） | 激活 → `MOUNTING` |
| `MOUNTING` | `mount` 执行中 | 完成 → `MOUNTED` |
| `MOUNTED` | **正活在 DOM 上** | 停用 → `UNMOUNTING` |
| `UPDATING` | parcel 的 `update` 执行中 | 完成 → `MOUNTED` |
| `UNMOUNTING` | `unmount` 执行中 | 完成 → `NOT_MOUNTED` |
| `UNLOADING` | `unloadApplication` 触发的卸载中 | 完成 → `NOT_LOADED`（可重新 bootstrap） |
| `LOAD_ERROR` | 加载失败 | **下次路由变化会重试** |
| `SKIP_BECAUSE_BROKEN` | 生命周期抛错/超时死亡 | **永久跳过、不再尝试** |

主干路径串起来是一条时间线：

```text
注册     加载              引导            挂载          （活着）        卸载
NOT_LOADED → LOADING_SOURCE_CODE → NOT_BOOTSTRAPPED → BOOTSTRAPPING
          → NOT_MOUNTED → MOUNTING → MOUNTED
          ← NOT_MOUNTED ← UNMOUNTING ←（停用时反向）
```

两个「坏掉」的分支要分清：**`LOAD_ERROR` 是可恢复的**——网络抖动导致加载失败，下次路由切换 single-spa 会再试一次；**`SKIP_BECAUSE_BROKEN` 是不可恢复的**——某个生命周期抛了错或超时死亡，single-spa 判定这个应用「坏了」，此后**永久把它隔离**、不再尝试挂载，避免一个坏应用反复拖垮整页。

## 四、超时配置：别让慢应用拖死整页

如果某个应用的 `mount` 迟迟不结算（Promise 既不 resolve 也不 reject），会卡住整条 reroute。single-spa 提供四个全局超时设置，分别对应四个阶段：

```js
import {
  setBootstrapMaxTime,
  setMountMaxTime,
  setUnmountMaxTime,
  setUnloadMaxTime,
} from "single-spa";

// 参数：(最大毫秒数, dieOnTimeout 超时是否判死, 打印 warning 的毫秒阈值)
setBootstrapMaxTime(4000, false, 1000); // 4s 内没 bootstrap 完只告警，不判死
setMountMaxTime(3000, true, 1000); // 3s 内没 mount 完 → 判 SKIP_BECAUSE_BROKEN
setUnmountMaxTime(3000, true, 1000);
setUnloadMaxTime(3000, false, 1000);
```

关键是第二个参数 **`dieOnTimeout`**：为 `false` 时，超时只在控制台打警告、但仍**等它继续跑**；为 `true` 时，超时即把应用打入 **`SKIP_BECAUSE_BROKEN`**——用「牺牲一个慢应用」保住整页可用。`warningMillis` 则是提前告警的软阈值，帮你在应用「还没死但已经很慢」时就发现问题。

## 五、错误处理与永久隔离

生命周期函数抛错、或 activity function 抛错时，single-spa 会调用你注册的**全局错误处理器**。error 对象上挂着 **`appOrParcelName`**，告诉你是哪个应用/包裹出的事：

```js
import { addErrorHandler, removeErrorHandler } from "single-spa";

const handler = (err) => {
  // err.appOrParcelName：出错的应用名；err.message / err.stack 照常
  console.error(`[single-spa] ${err.appOrParcelName} 生命周期出错`, err);
  reportToSentry(err); // 上报错误追踪服务（一个 utility module）
};

addErrorHandler(handler);
// 需要时可移除（返回布尔表示是否移除成功）
// removeErrorHandler(handler);
```

生命周期一旦抛错，出错的应用进入 **`SKIP_BECAUSE_BROKEN`** 被永久隔离，其余应用不受影响——这是 single-spa 的「故障隔离」策略：**一个子应用崩了，不该让整页跟着崩**。所以错误处理器里通常做两件事：上报，以及（可选）给用户一个「该模块暂不可用」的降级提示。

## 六、unload：把应用打回 NOT_LOADED

有时你需要**强制让一个应用从头再来**——比如它的代码热更新了、或它内部状态脏了要重置。`unloadApplication` 就是干这个的：它把应用打回 `NOT_LOADED`，**下次激活时会重新 load + bootstrap**，而不是复用旧实例：

```js
import { unloadApplication } from "single-spa";

// 默认 waitForUnmount: false —— 先 unmount（如果正挂着），再 unload 打回 NOT_LOADED
await unloadApplication("@org/orders");

// waitForUnmount: true —— 不主动卸，等它自然被路由卸载后再 unload
await unloadApplication("@org/orders", { waitForUnmount: true });
```

两种模式的区别在**谁来触发卸载**：默认模式是「先卸载再重置」（unmount-then-unload），适合「立刻让它重来」；`waitForUnmount` 模式是「等它自己走了再重置」，适合「不打断用户当前操作」。无论哪种，最终态都是 `NOT_LOADED`——下次 activity function 变真时，整条 load → bootstrap → mount 会重新走一遍。相邻的 `unregisterApplication` 更彻底：卸载 + unload + **注销注册**，应用从此不再存在。

## 小结

生命周期协议是 single-spa 的心脏：四个返回 Promise 的钩子（bootstrap 一次性、mount 渲染、unmount 清理、update 仅 parcel）构成子应用与编排器的唯一契约；一台 11 态状态机追踪每个应用从 `NOT_LOADED` 到 `MOUNTED` 再卸载的全过程，`LOAD_ERROR` 可重试、`SKIP_BECAUSE_BROKEN` 永久隔离；超时配置与全局错误处理器一起实现「一个应用坏掉不拖垮整页」的故障隔离。钩子写对了，下一步是搞清谁来触发它们——activity function 与 root config 怎么决定「谁在什么路由下活」：见 [root config 与注册](./root-config)。
