---
layout: doc
outline: [2, 3]
---

# 登录与支付

> 基于支付宝小程序 · 核于 2026-07

## 速查

- **登录用 `my.getAuthCode`**：前端拿 `authCode` → 传服务端 → 服务端 `alipay.system.oauth.token` 用 `authCode` 换 **`user_id`**（支付宝会员唯一标识）+ `access_token`
- **两档 `scopes`**：`auth_base`(默认，**静默无弹窗**，仅换 `user_id`) / `auth_user`(主动授权**弹窗**，可再取会员信息，须企业账号开通对应能力)
- **要会员详情**：换到 `access_token` 后服务端再调 `alipay.user.info.share` 取头像 / 昵称 / 性别等
- **支付用 `my.tradePay`**：参数 `tradeNO`(服务端下单得到的交易号) 或 `orderStr`(完整下单串)；+ `success` / `fail` / `complete`（无 `paymentUrl` 参数）
- **支付四步**：① 服务端 `alipay.trade.create` 下单得 `trade_no`（小程序场景 `buyer_id` 必填、须与付款账号一致）② 前端 `my.tradePay({ tradeNO })` 唤起收银台 ③ 看 `resultCode` ④ **服务端 `alipay.trade.query` 或异步通知最终对账**
- **`resultCode`**：`'9000'` 成功 / `'8000'` 处理中 / `'6001'` 用户取消 / `'6002'` 网络错误 / `'4000'` 失败
- **纪律**：**勿只信前端同步返回**，付款结果以服务端查询 / 异步通知为准
- **对比微信**：登录 `wx.login` + `code2Session` → `openid`；支付 `wx.requestPayment` → 微信支付。概念对应但接口 / 字段全不同（详见[对比微信小程序](./vs-wechat)）

## 一、登录：my.getAuthCode 换 user_id

支付宝小程序登录的核心是「**前端拿 `authCode`，换取动作在服务端完成**」——和微信「前端拿 `code`、服务端 `code2Session`」结构一致，但接口和产出的标识不同（支付宝产出 **`user_id`**，微信产出 `openid`）。

```text
① 前端 my.getAuthCode(scopes)  →  拿到 authCode
                     │
② 前端把 authCode 发给【开发者服务器】
                     │
③ 服务器用 authCode + AppID + 应用私钥 调 alipay.system.oauth.token
   换回：user_id（会员唯一标识）+ access_token
                     │
④ 服务器基于 user_id 生成【自定义登录态】(token) 返回前端，后续请求带它鉴权
   （需会员详情时，服务端再用 access_token 调 alipay.user.info.share）
```

前端只负责第 ① 步：

```javascript
// 前端：拿 authCode（默认 auth_base 静默授权）
my.getAuthCode({
  scopes: 'auth_base',
  success: res => {
    // res.authCode 发给自己的服务器换 user_id
    my.request({
      url: 'https://your-server.com/login',
      method: 'POST',
      data: { authCode: res.authCode },
      success: r => my.setStorageSync({ key: 'token', data: r.data.token }),
    })
  },
  fail: res => {},
})
```

## 二、两档 scopes：auth_base vs auth_user

`scopes` 决定授权强度：

| scope | 交互 | 能拿到 | 说明 |
| --- | --- | --- | --- |
| `auth_base`（默认） | **静默、无弹窗** | 仅 `user_id` | 只要会员唯一标识时用它，体验无打断 |
| `auth_user` | **弹窗、用户主动同意** | `user_id` + 可换会员信息 | 需头像 / 昵称 / 手机号 / 地区 / 性别等时用；须**企业账号在开放平台开通对应能力** |

- **只要识别用户**（绑定业务账号）：用 `auth_base` 静默换 `user_id` 即可。
- **要展示 / 存储会员资料**：用 `auth_user` 弹窗授权，服务端换到 `access_token` 后再调 `alipay.user.info.share` 取详情；手机号、收货地址等各有独立开放能力，均须企业主体开通。

> 关键点：`user_id` 是「用户在支付宝这一开放平台账号下的唯一标识」，服务端应以它作为业务用户主键，**不要**用前端可见字段做鉴权依据。

## 三、支付：my.tradePay（生态核心优势）

支付是支付宝小程序相对微信的**天然优势**——与支付宝账户、花呗、信用体系直连，收银台原生。前端调 `my.tradePay`，但**签名与下单全在服务端**：

```text
① 服务端 alipay.trade.create 下单  →  得 trade_no（tradeNO）
   （小程序场景 buyer_id 必填，须与前端唤起支付的支付宝账号一致，2088 开头）
                     │
② 前端 my.tradePay({ tradeNO }) 唤起收银台
                     │
③ 前端读 resultCode 判断交互结果
                     │
④ 服务端 alipay.trade.query 或接收异步通知做【最终对账】
```

```javascript
// 前端：用服务端下发的交易号唤起收银台
my.tradePay({
  tradeNO: '201711152100110410533667792', // 服务端 alipay.trade.create 得到
  success: res => {
    if (res.resultCode === '9000') {
      // 交互成功；仍需走服务端查询 / 异步通知最终确认
    }
  },
  fail: res => {},
})
```

参数：`tradeNO`（支付宝交易号，服务端下单得到）**或** `orderStr`（完整下单串）；再加 `success` / `fail` / `complete`。注意支付宝**没有** `paymentUrl` 这类参数。

## 四、resultCode 与对账纪律

`my.tradePay` 的 `resultCode` 是**字符串**：

| resultCode | 含义 |
| --- | --- |
| `'9000'` | 支付成功（仍需服务端确认） |
| `'8000'` | 正在处理中 |
| `'6001'` | 用户中途取消 |
| `'6002'` | 网络连接出错 |
| `'4000'` | 支付失败 |

**核心纪律：勿只信前端同步返回**。`resultCode === '9000'` 只代表用户在收银台完成了交互，**不能作为「已到账」的最终依据**——必须由**服务端 `alipay.trade.query` 主动查询**，或**接收支付宝异步通知**来最终对账，否则会被恶意绕过。这与微信「支付结果以后端异步回调为准」是同一条铁律。

## 五、与微信登录 / 支付的对应关系

| 能力 | 支付宝 | 微信 |
| --- | --- | --- |
| 登录取凭证 | `my.getAuthCode` → `authCode` | `wx.login` → `code` |
| 服务端换标识 | `alipay.system.oauth.token` → `user_id` | `auth.code2Session` → `openid` / `session_key` |
| 取会员信息 | `auth_user` + `alipay.user.info.share` | 头像昵称填写能力（`chooseAvatar` / `type=nickname`） |
| 唤起支付 | `my.tradePay`（`tradeNO` / `orderStr`） | `wx.requestPayment`（`prepay_id` + 签名） |
| 支付通道 | 支付宝支付（账户 / 花呗 / 信用） | 微信支付 |

概念一一对应，但**接口名、参数、返回字段全不同**——迁移时不能照搬。完整差异见[对比微信小程序](./vs-wechat)。

> 回到总览：[参考](../reference) 汇总了本叶所有速查表与权威链接。
