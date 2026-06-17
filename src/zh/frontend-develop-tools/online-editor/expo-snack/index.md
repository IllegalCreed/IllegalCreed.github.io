---
layout: doc
---

# Expo Snack

「浏览器里写 React Native」的在线 playground——零安装，打开网页即可写 RN/Expo 代码，并即时在浏览器 web-player、云端 iOS/Android 模拟器、或手机上的 Expo Go 真机三端预览，代码可保存为「Snack」一键分享或嵌入文档。它本质是 React Native/Expo 生态版的 CodePen/JSFiddle，最广为人知的用途是给库做可运行示例、教学演示、以及给维护者一份轻量可跑的 bug 最小复现。

## 评价

**优点**

- 浏览器内即写即跑 React Native，零本地安装、零环境配置，新手入门门槛极低
- 独有「**手机扫码真机实时预览**」——用普通 Expo Go 扫码即可在真手机上看到 RN 效果，是通用在线编辑器（StackBlitz/CodePen）做不到的差异化能力
- 三端预览（浏览器 web-player + 云端 Appetize 模拟器 + Expo Go 真机）覆盖广，实时同步、改完即见
- 编辑器为 Monaco（与 VS Code 同源），有补全、多文件、TypeScript 支持
- 代码存为「Snack」得唯一 URL，一键分享，且可用 `embed.js` 或 URL 参数嵌进任意网页做 live demo（React Native 官方文档即用它）
- 开源（MIT），`snack-sdk` 对外可用，可在自己网站做自定义 Snack 体验

**缺点**

- 强绑 React Native + Expo 移动端生态，不适合通用 Web / Node 项目
- 跑在 Expo Go 预置 runtime，**只能用纯 JS 包 + Expo 自带的原生模块**；任何需要自定义原生代码 / config plugin 的库都跑不了
- 不构建二进制：自定义原生、生产打包、上架提交必须落本地项目 + EAS Build，Snack 做不到
- 新发布的 NPM 版本最多需等 60 分钟才在 Snack 可用（Snackager 缓存）
- 真机模拟器依赖云端 Appetize，免费时长 / 排队等运营策略可能变动

## 文档地址

[Expo Snack](https://docs.expo.dev/workflow/snack/)

## GitHub地址

[expo/snack](https://github.com/expo/snack)

## 幻灯片地址

<a href="/SlideStack/expo-snack-slide/" target="_blank">Expo Snack</a>
