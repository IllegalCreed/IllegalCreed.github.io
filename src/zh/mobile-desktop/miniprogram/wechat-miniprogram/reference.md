---
layout: doc
outline: [2, 3]
---

# 微信小程序参考

> 基于微信小程序（基础库 3.x）· 核于 2026-07

## 速查

- **版本坐标**：基础库 **3.x**（主流）｜Skyline 正式版起于 **3.0.0**｜鸿蒙支持起于 **3.7.x**｜特性检测用 `wx.canIUse('api.method')`
- **四文件**：`.wxml`(结构) · `.wxss`(样式,`rpx`) · `.js`(逻辑,`Page`/`Component`) · `.json`(配置,**无注释**)｜全局 `app.js` / `app.json` / `app.wxss`
- **双线程**：逻辑层(JsCore：iOS=JavaScriptCore / 安卓=V8 / 工具=NW.js，**无 DOM/BOM**) ↔ Native/JSBridge ↔ 渲染层(WebView)；通信=异步序列化
- **setData**：唯一跨线程更新 UI 的通道；优化=只放渲染数据 + 降频 + data path 局部更新 + 后台不更新 + 高频封装成组件
- **登录**：`wx.login()`→`code`→(服务端)`code2Session`→`openid` / `session_key`(**不下发**) / `unionid`→自定义登录态
- **支付**：`wx.requestPayment({ timeStamp, nonceStr, package:'prepay_id=x', signType:'RSA', paySign })`，后端统一下单拿 `prepay_id` + 签名

## 一、版本坐标

| 项 | 值 |
| --- | --- |
| 基础库主流版本 | **3.x** |
| Skyline 正式版起点 | 基础库 **3.0.0** |
| HarmonyOS 支持起点 | 基础库 **3.7.x** |
| 逻辑层 JS 引擎 | iOS **JavaScriptCore** / Android **V8** / 工具 **NW.js** |
| 组件框架（Skyline） | **glass-easel**（替代 exparser） |
| 特性检测 | `wx.canIUse('api.method')` |

## 二、四文件与全局配置

| 文件 | 职责 |
| --- | --- |
| `.wxml` | 结构；内建组件 + Mustache 双花括号绑定 + `wx:for` / `wx:if` |
| `.wxss` | 样式；`rpx` 响应式单位、`@import`、部分选择器受限 |
| `.js` | 逻辑；`Page()` / `Component()`、`setData`、`wx.*` |
| `.json` | 配置；**纯 JSON，不能写注释 / 逻辑** |
| `app.js` | `App({})` 全局实例 + `globalData` + 全局生命周期 |
| `app.json` | `pages`(首项=首页) / `window` / `tabBar` / `subPackages` / `renderer` |
| `app.wxss` | 全局样式 |

## 三、双线程与 setData 优化

| 优化原则 | 做法 |
| --- | --- |
| 只放渲染数据 | 业务数据挂普通属性（`this.userData`），别塞 `data` |
| 降低频率 | 合并连续 `setData`，避免毫秒级高频 |
| data path 局部更新 | `this.setData({ 'array[2].message': 'x' })`，别全量重传 |
| 后台不更新 | 切后台后延到 `onShow` 再 `setData` |
| 高频封装成组件 | 倒计时等做成自定义组件，缩小重渲染范围 |

## 四、生命周期

| 构造器 | 关键生命周期 |
| --- | --- |
| `App()` | `onLaunch`(全局一次) → `onShow` → `onHide`；`onError` / `onPageNotFound` |
| `Page()` | `onLoad(query)` → `onShow` → `onReady` → [`onHide` ⇄ `onShow`] → `onUnload`；+ `onPullDownRefresh` / `onReachBottom` / `onShareAppMessage` |
| `Component()` | `lifetimes`: `created` → `attached` → `ready` → `detached`；`pageLifetimes`: `show` / `hide` / `resize` |

## 五、路由（页面栈）

| API | 行为 |
| --- | --- |
| `wx.navigateTo` | 压栈进新页（**≤ 10 层**） |
| `wx.redirectTo` | 关闭当前页、替换（不压栈） |
| `wx.switchTab` | 跳 tabBar 页（关非 tab 页） |
| `wx.navigateBack` | 出栈返回（`{ delta }`） |
| `wx.reLaunch` | 关所有页打开某页 |

> **tabBar 页必须在主包**，且不能用 `navigateTo` / `redirectTo` 跳转。

## 六、WXML 事件

| 绑定 | 含义 |
| --- | --- |
| `bindtap` / `bind:tap` | 冒泡 |
| `catchtap` | 阻止冒泡 |
| `capture-bind` / `capture-catch` | 捕获阶段 |
| 传参 | `data-*` → `e.currentTarget.dataset.xxx` |
| 表单值 | `e.detail.value` |
| `target` vs `currentTarget` | 触发源 vs 绑定者（冒泡时可不同） |

## 七、网络与存储

| 项 | 要点 |
| --- | --- |
| `wx.request` | **HTTPS** + 域名白名单（**需 ICP 备案、不能用 IP**） |
| 超时 / 并发 | 默认 60s；`request`/上传/下载**各 10**、WebSocket 5 |
| `wx.setStorage(Sync)` | 单 key **≤ 1MB**、单个小程序总 **≤ 10MB** |
| 后台请求 | 切后台 5s 未完成会中断 |

## 八、登录与用户信息

| 项 | 要点 |
| --- | --- |
| 登录 | `wx.login()` → `code`(5min/一次性) → 服务端 `code2Session` → 自定义登录态 |
| `openid` | 用户在**本小程序**唯一标识 |
| `session_key` | 会话密钥，**严禁下发前端** |
| `unionid` | 同一开放平台账号下**跨应用**统一（需绑定开放平台） |
| `getUserProfile` | **2022-10-25 回收**：返回灰头像 + 「微信用户」 |
| 替代 | 头像 `open-type="chooseAvatar"` + 昵称 `<input type="nickname">`（2.21.2+） |
| 手机号 | `open-type="getPhoneNumber"`（企业主体 + 权限） |

## 九、分包

| 项 | 上限 / 要点 |
| --- | --- |
| 主包 | ≤ 2MB |
| 单个分包 | ≤ 2MB |
| 总体积 | ≤ 20MB（小游戏虚拟支付 30MB） |
| tabBar 页 | 必须在主包 |
| 分包间引用 | 不能互引，都能引主包 |
| 进阶 | `preloadRule`(预下载) / `independent`(独立分包) / 分包异步化 |

## 十、Skyline 与云开发

| 项 | 要点 |
| --- | --- |
| 启用 Skyline | `"renderer": "skyline"` + `"componentFramework": "glass-easel"` |
| Skyline 收益 | 独立渲染线程、内存低、**启动 −17.6% / 渲染 −50%**（官方口径） |
| Skyline 新特性 | Worklet 动画 / 手势 / 自定义路由 / `grid-view` 等；**WXS 变异步** |
| 云开发 | `wx.cloud.init({env})`；数据库 `db.collection().add()` / 云存储 / 云函数 `callFunction` / 云调用 |

## 十一、微信支付

```javascript
wx.requestPayment({
  timeStamp, nonceStr,
  package: 'prepay_id=xxx',
  signType: 'RSA',        // 微信支付 API v3（旧 v2 为 MD5 / HMAC-SHA256）
  paySign,
  success() {}, fail() {},
})
```

> 后端**统一下单**拿 `prepay_id` + 签名；**支付结果以后端异步回调为准**。

## 十二、常见易错点

| # | 易错点 |
| --- | --- |
| 1 | 逻辑层**无 DOM / BOM**，拿不到 `window` / `document`，`eval` 被禁 |
| 2 | 更新 UI 只能 `setData`，且跨线程序列化——数据量 / 频率是性能命门 |
| 3 | `data` 只放渲染数据；业务数据挂普通属性 |
| 4 | `.json` 是纯 JSON，**不能写注释 / 逻辑** |
| 5 | `wx:for` 的 **`wx:key` 必填**；`wx:if`(渲染) vs `hidden`(显隐)择用 |
| 6 | `bind*` 冒泡 / `catch*` 阻止冒泡；`target` ≠ `currentTarget` |
| 7 | tabBar 页必在主包，不能 `navigateTo`；页面栈 ≤ 10 层 |
| 8 | `wx.request` 必须 HTTPS + 白名单域名（ICP 备案、无 IP） |
| 9 | `session_key` 严禁下发前端 |
| 10 | `getUserProfile` 已回收（灰头像 + 「微信用户」），改用头像昵称填写能力 |
| 11 | 支付 `success` ≠ 已付款，以后端异步回调为准；v3 用 `signType: 'RSA'` |
| 12 | Skyline 下 WXS 变异步，动画改 Worklet |
| 13 | WXSS `background-image` 不能用本地图（需网络图 / base64） |
| 14 | `rpx`：屏幕宽恒 750rpx（iPhone6 下 1rpx = 0.5px） |
| 15 | 用 `wx.canIUse` 做特性检测，避免低版本调不存在的 API |

## 十三、权威链接

- [小程序官方文档](https://developers.weixin.qq.com/miniprogram/dev/framework/) · [框架 · 逻辑层 / 视图层](https://developers.weixin.qq.com/miniprogram/dev/framework/app-service/)
- [组件](https://developers.weixin.qq.com/miniprogram/dev/component/) · [API](https://developers.weixin.qq.com/miniprogram/dev/api/)
- [运行机制](https://developers.weixin.qq.com/miniprogram/dev/framework/runtime/operating-mechanism.html) · [Skyline 渲染引擎](https://developers.weixin.qq.com/miniprogram/dev/framework/runtime/skyline/introduction.html)
- [自定义组件](https://developers.weixin.qq.com/miniprogram/dev/framework/custom-component/) · [WXS](https://developers.weixin.qq.com/miniprogram/dev/reference/wxs/)
- [小程序登录](https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/login.html) · [微信支付 · 小程序支付](https://pay.weixin.qq.com/doc/v3/merchant/4012791856)
- [微信云开发](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/basis/getting-started.html) · [分包加载](https://developers.weixin.qq.com/miniprogram/dev/framework/subpackages/basic.html)
- [微信公众平台](https://mp.weixin.qq.com/) · [微信开发者工具下载](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
