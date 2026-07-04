---
layout: doc
outline: [2, 3]
---

# 数据通信

> 基于 micro-app 1.0（RC） · 核于 2026-07

## 速查

- 通信的**模式通论**（props 下行 / 事件上行 / 全局状态 / 去中心化总线）见[核心机制·通信](../../mfe-mechanisms/guide-line/communication)——本页只讲 micro-app 的**具体 API**
- micro-app 通信是**基于「数据绑定 + 发布订阅」的 CustomEvent 模型**，分三层：**父子定向**、**全局广播**、**关沙箱/UMD 的独立事件中心**
- **父 → 子（下行）**：<code v-pre>&lt;micro-app :data="obj"&gt;</code> 属性绑定，或命令式 `microApp.setData('app-name', {…}, cb)`；相同数据不重复触发时用 `forceSetData`
- **子收数据**：`window.microApp.getData()` 拿当前值；`window.microApp.addDataListener(fn, autoTrigger)` 订阅变化（`autoTrigger=true` 立即用当前值触发一次）
- **子 → 父（上行）**：`window.microApp.dispatch({…}, cb)` 派发数据给主应用；`forceDispatch` 强制触发
- **父收数据**：`microApp.getData('app-name')` / `microApp.addDataListener('app-name', fn, autoTrigger)`；也可在 <code v-pre>&lt;micro-app&gt;</code> 上监听 `datachange` 事件
- **全局数据**：`microApp.setGlobalData({…})` / `getGlobalData()` / `addGlobalDataListener(fn)`，子应用侧 `window.microApp.setGlobalData/getGlobalData/...`——**跨所有应用广播**
- **关沙箱/UMD 多实例**：用 `new EventCenterForMicroApp(appName)` 建独立事件中心（`window.eventCenterForAppxx`），因为关沙箱后全局隔离失效需手动隔离通信
- **清理**：`microApp.clearData('app-name')`（主）/ `window.microApp.clearData()`（子）/ `removeDataListener` / `clearDataListener`
- **与虚拟路由的关系**：数据通信管「传值」，虚拟路由（`microApp.router`）管「导航/路由状态」——主应用想让子应用跳页用 `router.push`，不用把路由塞进 `data`
- 数据是**对象**（`data` 只接受对象）；下行数据变化会触发子应用监听器，是父子解耦的主通道

## 一、边界：本页讲什么

主子应用通信的**四种模式**（属性/props 下行、自定义事件上行、全局共享状态、去中心化 EventBus）及其取舍，已在[核心机制·通信](../../mfe-mechanisms/guide-line/communication)讲过。micro-app 的通信 API 基本是这几种模式的**具体实现**：`data`/`setData` 是「下行」、`dispatch` 是「上行」、`GlobalData` 是「全局共享」、`EventCenterForMicroApp` 是「独立事件中心」。本页只列 API 与用法，不重复模式原理。

## 二、父 → 子：data 属性下行 + setData

**声明式**——在 <code v-pre>&lt;micro-app&gt;</code> 上绑定 `data` 属性，数据变化自动下发给子应用：

```vue
<!-- 主应用（Vue）：data 绑定一个对象，变化即下行 -->
<template>
  micro-app name="app1" url="http://localhost:3000/" :data="dataForChild" /
</template>

<script setup lang="ts">
import { ref } from "vue";
// data 只接受对象；变化会触发子应用的数据监听
const dataForChild = ref({ type: "init", userId: 1 });
</script>
```

**命令式**——用 `microApp.setData(name, data, callback)` 主动下发（不依赖模板绑定）：

```js
import microApp from "@micro-zoe/micro-app";

// 给名为 app1 的子应用发送数据；回调在子应用接收后触发
microApp.setData("app1", { type: "update", page: 2 }, () => {
  console.log("子应用已收到");
});

// 若新数据与上次相同、默认不触发监听，需要强制时用 forceSetData
microApp.forceSetData("app1", { type: "update", page: 2 });
```

## 三、子应用接收：getData + addDataListener

子应用通过注入的全局对象 `window.microApp` 收数据：

```js
// 子应用：一次性获取当前数据
const data = window.microApp.getData(); // 返回主应用下发的对象

// 子应用：订阅数据变化（autoTrigger=true 会立即用当前值触发一次）
function dataListener(newData) {
  console.log("收到主应用数据：", newData);
}
window.microApp.addDataListener(dataListener, true);

// 卸载/不再需要时解绑，防泄漏
window.microApp.removeDataListener(dataListener);
window.microApp.clearDataListener(); // 清空本应用所有监听
```

## 四、子 → 父：dispatch 上行

子应用用 `window.microApp.dispatch(data, callback)` 把数据**派发回主应用**：

```js
// 子应用：向主应用上报数据
window.microApp.dispatch({ type: "loaded", detail: { ok: true } }, () => {
  console.log("主应用已接收");
});

// 相同数据默认不重复触发，需要强制时：
window.microApp.forceDispatch({ type: "loaded", detail: { ok: true } });
```

主应用侧接收有两种方式：**监听 <code v-pre>&lt;micro-app&gt;</code> 的 `datachange` 事件**，或用 `microApp.addDataListener`：

```js
// 主应用方式一：在元素上监听 datachange（e.detail.data 为子应用派发的数据）
const el = document.querySelector("micro-app[name=app1]");
el.addEventListener("datachange", (e) => {
  console.log("子应用上报：", e.detail.data);
});

// 主应用方式二：命令式订阅指定子应用
import microApp from "@micro-zoe/micro-app";
microApp.addDataListener("app1", (data) => console.log("app1 上报：", data), true);
microApp.getData("app1"); // 主动读取 app1 当前数据
```

## 五、全局数据：跨所有应用广播

父子定向通信之外，micro-app 提供**全局数据**——一处写入、所有应用（主应用 + 全部子应用）都能读到与订阅，适合登录态、主题、语言这类全局共享：

```js
// 任意一端写入全局数据
import microApp from "@micro-zoe/micro-app";
microApp.setGlobalData({ theme: "dark", lang: "zh" });
microApp.forceSetGlobalData({ theme: "dark" }); // 相同值强制触发

// 主应用读取 / 订阅
microApp.getGlobalData();
microApp.addGlobalDataListener((data) => console.log("全局数据变了：", data), true);
microApp.clearGlobalData(); // 清空全局数据
```

```js
// 子应用侧等价 API（走注入的 window.microApp）
window.microApp.setGlobalData({ lang: "en" });
window.microApp.getGlobalData();
window.microApp.addGlobalDataListener((data) => {});
```

**定向 vs 全局** 的取舍和[通论](../../mfe-mechanisms/guide-line/communication)一致：定向 `data`/`dispatch` 耦合小、语义清；全局数据方便但**用多了变「隐形全局状态」**，容易埋耦合，建议只放真正全局的少量状态。

## 六、关沙箱 / UMD 多实例：EventCenterForMicroApp

当子应用**关闭了沙箱**（`disable-sandbox`），或以 **UMD 多实例**方式在同页跑多份时，micro-app 注入的全局 `window.microApp` 无法为每个实例做隔离——这时用**独立事件中心** `EventCenterForMicroApp` 手动为每个应用建一套通信通道：

```js
// 主应用：为关沙箱/多实例的子应用创建独立事件中心（每个 name 一套）
import { EventCenterForMicroApp } from "@micro-zoe/micro-app";
window.eventCenterForApp1 = new EventCenterForMicroApp("app1");
```

```js
// 子应用：改用这个独立事件中心通信（API 与 window.microApp 对齐）
window.eventCenterForApp1.getData();
window.eventCenterForApp1.dispatch({ type: "x" });
window.eventCenterForApp1.addDataListener((data) => {});
```

一句话：**开沙箱（默认）用 `window.microApp` 就够了；只有关沙箱/UMD 多实例这类特殊场景，才需要 `EventCenterForMicroApp` 手动隔离通信通道**。

## 七、与虚拟路由的关系

通信 API 管的是「**传值**」，micro-app 还有一套独立的**虚拟路由系统**管「**导航与路由状态**」，两者别混用：

- **要给子应用传数据** → 用 `data`/`setData`/`dispatch`/`GlobalData`（本页）。
- **要让子应用跳页/控制路由** → 用 `microApp.router.push({ name, path })` / `replace` / `go` / `back`，或 `beforeEach`/`afterEach` 守卫（详见官方[虚拟路由](https://jd-opensource.github.io/micro-app/docs.html#/zh-cn/router)）。

反例是「把目标路由塞进 `data` 让子应用自己 `router.push`」——能用但绕。micro-app 的设计是**路由归 `microApp.router`、数据归通信 API**：主应用直接 `microApp.router.push({ name: 'app1', path: '/page2' })` 驱动子应用导航，子应用路由变化也能被主应用的路由守卫感知。清晰分工能避免「数据流里混路由」的耦合。

## 小结

micro-app 的数据通信是 CustomEvent 之上的三层：**父子定向**（`data`/`setData` 下行、`dispatch` 上行，子应用用 `window.microApp.getData/addDataListener` 收发）、**全局广播**（`setGlobalData`/`getGlobalData`/`addGlobalDataListener`，跨所有应用）、**独立事件中心**（`EventCenterForMicroApp`，仅关沙箱/UMD 多实例才需）。清理用 `clearData`/`removeDataListener`，`forceXxx` 用于相同值强制触发。记住「**传值用通信 API、导航用 `microApp.router`**」的分工。通信讲完，最后收一收全局——下一页 [1.0 RC 与现状](./rc-status)：长期 RC 的时间线、京东生态背书、虚拟路由与 Vite 友好的选型定位，以及和 wujie 的对照。
