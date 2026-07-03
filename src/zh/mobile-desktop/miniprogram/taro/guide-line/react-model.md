---
layout: doc
outline: [2, 3]
---

# 开发模型：React（也支持 Vue3）

> 基于 Taro 4.x · 核于 2026-07

## 速查

- **写真组件**：Taro 3+ 跑**真正的 React/Vue 运行时**，你写的就是标准 React（JSX + Hooks）或 Vue3 组件——不是私有 DSL（原理见[架构演进](./architecture)）
- **主打 React**：JSX + Hooks；**自 v3.5 起默认 React 18**（legacy 模式），并发模式要显式开 `['@tarojs/plugin-framework-react', { reactMode: 'concurrent' }]`；Taro v3.4+ 用 React 需装 `@tarojs/plugin-framework-react`
- **也支持 Vue3**：`createApp`；JSX 需 v3.4.5+（H5）；**`scoped` 样式在小程序端不支持**（用 CSS Modules）；`v-model` 对非 HTML 表单组件（如 Picker）不兼容
- **内置组件**（`@tarojs/components`）：**PascalCase**（`View`/`Text`/`Image`/`ScrollView`/`Button`/`Swiper`）；**React 必须显式 import**，**Vue 模板直接用小写标签**（`<view>`，无需 import）
- **事件**：用 **`on` 前缀 + 驼峰**（`onClick`/`onScroll`/`onTouchstart`），取代小程序原生 `bind`；函数型 props 必须 `on` 前缀；防滚动穿透用 `<View catchMove />`
- **`Taro.*` API**（`@tarojs/taro`）：网络/路由/存储/UI/设备/媒体/支付等；**默认对小程序异步 API 做了 `promisify`**——可直接 `await`；用 `Taro.canIUse` 查各端支持度
- **统一策略**：把各端差异 API 收敛到微信规范（支付宝 `my.alert` → `Taro.showModal`）；未适配能力可回退端命名空间（`my`/`swan`/`tt`）

## 一、你写的是「真组件」

自 Taro 3 起，Taro **不再是私有 DSL**，而是直接运行**真正的 React/Vue/Preact 运行时**（原理见[架构演进：编译时到运行时](./architecture)）。这意味着：你会 React 就会 Taro 的 React 写法，会 Vue3 就会 Taro 的 Vue 写法，`useState`/`useEffect`/`ref`/`computed` 等框架能力全都是标准的。

差异只集中在三处：**用 Taro 内置组件替代 HTML 标签**、**用 `Taro.*` 替代 `wx.*` 之类端 API**、**页面生命周期改用 Taro Hooks**（后者见[页面 Hooks 与路由](./hooks-router)）。

## 二、内置组件（`@tarojs/components`）

Taro 提供一套**对齐小程序原生组件语义**的内置组件，**首字母大写（PascalCase）**：`View / Text / Image / Button / ScrollView / Input / Swiper / SwiperItem / Icon / Map / Video / Canvas` 等。

- **React 必须显式 `import`**；**Vue 模板中直接用小写标签**（`<view>` / `<text>`，无需 import）。
- 事件用 **`on` 前缀 + 驼峰**（`onClick` / `onScroll` / `onTouchstart`），取代小程序原生的 `bind` 前缀。
- 防止滚动穿透用 **`catchMove`** 属性：`<View catchMove />`。

```tsx
// React：内置组件需 import，PascalCase，on 前缀事件
import { View, Text, Swiper, SwiperItem } from '@tarojs/components'

function Banner() {
  return (
    <Swiper autoplay interval={1000} onClick={() => console.log('tap')}>
      <SwiperItem>
        <View className="slide"><Text>第一屏</Text></View>
      </SwiperItem>
    </Swiper>
  )
}
```

## 三、`Taro.*` API（`@tarojs/taro`）

统一的跨端 API 挂在 `Taro` 命名空间下，覆盖：网络 `Taro.request`、路由 `Taro.navigateTo/redirectTo/switchTab/navigateBack`、存储 `Taro.getStorageSync/setStorageSync`、UI `Taro.showToast/showModal`、以及设备、媒体、定位、文件、支付、Canvas、Worker、云开发等。

- **默认对小程序异步 API 做了 `promisify`**——可直接 `.then()` / `await`，不必再包 `success`/`fail` 回调：

```ts
import Taro from '@tarojs/taro'

async function load() {
  const res = await Taro.request({ url: 'https://api.example.com/list' })
  Taro.showToast({ title: '加载完成' })
  return res.data
}
```

- **统一策略**：Taro 把各端差异 API 收敛到微信小程序规范（如支付宝 `my.alert` → `Taro.showModal`）。未被 Taro 适配的端能力，可先 `Taro.xxx` 试调，或回退到端命名空间（`my` / `swan` / `tt`）自行处理。
- **`Taro.canIUse` / CanIUse 站点**：查询某 API 或组件在各端的支持度，写跨端逻辑时用于分支降级。

## 四、也支持 Vue3

Taro 同时支持 Vue3（以及 Vue2），入口用 `createApp`。Vue 模板里内置组件**直接用小写标签、无需 import**：

```vue
<!-- Vue3：模板直接用小写标签，插值语法在围栏代码块内是安全的 -->
<template>
  <view class="index">
    <text @tap="count++">点击 {{ count }} 次</text>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
const count = ref(0)
</script>
```

Vue3 使用时的关键约束：

- **JSX 需 Taro v3.4.5+**（H5 场景）。
- **`scoped` 样式在小程序端不支持**——改用 **CSS Modules** 做样式隔离。
- **`v-model` 对非 HTML 表单组件（如 Picker）不兼容**，需手动绑 value + 事件。
- Vue3 的 Proxy 实现**不支持 iOS9 及以下**。

## 五、React 版本与插件

- **自 Taro v3.5 起默认 React 18**（默认 **legacy 模式**）；想开并发模式，显式配置：

```ts
// config/index.ts 的 plugins
plugins: [
  ['@tarojs/plugin-framework-react', { reactMode: 'concurrent' }],
]
```

- 想继续用 React 17，则在 `package.json` 把 `react`/`react-dom` 降到 `^17`。
- **Taro v3.4+ 用 React 需安装 `@tarojs/plugin-framework-react`**（升级老项目时容易漏）。

## 六、写法约束（对齐小程序的坑）

因为最终要落到小程序，一些写法有硬约束（完整清单见[参考·易错点](../reference)）：

- **函数型 props 必须 `on` 前缀**（对齐小程序事件系统）。
- 模板数据用 **`null` 而非 `undefined`**；勿用 `id` / `class` / `style` 作自定义组件属性名；`state` 与 `props` 勿重名。
- 未被编译期识别的属性用 **`defaultProps`** 初始化，否则可能取不到。
- **`useEffect` / `componentDidMount` 拿不到渲染层节点** → 需要在 `useReady` + `createSelectorQuery` 里取（见[页面 Hooks 与路由](./hooks-router)）。
- **不支持 `React.lazy`**（小程序没有动态 `import`）。
- 环境变量用整体 `process.env.NODE_ENV`（**勿解构**，编译期按整体字符串替换）。
