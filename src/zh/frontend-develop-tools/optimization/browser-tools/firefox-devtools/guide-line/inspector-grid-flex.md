---
layout: doc
outline: [2, 3]
---

# Inspector 与布局

> 基于 Firefox 140+ 稳定版编写

## 速查

- 选元素：`Cmd/Ctrl+Shift+C`；Inspector 三栏 = HTML 树 + Rules + Layout/Computed
- Grid：元素旁 `grid` 徽章点亮叠加；Layout 面板勾「显示行号 / 区域名」
- Flexbox：`flex` 徽章叠加；点 flex item 看尺寸计算（基础/增长/收缩）
- 多网格 / 多 flex 可同时叠加，各配独立颜色
- 取色器：工具栏 Eyedropper 吸取页面任意像素颜色
- Changes 标签随时查看本次改了哪些 CSS

## Inspector 三栏

| 区域 | 内容 |
| --- | --- |
| **HTML 树** | DOM 结构，双击编辑，拖拽改顺序 |
| **Rules** | 匹配的 CSS 规则，实时编辑（同 Chrome Styles） |
| **Layout / Computed** | 布局叠加管理、盒模型、最终计算值 |

实时编辑 CSS、强制伪类（`:hov`）、增删 class 等操作与 Chrome 一致；差异在于布局可视化更强。

## Grid Inspector（业界最佳）

元素为 `display:grid` 时，Rules 里属性旁出现 **`grid` 徽章**，点击在页面叠加网格可视化：

- **网格线编号**：每条行 / 列线标号，方便用 `grid-line` 定位
- **轨道尺寸**：显示每个轨道的显式 / 隐式尺寸
- **命名区域**：`grid-template-areas` 的区域名在叠加上标出
- **多网格叠加**：页面多个网格可同时显示，各配颜色
- **Layout 面板开关**：「Display line numbers」「Display area names」「Extend lines infinitely」

```css
.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-areas: "head head head";
}
/* 点 grid 徽章 → 页面叠加行列线编号与区域名 */
```

> Firefox 的网格叠加是它最受推崇的功能，调复杂 Grid 布局时比 Chrome 直观。

## Flexbox Inspector

元素为 `display:flex` 时点 **`flex` 徽章**叠加：

- 高亮 flex 容器与各 item 的边界
- 标出**主轴 / 交叉轴**方向
- 点单个 flex item 看其尺寸如何由 `flex-basis` / `flex-grow` / `flex-shrink` 计算得出（图解「最小 → 基础 → 最终」尺寸）

> 「为什么这个 flex 子项是这个宽度」——Flexbox Inspector 用图解直接回答。

## Layout 面板

集中管理页面所有 Grid / Flex 容器的叠加开关、盒模型可视化、以及网格叠加的显示选项。是 Firefox CSS 布局调试的「控制台」。

## 下一步

字体、形状与兼容性工具见 [字体形状与兼容](./fonts-shapes-compat.md)。
