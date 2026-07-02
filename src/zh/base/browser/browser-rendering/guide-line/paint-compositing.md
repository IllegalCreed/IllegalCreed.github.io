---
layout: doc
outline: [2, 3]
---

# 绘制与合成

> 基于 Chromium 现代架构 · 核于 2026-07

## 速查

- **paint ≠ 直接画像素**：主线程遍历 layout tree 生成 **paint records**——「先画背景、再画文字、再画矩形」的绘制指令
- 绘制顺序遵循 CSS painting order，**自后向前（back-to-front）**；`z-index`/**stacking context** 决定次序，按 HTML 顺序硬画会画错
- 首次绘制画整屏；之后浏览器只**重绘受影响的最小区域**
- **合成（compositing）**：把页面拆成多个**图层（layer）分别栅格化**，在**合成器线程**拼成一帧
- 提升图层的典型来源：`<video>` / `<canvas>`、**opacity、3D transform、will-change** 等
- **`will-change`**：提示浏览器为将动的元素预建图层（如侧滑菜单）；但**层耗内存**，图层爆炸反而更慢——要实测
- 图层可能很大 → 切成**瓦片（tiles）**，栅格线程逐瓦片栅格化存入 **GPU 内存**，视口附近优先
- **draw quads**（瓦片位置信息）组成 **compositor frame**（一帧），经 IPC 提交、送 GPU 显示
- 合成器**不等样式计算、不等 JS**：滚动/合成器动画在主线程卡死时照样出帧
- **transform/opacity 动画便宜的原理**：跳过 layout + paint，只在合成器改图层变换——「仅合成的动画」是流畅性最佳实践

## 一、paint：从几何到绘制指令

layout 之后有了尺寸坐标，但还差一个信息：**先画谁**。paint 阶段主线程遍历 layout tree，产出 **paint records（绘制记录）**——Chrome 原文形容它是「绘制过程的记录，比如『先背景、然后文字、然后矩形』」。

注意这一步产出的是**指令**而非像素——真正生成像素的是后面的栅格化。这层拆分是现代渲染的关键设计：指令可以缓存、复用、跨线程搬运（RenderingNG 里它演化为 display list，见[现代架构](./renderingng)）。

### 1.1 绘制顺序：z-index 与 stacking context

Chrome 原文：「**按 HTML 标记顺序绘制而不考虑 z-index，会得到错误的渲染结果**」。绘制顺序由 CSS painting order 规范决定，整体**自后向前（back-to-front）**分层压画。前端侧对应两个概念：

- **`z-index`** 调整同一层叠上下文内的前后关系（负 z-index 会画到背景之后——所以 paint records 必须全局排序，不能按文档流一路画）。
- **stacking context（层叠上下文）** 是排序的作用域：`position` + `z-index`、`opacity < 1`、`transform`、`filter` 等都会创建它；上下文内的内容**作为整体**参与外层排序，内部 z-index 出不了这个门。

对写代码的影响：绘制阶段的失效粒度跟层叠结构相关——改一个元素的外观，同 stacking context 内与它重叠的内容可能一并重绘。z-index 混战不只难维护，也在给 paint 制造更大的失效面。

### 1.2 重绘的范围

MDN：**「首次加载时绘制整个屏幕；此后只重绘屏幕上受影响的区域」**——浏览器已优化为只重绘所需的最小区域。绘制本身「非常快」，单独的 repaint 很少是瓶颈；贵的是被 reflow 连坐（reflow → repaint → re-composite）和高频重绘大面积区域。

## 二、合成：把页面拆成图层

如果每次滚动、每帧动画都要重跑 paint + 栅格化，帧预算根本不够。Chrome 给出的答案：

> 「**合成（compositing）是把页面各部分拆分成多个图层、分别栅格化、再在一个独立线程——合成器线程（compositor thread）——里拼合成页面的技术**。滚动时图层已经栅格化好了，只需要合成一个新帧。动画同理：移动图层、合成新帧。」

也就是说：**栅格化的成果按「层」缓存，能用挪的就不重画**。

### 2.1 谁会成为图层

经典模型里，主线程遍历 layout tree 生成 **layer tree**（DevTools Performance 面板的「Update Layer Tree」步骤）。哪些内容会独立成层？MDN 给出的典型触发：

| 触发 | 说明 |
| --- | --- |
| `<video>`、`<canvas>` | 内容独立更新，天然适合单层 |
| `opacity`（动画/非 1 值场景） | 视觉效果可在合成时应用 |
| **3D `transform`**（`translateZ(0)` 一族） | 变换在合成时应用 |
| `will-change: transform` 等 | **显式提示**：这元素要动，请预建层 |
| position: fixed / sticky、overflow 滚动容器等 | 独立滚动/固定内容（实现相关） |

元素成层后**其子孙跟着进同层**，除非子孙自己又触发了成层条件。

### 2.2 `will-change`：收益与图层爆炸

Chrome 的建议场景：**应该独立成层的页面部分**（例如侧滑菜单）如果没被自动分层，可用 `will-change` 提示浏览器。收益是动画开始时不用现做「成层 + 栅格化」的准备工作，避免首帧卡顿。

```css
/* 侧滑菜单：即将频繁 transform，动画前预建图层 */
.side-menu {
  will-change: transform;
}
```

但 Chrome 紧跟着泼冷水：

> 「你可能想给每个元素都加图层，但**跨过多图层做合成，可能比每帧重新栅格化页面小块更慢**」——**测量你的应用渲染性能至关重要**。

层的代价在**内存**（MDN：层提升性能但内存管理上昂贵，勿过度使用）：每层都要在 GPU 内存里持有栅格化纹理，移动端尤其敏感。这就是「图层爆炸（layer explosion）」问题——无脑 `will-change: transform` 全局撒网是反模式；动画结束后也应移除 `will-change` 释放资源。

## 三、栅格化与合成器帧

layer tree + 绘制顺序确定后，主线程把这些信息**提交（commit）给合成器线程**，此后的流水线不再需要主线程：

```
主线程        commit ──▶ 合成器线程：把大图层切成瓦片（tiles）
                              │  分发给多个栅格线程
                              ▼
              栅格线程（raster threads）：逐瓦片栅格化 → 存入 GPU 内存
                              │  视口内/附近的瓦片优先
                              ▼
              合成器线程：收集瓦片信息生成 draw quads → 组装 compositor frame
                              │  经 IPC 提交
                              ▼
              GPU：把合成器帧画上屏幕
```

三个术语（Chrome 原文定义）：

- **tiles（瓦片）**：图层可能很大（比如整页长的文档流），合成器线程把它切块，栅格化以瓦片为单位调度——**视口内及附近的优先**，远处的可以慢慢来。
- **draw quads**：记录「瓦片在内存中的位置 + 应该画到页面哪里」的信息（考虑页面合成）。
- **compositor frame（合成器帧）**：代表页面一帧的 **draw quads 集合**。它经 IPC 提交出去（经典文描述为交给浏览器进程、汇同浏览器 UI 的帧一起送 GPU；现代实现由 **Viz 进程**统一聚合，见[下下页](./renderingng)）。

滚动时发生什么？**合成器线程直接生成下一个合成器帧发给 GPU**——瓦片早就栅格化好了，改的只是拼装参数。

## 四、为什么 transform/opacity 动画不掉帧

把上面的机制串起来，就是那句最重要的结论（Chrome 原文）：

> 「合成的好处是**不需要主线程参与**。合成器线程**不需要等待样式计算或 JavaScript 执行**。这就是为什么**仅合成的动画（compositing-only animations）被认为是流畅性能的最佳选择**。如果 layout 或 paint 需要重新计算，主线程就必须卷进来。」

对照三条动画路径：

| 动画属性 | 重跑的阶段 | 执行线程 | 主线程卡顿时 |
| --- | --- | --- | --- |
| `width` / `top` / `margin` | layout + paint + composite | 主线程为主 | **动画冻结** |
| `background` / `color` / `box-shadow` | paint + composite | 主线程为主 | **动画冻结** |
| **`transform` / `opacity`**（已成层） | 仅 composite | **合成器线程** | **照常丝滑** |

```css
/* ❌ 走全管线：每帧 layout+paint，主线程一忙就掉帧 */
.bad {
  transition: left 0.3s, width 0.3s;
}

/* ✅ 仅合成：合成器改图层变换矩阵/不透明度，跳过 layout 与 paint */
.good {
  transition: transform 0.3s, opacity 0.3s;
}
```

这也是各种动画军规的原理出处：位移用 `translate` 不用 `top/left`，缩放用 `scale` 不用改 `width`，显隐过渡用 `opacity` 不用改 `height`。滚动流畅的原理同源——合成器不等 JS，但一个不当的事件监听能把它拖回主线程，这是[下一页](./frame-input)的主题。

## 小结

- paint 产出**绘制指令**（paint records），按 CSS painting order 自后向前排序；z-index/stacking context 决定次序与失效粒度。
- 合成 = 分层 + 各层独立栅格化 + 合成器线程拼帧；滚动和合成器动画只动拼装参数，不重画内容。
- 图层来源：video/canvas、opacity、3D transform、`will-change` 等；**层耗 GPU 内存**，图层爆炸反噬性能——预建要节制、用完要撤。
- 栅格化按**瓦片**调度（视口优先），产物经 **draw quads → compositor frame** 送 GPU。
- `transform`/`opacity` 动画便宜的本质：**跳过 layout+paint，全程合成器线程，不等主线程 JS**。
- 帧预算怎么分、输入事件怎么进来：[帧生命周期与输入](./frame-input)。
