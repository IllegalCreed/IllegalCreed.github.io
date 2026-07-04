---
layout: doc
outline: [2, 3]
---

# 过渡与交互：transition / zoom / drag / brush 与 tooltip 范式

> 基于 D3.js v7.9（d3-transition / d3-zoom / d3-drag / d3-brush）· 核于 2026-07

## 速查

- **transition 基础**：`selection.transition([name])` 返回 transition（API 镜像 selection）；`transition.transition()` 链式接续下一段。
  - timing：`duration`（**默认 250ms**）、`delay`（默认 0；**`delay((d, i) => i * 10)` 错峰 stagger 是标准惯用法**）、`ease`（**默认 d3.easeCubic ≡ cubicInOut**）、`easeVarying(factory)` 按元素定制
- **自动插值（必考）**：`transition.attr/style` 按目标值类型选插值器——数字 → interpolateNumber；颜色/可转色字符串 → interpolateRgb；其余字符串 → interpolateString（抽出内嵌数字逐个插值）；值为 null = 过渡开始时移除属性；transform 属性走 SVG 专用插值。
- **attrTween**：自定义插值，factory 每元素执行一次、返回 `t => string`——**饼图更新的 `_current` 范式：插值数据而非 path 字符串**；`styleTween / textTween / tween(name, fn)` 同理；`transition.text(v)` 不插值（结束时设值）。
- **生命周期（必考）**：schedule（创建即排程，占据元素槽位）→ start → 每帧 tween → end。
  - **同一元素上同名过渡互相取代**：新过渡 start 时中断旧的活动过渡、取消排队的——「transition 被静默中断」坑的根源；**不同 name 可并行**
  - 事件 `on("start", fn)` / `on("end", fn)` / `on("interrupt", fn)`；手动 `selection.interrupt([name])`
  - `transition.remove()`：结束且无其他排程过渡时删除元素（exit 动画标配）；`transition.end()` 返回 Promise（可 await）
  - `d3.transition()` 在根元素上建过渡做全局协调；轴动画：`gx.transition().duration(750).call(d3.axisBottom(newX))`
- **行为共同范式**：zoom / drag / brush 都通过 **`selection.call(behavior)` 安装**（状态存元素上）；`behavior.on(type, fn)` 监听；`filter()` 过滤输入（zoom/drag 默认忽略右键，zoom 额外允许 ctrl+wheel）。
- **zoom**：
  - transform 结构 `{k, x, y}`：点变换 `[x·k + tx, y·k + ty]`；方法 `apply / invert / applyX / invertX / scale / translate / toString()`（输出 `translate(x,y) scale(k)` 可直接给 attr）
  - **两条应用路线（必考）**：① 几何缩放 `g.attr("transform", event.transform)`（内容整体缩放，文字/描边跟着变粗）；② 语义缩放 **`event.transform.rescaleX(x)`** 得新 scale 重绘轴与内容（文字不变形；不改原 scale，返回副本）
  - `scaleExtent([min, max])` 限缩放（**只约束交互与便捷方法，不约束显式 zoom.transform**）；`translateExtent` 限平移（世界边界）；`extent` 视口
  - 程序化：`selection.call(zoom.transform, d3.zoomIdentity)`（可在 transition 上调用做平滑归位）、`zoom.scaleBy / scaleTo / translateBy / translateTo`
  - 读状态 `d3.zoomTransform(node)`；`d3.zoomIdentity` = k=1、平移 0 的恒等变换
  - `wheelDelta` 自定义滚轮速率；禁双击缩放 `.on("dblclick.zoom", null)`
- **drag**：
  - 事件对象 `{x, y, dx, dy, subject, identifier, active, sourceEvent}`；坐标相对 `container()`（默认父节点，Canvas 场景设自身）
  - **`subject()`** 决定被拖对象：默认返回 datum（无 datum 时 `{x: event.x, y: event.y}`）；Canvas/force 用 `simulation.find` / `quadtree.find`
  - `event.on("drag", fn)` 注册仅本次手势的临时监听；`clickDistance(n)` 区分拖拽与点击
- **brush**：`d3.brush()`（二维）/ `brushX()` / `brushY()`（一维）；**必须 call 在 `g` 元素上**。
  - `brush.extent([[x0,y0],[x1,y1]])` 可刷范围（默认取 SVG viewBox/宽高）；事件 start / brush / end
  - **`event.selection` 是像素坐标**：二维 `[[x0,y0],[x1,y1]]`、brushX `[x0, x1]`、**null = 清空（必判空）**
  - **转数据域必须过 scale.invert**：`event.selection.map(x.invert)`；程序化 `g.call(brush.move, ...)`（可配 transition）、`brush.clear(g)`；读状态 `d3.brushSelection(g.node())`
  - 防反馈循环惯用法：`if (!event.sourceEvent) return;`（程序化 move 触发的事件没有 sourceEvent）
- **tooltip 标准三件套（必考）**：`d3.pointer(event)` 取像素 → `x.invert(px)` 反算数据 → **`d3.bisector(d => d.date).center(data, x0)`** 二分出最近点索引。
- **坑**：
  - 快速 hover 动画被掐：同元素同名过渡互斥——命名分道或链式串行
  - brush 回调没判 null 直接 `map(invert)`：点击空白清空时崩
  - zoom 的 scaleExtent 拦不住程序化 `zoom.transform`；缩到极限后滚轮放行给页面滚动

## 一、transition：让属性变化有时间维度

```js
d3.selectAll("circle")
  .transition("grow")            // 可命名；API 镜像 selection
    .duration(750)               // 默认 250ms
    .delay((d, i) => i * 10)     // 错峰 stagger：标准惯用法
    .ease(d3.easeCubic)          // 默认值，即 cubicInOut
    .attr("r", d => r(d.value))
  .transition()                  // 链式接续下一段
    .attr("fill", "orange");
```

- `easeVarying(factory)` 可按元素返回不同缓动函数。
- `d3.transition()` 在根元素（html）上建过渡，用于全局协调多个选择集。

## 二、自动插值与 attrTween

`transition.attr/style` 按**目标值类型**自动挑插值器（必考）：

| 目标值 | 插值器 |
| --- | --- |
| 数字 | interpolateNumber |
| 颜色 / 可转色字符串 | interpolateRgb |
| 其余字符串 | interpolateString（抽出内嵌数字逐个插值） |
| null | 不插值，过渡开始时移除该属性 |
| transform 属性 | SVG transform 专用插值 |

字符串插值对 path 有个著名坑：两端 path 结构不同（点数不同）时插出乱形——**正确做法是 attrTween 在数据空间插值、每帧重算 path**：

```js
// 弧形补间（饼图更新的标准写法：插值数据而非 path 字符串）
path.transition().attrTween("d", function(d) {
  const i = d3.interpolate(this._current, d); // 从上一次的数据插到新数据
  this._current = i(0);                       // 记住当前数据，供下次过渡
  return t => arc(i(t));                      // 每帧用插值后的数据重算 path
});

// factory 每元素执行一次，返回 t => string
transition.attrTween("fill", () => t => `hsl(${t * 360},100%,50%)`);
```

- `styleTween / textTween / tween(name, fn)` 同理；注意 `transition.text(v)` **不插值**，结束时一次性设值。
- 专家级坑：interpolateString 抽数字时，趋 0 的值会变成科学计数法（如 "1e-7"）破坏 path 字符串——官方建议从 1e-6 起；`interpolateObject/Array` 无防御拷贝（复用同一对象）。

## 三、生命周期与中断（必考）

过渡生命周期：**schedule（创建即排程，占据元素上的槽位）→ start → 每帧 tween → end**。

- **同一元素上同名过渡互相取代**：新过渡 start 时中断旧的活动过渡、取消排队中的——快速连续 hover 时动画「被静默掐掉」的根源。
  - 需要串行：`.transition().transition()` 链式接续。
  - 需要并行：给过渡起不同 name，互不干扰。
  - 排查：监听 `on("interrupt", fn)`；手动打断用 `selection.interrupt([name])`。
- `transition.remove()`：过渡结束且元素无其他排程过渡时删除元素——exit 动画标配。
- `transition.end()` 返回 Promise，可 `await` 动画完成再做下一步。
- **轴动画**：axis 支持把 transition 当渲染上下文——`gx.transition().duration(750).call(d3.axisBottom(newX))`。

## 四、行为对象的共同范式

zoom / drag / brush 是三个「行为」对象，共享同一套用法：

- **`selection.call(behavior)` 安装**——行为把状态存在元素上。
- `behavior.on(type, fn)` 监听行为事件（回调同样是 v6 的 `(event, d)` 签名）。
- `filter()` 过滤输入：zoom / drag 默认忽略右键，zoom 额外允许 ctrl+wheel。

## 五、zoom：几何缩放 vs 语义缩放

transform 是 `{k, x, y}`（缩放 + 平移），把点 [x, y] 变换到 `[x·k + tx, y·k + ty]`；`toString()` 输出 `translate(x,y) scale(k)`，可直接赋给 transform 属性。

```js
const zoom = d3.zoom()
    .scaleExtent([1, 8])          // 只约束交互与便捷方法，拦不住显式 zoom.transform！
    .on("zoom", (event) => {
      // 路线①：几何缩放——内容整体缩放（文字/描边跟着变粗）
      g.attr("transform", event.transform);

      // 路线②：语义缩放——得到新 scale 重绘轴与内容（文字不变形）
      const zx = event.transform.rescaleX(x); // 不改原 scale，返回副本
      gx.call(d3.axisBottom(zx));
    });

svg.call(zoom)
   .on("dblclick.zoom", null);    // 禁双击缩放
```

- `translateExtent([[x0,y0],[x1,y1]])` 限平移（世界边界）；`extent` 设视口。
- 程序化控制：`selection.call(zoom.transform, d3.zoomIdentity)` 归位（在 transition 上调用即平滑飞行）；`zoom.scaleBy / scaleTo / translateBy / translateTo`；读当前状态 `d3.zoomTransform(node)`；`d3.zoomIdentity` 是 k=1、平移 0 的恒等变换。
- `wheelDelta` 自定义滚轮缩放速率。
- **坑**：`scaleExtent` 不约束程序化 `zoom.transform`；缩放到极限后滚轮事件会放行给页面滚动（需要自己 preventDefault）。

## 六、drag：subject 与临时监听

- 事件对象字段：`{x, y, dx, dy, subject, identifier, active, sourceEvent}`；坐标相对 `container()`（默认父节点；Canvas 场景设为自身）。
- **`subject()`** 决定「被拖的是谁」：默认返回 datum（无 datum 时为 `{x: event.x, y: event.y}`）；Canvas / force 场景用 `simulation.find` / `quadtree.find` 找最近点当 subject。
- `event.on("drag", fn)` 可注册**仅本次手势**生效的临时监听。
- `clickDistance(n)`：位移小于 n 视为点击——区分拖拽与点击。
- drag 与力导向仿真组合的三步范式（alphaTarget / fx / fy）见[力导向图](./force-simulation)。

## 七、brush：像素坐标与判空

```js
const brush = d3.brushX()        // 一维横向；d3.brush() 二维；brushY() 纵向
    .extent([[margin.left, margin.top], [width - margin.right, height - margin.bottom]])
    .on("end", (event) => {
      if (!event.sourceEvent) return;  // 防程序化 move 触发的反馈循环
      if (!event.selection) return;    // null = 清空（点击空白），必判！
      const [d0, d1] = event.selection.map(x.invert); // 像素 → 数据域
      // …… 按 [d0, d1] 过滤 / 重绘
    });

svg.append("g").call(brush);     // brush 必须 call 在 <g> 上
```

- **`event.selection` 是像素坐标**：二维 `[[x0,y0],[x1,y1]]`、brushX `[x0, x1]`；**null 表示清空**。
- 程序化：`g.call(brush.move, [[…]])`（可配 transition 动画）、`brush.clear(g)`；读状态 `d3.brushSelection(g.node())`。

## 八、折线图 tooltip 标准范式（必考三件套）

**pointer → invert → bisector.center**：

```js
const bisect = d3.bisector(d => d.date).center; // 有序数组二分，center 直接给最近点

svg.on("pointermove", (event) => {
  const px = d3.pointer(event)[0]; // 1. 鼠标像素坐标
  const x0 = x.invert(px);         // 2. 反算成数据值（Date）
  const i = bisect(data, x0);      // 3. 二分找最近数据点的索引
  const d = data[i];
  tooltip.attr("transform", `translate(${x(d.date)},${y(d.close)})`);
});
```

- `d3.bisector(accessor)` 生成 `{left, right, center}` 三个查找器；`center` 直接返回**最近点**索引，是 tooltip 场景的首选。
- `bisectLeft` 与 `bisectRight` 的差别只在等值落在哪一侧：left 以 `v < x` 与 `v >= x` 为分界，right 以 `v <= x` 与 `v > x` 为分界。

## 九、易错点

- **快速 hover 动画消失**：同名过渡互相中断——命名过渡分道，或链式串行。
- **brush 回调直接 map(invert)**：selection 为 null（点击空白清空）时崩——先判空。
- **程序化 zoom 超出 scaleExtent**：它只约束交互，不约束 `zoom.transform`。
- **`event.sourceEvent` 判空防循环**：程序化 `brush.move` / `zoom.transform` 触发的事件没有 sourceEvent，回调里先判断可避免「事件触发事件」的死循环。

## 下一步

至此选择集、比例尺、形状、力导向、交互五大机制全部打通——模块清单、数据处理 API 与易错点合集见[参考](../reference)。
