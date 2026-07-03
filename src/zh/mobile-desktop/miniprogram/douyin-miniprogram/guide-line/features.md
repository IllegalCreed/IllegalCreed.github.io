---
layout: doc
outline: [2, 3]
---

# 抖音小程序 生态能力

> 基于抖音小程序（基础库 4.x）· 核于 2026-07

## 速查

- **登录**：`tt.login`→临时 `code`（不支持匿名静默拿身份，匿名场景返回 `anonymous_code`）→ 服务端 `code2session` 换 `openid`/`session_key`
- **用户信息**：`tt.getUserProfile`（只能在 tap 回调里调、每次弹授权框）；`tt.getUserInfo` **逐步废弃**
- **支付**：`tt.pay`（基础库 1.19.4+）；抖音是**担保支付模式**，商户须**入驻 + 开通担保支付账户**；个人主体一般无法开通
- **抖音特色入口**（相对微信加分项）：**短视频挂载 / 直播小风车 / 评论锚点**（公域内容导流）、`aweme-data` 组件、`button` 的抖音 `open-type`（加关注/跳主页·直播间/IM）
- **音视频强**：`video`/`live-player` 竖屏全屏、手势切换、秒开
- 部分 API「**只支持抖音宿主**」，跨宿主需判端降级

## 一、登录

```js
tt.login({
  success(res) {
    // res.code：临时登录凭证，发给服务端
    myBackend.code2session(res.code);
  },
  fail(err) {},
});
```

- 服务端用 `code`（或匿名场景的 `anonymous_code`）调 **`code2session`（OpenAPI）** 换 **`openid` + `session_key`**（对标微信 `code2Session`）。
- **不支持匿名静默拿到用户真实身份**；需要用户公开信息（昵称/头像）用 `tt.getUserProfile`——**只能在 tap 事件回调里调用，且每次都弹授权框**（同微信新规）。
- `tt.getUserInfo` 与早期 `<button open-type="getUserInfo">` + `bindgetuserinfo` 已收紧/逐步废弃，切 `tt.getUserProfile`。

## 二、支付（担保支付）

```js
tt.pay({
  orderInfo: { /* 服务端下单返回 */ },
  success(res) {},
  fail(err) {},
});
```

- `tt.pay` 从**基础库 1.19.4** 起支持，调起字节小程序收银台（底层可走微信支付/支付宝）。
- 抖音支付是 **「担保支付」模式**：商户须先完成**入驻 + 开通担保支付账户**才能收款；交易/行业场景另有 `tt.continueToPay` 等。
- **个人主体一般无法开通支付**（多需企业资质，见 [对比微信](./vs-wechat)）。

## 三、抖音生态特色（相对微信的加分项）

- **公域内容入口**：短视频挂载、直播小风车、评论区锚点——把算法推荐的公域流量直接导入小程序，实现「内容→转化」即时闭环（微信是社交私域裂变，逻辑相反）。
- **`aweme-data` 组件 / `button` 抖音 `open-type`**：加关注、跳抖音主页/直播间、发起 IM 等原生生态动作。
- **音视频体验强**：`video`、`live-player` 的竖屏全屏、手势切换、秒开是抖音端硬指标。
- **大屏/媒体查询适配**：`tt.matchMedia` + 媒体查询组件（基础库 3.63.0）。
- 部分能力标「只支持抖音宿主」（如跳转抖音相关动作），跨宿主（今日头条等）需判端降级。

> 生态强绑定 API（登录/支付/分享/音视频/用户信息）是**必须逐个按官方适配**的部分——它们正是「语法相似但不能复制即用」的根源。
