---
layout: doc
---

# Redux DevTools

Redux DevTools 是用于调试 **可预测状态容器**的浏览器扩展，最初为 Redux 而生，如今**跨库通用**——Redux、Redux Toolkit、Zustand、Jotai、NgRx 等遵循其协议的状态库都能开箱接入。它最标志性的能力是**时间旅行调试（time-travel）**：把每次 `dispatch` 的 action 按时间记录下来，可在历史 state 间前后跳转、跳过/重排某个 action、回放整个变更序列，并以 diff 形式展示每个 action 对 state 的影响。这依赖 Redux「单向数据流 + 纯函数 reducer」的设计——状态变更可重放、可回溯。它还支持手动 dispatch action、导出/导入 state 历史（分享调试会话）、刷新保持状态等。**注意边界**：本项目（Vue 3 + Pinia）的状态调试由 Vue DevTools 提供（含 Pinia time-travel），无需 Redux DevTools；本叶是面向 Redux/Zustand 等生态的状态调试知识补全。

## 评价

**优点**

- **时间旅行调试**：前后跳转 state、跳过/重排/回放 action——状态调试的标杆能力
- **跨库通用**：Redux / RTK / Zustand / Jotai / NgRx 等开箱接入
- **state diff**：清晰展示每个 action 对 state 的具体改动
- **手动 dispatch**：直接派发 action 测试 reducer 逻辑
- **import/export**：导出 state 历史，分享/复现调试会话
- **持久化与暂停**：刷新保持状态、暂停录制

**缺点**

- **依赖规范架构**：time-travel 要求纯函数 reducer、可序列化 state
- **偏 Redux/React 生态**：Vue 的 Pinia 用 Vue DevTools 更顺
- **大型 state 开销**：超大 state 树 / 海量 action 有性能成本
- **非业务无关**：只对接入它的状态库有效，普通组件状态看不到

## 文档地址

[Redux DevTools](https://github.com/reduxjs/redux-devtools)

## GitHub地址

[reduxjs/redux-devtools](https://github.com/reduxjs/redux-devtools)

## 幻灯片地址

<a href="/SlideStack/redux-devtools-slide/" target="_blank">Redux DevTools</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=redux-devtools" target="_blank" rel="noopener noreferrer">Redux DevTools 测试题</a>
