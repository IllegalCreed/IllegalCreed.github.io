---
layout: doc
outline: [2, 3]
---

# 字体、形状与兼容

> 基于 Firefox 140+ 稳定版编写

这三个是 Firefox **独家或显著领先**于 Chrome 的 CSS 工具。

## 速查

- Fonts：Inspector → Fonts 标签，拖滑块调可变字体轴（weight/width/slant/自定义轴）
- Shape Path：Rules 里 `clip-path` / `shape-outside` 值旁点图标，可视化拖拽多边形 / 圆 / 椭圆
- Changes：Inspector → Changes 标签，列出本会话所有 CSS 改动，可复制导出
- Compatibility：Inspector → Compatibility，标注当前 CSS 的跨浏览器支持，可配目标浏览器

## Fonts Editor（可变字体）

Inspector → **Fonts** 标签：

- 列出页面 / 选中元素**实际应用的所有字体**（含来源、是否系统字体）
- 对**可变字体（Variable Fonts）**提供轴值滑块：`wght`（字重）、`wdth`（字宽）、`slnt`（倾斜）及字体自定义轴
- 拖滑块实时预览，找到合适数值再写回 CSS

```css
h1 {
  font-variation-settings: "wght" 720, "wdth" 85;
  /* 在 Fonts 面板拖滑块调出这两个值 */
}
```

> 调可变字体时，Fonts 面板比盲写 `font-variation-settings` 数值高效得多。

## Shape Path Editor（形状可视化）

CSS 的 `clip-path` / `shape-outside` / `offset-path` 难以盲调。Firefox 在 Rules 里这些属性值旁提供**形状编辑图标**，点击后在页面上：

- **多边形（polygon）**：拖拽各顶点
- **圆形（circle）**：拖拽调半径与圆心
- **椭圆（ellipse）**：拖拽调两个半径
- **inset**：拖拽边距

```css
.clipped {
  clip-path: polygon(0 0, 100% 0, 100% 75%, 0 100%);
  /* 点 clip-path 旁图标 → 直接在页面拖顶点 */
}
```

> 这是 Chrome 没有的可视化能力，做异形裁切 / 文字绕排时是利器。

## Changes 面板

Inspector → **Changes** 标签：

- 记录本次会话在 Rules view 里改过的**所有 CSS**（新增 / 修改 / 删除）
- 以 diff 形式展示，可一键**复制**改动
- 调样式调到满意后，把 Changes 复制回源码，不必凭记忆重敲

## Compatibility 面板

Inspector → **Compatibility** 标签：

- 标注选中元素 / 整页 CSS 属性的**跨浏览器兼容性问题**（基于 MDN 数据）
- 点击底部 Settings 配置关心的目标浏览器集合
- 用到实验性或前缀属性时直接提示风险

> 不必频繁查 caniuse —— Compatibility 面板把兼容性检查内置进了调试流程。

## 下一步

可访问性检查见 [可访问性检查](./accessibility.md)。
