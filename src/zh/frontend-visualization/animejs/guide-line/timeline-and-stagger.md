---
layout: doc
outline: [2, 3]
---

# Timeline 与 stagger：编排、交错与关键帧

> 基于 Anime.js v4.5（npm `animejs@4.5.0`，2026-06-22 发布）· 核于 2026-07

## 速查

- **Timer 是 Animation 和 Timeline 的共同基类**（v4.0.0 架构文档明确）——三者共享同一套 Playback Settings（`delay`/`duration`/`loop`/`loopDelay`/`alternate`/`reversed`/`autoplay`/`frameRate`/`playbackRate`）和相近的方法命名，是刻意设计的继承体系。
- **`createTimer()`**：纯计时器，`setTimeout`/`setInterval` 的替代品，回调 `onBegin`/`onUpdate`/`onLoop`/`onComplete`/`onPause`/`then()`。
- **`createTimeline()`**：编排多个动画的先后顺序，`.add(target, params, position)` 依次挂载。
- **位置参数（position）完整语法**：数值绝对时间 `500`；标签 `'start'`；`'<'` = 上一个动画**结束**处；`'<<'` = 上一个动画**开始**处；相对运算 `'+=100'`/`'-=50'`/`'*=1.5'`；两者可组合 `'<<+=250'`；不写则接在时间轴末尾。
- ⚠️ **`<` 和 `<<` 极易记反**：`<` 是上一个动画的**结束**位置，`<<` 是上一个动画的**开始**位置——直觉上"更多尖括号=更靠后"是错的，`<<` 反而是回到更前面。
- **Timeline 方法**：`add()`（加动画/计时器）、`set()`（瞬间设置属性）、`sync()`（同步外部 Timeline 或 WAAPI 动画）、`label()`、`call()`（在指定时间点触发回调）、`remove()`。
- **播放控制**（Timer/Animation/Timeline 通用）：`play`/`pause`/`resume`/`restart`/`reverse`/`alternate`/`complete`/`cancel`/`revert`/`seek`/`stretch`/`refresh`。
- **v4 改进**：Timeline 子项的 loop/方向参数会被**正确计入总时长**，可以 `seek()` 穿越到某个循环轮次内部（v3 seek 只认整体时间轴一轮）。
- **`stagger()` 必须显式导入**：`import { stagger } from 'animejs'`，返回值是一个"函数值"，可塞进任意 tween 参数（`delay`/属性值），也可以直接作为 Timeline 的 position 参数。
- **`stagger(100)`**：时间交错，每个匹配目标依次延迟 +100ms 播放。
- **`stagger([0, 1])`**：值域交错，把 0~1 区间按元素数量均匀分布成每个元素的初始值。
- **stagger 常用参数**：`start`（起点偏移）、`from`（锚点 `'first'`/`'last'`/`'center'`/索引/`'random'`）、`reversed`、`ease`、`grid`+`axis`（二维/三维网格交错）、`modifier`、`total`/`use`（v4.1.0 新增，自定义交错顺序）、`jitter`/`seed`（v4.4.0/v4.5.0 新增，随机扰动+可复现种子）。
- **stagger 支持 3D 网格**（v4.5 起）：`{x,y,z}` 坐标 / `grid:[cols,rows,depth]`。
- ⚠️ **v4.4.0 breaking change**：`use` 回调签名第三参数从 `total`（数字）改成了 `targets`（数组），`stagger(100, { use: (t,i,total) => total - i })` 要改写为 `stagger(100, { use: (t,i,targets) => targets.length - i })`。
- **keyframes 四种写法**：①Tween value 关键帧（单属性数组）②Tween parameters 关键帧（单属性对象数组）③Duration-based 关键帧（顶层 `keyframes` 数组）④Percentage-based 关键帧（顶层 `keyframes` 百分比对象）。
- ⚠️ **"属性级 vs 顶层级"是最容易混的点**：①②挂在具体属性下（单属性维度），③④挂在 `animate` 顶层 `keyframes` 字段（多属性同步维度）。
- **Duration-based 关键帧**某一帧不写 `duration` 时，默认是"总 duration ÷ 关键帧总数"。
- **`playbackEase`**：对整条关键帧链再套一层整体缓动，与逐帧 `ease` 是两层缓动——逐帧 `ease` 管"这一帧到下一帧怎么过渡"，`playbackEase` 管"整条链条的节奏再包一层"。
- **下一步**：进入 [SVG 与 Draggable](./svg-and-draggable)，看 Anime.js 在形变/描边/路径运动/拖拽上的特色能力。

## 一、Timer：与 Timeline 共享的调度基类

在深入 Timeline 之前，先认识它的基类 `createTimer()`——一个纯计时器，定位是 `setTimeout`/`setInterval` 的替代品，与动画引擎共享同一个 tick：

```javascript
import { createTimer, utils } from 'animejs';

const [$time, $count] = utils.$('.value');

createTimer({
  duration: 1000,
  loop: true,
  frameRate: 30,
  onUpdate: self => $time.innerHTML = self.currentTime,
  onLoop:   self => $count.innerHTML = self._currentIteration,
});
```

**Timer 是 Animation 和 Timeline 共同的基类**（v4.0.0 release note 明确这一继承关系），三者共享同一套 Playback Settings（`delay`/`duration`/`loop`/`loopDelay`/`alternate`/`reversed`/`autoplay`/`frameRate`/`playbackRate`）与相近的方法命名（`play`/`pause`/`resume`/`restart`/`reverse`/`alternate`/`seek`/`stretch`/`cancel`/`revert`），这是刻意设计的继承体系而非巧合。

## 二、createTimeline()：基础编排与位置参数

`createTimeline()` 用来编排多个动画的先后顺序：

```javascript
import { createTimeline } from 'animejs';

const tl = createTimeline({ defaults: { duration: 750 } });

tl.label('start', 0)
  .add('.square',   { x: '15rem' }, 500)            // 绝对时间 500ms
  .add('.circle',   { x: '15rem' }, 'start')         // 标签引用
  .add('.triangle', { x: '15rem', rotate: '1turn' }, '<-=250'); // 上一个开头前 250ms
```

Timeline 编排能力的核心是每次 `add()` 调用的第三个参数——position（位置参数），完整语法：

| 写法 | 含义 |
| --- | --- |
| `500`（数字） | 绝对时间：timeline 第 500ms 处插入 |
| `'start'`（标签） | 定位到 `label()` 声明的标签处 |
| `'<'` | 上一个动画的**结束**位置 |
| `'<<'` | 上一个动画的**开始**位置 |
| `'+=100'` / `'-=50'` / `'*=1.5'` | 相对运算：加、减、乘 |
| `'<<+=250'` | 两者组合：开始位置再偏移 |
| 不写 | 接在时间轴末尾 |

::: warning `<` 与 `<<` 极易记反
`<` 指上一个动画的**结束**位置，`<<` 指上一个动画的**开始**位置——很多人直觉以为"更多尖括号=更靠后"，实际上 `<<` 是回到更前面（开头）。把 `'<'` 和 `'-=x'` 组合使用，就能让一组动画既有先后关系又有部分重叠。
:::

## 三、Timeline 方法：add / set / sync / label / call / remove

除了 `add()`，Timeline 还提供：`set()`（瞬间设置属性，无动画过程）、`sync()`（同步一个已存在的 Timeline 或 WAAPI 动画进当前时间轴）、`label()`（声明可复用的时间标签）、`call()`（在指定时间点触发回调）、`remove()`（移除已加入的项）。

播放控制方法与 Timer/Animation 通用：`play`/`pause`/`resume`/`restart`/`reverse`/`alternate`/`complete`/`cancel`/`revert`/`seek`/`stretch`/`refresh`。

**v4 相对 v3 的改进**：Timeline 子项的 `loop`/方向参数现在会被**正确计入总时长**，可以 `seek()` 穿越到不同循环轮次内部——v3 的 `seek` 只认整体时间轴一轮，做不到这一点。

## 四、stagger()：交错动画

`stagger` 让同一次动画作用于多个目标时，各目标依次错开，是列表/网格类入场动画的核心手段。**它不是自动生效的语法糖，必须显式 `import { stagger } from 'animejs'`**，返回的是一个"函数值"，可以塞进任意 tween 参数位置，也可以直接作为 Timeline 的 position 参数使用：

```javascript
import { animate, stagger } from 'animejs';

animate('.square', {
  scale: stagger([0.1, 1]),          // 值域交错：每个元素起始 scale 在 0.1~1 间递增分布
  delay: stagger(100, {
    start: 500,                       // 整体起始偏移
    from: 'center',                   // 交错锚点：'first'/'last'/'center'/索引/'random'
    grid: [7, 4], axis: 'x',          // 二维网格交错（v4.5 起支持 3D：{x,y,z} / [cols,rows,depth]）
    ease: 'outQuad',                   // 交错分布本身也可以过一层缓动
    modifier: v => Math.round(v),
    jitter: [0, 200],                  // v4.4.0+：交错值追加随机偏移
    seed: 1,                           // v4.5+：让 jitter/from:'random' 可复现
  }),
});
```

`stagger(100)` 是"时间交错"：每个匹配目标依次延迟 +100ms 播放；`stagger([0, 1])` 是"值域交错"：把 0~1 区间按元素数量均匀分布成每个元素的初始值——两者是完全不同的用法，都靠同一个 `stagger()` 函数产出。

常用参数一览：`start`（起点偏移）、`from`（交错锚点）、`reversed`、`ease`、`grid`+`axis`（二维/三维网格交错，常用于卡片墙/图片墙效果）、`modifier`、`total`/`use`（v4.1.0 新增，自定义交错顺序，比如按 DOM 上的 `data-line` 属性排序）、`jitter`/`seed`（v4.4.0/v4.5.0 新增，随机扰动 + 可复现种子）。

::: warning v4.4.0 breaking change：use 回调签名
`stagger()` 的 `use` 回调签名第三参数从 `total`（数字）改成了 `targets`（数组），`stagger(100, { use: (t,i,total) => total - i })` 要改写为 `stagger(100, { use: (t,i,targets) => targets.length - i })`。
:::

## 五、keyframes：四种写法

keyframes 有四种写法，可混用、互不冲突：

```javascript
// ① Tween value 关键帧：单属性数组，按顺序流转
animate('.sq', { x: [0, 100, 50], duration: 3000 });

// ② Tween parameters 关键帧：单属性的对象数组，逐帧自定义 ease/duration/delay
animate('.sq', {
  y: [
    { to: '-2.5rem', ease: 'out', duration: 400 },
    { to: '2.5rem', duration: 800, delay: 700 },
    { to: 0, ease: 'in', duration: 400, delay: 700 },
  ],
});

// ③ Duration-based 关键帧：animate 顶层的 keyframes 数组，多属性同步，按时长顺序播放
animate('.sq', {
  keyframes: [
    { y: '-2.5rem', ease: 'out', duration: 400 },
    { x: '17rem', scale: .5, duration: 800 },
    { y: '2.5rem' },               // 未写 duration 时 = 总 duration / 关键帧数
    { x: 0, scale: 1, duration: 800 },
    { y: 0, ease: 'in', duration: 400 },
  ],
  duration: 3000,
  playbackEase: 'inOut(3)',         // 对整条关键帧链再套一层整体缓动
  loop: true,
});

// ④ Percentage-based 关键帧：用百分比精确定位每帧在总时长里的位置
animate('.sq', {
  keyframes: {
    '0%':   { x: 0,   y: 0 },
    '50%':  { x: 100, y: 100 },
    '100%': { x: 200, y: 200 },
  },
  duration: 3000,
});
```

::: warning "属性级 vs 顶层级"是最容易混的点
①②是"挂在具体属性下"的关键帧（单属性维度），③④是"挂在 `animate` 顶层 `keyframes` 字段"的关键帧（多属性同步维度）。Duration-based 关键帧里某一帧不写 `duration` 时，默认是"总 duration ÷ 关键帧总数"。
:::

`playbackEase` 与逐帧 `ease` 是两层缓动：逐帧 `ease` 管"这一帧到下一帧怎么过渡"，`playbackEase` 管"整条关键帧链条的节奏再包一层"。

---

下一步进入 [SVG 与 Draggable](./svg-and-draggable)：看 Anime.js 在形变、描边、路径运动与拖拽物理上的特色能力。
