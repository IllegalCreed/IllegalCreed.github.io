---
layout: doc
outline: [2, 3]
---

# SVG 与 Draggable：形变、描边、路径运动与拖拽

> 基于 Anime.js v4.5（npm `animejs@4.5.0`，2026-06-22 发布）· 核于 2026-07

## 速查

- **SVG 是 v4 的特色能力**：三个工具函数覆盖形变（`svg.morphTo()`）、描边（`svg.createDrawable()`）、路径运动（`svg.createMotionPath()`），都从 `import { svg } from 'animejs'` 具名导入。
- **`morphTo(shapeTarget, precision=0.33)`**：形状变形，目标类型限定 `SVGPathElement`/`SVGPolylineElement`/`SVGPolygonElement`；`precision` 为 0 时不做点外推，值越大过渡越平滑；返回值直接赋给 `points`（或 `d`）属性动画。
- **`createDrawable(target)`**：线条绘制，目标类型 `SVGLineElement`/`SVGPathElement`/`SVGPolylineElement`/`SVGRectElement`；返回代理元素数组，暴露一个额外的 `draw` 虚拟属性（`"start end"` 语法，两个 0~1 的值）。
- **`draw` 语法示例**：`'0 0'` = 完全不显示，`'0 1'` = 完整显示，`'1 1'` = 完全隐藏——比 v3 手工算 `stroke-dashoffset` 直观得多。
- ⚠️ **`vector-effect: non-scaling-stroke` 会拖慢 `createDrawable` 性能**：每帧要重算路径缩放系数。
- **`createMotionPath(path, offset=0)`**：路径运动，返回 `{translateX, translateY, rotate}` 三个映射值，用扩展运算符 `...` 直接铺进 `animate()` 配置，元素会沿路径坐标运动并自动旋转对齐切线方向。
- **SVG 描边动画不用再手算 `stroke-dashoffset`**：v3 常见套路是手动读 `getTotalLength()` 再算 dashoffset，v4 用 `draw:"start end"` 虚拟属性直接表达"画到哪儿"，思路更接近声明式。
- **`createDraggable(target, options)`**：一行代码即可让元素可拖拽，默认无约束容器。
- **Axes 参数**（x/y 各自独立配置）：`snap`（吸附点/间隔）、`modifier`（拖拽值再加工）、`mapTo`（把拖拽量映射到别的属性，比如映射到 `rotate` 实现拖拽转盘）。
- **Settings**：`trigger`（拖拽触发元素，可与容器分离）、`container` + `containerPadding`（边界约束）、`containerFriction`/`releaseContainerFriction`（拖拽中/释放后的越界摩擦）、`releaseMass`/`releaseStiffness`/`releaseDamping`（松手后弹簧回弹物理）、`velocityMultiplier`/`minVelocity`/`maxVelocity`（惯性速度换算与钳制）、`releaseEase`、`dragSpeed`、`dragThreshold`、`scrollThreshold`/`scrollSpeed`（拖到容器边缘自动滚动）、`cursor`。
- ⚠️ **`containerFriction` vs `releaseContainerFriction` 是两个独立生效时机的参数**：前者作用于拖拽过程中越界的阻尼手感，后者作用于松手后越界回弹的阻尼手感，命名相似但完全不同，出题/踩坑高发点。
- **回调**：`onGrab`/`onDrag`/`onUpdate`/`onRelease`/`onSnap`/`onSettle`/`onResize`/`onAfterResize`。
- **方法**：`disable`/`enable`/`setX`/`setY`/`animateInView`/`scrollInView`/`stop`/`reset`/`revert`/`refresh`。
- **下一步**：进入 [ScrollObserver / utils / eases](./scroll-utils-eases)，看滚动联动、工具函数与性能配置。

## 一、SVG 动画总览：v4 的三个特色能力

Anime.js v4 在 SVG 动画上提供了三个专项工具函数，都从 `import { svg } from 'animejs'` 具名导入：**形状变形**（`morphTo`）、**线条绘制**（`createDrawable`）、**路径运动**（`createMotionPath`）。这三个能力共同的设计取向是"声明式表达意图"，而不是像 v3 时代那样手工计算路径几何——这也是 v4 相较 v3 在 SVG 领域最大的体验升级。

```javascript
import { animate, svg, utils } from 'animejs';

// ① morphTo：形状变形（path 的 d / polygon,polyline 的 points）
const [$path1, $path2] = utils.$('polygon');
animate($path1, { points: svg.morphTo($path2), ease: 'inOutCirc', duration: 500 });

// ② createDrawable：线条绘制（stroke line-drawing）
animate(svg.createDrawable('.line'), {
  draw: ['0 0', '0 1', '1 1'],    // "start end"，两个 0~1 的值
  ease: 'inOutQuad',
  duration: 2000,
});

// ③ createMotionPath：元素沿路径运动
const carAnim = animate('.car', {
  ease: 'linear',
  duration: 5000,
  loop: true,
  ...svg.createMotionPath('path'),   // 展开 {translateX, translateY, rotate} 三个映射属性
});
```

## 二、morphTo()：形状变形

`svg.morphTo(shapeTarget, precision=0.33)` 把一个 SVG 图形的轮廓变形为另一个的轮廓：

- **目标类型限定**：`SVGPathElement`/`SVGPolylineElement`/`SVGPolygonElement`——也就是说只有 `<path>`、`<polyline>`、`<polygon>` 三种元素之间可以互相 `morphTo`。
- **`precision` 参数**：为 0 时不做点外推，值越大过渡越平滑（默认 `0.33`）。
- **返回值**用法：直接赋给 `points`（`<polygon>`/`<polyline>`）或 `d`（`<path>`）属性做动画，不需要额外转换。

## 三、createDrawable()：线条绘制

`svg.createDrawable(target)` 让"画线"这个动作变成声明式：

- **目标类型**：`SVGLineElement`/`SVGPathElement`/`SVGPolylineElement`/`SVGRectElement`，也就是 `<line>`、`<path>`、`<polyline>`、`<rect>`。
- **返回值**：一个代理元素数组，暴露一个额外的 `draw` 虚拟属性，语法是 `"start end"`（两个 0~1 的值）：`'0 0'` 表示完全不显示，`'0 1'` 表示完整显示，`'1 1'` 表示完全隐藏（从头画到尾后又整段消失）。

```javascript
animate(svg.createDrawable('.line'), {
  draw: ['0 0', '0 1', '1 1'],
  ease: 'inOutQuad',
  duration: 2000,
});
```

::: tip 不用再手算 stroke-dashoffset
v3 常见套路是手动读 `getTotalLength()` 再计算 `stroke-dashoffset`，v4 用 `draw:"start end"` 虚拟属性直接表达"画到哪儿"，思路更接近声明式、代码量也更少。
:::

::: warning vector-effect: non-scaling-stroke 会拖慢性能
官方提示给用了 `createDrawable` 的元素加 `vector-effect: non-scaling-stroke` 会拖慢性能，因为每帧都要重算路径的缩放系数。
:::

## 四、createMotionPath()：路径运动

`svg.createMotionPath(path, offset=0)` 让元素沿着一条 SVG 路径运动，并自动旋转对齐切线方向：

- **返回值**：`{translateX, translateY, rotate}` 三个映射值，用扩展运算符 `...` 直接铺进 `animate()` 配置对象。
- **`offset` 参数**：路径起始偏移。

```javascript
const carAnim = animate('.car', {
  ease: 'linear',
  duration: 5000,
  loop: true,
  ...svg.createMotionPath('path'),  // 展开后等价于同时写 translateX/translateY/rotate 三个属性
});
```

## 五、createDraggable()：拖拽物理

`createDraggable(target, options)` 一行代码即可让元素可拖拽，默认无约束容器：

```javascript
import { createDraggable } from 'animejs';

createDraggable('.square', {
  container: '.stage',
  containerPadding: 20,
  containerFriction: 0.8,          // 拖拽时越界的粘滞感
  releaseContainerFriction: 0.8,   // 松手后越界回弹的粘滞感（与上面是两个独立时机）
  releaseStiffness: 100,
  releaseDamping: 20,
  x: { snap: 50 },                  // 每 50px 吸附一次
  onGrab: () => {},
  onRelease: () => {},
  onSnap: () => {},
});
```

**Axes 参数**（x/y 各自独立配置）：`snap`（吸附点/间隔）、`modifier`（拖拽值再加工）、`mapTo`（把拖拽量映射到别的属性，比如映射到 `rotate` 实现拖拽转盘）。

**Settings 完整清单**：`trigger`（拖拽触发元素，可与容器分离，如只拖手柄）、`container` + `containerPadding`（边界约束）、`containerFriction`/`releaseContainerFriction`（拖拽中/释放后的越界摩擦）、`releaseMass`/`releaseStiffness`/`releaseDamping`（松手后弹簧回弹物理）、`velocityMultiplier`/`minVelocity`/`maxVelocity`（惯性速度换算与钳制）、`releaseEase`、`dragSpeed`、`dragThreshold`、`scrollThreshold`/`scrollSpeed`（拖到容器边缘自动滚动）、`cursor`。

::: warning containerFriction 与 releaseContainerFriction 容易混
`containerFriction` 作用于**拖拽过程中**越界的阻尼手感，`releaseContainerFriction` 作用于**松手后**越界回弹的阻尼手感——命名相似但生效时机完全不同，是 Draggable 参数里的高发踩坑点。
:::

## 六、回调与方法

**回调**：`onGrab`/`onDrag`/`onUpdate`/`onRelease`/`onSnap`/`onSettle`/`onResize`/`onAfterResize`。

**方法**：`disable`/`enable`/`setX`/`setY`/`animateInView`/`scrollInView`/`stop`/`reset`/`revert`/`refresh`。

---

下一步进入 [ScrollObserver / utils / eases](./scroll-utils-eases)：把动画与滚动行为绑定，再补全工具函数与性能配置。
