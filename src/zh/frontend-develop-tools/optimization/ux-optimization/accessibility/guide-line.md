---
layout: doc
outline: [2, 3]
---

# 深入指南

> 基于 W3C WAI（WCAG 2.2 / WAI-ARIA 1.2 / ARIA APG / H101 / C45）、MDN Web Docs、web.dev Learn Accessibility 官方文档编写，对照 WCAG 2.2（2023-10-05 发布）与 2026-07 浏览器现状

## 速查

- **ARIA 第一规则**：能用原生 HTML 就别用 ARIA 重写（如优先 `<button>` 而非 `<div role="button">`）
- **ARIA 三层**：**roles**（角色，如 `role="alert"` / `role="navigation"`）/ **states**（状态，如 `aria-expanded` / `aria-checked`）/ **properties**（属性，如 `aria-label` / `aria-describedby`）
- **aria-hidden 陷阱**：`aria-hidden="true"` 绝不能加在可聚焦元素或其祖先上（屏幕阅读器看不见但键盘仍能 Tab 进入 = 焦点黑洞）
- **role=alert / status**：`role="alert"` 隐式 `aria-live="assertive"` + `aria-atomic="true"`，仅紧急错误；`role="status"` 隐式 `polite` + `atomic`，普通通知
- **aria-live 默认 off**：不写 `aria-live` 属性则不通知；要用必须显式 `polite` / `assertive`
- **aria-label vs aria-labelledby**：`aria-label` 直接给文本；`aria-labelledby` 引用页面上某个元素的 ID（让可见文本就是 accessible name，**别用 aria-label 覆盖可见文本**）
- **键盘三件套**：Tab 顺序（DOM 自然顺序，别用正数 tabindex）/ `:focus-visible`（仅键盘显示焦点环）/ 跳过链接（skip-link，对应 SC 2.4.1 Bypass Blocks）
- **tabindex**：`0`=加入 Tab 序、`-1`=可编程 focus 但不在 Tab 序、正数=禁用（打乱 DOM 自然顺序，业界共识反对）
- **HTML5 landmark**：`<main>`→main（每页唯一）/ `<header>`→banner / `<nav>`→navigation / `<footer>`→contentinfo / `<aside>`→complementary / `<section>`→region（需命名）/ `<search>`→search（2023 新元素）
- **跳过链接**：放页首首个可聚焦位置、默认视觉隐藏、`:focus` 显现、目标 `<main>` 设 `tabindex="-1"` 才能真正接收焦点
- **对比度 1.4.3 (AA)**：普通文字 **≥ 4.5:1**、大字（≥18pt 或 ≥14pt 粗体）**≥ 3:1**；AAA（1.4.6）7:1 / 4.5:1；非文字 UI（1.4.11）≥ 3:1
- **prefers-reduced-motion**：CSS `@media (prefers-reduced-motion: reduce)`，对应 SC 2.3.3 Animation from Interactions (AAA) + SC 2.2.2 Pause, Stop, Hide (A)
- **焦点管理**：模态打开时焦点移入 + focus trap；关闭时焦点回到触发器；SPA 路由切换后手动 focus 新页面 `<main>` / h1
- **反模式**：`<div role="button">` 替 `<button>` / `outline: none` 不补替代 / 正数 tabindex / 多个未命名 landmark / `aria-hidden` 加可聚焦元素 / 装饰图标加 alt 文本 / 纯颜色编码信息

## 一、ARIA 第一规则与三层语义

### ARIA 第一规则

> **能用原生 HTML 元素时不要用 ARIA 重写。**

原生 HTML 元素自带键盘交互、焦点管理和隐式 ARIA 角色——`<button>` 自动可 Tab、自动响应 Enter / Space、自动 `role="button"`；`<div role="button">` 需要手动加 `tabindex="0"`、`keydown` 处理 Enter / Space、`disabled` 状态、`aria-pressed` 等。ARIA 是补丁，不是替代。

**反模式**：

```html
<!-- 错：用 div 重写 button，缺键盘交互 -->
<div role="button" onclick="submit()">提交</div>

<!-- 对：用原生 button，自动有键盘、焦点、disabled -->
<button type="submit">提交</button>
```

### ARIA 三层

| 层 | 作用 | 例子 |
| --- | --- | --- |
| **roles**（角色） | 元素是什么 | `role="alert"` / `role="navigation"` / `role="dialog"` / `role="tablist"` |
| **states**（状态） | 元素当前状态（动态变化） | `aria-expanded="true"` / `aria-checked="true"` / `aria-current="page"` / `aria-invalid="true"` / `aria-disabled="true"` |
| **properties**（属性） | 元素的附加语义（较静态） | `aria-label="关闭"` / `aria-labelledby="title-id"` / `aria-describedby="hint-id"` / `aria-hidden="true"` / `aria-live="polite"` |

> 隐式映射：现代浏览器会把 HTML 元素隐式映射到 ARIA 角色（如 `<button>` → `role="button"`、`<nav>` → `role="navigation"`），写 HTML 就有这些语义，不必再补 `role`。

## 二、命名与描述：aria-label / aria-labelledby / aria-describedby

**accessible name** 是屏幕阅读器念出来的「元素名字」，每个交互元素都必须有非空 accessible name（W3C ACT Rule 97a4e1）。

### aria-label（直接给文本）

适合纯图标按钮、`<nav>` 区分多个同名 landmark：

```html
<button aria-label="关闭" onclick="close()">
  <svg>...</svg>
</button>

<nav aria-label="主导航">...</nav>
<nav aria-label="页脚导航">...</nav>
```

### aria-labelledby（引用页面文本 ID）

让页面上**已有的可见文本**作为 accessible name。优先用 `aria-labelledby` 而非 `aria-label`——这样可见文本与 accessible name 一致，对语音控制用户（如 Dragon）也友好。

```html
<h2 id="section-title">用户注册</h2>
<section aria-labelledby="section-title">...</section>
```

### aria-describedby（描述）

附加详细说明，屏幕阅读器在念完 accessible name 后会念 description：

```html
<label for="pwd">密码</label>
<input id="pwd" type="password" aria-describedby="pwd-hint" />
<p id="pwd-hint">至少 8 位，包含字母和数字</p>
```

> **反模式**：用 `aria-label` 覆盖按钮 / 链接的**可见文本**。可见文本与 accessible name 不一致会让语音控制用户混乱（如可见「详情」但 `aria-label="更多信息"`，用户喊「点击详情」识别不到）。

## 三、aria-hidden 陷阱与实时区

### aria-hidden="true" 的黑洞陷阱

`aria-hidden="true"` 把元素从可访问性树（accessibility tree）中移除，屏幕阅读器看不见它——但**键盘 Tab 仍然能进入**。

```html
<!-- 错：aria-hidden 加在可聚焦元素上 -->
<button aria-hidden="true">提交</button>

<!-- 结果：屏幕阅读器不念这个按钮，键盘用户却能 Tab 进去 -->
<!-- = 焦点跳到无名空间，用户混乱 -->
```

**铁律**：`aria-hidden="true"` 绝不能用在可聚焦元素或其祖先上。装饰性内容（图标、分隔线）才用。

### role="alert" 与 role="status"

| role | 隐式 aria-live | 隐式 aria-atomic | 用途 |
| --- | --- | --- | --- |
| `role="alert"` | **assertive** | true | 紧急错误（如表单提交失败、网络断开），立即打断读屏 |
| `role="status"` | **polite** | true | 普通通知（如购物车数量 +1、加载完成），等读屏空闲再念 |
| `role="log"` | polite（默认） | false | 日志流（如聊天记录） |

```html
<!-- 紧急错误：role="alert" -->
<div role="alert">登录失败，请检查用户名和密码</div>

<!-- 普通通知：role="status" -->
<div role="status" aria-live="polite">购物车已添加 1 件商品</div>
```

> **反模式**：多个 `aria-live="assertive"` 区域并存会让读屏软件互相打断；`role="alert"` 滥用（如所有提示都用 alert）会让用户烦躁。普通内联验证用 `polite`，仅紧急错误用 `alert`。

### aria-live 默认 off

不写 `aria-live` 属性 = 不通知。要让动态内容更新通知读屏，必须显式：

```html
<div aria-live="polite" aria-atomic="true">
  <span id="count">3</span> 项结果
</div>
```

- `aria-live`：`off`（默认）/ `polite`（空闲再念）/ `assertive`（立即打断）
- `aria-atomic`：`true`=每次更新念全部内容；`false`=只念变化部分
- `aria-relevant`：`additions` / `removals` / `text` / `all`（控制哪些变化要念）
- `aria-busy="true"`：临时屏蔽，等内容加载完成后再通知（设回 `false`）

## 四、键盘导航三件套

### Tab 顺序：用 DOM 自然顺序

WCAG SC 2.4.3 Focus Order (A) 要求 Tab 顺序符合视觉 / 逻辑顺序。最简单可靠的方式 = **用 DOM 自然顺序**，让 Tab 跟着视觉走。

**反模式：正数 tabindex**

```html
<!-- 错：用正数 tabindex 重排 Tab 顺序 -->
<input tabindex="1">
<input tabindex="2">
<input tabindex="3">
```

正数 tabindex 会强制按数字顺序而非 DOM 顺序 Tab，维护成本高、易出错，**业界共识反对**。

### tabindex 三种用法

| tabindex | 含义 | 用途 |
| --- | --- | --- |
| （不写） | 默认（可聚焦元素如 button / a / input） | 不要画蛇添足 |
| **`0`** | 加入 Tab 序（按 DOM 顺序） | 给非默认可聚焦元素（如 `<div role="button">`） |
| **`-1`** | 可编程 focus 但不在 Tab 序 | 跳过链接目标、模态聚焦、`scrollIntoView` 替代 |
| **正数** | **禁用**（强制重排） | 不要用 |

### :focus-visible（仅键盘显示焦点）

CSS `:focus-visible` 伪类（W3C WCAG 2.2 技法 C45）：仅在**键盘导航**时显示焦点指示器，鼠标点击不显示焦点环。这样既满足 SC 2.4.7 Focus Visible (AA) / SC 2.4.13 Focus Appearance (AAA)，又避免干扰鼠标用户。

```css
/* 错：outline: none 后不补替代，违反 SC 2.4.7 */
button { outline: none; }

/* 对：:focus-visible 仅键盘显示焦点环 */
button:focus { outline: none; }  /* 鼠标点击不显示 */
button:focus-visible {
  outline: 2px solid #005fcc;
  outline-offset: 2px;
}
```

> `:focus` vs `:focus-visible` vs `:focus-within`：`:focus` 任何聚焦都触发；`:focus-visible` 仅键盘触发；`:focus-within` 元素**或其子元素**任一聚焦都触发（适合表单组的整体高亮）。

### 跳过链接（skip-link）

WCAG SC 2.4.1 Bypass Blocks (A) 要求提供绕过重复导航的机制。最常见的实现是 **skip-link**——放页面**首个可聚焦元素**位置，默认视觉隐藏，`:focus` 时显现：

```html
<body>
  <!-- skip-link 放在最前 -->
  <a href="#main" class="skip-link">跳到主内容</a>
  <header>...重复的导航...</header>
  <main id="main" tabindex="-1">...</main>
</body>
```

```css
.skip-link {
  position: absolute;
  top: -100px;  /* 默认视觉隐藏 */
  left: 0;
}
.skip-link:focus {
  top: 0;  /* :focus 时显现 */
  background: #fff;
  padding: 8px 16px;
  z-index: 1000;
}
```

> **关键坑**：目标 `<main>` 必须设 `tabindex="-1"` 才能真正接收焦点（仅靠 `scrollIntoView` 不行），否则键盘 / 屏幕阅读器用户焦点仍滞留在原位。

### 焦点管理（模态 / SPA）

- **模态打开**：焦点移入模态第一个可聚焦元素 + 实现 focus trap（Tab 在模态内循环）
- **模态关闭**：焦点回到触发器（如点开「删除」按钮的用户，关闭模态后焦点回到「删除」按钮）
- **SPA 路由切换**：手动 `newMain.focus()` 新页面的 `<main>` / h1（设 `tabindex="-1"`），否则键盘 / 读屏用户焦点滞留原页

> 违反 SC 2.4.3 Focus Order (A)：用户 Tab 跳到原页面元素，读屏念错内容。

## 五、HTML5 语义化与 landmark

### HTML5 landmark 元素与隐式角色

| HTML 元素 | 隐式 ARIA 角色 | 说明 |
| --- | --- | --- |
| `<header>` | `banner` | 页面顶栏（每页一个；嵌套在 `<main>` 内则为 `section`） |
| `<nav>` | `navigation` | 导航区（多个时用 `aria-label` 区分） |
| **`<main>`** | **`main`** | **主内容区（每页唯一）** |
| `<aside>` | `complementary` | 侧边栏 / 相关内容 |
| `<footer>` | `contentinfo` | 页脚（每页一个） |
| `<section>` | `region`（需 `aria-label` / `aria-labelledby`） | 通用区域，未命名时不进 landmark 导航 |
| `<form>` | `form`（需命名） | 表单区 |
| `<search>` | `search` | **2023 新元素**，搜索区（替代 `<form role="search">`） |

### landmark 使用要点

```html
<body>
  <header>
    <nav aria-label="主导航">...</nav>
  </header>
  <main>
    <h1>页面标题</h1>
    <!-- 主内容 -->
  </main>
  <aside aria-label="相关推荐">...</aside>
  <footer>...</footer>
</body>
```

**反模式**：

- **多个未命名的同名 landmark**：多个 `<nav>` 不加 `aria-label` 区分，读屏的 landmark 快速导航失效（SC 1.3.1 Info and Relationships）
- **多个 `<main>`**：每页只能有一个 `<main>`，多个会让读屏混乱
- **`<div role="main">`**：能用 `<main>` 就别用 ARIA role（ARIA 第一规则）

## 六、对比度（SC 1.4.3 / 1.4.6 / 1.4.11）

### 对比度阈值完整表

| SC | 级别 | 普通文字 | 大字（≥18pt 或 ≥14pt 粗体） | 非文字 UI |
| --- | --- | --- | --- | --- |
| **1.4.3** Contrast (Minimum) | **AA** | **≥ 4.5:1** | **≥ 3:1** | - |
| 1.4.6 Contrast (Enhanced) | AAA | ≥ 7:1 | ≥ 4.5:1 | - |
| 1.4.11 Non-text Contrast | AA | - | - | ≥ 3:1 |

> 计算方式：**WCAG 相对亮度（relative luminance）公式**，不是视觉亮度。公式：(L1 + 0.05) / (L2 + 0.05)，L1 为较亮色，L2 为较暗色。

### 计算工具

- 浏览器 DevTools：Chrome / Firefox / Safari 都内置对比度检查器（Elements 面板选颜色时显示）
- 在线工具：[WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)、[WHO Contrast Checker](https://contrast-ratio.com/)
- Figma / Sketch： Stark / A11y - Color Contrast Checker 插件

### 易踩坑

- **品牌色常不达标**：品牌主色（如浅蓝、粉色）配白底往往低于 4.5:1，需调暗或加深
- **placeholder 文字**：默认 placeholder 颜色对比度常低于 4.5:1，且 placeholder 不能替代 `<label>`（SC 1.3.5 / 3.3.2）
- **禁用状态**：`disabled` 元素对比度可低，但要确保**不在交互流中**（SC 1.4.3 例外）
- **非文字 UI（1.4.11）**：图标按钮的图标、输入框边框、表单控件边界都要 ≥ 3:1

> 别凭肉眼判断对比度——视障（约 20/40 视力）用户才能辨识，4.5:1 是按低视力用户的感受反推出来的。

## 七、prefers-reduced-motion 与 prefers-color-scheme

### @media (prefers-reduced-motion: reduce)

对应 SC 2.3.3 Animation from Interactions (AAA) + SC 2.2.2 Pause, Stop, Hide (A)。

```css
/* 默认：有动画 */
.fade-in {
  animation: fadeIn 0.5s ease;
}

/* 前庭功能障碍用户：减弱动画 */
@media (prefers-reduced-motion: reduce) {
  .fade-in {
    animation: none;
    /* 或：动画时长极短 + 无位移 */
  }
  * {
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
  }
}
```

> 前庭功能障碍用户对大幅动画（视差、平移、缩放）可能眩晕、诱发不适，需提供「减弱」选项。自动播放 / 闪烁内容另需暂停 / 关闭控件（SC 2.2.2）。

### @media (prefers-color-scheme: dark)

不是 WCAG 准则，但 a11y 相关——低视力用户、强光环境下用户偏好暗色。

```css
:root {
  --bg: #ffffff;
  --fg: #1a1a1a;
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: #1a1a1a;
    --fg: #f0f0f0;
  }
}

body {
  background: var(--bg);
  color: var(--fg);
}
```

> SC 1.4.3 对比度在两种模式下都要达标——暗色模式不能简单反色，要重新算对比度。

## 八、信息不只靠颜色（SC 1.4.1 Use of Color）

WCAG SC 1.4.1 (A) Use of Color 要求：信息不能**只靠颜色**传达。

**反模式**：

```html
<!-- 错：错误状态只把边框变红，色盲用户看不出 -->
<input class="error" style="border: 2px solid red" />
```

**正确做法**：

```html
<!-- 对：颜色 + 图标 + 文字 -->
<input class="error" style="border: 2px solid red" aria-invalid="true" />
<span class="error-text">
  <svg aria-hidden="true">⚠</svg> 请输入有效的邮箱
</span>
```

> 色盲（约 8% 男性）用户无法感知纯颜色差异，必填项只用红色星号、错误状态只变红边框都是反模式。

## 九、装饰性图标处理

| 图标类型 | 处理 | 例子 |
| --- | --- | --- |
| **装饰图标**（仅美化） | `<svg aria-hidden="true">` 或 `<img alt="">` | 分隔线、背景图案 |
| **按钮内图标**（按钮有可见文本） | `<svg aria-hidden="true">`（accessibility name 用文本） | 「`<svg>` 保存」 |
| **纯图标按钮**（无文本） | `<button aria-label="保存"><svg aria-hidden="true">...</svg></button>` | 关闭、菜单按钮 |
| **信息图标**（图标本身传达信息） | `<img alt="警告">` 或 `<svg role="img" aria-label="警告">` | 状态指示器 |

**反模式**：在装饰性图标上误用 alt 文本或 aria-label 把图标名念出来——读屏会念「分隔线」「箭头」等噪音，干扰主内容。

## 十、焦点管理与 SPA / 模态

### 模态对话框

```html
<div role="dialog" aria-modal="true" aria-labelledby="dialog-title">
  <h2 id="dialog-title">确认删除</h2>
  <!-- 第一个可聚焦元素自动接收焦点 -->
  <button>取消</button>
  <button>确认</button>
</div>
```

要点：

1. 打开时焦点移入模态第一个可聚焦元素（或模态容器本身）
2. **focus trap**：Tab 在模态内循环（最后一个元素 Tab 回到第一个）
3. 关闭时焦点回到**触发器**（不是回到页面顶部）
4. Esc 键关闭模态

### SPA 路由切换

```js
// 路由切换后手动 focus 新页面 main
const main = document.querySelector('main');
main.setAttribute('tabindex', '-1');
main.focus();
```

> 不手动 focus 的话，键盘 / 读屏用户焦点滞留原页，读屏念错内容。

## 反模式（避坑）

- **`<div role="button">` 替 `<button>`**：漏键盘交互（Enter / Space）、焦点管理、`disabled` —— ARIA 第一规则
- **`aria-hidden="true"` 加可聚焦元素或其祖先**：屏幕阅读器看不见但键盘能 Tab 进入 = 焦点黑洞
- **`outline: none` 后不补替代焦点样式**：直接违反 SC 2.4.7 Focus Visible
- **用 `aria-label` 覆盖可见文本**：可见文本与 accessible name 不一致，语音控制用户混乱
- **滥用正数 tabindex 重排 Tab 顺序**：打乱 DOM 自然顺序，维护灾难
- **多个未命名的同名 landmark**（多个 `<nav>` 不加 `aria-label`）：读屏 landmark 导航失效
- **多个 `aria-live="assertive"` 并存**：读屏互相打断
- **`role="alert"` 滥用**：所有提示都 alert，用户烦躁
- **自动播放轮播无暂停控件**：违反 SC 2.2.2 Pause, Stop, Hide
- **纯颜色编码信息**（错误状态只变红边框、必填项只红星号）：违反 SC 1.4.1 Use of Color
- **装饰性图标加 alt 或 aria-label**：读屏念「分隔线」「箭头」等噪音
- **placeholder 替代 `<label>`**：对比度常不足且违反 SC 3.3.2 Labels or Instructions
- **模态关闭后焦点回不到触发器**：违反 SC 2.4.3 Focus Order
- **SPA 路由切换不手动 focus**：读屏念错内容
- **跳过链接目标不设 `tabindex="-1"`**：仅 `scrollIntoView` 不行，焦点仍滞留
- **WCAG 3.0 用于生产合规要求**：3.0 仍是草案，评分模型与 2.x 不兼容，过渡期未定

## 下一步

- [参考](./reference.md)：WCAG 准则完整表、ARIA 属性表、对比度表、官方资源链接
