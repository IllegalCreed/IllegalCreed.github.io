---
layout: doc
outline: [2, 3]
---

# 百度智能小程序 参考

> 基于百度智能小程序（SWAN）· 核于 2026-07

## 速查

- 定位：百度 App 内、自研 **SWAN 框架**（模板源自 San.js，指令前缀 `s-`）；靠**百度搜索/信息流分发** + 深度 AI（`swan.ai.*`）
- 四文件：`.swan`（模板）/ `.css`（样式）/ `.js` / `.json`；响应单位 `rpx`
- 指令：`s-if`/`s-elif`/`s-else`、`s-for`/`s-for-index`/`s-for-item`/`s-key`；事件 `bind`/`catch` + 全小写（同微信）
- API：`swan.*`（`swan.request`/`swan.navigateTo`/`swan.login`…），签名基本对齐微信
- 现状：2018 上线、2020 MAU 峰值 5 亿、2024 约 3.97 亿（行业第三）；随百度转 AI **收缩淡出头部但未官方停运**
- 与微信记忆点：**后缀 swan、指令 s-、API swan.、靠搜索分发**

## 一、与微信关键差异

| 维度 | 百度 SWAN | 微信 |
| --- | --- | --- |
| 框架 | SWAN（源自 San.js） | 微信自研 |
| 模板后缀 | `.swan` | `.wxml` |
| 样式后缀 | `.css` | `.wxss` |
| API 前缀 | `swan.*` | `wx.*` |
| 条件渲染 | `s-if`/`s-elif`/`s-else` | `wx:if`/`wx:elif`/`wx:else` |
| 列表渲染 | `s-for`/`s-for-item`/`s-for-index`/`s-key` | `wx:for`/… |
| 事件 | `bind`/`catch` + 全小写（同微信） | 同左 |
| 生命周期 | `onLoad`/`onReady`/`onShow`/`onHide`/`onUnload`（同微信） | 同左 |
| 主分发入口 | **百度搜索 / 信息流** | **社交**（分享/群/朋友圈） |
| 特色 | AI（OCR/人脸/语音）、DuMixAR、开源联盟跨端 | 生态最全、社交裂变 |

## 二、文件结构

| 用途 | 百度 | 微信 |
| --- | --- | --- |
| 模板 | `index.swan` | `index.wxml` |
| 样式 | `index.css` | `index.wxss` |
| 逻辑 | `index.js` | `index.js` |
| 配置 | `index.json` | `index.json` |
| 全局样式 | `app.css` | `app.wxss` |
| 项目配置 | `project.swan.json` | `project.config.json` |

## 三、SWAN 模板速记

```swan
<view>Hello {{ name }}</view>
<view s-for="item in items" s-key="id">{{ item.text }}</view>
<view s-if="cond">A</view>
<view s-elif="other">B</view>
<view s-else>C</view>
<view data-id="123" bind:tap="handleTap">Click</view>
```

## 四、常用 `swan.*` API

| 分类 | API |
| --- | --- |
| 网络 | `swan.request` / `uploadFile` / `downloadFile` / `connectSocket` |
| 导航 | `swan.navigateTo` / `redirectTo` / `switchTab` / `reLaunch` / `navigateBack` |
| 存储 | `swan.setStorage(Sync)` / `getStorage(Sync)` / `removeStorage(Sync)` |
| 界面 | `swan.showToast` / `showModal` / `showActionSheet` |
| 设备 | `swan.getSystemInfo(Sync)` / `getNetworkType` / `makePhoneCall` |
| 登录 | `swan.login` → `code` / `swan.checkSession` / `swan.getUserInfo` |
| AI | `swan.ai.*`（OCR / 人脸 / 语音合成 / 内容审核） |

## 五、登录要点

```javascript
swan.login({
  success: (res) => myBackend.exchange(res.code), // code 10 分钟一次性
});
swan.checkSession({ fail: () => swan.login() });
```

- **Web 态（H5/开源联盟）首次登录**会跳百度授权页再返回，标准 `success` 不触发，需用 **`onLogin()` 生命周期钩子**拿 code（百度特有坑）。

## 六、迁移与易错

| # | 要点 |
| --- | --- |
| 1 | 迁移工具 `wx2swan`（`wx.*`→`swan.*`、`.wxml`→`.swan`），但**常不能开箱即跑**（`require` 路径、动态 require、插件、`miniprogram_npm` 等需人工过） |
| 2 | 「百度不支持 rpx / 循环模板」是**过时的第三方说法**——官方 `rpx`/`s-for` 均支持 |
| 3 | 基础库确切最新版本号**难查证**（版本页为 SPA、抓取异常，公开完整 API 文档快照停在 2020 前后）；宜写「以官方版本页为准」 |
| 4 | 现状表述用「投入收缩/淡出头部」，**非「已停运」**（官方仍可注册开发） |
| 5 | Web 态登录用 `onLogin()` 钩子，非 `success` 回调 |

## 七、权威链接

- 主站（SPA，人读）：https://smartprogram.baidu.com/docs
- 框架/组件/API 静态镜像：`https://smartapp.baidu.com/static/miniappdocs/develop/`
- 平台综述：https://mp.ac.cn/zh/platforms/baidu
- GitHub 组织：https://github.com/swan-team
- 迁移工具：`wx2swan`（npm）
