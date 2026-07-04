---
layout: doc
outline: [2, 3]
---

# 力导向图：forceSimulation 全解与拖拽

> 基于 D3.js v7.9（d3-force@3）· 核于 2026-07

## 速查

- **最小骨架**：`d3.forceSimulation(nodes)` + `.force(name, force)` 注册力 + `.on("tick", 重绘)`。
  - 仿真只负责迭代出 x/y；每个 tick 把坐标写回 DOM（或 Canvas 全量重绘）是你的事
  - 常用三件：`forceLink(links).id(d => d.id)` + `forceManyBody()` + `forceCenter(w/2, h/2)`
- **仿真会改写传入数组（不纯）**：
  - 每个 node 被写入 `index / x / y / vx / vy`
  - link 的 `source / target` 可先给索引或 id 字符串（配 `forceLink().id(d => d.id)`），初始化后**被替换成节点对象引用**——tick 里直接 `d.source.x`
- **alpha 机制（必考）**：alpha 是「温度」，从 1 衰减，**`alpha < alphaMin`（默认 0.001）时计时器停**：
  - 每 tick：`alpha += (alphaTarget - alpha) × alphaDecay` → 各力施加改速度 → 速度乘 `1 - velocityDecay`（默认 0.4，摩擦）→ 位置 += 速度
  - alphaDecay 默认 ≈ 0.0228（= 1 − 0.001^(1/300)）——**约 300 tick 自然停机**
  - **`alphaTarget(0.3)`**：设一个高于 alphaMin 的目标温度，仿真持续「加热」不停机（拖拽时用）
- **力清单**：
  - **forceManyBody**：全局 n 体力，strength 负排斥 / 正吸引（**默认 -30**）；Barnes–Hut 四叉树近似 O(n log n)；`theta`（默认 0.9，越小越准越慢）、`distanceMin / distanceMax`（Max 设有限值可局部化 + 提速）
  - **forceLink**：连线弹簧；`distance`（默认 30）、`strength` 默认 `1 / min(count(source), count(target))`（自动弱化高连接度节点的边，稳定布局）、`iterations` 提刚性
  - **forceCenter**：**平移整体**使质心落到 (x, y)——不是弹力、保持相对位置、不改速度（strength 默认 1）
  - **forceX / forceY**：把**每个节点**拉向目标坐标的弹性力（strength 默认 0.1）；forceRadial 拉向圆环——**与 forceCenter 三者区分必考**
  - **forceCollide**：圆碰撞防重叠；`radius`（默认 1）、`strength`（0~1，默认 1）、`iterations`
- **静态布局**（不要动画、直接要结果）：
  - `simulation.stop()` 停内部计时器，再 `simulation.tick(300)` 手动步进
  - **手动 tick 不派发 "tick" 事件**——要自己取 x/y 一次性画
  - 大图把仿真放 Web Worker 离线算
- **拾取**：`simulation.find(x, y, radius)` 找最近节点（Canvas 场景必备）
- **拖拽三步范式（必考）**：
  - start：`simulation.alphaTarget(0.3).restart()` + `fx/fy = 当前坐标`
  - drag：`fx/fy = event.x/y`
  - end：`simulation.alphaTarget(0)` + `fx/fy = null`
  - fx/fy 非空时每 tick 强制 `x = fx`、速度清零；置 null 解除固定
- **坑**：
  - 拖完节点「僵死」= end 忘清 fx/fy（永远钉死）
  - 拖起来「不跟手」= start 忘 `restart()`（仿真是停的）
  - 手动 tick 后等 `on("tick")` = 白等（不派发事件）

## 一、最小骨架

```js
const simulation = d3.forceSimulation(nodes)
    .force("link", d3.forceLink(links).id(d => d.id)) // 连线弹簧（id 访问器解析字符串引用）
    .force("charge", d3.forceManyBody())              // 节点互斥（默认 -30）
    .force("center", d3.forceCenter(width / 2, height / 2)) // 整体居中
    .on("tick", () => {
      // 每一帧把最新坐标写回 DOM——画图仍然是你的事
      link
          .attr("x1", d => d.source.x)
          .attr("y1", d => d.source.y)
          .attr("x2", d => d.target.x)
          .attr("y2", d => d.target.y);
      node
          .attr("cx", d => d.x)
          .attr("cy", d => d.y);
    });
```

力导向的分工与 D3 其它模块一致：**simulation 只负责把 nodes 的坐标迭代到位**，tick 里把 x/y 写回 SVG（或 Canvas 全量重绘）由你完成。

## 二、仿真会改写你的数据（不纯）

`forceSimulation(nodes)` 与 `forceLink(links)` 都**就地修改**传入数组：

- 每个 node 被写入 `index / x / y / vx / vy`。
- link 的 `source / target` 初始化前可以是数组索引或 id 字符串（配 `.id(d => d.id)`），初始化后**被替换成节点对象引用**——所以 tick 里能直接写 `d.source.x`。

## 三、alpha：仿真的「温度」系统（必考）

alpha 是仿真的「温度」：从 1 开始衰减，**低于 alphaMin（默认 0.001）时内部计时器停止**。每个 tick 依次发生：

1. `alpha += (alphaTarget - alpha) × alphaDecay`（alphaTarget 默认 0）
2. 各注册力施加作用，修改节点速度
3. 速度乘以 `1 - velocityDecay`（默认 0.4，相当于摩擦）
4. 位置 += 速度

- alphaDecay 默认 ≈ 0.0228（即 1 − 0.001^(1/300)）——**约 300 个 tick 后自然停机**。
- **`alphaTarget(0.3)`**：把目标温度设到 alphaMin 之上，alpha 向 0.3 收敛而不归零——仿真持续运转。这正是拖拽交互「让全图保持活性」的机制。

## 四、力清单与三个「像但不同」

| 力 | 作用 | 关键参数 |
| --- | --- | --- |
| forceManyBody | 全局 n 体力：负 = 互斥，正 = 互吸 | strength 默认 **-30**；theta 默认 0.9；distanceMin / distanceMax |
| forceLink | 连线弹簧 | distance 默认 30；strength 默认 `1 / min(count(source), count(target))`；iterations |
| forceCenter | **平移整体**使质心落在 (x, y) | strength 默认 1 |
| forceX / forceY | **每个节点**被拉向目标坐标的弹性力 | strength 默认 0.1 |
| forceRadial | 把节点拉向指定圆环 | radius |
| forceCollide | 圆碰撞防节点重叠 | radius 默认 1；strength 0~1；iterations |

必考区分：

- **forceCenter 不是弹力**——它整体平移布局、保持节点相对位置、不修改速度；**forceX / forceY 才是把单个节点往目标拉**的弹性力（strength 仅 0.1，柔和）；**forceCollide** 则是通过迭代松弛解决重叠。
- **forceManyBody 的性能开关**：Barnes–Hut 四叉树近似把 n 体力降到 O(n log n)；`theta`（默认 0.9）越小越精确越慢；给 `distanceMax` 设有限值可把力「局部化」，大图显著提速。
- **forceLink 的默认 strength** `1 / min(count(source), count(target))` 自动弱化高连接度节点的边，让 hub 节点不被拽爆——布局稳定的隐藏功臣；`iterations` 调高可提升刚性。

## 五、静态布局与大图性能

```js
// 不要动画、直接要最终布局：停掉内部计时器，手动步进
simulation.stop();
simulation.tick(300); // 注意：手动 tick 不派发 "tick" 事件！
// 此时 nodes 里已是最终 x/y，自己取出来一次性画完
```

- **手动 tick 不触发 `on("tick")`**（必考坑）——静态布局要自己在 tick 后读坐标。
- 大图可以把仿真放进 **Web Worker** 离线计算，不阻塞主线程。
- Canvas 渲染没有 DOM 可命中，用 **`simulation.find(x, y, radius)`** 找鼠标最近的节点做拾取。

## 六、拖拽三步范式（必考）

```js
d3.drag()
  .on("start", (event) => {
    simulation.alphaTarget(0.3).restart();      // 加热并重启：其余节点才会让路
    event.subject.fx = event.subject.x;         // 用 fx/fy 把被拖节点钉住
    event.subject.fy = event.subject.y;
  })
  .on("drag", (event) => {
    event.subject.fx = event.x;                 // 跟随指针更新固定位置
    event.subject.fy = event.y;
  })
  .on("end", (event) => {
    simulation.alphaTarget(0);                  // 目标温度归零，自然降温停机
    event.subject.fx = null;                    // 解除固定，交还给仿真
    event.subject.fy = null;
  });
```

- **fx / fy 的语义**：非空时每个 tick 强制 `x = fx`、速度清零——节点被「钉」在指定位置；置 null 解除固定。
- 两个经典翻车：
  - **拖完节点僵死**：end 里忘清 fx/fy——节点被永远钉死。
  - **拖起来不跟手**：start 里忘 `restart()`——仿真停着，其它节点纹丝不动。

## 下一步

节点能拖了，让整张图「活」起来的通用机制——过渡动画、缩放、刷选与 tooltip——见[过渡与交互](./interaction-and-transition)。
