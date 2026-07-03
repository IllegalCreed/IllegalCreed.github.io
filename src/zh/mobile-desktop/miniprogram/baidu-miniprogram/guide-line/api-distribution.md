---
layout: doc
outline: [2, 3]
---

# API 与分发

> 基于百度智能小程序（SWAN）· 核于 2026-07

## 速查

- **API 命名空间 `swan.*`**：方法名与签名**基本对齐微信 `wx.*`**，回调式 `success` / `fail` / `complete`；迁移主要是「换前缀」
- **网络**：`swan.request` / `swan.uploadFile` / `swan.downloadFile` / `swan.connectSocket`（+ `sendSocketMessage` / `onSocketMessage` / `closeSocket`）
- **导航**：`swan.navigateTo` / `redirectTo` / `switchTab` / `reLaunch` / `navigateBack`
- **存储**：`swan.setStorage(Sync)` / `getStorage(Sync)` / `removeStorage(Sync)` / `clearStorage(Sync)`
- **界面 / 设备 / 媒体 / 定位**：`showToast` / `showModal`、`getSystemInfo(Sync)` / `getNetworkType`、`chooseImage` / `previewImage`、`getLocation` / `openLocation` 等
- **登录**：`swan.login` → 拿一次性 `code`（约 10 分钟有效）→ 传后端换会话；`swan.checkSession` 校验；**Web 态首次登录需用 `onLogin()` 钩子拿 code**（百度特有坑）
- **AI 能力（`swan.ai.*`，最大卖点）**：OCR（`ocrIdCard` / `ocrBankCard`…）、图像识别、内容审核 `textReview`、人脸（`faceDetect` / `faceMatch`…）、语音合成 `textToAudio`
- **分发（区别于微信社交裂变）**：**百度搜索 + 信息流**——搜索完整名出「寻址单卡」、被收录进自然结果、语音说「名称 + 小程序」直达、信息流 / 固定入口多场景引流
- **一句话**：`swan.*` = 换前缀的 `wx.*`；差异化在 **`swan.ai.*` AI 能力**与**搜索分发**两块，是百度小程序真正的独特考点

## 一、`swan.*` API 全景

百度智能小程序的 API 命名空间从微信的 `wx` 换成 **`swan`**，方法名与签名**基本对齐微信**，同样是回调式（`success` / `fail` / `complete`）。对熟悉微信的开发者而言，绝大多数 API 只是「把 `wx.` 改成 `swan.`」。

### 网络

```javascript
// 形态与 wx.request 完全一致
swan.request({
  url: 'https://api.example.com/data',
  method: 'GET',
  data: {},
  success: res => console.log(res.data),
  fail: err => console.error(err),
});
```

还有 `swan.uploadFile` / `swan.downloadFile`（上传下载）、`swan.connectSocket` + `sendSocketMessage` / `onSocketMessage` / `closeSocket`（WebSocket）。

### 常用分类速览

| 类别 | 代表 API |
| --- | --- |
| 导航 | `swan.navigateTo` / `redirectTo` / `switchTab` / `reLaunch` / `navigateBack` |
| 存储 | `swan.setStorage(Sync)` / `getStorage(Sync)` / `removeStorage(Sync)` / `clearStorage(Sync)` / `getStorageInfo(Sync)` |
| 设备 | `swan.getSystemInfo(Sync)` / `getNetworkType` / `vibrateLong`、`vibrateShort` / `makePhoneCall` |
| 界面 | `swan.showToast` / `showModal` / `showActionSheet` / `setNavigationBarTitle` / `pageScrollTo` |
| 媒体 | `swan.chooseImage` / `previewImage` / `getImageInfo` / `createVideoContext` / `getRecorderManager` |
| 定位 / 地图 | `swan.getLocation` / `openLocation` / `chooseLocation` / `createMapContext` |
| Canvas | `swan.createCanvasContext` / `canvasToTempFilePath` |

## 二、登录授权

登录流程与微信 `wx.login` 同构：小程序端拿临时 `code` → 传后端 → 后端换会话（`session_key`）。

```javascript
// 经典登录：swan.login
swan.login({
  success: res => {
    // res.code：一次性登录凭证，约 10 分钟有效；发给自己后端换 session
    myBackend.exchange(res.code);
  },
  fail: err => console.log(err),
});

// 校验会话有效性
swan.checkSession({
  success: () => {},          // 会话有效
  fail: () => swan.login(),   // 失效则重新登录
});
```

其他相关：`swan.getUserInfo`（用户资料）、`swan.authorize`（申请权限）、`swan.openSetting`（打开权限设置页）；另有 `swan.getLoginCode` 用于获取授权码（与 `swan.login` 并存，二者的推荐用法与参数差异以官方登录章节为准）。

> **百度特有坑点**：在 **Web 态（H5 / 开源联盟环境）** 下**首次登录会跳转百度授权页再返回**，此时标准的 `success` 回调**不会触发**，需要用页面的 **`onLogin()` 生命周期钩子**来拿 `code`。这是与微信登录最需要注意的差异。

## 三、`swan.ai.*`：AI 能力（最大卖点）

百度把自家 AI 能力通过 **`swan.ai.*`** 命名空间直接暴露给小程序，这是百度智能小程序**区别于微信的核心差异化**：

| 能力方向 | 代表接口 |
| --- | --- |
| OCR 文字识别 | `swan.ai.ocrIdCard`（身份证）/ `ocrBankCard`（银行卡）/ `ocrDrivingLicense`（驾驶证） |
| 图像识别 | `swan.ai.advancedGeneralIdentify`（通用识别）/ `animalClassify`（动物）/ `carClassify`（车型） |
| 内容审核 | `swan.ai.textReview`（文本审核） |
| 人脸 | `swan.ai.faceDetect`（检测）/ `faceMatch`（比对）/ `facePersonVerify`（实名核身） |
| 语音 | `swan.ai.textToAudio`（语音合成） |

这些能力在微信侧通常需要自己接后端 + 第三方 AI 服务，而百度把它们做成了小程序端可直接调用的接口——**做题 / 教学时，`swan.ai.*` 是百度小程序独有的记忆点**。

## 四、搜索 / 信息流分发（区别于微信社交裂变）

微信小程序的流量核心是**社交裂变**（分享、群、朋友圈）；百度智能小程序的流量核心是**百度搜索与信息流**——这是两者最根本的路线差异：

- **寻址单卡**：用户在百度搜索完整的小程序名称，直接出现该小程序的单卡入口。
- **自然结果收录**：小程序内容被百度搜索收录后，可作为关键词的自然搜索结果出现，获得「被搜到」的免费流量。
- **语音直达**：在百度 App 里语音说「名称 + 小程序」即可直达。
- **多场景入口**：信息流、搜索、固定入口等多场景引流。

正因为分发依托搜索，百度小程序的运营重点是**内容被收录、名称可寻址**（偏 SEO / 内容），而非微信式的社交分享设计。

掌握了 API 与分发后，建议读 [现状定位与迁移](./status-vs-wechat) 了解平台当前处境与 `wx2swan` 迁移；框架与模板基础见 [SWAN 框架与模板](./swan-framework)。
