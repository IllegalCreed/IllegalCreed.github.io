---
layout: doc
outline: [2, 3]
---

# 登录态与工程迁移

> 基于 QQ小程序 · 核于 2026-07

## 速查

- **登录流程**（与微信几乎一致，仅换 `qq.*` + QQ 服务端接口）：①`qq.login()` 拿 `res.code`（临时凭证，**5 分钟有效**）→ ②服务端用 code 调 **`code2Session`** 换 `openid` / `session_key`（及 `unionid`）→ ③`qq.checkSession()` 校验，过期则重新 `qq.login()`
- **登录态独立**：QQ 返回的 openid/session_key 属 QQ 体系，**与微信互不相通**
- **安全约束**：`api.q.qq.com` **不能**配为小程序服务器域名，换取接口只能在**服务端**调，不能在小程序内直接调（code2Session 确切 URL 官方文档未给全，一般在 `api.q.qq.com` 域下，**待核**）
- **迁移步骤**：注册拿 QQ AppID → `project.config.json` 填 AppID（或加 `qqappid` 字段）→ QQ 开发者工具打开工程（`.wxml`/`.wxss`/`wx.` 直接兼容）→ 按需改 `wx.*`→`qq.*`、接 QQ `code2Session`、处理差异 API
- **判端**：`qq.getSystemInfoSync().AppPlatform === 'qq'`，在同一套代码里区分运行端
- **网络约束**：合法域名白名单——仅 `https`/`wss`、**不得用 IP/localhost**、须 ICP 备案、每类接口≤20 域名、端口精确匹配；默认超时 60s、最大并发 10

## 一、登录流程（`qq.login` → `code2Session`）

流程与微信几乎一致，只是把 `wx.*` 换成 `qq.*`、服务端换 QQ 的换取接口：

1. 客户端调 `qq.login()`，成功回调拿到 `res.code`（临时登录凭证，**5 分钟有效**）。
2. 开发者服务器用该 code 调 **`code2Session`**（对标微信 `jscode2session`），换取 `openid` / `session_key`（及 `unionid`）。
3. 用 `qq.checkSession()` 校验 `session_key` 是否过期；过期则重新 `qq.login()`。

```js
// 页面 .js —— 客户端拿 code，交给自己的服务器换 openid
qq.login({
  success(res) {
    if (res.code) {
      // 把 code 发到开发者服务器，由服务端调 code2Session 换 openid/session_key
      qq.request({
        url: 'https://your-server.com/login', // 须为白名单内、已备案的 https 域名
        method: 'POST',
        data: { code: res.code },
        success(r) {
          // 服务端返回自定义登录态（如 token），存本地
          qq.setStorageSync('token', r.data.token);
        },
      });
    } else {
      console.error('登录失败', res.errMsg);
    }
  },
});

// 进入小程序时先校验登录态是否过期
qq.checkSession({
  success() {
    /* session_key 未过期 */
  },
  fail() {
    qq.login({
      /* 过期，重新登录 */
    });
  },
});
```

## 二、登录态为何与微信独立

QQ 返回的 `openid` / `session_key`（及 `unionid`）属于 **QQ 账号体系**，与微信小程序体系**互不相通**——同一个自然人在微信和 QQ 两端拿到的 openid 不同，不能混用。因此接入 QQ 时，服务端的 `code2Session` 走 QQ 的接口，不能复用微信的 `jscode2session`。

::: warning 安全约束（重要）
`api.q.qq.com` **不能**配置为小程序的服务器（request）域名，`code2Session` 这类换取接口**只能在开发者服务端调用**，绝不能在小程序内直接请求。code2Session 的**确切 URL 官方文档未给全**，一般在 `api.q.qq.com` 域下（**待核**，以官方最新文档为准）。
:::

## 三、微信工程迁移到 QQ

得益于同源（详见[与微信小程序对比](./vs-wechat)），微信工程迁移成本低，官方 FAQ 明确支持 `wx/`、`.wxml`、`.wxss` 等写法。步骤：

1. 注册 QQ 小程序账号，拿 **QQ AppID**。
2. 在 `project.config.json` 填 QQ AppID（迁移时可加 `qqappid` 字段）。
3. 用 **QQ 开发者工具**打开工程（`.wxml` / `.wxss` / `wx.` 语法直接兼容，可先原样跑起来）。
4. 按需改造：
   - `wx.*` → 视需要保留（兼容）或改为 `qq.*`；
   - **登录**接 QQ 的 `code2Session`（登录态独立，见上）；
   - 处理 QQ **不支持或行为不同**的 API（完整清单**待核**，需逐 API 页比对）；
   - 开放能力（用户信息、群相关）换成 QQ 体系。

> 提醒：若目标本就是多端，更常见的做法是用 **uni-app / Taro / MPX** 编译到各家小程序（含 QQ），而非手工维护一份 `.wxml` 到处复用。

## 四、`AppPlatform` 判端：一套代码多端

同一套代码在不同宿主运行时，用 `qq.getSystemInfoSync().AppPlatform` 区分运行端（QQ 返回 `'qq'`）：

```js
// 同一套代码区分运行端，做平台差异化处理
const platform = qq.getSystemInfoSync().AppPlatform;
if (platform === 'qq') {
  // QQ 端专属逻辑，如 QQ 开放能力、QQ 登录
} else {
  // 其他端逻辑
}
```

## 五、网络与域名约束

与微信一致，QQ 小程序也走**合法域名白名单**：

- 请求：`qq.request`（HTTPS）、`qq.uploadFile` / `qq.downloadFile`（HTTPS）、`qq.connectSocket`（WSS）。
- 白名单规则：仅支持 `https` / `wss`；**不得用 IP / localhost**；域名须完成 **ICP 备案**；每类接口最多 **20** 个域名；端口须精确匹配（配 `:8080` 就只能请求该端口）。
- 运行限制：默认超时 **60s**；最大并发 **10**；进后台 5s 内未完成的请求会 `fail interrupted`。
- 状态码：只要服务端有响应，无论 statusCode 为何都走 success 回调，需开发者自行校验状态码。

> 搜索侧提到「QQ 小程序继承了微信的缓存策略，但登录态各平台不同」——缓存同源、登录态各异；此表述来自搜索摘要而非官方页原文，**标待核**。
