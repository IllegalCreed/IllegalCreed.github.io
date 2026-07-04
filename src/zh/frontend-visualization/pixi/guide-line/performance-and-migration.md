---
layout: doc
outline: [2, 3]
---

# 性能优化专题与 v7→v8 迁移

> 基于 PixiJS v8.19 · 核于 2026-07

## 速查

- **Render Groups**（v8 新，性能向）：`new Container({ isRenderGroup: true })` 把子树标记为自包含小场景图，变换/着色/透明度计算下放到 GPU，减少 CPU 负担；适合结构不常变的静态子树（游戏世界层、HUD 层分离）。官方强调**不要滥用**——Render Group 太多反而更慢，需要实测。
- **Render Layers**（v8 新，视觉向）：把「渲染顺序」与「场景图父子逻辑关系」解耦，`layer.attach(obj)`/`layer.detach(obj)` 显式管理；对象被重新 `addChild` 到别的父节点后**不会自动保留**在 layer 中。
- **`cacheAsTexture`**（替代 v7 `cacheAsBitmap`）：把容器及子元素整体渲染进一张纹理复用，减少逐子元素处理开销；限制：增加显存占用、超大容器（>4096×4096px）可能缓存失败、频繁开关反而更慢。
- ⚠️ **Culling 不再自动**：v8 默认关闭，且不再像 v7 那样渲染时自动裁剪——需要显式设置 `cullable`/`cullableChildren`/`cullArea`，并手动调用 `Culler.shared.cull(container, view)`，或注册 `CullerPlugin` 扩展找回接近 v7 的自动行为。
- **`ParticleContainer` / `Particle`**（v8 重构）：不再接受 `Sprite`，改用更轻量的 `Particle`（无子节点/事件/滤镜）；区分动态属性（每帧上传 GPU）与静态属性（仅 `update()` 时上传）；用 `addParticle()` 而非 `addChild()`；`boundsArea` 需手动设置；可渲染数十万粒子。
- **其他性能建议**：精灵图集减少纹理切换；绘制顺序影响批处理效率（同类型对象连续绘制更快）；遮罩性能层级——轴对齐矩形遮罩最快、图形遮罩次之、精灵遮罩最慢（走滤镜）；纹理默认 3600 帧未用自动 GC（`textureGCMaxIdle`/`textureGCCheckCountMax` 可调）。
- **释放方式两种**：`destroy()` 立即彻底释放 GPU 资源 + 内存引用；`texture.source.unload()` 只从 GPU 卸载显存、保留 JS 引用可再次上传——选错方式会导致过早销毁复用中的纹理，或内存该放不放。
- **v7→v8 十大高频坑**：忘记 `await app.init()`；`app.view`→`app.canvas`；Graphics 旧 API 残留；`eventMode` 默认 `'passive'` 非 `'auto'`；叶子节点不可再 `addChild`；`ParticleContainer` 用 `addParticle` 不是 `addChild`；Ticker 回调参数变 `Ticker` 实例；Culling 不再自动；`getBounds()` 返回 `Bounds` 需 `.rectangle`；枚举全部改字符串（`SCALE_MODES.NEAREST` → `'nearest'`）。
- **`settings` 全局对象已移除**：v7 `settings.RESOLUTION`/`settings.ADAPTER` 编译不通过，需改用 `AbstractRenderer.defaultOptions.resolution` 与 `DOMAdapter.set()`。
- **类名重命名**：`NineSlicePlane`→`NineSliceSprite`、`SimpleMesh`→`MeshSimple`、`SimplePlane`→`MeshPlane`、`SimpleRope`→`MeshRope`。
- **选型关联**：性能敏感、海量交互对象走 PixiJS；量级小/一次性绘制用 Canvas 2D；要开箱即用的编辑器交互用 Konva/Fabric；完整五路对比表见[参考页](../reference)。
- **进阶顺序**：本页是本叶最后一篇指南，之后是 [参考](../reference) 速查总表。

## 一、Render Groups 与 Render Layers

**Render Groups**（v8 新增，性能向）：把子树标记为「自包含小场景图」，将变换/着色/透明度计算下放到 GPU，减少 CPU 负担，适合结构不常变的静态子树（如游戏世界层、HUD 层分离）：

```js
const myGameWorld = new Container({ isRenderGroup: true });
const myHud = new Container({ isRenderGroup: true });
scene.addChild(myGameWorld, myHud);
```

官方特别强调"不要滥用"——Render Group 数量太多反而更慢，是否使用需要实测对比。

**Render Layers**（v8 新增，视觉向）：把"渲染顺序"与"场景图父子逻辑关系"解耦——对象仍保留逻辑父级的变换继承，但可以按需插到别的绘制层（比如角色血条永远显示在世界之上，不受角色所在子树限制）：

```js
const layer = new RenderLayer();
stage.addChild(layer);
layer.attach(redGuy); // 显式挂载
layer.detach(redGuy);
```

注意：`redGuy` 被重新 `addChild` 到别的父节点后，**不会自动**继续保留在 layer 中，需要重新 `attach`。

## 二、cacheAsTexture 与 Culling

`cacheAsTexture`（替代 v7 的 `cacheAsBitmap`）把容器及其子元素整体渲染进一张纹理复用，减少逐子元素处理的开销，适合不常更新的静态 UI 面板：

```js
container.cacheAsTexture({ resolution: 2, antialias: true });
container.updateCacheTexture(); // 内容变了手动刷新缓存
container.cacheAsTexture(false); // 关闭缓存
```

限制：会增加显存占用；超大容器（渲染区域超过约 4096×4096px）可能缓存失败；频繁 `cacheAsTexture(true)`/`(false)` 切换比不缓存还慢。

**Culling（视锥裁剪）**：v8 默认关闭，且**不再像 v7 那样渲染时自动裁剪**——必须显式设置并手动触发：

```js
container.cullable = true;
container.cullArea = new Rectangle(0, 0, 400, 400);
container.cullableChildren = false; // 大场景递归优化：避免深层大场景图的递归剔除开销

// 手动触发一次剔除计算
Culler.shared.cull(container, view);
// 或注册 CullerPlugin 扩展，找回接近 v7 的自动裁剪行为
```

## 三、ParticleContainer：海量精灵

`ParticleContainer`/`Particle` 是 v8 重构后的海量精灵专用方案：不再接受普通 `Sprite`，改用更轻量的 `Particle`（没有子节点、事件、滤镜），并区分动态属性（每帧都要上传 GPU）与静态属性（只在调用 `update()` 时上传），以进一步压榨性能，可渲染数十万粒子：

```js
const container = new ParticleContainer({
  boundsArea: new Rectangle(0, 0, 500, 500), // v8 需要手动设置包围盒，不再自动计算
  dynamicProperties: { position: true, rotation: true, vertex: false, color: false },
});
const particle = new Particle({ texture, x: 100, y: 100 });
container.addParticle(particle); // 注意：不是 addChild
```

## 四、其他性能建议汇总

汇总自官方 performance-tips 与 garbage-collection 两篇专题：

- **精灵图集**减少纹理切换次数（切换纹理会打断批处理）。
- **绘制顺序**影响批处理效率：同类型对象连续绘制比交替绘制更快。
- **遮罩性能层级**：轴对齐矩形遮罩（裁剪矩形）最快 > 图形遮罩（模板缓冲）次之 > 精灵遮罩（走滤镜实现）最慢。
- **纹理垃圾回收**：默认 3600 帧未使用的纹理会被自动 GC，`textureGCMaxIdle`/`textureGCCheckCountMax` 可调节这个阈值。
- **释放方式选择**：`destroy()` 立即释放 GPU 资源（GPU + 内存引用都没了）；`texture.unload()`/`texture.source.unload()` 只精细地卸载 GPU 显存、保留 JS 引用可以再次上传——选错方式会导致要么过早销毁了还在复用的纹理，要么该释放的内存一直不放。

## 五、v7 → v8 迁移清单（重点）

从 v7 升级到 v8，或者照搬 v7 教程代码时最容易踩的坑：

| 分类 | v7 写法 | v8 写法 / 变化 |
| --- | --- | --- |
| 初始化 | `new PIXI.Application(options)` | `new Application()` + `await app.init(options)`（WebGPU 异步取上下文） |
| 画布属性 | `app.view` | `app.canvas` |
| Graphics 绘制 | `beginFill().drawRect().endFill()` | `.rect().fill()` |
| Graphics 线型 | `lineStyle({ width, color })` | `.stroke({ width, color })` |
| Graphics 挖洞 | `beginHole()` / `endHole()` | `.cut()` |
| 场景图 | `sprite.addChild(childSprite)` 可用 | 叶子节点不可再 `addChild`，必须都挂 `Container` |
| 容器命名 | `container.name` | `container.label` |
| 交互开关 | `sprite.interactive = true`（默认近似 `'auto'`） | `sprite.eventMode = 'static'`（默认是 `'passive'`） |
| 粒子容器 | `particleContainer.addChild(sprite)` | `container.addParticle(particle)`，且需手动设 `boundsArea` |
| Ticker 回调 | 裸 `delta` 数字 | `Ticker` 实例，取 `ticker.deltaTime` |
| 裁剪 | `cullable = true` 渲染时自动生效 | 需手动 `Culler.shared.cull()` 或注册 `CullerPlugin` |
| 缓存位图 | `cacheAsBitmap = true` | `cacheAsTexture({...})` |
| 包围盒 | `getBounds()` 直接返回 `Rectangle` | 返回 `Bounds` 对象，需要 `.rectangle` |
| 纹理来源 | `Texture.from(url)` 可直接联网加载 | 必须先 `await Assets.load(url)`，`Texture.from(url)` 只同步取缓存 |
| 全局配置 | `settings.RESOLUTION` / `settings.ADAPTER` | `AbstractRenderer.defaultOptions.resolution` / `DOMAdapter.set()` |
| 枚举常量 | `SCALE_MODES.NEAREST` / `WRAP_MODES.REPEAT` / `DRAW_MODES.TRIANGLES` | 字符串常量 `'nearest'` / `'repeat'` / `'triangle-list'` |
| 类改名 | `NineSlicePlane` / `SimpleMesh` / `SimplePlane` / `SimpleRope` | `NineSliceSprite` / `MeshSimple` / `MeshPlane` / `MeshRope` |
| 社区滤镜 | `@pixi/filter-adjustment` | `pixi-filters/adjustment`（子路径导入） |

其中最容易在实际项目里"悄悄出错"（不报错但行为不对）的三条：`eventMode` 默认值差异导致原本能响应事件的对象在 v8 不响应；子包按需 `import 'pixi.js/xxx'`（accessibility、高级混合模式等）漏引入时功能静默失效而非报错；`interactive = true` 仍可用但只是别名，容易掩盖 `eventMode` 语义已经变化的事实。

## 六、与 Canvas / Konva / Fabric 的选型关联

把这份迁移清单放回选型视角看：**性能敏感、海量交互对象、需要滤镜/混合模式** 的场景是 PixiJS 的主场，升级成本换来的是 GPU 批处理、`ParticleContainer`、Render Groups 这些机制带来的性能上限；而只是画个静态图表、一次性绘制的场景，[Canvas 2D](../../canvas/) 原生已经足够，完全不需要承担这套架构复杂度。做"图形编辑器/白板"类需求且想少写交互代码时，Konva（简单场景）或 Fabric（要选择/变换手柄）会比自己在 PixiJS 上补交互层更省心——但同做编辑器，PixiJS 的性能上限更高。完整五路对比表（含 Three.js）见[参考页](../reference)。

---

至此指南部分完结，查表用途见[参考：PixiJS API 速查](../reference)。
