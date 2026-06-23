---
layout: doc
outline: [2, 3]
---

# 组件树导航

> 基于 React 19.2 + React DevTools 6.x 编写

## 速查

- Components 面板 = React 组件树（非 DOM 树）
- 搜索框按组件名过滤，支持正则
- 选元素：点 Components 左上的选择图标，再点页面元素 → 定位组件
- 组件 → DOM：右键「Inspect the matching DOM element」跳 Elements
- 查看源码：选中组件点 `<>` 图标跳 Sources 对应源文件
- 设置过滤：齿轮 → Components，隐藏 host 组件 / HOC / 按名过滤

## 组件树

Components 面板展示页面的 **React 组件层级**（如 `App > Layout > Header > Nav`），而非编译后的 `div/span` DOM。点击展开 / 折叠子树，键盘方向键导航。

- 选中组件时，页面上对应区域高亮
- 树中既有你的组件，也有库组件（如 Router、Provider）

## 搜索与过滤

- **搜索框**：输入组件名快速过滤，支持正则；匹配项在树中高亮跳转
- **组件过滤**（齿轮 → Components）：
  - 隐藏 **host 组件**（`div`、`span` 等原生 DOM 包装）
  - 隐藏 **HOC** 包装层（如 `withRouter(...)`）
  - 按名称 / 位置过滤，让树更聚焦自己的业务组件

> 大型应用组件树很深，合理过滤能大幅提升可读性。

## 双向定位

| 方向 | 操作 |
| --- | --- |
| 页面 → 组件 | 点 Components 左上「选择」图标 → 点页面元素 |
| 组件 → DOM | 右键组件 →「Inspect the matching DOM element」跳 Elements |
| 组件 → 源码 | 选中组件 → 点 `<>` 图标跳 Sources 对应源文件 |
| 组件 → Console | 右键「Log this component」或选中后用 `$r` |

## owner（谁渲染了它）

选中组件后可查看 **rendered by**（渲染它的父链 / owner），帮助理解组件是由谁创建的——这在层层封装的组件库里尤其有用，区别于单纯的 DOM 父子关系。

## 下一步

检查与编辑组件数据见 [Props/State/Hooks](./props-state-hooks.md)。
