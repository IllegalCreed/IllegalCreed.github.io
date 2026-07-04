---
layout: doc
outline: [2, 3]
---

# 序列化与自定义：导出 / 子类化 / 性能缓存

> 基于 Fabric.js v7.4.0 · 核于 2026-07

## 速查

- **导出四件套**：`canvas.toObject()`（同步纯对象）/`canvas.toJSON()`（同步，含版本号等元信息，可直接 `JSON.stringify`）/`canvas.toSVG()`（同步，导出 SVG 字符串）/`canvas.toDataURL({ format, multiplier })`（同步，导出位图）。
- **导入是 Promise**：`canvas.loadFromJSON(json).then((canvas) => canvas.requestRenderAll())`——v6 起异步，v5 是回调。
- **自定义属性不登记会静默丢失**：业务代码直接 `obj.myProp = xxx` 赋值，不注册 `FabricObject.customProperties` 或不覆写 `toObject()`，调用 `toJSON()` 导出时该字段会被悄悄丢弃，**不会报任何错误或警告**。
- **登记自定义属性两步**：① TS 类型合并 `declare module 'fabric' { interface FabricObject {...}; interface SerializedObjectProps {...} }`（可选，仅类型检查需要）；② 运行时登记 `FabricObject.customProperties = ['id', 'name']`（决定序列化时是否真的带出字段）。
- **子类化场景更推荐覆写 `toObject()`**：`class PathPlus extends Path { toObject(propertiesToInclude = []) { return super.toObject([...propertiesToInclude, 'id']) } }`，注册后 `loadFromJSON` 才能正确还原成对应子类实例。
- **子类化标准写法**：`class Star extends FabricObject { static type = 'star'; _render(ctx) {...} }` + `classRegistry.setClass(Star, 'star')`——注册后 `toObject`/`loadFromJSON` 才能正确序列化与还原。
- **v6 起子类化统一为标准 `class extends`**（v5 是函数式原型扩展 + `createClass` 工具函数），默认属性通过类的静态字段/构造函数赋值到实例上，不是像 v5 那样共享同一个可变的原型对象——顺带修复了 v5「多个实例共享同一个默认对象、互相污染」的老问题。
- **性能三兄弟**：`objectCaching`（是否开启离屏缓存）/`noScaleCache`（缩放时不重建缓存，用旧缓存位图直接拉伸）/`dirty`（手动标记缓存过期）。
- **全局缓存上限**：`config.perfLimitSizeTotal`（缓存位图总像素上限）/`config.maxCacheSideLimit`（单个缓存位图边长上限）。
- **缓存收益不均**：复杂 `Path`/长文本/大量子对象的 `Group` 收益明显；简单形状（`Rect`/`Circle`）收益很小。
- **viewport 缩放的连带效应**：整体缩放会让**所有对象缓存同时失效**（缓存按屏幕像素密度生成），需要针对性关闭或调大缓存上限。
- **导出前建议关缓存**：导出高质量 PNG 前临时关闭 `objectCaching`，避免位图降采样导致模糊。
- **改属性优先走 `set()`**：Fabric 通过 `set()` 感知 `cacheProperties` 字段变化来自动置位 `dirty`；直接赋值可能不会正确标记缓存失效，画面没更新时先检查这一点。
- **SVG 导出安全须知**：`toSVG()` 对不可信内容的处理历史上出现过两次 CVE——**CVE-2026-27013**（7.2.0 修复的 stored XSS）、**CVE-2026-44311**（7.4.0 修复的 CSS 注入）；生产环境导入/导出不可信 SVG 内容前，确认依赖版本已包含这两次修复。
- **方法链风格不推荐**：v5 时代 `obj.set({fill:'red'}).rotate(90)` 链式写法在 v6+ 仍可能可用，但官方不再推荐，新代码应拆成独立语句，避免依赖未文档化的返回值行为。
- **进阶顺序**：[入门](../getting-started) → [Canvas 与对象模型](./canvas-and-objects) → [文本、图片与群组](./text-image-group) → [交互与事件](./interaction-and-events) → 本页 → [参考](../reference)。

## 一、序列化与导出

```javascript
// 导出
const json = canvas.toObject()       // 同步，纯对象
const jsonWithMeta = canvas.toJSON() // 同步，含版本号等元信息，可直接 JSON.stringify
const svgString = canvas.toSVG()     // 同步，导出 SVG 字符串
const dataUrl = canvas.toDataURL({ format: 'png', multiplier: 2 }) // 同步，导出位图

// 导入（v6 起是 Promise，v5 是回调）
canvas.loadFromJSON(json).then((canvas) => canvas.requestRenderAll())
```

四种导出方法都是同步的，区别只在输出格式；导入 `loadFromJSON` 则是 v6 起改成的 Promise API，v5 遗留的回调式写法语义不对，必须 `await`/`.then()`。

自定义属性要「入库」必须显式登记，否则 `toObject()`/`toJSON()` 会静默丢弃——**不会报任何错误或警告**，这是最容易被忽略的坑之一：

```typescript
// 1. TS 类型合并（可选，但类型检查需要）
declare module 'fabric' {
  interface FabricObject { id?: string; name?: string }
  interface SerializedObjectProps { id?: string; name?: string }
}

// 2. 运行时登记（决定序列化时是否真的带出这两个字段）
FabricObject.customProperties = ['id', 'name']
```

子类化场景下更推荐直接覆写 `toObject()`：

```typescript
class PathPlus extends Path {
  declare id?: string
  toObject(propertiesToInclude = []) {
    return super.toObject([...propertiesToInclude, 'id'])
  }
}
classRegistry.setClass(PathPlus, 'path')  // 注册后 loadFromJSON 才能正确还原成 PathPlus 实例
```

**SVG 导出安全须知**：`toSVG()` 对不可信内容的处理历史上出现过两次安全修复——**CVE-2026-27013**（7.2.0 修复的 stored XSS）、**CVE-2026-44311**（7.4.0 修复的 CSS 注入）。如果业务场景涉及导入/导出用户提供的 SVG 或将 `toSVG()` 输出直接嵌入页面，需确认依赖版本已包含这两次修复，不要假设旧版本的 `toSVG`/`loadSVGFromString` 对不可信输入天然安全。

## 二、子类化与自定义

```typescript
import { FabricObject, classRegistry } from 'fabric'

class Star extends FabricObject {
  static type = 'star'
  _render(ctx: CanvasRenderingContext2D) {
    // 自定义绘制逻辑，super._render 不一定要调用
    ctx.beginPath()
    // ...画五角星路径
    ctx.fill()
  }
}
classRegistry.setClass(Star, 'star') // 注册后 toObject/loadFromJSON 才能正确序列化与还原
```

v6 起子类化统一为标准 ES6 `class extends`（v5 是函数式原型扩展 + `createClass` 工具函数），默认属性通过类的静态字段/构造函数赋值到实例上，而不是像 v5 那样共享同一个可变的原型对象——这也顺带修复了 v5 时代「多个实例共享同一个默认对象、互相污染」的老问题。自定义类无论是全新形状（如上面的 `Star`）还是继承内置类扩展（如上面序列化一节的 `PathPlus`），都要调用 `classRegistry.setClass()` 注册，`loadFromJSON` 才能在反序列化时识别出正确的类。

方法链风格也是一处新旧写法的分野：v5 时代 `obj.set({fill:'red'}).rotate(90)` 链式写法在 v6+ 仍可能可用，但官方不再推荐，新代码应拆成独立语句，避免依赖未文档化的返回值行为。

## 三、性能与缓存

```javascript
obj.objectCaching = false     // 关闭该对象的离屏缓存（简单形状收益本就很低）
obj.noScaleCache = true       // 缩放时不重建缓存（用旧缓存位图直接拉伸，牺牲清晰度换性能）
obj.dirty = true              // 手动标记缓存过期，强制下次渲染重建

import { config } from 'fabric'
config.perfLimitSizeTotal = 4096 * 1024  // 缓存位图总像素上限
config.maxCacheSideLimit = 8192          // 单个缓存位图边长上限
```

`objectCaching` 开启后 Fabric 会把对象预渲染到离屏 canvas，交互（拖拽/旋转/缩放）时直接 `drawImage` 搬运缓存位图而非重新走完整绘制路径，对复杂 `Path`/长文本/大量子对象的 `Group` 收益明显；但简单形状（`Rect`/`Circle`）收益很小，viewport 整体缩放会让所有对象缓存同时失效（因为缓存是按屏幕像素密度生成的），需要针对性关闭或调大缓存上限；导出高质量 PNG 前建议临时关闭缓存以避免位图降采样导致模糊。

改属性时优先走 `set()` 方法而非直接赋值，因为 Fabric 通过 `set()` 感知 `cacheProperties` 里的字段变化来自动置位 `dirty`——如果发现改了属性但画面没更新，第一反应应该是检查是否绕过了 `set()` 直接赋值导致缓存没有失效。

到这里，Fabric.js 的对象模型、内容类型、交互体系、序列化与性能已经覆盖完整，[参考页](../reference)提供一份浓缩的 API/属性/事件速查表与选型对比，方便日常查阅。
