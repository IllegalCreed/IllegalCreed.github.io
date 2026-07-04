---
layout: doc
outline: [2, 3]
---

# Graphics 链式绘图·文本系统与资源加载

> 基于 PixiJS v8.19 · 核于 2026-07

## 速查

- **Graphics v8 全新范式**：从 v7「开始填充 → 画形状 → 结束填充」（`beginFill().drawRect().endFill()`）改为「**先画形状、再 `fill()`/`stroke()`**」的链式调用。
- **不立即绘制**：链式调用只是构建几何图元列表，加入场景后才真正渲染，因此对象可复用/克隆/遮罩。
- **挖洞**：`.cut()` 替代 v7 的 `beginHole()`/`endHole()`。
- **GraphicsContext**：跨实例复用几何数据（替代 v7 `GraphicsGeometry`），多个 `Graphics` 实例共享同一份几何、切换开销低。
- **fill/stroke 支持**：颜色（CSS 字符串/十六进制/数组）、纹理（`textureSpace: 'local' | 'global'`，可传 `matrix`）、`FillGradient` 线性/径向渐变。
- ⚠️ **渐变互斥**：`FillGradient` 不能与纹理/矩阵同时使用，用完调用 `gradient.destroy()` 释放。
- **`pixelLine`**：绘制恒定 1px、不随缩放变化的 GPU 原生线条，适合像素画风格/UI 分隔线/调试边框。
- **Graphics 性能建议**：避免每帧清空重建，改用预构建 `GraphicsContext` 切换；100 个点以下的 Graphics 可被批处理；复杂大图形建议改用 `Sprite` 或 `cacheAsTexture`。
- **三种文本方案**：`Text`（Canvas 光栅化成纹理，适合精细样式但不适合频繁变化）/ `BitmapText`（预生成位图字形集，适合大量动态文本，可达数万实例）/ `HTMLText`（SVG `foreignObject` 内嵌真实 HTML，适合富文本标签与 Unicode/emoji，但渲染异步）。
- ⚠️ **`BitmapText` 分辨率不可运行时改**：需要不同分辨率必须重新生成位图字体资源。
- ⚠️ **`HTMLText` 异步渲染**：`new HTMLText()` 创建后不会立刻在当帧可见，动画首帧对齐容易踩坑。
- **纹理链路**：源文件 → `TextureSource`（`ImageSource`/`CanvasSource`/`VideoSource`/`BufferImageSource`/`CompressedSource`）→ `Texture`（轻量视图，多个 `Texture` 可共享一个 `TextureSource`，如精灵图集）→ `Sprite`。
- **`Assets` 是现代资源管理单例**：基于 Promise、带缓存感知、可扩展解析器；同一 URL 二次 `load` 返回同一对象。
- **卸载两种方式**：`Assets.unload(url)` 彻底释放；`texture.source.unload()` 只从 GPU 卸载、保留内存引用。
- ⚠️ **`Texture.from(url)` 不再直接联网加载**：必须先 `await Assets.load(url)` 让资源进缓存，`Texture.from(url)`（同步）才能拿到，否则报错而非发请求。
- **Manifest / Bundle**：把资源分组打包，`Assets.loadBundle('name')` 懒加载整组；`Assets.addBundle()` 可运行时动态注册新组。
- **Resolver 四阶段**：标准化 → 展开通配符（如 `bunny@{1,2}x.{png,webp}`）→ 按平台能力选最优 → 输出具体 URL，配合 AssetPack 工具自动生成多分辨率/多格式清单。
- **进阶顺序**：本页 → [事件·Ticker·滤镜](./events-ticker-filters) → [性能与迁移](./performance-and-migration) → [参考](../reference)。

## 一、Graphics v8 全新链式 API

v8 彻底重写了 `Graphics` API：不再是 v7 的「开始填充 → 画形状 → 结束填充」，而是**先画形状、再 `fill()`/`stroke()`**，且不立即绘制——链式调用只是构建几何图元列表，等对象加入场景后才真正渲染，因此同一个 `Graphics` 实例可以复用、克隆、当遮罩用：

```js
import { Graphics, GraphicsContext } from 'pixi.js';

const g = new Graphics()
  .rect(50, 50, 100, 100)
  .fill(0xff0000)               // 先画矩形，再填充红色
  .circle(200, 200, 50)
  .stroke({ width: 5, color: 0x00ff00 }) // 画圆，再描边
  .moveTo(300, 300)
  .lineTo(400, 400)
  .stroke({ width: 5 });

// 挖洞：v7 的 beginHole()/endHole() 在 v8 统一替换为 .cut()
const withHole = new Graphics()
  .rect(0, 0, 100, 100)
  .fill(0x00ff00)
  .circle(50, 50, 20)
  .cut();

// GraphicsContext：跨实例复用几何数据，替代 v7 的 GraphicsGeometry
const context = new GraphicsContext().circle(100, 100, 50).fill('red');
const shapeA = new Graphics(context);
const shapeB = new Graphics(context); // 共享同一份几何，切换 context 开销低
```

支持的图元分两档：基础图元（矩形/圆角矩形/圆/椭圆/弧形/贝塞尔曲线）与高级图元（倒角矩形、圆角多边形、正多边形、星形）。`fill()`/`stroke()` 支持颜色（CSS 字符串/十六进制/数组）、纹理（`textureSpace: 'local' | 'global'`，可传 `matrix`）、`FillGradient` 线性/径向渐变——**渐变不能与纹理/矩阵同时使用**，用完记得调用 `gradient.destroy()` 释放。

另有 `pixelLine` 属性，可绘制恒定 1px、不随缩放变化的 GPU 原生线条，适合像素画风格、UI 分隔线、调试边框。

性能建议：避免每帧清空重建 `Graphics`，改用预构建 `GraphicsContext` 切换；100 个点以下的 `Graphics` 可被批处理；复杂大图形建议改用 `Sprite` 或 [`cacheAsTexture`](./performance-and-migration)。旧 API 对照（v7 → v8）：

| v7 | v8 |
| --- | --- |
| `beginFill(color).drawRect(...).endFill()` | `.rect(...).fill(color)` |
| `lineStyle({ width, color })` | `.stroke({ width, color })` |
| `beginHole()` / `endHole()` | `.cut()` |
| `GraphicsGeometry` | `GraphicsContext` |

## 二、文本系统：Text / BitmapText / HTMLText

三种文本渲染方案各有取舍，选型口径如下：

| 类型 | 原理 | 适合 | 不适合 |
| --- | --- | --- | --- |
| `Text` | 用浏览器 Canvas 文本 API 光栅化成纹理 | 需要精细 CSS 级样式控制、文本不频繁变化 | 每帧变化文本、成百上千实例 |
| `BitmapText` | 预生成位图字形集，直接拼字符 | 大量动态文本（HUD/计分板/计时器），可达数万实例 | 需要精细样式、CJK/emoji 大字符集（受纹理尺寸限制） |
| `HTMLText` | 通过 SVG `foreignObject` 内嵌真实 HTML | 富文本标签（`<b>`/`<span>`）、Unicode/emoji、CSS 排版（如 text-shadow） | 像素级性能场景、成百实例（渲染是异步的，创建后不会立即可见） |

```js
import { Text, TextStyle, BitmapText, HTMLText, Assets } from 'pixi.js';

// Text：适合精细样式、不频繁变化的文本
const style = new TextStyle({
  fontFamily: 'Arial',
  fontSize: 30,
  fill: '#ffffff',
  stroke: '#000000',
  dropShadow: { color: '#000000', blur: 5, distance: 4, angle: Math.PI / 4, alpha: 0.5 },
});
const text = new Text({ text: 'Score: 1234', style });

// BitmapText：先加载位图字体资源（AngelCode BMFont / MSDF 格式）
await Assets.load('fonts/MyFont.fnt');
const bmText = new BitmapText({ text: 'Loaded font!', style: { fontFamily: 'MyFont', fontSize: 32 } });

// HTMLText：可以直接写 HTML 标签做富文本
const html = new HTMLText({
  text: '<strong>Hello</strong> <em>PixiJS</em>!',
  style: { fontFamily: 'Arial', fontSize: 24, tagStyles: { red: { fill: 'red' } } },
});
```

几个容易忽略的细节：`BitmapText` 的 `resolution` 不可运行时修改，需要不同分辨率得重新生成位图字体资源；`Text` 频繁变化会触发重新光栅化 + GPU 上传，官方明确提示"避免每帧执行"；v8 中 `dropShadow` 改为对象形式，可以单独改字段而不必重建整个 `style`；`HTMLText` 的渲染是异步的，`new HTMLText()` 创建后通常要下一帧才真正可见，动画首帧对齐时容易踩坑。

## 三、纹理与资产：Textures / Assets

纹理的完整链路是：源文件 → `TextureSource`（原始像素数据 + GPU 上传，支持 `ImageSource`/`CanvasSource`/`VideoSource`/`BufferImageSource`/`CompressedSource`）→ `Texture`（轻量视图，含裁剪/UV/变换等元数据，**多个 `Texture` 可共享一个 `TextureSource`**，精灵图集就是这么实现的）→ `Sprite`。v7 的 `BaseTexture` 在 v8 已被拆分成多种 `*Source`。

`Assets` 是 v8 的现代资源管理单例：基于 Promise、带缓存感知、可扩展解析器：

```js
import { Assets, Sprite } from 'pixi.js';

// 单个/批量加载
const texture = await Assets.load('path/to/bunny.png');
const textures = await Assets.load(['bunny.png', 'cat.png']);

// 别名：给资源起个好记的名字
await Assets.load({ alias: 'bunny', src: 'path/to/bunny.png' });
const t = Assets.get('bunny');

// 缓存：同一 URL 二次 load 返回同一对象
const p1 = await Assets.load('bunny.png');
const p2 = await Assets.load('bunny.png'); // p1 === p2

// 卸载：两种方式语义不同
await Assets.unload('bunny.png');  // 彻底释放（GPU + 内存引用都没了）
texture.source.unload();           // 只从 GPU 卸载，保留 JS 引用可再次上传

// 全局初始化配置（可指定 CDN 基础路径）
await Assets.init({ basePath: 'https://cdn.example.com/' });
```

⚠️ 踩坑提醒：`Texture.from(url)` 在 v8 不再直接从网络加载——必须先 `await Assets.load(url)` 让资源进入缓存，再调用 `Texture.from(url)`（这是个同步方法）才能拿到，找不到资源会直接报错而不是发起请求。

## 四、Manifest / Bundle 与 Resolver

资源多起来后，用 **Manifest / Bundle** 做分组懒加载：

```js
const manifest = {
  bundles: [
    { name: 'load-screen', assets: [{ alias: 'background', src: 'sunset.png' }] },
    { name: 'game-screen', assets: [{ alias: 'character', src: 'robot.png' }] },
  ],
};
await Assets.init({ manifest });

const assets = await Assets.loadBundle('load-screen'); // 只加载这一组
Assets.addBundle('animals', [{ alias: 'bunny', src: 'bunny.png' }]); // 运行时动态注册新组
```

背后是 **Resolver** 的四阶段流程：标准化 → 展开通配符（如 `bunny@{1,2}x.{png,webp}` 这种多分辨率/多格式写法）→ 按平台能力选最优 → 输出具体 URL，通常配合 AssetPack 工具自动生成多分辨率/多格式清单，不需要手写。资源类型覆盖图片、视频、精灵图集（`.json`）、位图字体（`.fnt`/`.xml`）、Web 字体（`.ttf`/`.woff`）、压缩纹理（`.basis`/`.dds`/`.ktx`）。

---

图形、文本、资源都齐了，下一步进入 [事件·Ticker·滤镜](./events-ticker-filters)：让这些对象动起来、能交互、带特效。
