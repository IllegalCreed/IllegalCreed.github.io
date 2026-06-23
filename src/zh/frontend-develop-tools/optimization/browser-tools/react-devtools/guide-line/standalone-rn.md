---
layout: doc
outline: [2, 3]
---

# 独立应用与 RN

> 基于 React 19.2 + React DevTools 6.x 编写

## 速查

- standalone：`npm i -D react-devtools` → `npx react-devtools` 启动独立窗口
- 适用：React Native、Safari、Electron 等无法装浏览器扩展的环境
- 连接：被调试 app 加载 devtools 后端，连到 standalone 的端口（默认 8097）
- React Native：现代 RN 内置 React Native DevTools（基于 React DevTools）
- React 19.2：Chrome Performance 面板的 React Performance Tracks（见下）

## standalone（独立应用）

浏览器扩展只能调网页里的 React。对 **React Native、Safari、Electron** 等环境，用独立版：

```bash
npm i -D react-devtools
npx react-devtools          # 启动独立 DevTools 窗口
```

启动后是一个独立窗口，等待目标 app 连接（默认端口 **8097**）。功能（Components / Profiler）与扩展版一致。

## 连接 React Native

- **现代 RN**：内置 **React Native DevTools**（基于 React DevTools + Chrome DevTools 协议），通过开发菜单（摇一摇 / `j`）直接打开，无需额外配置
- **旧版 / 特殊场景**：用 `npx react-devtools` standalone，app 端通过 metro 连到 8097

> 调 RN 组件树、props、性能与调网页 React 体验一致——同一套 Components / Profiler。

## 连接 Safari / 其他

Safari 没有 React DevTools 扩展，可用 standalone：在页面注入 devtools 后端脚本，连到 `npx react-devtools` 窗口。Electron 等同理。

## React 19.2 Performance Tracks

React 19.2 在 **Chrome Performance 面板**注入 **React Performance Tracks**（通过 `performance.measure`）：

- **Scheduler 轨道**：Blocking（紧急更新）/ Transition / Suspense / Idle
- 显示调度更新的事件与渲染时机
- 把 React 内部调度画进浏览器时间线——与 React DevTools 的 Profiler 互补：Profiler 看「组件渲染耗时」，Performance Tracks 看「调度与浏览器时间线的关系」

> 这是 React 调试的新维度：不再只看 React 内部，而是把 React 工作放到浏览器整体性能时间线里看。

## 小结

React DevTools 一套工具覆盖**网页 + React Native + 其他环境**：浏览器扩展用于网页，standalone 用于 RN/Safari/Electron。配合 React 19.2 的 Performance Tracks，React 应用的调试与性能分析在 2026 年更加完整。

## 资源

- [React Developer Tools](https://react.dev/learn/react-developer-tools)
- [React Native DevTools](https://reactnative.dev/docs/react-native-devtools)
