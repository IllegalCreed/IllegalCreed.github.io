---
layout: doc
outline: [2, 3]
---

# uni-app 生命周期

> 基于 uni-app 5.x（uni-app x）· 核于 2026-07

## 速查

- **三类生命周期，别搞混来源**：
  - **组件周期**：`onMounted`/`onUnmounted`/`onUpdated` 等，从 **`vue`** 引入（就是标准 Vue）
  - **页面周期**：`onLoad`/`onShow`/`onReady`/`onHide`/`onUnload`/`onPullDownRefresh`/`onReachBottom`/`onShareAppMessage`，**从 `@dcloudio/uni-app` 引入（不是 Vue 的！）**
  - **应用周期**：`onLaunch`/`onShow`/`onHide`，**写在 `App.vue`**
- **`onLoad(options)`** 拿路由参数（`navigateTo` 传来的 query）；**`onReady`** 首次渲染完成（可安全操作节点）
- **`onShow` 有两层含义**：应用级（`App.vue`，App/小程序切前台）与页面级（页面每次显示）**不同**，别混
- **下拉刷新** `onPullDownRefresh` 需 `pages.json` 页面 `enablePullDownRefresh: true`；结束调用 `uni.stopPullDownRefresh()`
- **Vue3 支持**：全端支持（HBuilderX 3.3.3+）；**暂不支持 `Teleport`/`Suspense`**，部分修饰符（`.prevent`/`.capture`）仅 H5 生效
- **选项式写法**：Vue2 或 Vue3 选项式里，页面周期直接作为 `export default {}` 的同级方法（`onLoad(){}`）；组合式则从 `@dcloudio/uni-app` import

## 一、三类生命周期总览

uni-app 的生命周期分三层，最容易踩的坑是**页面周期不是 Vue 的**：

| 类别 | 代表钩子 | 来源 | 写在哪 |
| --- | --- | --- | --- |
| **组件周期** | `onMounted`、`onUnmounted`、`onUpdated`、`onBeforeMount`… | `import { ... } from 'vue'` | 组件 `setup` |
| **页面周期** | `onLoad`、`onShow`、`onReady`、`onHide`、`onUnload`、`onPullDownRefresh`、`onReachBottom`、`onShareAppMessage`… | **`import { ... } from '@dcloudio/uni-app'`** | 页面组件 `setup` |
| **应用周期** | `onLaunch`、`onShow`、`onHide` | 写在 `App.vue` | 应用入口 |

## 二、页面生命周期（重点·最易错）

页面周期钩子**必须从 `@dcloudio/uni-app` 引入**（组合式 API），它们是 uni-app 的页面级钩子，不是 Vue 内置的：

```vue
<script setup>
import { ref } from 'vue'
import { onLoad, onShow, onReady, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app'
import { onMounted } from 'vue' // 组件周期仍来自 vue

const list = ref([])

onLoad((options) => {
  // 页面加载，拿到路由参数（如 navigateTo 传来的 ?id=1）
  console.log('id =', options.id)
})

onShow(() => { /* 页面每次显示（含从后台/其他页返回） */ })

onReady(() => { /* 页面首次渲染完成，可安全操作节点 */ })

onPullDownRefresh(async () => {
  await refresh()
  uni.stopPullDownRefresh() // 结束下拉刷新动画
})

onReachBottom(() => { /* 触底，加载下一页 */ })

onMounted(() => { /* 组件挂载（Vue 的） */ })
</script>
```

常用页面钩子：

| 钩子 | 触发时机 |
| --- | --- |
| `onLoad(options)` | 页面加载，**参数 `options` 是路由 query** |
| `onShow` | 页面每次显示（首次 + 从后台/其他页返回） |
| `onReady` | 页面**首次渲染完成**（可操作节点、`createSelectorQuery`） |
| `onHide` | 页面隐藏（跳走但未销毁） |
| `onUnload` | 页面卸载（返回销毁） |
| `onPullDownRefresh` | 下拉刷新（需 `pages.json` 开 `enablePullDownRefresh`） |
| `onReachBottom` | 滚动触底（配 `onReachBottomDistance`） |
| `onShareAppMessage` | 用户点转发（小程序） |

> `onLoad` 只在页面创建时触发一次并携带参数；`onShow` 每次显示都触发但不带路由参数——需要参数用 `onLoad`。

## 三、应用生命周期（写在 App.vue）

应用级钩子写在 `App.vue`，管**整个应用**的启动与前后台切换：

```vue
<!-- App.vue -->
<script>
export default {
  onLaunch() {
    // 应用初始化（全局只触发一次）：读缓存、初始化 SDK
  },
  onShow() {
    // 应用切到前台
  },
  onHide() {
    // 应用切到后台
  }
}
</script>

<style>
/* 全局样式写在 App.vue */
</style>
```

> **`onShow` 的两层含义**：`App.vue` 里的 `onShow` 是**应用**切前台；页面里的 `onShow` 是**页面**每次显示——同名但语义不同，别混。

## 四、组件生命周期（就是 Vue）

组件周期与标准 Vue 完全一致，从 `vue` 引入：

- Vue3 组合式：`onMounted` / `onUnmounted` / `onUpdated` / `onBeforeMount`…
- Vue2 / 选项式：`created` / `mounted` / `destroyed`…

## 五、Vue3 支持与差异

- uni-app **全端支持 Vue3**（HBuilderX 3.3.3+），响应式基于 `Proxy`。
- **暂不支持 `Teleport` / `Suspense`**；部分事件修饰符（`.prevent` / `.capture`）**仅 H5 生效**。
- 选项式写法里页面周期作为 `export default {}` 的同级方法（`onLoad(){}` / `onShow(){}`），无需 import；组合式则从 `@dcloudio/uni-app` 引入。

组件与 API 的用法见 [API 与组件](./api-components)；`enablePullDownRefresh` 等页面配置见[工程配置](./project-config)。
