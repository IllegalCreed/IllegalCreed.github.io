---
layout: doc
outline: [2, 3]
---

# 结构与四文件

> 基于支付宝小程序 · 核于 2026-07

## 速查

- **四文件（每页一套）**：`.axml`(结构，对应微信 `.wxml`) · `.acss`(样式，对应 `.wxss`) · `.js`(逻辑 `Page()`/`Component()`) · `.json`(配置，纯 JSON)；`.acss` 可选
- **全局三文件（根目录）**：`app.js`(`App({})` + `globalData`) · `app.json`(全局配置：`pages`/`window`/`tabBar`) · `app.acss`(全局样式)；另有 `mini.project.json` / `project.config.json` 项目配置
- **响应式**：逻辑层 `this.setData({...})` 改数据 → 视图层 Mustache 绑定自动更新，无需操作 DOM
- **视图指令前缀 `a:`**（微信 `wx:`）：条件 `a:if` / `a:elif` / `a:else`；列表 `a:for` / `a:for-item` / `a:for-index` / `a:key`
- **数据绑定**：Mustache 双花括号（同微信），支持三元 / 运算 / 逻辑 / 路径 / 拼接；属性绑定需带引号；布尔用 <code v-pre>{{true}}</code> 而非字符串
- **`a:if` vs `hidden`**：`a:if` 惰性渲染（切换有创建 / 销毁开销）；`hidden` 始终渲染只切显隐（频繁切换首选）
- **ACSS 单位 `rpx`**：规定屏宽 = 750rpx，按屏宽等比缩放；支持 `@import`，`app.acss` 全局 / 页面 `.acss` 局部
- **SJS（`.sjs`）**：支付宝的小程序脚本语言（对应微信 WXS），`<import-sjs from="./x.sjs" name="m" />` 引入（微信是 `<wxs>`）
- **`App` / `Page` / `Component`**：同名注册器，签名与微信有别（组件用 `props`+`didMount` 而非 `properties`+`lifetimes.attached`，详见[事件与 API](./events-api) 与[对比微信小程序](./vs-wechat)）

## 一、四文件：职责分离

支付宝小程序把每个「页面 / 组件」拆成四类文件，同目录、同名、路径一致：

| 后缀 | 对应微信 | 类比 Web | 职责 | 是否必需 |
| --- | --- | --- | --- | --- |
| `.axml` | `.wxml` | HTML | 页面结构；标签是**组件**，支持 Mustache 绑定与 `a:` 指令 | 必需 |
| `.acss` | `.wxss` | CSS | 样式；新增 `rpx` 响应式单位，支持 `@import` | 可选 |
| `.js` | `.js` | JS | 逻辑；`Page()` / `Component()`，处理事件、调 `my.*`、`setData` | 必需 |
| `.json` | `.json` | — | 静态配置；**纯 JSON** | 必需 |

与微信最直观的差异就在后缀：**`.axml` / `.acss`**（不是 `.wxml` / `.wxss`），而 `.js` / `.json` 同名。`.axml` 里写的不是 HTML 标签而是平台**内建组件**，渲染层解析成原生视图。

## 二、全局文件 vs 页面文件

**全局层（项目根目录）**：

- **`app.js`**：用 `App({})` 注册应用实例——全局生命周期（`onLaunch` / `onShow` / `onHide` / `onError` / `onUnhandledRejection` / `onPageNotFound`）与全局数据 `globalData`（任意页面 `getApp().globalData` 读写）。

```javascript
// app.js
App({
  globalData: { userInfo: null },
  onLaunch(options) {
    // 全局仅一次；options 含 query / scene / path / referrerInfo
    console.log(options.query, options.scene)
  },
  onShow(options) {}, // 启动或从后台切回前台
  onError(error) {},  // JS 报错捕获（stack 需较高基础库版本）
})
// 页面内取全局：const app = getApp(); app.globalData.userInfo
```

- **`app.json`**：全局配置中枢（下节详述）。
- **`app.acss`**：全局样式，作用于所有页面。

**页面层（每页一套四文件）**：`page.js`（`Page({})`）、`page.axml`、`page.acss`、`page.json`。页面 `.acss` 优先级高于 `app.acss`；页面 `.json` 可覆盖全局窗口配置。

**项目配置**：旧版 `mini.project.json` / 新版 `project.config.json`（两者有迁移文档），存开发者工具的项目级配置。

## 三、`app.json`：全局配置中枢

```json
{
  "pages": [
    "pages/index/index",
    "pages/logs/logs"
  ],
  "window": {
    "defaultTitle": "首页",
    "titleBarColor": "#ffffff"
  },
  "tabBar": {
    "items": [
      { "pagePath": "pages/index/index", "name": "首页" },
      { "pagePath": "pages/logs/logs", "name": "日志" }
    ]
  }
}
```

- **`pages`**：页面路由数组，**第一项即首页**；新增页面须在此登记。
- **`window`**：默认窗口（标题、导航栏颜色、背景等），页面 `.json` 可覆盖。
- **`tabBar`**：底部标签栏。
- 字段命名与微信略有出入（如支付宝 `window.defaultTitle` / `tabBar.items`），迁移时须按支付宝文档核对，不能照搬微信 `navigationBarTitleText` / `tabBar.list`。

## 四、AXML：数据绑定与指令

AXML 对应微信 WXML，最大差异是**指令前缀 `a:`**（微信 `wx:`）。数据绑定用 Mustache 双花括号（与微信一致）。**凡出现 Mustache 双花括号的片段都放在代码块里**（避免被 VitePress 当页面插值）：

```html
<!-- 数据绑定：Mustache 双花括号，支持三元/运算/逻辑/路径/拼接 -->
<view>{{ message }}</view>
<view id="item-{{ id }}"></view>        <!-- 属性绑定需带引号 -->
<view a:if="{{ condition }}"></view>    <!-- 控制属性 -->
<!-- 三元 {{ flag ? a : b }}、运算 {{ a + b }}、逻辑 {{ len > 5 }}、路径 {{ obj.key }} / {{ arr[0] }} -->
<!-- 布尔用 {{ true }} / {{ false }}，不要写成字符串 -->
```

**条件渲染 `a:if` / `a:elif` / `a:else`**：

```html
<view a:if="{{ len > 5 }}">大于 5</view>
<view a:elif="{{ len > 2 }}">大于 2</view>
<view a:else>其他</view>
<!-- block 包裹多节点、自身不渲染真实节点 -->
<block a:if="{{ show }}">
  <view>A</view>
  <view>B</view>
</block>
```

- **`a:if`（惰性渲染）**：条件切换时局部创建 / 销毁节点，切换开销大。
- **`hidden`（始终渲染）**：只用 CSS 切显隐，**频繁切换首选**。

**列表渲染 `a:for`**（默认变量 `index` / `item`）：

```html
<view a:for="{{ array }}">{{ index }}: {{ item.message }}</view>
<!-- 自定义下标/元素名 -->
<view a:for="{{ array }}" a:for-index="idx" a:for-item="elem">{{ idx }}: {{ elem.message }}</view>
<!-- a:key 提升 diff 性能：对象数组用属性名，基础类型数组用 *this -->
<view a:for="{{ list }}" a:key="id">{{ item.name }}</view>
<view a:for="{{ nums }}" a:key="*this">{{ item }}</view>
```

**模板与引用**：`<template>`（`is` + `data`，支持 <code v-pre>{{ ...obj }}</code> 展开）、`import` / `include` 引用、`<block>` 包裹（不渲染真实节点）。

## 五、ACSS：样式与 `rpx`

ACSS 对应微信 WXSS，在 CSS 基础上做了适配，核心是响应式单位 **`rpx`**：

```css
/* rpx：规定屏幕宽 = 750rpx，按屏宽等比缩放，做自适应布局首选 */
.card {
  width: 750rpx;        /* 占满屏宽 */
  padding: 20rpx 32rpx;
  font-size: 28rpx;
}
/* 支持 @import 引入外部样式 */
@import './common.acss';
```

- **`rpx`**：规定屏幕宽 = 750rpx（750 设计稿基准，同微信），按屏宽等比缩放，做屏幕自适应首选。
- **作用域**：`app.acss` 全局、页面 `.acss` 局部；页面样式优先级更高。

## 六、SJS：小程序脚本语言

**SJS（`.sjs`）** 是支付宝的「小程序脚本语言」，对应微信的 **WXS**，用于在 AXML 里做过滤 / 格式化等轻逻辑，避免频繁跨线程回逻辑层。引入语法是 `<import-sjs>`（微信是 `<wxs>`）：

```html
<!-- 用 SJS 在视图层做格式化 -->
<import-sjs from="./utils.sjs" name="m" />
<view>{{ m.upper(name) }}</view>
```

```javascript
// utils.sjs
export function upper(s) {
  return s.toUpperCase()
}
```

> 下一步：视图里的 `onTap` / `catchTap` 事件怎么绑、`my.*` API 怎么调、以及**为什么默认没有 Promise**，见[事件与 API](./events-api)。整体宝 / 信差异见[对比微信小程序](./vs-wechat)。
