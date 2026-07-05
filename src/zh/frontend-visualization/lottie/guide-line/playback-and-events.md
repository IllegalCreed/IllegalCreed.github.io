---
layout: doc
outline: [2, 3]
---

# 播放控制与事件系统

> 基于 lottie-web 5.13 / dotLottie · 核于 2026-07

## 速查

- **基础播放**：`play()`（从当前帧播放）/`pause()`（暂停在当前帧）/`stop()`（停止并回到第一帧）。
- **速度与方向**：`setSpeed(speed)`（数值，`1` = 正常速度）/`setDirection(1|-1)`（`1` 正向，`-1` 反向）。
- **跳转类**：`goToAndStop(value, isFrame)`/`goToAndPlay(value, isFrame)`——`isFrame` 决定 `value` 是时间（秒）还是帧号，默认 `false`（时间）。
- **分段播放**：`playSegments(segments, forceFlag)`——`segments` 是 `[start,end]` 或 `[[s1,e1],[s2,e2]]`（多段顺序连播）；`forceFlag` 决定立即切换还是等当前段播完。
- **子帧插值**：`setSubframe(useSubFrames)`，默认 `true`（每个 rAF 都更新，更平滑）；设 `false` 严格贴 AE 原始帧率，换性能。
- **时长查询**：`getDuration(inFrames)`——传 `true` 返回总帧数，`false`（默认）返回秒数。
- **释放资源**：`destroy()` 清理实例、移出 DOM，**必须调用**否则内存泄漏。
- **事件监听**：`animation.addEventListener(name, handler)` / `removeEventListener(name, handler)`。
- **完整事件列表**：`complete`/`loopComplete`/`drawnFrame`/`enterFrame`/`segmentStart`/`config_ready`（初始配置就绪）/`data_ready`（全部动画数据加载完成）/`data_failed`（部分数据加载失败）/`loaded_images`（图片资源加载完成）/`DOMLoaded`（已插入 DOM）/`destroy`。
- **回调属性形式**：`onComplete`/`onLoopComplete`/`onEnterFrame`/`onSegmentStart` 可在 `loadAnimation` 里直接传，等价于对应事件的 `addEventListener`。
- **`name` 参数**：`loadAnimation({name: 'xxx'})` 给实例命名，多实例场景按名管理/引用。
- **全局 API 提醒**：`lottie.setQuality()`/`freeze()`/`unfreeze()`/`resize()` 作用于**全部实例**，不是单个 `AnimationItem` 的方法，详见 [loadAnimation 与渲染器](./loadanimation-and-renderer)。
- **常见坑**：`destroy()` 忘记调用是内存泄漏头号原因；`playSegments` 的 `forceFlag` 语义容易记反；含 repeater 的动画复用同一份 `animationData` 需要深克隆（见 [入门](../getting-started)）。

## 一、基础播放控制

```js
animation.play(); // 从当前帧播放
animation.pause(); // 暂停在当前帧
animation.stop(); // 停止并回到第一帧
```

| 方法 | 参数 | 作用 |
| --- | --- | --- |
| `play()` | — | 从当前帧播放 |
| `pause()` | — | 暂停在当前帧 |
| `stop()` | — | 停止并回到第一帧 |
| `destroy()` | — | 清理实例、移出 DOM，**释放资源必须调用** |

这四个方法是最基础的播放控制，覆盖"播放器"最朴素的需求；更精细的跳转、分段、速度控制见下面几节。

## 二、跳转与分段播放

```js
// 跳转到第 30 帧并停止（isFrame = true 表示 value 是帧号）
animation.goToAndStop(30, true);

// 跳转到第 2 秒并播放（isFrame 默认 false，value 是时间）
animation.goToAndPlay(2, false);

// 只播放 10~60 帧这一段，forceFlag=true 立即生效
animation.playSegments([10, 60], true);

// 多段顺序连播：先播 0~30 帧，再接着播 60~90 帧
animation.playSegments(
  [
    [0, 30],
    [60, 90],
  ],
  true
);
```

| 方法 | 参数 | 作用 |
| --- | --- | --- |
| `goToAndStop(value, isFrame)` | `value` = 时间或帧号；`isFrame` 默认 `false` | 跳转并停止 |
| `goToAndPlay(value, isFrame)` | 同上 | 跳转并播放 |
| `playSegments(segments, forceFlag)` | `[start,end]` 或 `[[s1,e1],[s2,e2]]`；`forceFlag` 立即生效 vs 等当前段播完 | 只播放指定片段（多段可顺序连播） |

**`forceFlag` 语义容易记反**：`true` = 立即切换到新片段（打断当前播放）；`false`/省略 = 等当前片段播完再切换到新片段。做"点击按钮切换到另一段动画"这类交互，通常需要 `forceFlag: true` 才能立即响应。

## 三、速度、方向与子帧

```js
animation.setSpeed(2); // 2 倍速播放
animation.setDirection(-1); // 反向播放
animation.setSubframe(false); // 关闭子帧插值，严格贴 AE 原始帧率
const totalFrames = animation.getDuration(true); // true 返回总帧数
const totalSeconds = animation.getDuration(false); // false 返回秒数
```

| 方法 | 参数 | 作用 |
| --- | --- | --- |
| `setSpeed(speed)` | 数值，`1` = 正常速度 | 调整播放速度 |
| `setDirection(direction)` | `1` = 正向，`-1` = 反向 | 播放方向 |
| `setSubframe(useSubFrames)` | 布尔，默认 `true` | `true` = 每个 rAF 都更新（平滑）；`false` = 严格遵循 AE 原始帧率 |
| `getDuration(inFrames)` | 布尔 | `true` 返回总帧数，`false` 返回秒数 |

`setSubframe(false)` 是一个常被忽略的性能开关：默认的逐 rAF 平滑插值在低端设备上对复杂动画会造成掉帧，关闭后严格贴 AE 原始帧率，用计算量换回一部分性能（详见 [框架集成与性能优化](./framework-and-optimization)）。

## 四、事件系统

```js
animation.addEventListener("complete", () => console.log("播放完成"));
animation.addEventListener("loopComplete", () => console.log("一轮循环完成"));
animation.addEventListener("enterFrame", () => console.log("每帧触发"));
animation.addEventListener("segmentStart", () => console.log("片段开始"));
animation.addEventListener("DOMLoaded", () => console.log("已挂载到 DOM"));

function handler() {
  /* ... */
}
animation.removeEventListener("complete", handler);
```

完整事件列表：`complete` / `loopComplete` / `drawnFrame` / `enterFrame` / `segmentStart` / `config_ready`（初始配置就绪）/ `data_ready`（全部动画数据加载完成）/ `data_failed`（部分数据加载失败）/ `loaded_images`（图片资源加载完成）/ `DOMLoaded`（已插入 DOM）/ `destroy`。

也可以用**回调属性形式**，直接在 `loadAnimation` 里传，语义与对应事件的 `addEventListener` 等价：

```js
lottie.loadAnimation({
  container,
  path: "data.json",
  onComplete: () => console.log("播放完成"),
  onLoopComplete: () => console.log("一轮循环完成"),
  onEnterFrame: () => console.log("每帧触发"),
  onSegmentStart: () => console.log("片段开始"),
});
```

`enterFrame`/`drawnFrame` 这类高频事件（每帧触发）适合做进度条联动，但回调本身要保持轻量，避免在每帧回调里做重计算拖累帧率。

## 五、易错点

- **忘记 `destroy()`**：SPA 路由切换/组件卸载不清理动画实例 → canvas/rAF/事件监听持续占用，内存泄漏。✅ React 用 `useEffect` 清理函数、Vue 用 `onUnmounted` 手动调用；框架官方包装组件通常已处理，但手动持有 ref 时仍需自查，详见 [框架集成与性能优化](./framework-and-optimization)。
- **`playSegments` 的 `forceFlag` 记反**：以为 `false` 是"立即生效"，实际相反——`true` 才是立即切换，`false` 会等当前片段播完。✅ 需要打断当前播放立即响应交互时传 `true`。
- **repeater + 复用同一份 JSON 不深克隆**：多次 `loadAnimation` 用同一 `animationData` 对象引用，含 repeater 时实例间状态互相污染。✅ 深克隆后再传，原生 lottie-web 要自己做（部分 React 封装已内置自动处理，见下一叶）。
- **`getDuration` 参数传反**：`inFrames` 传 `true` 拿到的是帧数不是秒数，直接拿去做 `setTimeout` 时长计算会差一个数量级。✅ 需要秒数时明确传 `false` 或不传（默认值也是 `false`）。

播放控制与事件是把动画"用起来"的核心 API，下一叶进入 [dotLottie 与播放器](./dotlottie-and-players)，看新一代 `.lottie` 格式、`dotlottie-web` 播放器与状态机交互。
