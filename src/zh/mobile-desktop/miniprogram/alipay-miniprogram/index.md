---
layout: doc
---

# 支付宝小程序

支付宝小程序是**蚂蚁集团在支付宝 App 内的原生小程序平台**——隶属支付宝开放平台（open.alipay.com），文档在 opendocs.alipay.com/mini。它的整体范式**高度类似微信小程序**：同样是双线程模型（渲染层 AXML/ACSS + 逻辑层 JS）、同样数据驱动（`setData` 改数据、视图自动更新）、同样用 `App()` / `Page()` / `Component()` 注册。但**文件后缀、标签指令、API 前缀、事件命名处处不同**——`.axml/.acss`（不是 `.wxml/.wxss`）、指令前缀 `a:`（不是 `wx:`）、API 前缀 `my.*`（不是 `wx.*`）、事件用驼峰 `onTap/catchTap`（不是 `bindtap/catchtap`），且 `my.*` **默认不返回 Promise**。因此从微信迁移「成本低但非零」，而**吃透这些差异正是掌握支付宝小程序的核心**。它生态偏电商 / 支付 / 金融 / 生活服务，与支付宝账户、花呗、信用体系直连——**支付是它相对微信的天然优势**；注册主体**仅限企业**。

## 概述

- **定位**：支付宝 App 内的原生小程序，用户扫码 / 搜索 / 卡片即达、无需安装。开发者写四类文件（结构 / 样式 / 逻辑 / 配置），在支付宝客户端运行时里跑。范式类微信小程序，但后缀 / 指令 / API / 事件命名全不同——**「像但不是」是第一认知**。
- **四文件与结构**：页面由 `.axml`（结构，对应微信 `.wxml`）、`.acss`（样式，对应 `.wxss`，含 `rpx` 单位）、`.js`（逻辑）、`.json`（配置）组成；全局层为 `app.js` / `app.json` / `app.acss`。视图指令前缀 `a:`（`a:if` / `a:for`），数据绑定用 Mustache 双花括号。
- **事件与 API（重点差异）**：事件绑定用 **`on` + 驼峰**（冒泡）/ **`catch` + 驼峰**（阻止冒泡），如 `onTap` / `catchTap`；API 统一前缀 **`my.*`**（`my.request` / `my.navigateTo` / `my.setStorage`……）。**关键差异：`my.*` 默认不返回 Promise**，须走 `success` / `fail` 回调，或自行封装 promisify（微信 `wx.*` 省略 `success` 时自动返回 Promise）。
- **登录与支付（生态核心）**：登录用 `my.getAuthCode`（`auth_base` 静默 / `auth_user` 主动授权）拿 `authCode` → 服务端 `alipay.system.oauth.token` 换 **`user_id`**；支付用 `my.tradePay`——服务端 `alipay.trade.create` 下单得交易号，前端唤起收银台，`resultCode` 为 `'9000'` 表示成功（须服务端最终对账）。
- **运行环境与生态**：运行在**非浏览器**环境（无 `document` / `window` / `XMLHttpRequest`），支持 ES2015 模块与 `npm install`；注册**仅企业**；跨端主流用 **Taro / uni-app**（多端一码），容器技术可经 **mPaaS** 输出到企业自有 App。

## 本叶地图

- [入门](./getting-started) —— 支付宝小程序是什么、与微信小程序 / Web 的关系、开发者工具起步、第一个页面、心智地图
- [结构与四文件](./guide-line/structure) —— `.axml` / `.acss` / `.js` / `.json` 职责、全局 vs 页面文件、`a:if` / `a:for` 指令、Mustache 绑定、`rpx`、SJS
- [事件与 API](./guide-line/events-api) —— `onTap` / `catchTap` 驼峰事件、`dataset`、`my.*` API 调用约定、**默认不返回 Promise** 与 promisify 封装
- [登录与支付](./guide-line/login-pay) —— `my.getAuthCode`（auth_base / auth_user）+ 服务端换 `user_id`、`my.tradePay` 支付四步、`resultCode` 与对账纪律
- [对比微信小程序](./guide-line/vs-wechat) —— 后缀 / 前缀 / 指令 / 事件 / Promise / 组件 / 登录 / 支付 / 注册主体 全面差异对照
- [参考](./reference) —— 四文件 / 指令 / 事件 / my.* API / 登录 / 支付 / 宝信差异 等速查表 + 权威链接

## 文档地址

- [支付宝小程序官方文档](https://opendocs.alipay.com/mini) —— 框架、组件、API 一手文档
- [框架概述](https://opendocs.alipay.com/mini/framework) —— 四文件、App / Page / Component、AXML / ACSS、事件系统
- [组件](https://opendocs.alipay.com/mini/component) —— `view` / `text` / `button` 等基础与开放组件参考
- [API](https://opendocs.alipay.com/mini/api) —— `my.*` 基础 API 与开放能力 API 全集
- [用户授权 my.getAuthCode](https://opendocs.alipay.com/mini/api/openapi-authorize) —— `authCode` 换 `user_id` 官方流程
- [小程序唤起支付 my.tradePay](https://opendocs.alipay.com/mini/api/openapi-pay) —— 服务端下单 + 前端唤起收银台
- [支付宝开放平台](https://open.alipay.com/) —— 账号注册、能力开通、服务端 OpenAPI
- [支付宝小程序开发者工具（IDE）](https://opendocs.alipay.com/mini/ide) —— 官方 IDE，编写 / 调试 / 预览 / 上传

## 幻灯片地址

- <a href="/SlideStack/alipay-miniprogram-slide/" target="_blank">支付宝小程序</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=%E6%94%AF%E4%BB%98%E5%AE%9D%E5%B0%8F%E7%A8%8B%E5%BA%8F" target="_blank" rel="noopener noreferrer">支付宝小程序 测试题</a>
