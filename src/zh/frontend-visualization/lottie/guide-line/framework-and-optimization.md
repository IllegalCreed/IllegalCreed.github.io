---
layout: doc
outline: [2, 3]
---

# 框架集成与性能优化

> 基于 lottie-web 5.13 / dotLottie · 核于 2026-07

## 速查

- **lottie-react（Gamote）**：组件式 `<Lottie animationData loop autoplay onComplete lottieRef interactivity>`；hook 式 `useLottie(options, style)` 返回 `{ View, play, pause, ... }`；方法名与 lottie-web `AnimationItem` 完全对应。
- **`lottieRef`**：React 组件拿到底层动画实例（`play`/`pause` 等方法）的标准方式。
- **三个相似命名的 React 包需分清**：`lottie-react`（Gamote）、`react-lottie-player`（mifi，无 scope）、`@lottiefiles/react-lottie-player`（指向 `LottieFiles/lottie-react` 仓库，与 Gamote 的 `lottie-react` 同名异库）——选型/读源码前务必确认具体是哪一个。
- **react-lottie-player（mifi）**：声明式 props，`play`（布尔控制播放而非调方法）、`loop`（布尔或数字）、`speed`、`direction`（`1`/`-1`）、`renderer`（`svg`/`canvas`/`html`）；内部**自动深克隆** `animationData`，规避 repeater 内存泄漏坑。
- **vue3-lottie（社区）**：`<Vue3Lottie :animationData :height :width />`，包装 lottie-web，`lottie-web` 是其 peer 依赖会自动装上；全局注册 `app.use(Vue3Lottie)` 或按需局部引入。
- **dotlottie-vue（官方）**：`<DotLottieVue :src :loop :autoplay />`，通过 `ref.value?.getDotLottieInstance()` 拿到底层 `DotLottie` 实例做命令式控制（状态机、play/pause 等）。
- **性能第一杠杆是渲染器选型**：图层多、不需要 CSS 联动时用 canvas；dotLottie 侧可进一步切 WebGL2/WebGPU 子路径导入换硬件加速。
- **`useFrameInterpolation`（dotLottie）/`setSubframe`（lottie-web）**：同一概念的不同命名——是否每帧都做子帧插值平滑，关闭可减少计算换性能。
- **`freezeOnOffscreen`**（dotLottie `renderConfig`，默认 `true`）：canvas 滚出可视区自动暂停渲染，配合 IntersectionObserver 思路做懒加载/懒播放。
- **`lottie.freeze()`/`unfreeze()`**：一次性挂起页面上所有 lottie-web 实例（切后台标签页等场景）。
- **体积优化**：格式层面选 `.lottie`（压缩 + 多动画共享资源）；LottieFiles Creator 工具可在导出前清理隐藏图层、精简路径点；lottie-web 有 light 构建去掉 Expressions 插件。
- **Worker 化**：`DotLottieWorker` 把渲染彻底移出主线程，避免复杂动画卡主线程交互。
- **ThorVG 性能宣传需谨慎对待**：官方口径宣称的具体倍数（"2-3x"、"70% 内存降低"等）来自 LottieFiles/合作方案例，**非独立第三方基准**，选型时仅供方向参考，不建议直接引用作为性能承诺。
- **故障排查四类**：不显示/加载失败（查 `src`/CORS/`loadError` 事件）、不播放（确认加载完成/`autoplay`/`loop`/segment 或 marker 名称是否存在）、内存泄漏（核心库必须 `destroy()`）、性能问题（切 `useFrameInterpolation`/`freezeOnOffscreen`、简化动画二分排查）。

## 一、React 集成：lottie-react（Gamote）

组件式用法：

```jsx
import Lottie from "lottie-react";
import animationData from "./anim.json";
import { useRef } from "react";

function MyAnimation() {
  const lottieRef = useRef();

  return (
    <Lottie
      lottieRef={lottieRef}
      animationData={animationData}
      loop
      autoplay
      onComplete={() => console.log("播放完成")}
      interactivity={{ mode: "scroll", actions: [{ visibility: [0, 1], type: "seek", frames: [0, 100] }] }} // 内置滚动/光标交互
    />
  );
}

// 通过 ref 拿到与 lottie-web AnimationItem 一致的实例方法
function pauseIt(lottieRef) {
  lottieRef.current.pause();
}
```

Hook 式用法（本质是薄封装，方法名与 lottie-web `AnimationItem` 完全对应）：

```jsx
import { useLottie } from "lottie-react";
import animationData from "./anim.json";

function MyAnimation() {
  const { View, play, pause, setSpeed, goToAndStop, destroy } = useLottie(
    { animationData, loop: true, autoplay: true },
    { width: 300, height: 300 } // style
  );

  return View;
}
```

`lottieRef`（组件式）与 `useLottie` 返回的方法集（hook 式）是拿到底层动画实例的两种标准方式，选哪种取决于团队更偏好声明式 props 还是直接持有实例引用。

## 二、React 其他封装：react-lottie-player 与命名易混提醒

```jsx
import Lottie from "react-lottie-player"; // 注意：这是 mifi 的包，无 npm scope

<Lottie
  play // 布尔控制播放（而非调用方法），与 lottie-react 的写法不同
  loop
  speed={1}
  direction={1} // 1 = 正向，-1 = 反向
  renderer="svg" // 'svg' | 'canvas' | 'html'
  animationData={animationData} // 或 path，二选一
/>;
```

`react-lottie-player`（mifi）内部**自动深克隆** `animationData`，规避了原生 lottie-web 里"含 repeater 的动画复用同一份 JSON 会互相污染"的坑（详见 [入门](../getting-started) 与 [播放控制与事件](./playback-and-events)）。

**注意**：`lottie-react`（Gamote）、`react-lottie-player`（mifi）、`@lottiefiles/react-lottie-player`（指向 `LottieFiles/lottie-react` 仓库，与 Gamote 的 `lottie-react` 同名异库）是**三个互相独立**但命名高度相似的 React 封装包，API 形状不同（组件 props、是否有 hook、是否声明式 `play` 布尔）。选型或读源码前，务必先确认 `package.json` 里到底装的是哪一个，照着错误的包文档抄代码是常见坑。

## 三、Vue 集成：vue3-lottie 与 dotlottie-vue

**vue3-lottie（社区维护，包装 lottie-web）**：

```vue
<template>
  <Vue3Lottie :animationData="AstronautJSON" :height="200" :width="200" />
</template>
```

`lottie-web` 是 `vue3-lottie` 的 peer 依赖，安装时会自动装上；可以全局注册 `app.use(Vue3Lottie)`，也可以按需局部引入单个组件。

**dotlottie-vue（LottieFiles 官方，对接 dotLottie 生态）**：

```vue
<template>
  <DotLottieVue :src="'https://lottie.host/xxx.lottie'" :loop="true" :autoplay="true" ref="playerRef" />
</template>

<script setup>
import { ref } from "vue";
import { DotLottieVue } from "@lottiefiles/dotlottie-vue";

const playerRef = ref();

// 通过 getDotLottieInstance() 拿到底层 DotLottie 实例做命令式控制（状态机、play/pause 等）
function pauseIt() {
  playerRef.value?.getDotLottieInstance()?.pause();
}
</script>
```

本仓库前端技术栈是 Vue 3：只需要经典 lottie-web 播放能力时选 `vue3-lottie`；需要 dotLottie 的多动画/主题/状态机能力时选官方 `dotlottie-vue`，二者服务于新旧两代不同的核心库，不要混用组件属性。

## 四、性能优化全景

- **渲染器选型是最大的性能杠杆**：图层/形状数量大、不需要 CSS 联动时用 canvas；dotLottie 侧可进一步切 WebGL2/WebGPU 子路径导入换硬件加速（见 [dotLottie 与播放器](./dotlottie-and-players)）。
- **关闭子帧插值**：`useFrameInterpolation: false`（dotLottie）/ `setSubframe(false)`（lottie-web）放弃逐 rAF 平滑插值、严格贴 AE 原始帧率，减少计算。
- **离屏自动暂停**：`renderConfig.freezeOnOffscreen`（dotLottie，默认 `true`）canvas 滚出可视区自动暂停渲染，配合 IntersectionObserver 思路做懒加载/懒播放。
- **全局挂起**：`lottie.freeze()`/`unfreeze()` 一次性挂起页面上所有 lottie-web 实例（切后台标签页等场景）。
- **体积优化**：格式层面选 `.lottie`（压缩 + 多动画共享资源）；LottieFiles Creator 工具可在导出前清理隐藏图层、精简路径点；lottie-web 侧优先用 light 构建（去掉 Expressions 插件）。
- **Worker 化**：`DotLottieWorker` 把渲染彻底移出主线程，避免复杂动画卡顿主线程交互。
- **ThorVG 性能宣传需谨慎**：官方口径宣称"渲染速度快于通用 SVG 渲染器、内存占用更低"（如 Canva 集成案例的具体倍数），**这类具体百分比数字来自 LottieFiles/合作方宣传材料，非独立第三方基准测试**，选型时可参考方向、不建议直接引用具体倍数作为性能承诺——自己用目标动画和目标设备实测才是可靠的容量规划依据。

## 五、故障排查

官方 troubleshooting 页整理的四类问题：

1. **不显示/加载失败**：先查 `src` 路径大小写/相对路径是否对、浏览器直接访问该 URL 是否 200；再查 DevTools Network 面板的 CORS 报错（缺 `Access-Control-Allow-Origin`）；监听 `loadError` 事件定位。
2. **不播放**：确认动画已加载完成再调用播放方法（监听 `load` 事件或查 `isLoaded`），检查 `autoplay`/`loop` 取值，segment/marker 名称是否存在，状态机是否已 `stateMachineStart()`。
3. **内存泄漏**：核心库必须显式 `destroy()`；React/Vue/Svelte 框架包装组件通常在卸载时自动清理，但手动持有实例引用时仍要在 `useEffect` 清理函数 / `onUnmounted` / `onDestroy` 里手动 `destroy()`。
4. **性能问题**：切换 `useFrameInterpolation`/`setSubframe`、开 `freezeOnOffscreen`、换更简单动画二分排查、确认 `destroy()` 有调用、用浏览器性能面板定位瓶颈。

框架集成与性能优化是把 Lottie 用进真实项目的最后一块拼图。完整的参数/方法/事件速查表与选型对比表，见 [参考页](../reference)。
