---
layout: doc
---

# 百度智能小程序

百度智能小程序是**百度旗下、跑在百度 App 内的小程序平台**，采用百度自研的 **SWAN 框架**（模板语言 SWAN，指令前缀 `s-`，源出百度 San.js）。它整体结构高度「类微信」——同样的三段式文件、`App`/`Page`/`Component` 构造器、生命周期与 `bind` 事件，微信小程序开发者几乎零门槛迁移；真正的差异化在两点：**依托百度搜索 / 信息流做分发**（搜索直达、语音直达、寻址单卡、自然结果收录，而非微信的社交裂变）与**深度集成百度 AI 能力**（OCR / 人脸 / 语音，`swan.ai.*`）。2018 年 7 月上线，两个月 MAU 破亿，2020 年 9 月 MAU 峰值达 5 亿；但 **2024 年后随百度全面转向 AI（文心 / ERNIE）而明显收缩、淡出头部**——需要说清楚的是，这是投入收缩与战略转移的综合判断，**官方文档站仍在线、仍可注册开发，百度并未正式宣布停运**。

## 概述

- **定位**：百度 App 内的「超级 App 应用层」，与微信小程序、支付宝小程序并列为国内三大小程序平台之一；2024-06 MAU 约 3.97 亿、居行业第三（微信 > 支付宝 > 百度）。
- **SWAN 框架（核心差异）**：模板语言称 **SWAN**，模板文件后缀 **`.swan`**、样式后缀 **`.css`**、逻辑 `.js`、配置 `.json`；指令前缀是 **`s-`**（`s-if` / `s-for` / `s-key`），源自百度自研的 **San.js**，这是与微信 WXML（`wx:` 前缀）最直观的语法差异。
- **文件结构类微信**：`app.js` / `app.json` / `app.css` + `project.swan.json`，页面为四文件组合，响应式单位同样是 `rpx`；结构与微信一一对应，仅后缀不同。
- **API 命名空间 `swan.*`**：方法名与签名基本对齐微信 `wx.*`（回调式 `success` / `fail` / `complete`），迁移主要是「换前缀」；官方提供 `wx2swan` 迁移工具辅助自动替换。
- **AI + 搜索分发（最大卖点）**：`swan.ai.*` 暴露 OCR、图像识别、内容审核、人脸、语音合成等百度 AI 能力；分发依托百度搜索与信息流，这与微信的社交分发是根本路线差异。
- **现状（如实）**：属于**存量维护 / 收缩期**形态，投入远不及微信，新项目不建议以百度为主战场；宜作为「微信之外的第二 / 第三平台」与「SWAN 差异点」来理解，而非主流生产平台。

## 本叶地图

- [入门](./getting-started) —— 百度智能小程序是什么、与微信的关系、开发者工具起步、第一个页面、心智地图
- [SWAN 框架与模板](./guide-line/swan-framework) —— SWAN 框架、`.swan` / `.css` 文件、`s-if` / `s-for` / `s-key` 指令、`App` / `Page` / `Component` 与生命周期
- [API 与分发](./guide-line/api-distribution) —— `swan.*` API 全景、`swan.ai.*` AI 能力、百度搜索 / 信息流分发机制、登录授权
- [现状定位与迁移](./guide-line/status-vs-wechat) —— 现状与规模曲线、与微信的关键差异、`wx2swan` 迁移工具与坑点
- [参考](./reference) —— 文件后缀对照 / SWAN 指令 / `swan.*` API / AI 能力 / 分发入口 / 与微信差异 等速查表 + 权威链接

## 文档地址

- [百度智能小程序官方文档](https://smartprogram.baidu.com/docs) —— 框架、组件、API 一手文档（主站为客户端渲染 SPA）
- [文档静态镜像](https://smartapp.baidu.com/static/miniappdocs/develop/framework/) —— 框架 / 组件 / API 可直读的静态镜像页
- [百度小程序平台综述（mp.ac.cn）](https://mp.ac.cn/zh/platforms/baidu) —— 第三方平台综述，规模与能力概览
- [swan-team（GitHub）](https://github.com/swan-team) —— 官方开源组织（SWAN 相关仓库、迁移工具）
- [wx2swan（npm）](https://www.npmjs.com/package/wx2swan) —— 微信 → 百度小程序官方系迁移工具

## 幻灯片地址

- <a href="/SlideStack/baidu-miniprogram-slide/" target="_blank">百度智能小程序</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=%E7%99%BE%E5%BA%A6%E6%99%BA%E8%83%BD%E5%B0%8F%E7%A8%8B%E5%BA%8F" target="_blank" rel="noopener noreferrer">百度智能小程序 测试题</a>
