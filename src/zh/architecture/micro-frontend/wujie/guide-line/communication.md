---
layout: doc
outline: [2, 3]
---

# 通信

> 基于 wujie v2（2026-06 复活） · 核于 2026-07

## 速查

- **通信通论**（props / 全局状态 / 事件总线 / CustomEvent 四类模式的取舍）见[核心机制·应用间通信](../../mfe-mechanisms/guide-line/communication)——本页只讲 **wujie 的三种通信落地**
- wujie 提供**三种通信方式**：**`props` 注入** / **`window` 直通**（同域）/ **去中心化 EventBus**
- **`props`**：主应用 `startApp({ props })` 或 `WujieVue` 组件的 `:props` 注入数据与方法，子应用用 `window.$wujie.props` 取——**父传子的首选、最简单**
- **`window` 直通**：因为 iframe 与主应用**同域**，可直接互访——主访子 `iframe.contentWindow.xxx`、子访主 `window.parent.xxx`
- **EventBus**：wujie 内置**去中心化事件总线** `bus`，API 仿 Vue（链式），主/子/子子应用**任意方向广播**
- 主应用引 `bus`：`import { bus } from "wujie"`（或从 `WujieVue`/`WujieReact` 上解构）
- 子应用用 `bus`：`window.$wujie.bus`（或 `$wujie.bus`）
- 核心方法：`bus.$emit(event, ...args)` 发、`bus.$on(event, fn)` 收、`bus.$off(event, fn)` 卸、`$once` 一次性、`$onAll` 监听所有、`$clear` 清空
- **WujieVue 语法糖**：子应用 `bus.$emit("x")` 发的事件，主应用组件上可直接 `@x="handler"` 监听
- **务必手动 `$off`**：子应用销毁/重渲染时 wujie 会自动清订阅，但仍**建议在卸载钩子里手动 `$off`**，防重复订阅内存泄漏
- 一句话：**简单父传子用 `props`，同域直连用 `window`，多向解耦广播用 `bus`**

## 一、三种通信方式总览

wujie 的三种通信各有其位，先看全景再逐个展开：

| 方式 | 方向 | 机制 | 适用 |
| --- | --- | --- | --- |
| **`props`** | 父 → 子 | 主应用注入、子应用 `$wujie.props` 读 | 传初始数据 / 回调方法，最简单 |
| **`window` 直通** | 双向 | 同域 iframe，`window.parent` / `contentWindow` 直接访问 | 同域下直接读写对方全局，轻量 |
| **EventBus `bus`** | 任意 | 去中心化事件总线，发布订阅 | 多应用、多向、解耦广播 |

这三种落地都建立在一个物理前提上：**wujie 的 iframe 与主应用同域**（[iframe 沙箱](./iframe-sandbox)），所以 `window.parent`、`contentWindow`、共享 `bus` 实例才可能直接工作——跨域 iframe 会被同源策略拦死。

## 二、props：父传子首选

主应用把数据和方法通过 `props` 注入子应用，子应用从 `window.$wujie.props` 取——这是最简单、最常用的父传子通道：

```js
// 主应用（命令式）：注入数据与方法
startApp({
  name: "app-vue",
  url: "//localhost:7100/",
  el: "#sub-container",
  props: {
    userInfo: { name: "Ada", role: "admin" }, // 传数据
    onLogout: () => store.logout(), // 传方法（子应用可回调主应用）
  },
});
```

组件式写法（`WujieVue`）通过 `:props` 绑定同样一份数据：

```vue
<template>
  WujieVue name="app-vue" url="//localhost:7100/" :props="subProps" /
</template>
```

子应用侧读取父级注入的 `props`：

```js
// 子应用：从 window.$wujie.props 读父应用注入的数据与方法
const { userInfo, onLogout } = window.$wujie?.props ?? {};
console.log(userInfo.name); // Ada
onLogout?.(); // 回调主应用的方法
```

> `props` 是**一次性注入**（挂载时传入）；要持续同步变化的数据，用下面的 `bus` 事件总线或响应式对象。

## 三、window 直通：同域特权

wujie 的子应用 JS 跑在**与主应用同域**的 iframe 里，所以主子应用可以直接互访对方的 `window`——这是 iframe 沙箱路线独有的「特权」：

```js
// 主应用访问子应用全局（子应用 iframe 的 contentWindow）
const subWin = document.querySelector("iframe").contentWindow;
subWin.someGlobal = 123;

// 子应用访问主应用全局
window.parent.mainAppMethod?.();
```

> ⚠️ `window` 直通**耦合最紧**：主子应用直接依赖对方的全局变量名，改一方就可能断一方。仅在同域、临时、简单的场景用；复杂通信优先 `bus`。跨域 iframe（降级或跨源）下此路不通。

## 四、EventBus：去中心化广播

wujie 内置一个**去中心化事件总线** `bus`，API 仿 Vue 事件（链式调用），任何应用（主、子、子子）都能发和收，是**多向、解耦**通信的首选：

```js
// 主应用：import { bus } from "wujie"
import { bus } from "wujie";

// 监听子应用广播
bus.$on("sub-event", (arg1, arg2) => {
  console.log("收到子应用消息", arg1, arg2);
});

// 向子应用广播
bus.$emit("main-event", { theme: "dark" });

// 卸载时移除监听，防重复订阅
bus.$off("sub-event", handler);
```

```js
// 子应用：用 window.$wujie.bus，同一套 API
window.$wujie?.bus.$on("main-event", (payload) => {
  console.log("收到主应用消息", payload.theme);
});
window.$wujie?.bus.$emit("sub-event", "hello", 42);
```

`bus` 全部方法：

| 方法 | 签名 | 作用 |
| --- | --- | --- |
| `$emit` | `(event, ...args) => bus` | 广播事件（链式） |
| `$on` | `(event, fn) => bus` | 监听事件 |
| `$off` | `(event, fn) => bus` | 移除某监听 |
| `$once` | `(event, fn) => void` | 一次性监听，触发后自动移除 |
| `$onAll` | `(fn) => bus` | 监听**所有**事件（回调首参是事件名） |
| `$offAll` | `(fn) => bus` | 移除 `$onAll` 监听 |
| `$clear` | `()` | 清空所有订阅 |

**WujieVue 的语法糖**：在 Vue 里，子应用用 `bus.$emit("routeChange", ...)` 发出的事件，主应用可以直接在组件上用 `@routeChange="handler"` 监听——省去手动 `bus.$on`：

```vue
<template>
  WujieVue name="app-vue" :url="url" @routeChange="onRouteChange" /
</template>
```

## 五、防泄漏：手动 $off

`bus` 是全局单例、跨子应用生命周期存在。子应用**销毁或重渲染时 wujie 会自动清理它的订阅**（非保活状态），但保活模式下子应用长期存活、反复 `$on` 容易累积**重复订阅**。稳妥做法是**在卸载钩子里手动 `$off`**：

```js
// 子应用卸载时：手动移除自己注册的监听，防重复订阅堆积
window.__WUJIE_UNMOUNT = () => {
  window.$wujie.bus.$off("main-event", onMainEvent);
  instance.unmount();
};
```

保活场景尤其要注意——保活子应用不销毁，若每次 `activated` 都 `$on` 而不 `$off`，监听会越堆越多。

## 六、选型：三种怎么挑

| 场景 | 选 | 理由 |
| --- | --- | --- |
| 主应用下发初始数据 / 用户信息 / 回调方法 | **`props`** | 声明式、最简单，天然父传子 |
| 同域下临时直读对方一个全局 | **`window` 直通** | 无需协议，但耦合紧、慎用 |
| 多应用、多向、要解耦的消息 | **EventBus `bus`** | 发布订阅、去中心化、扩展性最好 |

四类通信模式（props / 全局状态 / 事件总线 / CustomEvent）在**任何微前端框架**下的通用取舍——尤其「为什么大型应用优先事件总线而非 window 直连」——见[核心机制·应用间通信](../../mfe-mechanisms/guide-line/communication)，本页只讲 wujie 的三个具体 API。

## 小结

wujie 的三种通信各就各位：**`props`**（主应用注入、子应用 `$wujie.props` 读，父传子首选，能传数据也能传回调方法）、**`window` 直通**（同域 iframe 特权，`window.parent` / `contentWindow` 直接互访，轻但耦合紧）、**EventBus `bus`**（去中心化发布订阅，`$emit`/`$on`/`$off`/`$once`/`$onAll`，任意方向广播，WujieVue 里可 `@event` 直接监听）。三者都建立在「iframe 同域」这个物理前提上。保活场景务必在卸载钩子手动 `$off` 防重复订阅。通信讲完，wujie 的核心机制就齐了——最后看看它 2026-06 的 v2.0 复活、选型定位与局限：下一页 [v2.0 与现状](./v2-status)。
