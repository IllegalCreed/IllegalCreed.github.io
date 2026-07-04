---
layout: doc
outline: [2, 3]
---

# 动画：Animation / Tween / Easings 与滤镜

> 基于 Konva v10.3（npm latest 10.3.0）· 核于 2026-07

## 速查

- **Konva.Animation（帧循环）**：`new Konva.Animation(frameFn, layer)`，第二参数可传 layer 或 layer 数组，动画会自动重绘它们；`frame.time`（启动后经过毫秒数）、`frame.timeDiff`（距上一帧毫秒数）、`frame.frameRate`（当前帧率）三个参数；`start()`/`stop()` 控制启停。
- **Animation 铁律**：update 函数**只应修改节点属性**（position/rotation/scale 等），重绘由动画引擎自动处理，不要在回调里手动调用 `layer.draw()`。
- **Konva.Tween（补间）**：`new Konva.Tween({ node, duration, 属性, easing })`；方法 `play()`/`pause()`/`reverse()`/`seek(秒)`/`finish()`/`reset()`；`duration` 单位是**秒**。
- **单属性快捷动画**：`node.to({ x: 300, duration: 1, easing: Konva.Easings.BounceEaseOut })`，内部基于 Tween 实现。
- **Easings 族**：`Linear`、`EaseIn`/`EaseOut`/`EaseInOut`、`BackEaseIn`/`Out`、`ElasticEaseIn`/`Out`、`BounceEaseIn`/`Out` 等常用缓动。
- **Tween 扩展主题**：Complex Tweening（多属性组合补间）、Finish Event（`onFinish` 回调）、Filter Tweening（对滤镜参数做补间过渡）。
- **滤镜两步法（必考）**：① `shape.cache()` 先缓存为位图；② `shape.filters([Konva.Filters.Blur])` 应用滤镜数组；不调用 `cache()` 直接设置 `filters` 不会生效或报错。
- **可用滤镜清单**：Blur、Brighten、Contrast、Grayscale、Invert、HSL、HSV、RGB、Emboss、Sepia、Solarize、Kaleidoscope、Pixelate、Noise、Threshold，以及 Custom Filter、Mask；支持数组内多个滤镜叠加。
- **滤镜开销**：滤镜是**像素级操作**，性能开销大，务必配合 `cache()` 使用；参数频繁变化时可用 Tween 做平滑过渡（Filter Tweening）。
- **cache 二次生效**：`cache()` 之后如果又改了影响视觉的属性（如换了图片源），需要先 `clearCache()` 再重新 `cache()`。
- **cache 取舍原则**（何时该缓存、如何取舍）详见[下一页性能优化](./serialization-react-performance)，本页只覆盖"滤镜为什么必须先 cache"这一前置条件。
- **进阶顺序**：本页承接[事件、拖拽与 Transformer](./events-drag-transform)，下一步是[序列化、react-konva 与性能优化](./serialization-react-performance)。

## 一、帧循环动画：Konva.Animation

```javascript
const anim = new Konva.Animation((frame) => {
  // frame.time：动画启动后经过的毫秒数
  // frame.timeDiff：距上一帧的毫秒数
  // frame.frameRate：当前帧率
  const angle = (frame.time * 2 * Math.PI) / 4000;
  rect.x(200 + 100 * Math.cos(angle));
  rect.y(200 + 100 * Math.sin(angle));
}, layer); // 第二参数可传 layer 或 layer 数组，animation 会自动重绘它们

anim.start();
anim.stop();
```

官方强调：update 函数**只应修改节点属性**（position/rotation/scale 等），重绘由动画引擎自动处理，不要在回调里手动调用 `layer.draw()`——这是 `Konva.Animation` 与手写 `requestAnimationFrame` 循环最大的区别：Konva 已经帮你把"改属性"和"触发重绘"解耦了。

## 二、补间动画：Konva.Tween 与 Easings

```javascript
const tween = new Konva.Tween({
  node: circle,
  duration: 2, // 秒
  x: 300,
  easing: Konva.Easings.EaseInOut,
});
tween.play();
tween.pause();
tween.reverse();
tween.seek(1); // 跳到第 1 秒（对应 50% 进度）
tween.finish(); // 直接跳到结束状态
tween.reset();

// 单个属性快捷动画（内部基于 Tween）
circle.to({ x: 300, duration: 1, easing: Konva.Easings.BounceEaseOut });
```

`Konva.Easings` 提供 `Linear`、`EaseIn`/`EaseOut`/`EaseInOut`、`BackEaseIn`/`Out`、`ElasticEaseIn`/`Out`、`BounceEaseIn`/`Out` 等常用缓动族，覆盖绝大多数 UI 过渡场景。Tween 分类文档还覆盖三个进阶主题：

- **Complex Tweening**：一次补间同时驱动多个属性组合变化。
- **Finish Event**：`onFinish` 回调，用于补间结束后触发下一步逻辑。
- **Filter Tweening**：对滤镜参数（如 `blurRadius`）做补间，实现滤镜效果的平滑过渡。

## 三、滤镜 Filters：先 cache() 后 filters()

```javascript
image.cache(); // 第一步：必须先 cache
image.filters([Konva.Filters.Blur]); // 第二步：应用滤镜数组
image.blurRadius(10);
```

可用滤镜（官方分类）：`Blur`、`Brighten`、`Contrast`、`Grayscale`、`Invert`、`HSL`、`HSV`、`RGB`、`Emboss`、`Sepia`、`Solarize`、`Kaleidoscope`、`Pixelate`、`Noise`、`Threshold`，以及 Custom Filter、Mask，支持多滤镜叠加（数组内多个）。

滤镜是**像素级操作**，性能开销大，务必配合 `cache()` 使用——`cache()` 把节点预先光栅化成一张位图，滤镜只需对这张位图做一次像素运算，而不是每帧都重新走一遍矢量绘制指令再滤镜化。滤镜参数变化频繁时（如拖动滑块调节模糊半径），可以用 Tween 做平滑过渡（上一节的 Filter Tweening）而不是每次都整体重算。

## 四、动画与滤镜常见坑

- **滤镜必须先 `cache()`**：不调用 `cache()` 直接设置 `filters([...])` 不会生效或报错；`cache()` 之后如果又改了会影响视觉的属性（如换了图片源），需要 `clearCache()` 后重新 `cache()`。
- **Animation 回调不要手动重绘**：在 `Konva.Animation` 的帧函数里调用 `layer.draw()` 是多余甚至有害的操作，动画引擎已经在自动处理重绘节奏，手动插入只会造成多余的重复绘制。
- **cache 不是无脑万能药**：什么时候该缓存、缓存粒度选节点还是整组、如何验证收益，属于性能优化范畴的判断，本页只讲"滤镜依赖 cache 这一前置条件"，完整的缓存取舍四原则见下一页。

图形已经能动、能加滤镜特效；接下来是"怎么存、怎么在 React/Vue 里声明式地用它、怎么在规模变大时保持流畅"：[序列化、react-konva 与性能优化](./serialization-react-performance)。
