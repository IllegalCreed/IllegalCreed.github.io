---
layout: doc
---

# 抖音小程序

抖音小程序是**字节跳动的小程序平台**（官方开放平台现名「抖音开放平台」，域名 developer.open-douyin.com）在抖音宿主里的称呼——平台层面统称「字节小程序」，早期叫「头条小程序」，本质是同一套技术栈。它是「无需下载、即用即走」的轻应用，架构范式**高度类微信**（双线程、`setData` 驱动、数据绑定 <code v-pre>{{ }}</code>、同名生命周期），差异集中在**前缀命名**（`.ttml`/`.ttss`、`tt:` 指令、`tt.*` API）与**生态强绑定能力**（登录/支付/分享/音视频）。生态哲学与微信相反：微信是**社交私域**（分享裂变），抖音是**内容公域**（短视频挂载、直播小风车、算法推荐即时转化）。可**一套代码多宿主上线**——当前支持抖音、今日头条、今日头条极速版、抖音极速版 4 个宿主端。2026 基线：开发者工具 4.5.4，基础库 4.x 线。

## 概述

- **定位**：字节系小程序平台；范式类微信，靠字节 App 的**内容公域流量**分发（短视频/直播/评论入口）。是 uni-app/Taro 的一个编译目标端。
- **命名关系**：字节小程序（统称）＝抖音小程序（抖音宿主）＝头条小程序（早期/头条宿主）；旧域名 `microapp.bytedance.com`/`developer.toutiao.com` 均导向 `developer.open-douyin.com`。
- **技术栈**：四文件 `.ttml`/`.ttss`/`.js`/`.json` + 脚本 `.sjs`；`App/Page/Component` + 同名生命周期；`tt:if`/`tt:for` 指令；`tt.*` API；`rpx` 单位。
- **与微信的关系**：语法大面积一致（`wx:`→`tt:`、`wxml/wxss`→`ttml/ttss`、`wx.`→`tt.`），**但语法相似 ≠ 复制即用**——支付/登录/分享/音视频等生态 API 必须逐个按官方适配。
- **特色**：短视频挂载/直播小风车/评论锚点等公域入口、`aweme-data` 组件、`button` 的抖音 `open-type`、`tt.matchMedia` 大屏适配。

## 本叶地图

- [入门](./getting-started) —— 抖音小程序是什么、命名与宿主、起步、与微信的关系
- [文件结构与视图层](./guide-line/structure) —— 四文件 `.ttml`/`.ttss` + `tt:` 指令 + SJS
- [API 与生命周期](./guide-line/api-lifecycle) —— `tt.*` API、App/Page/Component 生命周期、setData
- [生态能力](./guide-line/features) —— 登录 `tt.login`、支付 `tt.pay` 担保支付、抖音特色入口
- [对比微信](./guide-line/vs-wechat) —— 前缀/宿主/流量逻辑/包体积/注册主体的全面差异
- [参考](./reference) —— 后缀/指令/API/差异 速查表 + 权威链接

## 文档地址

- [抖音开放平台·小程序](https://developer.open-douyin.com/docs/resource/zh-CN/mini-app/introduction/overview) —— 官方文档
- [框架概述](https://developer.open-douyin.com/docs/resource/zh-CN/mini-app/develop/tutorial/miniapp-framework/introduction)
- [JS API 列表](https://developer.open-douyin.com/docs/resource/zh-CN/mini-app/develop/api/overview)
- [组件概述](https://developer.open-douyin.com/docs/resource/zh-CN/mini-app/develop/component/overview)
- [服务端 code2session](https://developer.open-douyin.com/docs/resource/zh-CN/mini-app/develop/server/log-in/code-2-session)

## 幻灯片地址

- <a href="/SlideStack/douyin-miniprogram-slide/" target="_blank">抖音小程序</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=%E6%8A%96%E9%9F%B3%E5%B0%8F%E7%A8%8B%E5%BA%8F" target="_blank" rel="noopener noreferrer">抖音小程序 测试题</a>
