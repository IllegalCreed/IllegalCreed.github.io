---
layout: doc
outline: [2, 3]
---

# Elements 与样式

> 基于 Chrome 149 稳定版编写

## 速查

- 选元素：`Cmd/Ctrl+Shift+C` 点选；选中后 `$0` 在 Console 引用它
- 编辑 DOM：双击标签 / 文本改；`H` 隐藏元素，`Delete` 删除，`F2` 编辑为 HTML
- 强制状态：Styles 面板 `:hov` → 勾 `:hover/:focus/:active/:visited`
- 改样式：Styles 实时编辑；`↑/↓` 增减数值（`Shift`=×10，`Alt`=×0.1）
- 新规则：Styles 面板 `+`；`.cls` 临时切换 class
- Computed：看最终计算值与来源、继承链；盒模型图可直接改 margin/padding
- 布局可视化：Layout 面板勾选 Grid / Flexbox 叠加线与间隙
- 可访问性：Accessibility 标签看 ARIA 树、对比度（APCA，149 已稳定）
- CSS 补全：Styles 面板 Gemini 代码补全（复杂渐变 / 阴影 / 网格）

## 检查与编辑 DOM

- **定位**：`Cmd/Ctrl+Shift+C` 后点页面元素，或在 DOM 树里悬停高亮
- **编辑**：双击标签名 / 属性 / 文本即可改；右键元素有完整菜单
  - **Edit as HTML**（`F2`）：把整段当 HTML 编辑
  - **Hide element**（`H`）：切换 `visibility:hidden`
  - **Force state**：强制 `:hover` 等伪类，方便调悬停样式
  - **Scroll into view**：滚动到该元素
  - **Store as global variable**：存为 `temp1`，到 Console 操作
- **拖拽**：在 DOM 树里拖动节点可改变文档顺序
- **断点**：右键 → Break on（子树修改 / 属性修改 / 节点移除）= DOM 断点

## Styles 面板

实时编辑选中元素的 CSS，改动立刻反映到页面（不写回源码）：

- **增删属性**：点规则空白处补属性；勾选框启停某条声明
- **数值微调**：聚焦数值用 `↑/↓` 增减，`Shift`=步长 10，`Alt`=步长 0.1
- **新增规则**：点 `+` 新建规则；`.cls` 面板临时增删 class
- **可视化编辑器**：颜色选择器（含对比度提示）、阴影编辑器、`cubic-bezier` 缓动曲线、渐变编辑器
- **伪类**：`:hov` 按钮强制 `:hover/:focus/:focus-within/:active/:visited`
- **来源标注**：每条规则标出来自哪个样式表与行号，点击跳转 Sources

```css
/* Styles 里直接试，确认后再写回代码 */
.card {
  display: grid;
  gap: 12px; /* ↑/↓ 微调，眼见为实 */
}
```

> **CSS 代码补全（Chrome 149）**：Styles 面板接入 Gemini，对复杂属性（渐变、`box-shadow`、`grid-template`）给出补全建议，减少查文档。

## Computed 面板

显示元素**最终计算值**（浏览器实际采用的值）：

- 展开任一属性看它由哪条规则贡献、是否被覆盖（继承链）
- 顶部盒模型图直观显示 `margin / border / padding / content` 尺寸，可双击直接改
- 勾「Show all」查看全部计算属性

## 布局调试：Grid 与 Flexbox

元素若是 `display:grid` / `flex`，标签旁出现 `grid` / `flex` 徽章，点击叠加可视化：

- **Layout 面板**：集中管理所有 Grid / Flex 容器的叠加开关
- Grid：显示行列线编号、轨道尺寸、间隙、区域名
- Flex：显示主轴 / 交叉轴方向、对齐与间距

> CSS 布局可视化是日常调试利器，但 Firefox 的 Grid / Flex 检查器在边缘细节上更细致——两者可互补。

## Event Listeners 与断点

- **Event Listeners** 标签：列出元素上绑定的所有事件监听器及来源文件
- **DOM 断点**（右键 → Break on）：DOM 变动时暂停 JS，定位「谁改了这个节点」
- 配合 Sources 的断点体系，可追踪样式 / 结构被哪段代码修改

## 可访问性（Accessibility）

Elements 右侧 **Accessibility** 标签：

- **Accessibility Tree**：辅助技术「看到」的语义树（角色、名称、状态）
- **ARIA 属性**：检查 `role`、`aria-*` 是否正确
- **对比度**：颜色选择器内显示文本对比度；**APCA**（Advanced Perceptual Contrast Algorithm）在 Chrome 149 已转为稳定算法，比旧的 WCAG 2 对比度更贴近人眼感知

> 自动化可访问性审计（axe 等）属于「前端测试 · 可访问性测试」；这里是手动逐元素检查。

## 与 Edge DevTools 的差异（带过）

Edge 同为 Chromium，DevTools 基本一致，但多出 **3D View**（DOM / z-index / 合成层三维可视化）、**CSS Overview**（站点颜色 / 字体 / 媒体查询汇总）等独特工具；查 z-index 层叠或 DOM 嵌套过深时可临时用 Edge。
