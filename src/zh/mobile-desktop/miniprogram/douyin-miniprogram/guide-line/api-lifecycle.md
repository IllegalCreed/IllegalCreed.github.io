---
layout: doc
outline: [2, 3]
---

# 抖音小程序 API 与生命周期

> 基于抖音小程序（基础库 4.x）· 核于 2026-07

## 速查

- **API 前缀 `tt.*`**：方法名与微信 `wx.*` 大面积同名同心智，回调风格 `success`/`fail`/`complete`
- 常用：`tt.request`、`tt.navigateTo`/`redirectTo`/`switchTab`/`navigateBack`、`tt.setStorage(Sync)`、`tt.showToast`/`showModal`、`tt.getLocation`/`getSystemInfo`、`tt.shareAppMessage`、`tt.matchMedia`（大屏，3.63.0+）
- **App/Page/Component 生命周期与微信同名**：App `onLaunch`/`onShow`/`onHide`/`onError`；Page `onLoad`→`onShow`→`onReady`→`onHide`→`onUnload`；Component `created`/`attached`/`ready`/`detached`
- **`setData`** 是逻辑层→视图层唯一数据通道；避免高频/大数据量（性能命门，同微信）
- 页面注册两种方式：**Page 构造器** 与 **Component 构造器**

## 一、tt.* API（对比微信）

命名空间 `tt`，绝大多数方法与微信同名，仅前缀不同：

| 能力 | 抖音 | 微信 |
| --- | --- | --- |
| 网络 | `tt.request` / `uploadFile` / `downloadFile` | `wx.*` 同名 |
| 路由 | `tt.navigateTo` / `redirectTo` / `switchTab` / `navigateBack` | 同名 |
| 跨小程序 | `tt.navigateToMiniProgram` | 同名 |
| 存储 | `tt.setStorage(Sync)` / `getStorage(Sync)` | 同名 |
| 交互 | `tt.showToast` / `showModal` / `showLoading` | 同名 |
| 位置/设备 | `tt.getLocation` / `getSystemInfo` | 同名 |
| 媒体 | `tt.chooseImage` / `compressImage` | 同名 |
| 转发 | `tt.shareAppMessage` | `wx.shareAppMessage` |
| 大屏适配 | `tt.matchMedia`（基础库 3.63.0，2025-03） | 各异 |

```js
tt.request({
  url: 'https://api.example.com/data',
  method: 'GET',
  data: { id: 1 },
  header: { 'content-type': 'application/json' },
  success(res) { console.log(res.data, res.statusCode); },
  fail(err) {},
});
```

> `tt.request` 的完整参数（`dataType`/`responseType`/超时字段等）是否与微信 100% 一致，以官方 API 页最新为准。

## 二、App / Page / Component 生命周期

**App()**（全局唯一，`getApp()` 取，`globalData` 跨页共享）：`onLaunch`（初始化，一次）、`onShow`（前台，携 scene 场景值）、`onHide`（后台）、`onError`。

**Page()**（页面）：

```js
Page({
  data: { message: 'hello' },       // 初始数据，setData 更新
  onLoad(options) {},                // 加载（拿路由参数）
  onShow() {}, onReady() {},          // 显示 / 首次渲染完成
  onHide() {}, onUnload() {},         // 隐藏 / 卸载
  onPullDownRefresh() {}, onReachBottom() {}, onPageScroll() {},
  onShareAppMessage() {},            // 转发
});
```

生命周期链：逻辑层创建 Page 实例 → 把初始 `data` 发到视图层渲染 → 依次 `onLoad`→`onShow`，渲染完成触发 `onReady`。

**Component()**（自定义组件）：`properties`（外部传入）、`data`（内部）、`methods`、生命周期 `created`/`attached`/`ready`/`detached`（同微信 Component）。官方支持用 **Page 构造器** 或 **Component 构造器** 两种方式注册页面。

## 三、setData（性能命门）

- `setData(obj, callback?)` 是逻辑层→视图层的**唯一**数据通道。
- 与微信同理：**避免高频调用、避免一次传大数据量**，只 set 变化的字段——否则跨线程通信成为性能瓶颈。
