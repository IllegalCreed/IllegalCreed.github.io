---
layout: doc
outline: [2, 3]
---

# 事件与 API

> 基于支付宝小程序 · 核于 2026-07

## 速查

- **事件绑定（重点差异）**：`on` + 驼峰事件名（**冒泡**，≈ 微信 `bindtap`）/ `catch` + 驼峰事件名（**阻止冒泡**，≈ 微信 `catchtap`）；值为字符串（`Page` / `Component` 方法名）
- **最直观差异**：支付宝 **`onTap`（驼峰）** vs 微信 **`bindtap`（小写 + bind 前缀）**
- **常见事件**：`touchStart` / `touchMove` / `touchEnd` / `tap` / `longTap`；表单 `onInput` / `onChange` / `onConfirm` / `onFocus` / `onBlur`
- **自定义数据**：`data-*` 属性 → `event.target.dataset`（驼峰化）；`target`(触发源节点) vs `currentTarget`(绑定处理函数的节点)
- **API 前缀 `my.*`**：网络 `my.request`（旧 `my.httpRequest` 已弃用）、路由 `my.navigateTo` / `my.redirectTo` / `my.switchTab` / `my.reLaunch` / `my.navigateBack`、缓存 `my.setStorage` / `my.getStorage`、反馈 `my.alert` / `my.showToast` / `my.showLoading`
- **调用约定**：异步 API 入参含 `success` / `fail` / `complete` 回调；同步 API 以 `Sync` 结尾直接返回；事件监听成对 `my.on*` / `my.off*`；能力检测 `my.canIUse('api')`
- **⚠️ 关键差异**：`my.*` **默认不返回 Promise**，须写 `success` / `fail` 回调，或**自行 promisify**（微信 `wx.*` 省略 `success` 时自动返回 Promise）
- **错误结果**：回调结果常含 `error`(Number) / `errorMessage`(String)

## 一、事件系统：on / catch + 驼峰

支付宝小程序的事件绑定语法是 **`on` + 驼峰事件名**（冒泡）与 **`catch` + 驼峰事件名**（阻止冒泡），属性值是字符串——`Page` / `Component` 里的方法名。**这是与微信最直观的差异之一**：微信写 `bindtap` / `catchtap`（全小写 + bind 前缀），支付宝写 `onTap` / `catchTap`（驼峰）。

```html
<view onTap="handleTap1">           <!-- 冒泡，≈ 微信 bindtap -->
  <view catchTap="handleTap2">       <!-- 阻止冒泡，≈ 微信 catchtap -->
    <view onTap="handleTap3">点我</view>
  </view>
</view>
```

**常见冒泡事件**：`touchStart` / `touchMove` / `touchEnd` / `touchCancel` / `tap` / `longTap`。表单类：`onInput` / `onChange` / `onConfirm` / `onFocus` / `onBlur` 等。

## 二、事件对象与 dataset

在节点上用 `data-*` 传自定义数据，逻辑层通过 `event.target.dataset` 读取（键会**驼峰化**：`data-user-id` → `dataset.userId`）：

```html
<view data-user-id="123" data-action="submit" onTap="handleAction">提交</view>
```

```javascript
Page({
  handleAction(e) {
    console.log(e.target.dataset.userId)  // '123'
    console.log(e.target.dataset.action)  // 'submit'
  },
})
```

事件对象两个关键字段要分清：

- **`target`**：**触发**事件的源节点（真正被点的那个）。
- **`currentTarget`**：**绑定**事件处理函数的节点（`on*` 写在哪个节点上）。

## 三、my.* API 与调用约定

API 统一前缀 **`my.*`**（微信是 `wx.*`）。官方分为**基础 API**（网络 / 界面 / 缓存 / 设备 / 多媒体 / 位置 / 文件……）与**开放能力 API**（用户授权 / 会员信息 / 支付 / 消息……），另有服务端 `alipay.*` 系列 OpenAPI。

调用约定：

- **异步 API**：入参对象含 `success` / `fail` / `complete` 回调；回调结果常含 `error`(Number) / `errorMessage`(String)。
- **同步 API**：以 **`Sync`** 结尾，直接返回结果，失败抛异常（如 `my.getStorageSync`）。
- **事件监听**：成对 `my.on*` / `my.off*`（如 `my.onNetworkStatusChange` / `my.offNetworkStatusChange`）。
- **能力检测**：`my.canIUse('api.method')` / `my.canIUse('component.attr')` 判断当前环境是否支持。

**关键 API 一览**：

| 类别 | API |
| --- | --- |
| 网络 | `my.request`（旧 `my.httpRequest` **已弃用**）、`my.uploadFile` / `my.downloadFile` / `my.connectSocket` |
| 路由 | `my.navigateTo` / `my.redirectTo` / `my.switchTab` / `my.reLaunch` / `my.navigateBack` |
| 缓存 | `my.setStorage` / `my.getStorage` / `my.removeStorage` / `my.clearStorage`（+ `Sync` 版） |
| 界面反馈 | `my.alert` / `my.confirm` / `my.showToast` / `my.showLoading` / `my.showActionSheet` |
| 设备 / 扫码 | `my.getSystemInfo` / `my.getLocation` / `my.scan` |
| 开放能力 | `my.getAuthCode`（登录）/ `my.tradePay`（支付，详见[登录与支付](./login-pay)） |

网络请求示例（注意用回调，不是 `await`）：

```javascript
my.request({
  url: 'https://api.example.com/data',
  method: 'POST',
  data: { id: 1 },
  headers: { 'content-type': 'application/json' },
  success: res => console.log(res.data, res.status),
  fail: err => console.error(err),
})
```

## 四、关键差异：my.* 默认不返回 Promise

这是支付宝与微信最容易踩的差异之一：**`my.*` 默认不返回 Promise**，必须显式提供 `success` / `fail` 回调，否则拿不到结果。而微信的 `wx.*` 在**省略 `success` 时会自动返回 Promise**——同样的心智照搬过来会「静默失败」。

```javascript
// ❌ 错误：以为像微信一样能 await —— my.request 默认不返回 Promise
const res = await my.request({ url }) // res 不是期望的响应

// ✅ 正确：走回调
my.request({
  url,
  success: res => { /* 用 res */ },
  fail: err => { /* 处理错误 */ },
})
```

需要 `async` / `await` 写法时，**自行 promisify** 封装：

```javascript
/**
 * 把回调式 my.* API 包成 Promise
 * @param {Function} api - 如 my.request
 * @returns {(options: object) => Promise<any>}
 */
function promisify(api) {
  return (options = {}) =>
    new Promise((resolve, reject) => {
      api({ ...options, success: resolve, fail: reject })
    })
}

const request = promisify(my.request)

// 之后即可 await
async function load() {
  try {
    const res = await request({ url: 'https://api.example.com/data' })
    console.log(res.data)
  } catch (err) {
    console.error(err)
  }
}
```

> 提示：`resultCode` 等业务结果码仍在 `success` 回调的返回值里，promisify 只是把「回调」转成「Promise resolve」，不改变结果结构。个别新 API 是否已内置 Promise 官方未统一声明，工程上**统一按无 Promise 处理最稳**。

## 五、逻辑层注册器一览

- **`App()`**（`app.js`，全局一次）：`onLaunch` / `onShow` / `onHide` / `onError` / `onUnhandledRejection` / `onPageNotFound` + `globalData`。
- **`Page()`**：生命周期 `onLoad(query)` → `onShow` → `onReady` → `onHide` → `onUnload`；页面事件 `onPullDownRefresh` / `onReachBottom` / `onShareAppMessage` / `onPageScroll` / `onTitleClick`（点击标题，支付宝特色）/ `onTabItemTap`。
- **`Component()`**：传统写法用 **`props`**（而非微信 `properties`）+ `didMount` / `didUpdate` / `didUnmount`；新版可用 `lifetimes`（`created` / `attached` / `ready` / `detached`，命名向微信靠拢，需较高基础库版本并在 `options` 开启）。组件写法差异详见[对比微信小程序](./vs-wechat)。

```javascript
// 组件：支付宝传统写法用 props + didMount（对比微信 properties + lifetimes.attached）
Component({
  props: { title: 'default' },
  data: {},
  didMount() {},
  didUpdate(prevProps, prevData) {},
  didUnmount() {},
  methods: { onTapBtn() {} },
})
```

> 下一步：把 `my.getAuthCode` 授权、`my.tradePay` 支付串成完整业务闭环，见[登录与支付](./login-pay)。
