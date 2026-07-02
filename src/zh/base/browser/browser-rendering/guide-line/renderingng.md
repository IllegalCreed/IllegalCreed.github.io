---
layout: doc
outline: [2, 3]
---

# 现代架构 RenderingNG

> 基于 Chromium 现代架构 · 核于 2026-07

## 速查

- **RenderingNG** = Chromium 渲染架构的整体重写（2021 年宣布完成主体），经典 5 步进化为 **12 阶段管线**
- **property trees 四棵树**：**transform / clip / effect / scroll**，取代「单一 layer tree 承载一切」的旧心智
- 每个元素有 **property tree state 四元组**——最近的 transform/clip/effect/scroll 祖先节点，决定它怎么被变换/裁剪/加效果/滚动
- **LayoutNG**：layout 的输出是**不可变 fragment tree**——禁向上引用、可整棵复用，增量布局只重建「脊柱」
- **CompositeAfterPaint（CAP）**：**先 paint 后分层**——layerize 在合成器侧基于 **paint chunks** 决策；修正旧文「主线程在 layout 后建 layer tree」的说法
- paint 产出 **display list**（可被 Skia 栅格化的 display items），按 property tree state 分组为 **paint chunks**
- layerize 策略：**默认合并** chunk，只把「合成器要独立动的」（合成器滚动/transform 动画）拆成独立层——反图层爆炸
- **Viz 进程**：display compositor thread **聚合**所有渲染进程 + 浏览器 UI 的 compositor frame；GPU main thread 负责**GPU 光栅化**与 draw
- 管线阶段**按需跳过**：纯视觉效果动画与滚动可跳过 layout/pre-paint/paint，**完全在合成器线程运行**
- 定调：**经典 5 步仍是有效心智模型**（MDN/面试通用）；RenderingNG 是引擎实现层的现代化，两套话语用映射表对齐

## 一、为什么要重写：经典模型的实现债

2018 年的 Inside Browser 系列描述的管线是：主线程 layout 之后遍历 layout tree 生成 **layer tree**，再把「图层 + 绘制顺序」交给合成器。这套「**先分层、后绘制**」的实现攒了不少债：

- 分层决策发生在 paint 之前，主线程必须提前猜「谁会动」，猜错就**图层爆炸**（层堆内存）或**错失合成机会**（该独立的没独立）。
- transform/clip/scroll 等语义全都挂在 layer tree 上，层的增删会连坐一大片状态。
- 布局对象可变、互相引用，增量布局和并行化都难做。

RenderingNG 的答案是把「内容」与「怎么合成」解耦成独立数据结构（property trees、display list、fragment tree），并把管线拆成可单独跳过的 12 个阶段。

## 二、12 阶段管线一览

架构文档给出的完整阶段序列（前段在渲染进程，后段在 Viz 进程）：

| # | 阶段 | 干什么（官方定义要点） | 主要位置 |
| --- | --- | --- | --- |
| 1 | **animate** | 按声明式时间线随时间修改计算样式、**改写 property trees** | 主线程 / 合成器 |
| 2 | **style** | 把 CSS 应用到 DOM，产出 computed styles | 主线程 |
| 3 | **layout** | 确定元素尺寸位置，产出**不可变 fragment tree** | 主线程 |
| 4 | **pre-paint** | 计算 **property trees**；按需失效旧的 display list 与 GPU 纹理瓦片 | 主线程 |
| 5 | **scroll** | 更新文档/滚动容器的滚动偏移——**通过改写 property trees** | 主线程 / 合成器 |
| 6 | **paint** | 产出 **display list**：描述如何从 DOM 栅格化出 GPU 纹理瓦片 | 主线程 |
| 7 | **commit** | 把 property trees + display list **拷贝**给合成器线程 | 主→合成器 |
| 8 | **layerize** | 把 display list 切成 **composited layer list**，供独立栅格化/动画 | 合成器线程 |
| 9 | **raster / decode / paint worklets** | 把 display list、编码图片、paint worklet 代码变成 **GPU 纹理瓦片** | 合成器 → **Viz（GPU）** |
| 10 | **activate** | 生成 compositor frame（如何摆放绘制 GPU 瓦片 + 视觉效果） | 合成器线程 |
| 11 | **aggregate** | 把**所有**可见 compositor frame 合并成单一全局帧 | **Viz** |
| 12 | **draw** | 在 GPU 上执行聚合帧，产出屏幕像素 | **Viz（GPU）** |

两条贯穿性设计：

- **阶段可跳过**：「不需要的管线阶段可以跳过」——纯视觉效果动画与滚动「可以跳过 layout、pre-paint 和 paint」，此时**整段流程都在合成器线程**，主线程零参与。这是经典模型「transform 动画便宜」结论在新架构下的精确版本。
- **流水线并行**（pipeline parallelization）：滚动/动画可以与主线程的下一轮更新**同时**进行，辅以多缓冲（multiple buffering）掩盖延迟。

## 三、property trees：四棵树取代一棵 layer tree

### 3.1 是什么

每个文档有**四棵独立的属性树**：

| 树 | 承载 | 例子 |
| --- | --- | --- |
| **transform tree** | CSS transform 与滚动平移 | `transform: translateX(...)`、滚动偏移 |
| **clip tree** | overflow 裁剪 | `overflow: hidden` 的裁剪矩形 |
| **effect tree** | 视觉效果 | opacity、filter、mask、blend mode、clip-path |
| **scroll tree** | 滚动信息与滚动链 | 谁可滚、怎么链式传递（scroll chaining） |

树的拓扑是「**DOM 的稀疏表示**」：页面有三个 overflow 裁剪，clip tree 就三个节点。每个节点代表某个 DOM 元素施加的一种滚动或视觉效果（一个元素多种效果就对应多个节点）；树与树之间还有链接，编码「先 transform 还是先 filter」这类**应用顺序**。

每个元素（以及每段 display list、每块 GPU 瓦片）都携带 **property tree state 四元组**——「作用于它的最近 transform/clip/effect/scroll 祖先节点」。要算某元素的屏上位置？沿四棵树向上乘变换即可，**不需要遍历庞大的 DOM/layer 结构**。

### 3.2 为什么是四棵而不是一棵

官方解释：**「滚动只作用于其包含的子树」**——`position: absolute/fixed` 元素经常**逃出**祖先滚动器；而其他视觉效果作用于整棵 DOM 子树。两类语义的拓扑天然错位，硬塞进一棵树（旧 layer tree 的做法）就得靠层的裂变去表达，这正是图层爆炸的病根之一。

分离后收益广泛（官方列举）：分层与绘制解耦、决策最优合成策略、测量 IntersectionObserver 几何、跳过离屏元素的工作、精准失效 paint/raster、测量 layout shift 与 LCP。

## 四、LayoutNG：不可变 fragment tree

layout 阶段的输出不再是可变的布局对象网，而是**不可变 fragment tree**：表示所有元素的位置与尺寸（**不含 transform**——transform 归 property trees 管，这本身就是解耦的体现）。

不可变性靠两条纪律保证：

- **禁止向上引用**：子 fragment 不得指向父。
- **禁止数据上浮**：子只读自己子树的信息。

换来的能力：

- **增量布局**：「大多数布局是增量更新」，理想情况下工作量只与实际变化成正比——**复用旧树的绝大部分，只重建从变化点到根的「脊柱」**。
- **未来空间**（官方展望）：不可变树可以跨线程传递、为平滑布局动画生成多棵树、做**并行推测布局**。
- **内联内容平面化**：行内文本用**平面列表**（DFS 序的 `(对象, 后代数)` 元组）而非树，配 inline cursor 游标 API——遍历只是数组偏移递增，**快且省内存**。

## 五、CompositeAfterPaint：先画完，再决定分层

对照管线表第 6–8 步：**paint（主线程）→ commit → layerize（合成器线程）**。分层决策发生在 **paint 之后**、由合成器侧基于绘制产物做出——这个项目名就叫 **CompositeAfterPaint（CAP）**。

> 修正旧文心智：2018 版 Inside Browser part3 写的是「主线程遍历 layout tree 创建 layer tree」（DevTools 老时间线里的 Update Layer Tree）。**现代 Chromium 里主线程不再产出 layer tree**——它产出 display list + property trees；「分几层」是 layerize 阶段对 paint chunks 的后置决策。

具体机制（数据结构文档）：

- **display item**：可被 **Skia** 栅格化的低级绘制命令（画个边框、画段背景）。paint 阶段按 **CSS painting order** 遍历 layout tree/fragments，产出**自后向前**排序的 display item list；没变的 item 直接**复用**上次的，整个 stacking context 没变就整段跳过。
- **paint chunk**：绘制遍历同时记录当前 property tree state，把**共享同一四元组状态**的连续 display items 分成一组。
- **layerize**：paint chunks 是它的输入。极端方案「每 chunk 一层」会**迅速耗尽 GPU 内存**；官方策略是「**默认合并**，只把 property tree state 预期会在合成器线程变化的 chunk（合成器滚动、合成器 transform 动画）保持独立」。

对写代码的影响：分层更聪明、更晚、更少误伤——但「层有内存代价、别滥用 `will-change`」的纪律不变，只是引擎替你兜住了更多次优决策。

## 六、Viz 进程：聚合与 GPU 光栅化

经典文里 compositor frame「经 IPC 交给浏览器进程、再送 GPU」；现代架构中这份工作独立成 **Viz 进程**（全系统一个）：

- **display compositor thread**：把**每个渲染进程 + 浏览器进程**提交的 compositor frame **聚合（aggregate）** 成单一全局帧。它必须时刻保持响应，不被 GPU 主线程拖慢。
- **GPU main thread**：把 display list 与视频帧**栅格化成 GPU 纹理瓦片**（**GPU 光栅化是默认路径**，光栅任务从渲染进程发到 Viz、在 GPU 上执行，用 sync token 异步衔接），并执行最终 **draw**。

聚合怎么拼多进程内容？靠 **surface**：每个 compositor frame 提交时带 **surface ID**，别的帧用 **surface draw quad** 按 ID 引用嵌入（跨站 iframe 就是这样嵌进父页帧里的）。聚合阶段把引用替换为真实内容，并顺手优化掉离屏/多余的中间纹理。帧内部则是 **render pass（quad 列表，只有指令没有像素）**，quad 类型包括 GPU 瓦片、纯色、纹理（video/canvas）与 surface 引用。

站点隔离由此贯通渲染层：**不同站点必然在不同渲染进程**（OOPIF），各自产帧、Viz 统一拼装——性能隔离 + 安全隔离一次拿到（进程模型详见[浏览器架构](../../browser-architecture/)）。

## 七、术语映射：两套话语对上号

| 经典模型（2018 文 / MDN） | RenderingNG 现代实现 | 变化要点 |
| --- | --- | --- |
| render tree / layout tree | **不可变 fragment tree**（LayoutNG） | 可变对象网 → 不可变、可复用、可增量 |
| paint records | **display list**（display items → paint chunks） | 指令化不变，增加按 property tree state 分组 |
| layer tree（主线程、layout 后创建） | **composited layer list**（合成器 layerize、paint 后决策） | **CompositeAfterPaint**：先画后分层 |
| layer tree 顺带承载 transform/clip/scroll | **property trees 四棵树** | 语义与「层」解耦，反图层爆炸 |
| compositor frame 交浏览器进程转 GPU | 提交给 **Viz**，display compositor 聚合后 draw | 合成/绘制独立成进程 |
| 渲染进程内 raster threads 栅格化 | **Viz 进程 GPU 光栅化**（默认） | 光栅上 GPU、跨进程调度 |
| 「一帧」的 style→layout→paint→composite | **12 阶段**：animate…draw，可按需跳过 | 粒度更细、跳过规则显式化 |

**定调**：经典 5 步 CRP 仍然是**有效的心智模型**——MDN 用它讲授、面试用它提问、性能直觉靠它建立（代价链 layout > paint > composite 在新架构下依然成立，且「可跳过阶段」把它变得更精确）。RenderingNG 是**引擎实现层**的现代化：当你打开 DevTools 看到 pre-paint/layerize，或读到 property trees 时，知道它们落在旧模型的哪个格子里即可。

## 小结

- RenderingNG 把经典管线细化为 **12 阶段**（animate→draw），核心设计是**数据结构解耦 + 阶段可跳过**。
- **property trees**（transform/clip/effect/scroll）把「怎么动/裁/加效果/滚」从 layer tree 中拆出；元素凭四元组状态定位，滚动与动画只改树节点。
- **LayoutNG 不可变 fragment tree**：禁向上引用换来增量布局与并行化空间。
- **CompositeAfterPaint**：paint 产出 display list/paint chunks，**合成器在 paint 后**做分层，默认合并、按需独立。
- **Viz 进程**统一聚合各渲染进程的 compositor frame 并在 GPU 上光栅化与绘制；surface ID 串起跨进程嵌套。
- 经典模型管直觉，RenderingNG 管真相——速查表与术语映射见[参考](../reference)。
