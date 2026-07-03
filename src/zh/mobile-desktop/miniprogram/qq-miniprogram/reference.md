---
layout: doc
outline: [2, 3]
---

# QQ小程序 参考

> 基于 QQ小程序 · 核于 2026-07

## 速查

- 定位：腾讯 QQ 内、**与微信小程序高度同源**（App/Page/Component、`setData`、数据绑定 <code v-pre>{{ }}</code>、组件体系一致）；现已边缘化
- 差异集中在**命名前缀**：视图 `.qml`、样式 `.qss`、指令 `qq:for`/`qq:if`、API `qq.*`
- **兼容微信写法**：QQ 同时认 `.wxml`/`.wxss`/`wx.*`，微信工程改 AppID 即可低成本移植
- 登录：`qq.login`→`code`（5 分钟）→服务端 `code2Session`→`openid`/`session_key`，**与微信登录态互不相通**
- 判端：`qq.getSystemInfoSync().AppPlatform === 'qq'`
- 现状：基础库冻结 **v1.60.0（2022-12）**、低维护；AI 小程序计划属微信非 QQ

## 一、与微信对照

| 维度 | 微信 | QQ |
| --- | --- | --- |
| 视图 | `.wxml`（WXML） | `.qml`（QML，兼容 WXML） |
| 样式 | `.wxss`（WXSS） | `.qss`（QSS，兼容 WXSS） |
| 指令 | `wx:for`/`wx:if` | `qq:for`/`qq:if`（也认 `wx:`） |
| API | `wx.*` | `qq.*`（同名同参） |
| 逻辑 | `App`/`Page`/`Component` | 完全相同 |
| 登录态 | 微信 openid/unionid | QQ 独立 openid/session_key |

## 二、文件结构

| 层级 | 文件 |
| --- | --- |
| App（根） | `app.js`（必需）/ `app.json`（必需）/ `app.qss`（可选） |
| 页面（同名同路径） | `.js`（必需）/ `.qml`（必需）/ `.json`（可选）/ `.qss`（可选） |

## 三、QML 速记

```qml
<view qq:for="{{array}}" qq:for-item="item" qq:key="id">{{ item.name }}</view>
<view qq:if="{{cond}}">True</view>
<view qq:else>False</view>
<view bindtap="handleTap" data-id="1">点我</view>
```

## 四、登录

```javascript
qq.login({ success: (res) => post(res.code) });   // code 5 分钟一次性
qq.checkSession({ fail: () => qq.login() });
// 服务端用 code 调 code2Session（api.q.qq.com 域）换 openid/session_key
```

- QQ 登录态与微信**完全独立**、不互通。
- `api.q.qq.com` **不能**配为小程序服务器域名，相关接口只能服务端调。

## 五、网络与域名

- `qq.request`/`uploadFile`/`downloadFile`（HTTPS）、`qq.connectSocket`（WSS）。
- 合法域名白名单：仅 `https`/`wss`、不得用 IP/localhost、须 ICP 备案、端口精确匹配。
- 约束（约）：超时 60s、并发 10、进后台 5s 未完成 `fail interrupted`；有响应即走 `success`（需自校验 statusCode）。

## 六、迁移（微信 → QQ）

| 步骤 | 说明 |
| --- | --- |
| 1 | 注册 QQ 小程序、拿 QQ AppID |
| 2 | `project.config.json` 填 QQ AppID（或加 `qqappid`） |
| 3 | 用 QQ 开发者工具打开（`.wxml`/`.wxss`/`wx.` 兼容） |
| 4 | 登录接 QQ `code2Session`；处理 QQ 不支持/差异的 API |
| 5 | `AppPlatform === 'qq'` 判端做差异降级 |

> 真正「一套代码多端」通常走 uni-app / Taro / MPX，把 QQ 作为一个输出端，而非直接靠 WXML 复用。

## 七、易错点

| # | 要点 |
| --- | --- |
| 1 | QQ 与微信高度同源，差异主要是前缀（`.qml`/`.qss`/`qq:`/`qq.`）与登录态 |
| 2 | QQ 兼容 `.wxml`/`.wxss`/`wx.` 写法，迁移成本低 |
| 3 | 登录态与微信不互通；`code2Session` 走 `api.q.qq.com`（服务端调） |
| 4 | 基础库冻结 v1.60.0（2022-12）、低维护、边缘化 |
| 5 | **2026 AI 小程序计划属微信非 QQ**，勿张冠李戴 |
| 6 | 「是否停止新注册」缺官方硬证据，属待核，勿写死 |

## 八、权威链接

- QQ 开放平台文档：https://q.qq.com/wiki/
- 框架/目录：https://q.qq.com/wiki/develop/miniprogram/frame/
- API 总览：https://q.qq.com/wiki/develop/miniprogram/API/
- 基础库 changelog：https://q.qq.com/wiki/develop/basic_lib/changelog/
