---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 snack.expo.dev 与 Expo 官方文档 2025–2026 现状编写

## 速查

- **本质**：浏览器内的 React Native/Expo playground——零安装写 RN 代码，官方标语「React Native in the browser」
- **三端预览**（同一份代码，实时同步）：
  - **Web**：浏览器内跑 React Native for Web 的 **web-player**，默认平台，打开即运行
  - **iOS / Android 模拟器**：云端 **Appetize.io** 远程模拟器，画面流到浏览器
  - **My Device（真机）**：手机上的 **Expo Go App** 扫码 / 同账号登录，推到真机实时预览
- **编辑器**：**Monaco**（VS Code 同源内核），多文件、补全、TypeScript（`App.tsx`）
- **实时更新**：每次按键去抖后自动广播到所有预览端，**不用手动保存**
- **访问**：主站 <https://snack.expo.dev/>；新建直接打开主站即得一个可运行 Snack
- **打开已存 Snack**：`snack.expo.dev/{id}` 或 `snack.expo.dev/@用户名/slug`
- **保存 / 分享**：登录 Expo 账号后存为「Snack」得唯一 URL，一键分享
- ⚠️ **真机预览用的就是普通 Expo Go**，不是特殊 App——这也是它原生能力受限的根因
- **文档**：<https://docs.expo.dev/workflow/snack/>

## 什么是 Expo Snack

Expo Snack 是一个**在浏览器里编写并运行 React Native 应用的在线开发环境**。打开 <https://snack.expo.dev/>，你立刻得到一份可编辑的 RN 代码、一个 Monaco 编辑器、以及右侧实时运行的预览——全程不需要在电脑或手机上安装任何工具链。

官方对它的定义很直接：

- 首页标语：**"React Native in the browser"**（浏览器里写 React Native）。
- README：「一个开源平台，在浏览器里运行 React Native 应用；动态打包编译代码，并跑在 Expo Go 或 web-player 中；代码可存为 'Snacks' 并轻松分享。」
- Expo 术语表：「Snack 是一个**浏览器内的开发环境**，无需在手机或电脑安装任何工具就能构建 Expo 体验。」

::: tip 一句话定位
Snack 就是 **React Native / Expo 生态版的 CodePen / JSFiddle**。它诞生于 2017 年（最初代号 "Sketch"），当年 React Native 正缺这样一个「打开即跑、即时分享」的演练场。
:::

它的典型用途有三类：

1. **给库 / API 做可运行示例**——把一段 RN 代码嵌进文档，读者点开即跑即改（React Native 官方文档的 live preview 就是 Snack）。
2. **教学演示**——零安装让学习者立刻动手写 RN。
3. **bug 最小复现（MCVE）**——给库维护者一份轻量、可运行、可分享的复现，比让对方搭本地环境高效得多。

## 三端预览：Snack 的核心

Snack 把**同一份代码**送到三种预览目标，且全部实时同步。理解这三端是用好 Snack 的关键。

| 预览目标               | 在哪运行                          | 说明                                                         |
| ---------------------- | --------------------------------- | ------------------------------------------------------------ |
| **Web（web-player）**  | **浏览器内**，跑 React Native for Web | 默认平台，一打开 Snack 立即运行；本质是 RN-for-web 在 iframe 里执行 |
| **iOS / Android 模拟器** | 云端 **Appetize.io** 远程模拟器     | 模拟器画面流式传到浏览器；可选设备型号 / 外观                  |
| **My Device（真机）**  | 手机上的 **Expo Go App**            | 扫二维码或登录同一 Expo 账号，把 Snack 推到真机 Expo Go 实时预览 |

::: warning 「My Device」用的是普通 Expo Go，不是特殊 App
很多人以为真机预览要装某个专用 App——其实就是应用商店里那个**普通的 Expo Go**。Snack 代码本质跑在 Expo Go 预置的 runtime 里，这正是它「原生能力受限」（只能用 JS 包 + Expo 自带原生模块）的根源，详见「预览机制与依赖限制」一章。
:::

三端如何保持一致：Snack 通过实时发布订阅通道，把编辑器里的改动去抖后广播给所有已连接的预览端；预览端产生的 `console` 日志、报错也通过同一通道回流到编辑器面板。多个客户端（多台设备）可同时连接同一个 Snack 一起看。（实现细节见下一章。）

## Monaco 编辑器与多文件

Snack 的代码编辑器是 **Monaco**——和 VS Code 同一个内核，自带语法高亮、智能补全、跳转、多文件标签。

- 默认入口是 **`App.js`**；想用 TypeScript 直接建 **`App.tsx`** 即可。
- 支持多文件项目结构（组件、资源、JSON 数据等）。
- 左侧文件树可新建文件、添加依赖（Dependencies 面板）、上传资源。

## 访问与新建

| 操作                | 方式                                                   |
| ------------------- | ------------------------------------------------------ |
| 打开主站 / 新建     | 直接访问 <https://snack.expo.dev/>，立即得到一个可运行 Snack |
| 打开已存 Snack      | `snack.expo.dev/{id}`（如 `snack.expo.dev/mYtGTbIqv`）  |
| 打开某用户的 Snack  | `snack.expo.dev/@用户名/slug`                          |
| 极简嵌入页          | `snack.expo.dev/embedded`（嵌入文档 / 网站用，见「嵌入与边界」一章） |

::: tip 域名已迁移
旧域名 `snack.expo.io` 早已迁到 **`snack.expo.dev`**，旧链接会 301 自动跳转。新内容一律用 `snack.expo.dev`。
:::

## 基本用法

一个最典型的「写 → 预览 → 分享」流程：

1. **打开主站**，在左侧 Monaco 编辑器里改 `App.js`（或新建 `App.tsx` 用 TypeScript）。
2. **选预览端**：默认 Web（web-player）即时运行；切到 iOS / Android 看云模拟器；切到「My Device」用手机 Expo Go 扫码看真机。
3. **加依赖**：在 Dependencies 面板或直接写 `import` 引入 npm 包（有打包限制，见下一章）。
4. **保存 / 分享**：登录 Expo 账号后保存，得到唯一 URL；把链接发给别人，对方打开就是同一份可运行代码。

::: tip 想做真项目时
Snack 适合 demo、教学、试 API、最小复现。一旦你需要自定义原生代码、config plugin、或要打包上架，就得用 `npx create-expo-app` 建本地项目并配合 EAS Build——这条边界很重要，详见「嵌入与边界」一章。
:::
