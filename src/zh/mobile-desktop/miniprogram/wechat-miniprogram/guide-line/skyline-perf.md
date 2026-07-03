---
layout: doc
outline: [2, 3]
---

# Skyline 渲染引擎与性能优化

> 基于微信小程序（基础库 3.x）· 核于 2026-07

## 速查

- **Skyline 是什么**：微信自研的**新渲染引擎**，在传统 WebView 渲染之外新增，用更精简高效的渲染管线把性能推向原生；**正式版起于基础库 3.0.0**，配合新一代组件框架 **glass-easel**
- **Skyline vs WebView**：Skyline 用**独立渲染线程**做布局 + 合成（逻辑仍在 App Service）、**页面共享无每页 JS 引擎实例**（内存低）、**去掉框架层 JSBridge 开销**、渲染不易被逻辑阻塞
- **官方数据**：基础库 3.0.0 + glass-easel，**启动 −17.6% / 渲染阶段 −50%**（Skyline 官方口径）
- **启用**：`app.json` 或页面 json 里 `"renderer": "skyline"`（可全局或按页）+ `"componentFramework": "glass-easel"`
- **Skyline 新特性**：**Worklet 动画**(高性能，替 WXS 动画) / **手势系统**(原生级) / 自定义路由与共享元素动画 / `grid-view`·`snapshot`·`sticky-section` 等新组件
- **迁移坑**：从 WebView 迁 Skyline 大体兼容但需改造；**WXS 在 Skyline 下变异步 → 动画必须改 Worklet**；部分 CSS / 组件支持有差异（以官方「Skyline / 支持与差异」页为准）
- **性能优化主线**：① 控 `setData`（见 [双线程与 setData](./dual-thread)）② 分包 + 预下载（见 [分包与云开发](./subpackage-cloud)）③ 首屏精简 / 骨架屏 ④ 图片按需与懒加载 ⑤ 长列表用 `recycle-view` / 虚拟列表
- **运行机制**：冷启动 / 热启动；切后台**约 5s 执行窗口** → 挂起 → **约 30 分钟或资源紧张时销毁**；即时更新用 `wx.getUpdateManager()`

## 一、Skyline 是什么

传统模式下，小程序渲染层是**每个页面一个 WebView**：DOM、CSS、排版、绘制都在 WebView 内完成，逻辑层与渲染层间还隔着一层框架 JSBridge 通信。这套模型稳定，但每页一份 JS 引擎实例、有框架层通信开销，性能与原生仍有差距。

**Skyline** 是微信自研的**新渲染引擎**，在 WebView 渲染之外**新增**一条更精简高效的渲染管线，目标是把渲染性能推向原生。它**正式版起于基础库 3.0.0**，配合新一代组件框架 **glass-easel**（替代旧的 exparser，支持更完整的 Web Component 特性）。

## 二、Skyline vs WebView

| 维度 | WebView（传统） | Skyline |
| --- | --- | --- |
| 渲染 | 每页一个 WebView，DOM/CSS/排版/绘制在 WebView 内 | **独立渲染线程**做布局 + 合成，逻辑仍在 App Service |
| 内存 | 每页一份 JS 引擎实例，开销大 | **页面共享，无每页 JS 引擎实例**，内存低 |
| 通信 | 有框架层 JSBridge 通信开销 | **去掉框架层 JSBridge 开销** |
| 卡顿 | 逻辑可能阻塞渲染 | **渲染不易被逻辑阻塞** |

**官方数据**：基础库 3.0.0 + glass-easel 下，**启动耗时 −17.6%、渲染阶段耗时 −50%**（Skyline 官方口径）。微信鸿蒙 OS 版也已支持 Skyline。

## 三、启用与新特性

启用只需在 `app.json`（全局）或某页 `.json`（按页）声明渲染器：

```json
{
  "renderer": "skyline",
  "componentFramework": "glass-easel"
}
```

Skyline 带来一批 WebView 模式下没有或较弱的能力：

- **Worklet 动画**：高性能动画机制，在渲染线程运行，**替代传统 WXS 动画**。
- **手势系统**：原生级触摸手势，做拖拽 / 滑动交互更跟手。
- **自定义路由与共享元素动画**：页面间转场可做共享元素过渡。
- **新组件**：`grid-view`、`snapshot`（截图）、`sticky-section`（吸顶分区）、增强滚动容器、全局吸顶工具栏等。

## 四、从 WebView 迁移 Skyline 的坑

Skyline 与 WebView 大体兼容，但迁移需改造，注意：

- **WXS 在 Skyline 下变为异步** → 原本用 WXS 做的动画**必须改用 Worklet**（详见[四文件与 WXS](./four-files)对 WXS 的说明）。
- **部分 CSS / 组件支持有差异**：某些 CSS 属性、基础组件在 Skyline 下表现不同或暂不支持，改造前**务必查官方「Skyline / 支持与差异」页**逐条核对。

## 五、运行机制：冷 / 热启动与更新

性能与启动体验绕不开小程序的运行机制：

- **冷启动**：首次打开或被销毁后重开，**完整初始化**（下主包、初始化运行时）。
- **热启动**：一定时间窗内从后台恢复，**保留状态、不重新初始化**。
- **前台 → 后台 → 挂起 → 销毁**：切后台后有**约 5s 执行窗口**处理收尾 → 挂起（JS 停止执行、内存保留）→ 挂起**约 30 分钟后或系统资源紧张时被销毁**。
- **保存退出状态**：`onSaveExitState()` 存数据，重启时用 `exitState` 恢复（默认 24h 有效）。
- **更新机制**：冷启动时静默检查更新，一般**下次冷启动生效**；要即时更新用 **`wx.getUpdateManager()`**（`onUpdateReady` → `applyUpdate()`）。
- **场景值 `scene`**：`onLaunch` / `onShow` 的 `options.scene` 标识用户从何入口进入（扫码 / 分享 / 搜索 / 下拉等），用于统计与差异化逻辑。

## 六、性能优化清单

把前几页的机制串成一套可执行清单：

1. **控 `setData`**（第一优先）：只放渲染数据、降频、data path 局部更新、后台不更新、高频封装成组件（详见[双线程与 setData](./dual-thread)）。
2. **分包 + 预下载**：首屏只下主包，非首屏拆分包，热门路径 `preloadRule` 预下（详见[分包与云开发](./subpackage-cloud)）。
3. **首屏精简**：减少首屏节点与 `setData` 数据量，用骨架屏改善感知。
4. **图片治理**：按需尺寸、懒加载、用 CDN / 云存储；WXSS 背景图用网络图或 base64（不支持本地图）。
5. **长列表**：用官方 `recycle-view` 或虚拟列表回收复用节点，避免一次性渲染大量节点。
6. **能力检测降级**：`wx.canIUse` 判断 API / 组件可用性，低版本平滑降级。
7. **善用诊断**：开发者工具「体验评分」、组件 `setUpdatePerformanceListener` 定位瓶颈。

> 下一步：接入登录与收款，见 [登录与支付](./login-pay)。
