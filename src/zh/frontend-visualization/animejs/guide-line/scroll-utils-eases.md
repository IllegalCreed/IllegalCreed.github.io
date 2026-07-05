---
layout: doc
outline: [2, 3]
---

# ScrollObserver、utils 与 eases：滚动联动、工具函数与性能

> 基于 Anime.js v4.5（npm `animejs@4.5.0`，2026-06-22 发布）· 核于 2026-07

## 速查

- **`onScroll()` 要塞进 `autoplay` 字段**：核心用法是把 `onScroll(...)` 塞进动画的 `autoplay` 字段（而不是 `true`/`false`），本质是"用滚动位置驱动播放/进度"，不是独立 new 出来的监听器。
- **ScrollObserver Settings**：`container`（自定义滚动容器，非 window）、`target`（观察的目标元素，默认是被动画元素本身）、`debug`（可视化调试线）、`axis`（x/y）、`repeat`（是否可重复触发）。
- **Thresholds 四种写法**：数值像素、位置简写（`'top'`/`'bottom'`/`'center'` 等两两组合如 `'bottom top'`）、相对偏移（`'top+100'`）、`{min,max}` 区间。
- **四种同步模式**：方法名模式（滚动到点直接调用 `play`/`pause`/`reverse` 等方法名）、播放进度模式（滚动百分比=动画进度百分比）、平滑滚动模式、缓动滚动模式（滚动过程套用户自定义 ease）。
- **方向细分回调**：`onEnter`/`onEnterForward`/`onEnterBackward`/`onLeave`/`onLeaveForward`/`onLeaveBackward`/`onUpdate`/`onSyncComplete`/`onResize`——进入/离开各自还分"正向滚动"和"反向滚动"，是常考点。
- **ScrollObserver 方法**：`link()`（把一个已有动画挂到 observer 上）、`refresh()`、`revert()`。
- **`utils.$(selector)`**：选择器 → 元素数组；**`utils.set/get/remove/cleanInlineStyles`**：无动画设置/读取/移除/清理行内样式。
- **随机与数值工具**：`utils.random(min,max)`、`utils.createSeededRandom(seed)`（可复现随机数生成器）、`utils.randomPick(array)`、`utils.shuffle(array)`、`utils.clamp(v,min,max)`、`utils.round(v,decimals)`、`utils.snap(v,increment)`、`utils.mapRange(v,inMin,inMax,outMin,outMax)`、`utils.lerp(a,b,t)`、`utils.damp(x,y,factor,dt)`、`utils.degToRad`/`utils.radToDeg`。
- **工具函数可当 `modifier` 用**：不少 `utils` 函数（如 `utils.round(2)`）本身就能当 `modifier` 回调塞进 `animate` 参数，是 v3 `round` 参数在 v4 里的替代写法。
- **`utils.keepTime()`**（v4.1.0 新增）：包装一个 Timer/Animation/Timeline 构造函数，在重建时（如媒体查询触发）保留原有播放进度，常与 `createScope` 的 `mediaQueries` 搭配。
- **eases 全家族**：`linear`/`Quad`/`Cubic`/`Quart`/`Quint`/`Sine`/`Expo`/`Circ`/`Bounce`/`Back`（可带 overshoot 参数）/`Elastic`（可带 amplitude/period 参数），每种都有 `in`/`out`/`inOut`/`outIn` 四态；此外有参数化通用幂函数 `in(power)`/`out(power)`/`inOut(power)`。
- **`spring()`**：物理弹簧缓动，两套参数体系二选一——「感知参数」`bounce`（-1~1，默认 0.5）+ `duration`（感知完成时间，默认 628ms，**会覆盖 animate 自身的 duration**）；「物理参数」`mass`/`stiffness`/`damping`/`velocity`（默认 1/100/10/0）。spring 自带独立 `onComplete`（视觉稳定时触发，与动画的 onComplete 是两回事）。
- **`steps(n, fromStart)`**：`n` 为正整数步数；`fromStart` 默认 `false`（阶梯在每步末尾跳变），`true` 则在每步开头跳变。
- **`cubicBezier(x1,y1,x2,y2)`**：x 分量限定 0~1，y 分量任意（负值/大于 1 可做回弹/超冲）。
- **`linear(...stops)`**：至少两个停靠点，可选百分比位置 `'0.5 50%'`，不写百分比则均匀分布，首尾停靠点不能带百分比。
- **`irregular(steps, randomness=1)`**：用随机点之间的线性插值制造"抖动/不规律"效果，randomness 越大跳变越剧烈。
- **导入两种姿势**：`import { eases, cubicBezier, spring } from 'animejs'`（具名）或 `import { easings } from 'animejs'` 再 `easings.eases.inOut(3)`（命名空间）。
- **Engine 全局配置**：`engine.pauseOnDocumentHidden`（切后台自动暂停，默认 true）、`engine.timeUnit`（`'ms'`/`'s'`）、`engine.precision`（数值小数精度）；性能三兄弟 `fps`/`frameRate`、`precision`、`pauseOnDocumentHidden`。
- **`priority`**：动画实例级参数（非 engine 全局），控制同一 tick 内多个动画的渲染顺序，数值越小越先算，绝大多数场景不需要关心。
- **`waapi.animate()` 是性能选型的另一条腿**：体积仅约 3KB（vs 完整 JS 版约 10KB），换取原生硬件加速，代价是砍掉 `composition`/`modifier`/`playbackEase`/`frameRate`/`stretch()`/`refresh()` 等能力。
- **下一步**：查完这一页，去[参考页](../reference)看完整 API 速查表、v3→v4 对照与选型对比。

## 一、ScrollObserver：onScroll() 滚动联动

```javascript
import { animate, onScroll } from 'animejs';

animate('.reveal', {
  opacity: [0, 1],
  y: [50, 0],
  autoplay: onScroll({
    target: '.reveal',
    container: '.scroll-area',
    axis: 'y',
    enter: 'bottom top',    // 位置简写：目标底部 碰到 视口顶部 时触发
    leave: 'top bottom',
    sync: true,              // 播放进度与滚动进度同步（"划过式"动画常用）
    onEnter: () => {},
    onLeave: () => {},
  }),
});
```

核心用法是把 `onScroll(...)` 塞进动画的 `autoplay` 字段（而不是 `true`/`false`），本质是"用滚动位置驱动播放/进度"，而不是独立 `new` 出来的监听器对象。

**Settings**：`container`（自定义滚动容器，非 window）、`target`（观察的目标元素，默认是被动画元素本身）、`debug`（可视化调试线）、`axis`（x/y）、`repeat`（是否可重复触发）。

**Thresholds 四种写法**：数值像素、位置简写（`'top'`/`'bottom'`/`'center'` 等两两组合如 `'bottom top'`）、相对偏移（`'top+100'`）、`{min,max}` 区间。

**四种同步模式**：方法名模式（滚动到点直接调用 `play`/`pause`/`reverse` 等方法名）、播放进度模式（滚动百分比=动画进度百分比）、平滑滚动模式、缓动滚动模式（滚动过程套用户自定义 ease）。

::: tip 方向细分回调是常考点
`onEnter`/`onEnterForward`/`onEnterBackward`/`onLeave`/`onLeaveForward`/`onLeaveBackward`/`onUpdate`/`onSyncComplete`/`onResize`——进入/离开各自还分"正向滚动"和"反向滚动"，容易漏记后缀。
:::

**方法**：`link()`（把一个已有动画挂到 observer 上）、`refresh()`、`revert()`。

## 二、utils 工具函数

```javascript
import { utils } from 'animejs';

const [$el] = utils.$('.box');            // 选择器 → 元素数组
utils.set('.box', { x: 100 });             // 立即设置（无动画）
utils.get('.box', 'x');                    // 读取当前值
utils.remove('.box');                      // 从所有正在运行的动画中移除目标
utils.cleanInlineStyles('.box');           // 清掉行内 style
utils.random(0, 100);                      // 随机数
utils.createSeededRandom(42);              // 可复现的随机数生成器
utils.randomPick(['a', 'b', 'c']);
utils.shuffle([1, 2, 3]);
utils.clamp(150, 0, 100);                  // 钳制
utils.round(3.14159, 2);
utils.snap(53, 10);                        // 吸附到最近的 10 的倍数
utils.mapRange(5, 0, 10, 0, 100);          // 值域映射
utils.lerp(0, 100, 0.5);                   // 线性插值
utils.damp(x, y, factor, dt);              // 阻尼插值
utils.degToRad(180); utils.radToDeg(Math.PI);
```

这些函数中相当一部分本身可以**当 `modifier` 回调**塞进 `animate` 参数里（比如 `modifier: utils.round(2)` 做数值取整显示），是 v3 `round` 参数在 v4 里的替代写法。

`utils.keepTime()`（v4.1.0 新增）：包装一个 Timer/Animation/Timeline 构造函数，在（例如媒体查询触发的）重建时保留原有播放进度，常与 `createScope` 的 `mediaQueries` 搭配。

## 三、eases 缓动体系与 spring

```javascript
import { animate, eases, cubicBezier, spring, steps, linear, irregular } from 'animejs';

animate(el, { x: 100, ease: 'outExpo' });               // 字符串写法
animate(el, { x: 100, ease: eases.outQuad });            // 对象写法
animate(el, { x: 100, ease: 'outElastic(.8, 1.2)' });    // 带参数字符串
animate(el, { x: 100, ease: spring({ bounce: .5 }) });   // 弹簧
animate(el, { x: 100, ease: steps(4) });                 // 阶梯
animate(el, { x: 100, ease: cubicBezier(0, 0, .58, 1) }); // 贝塞尔
animate(el, { x: 100, ease: linear(0, '0.5 50%', 1) });  // 自定义线性关键点
animate(el, { x: 100, ease: irregular(10, 1.5) });       // 不规则随机
```

**内置 ease 全家族**（每种都有 `in`/`out`/`inOut`/`outIn` 四态）：`linear`、`Quad`、`Cubic`、`Quart`、`Quint`、`Sine`、`Expo`、`Circ`、`Bounce`、`Back`（可带 overshoot 参数）、`Elastic`（可带 amplitude/period 参数）；此外有参数化的通用幂函数 `in(power)`/`out(power)`/`inOut(power)`。

**`spring()`**：物理弹簧缓动，两套参数体系二选一——「感知参数」`bounce`（-1~1，默认 0.5）+ `duration`（感知完成时间，默认 628ms，**会覆盖 animate 自身的 duration**）；「物理参数」`mass`/`stiffness`/`damping`/`velocity`（默认 1/100/10/0）。spring 自带独立 `onComplete`（视觉稳定时触发，与动画的 `onComplete` 是两回事）。

::: tip spring 命名的新旧不一致
官方 GitHub wiki 的迁移指南写的是 `createSpring()`，但当前（v4.5.0）文档站用法已统一为 `spring()`——两者是同一能力的新旧命名，出题/写代码以当前 `spring()` 为准。
:::

**`steps(n, fromStart)`**：`n` 为正整数步数；`fromStart` 默认 `false`（阶梯在每步末尾跳变），`true` 则在每步开头跳变。**`cubicBezier(x1,y1,x2,y2)`**：x 分量限定 0~1，y 分量任意（负值/大于 1 可做回弹/超冲）。**`linear(...stops)`**：至少两个停靠点，可选百分比位置 `'0.5 50%'`，不写百分比则均匀分布，首尾停靠点不能带百分比。**`irregular(steps, randomness=1)`**：用随机点之间的线性插值制造"抖动/不规律"效果，randomness 越大跳变越剧烈。

导入两种姿势：`import { eases, cubicBezier, spring } from 'animejs'`（具名）或 `import { easings } from 'animejs'` 再 `easings.eases.inOut(3)`/`easings.spring(...)`（命名空间）。

## 四、性能：Engine 配置与轻量入口选型

```javascript
import { engine } from 'animejs';

engine.pauseOnDocumentHidden = true;   // 切后台标签自动暂停，省电（默认即为 true）
engine.timeUnit = 'ms';                 // 'ms'|'s'（milliseconds/seconds 切换）
engine.precision = 4;                    // 数值小数精度
engine.update();  engine.pause();  engine.resume();   // 手动驱动 tick
```

Timer/Animation/Timeline 全部由这一个全局 `engine` 驱动，保证互相同步（同一个 tick）。`engine.defaults` 可设全局默认参数（相当于给所有动画一个统一 duration/ease 兜底）。`priority` 是**动画实例级**参数（不是 engine 全局的），控制同一 tick 内多个动画的渲染顺序，数值越小越先算，只有需要保证"先算位置再算依赖该位置的其他动画"这类跨动画数据依赖场景才需要手动调它。

性能相关三兄弟：`fps`/`frameRate`（限制刷新频率，省 CPU）、`precision`（数值精度，影响计算量）、`pauseOnDocumentHidden`（后台自动暂停）。

**另一条性能选型路径是 `waapi.animate()`**：体积仅约 **3KB**（对比完整 JS 版 `animate()` 约 **10KB**），是对浏览器原生 `Element.animate()` 的一层薄封装，换取原生硬件加速，但代价是砍掉了 `composition`/`modifier`/`playbackEase`/`frameRate`/`stretch()`/`refresh()` 等"JS 版独占"能力：

```javascript
import { waapi, stagger, spring } from 'animejs';

waapi.animate('.circle', {
  y: [0, -30, 0],
  ease: spring({ stiffness: 150, damping: 5 }),
  delay: stagger(75),
  loop: true,
});
```

相比"裸用"原生 WAAPI，Anime.js 的封装做了这些改进：合理默认值、多目标动画、CSS transform 各分量独立写、函数式取值、spring/自定义缓动支持、CSS 变量支持；`persist: true` 可显式保留动画终值（原生 WAAPI 动画结束后默认样式会"回弹"，除非设置 fill 模式）。高频取值场景（如跟随鼠标/滚轮）还可以用 `createAnimatable` 代替 `animate()`/`utils.set()`，进一步优化性能。

---

下一步进入[参考页](../reference)：查完整 API 速查表、v3→v4 对照与选型对比表。
