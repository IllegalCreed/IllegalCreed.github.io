---
layout: doc
outline: [2, 3]
---

# Animation 对象：播放控制 / 变速跳转 / Promise

> 基于 Web Animations API（2026 浏览器基线）· 核于 2026-07

## 速查

- **来源**：`Animation` 对象由 `element.animate()` 返回，或手工 `new Animation(effect, timeline)` 构造。
- **播放方法**：`play()`（播放/继续）/`pause()`（暂停）/`reverse()`（反向播放）/`finish()`（跳到结束态，触发 `finish` 事件）/`cancel()`（取消，回到无动画态，触发 `cancel` 事件）。
- **`reverse()` 不是直觉行为**：等价于 `playbackRate` 取负后播放；若动画已 `finished` 或未播放时调用，会从终点**重新完整倒放**到起点，而非"从当前进度反向"。
- **变速**：
  - `anim.playbackRate = 2` 直接赋值（2 倍速，负数倒放），是**瞬时**切换，可能产生视觉跳变。
  - `anim.updatePlaybackRate(0.5)` 让速率**平滑过渡**到新值，更适合渐进加速/减速的交互场景。
- **跳转/scrubbing**：`anim.currentTime = 1500` 直接跳到第 1500ms（单位毫秒）；容易和"百分比进度"混淆，须用 `getComputedTiming().activeDuration` 换算成实际毫秒数。
  - 典型应用：绑定到 `<input type="range">` 进度条，拖动滑块时同步设置 `currentTime`，实现"拖拽 scrubbing"效果。
- **状态查询**：
  - `anim.playState`：`"idle"` / `"running"` / `"paused"` / `"finished"`（规范另有 `"pending"` 过渡态）。
  - `anim.startTime`：相对 timeline 的绝对起点。
  - `anim.id`：自定义标识，便于 `getAnimations()` 后按 id 筛选。
- **`Animation.cancel()` vs `finish()`**：`cancel()` 回到动画播放前的初态，`finish()` 跳到动画结束的终态——方向相反，不要混用。
- **Promise 两员**：
  - `anim.ready`：动画真正开始播放前 resolve（等合成器准备好）；容易在"动画一创建就同步读 `playState`"时踩坑，应等 `ready` 后再读，避免 `pending` 过渡态干扰判断。
  - `anim.finished`：动画自然播完 / 被 `finish()` 时 resolve，被 `cancel()` 时 **reject**。
- **事件写法（等价）**：`anim.onfinish = () => {}` / `anim.oncancel = () => {}`，或 `anim.addEventListener("finish", ...)`。
- **`commitStyles()`**：把动画当前计算样式**写死成元素的内联 style**；前提是目标元素必须处于渲染树中且有可计算样式上下文——`display: none` 或未挂载到文档的元素调用会报错。
- **`persist()`**：默认动画 `finished` 后 `replaceState` 会变 `"removed"`、被浏览器自动清理释放资源；调用 `persist()` 把 `replaceState` 钉在 `"active"`，防止自动移除，之后仍可读它的 `effect`/`currentTime`。
- **推荐范式**：`commitStyles()` 保留视觉效果 → 再 `cancel()` 把动画本身清掉——解决"`fill` 默认不保留终态"的推荐姿势之一，避免动画对象和合成层一直驻留内存。
- **典型防抖模式**：播放期间禁用触发按钮，在 `finish` 事件回调里再重新启用，防止用户连点触发重复动画。
- **`persist()` 忘记调用的后果**：动画完成后浏览器可能自动回收，之后再读它的 `effect`/`currentTime` 可能已不可靠。
- **`id` 的实用价值**：全局调试面板/批量操作时，先 `getAnimations()` 拿到全部动画，再按 `id` 筛出目标那个。
- **`anim.effect`**：读取/替换关联的 `AnimationEffect`/`KeyframeEffect`，是访问关键帧与 timing 的入口，下一页 [Timeline 与合成](./timeline-and-composite) 详细展开其方法。
- **层叠上下文（专家级）**：动画对象是 stacking context 触发器之一——播放期间元素行为类似隐式声明了 `will-change`，可能改变 `z-index` 层叠顺序；动画结束后若用 `fill: forwards`/`both`，该层叠上下文会保留。
- **`finish` 事件与 Promise 对应**：动画自然播完或调用 `finish()` 方法主动跳转终态，都会触发 `finish` 事件，与 `anim.finished` Promise resolve 是同一套完成语义的两种消费方式。
- **`Animation` 与 `KeyframeEffect` 解耦**：改 `anim.effect.target` 可以把同一动画效果转移到别的元素（前提是这个 effect 构造时 `target` 传了 `null`）。
- **善后三选一速记**：只保终态不管资源 → `fill: "forwards"`；保终态且释放资源 → `commitStyles()` + `cancel()`；完成后仍需查询/操作 → `persist()`。
- **典型交互绑定**：`mouseenter`/`mouseleave` 里调用 `pause()`/`play()` 实现"悬停暂停"；`click` 里调用 `reverse()` 实现"点击切换正反播放"（注意上面提到的非直觉行为）。

## 一、播放控制方法

```js
const anim = el.animate(keyframes, options);

anim.play(); // 播放/继续
anim.pause(); // 暂停
anim.reverse(); // 反向播放（等价于 playbackRate 取负后 play）
anim.finish(); // 跳到结束态，触发 finish 事件
anim.cancel(); // 取消动画（回到无动画态），触发 cancel 事件
```

| 方法 | 作用 | 触发事件 |
| --- | --- | --- |
| `play()` | 开始播放或从暂停处继续 | — |
| `pause()` | 暂停在当前进度 | — |
| `reverse()` | 反向播放 | — |
| `finish()` | 立即跳到动画终态 | `finish` |
| `cancel()` | 取消动画，回到播放前初态 | `cancel` |

**`reverse()` 的反直觉之处**（专家级易错点）：它不是"从当前播放进度往回倒"，本质是把 `playbackRate` 取负再播放。如果动画已经处于 `finished` 状态或尚未播放就调用 `reverse()`，浏览器会让它从终点**重新完整倒放一遍**到起点，而不是仅仅反转当前那一小段进度——这个行为在"点击按钮切换正反播放"的交互里最容易踩坑，测试时应显式检查 `playState` 与 `currentTime` 再决定是否调用。

## 二、变速与跳转：playbackRate / currentTime

```js
anim.playbackRate = 2; // 2 倍速；负数 = 倒放
anim.updatePlaybackRate(0.5); // 比直接赋值更平滑地过渡到新速率
anim.currentTime = 1500; // 直接跳到第 1500ms（单位 ms！可用于拖拽进度条 scrubbing）
```

`playbackRate` 直接赋值是**瞬时**切换速率，可能产生视觉跳变；`updatePlaybackRate()` 则会让速率**平滑过渡**到新值，更适合"渐进加速/减速"的交互场景。`currentTime` 可读可写，赋值即可实现跳转——典型应用是把它绑定到一个 `<input type="range">` 进度条，拖动滑块时同步设置 `anim.currentTime`，实现"拖拽 scrubbing"效果。注意单位是毫秒，不是 0~1 的百分比进度，换算成百分比需要除以 `anim.effect.getComputedTiming().activeDuration`。

## 三、状态查询：playState / id / 事件

```js
anim.playState; // "idle" | "running" | "paused" | "finished"（规范另有 "pending" 过渡态）
anim.startTime; // 相对 timeline 的绝对起点
anim.id = "myAnim"; // 自定义标识，便于 getAnimations() 后按 id 筛选

// 事件（等价写法）
anim.onfinish = () => {};
anim.oncancel = () => {};
// 或
anim.addEventListener("finish", () => {});
```

`playState` 的四个稳定取值之外，规范还有一个 `"pending"` 过渡态——动画刚创建、合成器还没准备好时会短暂处于这个状态，如果代码里"创建动画后立刻同步读 `playState`"就可能读到 `"pending"` 而非预期值，正确做法是等 `anim.ready` resolve 之后再读（见下节）。

## 四、Promise 与善后：ready / finished / commitStyles / persist

```js
anim.ready.then(() => {}); // 动画真正开始播放前 resolve（等合成器准备好）
anim.finished
  .then(() => {
    // 动画自然播完 / 被 finish() 时 resolve
    anim.commitStyles(); // 把最终态写进内联样式再收尾
  })
  .catch(() => {}); // 被 cancel() 时 reject
```

两个 Promise 是动画生命周期两端的坐标：`ready` 标记"浏览器完成动画排布、真正可以开始播放"的时刻，`finished` 标记"播放结束"的时刻。`finished` 在动画自然播完或被 `finish()` 调用时 resolve，在被 `cancel()` 时 **reject**——用 `Promise.all()` 批量等待多个动画完成时，记得给每个 `.finished` 挂 `.catch()`，否则某个动画被取消会导致未捕获的 rejection。

`commitStyles()` 把动画当前计算样式**写死成元素的内联 style**，常和 `cancel()` 搭配——先 `commitStyles()` 保留视觉效果，再 `cancel()` 把动画本身清掉（避免一直占用合成层资源）。这是解决"`fill` 默认不保留终态"问题的推荐姿势之一，相比直接用 `fill: "forwards"`（会让动画对象及其合成层一直驻留在内存中）更利于资源回收。注意 `commitStyles()` 的前提条件：目标元素必须处于渲染树中且有对应可计算样式上下文，`display: none` 或未挂载到文档的元素调用会报错。

`persist()` 的作用是阻止动画完成后被自动回收——默认动画 `finished` 后 `replaceState` 会变成 `"removed"`，浏览器可能自动清理释放资源，之后再想读它的 `effect`/`currentTime` 可能已不可靠；需要善后处理的动画应显式调用 `persist()` 把 `replaceState` 钉在 `"active"`。

典型的"防抖点两下"模式：播放期间禁用触发按钮，`finish` 事件回调里再重新启用，避免用户连续点击触发重复动画实例堆叠。搞懂 `Animation` 对象的播放控制之后，下一页 [Timeline 与合成](./timeline-and-composite) 进入 `KeyframeEffect` 的复用能力、`composite` 合成模式，以及 `getAnimations()` 的组合查询。
