---
layout: doc
outline: [2, 3]
---

# Application 异步初始化与场景图

> 基于 PixiJS v8.19 · 核于 2026-07

## 速查

- **`Application` 无参构造**：`new Application()` 不接受参数，配置全部通过 `await app.init(options)` 传入，因为 WebGPU 取上下文是异步的。
- **常用 init 选项**：`width`/`height`/`backgroundColor`/`backgroundAlpha`/`resizeTo`（跟随元素自动尺寸）/`preference`（`'webgl'`默认/`'webgpu'`）/`antialias`/`resolution`/`autoDensity`。
- **后端专属配置**：可分别传 `webgl: {...}` 与 `webgpu: {...}`，只在对应后端生效。
- **关键属性**：`app.stage`（场景图根 `Container`）/ `app.canvas`（原 `app.view`）/ `app.ticker` / `app.renderer` / `app.screen`。
- **内置插件**：Ticker Plugin（渲染循环）、Resize Plugin（响应式尺寸）、Culler Plugin（需手动注册）；可自定义 `ApplicationPlugin` 挂应用生命周期钩子。
- **场景图 = 树**：根是 `app.stage`；每帧从根遍历所有叶子节点，累积计算 `worldTransform`（位置/旋转/缩放）与 `worldAlpha`（父子透明度**相乘**：父 0.5 + 子 0.5 = 最终 0.25）。
- **Container 增删查**：`addChild`/`addChildAt`/`removeChild`/`swapChildren`；`reparentChild` 换父节点但**保留世界坐标**。
- **查找子节点**：`getChildByLabel('enemy')` / `getChildrenByLabel(/^enemy/)`（支持正则）。
- **渲染顺序**：`zIndex` + `container.sortableChildren = true` 才生效，值越大越靠上层绘制。
- **事件**：`container.on('childAdded', (child, parent, index) => {})` 监听子节点变化。
- ⚠️ **`container.name` 已改名 `container.label`**：v7 教程代码直接用 `.name` 会拿不到预期值。
- ⚠️ **叶子节点不能再 `addChild`**：v8 起 `Sprite`/`Graphics`/`Mesh` 等可渲染对象不允许挂子节点，必须和其"子对象"一起挂到外层 `Container`——v7 里 `sprite.addChild(childSprite)` 能跑，v8 会报错/无效。
- **Transform 属性**：`position`/`scale`/`rotation`/`pivot`/`skew`；可见性 `visible`/`alpha`。
- **坐标换算**：`obj.toGlobal(new Point(0, 0))` 本地坐标转全局坐标；Canvas 未拉伸/未降分辨率时全局坐标即屏幕坐标。
- **Sprite 基础**：`Assets.load()` 拿纹理 → `new Sprite(texture)`；`anchor` 是旋转/缩放中心点；`width`/`height` 直接赋值会内部换算成 `scale`。
- **换纹理自动行为**：`sprite.texture = newTexture` 会自动重新绑定纹理更新监听、按需重算宽高保持视觉尺寸、触发视觉更新。
- **`getBounds()` 返回值变了**：v8 返回 `Bounds` 对象，需要 `.rectangle` 才能拿到传统矩形字段（`.width`/`.height` 等），直接当 `Rectangle` 用会拿到 `undefined`。

## 一、Application 深入配置

`Application.init()` 接受的常用选项：

```js
import { Application } from 'pixi.js';

const app = new Application();
await app.init({
  width: 800,
  height: 600,
  backgroundColor: 0x1099bb,
  backgroundAlpha: 1,
  resizeTo: window,          // 自动跟随 window/某个 DOM 元素的尺寸变化
  preference: 'webgl',       // 'webgl' | 'webgpu'，默认 'webgl'
  antialias: true,
  resolution: window.devicePixelRatio || 1,
  autoDensity: true,         // 配合 resolution，让 CSS 显示尺寸与实际分辨率解耦
});
document.body.appendChild(app.canvas); // v7 是 app.view，v8 改名 app.canvas
```

需要为两种后端分别调参时（比如只想在 WebGL 下开抗锯齿）：

```js
await app.init({
  webgl: { antialias: true },
  webgpu: { antialias: false },
});
```

初始化后可用的关键属性：`app.stage`（根 `Container`）、`app.canvas`（原 `app.view`）、`app.ticker`（渲染循环）、`app.renderer`（底层渲染器实例）、`app.screen`（渲染区域尺寸 `Rectangle`）。

内置插件：**Ticker Plugin** 驱动渲染循环、**Resize Plugin** 配合 `resizeTo` 做响应式尺寸、**Culler Plugin** 需要手动注册才会开启（默认不启用，见[性能篇](./performance-and-migration)）。此外也支持自定义 `ApplicationPlugin` 扩展应用的生命周期（例如统一挂载埋点/监控逻辑）。

## 二、场景图模型：Container 树与世界变换

场景图是一棵树，根节点是 `app.stage`。每一帧，PixiJS 从根遍历到所有叶子节点，累积计算 `worldTransform`（位置/旋转/缩放的复合矩阵）和 `worldAlpha`（透明度，**父子相乘**：父 `alpha = 0.5` + 子 `alpha = 0.5`，子节点最终显示透明度是 `0.25`）。

`Container` 的增删查改：

```js
import { Container } from 'pixi.js';

const container = new Container();
const child1 = new Container({ label: 'enemy' }); // label：原来的 name 属性
const child2 = new Container();

container.addChild(child1, child2); // 可一次挂多个
container.addChildAt(child1, 0);    // 指定插入位置
container.removeChild(child1);
container.swapChildren(child1, child2); // 交换两个子节点的渲染顺序

otherContainer.reparentChild(child1); // 重新挂到别的父节点，但保留世界坐标不跳变

// 按 label 查找
container.getChildByLabel('enemy');
container.getChildrenByLabel(/^enemy/); // 支持正则批量匹配

// 渲染顺序：需要同时设置 zIndex 和 sortableChildren 才生效
child1.zIndex = 1;
child2.zIndex = 10; // 值越大越靠后绘制（视觉上在上层）
container.sortableChildren = true;

// 子节点变化事件
container.on('childAdded', (child, parent, index) => {
  console.log(`${child.label} 被加入 ${parent.label}，位置 ${index}`);
});
```

v8 有两条容易踩的结构性变化：**叶子节点（`Sprite`/`Graphics`/`Mesh` 等可渲染对象）不再允许 `addChild`**——容器职责与可渲染对象职责被彻底分离，必须都挂在 `Container` 下；以及 **`container.name` 已重命名为 `container.label`**，v7 教程代码里的 `.name` 在 v8 拿不到预期值。

## 三、Transform 与坐标换算

每个场景对象都有一套变换属性：`position`（位置）/ `scale`（缩放）/ `rotation`（旋转，弧度制）/ `pivot`（变换中心点，区别于 `anchor`）/ `skew`（斜切）；可见性相关：`visible`（是否参与渲染）/ `alpha`（透明度，会与父级相乘）。

本地坐标转全局坐标：

```js
import { Point } from 'pixi.js';

const globalPos = someContainer.toGlobal(new Point(0, 0));
// Canvas 未被 CSS 拉伸、分辨率未降级时，全局坐标即屏幕坐标
```

## 四、Sprite：最基础的可视元素

`Sprite` 代表屏幕上的一张图片，用法上承接[入门篇](../getting-started)的第一个精灵示例，这里补充完整属性：

```js
import { Assets, Sprite } from 'pixi.js';

const texture = await Assets.load('path/to/bunny.png');
const sprite = new Sprite(texture);

sprite.anchor.set(0.5);       // 锚点：旋转/缩放中心，默认左上角 (0,0)
sprite.position.set(100, 100);
sprite.scale.set(2);          // 按百分比缩放
sprite.width = 100;           // 或直接设尺寸，内部会换算成对应 scale
sprite.rotation = Math.PI / 4;
sprite.tint = 0xff0000;       // 着色（乘色），常用于同一贴图换肤
```

换纹理时（`sprite.texture = newTexture`）PixiJS 会自动完成三件事：重新绑定纹理更新监听、按需重算宽高以保持视觉尺寸、触发一次视觉更新——不需要手动重置任何状态。

另一个容易踩的返回值变化：`someContainer.getBounds()` 在 v8 返回的是 `Bounds` 对象，需要访问 `.rectangle` 才能拿到传统的 `Rectangle` 字段（`.x`/`.y`/`.width`/`.height`），直接当 `Rectangle` 使用（比如直接读 `.width`）会拿到 `undefined`。

---

场景图与基础对象搭好后，下一步进入 [Graphics·文本与资源](./graphics-text-assets)：v8 全新的链式绘图 API、三种文本方案的取舍，以及 `Assets` 资源加载体系。
