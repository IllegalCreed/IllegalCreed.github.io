---
layout: doc
outline: [2, 3]
---

# 与微信小程序对比

> 基于 QQ小程序 · 核于 2026-07

## 速查

- **核心结论**：QQ小程序是微信小程序体系的**近亲分支**，框架 / 组件 / API 形态几乎一一对应，主要差异在**前缀命名**与**账号/登录态**两处
- **视图/样式**：`.qml`（对标 `.wxml`）+ `.qss`（对标 `.wxss`）；平台**同时兼容 `.wxml`/`.wxss`**
- **视图指令**：`qq:for` / `qq:for-item` / `qq:for-index` / `qq:key`、`qq:if` / `qq:elif` / `qq:else`（对标 `wx:`；QML 里也认 `wx:`）
- **API**：命名空间 `qq.*`（`qq.request` / `qq.login` / `qq.setStorage` / `qq.navigateTo`…），多数与 `wx.*` **同名同参**
- **逻辑/组件**：`App()` / `Page()` / `Component()` + `behaviors`、生命周期、`setData`、组件体系**完全一致**
- **兼容写法**：官方 FAQ 明确支持 `wx/`、`.wxml`、`.wxss`，微信工程可几乎原样打开（迁移详见[登录态与工程迁移](./login-migration)）
- **差异点**：①部分 `wx.*` 在 QQ 缺失或行为不同（**完整清单待核**，需逐 API 页比对）②登录态与微信独立 ③开放能力类组件是 QQ 特色（`open-data` 拉 QQ 昵称/头像等）
- **真正多端**：一套代码多端通常仍走 uni-app / Taro / MPX 等跨端框架**编译**，QQ 只是其输出目标端之一

## 一、同源关系全景

一句话记住：**QQ小程序 = 换了前缀与登录态的微信小程序**。逐维度对照如下：

| 维度 | 微信小程序 | QQ小程序 | 说明 |
| --- | --- | --- | --- |
| 视图语言 | WXML | **QML**（`.qml`） | QQ 原生用 QML，但**同时兼容 WXML** |
| 样式语言 | WXSS | **QSS**（`.qss`） | 同上，兼容 WXSS |
| 视图指令 | `wx:for` / `wx:if` | **`qq:for` / `qq:if`** | 一一对应，仅前缀不同；QML 里也认 `wx:` |
| API 前缀 | `wx.*` | **`qq.*`** | `qq.request` / `qq.login`… 与 `wx.*` 多数同名同参 |
| 逻辑注册 | `App()` / `Page()` / `Component()` | **完全相同** | 生命周期、`setData` 一致 |
| 组件 | view / text / button… | **同名同结构** | 组件体系基本一致 |
| 登录态 | wx 登录，openid/unionid（微信体系） | **QQ 登录态，独立 openid/session_key** | 两平台账号/登录态**互不相通** |
| 环境判断 | — | `qq.getSystemInfoSync().AppPlatform === 'qq'` | 用于同一套代码区分运行端 |

## 二、文件结构与后缀

**App 根目录（3 文件）**：`app.js`（必需，逻辑）、`app.json`（必需，全局配置）、`app.qss`（可选，全局样式）。

**每个页面（4 文件，同路径同名）**：`.js`（必需，逻辑）、`.qml`（必需，结构，相当于微信 `.wxml`）、`.json`（可选，页面配置）、`.qss`（可选，页面样式，相当于微信 `.wxss`）。

- 例：`pages/home/home.js` / `home.qml` / `home.json` / `home.qss`。
- **关键**：QQ 原生后缀是 **`.qml` / `.qss`**，但平台**同时兼容 `.wxml` / `.wxss`**（迁移友好）；逻辑 `.js` 与配置 `.json` 与微信完全一致。

## 三、视图层 QML / QSS：指令与模板

QML 文件后缀 `.qml`，文档明确「QQ 小程序**同时兼容 WXML** 标签语言」，即 QML 与 WXML 并存。核心语法只是把 `wx:` 前缀换成 `qq:`：

**列表渲染**（`qq:for` + `qq:for-item` + `qq:for-index` + `qq:key`）：

```qml
<view qq:for="{{array}}" qq:for-item="item" qq:for-index="idx" qq:key="id">
  {{idx}}: {{item.name}}
</view>
```

**条件渲染**（`qq:if` / `qq:elif` / `qq:else`）：

```qml
<view qq:if="{{cond}}">True</view>
<view qq:else>False</view>
```

**模板**（`<template name="item">` 定义，<code v-pre>&lt;template is="item" data="{{...obj}}"/&gt;</code> 引用，展开运算符传参）与微信一致。事件用 `bindtap` / `catchtap`（catch 阻止冒泡），事件名同微信。

- **QSS**：样式语言，后缀 `.qss`，对应微信 WXSS（尺寸单位、选择器等基本一致；**逐条差异细节待核**）。
- **QS 视图层脚本**：对标微信 WXS，用于视图层轻逻辑、减少视图-逻辑通信、动画更顺（**命名与能力细节待核**）。

## 四、API：`qq.*` 命名空间

命名空间统一 `qq.*`（对标微信 `wx.*`，多数**同名同参**），示例：`qq.request` / `qq.login` / `qq.getUserInfo` / `qq.setStorage` / `qq.navigateTo` / `qq.checkSession`。官方按 12 类组织：

1. 基础（系统信息、更新、生命周期、定时器、调试）
2. 路由（`qq.navigateTo` / `qq.redirectTo` / `qq.switchTab` / `qq.navigateBack`）
3. 界面（toast、modal、导航栏、tab、动画）
4. 网络（request / download / upload / WebSocket）
5. 数据缓存（`qq.setStorage` 等，同步/异步双版本）
6. 媒体（图片、视频、音频、canvas、相机）
7. 位置（地理位置、地图）
8. 转发（分享到 QQ）
9. 设备（蓝牙、Wi-Fi、传感器、拨号、振动、iBeacon）
10. 开放接口（登录、支付、用户信息、授权）
11. 文件（文件系统）
12. 广告（激励视频、插屏）

::: warning 兼容度与差异
绝大多数 `wx.*` API 在 QQ 有同名 `qq.*` 对应；但**部分 API 在 QQ 缺失或行为不同**（官方 FAQ 承认），迁移时需按端能力做降级/判断。**具体缺失清单待核**（资料有限，需逐个 API 页比对）。
:::

## 五、组件体系

组件与微信基本一致，官方分 8 大类：

1. 视图容器：`view` `scroll-view` `swiper` `movable-view` `movable-area` `cover-view` `cover-image`
2. 基础内容：`icon` `text` `rich-text` `progress`
3. 表单：`button` `checkbox` `form` `input` `label` `picker` `picker-view` `radio` `slider` `switch` `textarea`
4. 导航：`navigator` `functional-page-navigator`
5. 多媒体：`audio` `image` `video` `camera` `live-player` `live-pusher`
6. 地图：`map`
7. 画布：`canvas`
8. 开放能力：`open-data`（拉 QQ 昵称/头像等 QQ 开放数据）、`web-view`、`ad`、`official-account`

> QQ 特色主要在「开放能力」类组件（`open-data` 拉 QQ 昵称/头像、QQ 群相关等），其余与微信同名同用。

## 六、差异小结与「真正多端」提醒

- **能几乎原样复用的**：`App()`/`Page()`/`Component()`、生命周期、`setData`、组件结构、大部分 API 调用形态、`.wxml`/`.wxss`/`wx.` 写法。
- **必须处理的差异**：①登录态接 QQ 的 `code2Session`（见[登录态与工程迁移](./login-migration)）②少量差异/缺失 API（清单待核）③开放能力换成 QQ 体系。
- **别误解**：QQ 兼容 `.wxml`/`wx.` 不等于「一份代码天然多端」。真正多端一般靠 **uni-app / Taro / MPX** 编译输出，QQ 只是其目标端之一；直接手写复用仅适合简单工程。
