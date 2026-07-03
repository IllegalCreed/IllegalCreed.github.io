---
layout: doc
outline: [2, 3]
---

# 生命周期、API 与事件

> 基于微信小程序（基础库 3.x）· 核于 2026-07

## 速查

- **三大构造器**：`App({})`(全局唯一) / `Page({})`(页面) / `Component({})`(自定义组件，也可写页面)
- **App 生命周期**：`onLaunch`(全局一次) → `onShow` → `onHide`；另有 `onError` / `onPageNotFound` / `onThemeChange`
- **Page 生命周期顺序**：`onLoad(query)`(仅一次，拿路由参数) → `onShow` → `onReady`(首次渲染完成，仅一次) → [`onHide` ↔ `onShow` 反复] → `onUnload`；另有 `onPullDownRefresh`/`onReachBottom`/`onShareAppMessage`/`onPageScroll`
- **Component 生命周期**：`lifetimes`: `created`(不能 setData)→`attached`(最常用初始化)→`ready`→`detached`；`pageLifetimes`: `show`/`hide`/`resize`
- **全局工具**：`getApp()` 拿 App 实例读 `globalData`；`getCurrentPages()` 拿页面栈（栈顶＝当前页）
- **路由**：`wx.navigateTo`(压栈**≤10层**) / `wx.redirectTo`(替换) / `wx.switchTab`(tab页) / `wx.navigateBack({delta})` / `wx.reLaunch`；**tabBar 页必在主包**且不能 `navigateTo`
- **事件**：`bindtap`(冒泡) / `catchtap`(阻止冒泡) / `capture-bind`/`capture-catch`(捕获)；传参用 `data-*` → `e.currentTarget.dataset`；表单值 `e.detail.value`；`target`(触发源) vs `currentTarget`(绑定者)
- **常用 API**：`wx.request`(网络) / `wx.setStorageSync`(存储) / `wx.showToast`·`wx.showModal`(交互) / `wx.createSelectorQuery`(查节点)；能力检测 `wx.canIUse('api.method')`
- **模块化**：CommonJS(`module.exports`/`require`)；跨页共享用 `globalData` / Storage / 状态库

## 一、三大注册构造器

小程序的逻辑层由三个全局构造器组织：

| 构造器 | 作用 | 关键生命周期 |
| --- | --- | --- |
| `App({})` | 注册小程序（全局唯一） | `onLaunch`(初始化，全局一次)、`onShow`、`onHide`、`onError`、`onPageNotFound`、`onThemeChange` |
| `Page({})` | 注册页面 | `onLoad(query)`、`onShow`、`onReady`、`onHide`、`onUnload`；+ `onPullDownRefresh`/`onReachBottom`/`onShareAppMessage`/`onPageScroll` |
| `Component({})` | 注册自定义组件（也可写页面） | `lifetimes`: `created`/`attached`/`ready`/`moved`/`detached`；`pageLifetimes`: `show`/`hide`/`resize` |

## 二、页面生命周期与顺序

页面生命周期的顺序是高频考点：

```text
onLoad(query)  →  onShow  →  onReady  →  [ onHide ⇄ onShow ]*  →  onUnload
  仅一次           每次显示    仅一次        切后台/回前台反复         页面销毁
 (拿路由参数)                (首次渲染完成)
```

- **`onLoad(query)`**：仅触发一次，参数 `query` 是路由携带的参数（如 `?id=1`），页面初始化数据在此拿。
- **`onShow`**：每次页面显示都触发（含从后台返回）。
- **`onReady`**：首次渲染完成、仅一次；此后才能安全地用 `createSelectorQuery` 查节点布局。
- **`onHide` / `onUnload`**：切后台 / 页面被销毁。
- **交互扩展**：`onPullDownRefresh`（下拉刷新）、`onReachBottom`（触底加载）、`onShareAppMessage`（转发）、`onPageScroll`（滚动）。

**全局工具**：`getApp()` 拿到 `App` 实例读写 `globalData`；`getCurrentPages()` 拿页面栈数组（**栈顶是当前页**）。

## 三、Component 生命周期与通信

自定义组件用 `Component({})` 注册，生命周期放在 `lifetimes` 里：

- `created`（实例创建，**还不能 `setData`**）→ `attached`（进入节点树，**最常用做初始化**）→ `ready`（布局完成）→ `detached`（移除）。
- `pageLifetimes`：监听所在页面的 `show` / `hide` / `resize`。

组件通信三种方式：

```javascript
// 子组件：向父抛事件
Component({
  properties: { title: { type: String, value: '' } },  // 父→子：properties
  methods: {
    onTap() {
      this.triggerEvent('myevent', { id: 1 })            // 子→父：triggerEvent
    },
  },
})
```

- **父 → 子**：`properties` 传值（`{ type, value, observer }`）。
- **子 → 父**：`this.triggerEvent('myevent', detail)`，父用 `bind:myevent` 监听、`e.detail` 取数据。
- **父直接调子**：`this.selectComponent('#id')` 拿组件实例。
- 其他：`observers`（数据监听器）、`behaviors`（类 mixin 复用）、`slot` 插槽（多插槽需 `options: { multipleSlots: true }`）、`styleIsolation`（样式隔离）。

## 四、路由与页面栈

页面跳转即页面栈的压 / 出栈操作：

| API | 行为 | 要点 |
| --- | --- | --- |
| `wx.navigateTo` | 保留当前页、压栈进新页 | **页面栈最多 10 层** |
| `wx.redirectTo` | 关闭当前页、替换为新页 | 不压栈 |
| `wx.switchTab` | 跳转 tabBar 页 | 关闭所有非 tabBar 页 |
| `wx.navigateBack` | 出栈返回 | `{ delta }` 返回层数 |
| `wx.reLaunch` | 关闭所有页面打开某页 | 重置栈 |

- **tabBar 页面必须在主包**，且**不能用 `navigateTo` / `redirectTo` 跳转**，只能 `switchTab`。
- 页面间传参：`navigateTo({ url: 'pages/detail?id=1' })`，目标页 `onLoad(query)` 里 `query.id` 取。

## 五、数据绑定与事件系统

数据绑定用 Mustache 双花括号（详见[四文件与 WXS](./four-files)）；**事件系统**是本节重点。绑定方式决定冒泡行为，传参靠 `data-*`：

```html
<!-- bind* 冒泡；catch* 阻止冒泡；传参用 data-* -->
<button bindtap="onTap" data-id="{{ item.id }}">删除</button>
<view catchtap="onCatch">点我不会冒泡到父级</view>
```

```javascript
Page({
  onTap(e) {
    const id = e.currentTarget.dataset.id  // data-* 从 dataset 读
    // e.target      = 触发事件的源组件
    // e.currentTarget = 绑定事件的当前组件
  },
})
```

- **绑定**：`bindtap`（或 `bind:tap`）**冒泡**；`catchtap` **阻止冒泡**；`capture-bind` / `capture-catch` 走**捕获**阶段。
- **常用事件**：`tap`（点击）、`longpress`、`touchstart/move/end`、`input`、`change`、`submit`、`scroll`。
- **传参**：用 `data-*` 自定义属性，处理函数中 `e.currentTarget.dataset.xxx` 读取；表单值走 `e.detail.value`。
- **`target` vs `currentTarget`**（高频考点）：`target` 是**真正触发**事件的源组件，`currentTarget` 是**绑定**该事件的组件——事件冒泡时二者可能不同。

## 六、rpx 与样式适配（简）

界面尺寸单位首选 **`rpx`**——**规定屏幕宽 = 750rpx**，按屏宽等比缩放（iPhone6 下 1rpx = 0.5px），做多机型自适应最省心（完整说明见[四文件与 WXS](./four-files)）：

```css
.banner { width: 750rpx; height: 300rpx; } /* 占满屏宽、高度按比例 */
```

## 七、常用 wx.* API 速览

`wx.*` 是逻辑层调用平台能力的入口，按类别记：

- **网络**：`wx.request`（HTTPS）、`wx.uploadFile` / `wx.downloadFile`、`wx.connectSocket`（WebSocket）——**须配域名白名单**（详见[登录与支付](./login-pay)与[参考](../reference)）。
- **存储**：`wx.setStorage` / `wx.getStorage`（异步）与 `wx.setStorageSync` / `wx.getStorageSync`（同步）——**单 key 上限约 1MB、单个小程序总上限约 10MB**，适合存登录态 token 与少量缓存。
- **界面 / 交互**：`wx.showToast` / `wx.showModal` / `wx.showLoading` / `wx.showActionSheet`、`wx.setNavigationBarTitle`。
- **节点查询**：`wx.createSelectorQuery`（查节点尺寸 / 位置）、`wx.createIntersectionObserver`（曝光监听）。
- **能力检测**：不同用户微信版本对应不同基础库，用 **`wx.canIUse('api.method')`** 做特性检测，避免在低版本调用不存在的 API。

## 八、模块化与跨页共享

- **模块化走 CommonJS**：`module.exports` / `require()`，每个文件是独立作用域模块。
- **没有 `window` 全局共享**：跨页共享数据用 `App` 的 `globalData`、`wx.setStorageSync` 持久化，或状态库（如 `mobx-miniprogram`）。

> 下一步：突破包体积用分包、上 Serverless 用云开发，见 [分包与云开发](./subpackage-cloud)。
