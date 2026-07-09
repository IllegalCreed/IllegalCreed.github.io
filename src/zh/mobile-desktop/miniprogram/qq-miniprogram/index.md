---
layout: doc
---

# QQ小程序

QQ小程序是**腾讯 QQ 客户端内的小程序平台**——用户在手机 QQ 里无需下载即用的轻应用形态，归属腾讯 QQ 开放平台（q.qq.com）。它最大的技术特征是**与微信小程序高度同源**：框架模型（视图层 + 逻辑层双部分）、组件体系、API 形态几乎一一对应，差异主要落在**前缀命名**（`.qml`/`.qss`、`qq:for`/`qq:if`、`qq.*`）与**账号/登录态体系**（QQ 独立 openid，与微信互不相通）。因此微信小程序可**低成本移植**到 QQ，QQ 开发者工具也直接兼容 `.wxml`/`.wxss`/`wx.` 写法。但要如实说明：**该平台已边缘化**——官方基础库 changelog 停在 **v1.60.0（2022-12-22）**，其后无新版本记录，事实上处于低维护状态；2026 年腾讯小程序生态的投入与 AI 化几乎全部集中在**微信**侧，QQ 小程序鲜有官方新动作。学习/出题应把它定位为「微信小程序的同源分支、现已边缘化」，重点在**与微信的关系与差异**，而非当作活跃主力平台。

## 概述

- **定位**：手机 QQ 客户端内的轻应用平台，2019-07-23 开放注册；架构与微信同构——视图层（View）+ 逻辑层（App Service）两部分，响应式数据绑定，逻辑层改数据自动刷新视图。
- **与微信高度同源（核心）**：QML/QSS 对标 WXML/WXSS，`qq:for`/`qq:if` 对标 `wx:for`/`wx:if`，`qq.*` API 对标 `wx.*`，`App()`/`Page()`/`Component()` 与 `setData` 完全一致；组件同名同结构。差异集中在**前缀**与**登录态**两处。
- **迁移友好**：官方 FAQ 明确 QQ 兼容 `wx/`、`.wxml`、`.wxss` 写法，微信工程可几乎原样在 QQ 开发者工具打开；主要改动是接 QQ 登录（`code2Session`）、处理少量差异 API、填 QQ AppID。
- **登录态独立**：`qq.login` 拿临时 code → 服务端换 QQ 的 openid/session_key，属 QQ 体系，**与微信互不相通**；同一套代码用 `qq.getSystemInfoSync().AppPlatform` 判端。
- **现状（如实）**：基础库 changelog 冻结于 **v1.60.0（2022-12）**、低维护、边缘化；**2026「AI 小程序成长计划」属微信、非 QQ**，勿张冠李戴。

## 本叶地图

- [入门](./getting-started) —— QQ小程序是什么、与微信/跨端框架的关系、开发者工具起步、四文件与第一个页面、心智地图
- [与微信小程序对比](./guide-line/vs-wechat) —— 同源关系、QML/QSS、`qq:for`/`qq:if`、`qq.*` API、兼容 `wx` 写法、差异清单
- [登录态与工程迁移](./guide-line/login-migration) —— `qq.login` + `code2Session` 独立登录态、微信工程迁移步骤、`AppPlatform` 判端
- [现状评估](./guide-line/status) —— 基础库冻结 v1.60.0、低维护、边缘化；AI 计划归属微信的辨析
- [参考](./reference) —— 同源映射 / 文件后缀 / 指令 / API 分类 / 登录 / 迁移 / 现状 等速查表 + 权威链接

## 文档地址

- [QQ 开放平台](https://q.qq.com/) —— 小程序、小游戏、机器人、QQ 互联综合入口
- [小程序开发文档 Wiki](https://q.qq.com/wiki/) —— 框架、组件、API 一手文档
- [框架总览](https://q.qq.com/wiki/develop/miniprogram/frame/) —— 目录结构、逻辑层、视图层、配置
- [API 总览](https://q.qq.com/wiki/develop/miniprogram/API/) —— `qq.*` 接口分类
- [组件总览](https://q.qq.com/wiki/develop/miniprogram/component/) —— 视图容器 / 表单 / 媒体 / 开放能力
- [基础库 changelog](https://q.qq.com/wiki/develop/basic_lib/changelog/) —— 版本记录（最新 v1.60.0 / 2022-12）
- [开发 FAQ（迁移）](https://q.qq.com/wiki/FAQ/devlop/) —— 微信工程迁移、兼容写法

## 幻灯片地址

- <a href="/SlideStack/qq-miniprogram-slide/" target="_blank">QQ小程序</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=qq%E5%B0%8F%E7%A8%8B%E5%BA%8F" target="_blank" rel="noopener noreferrer">QQ小程序 测试题</a>
