---
layout: doc
outline: [2, 3]
---

# 入门：QQ小程序是什么与怎么起步

> 基于 QQ小程序 · 核于 2026-07

## 速查

- **一句话**：QQ小程序＝手机 QQ 内的轻应用平台，**框架/语法与微信小程序高度同源**，仅前缀（`.qml`/`.qss`、`qq:`、`qq.*`）与登录态不同；微信工程可低成本移植
- **归属/时间**：腾讯 QQ 开放平台（q.qq.com），**2019-07-23** 开放注册
- **架构**：与微信同构——视图层（View）+ 逻辑层（App Service）两部分，`setData` 改数据自动刷新视图
- **四文件模型**：页面＝`.js`(逻辑) + `.qml`(结构) + `.qss`(样式,可选) + `.json`(配置,可选)，同路径同名；全局＝`app.js`/`app.json`/`app.qss`；**同时兼容 `.wxml`/`.wxss`**
- **起步**：注册拿 QQ AppID → 装 QQ 开发者工具 → 新建工程或直接打开微信工程 → `project.config.json` 填 QQ AppID
- **逻辑注册**：`App()`/`Page()`/`Component()`，生命周期 `onLaunch`/`onLoad`/`onShow`/`onHide`/`onUnload` 与微信一致
- **现状提醒**：基础库冻结 **v1.60.0（2022-12）**、低维护、边缘化；把它当微信同源分支学（详见[现状评估](./guide-line/status)）
- **进阶顺序**：先读[与微信对比](./guide-line/vs-wechat)吃透同源关系 → 再读[登录态与工程迁移](./guide-line/login-migration)

## 一、QQ小程序是什么、定位在哪

QQ小程序是运行在**手机 QQ 客户端内**的轻应用：用户无需下载安装，扫码 / 搜索 / 分享即达，用完即走。它归属**腾讯 QQ 开放平台**（q.qq.com，同时承载小程序、小游戏、机器人、QQ 互联等），官方 FAQ 记载于 **2019-07-23** 开放注册。

架构上它与微信小程序**同构**——分「视图层（View）」与「逻辑层（App Service）」两部分：视图层负责渲染 UI，逻辑层跑开发者 JS，两者响应式绑定，逻辑层用 `setData` 改数据后视图自动刷新。这套心智与微信完全一致，所以**会微信小程序就基本会 QQ 小程序**，主要差异只在前缀命名与登录态（详见[与微信小程序对比](./guide-line/vs-wechat)）。

::: warning 先认清现状
QQ小程序官方基础库 changelog 停在 **v1.60.0（2022-12-22）**，其后无新版本记录，事实上**低维护、已边缘化**。学习它的价值主要在「理解与微信小程序的同源关系与差异」，而非当作 2026 年的活跃主力平台。详见[现状评估](./guide-line/status)。
:::

## 二、与微信小程序、跨端框架的关系

- **与微信小程序**：近亲分支。视图语言 QML（`.qml`）对标 WXML、样式 QSS（`.qss`）对标 WXSS，视图指令 `qq:for`/`qq:if` 对标 `wx:for`/`wx:if`，API 命名空间 `qq.*` 对标 `wx.*`，而 `App()`/`Page()`/`Component()` 与 `setData` 完全一致。关键是 QQ **同时兼容** `.wxml`/`.wxss`/`wx.` 写法，迁移成本低。
- **与跨端框架（uni-app / Taro / MPX 等）**：真正「一套代码多端」通常是这些框架**编译**到各家小程序，QQ 只是其中一个输出目标端，而不是靠手写 WXML 直接复用。想系统了解跨端编译，可对照[微信小程序](../wechat-miniprogram/)与本仓库 uni-app / Taro 两叶。
- **与 Web**：和微信一样，逻辑层**无 DOM / BOM**，不能直接操作页面元素，只能通过数据驱动视图。

## 三、怎么起步

1. **注册账号，拿 QQ AppID**：在 [QQ 开放平台](https://q.qq.com/) 注册 QQ 小程序，获得 AppID。
2. **安装 QQ 开发者工具**：QQ 有独立的开发者工具，可新建 QQ 工程，**也可直接打开已有的微信小程序工程**运行调试。
3. **配置 AppID**：在 `project.config.json` 中填入 QQ AppID（迁移微信工程时可加 `qqappid` 字段）。
4. **写四类文件**：全局 `app.js` / `app.json` / `app.qss`，页面 `xxx.js` / `xxx.qml` / `xxx.json` / `xxx.qss`（四文件同路径同名）。

::: tip 文件后缀
QQ 原生后缀是 **`.qml`（结构）/ `.qss`（样式）**，但平台**同时兼容 `.wxml`/`.wxss`**；逻辑 `.js` 与配置 `.json` 与微信完全一致。因此从微信迁来的工程即使全是 `.wxml`/`.wxss` 也能直接跑。
:::

## 四、第一个页面

**逻辑层（`app.js` / 页面 `.js`）** 与微信写法完全一致：

```js
// app.js —— 全局注册，生命周期名与微信相同
App({
  onLaunch(options) {}, // 初始化，全局一次
  onShow(options) {}, // 前台显示 / 后台切回
  onHide() {}, // 切入后台
  globalData: { userInfo: null }, // 全局数据，任意页面用 getApp().globalData 取
});
```

```js
// pages/home/home.js —— 页面注册
Page({
  data: { name: 'QQ' },
  onLoad(query) {}, // 页面加载
  onReady() {},
  onShow() {},
  changeName(e) {
    // setData 改 data，视图自动刷新
    this.setData({ name: 'MINA' });
  },
});
```

**视图层（`pages/home/home.qml`）** 用 QML，指令加 `qq:` 前缀（数据绑定 mustache 与微信同形）：

```qml
<!-- 列表渲染 qq:for / 条件渲染 qq:if；点击 bindtap 触发逻辑层函数 -->
<view qq:for="{{list}}" qq:for-item="item" qq:for-index="idx" qq:key="id">
  {{idx}}: {{item.name}}
</view>
<view qq:if="{{name === 'QQ'}}">当前是 QQ</view>
<button bindtap="changeName">改名</button>
```

交互流与微信一致：视图点击 → 发事件给逻辑层 → 执行处理函数 → `setData` 改 `data` → 视图自动刷新。

## 五、心智地图：接下来读什么

- 想彻底搞清「和微信到底哪里一样、哪里不同」→ [与微信小程序对比](./guide-line/vs-wechat)（同源映射表 + QML/QSS + `qq.*` + 差异清单）。
- 想把登录跑通、把微信工程迁过来 → [登录态与工程迁移](./guide-line/login-migration)（`qq.login` + `code2Session` + `AppPlatform` 判端）。
- 想知道这平台现在还值不值得投入 → [现状评估](./guide-line/status)（基础库冻结、AI 计划归属辨析）。
- 速记表在 [参考](./reference)。
