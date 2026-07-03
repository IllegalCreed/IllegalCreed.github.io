---
layout: doc
outline: [2, 3]
---

# 登录与支付

> 基于微信小程序（基础库 3.x）· 核于 2026-07

## 速查

- **登录四步（高频考点）**：① `wx.login()` 拿**临时凭证 `code`**（5 分钟有效、一次性）② 前端把 `code` 发给**开发者服务器** ③ 服务器用 `code` + AppID + AppSecret 调 **`auth.code2Session`** 换 `openid` / `session_key` / `unionid` ④ 服务器生成**自定义登录态**（token）返前端，后续请求带它鉴权
- **三个标识**：`openid`(用户在**本小程序**唯一) / `session_key`(会话密钥，**严禁下发前端**) / `unionid`(同一开放平台账号下**跨应用**统一，需已绑定开放平台才返回)
- **用户信息坑**：`wx.getUserProfile` 已于 **2022-10-25 起回收**——返回**默认灰头像 + 昵称"微信用户"**（匿名）；`wx.getUserInfo` 自 2021 起也返回匿名
- **替代方案**：**头像昵称填写能力**（基础库 2.21.2+）——头像 `<button open-type="chooseAvatar">`、昵称 `<input type="nickname">`，改为**用户主动填写**而非一键授权
- **手机号**：`<button open-type="getPhoneNumber">`（需企业主体 + 权限）
- **支付**：商户后端**统一下单**拿 `prepay_id` + 签名 → 前端 `wx.requestPayment({ timeStamp, nonceStr, package: 'prepay_id=x', signType, paySign })`；**微信支付 API v3 用 `signType: 'RSA'`**
- **支付结果以后端异步回调为准**，前端 `success` 仅表示用户完成交互
- **网络前置**：`wx.request` 必须 **HTTPS** + 域名在后台白名单（需 ICP 备案、不能用 IP）

## 一、登录流程：wx.login + code2Session

小程序登录是标准四步，核心是「前端拿临时 `code`，换取动作在服务端完成」：

```text
① wx.login()  →  拿到临时凭证 code（5min 有效、一次性）
                     │
② 前端 wx.request 把 code 发给【开发者服务器】
                     │
③ 服务器用 code + AppID + AppSecret 调 auth.code2Session
   （https://api.weixin.qq.com/sns/jscode2session）
   换回：openid / session_key / unionid
                     │
④ 服务器基于 openid 生成【自定义登录态】（自签 token / session id）返回前端
   后续请求都带此 token 鉴权
```

```javascript
// 小程序端：第 ① ② 步
wx.login({
  success(res) {
    // res.code 即临时登录凭证，发给自己的服务器换登录态
    wx.request({
      url: 'https://your-server.com/login',
      method: 'POST',
      data: { code: res.code },
      success(r) {
        wx.setStorageSync('token', r.data.token) // 存自定义登录态
      },
    })
  },
})
```

三个标识必须分清：

- **`openid`**：用户在**本小程序**内的唯一标识。
- **`session_key`**：会话密钥（用于解密 / 签名）——**严禁下发到前端、严禁外泄**，只留服务端。
- **`unionid`**：用户在同一**微信开放平台账号**下**跨应用**（多个小程序 / 公众号）的统一标识，需小程序已绑定开放平台才返回。

`auth.code2Session` 走微信接口 `https://api.weixin.qq.com/sns/jscode2session`（注意：`api.weixin.qq.com` 只能服务端调，**不能配进小程序域名白名单**，防泄漏 access_token）。

## 二、用户信息的重大版本坑

获取用户头像昵称的老接口已被**大幅收紧**，务必知道现状：

- **`wx.getUserProfile` 已于 2022-10-25 起被回收**：调用后头像返回**默认灰色头像**、昵称返回 **「微信用户」**（返回匿名数据，不再是真实资料）。
- **`wx.getUserInfo`** 自 2021-04-28 起也不再弹窗、直接返回匿名信息（但加密的 `openid` / `unionid` 数据仍可用）。

**替代方案 = 头像昵称填写能力**（基础库 **2.21.2+**）——从「一键授权获取」改为「用户主动填写 / 选择」：

```html
<!-- 头像：用户点击选择 -->
<button open-type="chooseAvatar" bind:chooseavatar="onChooseAvatar">选头像</button>
<!-- 昵称：键盘上方出现昵称推荐 -->
<input type="nickname" placeholder="请输入昵称" />
```

其他授权：`wx.authorize(scope)` + `wx.getSetting` 管理授权；地理位置（`scope.userLocation`）、录音、摄像头等敏感能力需在 `app.json` 声明 `permission` / `requiredPrivateInfos` 并经用户同意。手机号用 `<button open-type="getPhoneNumber" bind:getphonenumber>`（需**企业主体 + 权限**）。

## 三、微信支付：requestPayment

小程序支付分「后端下单」与「前端调起」两段，**签名与密钥全在后端**：

1. **后端统一下单**：商户后端调微信支付的**统一下单 / JSAPI 下单**接口，拿到 `prepay_id`，并用商户私钥生成签名。
2. **前端调起**：`wx.requestPayment` 用后端返回的参数拉起微信收银台。

```javascript
// 前端：用后端下发的参数调起支付
wx.requestPayment({
  timeStamp,                    // 时间戳（字符串）
  nonceStr,                     // 随机字符串（防重放）
  package: 'prepay_id=xxx',     // 统一下单返回的 prepay_id
  signType: 'RSA',              // 微信支付 API v3 用 RSA（旧 v2 为 MD5/HMAC-SHA256）
  paySign,                      // 后端生成的签名
  success(res) { /* 用户完成支付交互 */ },
  fail(err)   { /* 取消或失败 */ },
})
```

调起参数含义：

| 参数 | 说明 |
| --- | --- |
| `timeStamp` | 时间戳（字符串） |
| `nonceStr` | 随机字符串（防重放） |
| `package` | `'prepay_id=xxx'` |
| `signType` | 签名类型，**微信支付 API v3 用 `RSA`**（旧 v2 为 `MD5` / `HMAC-SHA256`） |
| `paySign` | 后端生成的签名 |

**关键纪律**：**支付结果必须以后端接收微信的异步回调通知为准**——前端 `success` 仅代表用户完成了交互，不能作为「已付款」的最终依据，否则会被恶意绕过。

## 四、网络前置：域名白名单

登录、支付、业务请求都走 `wx.request`，它有硬性前置条件：

- **必须 HTTPS**（WebSocket 必须 WSS）。
- **域名须配在**微信后台「开发设置 → 服务器域名」**白名单**，且域名**需 ICP 备案**、**不能用 IP**（局域网 IP 除外）、不能配父域名。
- 开发阶段可在开发者工具勾「不校验合法域名」跳过（**仅开发有效**，上线必须配好白名单）。
- 限制：默认超时 60s；并发 `request` / `uploadFile` / `downloadFile` **各 10 个**、WebSocket 5 个；切后台 5s 未完成的请求会中断。

> 回到总览：[参考](../reference) 汇总了本叶所有速查表与权威链接。
