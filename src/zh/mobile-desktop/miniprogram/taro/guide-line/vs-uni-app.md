---
layout: doc
outline: [2, 3]
---

# Taro vs uni-app

> 基于 Taro 4.x · 核于 2026-07

## 速查

- **一句话分野**：**Taro = React 系为主**（首选 React，也支持 Vue3）；**uni-app = Vue 系为主**（基于 Vue + 小程序式模板）。二者是国内跨端小程序框架「双雄」
- **心智**：Taro 让你写**真正的 React/Vue 组件**（Taro 3+ 重运行时）；uni-app 让你写 **Vue 单文件组件**，用接近微信小程序的模板语法
- **都能跨**：小程序全家桶 + H5 + App（Taro 的 App 走 React Native；uni-app 走自家原生渲染方案）
- **选型主轴＝团队技术栈**：React 团队选 Taro 更顺手，Vue 团队选 uni-app 更顺手；这是最主要的决策因子
- **Taro 优势**：React 生态复用、多框架灵活（React/Vue3/Preact）、**纯血鸿蒙 C-API 主推方案 + 京东大盘背书**
- **对齐规范**：两者都**对齐微信小程序 DSL** 做统一（组件名 / API / 路由 / 配置），其它端做适配
- **别误解**：Taro **不是只能 React**（Vue3 是一等支持）；uni-app 也并非「不能做复杂应用」——分野在**主打技术栈**，不是能力上限

## 一、最核心的一句话

国内跨端小程序框架里，Taro 和 uni-app 常被并称「双雄」。分清它们只需一句话：

- **Taro＝React 系为主**：首选 **React**（JSX + Hooks），同时**一等支持 Vue3**（也能 Vue2/Preact/Nerv/Svelte）。
- **uni-app＝Vue 系为主**：基于 **Vue**（单文件组件），用接近微信小程序的模板语法书写。

所以选型的**第一决策因子往往是团队技术栈**：React 班底用 Taro 顺手，Vue 班底用 uni-app 顺手。

## 二、开发心智的差异

| 维度 | Taro | uni-app |
| --- | --- | --- |
| 主打框架 | **React**（也支持 Vue3） | **Vue** |
| 你写的是什么 | **真正的 React/Vue 组件**（Taro 3+ 重运行时，见[架构演进](./architecture)） | **Vue 单文件组件** + 小程序式模板语法 |
| 组件写法 | 内置组件 **PascalCase**（React 需 import）；事件 **`on` 前缀** | Vue 模板 + 小程序式标签/指令 |
| 出品方 | 京东·凹凸实验室 / NervJS | DCloud |
| App 端方案 | **React Native** | 自家原生渲染方案 |

Taro 的「写真组件」意味着：你几乎是在写标准 React/Vue，框架能力与生态（Hooks、状态库、社区组件）基本可直接复用；差异集中在**用 Taro 内置组件替代 HTML 标签、用 `Taro.*` 替代端 API、页面生命周期改用 Taro Hooks**（见[开发模型](./react-model)与[页面 Hooks 与路由](./hooks-router)）。

## 三、共同点：都对齐微信小程序规范

尽管技术栈不同，两者的**统一策略是相似的**——都以**微信小程序 DSL 为基准**做跨端统一：组件名、API 命名、路由、配置向微信小程序对齐，其它端（支付宝/抖音/百度/H5/App）由框架做适配层抹平差异。因此「一套代码多端编译」的整体体验是同构的，差别在你用 React 还是 Vue 的心智去写。

## 四、什么时候更适合 Taro

- **团队是 React 栈**：直接复用 React 技能与生态，无需切 Vue。
- **想要框架灵活性**：Taro 支持多框架（React / Vue3 / Preact），可按项目选。
- **要上纯血鸿蒙**：Taro 的 **C-API 方案是纯血鸿蒙主推**路线，且有**京东 APP 鸿蒙版**大盘背书（2024-09 上线、华为 S 级认证，见[纯血鸿蒙三路线](./harmony)）。
- **App 端想用 React Native 生态**：Taro 的 App 端走 RN。

## 五、什么时候更适合 uni-app

- **团队是 Vue 栈**：用 Vue 单文件组件，学习成本最低。
- **偏好 Vue 模板语法**：习惯 `v-for` / `v-if` / 指令体系。

## 六、别踩的误解

- **Taro 不是「只能 React」**：Vue3 是一等公民；说 Taro 时用「**主打 React、兼 Vue**」最准确。
- **分野是「主打技术栈」，不是「能力上限」**：两者都能做复杂生产级应用（Taro 有京东大盘、uni-app 有海量案例）。选型请落在**团队技术栈 + 目标端（尤其鸿蒙）+ 生态需求**上，而非「谁更强」。

> 想深入 Taro 的组件与 API，看[开发模型](./react-model)；想理解它凭什么能跑真 React，看[架构演进](./architecture)。
