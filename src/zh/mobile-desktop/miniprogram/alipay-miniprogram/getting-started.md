---
layout: doc
outline: [2, 3]
---

# 入门：支付宝小程序是什么与怎么起步

> 基于支付宝小程序 · 核于 2026-07

## 速查

- **一句话**：支付宝 App 内的**原生小程序平台**，隶属支付宝开放平台；范式**类微信小程序**（双线程 + 数据驱动 `setData`），但**后缀 / 指令 / API / 事件命名处处不同**
- **四文件**：`.axml`(结构，对应微信 `.wxml`) · `.acss`(样式，对应 `.wxss`) · `.js`(逻辑) · `.json`(配置)；全局层 `app.js` / `app.json` / `app.acss`
- **视图指令前缀 `a:`**：`a:if` / `a:elif` / `a:else`、`a:for` / `a:key`（微信是 `wx:`）；数据绑定用 Mustache 双花括号
- **API 前缀 `my.*`**：`my.request`(网络) / `my.navigateTo`(路由) / `my.setStorage`(缓存) / `my.getAuthCode`(登录) / `my.tradePay`(支付)；旧版 `my.httpRequest` 已弃用
- **事件驼峰**：`onTap`(冒泡) / `catchTap`(阻止冒泡)——`on` / `catch` 前缀 + 驼峰事件名（微信是 `bindtap` / `catchtap`）
- **关键差异**：`my.*` **默认不返回 Promise**，须走 `success` / `fail` 回调或自行 promisify（微信省略 `success` 自动返回 Promise）
- **注册主体**：**仅企业**（微信个人 / 企业皆可）；运行在**非浏览器**环境（无 `document` / `window`），支持 ES2015 模块与 `npm install`
- **起步**：装[支付宝小程序开发者工具（IDE）](https://opendocs.alipay.com/mini/ide) → 新建项目 → 用企业账号在[开放平台](https://open.alipay.com/)创建小程序拿 AppID → IDE 里预览 / 真机调试 / 上传
- **进阶顺序**：先读[结构与四文件](./guide-line/structure)吃透 `.axml`/`a:` 指令 → 再读[事件与 API](./guide-line/events-api) → [登录与支付](./guide-line/login-pay) → 用[对比微信小程序](./guide-line/vs-wechat)收口全部差异

## 一、支付宝小程序解决什么问题

支付宝小程序是蚂蚁集团在**支付宝 App 内**提供的原生小程序平台：用户无需下载安装，扫码 / 搜索 / 卡片即可打开一个「即用即走」的应用；开发者只写四类文件（结构 / 样式 / 逻辑 / 配置），由支付宝客户端内建的运行时承载。它和微信小程序一样，用**双线程模型**（渲染层负责 AXML/ACSS、逻辑层跑开发者 JS）换取安全与管控，用**数据驱动**（改 `data`、视图自动更新）替代手动 DOM 操作。

它与两类东西要区分开：

- **vs 网页 / H5**：支付宝小程序**不是网页**，运行环境**没有浏览器**——没有 `document` / `window` / `XMLHttpRequest`，网络要用 `my.request`、存储要用 `my.setStorage`。它渲染的是平台组件而非 DOM 标签。
- **vs 微信小程序**：两者范式几乎同构，但**几乎所有具体写法都换了名字**（后缀、指令前缀、API 前缀、事件命名，详见[对比微信小程序](./guide-line/vs-wechat)）。会微信小程序的人能很快上手，但**逐字照抄一定跑不起来**。

支付宝小程序的生态定位偏**电商 / 支付 / 金融 / 生活服务**（相对微信偏社交）：它与支付宝账户、花呗、信用体系直连，**支付能力是它的天然优势**。

## 二、与微信小程序、Web、跨端框架的关系

- **与微信小程序**：同为「超级 App 内应用层」，机制同构（双线程、`setData`、`App`/`Page`/`Component`、`rpx` 单位）。差异集中在命名层，是本叶反复强调的核心考点。
- **与 Web**：复用了 HTML/CSS/JS 的心智（AXML 类 HTML、ACSS 类 CSS、逻辑层是 JS），但组件不是 HTML 标签、样式在受限环境里、没有 DOM/BOM。
- **与跨端框架（Taro / uni-app）**：这些框架用 React / Vue 的写法**编译**到包含支付宝在内的多个小程序平台。它们把支付宝小程序当作**编译目标底座**——读懂原生机制，才读得懂框架产物的运行规律。

## 三、四文件与项目结构初识

一个页面由同名、同目录的四个文件组成（`.acss` 可选）：

| 后缀 | 对应微信 | 类比 Web | 职责 |
| --- | --- | --- | --- |
| `.axml` | `.wxml` | HTML | 页面结构；标签是**组件**，支持 Mustache 绑定、`a:if` / `a:for` |
| `.acss` | `.wxss` | CSS | 样式；支持 `rpx` 响应式单位、`@import` |
| `.js` | `.js` | JS | 逻辑；`Page()` / `Component()`，处理事件、调 `my.*`、`setData` |
| `.json` | `.json` | — | 静态配置；纯 JSON |

全局层在项目根目录：`app.js`（`App({})` 注册 + `globalData`）、`app.json`（全局配置：`pages` 路由、`window`、`tabBar`）、`app.acss`（全局样式）。完整结构与指令见[结构与四文件](./guide-line/structure)。

## 四、第一个页面：数据驱动与事件

逻辑层用 `Page()` 注册页面，`data` 是初始数据，`this.setData({...})` 改数据后视图自动更新：

```javascript
// pages/index/index.js
Page({
  data: { text: 'init data', count: 0 },
  onLoad(query) {}, // 页面加载，query 为跳转带来的参数
  // 事件处理函数：方法名对应 .axml 里的 onTap 值
  handleTap() {
    this.setData({ count: this.data.count + 1, text: 'changed' })
  },
})
```

视图层用 AXML 描述界面，**事件用 `on` + 驼峰**绑定方法名，数据绑定放在 Mustache 双花括号里（下例整段都在代码块内，避免被当成页面插值）：

```html
<!-- pages/index/index.axml -->
<view class="page">
  <text>{{ text }}：{{ count }}</text>
  <!-- onTap 冒泡（≈ 微信 bindtap）；值为 Page 里的方法名 -->
  <button onTap="handleTap">点我 +1</button>
  <!-- 条件渲染用 a: 前缀 -->
  <view a:if="{{ count > 3 }}">已超过 3 次</view>
</view>
```

样式写在 `.acss`，用 `rpx` 做屏幕自适应（规定屏宽 = 750rpx）：

```css
/* pages/index/index.acss */
.page {
  padding: 24rpx;
  font-size: 28rpx;
}
```

配置写在 `.json`（纯 JSON，不能写注释）：

```json
{ "navigationBarTitleText": "首页" }
```

## 五、怎么起步：IDE + 企业账号

1. **装 IDE**：下载并安装[支付宝小程序开发者工具](https://opendocs.alipay.com/mini/ide)（官方 IDE，编写 / 调试 / 预览 / 上传一体）。
2. **拿 AppID**：用**企业账号**在[支付宝开放平台](https://open.alipay.com/)创建小程序，获得 AppID（注册主体仅企业，这点与微信不同）。
3. **新建项目**：IDE 里新建项目，填入 AppID，选模板，即可看到上面这套四文件的脚手架。
4. **调试与上传**：IDE 内预览、真机扫码调试；开放能力（会员信息、支付等）需在开放平台**开通对应能力**后才能调通。

```text
起步链路：装 IDE → 开放平台建小程序拿 AppID → IDE 新建项目 → 预览/真机调试 → 上传提审
```

## 六、心智地图：接下来读什么

- 想搞清结构与视图写法 → [结构与四文件](./guide-line/structure)（`.axml` / `.acss` / `a:if` / `a:for` / `rpx` / SJS）。
- 想写交互与调接口 → [事件与 API](./guide-line/events-api)（`onTap` / `catchTap` / `dataset` / `my.*` / **无 Promise** 与 promisify）。
- 想做登录与收款 → [登录与支付](./guide-line/login-pay)（`my.getAuthCode` 换 `user_id` / `my.tradePay` 四步）。
- 从微信迁移或做选型对比 → [对比微信小程序](./guide-line/vs-wechat)。
- 速记表在 [参考](./reference)。
