---
layout: doc
outline: [2, 3]
---

# SWAN 框架与模板

> 基于百度智能小程序（SWAN）· 核于 2026-07

## 速查

- **SWAN 框架**：百度自研的小程序框架，模板语言称 **SWAN**，指令前缀 **`s-`** 源自百度自研的 **San.js**（这是与微信 WXML 最直观的差异）
- **文件后缀**：模板 **`.swan`**（微信 `.wxml`）、样式 **`.css`**（微信 `.wxss`）、逻辑 `.js`、配置 `.json`；全局层 `app.js` / `app.json` / `app.css` + `project.swan.json`
- **条件渲染**：**`s-if` / `s-elif` / `s-else`**（微信 `wx:if` / `wx:elif` / `wx:else`）
- **列表渲染**：**`s-for`**（微信 `wx:for`），配 **`s-for-index`** / **`s-for-item`** / **`s-key`**
- **数据插值**：双大括号语法（见下方围栏代码块，务必写在模板 `.swan` 里）
- **事件绑定**：`bind` / `catch` + **全小写事件名**（如 `bind:tap`），与微信一致；`e.currentTarget.dataset` 取 `data-*`
- **逻辑构造器**：`App()`（全局单例）、`Page()`（页面）、`Component()`（自定义组件），与微信同构
- **生命周期**：App 用 `onLaunch` / `onShow` / `onHide` / `onError`；Page 用 `onLoad` / `onReady` / `onShow` / `onHide` / `onUnload`——**名称与微信完全相同**
- **数据更新**：`this.setData({ key: value })`（与微信一致）
- **响应单位**：`rpx`（1rpx = 屏宽 / 750），与微信一致
- **一句话**：结构、构造器、生命周期几乎照搬微信，真正要换脑子的只有 **`s-` 指令**与 **`.swan` / `.css` 后缀**

## 一、SWAN 框架总览

百度智能小程序的框架自研，模板语言称 **SWAN**。它最大的辨识点是**模板指令用 `s-` 前缀**（`s-if`、`s-for`、`s-key`），这套指令语法源自百度自研的前端框架 **San.js**——`s-` 即由此而来。

除了指令前缀，SWAN 的整体设计**高度对齐微信小程序**：同样的四文件模型、同样的 `App` / `Page` / `Component` 三个构造器、同名的生命周期钩子、相同的 `bind` / `catch` 事件系统与 `setData` 数据更新。因此本页的重点是**记住 SWAN 与微信「不一样」的地方**，其余可直接套用微信心智。

## 二、文件结构与后缀

页面由四个文件组成，与微信一一对应，**仅后缀不同**：

| 用途 | 百度 SWAN | 微信 |
| --- | --- | --- |
| 模板 | **`.swan`** | `.wxml` |
| 样式 | **`.css`** | `.wxss` |
| 逻辑 | `.js` | `.js` |
| 配置 | `.json` | `.json` |
| 项目配置 | `project.swan.json` | `project.config.json` |
| 响应单位 | `rpx` | `rpx` |

全局层是 `app.js`（全局逻辑）、`app.json`（全局配置：页面路由、window、tabBar）、`app.css`（全局样式）。注意样式后缀是标准的 **`.css`**，不是微信的 `.wxss`——写的就是 CSS + `rpx`。

## 三、SWAN 模板语法

### 数据插值

模板里用双大括号做数据绑定。**务必写在 `.swan` 模板文件里**（数据绑定语法只在模板层有效）：

```html
<!-- pages/index/index.swan -->
<view>Hello {{ name }}</view>
<view>{{ count + 1 }}</view>
```

### 条件渲染：`s-if` / `s-elif` / `s-else`

```html
<view s-if="cond">A</view>
<view s-elif="other">B</view>
<view s-else>C</view>
```

对应微信的 `wx:if` / `wx:elif` / `wx:else`——**换成 `s-` 前缀**即可。

### 列表渲染：`s-for` / `s-for-index` / `s-for-item` / `s-key`

```html
<!-- 基本列表：s-for（微信 wx:for） -->
<view s-for="item in items">{{ item.text }}</view>

<!-- 自定义索引名 / 项名 + key -->
<view
  s-for="item in items"
  s-for-index="idx"
  s-for-item="row"
  s-key="id"
>{{ idx }} - {{ row.text }}</view>
```

`s-for` 对应微信 `wx:for`，`s-for-index` / `s-for-item` / `s-key` 对应 `wx:for-index` / `wx:for-item` / `wx:key`。`s-key` 用于列表 diff 优化，取列表项里的唯一字段名。

### 事件绑定

事件用 `bind` / `catch`（阻止冒泡）+ **全小写事件名**，与微信一致；通过 `data-*` 传参、在回调里用 `dataset` 取：

```html
<view data-id="123" bind:tap="handleTap">Click</view>
```

```javascript
Page({
  handleTap(e) {
    // 与微信一致：从 currentTarget.dataset 取 data-*
    console.log(e.currentTarget.dataset.id); // '123'
  },
});
```

## 四、逻辑层：App / Page / Component

### App()

`app.js` 里的全局单例，管理小程序级别的生命周期与全局数据：

```javascript
App({
  onLaunch() {},   // 初始化，仅执行一次
  onShow() {},     // 小程序前台展现
  onHide() {},     // 切到后台
  onError() {},    // 全局错误捕获
  globalData: {},  // 全局共享数据
});
```

### Page()

页面构造器，生命周期钩子与微信同名：

```javascript
Page({
  data: { name: 'swan' },
  onLoad(options) {
    // 页面加载，接收路由参数（如 options.id）
  },
  onReady() {},   // 页面首次渲染完成
  onShow() {},    // 页面展现
  onHide() {},    // 页面隐藏
  onUnload() {},  // 页面卸载
  updateName() {
    // 数据更新：与微信完全一致的 setData
    this.setData({ name: 'baidu' });
  },
});
```

### Component()

自定义组件构造器，用法类微信 `Component`（`properties` / `data` / `methods` / 组件生命周期）。注册后在页面 `json` 的 `usingComponents` 里声明即可使用。

## 五、生命周期速记

| 层级 | 钩子 | 说明 |
| --- | --- | --- |
| App | `onLaunch` | 初始化，仅一次 |
| App | `onShow` / `onHide` | 前台 / 后台切换 |
| App | `onError` | 全局错误 |
| Page | `onLoad(options)` | 加载，接收路由参数 |
| Page | `onReady` | 首次渲染完成 |
| Page | `onShow` / `onHide` | 页面显示 / 隐藏 |
| Page | `onUnload` | 页面卸载 |

这套生命周期名称与微信**完全相同**，可直接迁移已有微信心智。掌握了 SWAN 的模板与逻辑层，下一步是 [API 与分发](./api-distribution)：`swan.*` 接口、`swan.ai.*` AI 能力与百度搜索分发；平台现状与迁移见[现状定位与迁移](./status-vs-wechat)。
