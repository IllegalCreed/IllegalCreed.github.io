---
layout: doc
outline: [2, 3]
---

# 页面 Hooks 与路由

> 基于 Taro 4.x · 核于 2026-07

## 速查

- **两类 Hooks 分开导**：框架 Hooks（`useState`/`useEffect`）从 **`react`** 导入；**页面/App 生命周期 Hooks 从 `@tarojs/taro` 导入**
- **`useRouter()`**：取当前路由 `{ path, params }`（= 类组件 `getCurrentInstance().router`），读页面跳转带来的参数
- **`useLoad(cb)`** = `onLoad`（**v3.5.0+**）：页面加载，此时**可拿路由参数**
- **`useReady(cb)`** = `onReady`：渲染完成后触发，**只有到这里才能** `createSelectorQuery` 取渲染层节点（`useEffect` / `componentDidMount` 拿不到）
- **常用页面 Hooks**：`useDidShow`/`useDidHide`（前后台）、`usePullDownRefresh`（下拉刷新）、`useReachBottom`（触底）、`usePageScroll`（滚动带 `scrollTop`）、`useShareAppMessage`/`useShareTimeline`（分享）
- **App 级**：`useLaunch` / `useError` / `usePageNotFound`
- **路由**：页面路径在 **`app.config.ts` 的 `pages` 数组**声明（决定路由与首页）；跳转用 `Taro.navigateTo` / `redirectTo` / `switchTab`（tabBar 页）/ `navigateBack`
- **传参**：`navigateTo({ url: 'pages/detail/index?id=1' })`，目标页用 `useRouter().params.id` 读取

## 一、两类 Hooks，分开导入

Taro 里 Hooks 有两个来源，**别搞混**：

- **框架能力 Hooks**（状态/副作用等）来自你所用框架：React 用 `useState` / `useEffect` / `useMemo`，从 **`react`** 导入。
- **页面/App 生命周期 Hooks**（对应小程序 `onLoad` / `onReady` 等）来自 **`@tarojs/taro`**。

```ts
import { useState, useEffect } from 'react'          // 框架 Hooks
import { useRouter, useLoad, useReady } from '@tarojs/taro'  // 页面生命周期 Hooks
```

## 二、页面生命周期 Hooks 全清单

| Hook | 对应小程序生命周期 | 说明 |
| --- | --- | --- |
| `useRouter()` | — | 取当前路由 `{ path, params }`（= `getCurrentInstance().router`） |
| `useLoad(cb)` | `onLoad` | 页面加载（**v3.5.0+**），此时可拿路由参数 |
| `useReady(cb)` | `onReady` | 渲染完成，**才能** `createSelectorQuery` 取渲染层节点 |
| `useDidShow(cb)` | `componentDidShow` | 页面显示 / 切前台 |
| `useDidHide(cb)` | `componentDidHide` | 页面隐藏 / 切后台 |
| `usePullDownRefresh(cb)` | `onPullDownRefresh` | 下拉刷新（需页面配置开启） |
| `useReachBottom(cb)` | `onReachBottom` | 触底加载 |
| `usePageScroll(cb)` | `onPageScroll` | 滚动，回调带 `scrollTop` |
| `useTabItemTap(cb)` | `onTabItemTap` | 点 tab，回调带 `index`/`pagePath`/`text` |
| `useShareAppMessage` / `useShareTimeline` | 分享给好友 / 朋友圈 | 需配置开启 |
| `useResize` / `useAddToFavorites` / `useSaveExitState` / `useUnload` | 对应同名生命周期 | — |
| App 级：`useLaunch` / `useError` / `usePageNotFound` | `onLaunch` 等 | 应用级，写在入口组件 |

## 三、`useLoad` vs `useReady`：什么时候能拿到什么

这是最高频的坑：**逻辑层的数据 ≠ 渲染层的节点**。

- **`useLoad`（= `onLoad`）**：页面刚加载，**能拿到路由参数**，适合发起请求、初始化数据。
- **`useReady`（= `onReady`）**：页面**首次渲染完成**后触发，**只有到这里**才能用 `Taro.createSelectorQuery` 拿到渲染层节点尺寸/位置。
- ⚠️ **`useEffect` / `componentDidMount` 拿不到渲染层节点**——它们在逻辑层执行，此刻渲染层可能还没画好。取节点一律用 `useReady` + `createSelectorQuery`。

```ts
import { useRouter, useLoad, useReady } from '@tarojs/taro'
import Taro from '@tarojs/taro'

function Detail() {
  const router = useRouter()               // { path, params }
  useLoad(() => {
    const id = router.params.id            // onLoad 时可读路由参数
    // fetch(id) ...
  })
  useReady(() => {
    // 渲染完成，才能查节点
    Taro.createSelectorQuery()
      .select('#target')
      .boundingClientRect((rect) => console.log(rect))
      .exec()
  })
  return null
}
```

## 四、路由：先在 `app.config.ts` 声明页面

Taro 的路由**对齐小程序**：所有页面路径写进 `app.config.ts` 的 **`pages` 数组**，**数组第一项即首页**。

```ts
// src/app.config.ts
export default defineAppConfig({
  pages: [
    'pages/index/index',   // 数组第一项 = 首页
    'pages/detail/index',
  ],
  window: { navigationBarTitleText: 'Taro' },
})
```

分包用 `subPackages`、tabBar 用 `tabBar`（详见[工程与构建配置](./build-config)）。

## 五、跳转与传参

跳转用 `Taro.*` 路由 API，语义对齐小程序：

| API | 作用 |
| --- | --- |
| `Taro.navigateTo` | 保留当前页，打开新页（可返回） |
| `Taro.redirectTo` | 关闭当前页，打开新页（不可返回到原页） |
| `Taro.switchTab` | 跳到 **tabBar 页**（会关闭所有非 tabBar 页） |
| `Taro.navigateBack` | 返回上一页（`delta` 控制层数） |
| `Taro.reLaunch` | 关闭所有页面，打开某页 |

**传参走 URL query，读参用 `useRouter().params`**：

```ts
import Taro, { useRouter } from '@tarojs/taro'

// A 页：跳转并带参数
Taro.navigateTo({ url: 'pages/detail/index?id=42&from=list' })

// detail 页：读取参数
function Detail() {
  const { params } = useRouter()
  // params.id === '42'，params.from === 'list'（均为字符串）
  return null
}
```

- query 参数取到都是**字符串**，数字需自行 `Number(...)`。
- 复杂对象建议 `JSON.stringify` + `encodeURIComponent` 编码传递，或用全局状态 / 事件通道。
- 想要类型安全的路由，可用社区插件 `tarojs-router-next`。
