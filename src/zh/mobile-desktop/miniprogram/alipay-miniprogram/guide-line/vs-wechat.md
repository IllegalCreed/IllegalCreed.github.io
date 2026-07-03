---
layout: doc
outline: [2, 3]
---

# 支付宝小程序 vs 微信小程序

> 基于支付宝小程序 · 核于 2026-07

## 速查

- **范式同构、细节全异**：双线程（AXML/ACSS 渲染层 + JS 逻辑层）、`setData` 数据驱动、`App/Page/Component`、`rpx` 都同微信；差异集中在**后缀 / 指令 / 事件 / API 前缀 / Promise / 组件 / 登录支付 / 注册主体**
- **后缀**：`.axml`/`.acss`（宝） vs `.wxml`/`.wxss`（信）
- **API 前缀**：`my.*` vs `wx.*`
- **事件**：`onTap`/`catchTap`（**驼峰**） vs `bindtap`/`catchtap`（小写）
- **指令**：`a:if`/`a:for` vs `wx:if`/`wx:for`
- **Promise**：支付宝 `my.*` **默认不返回 Promise**（须回调/自封装） vs 微信省略 `success` 自动返回 Promise
- **内联脚本**：SJS（`<import-sjs>`） vs WXS（`<wxs>`）
- **登录**：`my.getAuthCode`→`user_id` vs `wx.login`→`openid`
- **支付**：`my.tradePay`（9000 成功） vs `wx.requestPayment`
- **注册**：支付宝**仅企业** vs 微信个人/企业皆可

## 一、全面差异对照

| 维度 | 支付宝小程序 | 微信小程序 |
| --- | --- | --- |
| 模板后缀 | `.axml` | `.wxml` |
| 样式后缀 | `.acss` | `.wxss` |
| API 前缀 | `my.*` | `wx.*` |
| 事件绑定 | `onTap` / `catchTap`（驼峰） | `bindtap` / `catchtap`（小写） |
| 条件渲染 | `a:if` / `a:elif` / `a:else` | `wx:if` / … |
| 列表渲染 | `a:for` / `a:for-item` / `a:for-index` / `a:key` | `wx:for` / … |
| 数据绑定 | <code v-pre>{{ }}</code>（同） | <code v-pre>{{ }}</code> |
| 内联脚本 | SJS `.sjs`（`<import-sjs>`） | WXS `.wxs`（`<wxs>`） |
| Promise | 默认**不**返回（须回调 / 自 promisify） | 省略 `success` 时**自动**返回 |
| 组件属性 | `props` | `properties` |
| 组件生命周期 | `didMount`/`didUpdate`（旧）；`lifetimes`（新，2.8.5+ 向微信靠拢） | `attached`/`ready` + `observers` |
| 登录 | `my.getAuthCode` → 服务端 `alipay.system.oauth.token` → `user_id` | `wx.login` → `code2session` → `openid` |
| 支付 | `my.tradePay`（`tradeNO`，resultCode 9000） | `wx.requestPayment` |
| 生态开放组件 | `lifestyle`/`contact-button` 等 | `official-account`/`open-data` 等 |
| 注册主体 | **仅企业** | 个人 / 企业 |
| 生态侧重 | 电商 / 支付 / 金融 / 生活服务 | 社交 / 裂变 |

## 二、最容易踩的三处

### 1. 事件是驼峰

```html
<!-- 支付宝：on + 驼峰 -->
<view onTap="handleTap">点我</view>
<!-- 微信：bind + 小写 -->
<!-- <view bindtap="handleTap">点我</view> -->
```

### 2. my.* 默认没有 Promise

```javascript
// 支付宝：必须写回调（或自己 promisify）
my.request({ url, success: (res) => {}, fail: (err) => {} });
// 微信：省略 success 会自动返回 Promise —— 这在支付宝不成立
```

### 3. 组件用 props 不是 properties

```javascript
Component({
  props: { title: 'default' }, // 支付宝：props（微信是 properties）
  didMount() {},               // 支付宝：didMount（微信是 attached/ready）
});
```

## 三、迁移直觉

- 从微信迁支付宝：改后缀（wxml→axml、wxss→acss）、改指令前缀（wx:→a:）、改事件（bindtap→onTap）、改 API 前缀（wx.→my.）、把依赖「自动 Promise」的写法补回调、重写登录/支付链路。
- **迁移成本低但非零**——范式同构使心智可复用，但上述逐项差异需要逐个替换。多端并行更推荐直接用 **Taro / uni-app** 一码多端（见对应叶）。
