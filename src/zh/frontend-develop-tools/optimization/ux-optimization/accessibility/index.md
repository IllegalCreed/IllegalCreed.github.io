---
layout: doc
---

# 可访问性

可访问性（Accessibility，常缩写为 **a11y**，因首尾 a/y 之间有 11 个字母）是前端工程里关于「**让所有人都能用**」的维度——视障、听障、运动障碍、认知障碍、临时性损伤（手腕扭伤）、情境性限制（强光下看屏、单手抱娃）都会改变用户与界面的交互方式。它的官方基线是 W3C 的 **WCAG 2.2**（Web Content Accessibility Guidelines 2.2，2023-10-05 正式发布为 W3C Recommendation），按 A（必须）/ AA（业界合规基线）/ AAA（增强，特定场景）三级共 86 条 Success Criteria（SC）组织，配套 **WAI-ARIA 1.2**（W3C Recommendation，稳定）补 HTML 语义不足、**HTML5 landmark 元素**（`<main>` / `<nav>` / `<header>` / `<footer>` / `<aside>` / `<search>`）提供页面骨架、**CSS `:focus-visible`** 伪类（W3C WCAG 2.2 技法 C45）提供键盘焦点指示。WCAG 2.2 在 2.1 基础上新增 9 条 SC（含 **2.5.8 Target Size Minimum** 要求点击目标 ≥ 24×24 CSS px、**2.4.11 Focus Not Obscured (Minimum)** 焦点不被遮挡）、同时移除 4.1.1 Parsing（已被 HTML5 取代），是当前生产合规的事实基线。WCAG 3.0（前身 Silver）仍为草案，**不要在生产合规要求中引用**。本章不涉及自动化测试工具（axe-core / Lighthouse a11y / pa11y / jest-axe / cypress-axe）——它们归「前端测试章·可访问性测试叶」，本叶只讲 a11y 设计实践与准则本身。

## 评价

**优点**

- **官方权威、合规有据**：WCAG 是 W3C 正式推荐标准，欧盟 EN 301 549、美国 ADA / Section 508、中国 GB/T 37668 均直接引用 WCAG；按 A/AA/AAA 三级即可对齐合规要求
- **可工程化验收**：4.5:1 对比度、24×24 CSS px 触摸目标、`:focus-visible` 焦点环、`role="alert"` / `aria-live` 实时通知都是可写进 CI 的硬阈值
- **「第一规则」减负**：ARIA 第一规则——能用原生 HTML 就别用 ARIA 重写——意味着多数 a11y 是「换对 HTML 元素 + 加 label」级别的低成本改造
- **不止服务残障用户**：跳过链接（skip-link）帮键盘用户也帮高级用户、对比度帮色弱也帮强光下看屏、`:focus-visible` 帮键盘用户也帮鼠标用户（不闪焦点环）、`prefers-reduced-motion` 帮前庭功能障碍也帮省电模式
- **与 SEO / 性能协同**：语义化 landmark 同时利于搜索引擎抓取、`alt` 文本利于图片 SEO、`prefers-reduced-motion` 减少动画降低渲染负担

**缺点**

- **AA 级门槛依然很高**：4.5:1 对比度常与品牌色冲突；2.5.8 Target Size 24×24 CSS px 在密集列表里难腾空间；2.4.11 Focus Not Obscured 要求 sticky header / cookie banner 不能盖住焦点元素，需重新设计滚动行为
- **自动化只能查 30~40%**：axe-core / Lighthouse a11y 能查 DOM 结构与对比度，但查不了「`aria-label` 文案是否准确」「键盘流是否符合视觉顺序」「`role="alert"` 是否用在该用的场景」——必须手动 + 屏幕阅读器实测
- **屏幕阅读器差异大**：NVDA / JAWS / VoiceOver 三大主流对 ARIA 的实现细节有差异（特别是 `aria-live` 触发时机与 `aria-describedby` 朗读顺序），全测一遍成本高
- **WCAG 2.2 新 SC 落地难**：2.5.8 Target Size 有 5 个例外（Spacing / Equivalent / Inline / User Agent Control / Essential），简单看尺寸容易误判合规；2.4.11 Focus Not Obscured 的「不被覆盖」粒度需明确滚动容器
- **过度 ARIA 比不用更糟**：`aria-hidden="true"` 加在可聚焦元素上 = 焦点黑洞；`role="alert"` 滥用 = 读屏软件被频繁打断；正数 `tabindex` 重排 = 维护灾难——「ARIA 滥用」比「无 ARIA」更危险
- **WCAG 3.0 草案评分模型不兼容**：业界在 2.x 与 3.0 间过渡，3.0 尚无明确时间表，企业合规目标仍按 2.x 设定

## 文档地址

- [W3C WAI - WCAG 2.2 官方推荐标准](https://www.w3.org/TR/WCAG22/)
- [W3C WAI - What's New in WCAG 2.2](https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/)
- [W3C WAI - WCAG 2.2 Understanding（各 SC 详解）](https://www.w3.org/WAI/WCAG22/Understanding/)
- [W3C WAI - ARIA Authoring Practices Guide (APG)](https://www.w3.org/WAI/ARIA/apg/)
- [MDN Web Docs - Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [MDN Web Docs - ARIA](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA)
- [web.dev - Learn Accessibility](https://web.dev/learn/accessibility)
- [W3C WAI - Names & Descriptions](https://www.w3.org/TR/wai-aria-practices-1.2/#naming_and_describing)

## GitHub地址

- [w3c/wcag（WCAG 标准仓库）](https://github.com/w3c/wcag)
- [w3c/aria-practices（ARIA APG）](https://github.com/w3c/aria-practices)
- [mdn/content（MDN 文档源）](https://github.com/mdn/content)

## 幻灯片地址

<a href="/SlideStack/accessibility-slide/" target="_blank">可访问性</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=691" target="_blank" rel="noopener noreferrer">可访问性 测试题</a>
