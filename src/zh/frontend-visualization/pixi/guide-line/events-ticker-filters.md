---
layout: doc
outline: [2, 3]
---

# 事件系统·Ticker 动画与滤镜

> 基于 PixiJS v8.19 · 核于 2026-07

## 速查

- **Federated Events**：v8 用「联合事件模型」替代 v7 的 `InteractionManager`，DOM 风格 API（`on`/`addEventListener`）。
- ⚠️ **`eventMode` 默认值是 `'passive'`**：v7 默认交互行为等价于 `'auto'`，直接迁移代码可能导致原本能响应事件的对象在 v8 下不响应，需要显式设为 `'static'`/`'dynamic'`。
- **`eventMode` 五取值**：`none`（完全忽略，性能最优）/ `passive`（默认，自身不响应但可交互子元素正常工作）/ `auto`（仅父级可交互时参与命中测试）/ `static`（标准交互，适合按钮等静止元素）/ `dynamic`（同 static，额外每帧做合成命中检测，适合会动的对象）。
- **事件类型三类**：指针事件（推荐，`pointerdown`/`pointerup`/`pointermove`/`pointertap` 等）/ 鼠标事件（`click`/`rightclick`/`wheel`）/ 触摸事件（`touchstart`/`tap`）。
- **命中区域**：`hitArea` 自定义命中区域可跳过实际形状测试；`cursor` 设置鼠标样式；`isInteractive()` 判断 `eventMode` 是否为 `static`/`dynamic`。
- **性能优化**：`interactiveChildren = false` 可跳过子树遍历，适合确定无交互需求的静态子树。
- **`interactive = true` 仍可用**：是 `eventMode = 'static'` 的别名，但官方 API 以 `eventMode` 为准，新代码应直接用它。
- ⚠️ **Ticker 回调参数变了**：v7 是裸 `delta` 数字，v8 回调参数是 **`Ticker` 实例**，需要 `ticker.deltaTime`，直接把参数当数字用会得到 `[object Object]` 或 `NaN`。
- **渲染循环三步**：Ticker 回调 → 场景图更新（世界矩阵/剔除）→ GPU 渲染，底层用 `requestAnimationFrame` 驱动。
- **`deltaTime` vs `elapsedMS`**：`deltaTime` 是缩放后的帧时差（用于动画位移计算），`elapsedMS` 是原始毫秒值。
- **`UPDATE_PRIORITY`**：`HIGH`(50) > `NORMAL`(0) > `LOW`(-50)，决定多个回调的执行顺序。
- **独立 Ticker**：可 `new Ticker()` 创建多个实例（`sharedTicker: false`）获得更新顺序的完全控制；`minFPS`/`maxFPS` 钳制帧率（`maxFPS: 0` 表示不限制）。
- **暂停/恢复**：`app.stop()`/`app.start()` 手动控制渲染循环（切页/游戏暂停常用）。
- **Filters 数组叠加**：`sprite.filters = [f1, f2]` 表示按顺序链式处理，不是并行叠加。
- **内置滤镜**：`AlphaFilter`/`BlurFilter`/`ColorMatrixFilter`/`DisplacementFilter`/`NoiseFilter`。
- **高级混合模式**：需按需 `import 'pixi.js/advanced-blend-modes'` 才生效，不 import 不报错但滤镜无效。
- **自定义 Filter**：需同时提供 WebGL（`GlProgram`）与可选 WebGPU 着色器程序，`resources` 传 uniform。
- **性能提醒**：不用时 `container.filters = null` 释放；设置 `filterArea` 避免每帧自动测量包围盒；不同混合模式会打断批处理；滤镜数量越多性能下降越明显。
- **社区滤镜包路径变化**：`pixi-filters` v8 起按子路径导入（如 `pixi-filters/adjustment`），替代 v7 的 `@pixi/filter-adjustment`。
- **进阶顺序**：本页 → [性能与迁移](./performance-and-migration) → [参考](../reference)。

## 一、事件系统 Federated Events

v8 用「联合事件模型」（Federated Events）替代 v7 的 `InteractionManager`，提供 DOM 风格 API。核心是 `eventMode`：

| 取值 | 行为 |
| --- | --- |
| `none` | 完全忽略交互事件，子元素也不响应，性能最优 |
| `passive`（默认） | 自身不响应点击，但可交互子元素仍正常工作 |
| `auto` | 仅当父级可交互时才参与命中测试，自身不主动触发 |
| `static` | 标准交互：接收 pointer/mouse/touch 事件，适合按钮等静止元素 |
| `dynamic` | 同 `static`，额外在指针静止时每帧做合成命中检测，适合会动的对象 |

```js
sprite.eventMode = 'static';
sprite.on('pointerdown', () => console.log('clicked'));
sprite.addEventListener('click', (e) => {}, { once: true }); // DOM 风格写法
sprite.onclick = (e) => {};                                    // 回调属性写法

sprite.hitArea = new Rectangle(0, 0, 100, 100); // 自定义命中区域，跳过实际形状测试（性能更好）
sprite.cursor = 'pointer';
sprite.isInteractive(); // eventMode 为 static/dynamic 时为 true
```

事件类型分三类：指针事件（推荐，`pointerdown`/`pointerup`/`pointermove`/`pointertap`/`globalpointermove` 等，统一了鼠标和触摸）、鼠标事件（`click`/`rightclick`/`wheel` 等）、触摸事件（`touchstart`/`tap` 等）。命中测试沿显示树查找指针下最上层的可交互元素；`interactiveChildren = false` 可以跳过整个子树的遍历，用来优化确定无交互需求的静态区域。

⚠️ v7 的 `sprite.interactive = true` 在 v8 仍然可用，是 `eventMode = 'static'` 的别名，但官方 API 现在以 `eventMode` 为准，新代码应该直接用它——尤其要记住 **v8 的默认值是 `'passive'`**，不是 v7 那种约等于 `'auto'` 的默认交互行为，直接迁移的代码可能出现"明明设了 `interactive`，但父容器行为对不上"的意外。

## 二、Ticker 与渲染循环

渲染循环分三步：**Ticker 回调 → 场景图更新（世界矩阵/剔除）→ GPU 渲染**，底层用 `requestAnimationFrame` 驱动：

```js
import { Ticker, UPDATE_PRIORITY } from 'pixi.js';

app.ticker.add((ticker) => {
  // v8 回调参数是 Ticker 实例，不是 v7 那种裸的 delta 数字
  bunny.rotation += ticker.deltaTime * 0.1;
});
app.ticker.addOnce(fn); // 只执行一次
app.ticker.remove(fn);  // 移除回调

// 需要独立控制更新顺序时可以创建自己的 Ticker
const ticker = new Ticker();
ticker.minFPS = 30; // 钳制 deltaTime 下限，避免掉帧时动画跳变过大
ticker.maxFPS = 60; // 0 表示不限制
ticker.add(fnA, null, UPDATE_PRIORITY.HIGH); // 优先级：HIGH(50) > NORMAL(0) > LOW(-50)
```

`deltaTime` 是缩放后的帧时差（专门用于动画位移计算，帧率波动时数值会自动补偿），`elapsedMS` 则是原始毫秒值。如果需要对渲染顺序有完全控制，可以创建多个独立 `Ticker` 实例（`sharedTicker: false`），互不干扰；`app.stop()`/`app.start()` 可以手动暂停/恢复整个渲染循环，常用于切页或游戏暂停场景。

## 三、Filters 滤镜

滤镜通过数组挂到对象上，**数组顺序即处理顺序**（链式叠加，不是并行）：

```js
import { Sprite, BlurFilter, NoiseFilter } from 'pixi.js';

sprite.filters = [new BlurFilter({ strength: 8 })];
sprite.filters = [new BlurFilter({ strength: 4 }), new NoiseFilter({ noise: 0.2 })]; // 先模糊再加噪点

// 高级混合模式需要按需 import 才生效（不 import 不报错，只是效果不出现）
import 'pixi.js/advanced-blend-modes';
import { HardMixBlend } from 'pixi.js';
```

内置滤镜有 `AlphaFilter`、`BlurFilter`、`ColorMatrixFilter`、`DisplacementFilter`、`NoiseFilter`。自定义滤镜需要同时想清楚 WebGL/WebGPU 双后端的着色器：

```js
import { Filter, GlProgram } from 'pixi.js';

const customFilter = new Filter({
  glProgram: new GlProgram({ fragment, vertex }),
  resources: { timeUniforms: { uTime: { value: 0.0, type: 'f32' } } },
});
sprite.filters = [customFilter];

// 在 Ticker 里驱动 uniform 变化，做出随时间演变的效果
app.ticker.add((ticker) => {
  customFilter.resources.timeUniforms.uniforms.uTime += 0.04 * ticker.deltaTime;
});
```

性能提醒：不用滤镜时记得 `container.filters = null` 释放资源；设置 `filterArea` 可以避免每帧自动测量包围盒的开销；不同混合模式会打断批处理，滤镜数量越多性能下降越明显。社区滤镜包见 `pixi-filters`（模糊、发光等高性能滤镜合集），v8 起按子路径导入，比如 `pixi-filters/adjustment`，而不是 v7 的 `@pixi/filter-adjustment`——照搬旧 import 语句会直接找不到模块。

---

事件、动画循环、滤镜都装备齐全后，进入 [性能优化专题与 v7→v8 迁移](./performance-and-migration)：Render Groups、手动 Culling、`ParticleContainer` 海量粒子，以及一份系统化的迁移清单。
