---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 W3C WAI（WCAG 2.2 / WAI-ARIA 1.2 / ARIA APG）、MDN Web Docs、web.dev Learn Accessibility 官方文档编写，对照 WCAG 2.2（2023-10-05 发布）与 2026-07 浏览器现状

## 速查

- **WCAG 2.2**：W3C Recommendation 2023-10-05，新增 9 SC + 移除 4.1.1 Parsing
- **三大原则 POUR**：Perceivable / Operable / Understandable / Robust
- **三级**：A（30 条）/ AA（20 条新增）/ AAA（28 条）
- **WCAG 2.2 新 SC**：2.4.11 Focus Not Obscured (AA) / 2.5.7 Dragging (AA) / 2.5.8 Target Size (AA, 24×24) / 3.2.6 Consistent Help (A) / 3.3.7 Redundant Entry (A) / 3.3.8 Accessible Auth (AA) 等 9 条
- **对比度 1.4.3 (AA)**：普通 4.5:1、大字 3:1；AAA 7:1 / 4.5:1；非文字 UI 1.4.11 3:1
- **ARIA 第一规则**：能用原生 HTML 就别用 ARIA 重写
- **三大读屏**：NVDA（Windows 免费）/ JAWS（Windows 付费）/ VoiceOver（macOS / iOS 系统内置）
- **:focus-visible**：W3C 技法 C45，仅键盘显示焦点环
- **WCAG 3.0 仍是草案**：生产合规目标仍按 2.x
- 完整说明见 [入门](./getting-started.md) / [深入指南](./guide-line.md)

## WCAG 2.2 准则完整表（13 条 Guideline）

### 原则一 Perceivable（可感知）

| 编号 | 准则 | 关键 SC |
| --- | --- | --- |
| **1.1** | Text Alternatives | 1.1.1 Non-text Content (A) — 装饰图 `alt=""`，信息图有 alt |
| **1.2** | Time-based Media | 1.2.1 Audio-only / Video-only / 1.2.2 Captions / 1.2.3 Audio Description / 1.2.4 Live Captions / 1.2.5 Audio Description |
| **1.3** | Adaptable | 1.3.1 Info and Relationships (A) / 1.3.2 Meaningful Sequence (A) / 1.3.3 Sensory Characteristics (A) / 1.3.4 Orientation (AA) / 1.3.5 Identify Input Purpose (AA) / 1.3.6 Identify Purpose (AAA) |
| **1.4** | Distinguishable | **1.4.1 Use of Color (A)** / 1.4.2 Audio Control (A) / **1.4.3 Contrast Minimum (AA)** / 1.4.4 Resize Text (AA) / 1.4.5 Images of Text (AA) / **1.4.6 Contrast Enhanced (AAA)** / 1.4.7 Low Background Audio (AAA) / 1.4.8 Visual Presentation (AAA) / 1.4.9 Images of Text No Exception (AAA) / **1.4.10 Reflow (AA)** / **1.4.11 Non-text Contrast (AA)** / 1.4.12 Text Spacing (AA) / 1.4.13 Content on Hover or Focus (AA) |

### 原则二 Operable（可操作）

| 编号 | 准则 | 关键 SC |
| --- | --- | --- |
| **2.1** | Keyboard Accessible | **2.1.1 Keyboard (A)** / 2.1.2 No Keyboard Trap (A) / 2.1.3 Keyboard No Exception (AAA) / 2.1.4 Character Key Shortcuts (A) |
| **2.2** | Enough Time | **2.2.1 Timing Adjustable (A)** / **2.2.2 Pause, Stop, Hide (A)** / 2.2.3 No Timing (AAA) / 2.2.4 Interruptions (AAA) / 2.2.5 Re-authenticating (AAA) / 2.2.6 Timeouts (AAA) |
| **2.3** | Seizures and Physical Reactions | 2.3.1 Three Flashes (A) / 2.3.2 Three Flashes No Exception (AAA) / **2.3.3 Animation from Interactions (AAA)** / 2.3.4 Interaction Triggers (AAA) |
| **2.4** | Navigable | **2.4.1 Bypass Blocks (A)** / 2.4.2 Page Titled (A) / **2.4.3 Focus Order (A)** / 2.4.4 Link Purpose In Context (A) / 2.4.5 Multiple Ways (AA) / 2.4.6 Headings and Labels (AA) / **2.4.7 Focus Visible (AA)** / 2.4.8 Location (AAA) / 2.4.9 Link Purpose Link Only (AAA) / 2.4.10 Section Headings (AAA) / **2.4.11 Focus Not Obscured Minimum (AA) ★** / 2.4.12 Focus Not Obscured Enhanced (AAA) ★ / 2.4.13 Focus Appearance (AAA) ★ |
| **2.5** | Input Modalities | 2.5.1 Pointer Gestures (A) / 2.5.2 Pointer Cancellation (A) / 2.5.3 Label in Name (A) / 2.5.4 Motion Actuation (A) / **2.5.5 Target Size Enhanced (AAA, 44×44)** / **2.5.7 Dragging Movements (AA) ★** / **2.5.8 Target Size Minimum (AA, 24×24) ★** |

> ★ 标记 = WCAG 2.2 新增 SC

### 原则三 Understandable（可理解）

| 编号 | 准则 | 关键 SC |
| --- | --- | --- |
| **3.1** | Readable | 3.1.1 Language of Page (A) / 3.1.2 Language of Parts (AA) / 3.1.3 Unusual Words (AAA) / 3.1.4 Abbreviations (AAA) / 3.1.5 Reading Level (AAA) / 3.1.6 Pronunciation (AAA) |
| **3.2** | Predictable | 3.2.1 On Focus (A) / 3.2.2 On Input (A) / 3.2.3 Consistent Navigation (AA) / 3.2.4 Consistent Identification (AA) / 3.2.5 Change on Request (AAA) / **3.2.6 Consistent Help (A) ★** |
| **3.3** | Input Assistance | 3.3.1 Error Identification (A) / 3.3.2 Labels or Instructions (A) / 3.3.3 Error Suggestion (AA) / 3.3.4 Error Prevention Legal Financial (AA) / 3.3.5 Help (AAA) / 3.3.6 Error Prevention All (AAA) / **3.3.7 Redundant Entry (A) ★** / **3.3.8 Accessible Authentication Minimum (AA) ★** / 3.3.9 Accessible Authentication Enhanced (AAA) ★ |

### 原则四 Robust（健壮）

| 编号 | 准则 | 关键 SC |
| --- | --- | --- |
| **4.1** | Compatible | ~~4.1.1 Parsing~~（**WCAG 2.2 移除**）/ **4.1.2 Name, Role, Value (A)** / 4.1.3 Status Messages (AA) |

> WCAG 2.2 共 86 条 SC：A 30 条、AA 20 条、AAA 28 条（含 9 条新增）。

## ARIA 角色（常用）

### Landmark 角色

| role | 隐式 HTML 元素 |
| --- | --- |
| `banner` | `<header>` |
| `navigation` | `<nav>` |
| `main` | `<main>` |
| `complementary` | `<aside>` |
| `contentinfo` | `<footer>` |
| `region` | `<section>`（需命名） |
| `form` | `<form>`（需命名） |
| `search` | `<search>`（2023 新元素） |

### 窗口与交互角色

| role | 用途 |
| --- | --- |
| `dialog` / `alertdialog` | 模态对话框（`aria-modal="true"`） |
| `alert` | 紧急错误（隐式 assertive + atomic） |
| `status` | 普通通知（隐式 polite + atomic） |
| `log` | 日志流 |
| `tablist` / `tab` / `tabpanel` | 选项卡 |
| `menu` / `menuitem` / `menubar` | 菜单 |
| `listbox` / `option` / `combobox` | 列表 / 下拉 |
| `grid` / `row` / `cell` | 表格 |
| `tree` / `treeitem` | 树 |

> 详细模式见 [WAI-ARIA APG](https://www.w3.org/WAI/ARIA/apg/)。

### 表单与组件角色

| role | 隐式 HTML 元素 / 用途 |
| --- | --- |
| `button` | `<button>` |
| `link` | `<a href>` |
| `textbox` | `<input type="text">` / `<textarea>` |
| `checkbox` | `<input type="checkbox">` |
| `radio` | `<input type="radio">` |
| `slider` | `<input type="range">` |
| `heading` | `<h1>`–`<h6>`（配合 `aria-level`） |
| `img` | `<img>`（配合 `alt`） |

## ARIA 状态与属性（常用）

### 命名与描述

| 属性 | 作用 | 优先级 |
| --- | --- | --- |
| `aria-label` | 直接给文本 | 纯图标按钮 |
| `aria-labelledby` | 引用页面文本 ID | 优先（让可见文本就是 accessible name） |
| `aria-describedby` | 附加详细描述 | 表单字段提示 |
| `aria-roledescription` | 自定义 role 描述 | 高级用法 |

### 状态类

| 属性 | 用途 |
| --- | --- |
| `aria-expanded="true\|false"` | 折叠 / 展开（手风琴、菜单） |
| `aria-checked="true\|false\|mixed"` | 复选框 / 单选 |
| `aria-selected="true\|false"` | 选项卡 / 列表选中 |
| `aria-current="page\|step\|location\|date\|time\|true\|false"` | 当前页面 / 步骤 |
| `aria-invalid="true\|spelling\|grammar"` | 表单校验失败 |
| `aria-disabled="true"` | 禁用（仍可聚焦，区别于 `disabled`） |
| `aria-pressed="true\|false\|mixed"` | 切换按钮 |
| `aria-hidden="true\|false"` | 从可访问性树移除（**绝不用于可聚焦元素**） |
| `aria-busy="true\|false"` | 区域加载中 |

### 实时区

| 属性 | 取值 | 用途 |
| --- | --- | --- |
| `aria-live` | `off`（默认）/ `polite` / `assertive` | 通知时机 |
| `aria-atomic` | `true` / `false` | 念全部 vs 念变化 |
| `aria-relevant` | `additions` / `removals` / `text` / `all` | 哪些变化要念 |

## 对比度阈值完整表

| SC | 名称 | 级别 | 普通文字 | 大字（≥18pt 或 ≥14pt 粗体） | 非文字 UI |
| --- | --- | --- | --- | --- | --- |
| **1.4.3** | Contrast (Minimum) | **AA** | **≥ 4.5:1** | **≥ 3:1** | - |
| 1.4.6 | Contrast (Enhanced) | AAA | ≥ 7:1 | ≥ 4.5:1 | - |
| 1.4.11 | Non-text Contrast | AA | - | - | **≥ 3:1** |

> 计算：WCAG 相对亮度（relative luminance）公式：(L1 + 0.05) / (L2 + 0.05)，L1 较亮、L2 较暗。

### 对比度自查公式

```js
// WCAG 相对亮度（sRGB）
function relativeLuminance(r, g, b) {
  const toLin = (c) => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * toLin(r) + 0.7152 * toLin(g) + 0.0722 * toLin(b);
}

// 对比度比
function contrast(rgb1, rgb2) {
  const L1 = relativeLuminance(...rgb1);
  const L2 = relativeLuminance(...rgb2);
  return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
}

// 白底浅灰（不达标）
contrast([255, 255, 255], [200, 200, 200]);  // ≈ 1.4 < 4.5
// 白底深灰（达标）
contrast([255, 255, 255], [80, 80, 80]);     // ≈ 7.0 ≥ 4.5
```

## 键盘焦点速查

| 属性 / 伪类 | 含义 |
| --- | --- |
| `tabindex` 不写 | 默认（button / a / input 等可聚焦） |
| `tabindex="0"` | 加入 Tab 序（DOM 自然顺序） |
| `tabindex="-1"` | 可编程 focus 但不在 Tab 序（跳过链接目标、模态聚焦） |
| `tabindex="1"` / 正数 | **禁用**（强制重排，业界共识反对） |
| `:focus` | 任何聚焦都触发（鼠标 + 键盘） |
| **`:focus-visible`** | **仅键盘聚焦触发**（W3C 技法 C45） |
| `:focus-within` | 元素或其子元素任一聚焦都触发 |

> `accesskey` 属性也可设快捷键，但与系统 / 读屏快捷键冲突风险高，业界很少用。

## 三大屏幕阅读器

| 读屏 | 平台 | 价格 | 浏览器 | 备注 |
| --- | --- | --- | --- | --- |
| **NVDA** | Windows | 免费（开源） | Chrome / Firefox | 业界主流免费方案 |
| **JAWS** | Windows | 付费 | Chrome / Edge | 企业市场份额最大 |
| **VoiceOver** | macOS / iOS | 系统内置 | Safari | 苹果设备首选 |
| **TalkBack** | Android | 系统内置 | Chrome | 安卓设备 |
| **Orca** | Linux | 免费（开源） | Firefox | Linux 桌面 |

## WCAG 2.2 vs 2.1 vs 3.0

| 版本 | 状态 | 关键变化 |
| --- | --- | --- |
| WCAG 2.0 | W3C Rec 2008 | 初始版本（13 准则 + 61 SC） |
| WCAG 2.1 | W3C Rec 2018 | 新增 17 SC（移动 / 低视力 / 认知） |
| **WCAG 2.2** | **W3C Rec 2023-10-05** | **新增 9 SC + 移除 4.1.1 Parsing** |
| WCAG 3.0 | **草案**（W3C Editor's Draft） | 评分模型与 2.x 不兼容；**不要用于生产合规** |

## 浏览器支持现状（2026-07）

| 特性 | 状态 |
| --- | --- |
| CSS `:focus-visible` | 现代浏览器全面稳定支持（含 Safari / Chrome / Firefox / Edge） |
| HTML `<search>` 元素 | 2023 年起各浏览器陆续原生支持，隐式 `role=search` |
| `prefers-reduced-motion` | 现代浏览器全面支持 |
| `prefers-color-scheme` | 现代浏览器全面支持 |
| WAI-ARIA 1.2 | W3C Recommendation（稳定） |
| WAI-ARIA 1.3 | **草案阶段**（生产仍按 1.2） |

## 常用工具

| 工具 | 用途 |
| --- | --- |
| **axe DevTools** | 浏览器扩展，自动化扫描 a11y 问题（归前端测试章） |
| **Lighthouse a11y** | DevTools 内置（归前端测试章） |
| **WAVE** | 浏览器扩展 / 在线工具 |
| **pa11y** | CLI 自动化 |
| **jest-axe** | Jest 集成 |
| **cypress-axe** | Cypress 集成 |
| **Accessibility Insights** | Microsoft 出品，分 FastPass / Assessment |
| **Chrome DevTools Accessibility panel** | 查看可访问性树、对比度、强制颜色模式 |
| **WebAIM Contrast Checker** | 在线对比度检查 |
| **Stark（Figma 插件）** | 设计阶段对比度 + 色盲模拟 |

> 自动化工具能查约 30~40% 的 a11y 问题，剩下的需手动键盘测试 + 屏幕阅读器实测。

## 官方资源

- WCAG 2.2 标准：[https://www.w3.org/TR/WCAG22/](https://www.w3.org/TR/WCAG22/)
- WCAG 2.2 What's New：[https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/](https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/)
- WCAG 2.2 Understanding：[https://www.w3.org/WAI/WCAG22/Understanding/](https://www.w3.org/WAI/WCAG22/Understanding/)
- ARIA Authoring Practices Guide (APG)：[https://www.w3.org/WAI/ARIA/apg/](https://www.w3.org/WAI/ARIA/apg/)
- ARIA 1.2 标准：[https://www.w3.org/TR/wai-aria-1.2/](https://www.w3.org/TR/wai-aria-1.2/)
- MDN Accessibility：[https://developer.mozilla.org/en-US/docs/Web/Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- MDN ARIA：[https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA)
- web.dev Learn Accessibility：[https://web.dev/learn/accessibility](https://web.dev/learn/accessibility)
- W3C WAI Tutorial - H101 landmark：[https://www.w3.org/WAI/WCAG22/Techniques/html/H101](https://www.w3.org/WAI/WCAG22/Techniques/html/H101)
- W3C WAI Technique C45（:focus-visible）：[https://www.w3.org/WAI/WCAG22/Techniques/css/C45](https://www.w3.org/WAI/WCAG22/Techniques/css/C45)
- WAI-ARIA Names & Descriptions：[https://www.w3.org/TR/wai-aria-practices-1.2/#naming_and_describing](https://www.w3.org/TR/wai-aria-practices-1.2/#naming_and_describing)
- WebAIM Contrast Checker：[https://webaim.org/resources/contrastchecker/](https://webaim.org/resources/contrastchecker/)
- WCAG GitHub：[https://github.com/w3c/wcag](https://github.com/w3c/wcag)
- ARIA Practices GitHub：[https://github.com/w3c/aria-practices](https://github.com/w3c/aria-practices)
