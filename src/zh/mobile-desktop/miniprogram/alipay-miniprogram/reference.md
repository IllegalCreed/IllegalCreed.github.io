---
layout: doc
outline: [2, 3]
---

# 支付宝小程序 参考

> 基于支付宝小程序 · 核于 2026-07

## 速查

- 定位：蚂蚁在支付宝 App 内的原生小程序平台；范式类微信但后缀/指令/事件/API 全异；**注册仅企业**
- 四文件：`.axml` / `.acss` / `.js` / `.json`；单位 `rpx`（750 基准）
- 指令：`a:if`/`a:elif`/`a:else`、`a:for`/`a:for-item`/`a:for-index`/`a:key`
- 事件：`onTap`/`catchTap`（**驼峰**）；`data-*` → `e.target.dataset`
- API：`my.*`，**默认不返回 Promise**（须回调）；`my.request`（`my.httpRequest` 已弃用）
- 登录 `my.getAuthCode`(auth_base/auth_user) → 服务端换 `user_id`；支付 `my.tradePay`（9000 成功）
- 内联脚本 SJS（`<import-sjs>`）；组件用 `props`（非 properties）

## 一、四文件与结构

| 用途 | 支付宝 | 微信 |
| --- | --- | --- |
| 模板 | `.axml` | `.wxml` |
| 样式 | `.acss` | `.wxss` |
| 逻辑/配置 | `.js` / `.json` | `.js` / `.json` |
| 全局 | `app.js` / `app.json` / `app.acss` | `app.js` / `app.json` / `app.wxss` |

## 二、生命周期

| 层级 | 生命周期 |
| --- | --- |
| App | `onLaunch` → `onShow` → `onHide`；`onError`、`onUnhandledRejection`、`onPageNotFound` |
| Page | `onLoad` → `onShow` → `onReady` → `onHide` → `onUnload`；事件 `onPullDownRefresh`/`onReachBottom`/`onShareAppMessage` |
| Component | 旧：`onInit`/`deriveDataFromProps`/`didMount`/`didUpdate`/`didUnmount`；新 `lifetimes`(2.8.5+)：`created`/`attached`/`ready`/`moved`/`detached` |

## 三、AXML 速记

```html
<view>{{ message }}</view>
<view a:if="{{len > 5}}">1</view>
<view a:elif="{{len > 2}}">2</view>
<view a:else>3</view>
<view a:for="{{list}}" a:for-item="elem" a:key="id">{{ elem.text }}</view>
<view data-user-id="123" onTap="handleTap">提交</view>
```

## 四、常用 `my.*` API

| 分类 | API |
| --- | --- |
| 网络 | `my.request`（`my.httpRequest` 已弃用）/ `uploadFile` / `downloadFile` / `connectSocket` |
| 路由 | `my.navigateTo` / `redirectTo` / `switchTab` / `reLaunch` / `navigateBack` |
| 缓存 | `my.setStorage(Sync)` / `getStorage(Sync)` / `removeStorage(Sync)` |
| 界面 | `my.alert` / `confirm` / `showToast` / `showLoading` / `showActionSheet` |
| 设备 | `my.getSystemInfo(Sync)` / `getLocation` / `scan` |
| 能力检测 | `my.canIUse('api.method')` |
| 授权/支付 | `my.getAuthCode` / `my.tradePay` |

> 调用约定：异步 API 用 `success`/`fail`/`complete` 回调；同步 API 以 `Sync` 结尾；**默认不返回 Promise**。

## 五、登录与支付

```javascript
// 登录：authCode → 服务端 alipay.system.oauth.token → user_id
my.getAuthCode({ scopes: 'auth_base', success: (res) => post(res.authCode) });

// 支付：服务端下单得 tradeNO → 前端唤起 → resultCode 9000 成功（须服务端对账）
my.tradePay({ tradeNO: '2017...', success: (res) => res.resultCode === '9000' });
```

- `auth_base`（默认，静默，仅换 `user_id`）/ `auth_user`（弹窗，可取会员信息，须企业开通）。
- 支付结果码：`9000` 成功 / `8000` 处理中 / `6001` 用户取消 / `6002` 网络错误 / `4000` 失败。

## 六、易错点

| # | 要点 |
| --- | --- |
| 1 | 事件是 `onTap`/`catchTap`（驼峰），不是微信的 `bindtap` |
| 2 | `my.*` 默认无 Promise，须写回调或自 promisify |
| 3 | 组件用 `props`（微信是 `properties`）、`didMount`（微信是 `attached`） |
| 4 | 指令前缀 `a:`（微信 `wx:`）；内联脚本 SJS（微信 WXS） |
| 5 | 运行环境非浏览器：无 `document`/`window`；保留字 import 需 `as` 别名 |
| 6 | 注册仅企业；`my.httpRequest` 已弃用，用 `my.request` |
| 7 | 支付勿只信同步返回，须服务端 `alipay.trade.query` 或异步通知对账 |
| 8 | 基础库精确版本号以官方版本页为准（各 API 有最低基础库要求） |

## 七、权威链接

- 官方文档：https://opendocs.alipay.com/mini
- GitHub 镜像（原始 markdown）：https://github.com/AlipayDocs/open-docs
- 开发者工具：https://opendocs.alipay.com/mini/ide
- 多端框架：Taro、uni-app（一码覆盖支付宝在内多端）
