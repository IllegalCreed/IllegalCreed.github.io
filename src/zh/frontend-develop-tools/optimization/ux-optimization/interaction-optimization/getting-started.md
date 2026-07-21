---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Nielsen Norman Group（Response Times / Skeleton Screens / Empty States）、W3C WAI WCAG 2.2 Understanding、web.dev CLS、MDN ARIA Live / aria-busy、TanStack Query v5 官方文档编写，对照 2026-07 浏览器与框架现状

## 速查

- **NN/g 三档响应时间限制**：**0.1s**（瞬时直接操控感，无需反馈）/ **1s**（思路不中断，可略延迟但需 spinner）/ **10s**（注意力上限，需 percent-done 进度条与可中断）
- **CLS 三档阈值**（Core Web Vitals 官方）：良好 **≤ 0.1**（需覆盖 ≥75% 访问）/ 需改善 0.1–0.25 / 差 > 0.25；CLS 是**无单位分数**（区别于 LCP/INP 的毫秒）
- **CLS 500ms 宽限**：用户交互后 500ms 内发生的位移不计入 CLS（视为预期位移）；但滚动后懒加载内容造成的位移**算入**
- **触摸目标 WCAG**：2.5.8 (AA) 最低 **24×24 CSS px**；2.5.5 (AAA) 增强 **44×44 CSS px**；2.5.8 有 5 个例外（Spacing / Equivalent / Inline / User Agent Control / Essential）
- **骨架屏选型**：**<1s 完全不放反馈**（NN/g 实测闪一下是负优化）；2–10s 骨架屏 / spinner 任选（骨架屏适合整页，spinner 适合单个模块）；**>10s 必须用进度条**
- **乐观更新三回调链**（TanStack Query v5）：`onMutate`（`cancelQueries` → 存快照 → `setQueryData` 乐观值）→ `onError`（用 `context.previousData` 回滚）→ `onSettled`（`invalidateQueries` 与服务端对齐）
- **WCAG 1.3.5 (AA) Identify Input Purpose**：用 HTML `autocomplete` 标准 token（`name` / `email` / `tel` / `bday` / `username` 等）；技术 H98，失败 F107；`type=email` 太粗不满足「用途」粒度
- **错误三阶梯**：3.3.1 (A) Error Identification 识别错误 → 3.3.3 (AA) Error Suggestion 给修正建议 → 3.3.4 (AA) Error Prevention 法律/财务/删数据类操作可撤销 | 检查 | 二次确认
- **ARIA Live**：`role="alert"` 等价 `aria-live="assertive"`，**仅用于紧急错误**；普通内联验证用 `aria-live="polite"`；多个 assertive 区域并存是反模式
- **骨架屏无障碍三件套**：`aria-busy="true"` 标记加载中容器 / `aria-live="polite"` 通知内容就绪 / `@media (prefers-reduced-motion: reduce)` 关闭 shimmer
- **图片防位移正确做法**：HTML 写 `width` + `height` 属性（无单位像素值），浏览器据此自动算 `aspect-ratio` 预留空间；移除预留空间本身也会造成 CLS
- **边界**：防抖 / 节流的「性能维度」归性能优化·事件属性叶，本叶只讲 UX 维度

## 什么是「交互优化」

交互优化不是「让代码跑得更快」，而是回答一个用户感知问题：**用户做了操作，页面在 0.1s / 1s / 10s 各应该给他看到什么？** 它把以下散点串成一条「感知-反馈」主线：

- **加载感知**：骨架屏 / spinner / 进度条（按等待时长选型）+ 防位移（CLS ≤ 0.1）
- **操作感知**：乐观更新（即时反馈 + 失败回滚）+ NN/g 三档响应时间限制
- **触控感知**：触摸目标 24×24 (AA) / 44×44 (AAA)
- **输入感知**：表单实时验证（blur 触发而非 keystroke）+ `autocomplete` 标准 token + 错误识别与建议
- **状态感知**：错误状态 / 空状态 / `aria-busy` / `aria-live` 让屏幕阅读器用户也能感知变化

> 与性能优化的边界：防抖 / 节流的「调度算法」、RAIL 模型的性能预算、`requestAnimationFrame` / `requestIdleCallback`、Web Worker、虚拟列表 / 时间切片 → 归**性能优化·事件属性叶**。本叶只把 CLS 当作「骨架屏防位移的度量目标」引用，不展开 CLS 的性能优化手段（字体 `size-adjust`、bfcache 资格等归性能章）。

## NN/g 三档响应时间限制

Nielsen Norman Group 经典研究（基于 Miller、Card、Shneiderman 等学者结论）把响应时间分成三档，每档对应不同的用户感知与反馈方式：

| 等待时长 | 用户感知 | 反馈方式 |
| --- | --- | --- |
| **< 0.1s** | 瞬时、直接操控感（点击即响应） | **无需反馈**——感官上因果连为一体 |
| **0.1s – 1s** | 思路不中断，可察觉的延迟 | 可略延迟，无需显式进度，但需要 spinner 一类轻量提示 |
| **1s – 10s** | 思路被打断，注意力开始流失 | 需要 spinner / 骨架屏等明确反馈 |
| **> 10s** | 注意力上限，用户开始焦虑、想离开 | **必须用 percent-done 进度条 + 可中断**（取消按钮） |

> **关键结论**：加载 <1s 放骨架屏或 spinner 反而是负优化——NN/g 实测闪一下让用户感觉「跟不上节奏」。反馈只在 ≥1s 才有意义。

## 骨架屏 vs Spinner 速览

| 加载时长 | 推荐反馈 | 原因 |
| --- | --- | --- |
| **< 1s** | 不放任何反馈 | 闪一下反而让用户觉得「跟不上节奏」（NN/g） |
| **2 – 10s** | 骨架屏 或 spinner 二选一 | 骨架屏适合整页加载（占位与真实内容几何一致）；spinner 适合单个模块（按钮 loading、卡片局部刷新） |
| **> 10s** | **必须用进度条**（percent-done） | 长等待让用户焦虑，进度条 + 可中断才能留住用户 |

**骨架屏 vs Spinner 的核心区别**：

| 维度 | 骨架屏 | Spinner |
| --- | --- | --- |
| 信息量 | 暗示**页面结构**（图位 / 标题 / 卡片层级） | 只表示「在转」 |
| 防位移 | 占位与真实内容几何一致 → **CLS ≈ 0** | 不占位，加载完会撑开布局 → 可能引起 CLS |
| 适用 | 整页加载、首屏 | 局部刷新、按钮 loading |
| 反模式 | Frame-display（只画 header/footer + 空背景）= 等同 spinner，NN/g 不推荐 | 0.5s 内闪一下 spinner 是负优化 |

> **骨架屏的两个硬要求**：① 占位尺寸必须与最终内容盒模型匹配（含图位、标题、卡片层级），否则 CLS 仍会发生；② 容器加 `aria-busy="true"`，shimmer 动画用 `prefers-reduced-motion: reduce` 关闭（前庭敏感用户生理要求）。

## 速览：常用做法

```html
<!-- 1. 图片显式 width/height（防 CLS，浏览器自动算 aspect-ratio） -->
<img src="hero.webp" alt="..." width="800" height="600" decoding="async" />

<!-- 2. 广告位 / 嵌入兜底用 min-height（资源返回前预留空间） -->
<div class="ad-slot" style="min-height: 250px"></div>

<!-- 3. 骨架屏容器：aria-busy + 内容就绪用 aria-live 通知 -->
<section aria-busy="true" aria-live="polite">
  <div class="skeleton-card" />
  <div class="skeleton-card" />
</section>
```

```css
/* 4. shimmer 动画必须用 prefers-reduced-motion 降级 */
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
.skeleton {
  background: linear-gradient(90deg, #eee 25%, #f5f5f5 50%, #eee 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
@media (prefers-reduced-motion: reduce) {
  .skeleton { animation: none; background: #eee; }
}
```

```ts
// 5. 乐观更新三回调链（TanStack Query v5）
const mutation = useMutation({
  mutationFn: api.updateTodo,
  onMutate: async (newTodo) => {
    await queryClient.cancelQueries({ queryKey: ["todos"] });
    const previousData = queryClient.getQueryData(["todos"]);
    queryClient.setQueryData(["todos"], (old) => [...old, newTodo]);
    return { previousData }; // 传给 onError 回滚
  },
  onError: (_err, _newTodo, context) => {
    queryClient.setQueryData(["todos"], context.previousData);
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ["todos"] });
  },
});
```

> 写法不熟先看 [深入指南](./guide-line.md)；要查 WCAG 准则表、响应时间表、触摸目标表、ARIA、官方链接见 [参考](./reference.md)。

## 下一步

- [深入指南](./guide-line.md)：骨架屏防 CLS / 乐观更新三回调链 / 反馈即时性三档 / 触摸目标 WCAG / 表单 UX / 错误空状态 / `aria-busy` · `aria-live` / 反模式
- [参考](./reference.md)：WCAG 准则速查表 + 响应时间表 + 触摸目标表 + ARIA Live 用法 + 官方资源链接
