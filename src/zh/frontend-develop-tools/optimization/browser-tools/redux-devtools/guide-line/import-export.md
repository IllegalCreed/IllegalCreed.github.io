---
layout: doc
outline: [2, 3]
---

# 导入导出与技巧

> 基于 Redux DevTools 扩展 + Redux Toolkit 2.x 编写

## 速查

- export：导出 action / state 历史为文件，分享调试会话
- import：导入他人导出的历史，本地复现同样的状态序列
- persist：刷新页面保持状态历史（不丢调试上下文）
- pause / lock：暂停录制，避免无关 action 刷屏
- 生成测试：把 action 序列沉淀为测试
- 边界：本项目 Pinia 用 Vue DevTools，不用 Redux DevTools

## Export / Import：分享调试会话

- **Export**：把当前的 action 历史与 state 导出为 JSON 文件
- **Import**：导入该文件，**在本地完整复现**同样的 action 序列与状态

> 这是排查难复现 bug 的利器：让用户/同事导出他们的 state 历史，你导入后即可在本地一步步回放，无需复述操作步骤。

## Persist：刷新保持状态

开启 **persist** 后，刷新页面不会清空 action 历史与 state——调试跨页面刷新的流程时，不丢失调试上下文。

## Pause / Lock：暂停录制

- **pause**：暂停记录新 action，避免无关 action（如定时轮询）刷屏
- **lock**：锁定当前状态，专注分析已记录的序列

## 生成测试

基于记录的 action 序列与对应 state，可**生成测试代码**，把一次手动调试沉淀为回归测试——类似「录制回放」到测试的转化。

## 监视器（Monitors）

Redux DevTools 支持多种监视器视图（在扩展或自定义集成中）：

- **Inspector**：默认，action 列表 + state + diff 一体
- **Log monitor**：日志式滚动展示 action 与 state
- **Chart monitor**：state 树的图形化

## 与本项目（Pinia）的边界

| | Redux DevTools | Vue DevTools |
| --- | --- | --- |
| 生态 | Redux / Zustand / Jotai / NgRx | Vue / Pinia |
| time-travel | ✅ | ✅（Pinia 集成） |
| 适用 | React 为主的状态库 | Vue 3 项目 |

> 本项目（Vue 3 + Pinia）的状态调试由 **Vue DevTools** 提供，无需 Redux DevTools。理解 Redux DevTools 的价值在于：它确立了「时间旅行 + action 可重放」这一状态调试范式，Vue/Pinia 的 time-travel 也是同一思想的体现。

## 小结

Redux DevTools 以**时间旅行**为核心，确立了现代状态调试范式：action 可重放、state 可回溯、diff 一目了然、跨库通用。即便本项目用 Pinia + Vue DevTools，理解这套范式也有助于把握「可预测状态」的调试哲学。

## 资源

- [Redux DevTools](https://github.com/reduxjs/redux-devtools)
- [Redux Toolkit](https://redux-toolkit.js.org/)
