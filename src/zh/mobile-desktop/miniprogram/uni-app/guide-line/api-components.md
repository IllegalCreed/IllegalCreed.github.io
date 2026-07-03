---
layout: doc
outline: [2, 3]
---

# uni-app API 与组件

> 基于 uni-app 5.x（uni-app x）· 核于 2026-07

## 速查

- **统一 API**：小程序 `wx.*` → **`uni.*`**（基于 ECMAScript 扩展 `uni` 对象，命名与小程序兼容），一份代码跨端
- **路由/页面栈**：`uni.navigateTo`（压栈）｜ `uni.redirectTo`（替换）｜ `uni.reLaunch`（重启到某页）｜ `uni.switchTab`（切 tab）｜ `uni.navigateBack`（返回）
- **交互**：`uni.showToast` / `uni.showModal` / `uni.showLoading`+`hideLoading` / `uni.showActionSheet`
- **网络**：`uni.request` / `uni.uploadFile` / `uni.downloadFile` / `uni.connectSocket`（WebSocket）；**不传 `success` 回调（Vue3）返回 Promise**
- **存储**：`uni.setStorage`/`getStorage`/`removeStorage`/`clearStorage`（都有 `...Sync` 同步版）
- **组件走小程序系**：`view`/`scroll-view`/`swiper`（容器）、`text`/`rich-text`（文本）、`image`/`video`（媒体）、`button`/`input`/`picker`（表单）、`navigator`（导航）；**不用 `div`/`span`**
- **easycom**：`components/组件名/组件名.vue` → 模板**直接用、免 import/注册**，打包按需摇树；正则自定义走 `pages.json` 的 `easycom.custom`
- **扩展组件 uni-ui**：官方组件库，遵循 easycom；新组件仅走 `uni_modules` 方式分发
- **Vue2/Vue3 差异**：Vue2 老写法异步 API 返回 `[error, data]` 数组；Vue3 用标准 `then/catch`

## 一、uni.* 统一 API

uni-app 把各家小程序的 `wx.*` / `my.*` 前缀**统一成 `uni.*`**，基于 ECMAScript 扩展一个 `uni` 全局对象，命名尽量与小程序保持兼容，从而一份代码跨端调用。架构上**逻辑层与渲染层分离**（避免 JS 计算与渲染争资源），是其性能设计的一部分。

| 分类 | 代表 API |
| --- | --- |
| 网络 | `uni.request`、`uni.uploadFile`、`uni.downloadFile`、`uni.connectSocket`/`sendSocketMessage`（WebSocket） |
| 路由/页面栈 | `uni.navigateTo`（保留栈）、`uni.redirectTo`（替换）、`uni.reLaunch`（重启到某页）、`uni.switchTab`（切 tab）、`uni.navigateBack`（返回） |
| 存储 | `uni.setStorage`/`getStorage`/`removeStorage`/`clearStorage`（含 `...Sync` 同步版） |
| 界面/交互 | `uni.showToast`、`uni.showModal`、`uni.showLoading`/`hideLoading`、`uni.showActionSheet`、导航栏/TabBar 操作 |
| 媒体 | `uni.chooseImage`、`uni.previewImage`、`uni.createVideoContext`、录音/相机等 |
| 位置/设备 | `uni.getLocation`、`uni.getSystemInfo(Sync)`、加速度/罗盘、蓝牙、`uni.makePhoneCall`、剪贴板 |
| 文件 | `uni.getFileSystemManager`、保存/删除 |

```js
// 回调写法
uni.request({
  url: 'https://example.com/api',
  method: 'GET',
  success: (res) => { console.log(res.data) },
  fail: (err) => { console.error(err) }
})

// Vue3：不传 success 回调则返回 Promise
const res = await uni.request({ url: 'https://example.com/api' })
console.log(res.data)
```

> **Vue2/Vue3 差异**：Vue2 时代异步 API 的 Promise 化返回 `[error, data]` 数组（需 `const [err, res] = await ...`）；**Vue3 用标准 `then/catch`**，直接拿返回值。写跨版本代码别混。

### 路由 API 怎么选

| API | 行为 | 适用 |
| --- | --- | --- |
| `uni.navigateTo` | 保留当前页、压入新页 | 普通跳转，可返回 |
| `uni.redirectTo` | 关闭当前页、打开新页 | 替换当前页（如登录后进主页） |
| `uni.reLaunch` | 关闭所有页、打开某页 | 重置页面栈 |
| `uni.switchTab` | 跳到 tabBar 页并关闭非 tabBar 页 | 切换底部 tab |
| `uni.navigateBack` | 返回上一页（或多页） | 返回 |

> 跳转 tabBar 里的页面必须用 `uni.switchTab`，用 `navigateTo` 会失败。

## 二、内置组件（对齐小程序，跨端一致）

不用 HTML 的 `div`/`span`/`img`，改用小程序系组件：

| 分类 | 组件 |
| --- | --- |
| 视图容器 | `view`、`scroll-view`、`swiper`、`match-media`、`movable-area`/`movable-view`、`cover-view`/`cover-image` |
| 基础内容 | `text`、`rich-text`、`icon`、`progress` |
| 表单 | `button`、`input`、`textarea`、`checkbox`、`radio`、`picker`/`picker-view`、`slider`、`switch`、`form`、`label`、`editor` |
| 导航 | `navigator` |
| 媒体 | `image`、`video`、`audio`、`camera`、`live-player`/`live-pusher` |
| 特殊 | `map`、`canvas`、`web-view`、`ad`/`ad-draw` |
| 页面配置类 | `navigation-bar`、`page-meta`、`custom-tab-bar`、`unicloud-db` |

```vue
<template>
  <view class="list">
    <scroll-view scroll-y class="scroller">
      <view v-for="item in items" :key="item.id" class="row">
        <image :src="item.avatar" mode="aspectFill" />
        <text>{{ item.name }}</text>
      </view>
    </scroll-view>
    <button type="primary" @click="add">新增</button>
  </view>
</template>
```

要点：

- **尺寸单位常用 `rpx`**（响应式像素，750rpx = 屏宽），跨屏自适应；也可用 `px`。
- `image` 的 `mode` 控制裁剪/缩放（`aspectFill`/`aspectFit`/`widthFix` 等）。
- 组件事件绑定用 Vue 的 `@click`（等价小程序 `bindtap`）。

## 三、easycom：组件免注册自动引入

约定优于配置：只要组件放在 **`components/组件名/组件名.vue`**（如 `components/uni-badge/uni-badge.vue`），就能在任意页面模板里**直接 `<uni-badge>` 使用，无需 import、无需在 `components` 里注册**，打包时按需摇树、不引入未使用组件。

```vue
<template>
  <!-- 无需 import，直接用 -->
  <uni-badge text="12" type="error" />
  <my-card title="标题" />
</template>
```

- 自定义规则：在 `pages.json` 的 `easycom.custom` 用正则映射，可覆盖 `node_modules` / `uni_modules` 里的库：

```json
{
  "easycom": {
    "autoscan": true,
    "custom": { "^uni-(.*)": "@/components/uni-$1/uni-$1.vue" }
  }
}
```

### 扩展组件库

- **uni-ui**：DCloud 官方组件库，遵循 easycom 规范；新组件现仅走 **`uni_modules`** 方式分发（从[插件市场](https://ext.dcloud.net.cn/)安装到 `uni_modules/`）。
- 生态里还有大量第三方 Vue3 + `uni_modules` 组件库（如 `wot-design-uni`、`sard-uniapp` 等），支持暗黑/主题/i18n 的居多。插件市场生态庞大，但官方无稳定的公开总量统计，选型以是否标注**兼容 uni-app x**、是否活跃维护为准。

配置文件（`pages.json` 的 `easycom` 等）见[工程配置](./project-config)；生命周期钩子从哪 import 见[生命周期](./lifecycle)。
