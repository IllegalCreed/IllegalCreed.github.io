---
layout: doc
outline: [2, 3]
---

# 可访问性检查

> 基于 Firefox 140+ 稳定版编写

Firefox 的 **Accessibility Inspector** 是其另一张王牌，提供比 Chrome 更细致的原生可访问性检查。

## 速查

- 打开：DevTools → **Accessibility** 面板（首次需启用可访问性功能）
- a11y 树：辅助技术「看到」的语义树（角色 Role / 名称 Name / 状态 State）
- 对比度：选元素看文本对比度，标注 WCAG **AA / AAA** 是否通过
- 色觉模拟：模拟红色盲 / 绿色盲 / 蓝色盲 / 全色盲 + 对比度损失
- 自动检查：「Check for issues」扫描对比度 / 键盘 / 文本标签问题
- 边界：手动逐元素检查；自动化测试（axe）属「前端测试 · 可访问性测试」

## Accessibility Tree（可访问性树）

DevTools → **Accessibility** 面板展示**辅助技术（屏幕阅读器等）实际感知**的语义树：

- 每个节点的 **Role**（角色，如 button / heading / link）
- **Name**（计算出的可访问名称——来自 `aria-label`、文本、`alt` 等）
- **State**（状态，如 focused / checked / disabled）

点页面元素即定位到 a11y 树对应节点，验证语义是否符合预期（如「这个 div 当按钮用了，但角色不是 button」）。

## 对比度评级

选中含文本的元素，Accessibility 面板显示文本与背景的**对比度比值**，并标注：

- 是否通过 **WCAG AA**（正文 4.5:1 / 大字 3:1）
- 是否通过 **WCAG AAA**（更严格）

> Chrome 也有对比度提示，但 Firefox 把它整合进可访问性检查流程，并配合下面的色觉模拟。

## 色觉障碍模拟

Firefox 可模拟不同**色觉缺陷**下页面的样子，验证信息是否仅靠颜色传达：

| 模拟 | 对应 |
| --- | --- |
| Protanopia | 红色盲 |
| Deuteranopia | 绿色盲 |
| Tritanopia | 蓝色盲 |
| Achromatopsia | 全色盲 |
| Contrast loss | 对比度损失 |

> 如果「红 = 错误、绿 = 成功」仅靠颜色区分，色盲用户无法分辨——色觉模拟帮你发现这类问题。

## Check for issues（自动检查）

Accessibility 面板顶部「Check for issues」下拉可自动扫描：

- **Contrast**：对比度不足的文本
- **Keyboard**：键盘可达性问题
- **Text labels**：缺少可访问名称的表单 / 控件

## 与「可访问性测试」的边界

本页是 Firefox DevTools 里的**手动逐元素检查 + 视觉模拟**，用于开发时随手验证。**自动化、可纳入 CI 的可访问性测试（axe-core、jest-axe、Cypress-axe 等）属于「前端测试 · 可访问性测试」专题**，两者互补：手动查细节，自动化防回归。

## 下一步

Console 与断点调试见 [Console 与 Debugger](./console-debugger.md)。
