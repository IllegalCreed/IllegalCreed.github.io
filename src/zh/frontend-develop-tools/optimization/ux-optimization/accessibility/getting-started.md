---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 W3C WAI（WCAG 2.2 / WAI-ARIA 1.2 / ARIA APG）、MDN Web Docs、web.dev Learn Accessibility 官方文档编写，对照 WCAG 2.2（2023-10-05 发布）与 2026-07 浏览器现状

## 速查

- **a11y** = accessibility（首尾 a/y 之间 11 个字母），让所有人（视障 / 听障 / 运动障碍 / 认知障碍 / 临时损伤 / 情境限制）都能用
- **官方基线**：**WCAG 2.2**（W3C Recommendation 2023-10-05），新增 9 条 SC + 移除 4.1.1 Parsing；**WCAG 3.0 仍是草案**，不要在生产合规要求里引用
- **WCAG 四大原则 POUR**：**P**erceivable 可感知 / **O**perable 可操作 / **U**nderstandable 可理解 / **R**obust 健壮
- **三级合规**：A（必须，30 条）/ AA（业界基线，20 条新增）/ AAA（增强，特定场景）
- **WCAG 2.2 新增 9 SC**：2.4.11 Focus Not Obscured (Min, AA) / 2.4.12 (Enhanced, AAA) / 2.4.13 Focus Appearance (AAA) / 2.5.7 Dragging Movements (AA) / **2.5.8 Target Size (Minimum, AA, 24×24 CSS px)** / 3.2.6 Consistent Help (A) / 3.3.7 Redundant Entry (A) / 3.3.8 Accessible Authentication (Min, AA) / 3.3.9 (Enhanced, AAA)
- **对比度阈值**（SC 1.4.3）：普通文字 **≥ 4.5:1**、大字（≥18pt 或 ≥14pt 粗体）**≥ 3:1**；AAA（1.4.6）7:1 / 4.5:1
- **ARIA 第一规则**：能用原生 HTML 元素（`<button>` / `<nav>` / `<main>`）就别用 ARIA 重写（如别用 `<div role="button">` 替 `<button>`）
- **三大屏幕阅读器**：**NVDA**（Windows，免费，配 Chrome / Firefox）/ **JAWS**（Windows，付费，配 Chrome / Edge）/ **VoiceOver**（macOS / iOS，系统内置，配 Safari）
- **边界**：axe-core / Lighthouse a11y / pa11y / jest-axe / cypress-axe 等自动化测试工具的 API、断言写法、CI 集成 → 归**前端测试章·可访问性测试叶**；本叶只讲 a11y 设计实践与准则本身

## a11y 是什么

可访问性（Accessibility）是关于「**让所有人都能用界面**」的工程维度，覆盖的人群远比「视障」广：

| 用户类型 | 例子 | 典型 a11y 手段 |
| --- | --- | --- |
| **视觉障碍** | 全盲、低视力、色弱、色盲 | 屏幕阅读器、对比度 4.5:1、不只靠颜色传信息 |
| **听觉障碍** | 全聋、重听 | 视频字幕 / 手语、文本替代 |
| **运动障碍** | 手腕扭伤、震颤、无手 | 键盘导航、语音控制、大触摸目标 |
| **认知障碍** | 阅读障碍、记忆力差、注意力缺陷 | 清晰布局、可预测交互、`autocomplete` |
| **情境性限制** | 强光下看屏、单手抱娃、移动中 | 高对比、单手可达、`prefers-reduced-motion` |

> 「临时性损伤」（手腕扭伤）和「情境性限制」（强光下看屏）也算 a11y 受益人群——这是为什么 a11y 不是「为残障用户做的小众优化」，而是「为所有人在某些时刻的可用性」。

## WCAG 四大原则 POUR

WCAG 把所有准则归到四大原则之下（POUR）：

| 原则 | 含义 | 典型 SC |
| --- | --- | --- |
| **P**erceivable（可感知） | 信息和 UI 必须能被用户感知（看得见、听得见、读屏能念出来） | 1.1 文本替代、1.4 对比度、1.3 适应性 |
| **O**perable（可操作） | UI 必须能被各种方式操作（鼠标、键盘、触摸、语音） | 2.1 键盘可达、2.4 导航、2.5 输入方式 |
| **U**nderstandable（可理解） | 内容和操作必须可理解 | 3.1 可读、3.2 可预测、3.3 输入辅助 |
| **R**obust（健壮） | 必须能被各种用户代理（含辅助技术）可靠解析 | 4.1 兼容（含 ARIA） |

> 每条准则（Guideline）下有若干 SC（Success Criteria），SC 是可机器或人工判定的「达标 / 不达标」三态（A / AA / AAA），是 WCAG 合规验收的硬指标。

## WCAG 三级合规

| 级别 | 含义 | 数量 | 业界惯例 |
| --- | --- | --- | --- |
| **A** | 必须，最低门槛 | 30 条 | 任何面向公众的站点都应满足 |
| **AA** | 业界合规基线 | 20 条新增 | 欧盟 EN 301 549、美国 Section 508 都按 AA 要求 |
| **AAA** | 增强，特定场景 | 28 条 | 不是所有内容都能满足 AAA，仅特殊场景适用 |

> 多数企业合规目标 = WCAG 2.2 Level AA（含 A + AA 共 50 条 SC）。

## WCAG 2.2 新增 9 条 SC

WCAG 2.2（2023-10-05 正式发布）在 2.1 基础上新增 9 条 SC，并移除了 4.1.1 Parsing（HTML5 已让 HTML 解析容错，该 SC 失去意义）：

| SC | 名称 | 级别 | 核心要求 |
| --- | --- | --- | --- |
| **2.4.11** | Focus Not Obscured (Minimum) | AA | 焦点元素不能被 sticky header / cookie banner 完全遮挡 |
| 2.4.12 | Focus Not Obscured (Enhanced) | AAA | 焦点元素不能被任何内容部分遮挡 |
| 2.4.13 | Focus Appearance | AAA | 焦点指示器尺寸 ≥ 2 CSS px，与相邻颜色对比度 ≥ 3:1 |
| 2.5.7 | Dragging Movements | AA | 拖拽操作需提供不需要拖拽的替代（如点击 + 方向键） |
| **2.5.8** | Target Size (Minimum) | AA | 可点击目标 ≥ **24×24 CSS px**（含 5 个例外） |
| 3.2.6 | Consistent Help | A | 同一站点 help 机制位置一致 |
| 3.3.7 | Redundant Entry | A | 多步表单已填信息不要让用户重复输入 |
| 3.3.8 | Accessible Authentication (Minimum) | AA | 登录不要强制记忆 / 转录密码外的认知测试 |
| 3.3.9 | Accessible Authentication (Enhanced) | AAA | 进一步禁止所有认知测试 |

> 注意 **2.5.8 Target Size (Minimum)** 是 24×24 CSS px（AA，2.2 新增），而 **2.5.5 Target Size (Enhanced)** 是 44×44 CSS px（AAA，2.1 就有）；两者是「最低」与「增强」关系，AA 合规只需 24×24。

## 三大主流屏幕阅读器

| 读屏软件 | 平台 | 价格 | 推荐浏览器 |
| --- | --- | --- | --- |
| **NVDA** | Windows | 免费（开源） | Chrome / Firefox |
| **JAWS** | Windows | 付费（企业主流） | Chrome / Edge |
| **VoiceOver** | macOS / iOS | 系统内置 | Safari |

> 移动端另有 **TalkBack**（Android，系统内置，配 Chrome）。

## 下一步

- [WCAG 2.2 / ARIA / 键盘 / 语义化 HTML / 对比度 深入](./guide-line.md)：各 SC 详解 + ARIA 用法 + 焦点管理 + 反模式
- [参考](./reference.md)：WCAG 准则完整表、ARIA 属性表、对比度表、官方资源链接
