---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Redux DevTools 扩展 + Redux Toolkit 2.x 编写

## 速查

- 安装：Chrome / Firefox 商店「Redux DevTools」
- RTK：`configureStore` 默认集成；Zustand：`devtools` 中间件
- 时间旅行：jump / skip / reorder / slider / replay
- 检查：action 列表 + state（Tree/Raw/Chart）+ Diff + 手动 dispatch
- import/export：分享/复现调试会话；persist 刷新保持
- 本项目 Pinia 用 Vue DevTools，不用 Redux DevTools
- 完整说明见 [入门](./getting-started.md) / [时间旅行调试](./guide-line/time-travel.md) / [Action 与状态检查](./guide-line/action-state.md) / [跨库接入](./guide-line/integration.md) / [导入导出与技巧](./guide-line/import-export.md)

## 核心功能

| 功能 | 说明 |
| --- | --- |
| 时间旅行 | jump / skip / reorder / replay / slider |
| state diff | 高亮每个 action 的状态改动 |
| 手动 dispatch | 直接派发 action 测 reducer |
| import / export | 导出导入 state 历史 |
| persist | 刷新保持状态历史 |
| pause / lock | 暂停录制 |
| 生成测试 | 由 action 序列生成测试 |

## 跨库接入

| 库 | 接入方式 |
| --- | --- |
| Redux Toolkit | `configureStore` 默认集成 |
| 原生 Redux | `composeWithDevTools()` |
| Zustand | `devtools` 中间件（第三参标 action 名） |
| Jotai | `jotai-devtools` |
| NgRx | `StoreDevtoolsModule.instrument()` |

## 时间旅行的前提

- reducer 必须是纯函数（无副作用、不可变更新）
- state 应可序列化（不放函数 / 类实例）
- 副作用放 reducer 之外（thunk / saga / listener）

## 与 Vue DevTools 边界

| | Redux DevTools | Vue DevTools |
| --- | --- | --- |
| 生态 | Redux / Zustand / Jotai / NgRx | Vue / Pinia |
| time-travel | ✅ | ✅ Pinia 集成 |

> 本项目（Vue 3 + Pinia）状态调试用 Vue DevTools。

## 官方资源

- GitHub：[https://github.com/reduxjs/redux-devtools](https://github.com/reduxjs/redux-devtools)
- Redux Toolkit：[https://redux-toolkit.js.org/](https://redux-toolkit.js.org/)
- 扩展：[Redux DevTools Chrome 商店](https://chromewebstore.google.com/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd)
