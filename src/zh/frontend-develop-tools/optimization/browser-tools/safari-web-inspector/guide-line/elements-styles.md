---
layout: doc
outline: [2, 3]
---

# Elements 与样式

> 基于 Safari 26（macOS / iOS 26）编写

## 速查

- 选元素：`Cmd+Shift+C`；选中后 `$0` 在 Console 引用
- DOM 树：双击编辑标签 / 属性 / 文本；拖拽改顺序
- Styles：右侧栏实时编辑 CSS，反映 WebKit 的层叠规则
- 强制伪类：样式区可强制 `:hover` / `:active` 等
- 盒模型 / Computed：看尺寸与最终计算值
- 节点高亮：悬停 DOM 树节点页面同步高亮

## Elements 面板

Safari 的 Elements 面板与 Chrome 高度相似：

- **DOM 树**：完整可编辑的标记树，点节点在右侧看样式
- **编辑**：双击标签 / 属性 / 文本即改；右键有删除、复制、编辑为 HTML 等
- **拖拽**：调整节点在文档中的顺序
- **节点高亮**：选中 / 悬停时页面同步高亮，显示盒模型边界

## Styles（WebKit 样式）

右侧样式栏实时编辑 CSS，改动立即反映：

- 显示匹配的所有规则及来源，**按 WebKit 自己的层叠规则**解析
- 可增删属性、勾选启停声明
- 强制元素伪类状态（`:hover` / `:active` / `:focus`），调悬停样式
- 颜色等值可用可视化编辑器

> 注意：Safari 反映的是 **WebKit 的 CSS 行为**——某些属性的默认值、前缀、支持度与 Chromium / Gecko 不同，这正是用 Safari 调试的意义。

## Computed 与盒模型

- **Computed**：元素最终采用的计算值
- **盒模型图**：直观显示 margin / border / padding / content 尺寸
- **Layout 信息**：尺寸、定位等

## 与其他浏览器的差异

Safari 的 Elements / Styles 在交互上不如 Chrome 丰富（无 Grid/Flex 可视化叠加那么强，也无 Firefox 的形状编辑器），但它的价值在于**展示 WebKit 的真实样式行为**——当某段 CSS 只在 Safari / iOS 出问题时，必须在这里排查。

## 下一步

日志与断点调试见 [Console 与 Sources](./console-sources.md)。
