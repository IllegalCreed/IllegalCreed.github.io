---
layout: doc
outline: [2, 3]
---

# Timeline 与 stagger：时间线编排与交错动画

> 基于 GSAP v3.15（npm `gsap@3.15.0`，2026-04-13 发布）· 2025-04 起全插件 100% 免费（含商业项目）· 核于 2026-07

## 速查

- **Timeline 构造项**：`repeat`（`-1` 无限）、`repeatDelay`、`yoyo`、`paused`、`defaults`（子动画默认值统一管理）、`onComplete` 等回调。
- **链式编排**：`tl.to().to().from().set().add()`，默认按顺序衔接（sequential）。
- **位置参数（必考重点）**：数字 = 绝对时间；`"+=1"` = 末尾之后；`"-=1"` = 与末尾重叠；`"label"` = 标签处；`"<"` = 上一动画起点；`">"` = 上一动画终点（默认行为）；`"<1"`/`">-0.5"` = 起点/终点再偏移。
- **控制方法**：`play()`/`pause()`/`resume()`/`reverse()`/`restart()`/`seek(time|label)`/`progress(0~1)`/`totalProgress()`/`timeScale()`（变速）/`kill()`/`clear()`/`revert()`。
- **查询/标签**：`addLabel`/`removeLabel`/`currentLabel()`/`nextLabel()`/`getChildren()`/`getTweensOf()`/`duration()`/`totalDuration()`。
- **stagger 三种写法**：数字（固定间隔）/ 对象（`each`/`amount`/`from`/`grid`/`axis`/`ease`/`repeat` 精细控制）/ 函数（完全自定义）。
- **stagger `from` 可选值**：`start`（默认）/ `end` / `center`（从中心向两侧辐射）/ `edges`（从两端向中心收缩）/ `random` / 具体索引 / `[x%, y%]`。
- **`grid`**：二维网格交错，`"auto"` 按 `getBoundingClientRect()` 自动推断行列；`axis` 只按某一轴计算距离。
- ⚠️ **`each` 与 `amount` 语义不同**：`each` 是相邻元素固定间隔，`amount` 是总时长按元素数自动均分，元素数量变化时 `amount` 的实际间隔会跟着变而 `each` 不会。
- ⚠️ **`repeat`/`stagger` 嵌套位置决定语义**：写在动画外层的 `repeat` 是整组 stagger 完成后再重复；写在 `stagger:{...repeat}` 对象内部则是每个子补间各自独立重复。
- **通用实例方法**：`play(from, suppressEvents)`/`pause(atTime)`/`resume()`/`reverse(from)`/`restart(includeDelay)`/`seek(time)`/`progress(value)`/`totalProgress(value)`/`time(value)`/`totalTime(value)`/`timeScale(value)`/`kill(target, propertiesList)`/`then(callback)`（返回 Promise）。

## 一、Timeline 基础与位置参数

Timeline 是把多个 Tween（甚至嵌套的子 Timeline）编排成一个可整体控制的复合动画容器：

```js
let tl = gsap.timeline({
  repeat: 2,              // 重复次数，-1 为无限
  repeatDelay: 1,
  yoyo: true,             // 往返
  paused: true,           // 创建即暂停
  defaults: { duration: 1, ease: "power2.inOut" }, // 子动画默认值统一管理
  onComplete: () => console.log("done"),
});

tl.to("#a", { x: 100 })
  .to("#b", { y: 100 })       // 默认接在上一个动画结束处（sequential）
  .from(".c", { opacity: 0 })
  .set(".d", { display: "block" })
  .add(otherTimeline(), "+=0.5"); // 嵌套子 timeline，可整体复用/编排
```

链式调用默认按顺序衔接，但真正的编排能力来自每个方法调用的**位置参数**（第二参数，或 `fromTo` 的第三参数）：

| 写法 | 含义 |
| --- | --- |
| `3`（数字） | 绝对时间：timeline 第 3 秒处插入 |
| `"+=1"` | 相对时间：接在**当前 timeline 末尾**之后 1 秒 |
| `"-=1"` | 相对时间：与末尾**重叠** 1 秒（提前插入） |
| `"myLabel"` | 定位到标签处（`tl.addLabel("myLabel", 3)`） |
| `"myLabel+=2"` | 标签之后 2 秒 |
| `"<"` | 上一个动画的**起点**（常用于制造同时开始的并行动画） |
| `">"` | 上一个动画的**终点**（等价于默认的顺序衔接） |
| `"<1"` / `">-0.5"` | 上一动画起点/终点再做相对偏移 |

位置参数是 Timeline 编排能力的核心——把 `"<"` 和 `"-=x"` 组合使用，就能让一组动画既有先后关系又有部分重叠，做出比"严格顺序"或"完全同时"更有层次感的动画序列。

## 二、Timeline 控制方法与回调

Timeline 与 Tween 共享一套播放控制方法：`play()`/`pause()`/`resume()`/`reverse()`/`restart()`/`seek(time|label)`/`progress(0~1)`/`totalProgress()`/`timeScale()`（变速，可对 `timeScale` 本身再做 tween 实现渐进加速）/`kill()`/`clear()`/`revert()`。

标签与查询 API 让 Timeline 具备"可寻址"能力：`addLabel`/`removeLabel`/`currentLabel()`/`nextLabel()`/`getChildren()`/`getTweensOf()`/`duration()`/`totalDuration()`。

回调 `onComplete`/`onStart`/`onUpdate`/`onRepeat`/`onReverseComplete` 既可以在构造 Timeline 时传入，也可以用 `tl.eventCallback("onUpdate", fn)` 动态绑定/替换，适合运行时按状态切换不同的回调逻辑。

## 三、stagger 交错动画

`stagger` 让同一次 `.to()`/`.from()` 调用作用于多个目标时，各目标依次错开开始，是列表/网格类入场动画的核心手段：

```js
// 数字：每个元素间隔 0.1s 依次开始（负数则倒序开始）
gsap.to(".box", { y: 100, stagger: 0.1 });

// 对象：精细控制
gsap.to(".box", {
  y: 100,
  stagger: {
    each: 0.1,           // 相邻元素间隔（与 amount 二选一语义）
    amount: 1,           // 总时长（自动按元素数量均分间隔）
    from: "center",      // "start"|"end"|"center"|"edges"|"random"|索引数字|[x%,y%]
    grid: "auto",        // 二维网格交错，"auto" 按 getBoundingClientRect() 自动推断行列
    axis: "x",           // 网格模式下只按某一轴计算距离
    ease: "power2.inOut",// 交错延迟本身按此 ease 分布（而非线性）
    repeat: -1,          // 嵌套在 stagger 内 = 每个子补间独立重复；写在外层 = 整组重复
  },
});

// 函数式：完全自定义每个元素的延迟
gsap.to(".box", {
  y: 100,
  stagger: (index, target, list) => index * 0.1,
});
```

`from` 的核心可选值：`start`（默认/0）/ `end` / `center`（从中心向两侧辐射）/ `edges`（从两端向中心收缩，与 center 相反）/ `random`（随机顺序）/ 具体索引（从该索引处向两侧辐射）。

::: warning 混淆 each 与 amount
`each` 是相邻元素固定间隔，`amount` 是总时长按元素数自动均分，两者语义不同不能混用理解——元素数量变化时 `amount` 的实际间隔会跟着变而 `each` 不会。
:::

::: warning stagger / repeat 嵌套位置决定语义
写在动画外层的 `repeat` 是整组 stagger 完成后再重复；写在 `stagger:{...repeat}` 对象内部则是每个子补间各自独立重复，两者效果差异很大，容易配置反。
:::

## 四、控制方法与回调（Tween/Timeline 通用实例方法）

不管是单个 Tween 还是 Timeline，都共享同一套实例方法：

`play(from, suppressEvents)` / `pause(atTime)` / `resume()` / `reverse(from)` / `restart(includeDelay)` / `seek(time)` / `progress(value)` / `totalProgress(value)` / `time(value)` / `totalTime(value)` / `timeScale(value)` / `kill(target, propertiesList)` / `then(callback)`（返回 Promise，可 `await tween.then()` 等完成）。

`then()` 尤其适合和 `async/await` 搭配，把"等动画播完再做下一步"写成同步风格的代码，而不必嵌套 `onComplete` 回调。

---

下一步进入 [ScrollTrigger 与插件生态](./scrolltrigger-and-plugins)：把 Tween/Timeline 与滚动行为绑定，并认识 SplitText、Flip、MotionPath 等常用插件。
