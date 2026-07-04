---
layout: doc
outline: [2, 3]
---

# 插件体系与自定义图表：钩子 / Filler / mixed / 自定义 controller

> 基于 **Chart.js 4.5.x** · 核于 2026-07

## 速查

- **两种用法**：
  - **inline**：`new Chart(ctx, { plugins: [{...}] })`——仅该实例生效，不能全局复用，也不可用于需注册的场景
  - **全局**：`Chart.register({ id, ...钩子, defaults })`——所有图表生效
- **id 规范**：必须符合 npm 包名规范（小写、URL 安全）；要配 options 或全局注册就必须有 id；发布约定前缀 `chartjs-plugin-`
- **钩子清单**（按生命周期分组）：
  - 安装态：`install / start / stop / uninstall`
  - 初始化：`beforeInit / afterInit`
  - 更新：`beforeUpdate / afterUpdate`、`beforeLayout / afterLayout`、`beforeDatasetsUpdate / afterDatasetsUpdate`、`beforeDatasetUpdate / afterDatasetUpdate`、`beforeElementsUpdate`
  - 渲染：`beforeRender / afterRender`、`beforeDraw / afterDraw`、`beforeDatasetsDraw / afterDatasetsDraw`、`beforeDatasetDraw / afterDatasetDraw`、`beforeTooltipDraw / afterTooltipDraw`
  - 事件：`beforeEvent / afterEvent`
  - 其他：`resize / reset / beforeDestroy / afterDestroy`（**v4 移除 `destroy` 钩子，用 `afterDestroy`**）
- **取消机制**：多数 `before*` 钩子返回 `false` 可取消对应阶段（如 beforeRender 返回 false 取消渲染）
- **插件配置**：从 `options.plugins.{id}` 传入，即钩子第三参 options；插件可带 `defaults`
- **没有 id 就收不到 options**：要接收配置或全局注册，插件必须声明 id
- **禁用**：`options.plugins.{id}: false` 禁单个；`options.plugins: false` 禁全部
- **事件定制**：插件可用 `options.plugins.{id}.events` 单独定制要监听的事件
- **画布背景色套路**：`beforeDraw` 里 `ctx.globalCompositeOperation = 'destination-over'` + fillRect——顺带解决 `toBase64Image()` 导出 PNG 透明底问题
- **v4 内置插件**：`Decimation`、`Filler`、`Legend`、`SubTitle`、`Title`、`Tooltip`、`Colors`（按需注册别漏）
- **Filler 与面积图**：面积图不是独立 type——line / radar 设 `fill` 即面积；取值 `'origin' / 'start' / 'end'`、绝对 dataset 索引（数字）、相对索引（`'-1'` / `'+1'` 字符串）、`{ value: 25 }`（填到轴值）、`'shape'`；选项 `plugins.filler.propagate`
- **Colors 插件提醒**：v4 内置自动配色，UMD 默认启用、按需注册路线要手动 `Chart.register(Colors)`（详见[数据结构与 options](./data-and-options)）
- **常用社区插件**：`chartjs-plugin-zoom`（滚轮 / 捏合缩放平移）、`chartjs-plugin-datalabels`（图上直接标数值）、`chartjs-plugin-annotation`（参考线 / 框 / 标注）
- **8 种内置之外的图表类型**（桑基 / 关系图等）：走社区插件或自定义 controller
- **mixed 混合图**：顶层 type + dataset 级 `type` 覆盖，如柱线组合
- **mixed 层叠规则**：datasets[0] 绘制在最上层；`order` 越大越先画（越靠下层）——常给 line 较小 order 让线浮在柱上
- **自定义类型（派生）**：`class Custom extends BubbleController` 覆写 `draw()`，静态 `id` + `defaults`，`Chart.register(Custom)` 后 `type: 'derivedBubble'` 引用
- **自定义类型（从零）**：`extends DatasetController`，实现 `update(mode)` 等，静态 `id` + `defaults`（含 `datasetElementType / dataElementType`）
- **TS 集成**：declare module 合并 `ChartTypeRegistry` 注册新 type 名；插件选项扩展同走 declare module 'chart.js' 声明合并

## 一、两种用法：inline vs 全局注册

```js
// inline：仅该实例生效，不能全局复用（且不可用于需注册的场景）
new Chart(ctx, {
  plugins: [{
    id: 'p1',
    beforeDraw(chart, args, options) { /* ... */ }
  }]
});

// 全局：所有图表生效
Chart.register({
  id: 'bg',
  beforeDraw(chart, args, options) { /* ... */ },
  defaults: { color: 'lightGreen' }   // 插件自己的默认配置
});
```

**id 规范**：必须符合 npm 包名规范（小写、URL 安全）；只要想接收 options 或全局注册，就必须有 id；对外发布约定前缀 `chartjs-plugin-`。

## 二、插件生命周期钩子

按生命周期分组记忆：

| 阶段 | 钩子 |
| --- | --- |
| 安装态 | `install / start / stop / uninstall` |
| 初始化 | `beforeInit / afterInit` |
| 更新 | `beforeUpdate / afterUpdate`、`beforeLayout / afterLayout`、`beforeDatasetsUpdate / afterDatasetsUpdate`、`beforeDatasetUpdate / afterDatasetUpdate`、`beforeElementsUpdate` |
| 渲染 | `beforeRender / afterRender`、`beforeDraw / afterDraw`、`beforeDatasetsDraw / afterDatasetsDraw`、`beforeDatasetDraw / afterDatasetDraw`、`beforeTooltipDraw / afterTooltipDraw` |
| 事件 | `beforeEvent / afterEvent` |
| 其他 | `resize / reset / beforeDestroy / afterDestroy` |

- **多数 `before*` 钩子返回 `false` 可取消对应阶段**——如 beforeRender 返回 false 直接取消本次渲染。
- **v4 移除了 `destroy` 钩子**，清理逻辑改挂 `afterDestroy`。

## 三、插件配置与禁用

- 插件配置从 `options.plugins.{id}` 传入，**就是钩子的第三参 options**；配合插件声明的 `defaults` 提供默认值。
- 禁用粒度：`options.plugins.{id}: false` 禁用单个插件；`options.plugins: false` 禁用全部插件。
- 事件粒度：插件可用 `options.plugins.{id}.events` 单独定制要监听的事件。

## 四、实战：画布背景色插件（兼治导出透明底）

canvas 默认透明，`toBase64Image()` 导出 PNG 没有背景——经典解法就是一个 beforeDraw 插件，用 `destination-over` 把背景铺在已有内容**下方**：

```js
// 典型自定义插件：画布背景色
const customCanvasBackgroundColor = {
  id: 'customCanvasBackgroundColor',
  beforeDraw(chart, args, options) {
    const { ctx } = chart;
    ctx.save();
    ctx.globalCompositeOperation = 'destination-over'; // 新绘制内容垫到已有内容下方
    ctx.fillStyle = options.color || '#fff';           // 从 options.plugins.{id} 读配置
    ctx.fillRect(0, 0, chart.width, chart.height);
    ctx.restore();
  }
};

new Chart(ctx, {
  type: 'bar',
  data,
  options: { plugins: { customCanvasBackgroundColor: { color: 'lightGreen' } } },
  plugins: [customCanvasBackgroundColor]
});
```

## 五、内置与社区插件盘点

**v4 内置可注册插件**：`Decimation`（降采样，见[性能优化](./performance)）、`Filler`（面积填充）、`Legend`、`SubTitle`、`Title`、`Tooltip`、`Colors`（自动配色，见[数据结构与 options](./data-and-options)）。按需注册路线下**用到哪个都得注册**，漏了 Filler 就没有面积填充。

**Filler 与面积图**：面积图不是独立 type——line / radar 设 `fill` 即面积。fill 取值一览：

| 取值 | 含义 |
| --- | --- |
| `'origin'` / `'start'` / `'end'` | 填到原点 / 轴起点 / 轴终点 |
| 数字（如 `1`） | 填到**绝对索引**的 dataset |
| `'-1'` / `'+1'`（字符串） | 填到**相对索引**的 dataset |
| `{ value: 25 }` | 填到指定轴值 |
| `'shape'` | 闭合数据形状内部 |

插件选项：`plugins.filler.propagate`。

**常用社区插件一句话**：`chartjs-plugin-zoom`（滚轮 / 捏合缩放平移）、`chartjs-plugin-datalabels`（图上直接标数值）、`chartjs-plugin-annotation`（参考线 / 框 / 标注）。桑基图、关系图等额外图表类型也走社区插件生态。

## 六、mixed 混合图表

顶层 type 定基调，dataset 级 `type` 逐个覆盖：

```js
new Chart(ctx, {
  type: 'bar',                          // 顶层类型
  data: {
    labels,
    datasets: [
      { type: 'line', label: '趋势', data: trend },   // 这一组画成折线
      { label: '销量', data: sales }                   // 未覆盖的沿用顶层 bar
    ]
  }
});
```

**层叠规则（必考）**：`datasets[0]` 绘制在**最上层**；`order` 越大越**先**画（越靠**下**层）——所以常给 line 较小的 `order`，让折线浮在柱子上方。

## 七、自定义图表类型（New Charts）

派生现有 controller，加自己的绘制逻辑：

```js
class Custom extends BubbleController {
  draw() {
    super.draw(arguments);          // 先走原类型绘制
    const meta = this.getMeta();    // 拿元数据做自定义附加绘制
  }
}
Custom.id = 'derivedBubble';                     // 静态 id：注册后的 type 名
Custom.defaults = BubbleController.defaults;     // 静态 defaults

Chart.register(Custom);
new Chart(ctx, { type: 'derivedBubble', data, options });
```

- **从零建类型**则 `extends DatasetController`，实现 `update(mode)` 等方法，同样提供静态 `id` + `defaults`（含 `datasetElementType / dataElementType` 声明元素类型）。
- **TypeScript**：用 declare module 合并 `ChartTypeRegistry`，把新 type 名注册进类型系统；自定义插件选项的类型扩展同理走 declare module 'chart.js' 声明合并。类型内置的常用导出还有 `ChartConfiguration / ChartData / ChartOptions / ChartDataset / TooltipItem / ScriptableContext`，实例泛型是 `Chart<TType, TData, TLabel>`。

下一页：[性能优化与实例管理](./performance) —— destroy / update 正确姿势、Chart.getChart、decimation 降采样与 OffscreenCanvas。
