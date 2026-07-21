---
layout: doc
---

# 交互优化

交互优化（Interaction Optimization）是前端 UX 维度的体验工程，关注「**用户操作后的感知与反馈**」这一核心命题。它不是性能指标的另一个名字，而是把性能、可访问性、视觉稳定、表单 UX、状态设计这五件事拧成一根用户感知的链条：**骨架屏**让加载等待不再撞布局（防 CLS）、**乐观更新**让操作即时反馈失败再回滚、**NN/g 三档响应时间限制**（0.1s / 1s / 10s）把延迟与反馈方式对号入座、**WCAG 触摸目标**（2.5.8 AA 24×24 / 2.5.5 AAA 44×44）保证手指可点、**表单 UX**（实时验证 / `autocomplete` / 错误识别 3.3.1 与建议 3.3.3）让输入不出错、**错误 / 空状态**把死胡同变成行动入口、**`aria-busy` / `aria-live`** 让屏幕阅读器用户也能感知状态变化。本章把这些散落在 W3C WAI、Nielsen Norman Group、web.dev、MDN 与 TanStack / React 文档里的官方结论汇成一条「从感知到反馈」的工程主线，并明确边界——**防抖节流的性能维度归「性能优化·事件属性叶」**，本叶只讲 UX 维度。

## 评价

**优点**

- **以感知为锚**：所有手段都回答「用户此刻感受到了什么」，不空谈指标，骨架屏防位移、乐观更新即时反馈、触摸目标可达、表单实时验证都直接落到「体验快/准/稳」
- **官方权威可循**：响应时间三档来自 NN/g 经典研究、触摸目标与错误提示是 WCAG 2.1/2.2 准则、CLS 阈值是 Core Web Vitals 官方标准、乐观更新范式是 TanStack / React 19 官方推荐
- **可量化验收**：CLS ≤ 0.1、触摸目标 24/44 px、响应时间 0.1/1/10s 都是工程可测的硬阈值，能写进 CI 断言
- **框架无关**：核心是用户感知规律与无障碍标准，Vue / React / 原生 JS 都能落地；React 19 `useOptimistic` / TanStack Query `onMutate` 仅作实现注脚
- **覆盖完整感知链**：加载 → 反馈 → 操作 → 输入 → 状态全闭环，避免「只做骨架屏忽视错误提示」式的局部优化

**缺点**

- **易与性能优化混淆**：骨架屏防 CLS 常被误归性能章，本叶只引用 CLS 作度量目标，不展开字体 `size-adjust` / bfcache 等性能手段
- **WCAG 准则版本敏感**：2.5.8 Target Size (Minimum) 是 WCAG 2.2（2023-10-05 正式发布）新增 AA 项，老资料常缺；2.5.5 Target Size (Enhanced) 是 2.1 起的 AAA
- **乐观更新有竞态陷阱**：不 `cancelQueries` 就 `setQueryData` 会被后台 refetch 旧数据覆盖（TanStack discussion #10712），三回调链缺一不可
- **aria-live 用错比不用更糟**：多个 `aria-live="assertive"` 区域并存会让读屏软件互相打断；`role="alert"` 仅限紧急错误
- **过度反馈也是反模式**：NN/g 实测加载 <1s 放骨架屏 / spinner 反而让用户觉得「跟不上节奏」，是负优化
- **触摸目标例外项多**：2.5.8 有 5 个例外（Spacing / Equivalent / Inline / User Agent Control / Essential），简单看尺寸容易误判合规

## 文档地址

- [Nielsen Norman Group - Response Times: The 3 Important Limits](https://www.nngroup.com/articles/response-times-3-important-limits/)
- [Nielsen Norman Group - Skeleton Screens 101](https://www.nngroup.com/articles/skeleton-screens/)
- [Nielsen Norman Group - Designing Empty States](https://www.nngroup.com/articles/empty-state-interface-design/)
- [W3C WAI - WCAG 2.2 Understanding（2.5.8 / 2.5.5 / 1.3.5 / 3.3.1 / 3.3.3 / 3.3.4）](https://www.w3.org/WAI/WCAG22/Understanding/)
- [web.dev - Optimize Cumulative Layout Shift](https://web.dev/articles/optimize-cls)
- [MDN - ARIA Live Regions / aria-busy](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Guides/Live_regions)
- [TanStack Query v5 - Optimistic Updates](https://tanstack.com/query/v5/docs/framework/react/guides/optimistic-updates)

## GitHub地址

- [whatwg/html（HTML `autocomplete` 标准 token 列表）](https://github.com/whatwg/html)
- [TanStack/query（乐观更新三回调链源实现）](https://github.com/TanStack/query)

## 幻灯片地址

<a href="/SlideStack/interaction-optimization-slide/" target="_blank">交互优化</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=689" target="_blank" rel="noopener noreferrer">交互优化 测试题</a>

> 待回填：题目入库后，将上面链接的 `category=689` 替换为实际分类 ID（见 `apps/quiz-backend/prisma/content/interaction-optimization.json` 导入后回填的 categoryId）。
