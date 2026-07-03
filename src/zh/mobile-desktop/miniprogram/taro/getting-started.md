---
layout: doc
outline: [2, 3]
---

# 入门：Taro 是什么与怎么起步

> 基于 Taro 4.x · 核于 2026-07

## 速查

- **一句话**：京东·凹凸实验室开源的**多端统一开发框架**，写一套代码编译到「各家小程序 + H5 + React Native + 纯血鸿蒙」；组件/API/路由/配置**对齐微信小程序规范**
- **主打 React、兼 Vue3**：写真正的 React（JSX + Hooks）或 Vue3 组件，配 Taro 内置组件 + `Taro.*` API；这与「Vue 系为主」的 **uni-app** 形成「双雄」分野（详见 [Taro vs uni-app](./guide-line/vs-uni-app)）
- **支持端**：微信/支付宝/抖音/百度/QQ/京东等 **10+ 小程序** + **H5** + **React Native** + **纯血鸿蒙**（C-API）
- **环境**：Node **>= 16.20.0**（推荐 nvm；Windows 部分特性用 Rust，需装 VC++ Redist）
- **起步**：`npm i -g @tarojs/cli` → `taro init myApp`（交互选框架 React/Vue3 + 模板）→ `yarn dev:weapp` / `yarn build:weapp`
- **命令范式**：`taro build --type weapp|h5|rn|harmony|harmony_cpp [--watch]`；`dev` = 带 `--watch`；**CLI 版本必须与项目依赖版本一致**
- **版本坐标**：Taro **4.x**，最新稳定 **v4.1.8（2025-11-06）**；编译内核 webpack4/5 或 **Vite**（自 v4.0）
- **进阶顺序**：先读[开发模型](./guide-line/react-model)吃透组件与 `Taro.*` → 再读[页面 Hooks 与路由](./guide-line/hooks-router)与[工程与构建配置](./guide-line/build-config)

## 一、Taro 解决什么问题

国内小程序生态高度碎片化：微信、支付宝、抖音、百度、QQ、京东……各家有各家的 DSL、组件名、API 命名与构建方式。**Taro 要回答的是：能不能写一套代码，同时产出所有小程序 + H5 + App，而不必为每家重写一遍？**

它的答案是——**遵循微信小程序规范做统一**：组件名（`View`/`Text`）、API 名（`Taro.request`）、路由与配置都对齐微信小程序 DSL，其它端由 Taro 做适配层抹平差异。于是你只维护一份业务代码，`taro build --type` 换个目标端就能编译出对应产物。

Taro 由**京东·凹凸实验室（O2 Team / NervJS）**开源，仓库约 37k+ star，是国内跨端小程序框架的主力之一。

## 二、与 uni-app 的核心分野

同类框架里最常被拿来对比的是 **uni-app**。一句话记住：

- **Taro＝React 系为主**（首选 React，也支持 Vue3）；
- **uni-app＝Vue 系为主**（基于 Vue 单文件组件 + 微信小程序式模板）。

二者都能跨小程序 + H5 + App，是国内跨端「双雄」。选型取舍详见 [Taro vs uni-app](./guide-line/vs-uni-app)。

## 三、支持哪些端

一套代码，`--type` 切换即可编译到：

- **小程序全家桶**：微信 `weapp`、京东 `jd`、百度 `swan`、支付宝 `alipay`、字节/抖音 `tt`、QQ `qq`、钉钉 `dd`、企业微信、飞书 `lark`、快手等 **10+ 家**。
- **H5**（Web）。
- **React Native**（`rn`，自 Taro 3.2 起）。
- **纯血鸿蒙 HarmonyOS NEXT**（`harmony_cpp` / C-API，自 v4.1.0 起）——2026 年最大亮点，详见[纯血鸿蒙三路线](./guide-line/harmony)。

## 四、怎么起步：用 CLI

Taro 通过全局 CLI 脚手架起步。**注意 Node 要求 >= 16.20.0**（推荐用 nvm 管理；结合 4.x/Vite 生态，实际建议 18/20 LTS）。

```bash
# 1. 安装 CLI（或用 npx @tarojs/cli init 免全局安装）
npm i -g @tarojs/cli

# 2. 初始化项目：交互式选择框架（React / Vue3 / ...）与模板（default / NutUI ...）
taro init myApp

# 3. 进入目录，按目标端 dev / build（package.json 已生成脚本）
cd myApp
yarn dev:weapp      # 微信小程序（开发，带 watch）
yarn build:weapp    # 微信小程序（生产，压缩）
yarn dev:h5         # H5
yarn dev:alipay     # 支付宝小程序（还有 :swan / :tt / :qq / :jd ...）
```

底层命令是统一的 `taro build`：

```bash
taro build --type weapp --watch    # 等价于 dev:weapp
taro build --type h5               # 等价于 build:h5（不带 watch，压缩）
taro build --type harmony_cpp      # 纯血鸿蒙 C-API（仅支持 Vite）
```

- **`dev` = `build --watch`**；`build` 去掉 `--watch` 并开启压缩；开发态想压缩需 `NODE_ENV=production`。
- ⚠️ **CLI 版本必须与项目依赖版本一致**，否则编译报错——升级时全局 CLI 与 `package.json` 里的 `@tarojs/*` 要一起对齐。

## 五、一个最小页面长什么样

以 React 为例，页面就是一个真正的 React 组件，只是标签换成 Taro 内置组件：

```tsx
// src/pages/index/index.tsx —— React 写法
import { View, Text } from '@tarojs/components'
import { useLoad } from '@tarojs/taro'
import { useState } from 'react'

export default function Index() {
  const [count, setCount] = useState(0)
  useLoad(() => {
    console.log('页面 onLoad') // 页面生命周期 Hook 从 @tarojs/taro 导入
  })
  return (
    <View className="index">
      <Text onClick={() => setCount(count + 1)}>点击 {count} 次</Text>
    </View>
  )
}
```

- 内置组件**首字母大写（PascalCase）**、React 里**必须显式 import**；事件用 **`on` 前缀 + 驼峰**（`onClick`）。
- 框架 Hooks（`useState`）从 `react` 导入；**页面生命周期 Hooks（`useLoad`）从 `@tarojs/taro` 导入**。
- 组件与 API 细节见[开发模型](./guide-line/react-model)，Hooks 与路由见[页面 Hooks 与路由](./guide-line/hooks-router)。

## 六、心智地图：接下来读什么

- 想会写页面 → [开发模型：React（也支持 Vue3）](./guide-line/react-model)（内置组件 + `Taro.*` API）+ [页面 Hooks 与路由](./guide-line/hooks-router)。
- 想搞懂「Taro 底层怎么变的、为什么这么设计」→ [架构演进：编译时到运行时](./guide-line/architecture)。
- 想上纯血鸿蒙 → [纯血鸿蒙三路线](./guide-line/harmony)（三条路线严禁混）。
- 想配好工程与构建 → [工程与构建配置](./guide-line/build-config)（CLI / `app.config.ts` / `config/index.ts` / Vite / CompileMode）。
- 速记表在 [参考](./reference)。
