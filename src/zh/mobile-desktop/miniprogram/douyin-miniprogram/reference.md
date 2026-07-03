---
layout: doc
outline: [2, 3]
---

# 抖音小程序 参考

> 基于抖音小程序（基础库 4.x）· 核于 2026-07

## 速查

- 定位：字节跳动小程序（抖音宿主形态）；范式类微信、靠内容公域分发；官方域名 `developer.open-douyin.com`
- 命名：字节小程序（统称）＝抖音小程序（抖音宿主）＝头条小程序（早期）；宿主 4 端（抖音/今日头条/两极速版）
- 四文件 `.ttml`/`.ttss`/`.js`/`.json` + 脚本 `.sjs`；指令 `tt:`；API `tt.*`；单位 `rpx`
- 登录 `tt.login`→`code`→`code2session`；支付 `tt.pay`（担保支付、需入驻）；用户信息 `tt.getUserProfile`
- 与微信记忆法：`wx:`→`tt:`、`wxml/wxss`→`ttml/ttss`、`wx.`→`tt.`；但生态 API 需逐个适配

## 一、与微信对照

| 维度 | 抖音 | 微信 |
| --- | --- | --- |
| 模板/样式/脚本 | `.ttml` / `.ttss` / `.sjs` | `.wxml` / `.wxss` / `.wxs` |
| API 前缀 | `tt.*` | `wx.*` |
| 指令 | `tt:if` / `tt:for` | `wx:if` / `wx:for` |
| 宿主 | 抖音 / 今日头条 / 两极速版 | 微信 |
| 主包上限 | 约 4MB | 2MB |
| 注册 | 以企业为主 | 个人 / 企业 |
| 支付 | `tt.pay`（担保支付） | `wx.requestPayment` |
| 流量 | 内容公域 | 社交私域 |

## 二、文件结构

- 页面：`.ttml`（必）/ `.js`（必）/ `.ttss`（可选）/ `.json`（可选），同名同路径。
- 全局：`app.json` + `app.js` + `app.ttss`；组件 `component.json`（`"component": true`）。

## 三、视图层指令（`tt:`）

```html
<view>{{ message }}</view>
<view tt:if="{{ cond }}">A</view>
<view tt:elif="{{ other }}">B</view>
<view tt:else>C</view>
<view tt:for="{{ list }}" tt:for-item="item" tt:key="id">{{ item.name }}</view>
<view data-id="1" bindtap="handleTap">Click</view>
```

## 四、常用 `tt.*` API

| 分类 | API |
| --- | --- |
| 网络 | `tt.request` / `uploadFile` / `downloadFile` |
| 路由 | `tt.navigateTo` / `redirectTo` / `switchTab` / `navigateBack` / `navigateToMiniProgram` |
| 存储 | `tt.setStorage(Sync)` / `getStorage(Sync)` |
| 界面 | `tt.showToast` / `showModal` / `showLoading` |
| 设备/位置 | `tt.getSystemInfo` / `getLocation` |
| 开放 | `tt.login` / `tt.getUserProfile` / `tt.pay` / `tt.shareAppMessage` |
| 大屏 | `tt.matchMedia`（3.63.0+） |

## 五、生命周期

| 层级 | 生命周期 |
| --- | --- |
| App | `onLaunch` / `onShow` / `onHide` / `onError` |
| Page | `onLoad` → `onShow` → `onReady` → `onHide` → `onUnload`；`onPullDownRefresh`/`onReachBottom`/`onShareAppMessage` |
| Component | `created` / `attached` / `ready` / `detached` |

## 六、易错点

| # | 要点 |
| --- | --- |
| 1 | `wx.`→`tt.`、`wxml/wxss`→`ttml/ttss`、`wx:`→`tt:`；其余语法大部分一致 |
| 2 | **语法相似 ≠ 复制即用**：支付/登录/分享/音视频/用户信息等生态 API 必须逐个适配 |
| 3 | 支付是担保支付、需入驻；个人主体一般无法开支付 |
| 4 | `tt.getUserProfile` 只能在 tap 回调里调、每次弹框；`tt.getUserInfo` 逐步废弃 |
| 5 | 宿主 4 端，部分 API 只支持抖音宿主，跨宿主判端降级 |
| 6 | 基础库 4.x 线（默认约 4.12/最新约 4.15）；精确号以官方下载页为准 |
| 7 | 主包体积上限约 4MB（比微信 2MB 宽松）；分包上限以官方为准 |
| 8 | `setData` 是逻辑层→视图层唯一通道，避免高频/大数据量 |

## 七、权威链接

- 抖音开放平台·小程序：https://developer.open-douyin.com/docs/resource/zh-CN/mini-app/introduction/overview
- 框架概述：https://developer.open-douyin.com/docs/resource/zh-CN/mini-app/develop/tutorial/miniapp-framework/introduction
- JS API 列表：https://developer.open-douyin.com/docs/resource/zh-CN/mini-app/develop/api/overview
- 组件概述：https://developer.open-douyin.com/docs/resource/zh-CN/mini-app/develop/component/overview
- 服务端 code2session：https://developer.open-douyin.com/docs/resource/zh-CN/mini-app/develop/server/log-in/code-2-session
