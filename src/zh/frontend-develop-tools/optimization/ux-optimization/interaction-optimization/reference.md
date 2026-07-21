---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Nielsen Norman Group、W3C WAI WCAG 2.2 Understanding、web.dev、MDN、TanStack Query v5 官方文档编写，对照 2026-07 现状

## 速查

- **NN/g 三档响应时间**：0.1s 瞬时 / 1s 思路不中断 / 10s 注意力上限需进度条
- **CLS 阈值**：≤ 0.1（良好）/ 0.1–0.25（需改善）/ > 0.25（差），无单位分数
- **触摸目标 WCAG**：2.5.8 AA 24×24 CSS px / 2.5.5 AAA 44×44 CSS px
- **错误三阶梯**：3.3.1 (A) 识别 / 3.3.3 (AA) 修正建议 / 3.3.4 (AA) 法律财务类三选一
- **WCAG 1.3.5**：H98 用 `autocomplete` 标准 token；F107 = autocomplete 值不合法
- **ARIA Live**：`role="alert"` = `aria-live="assertive"`（紧急错误）；普通用 `polite`
- **乐观更新三回调链**：`onMutate` → `onError` → `onSettled`，缺一不可
- **WCAG 2.2**：2023-10-05 正式推荐标准，新增 2.5.8 Target Size (Minimum)
- **React 19**：2024-12 稳定，`useOptimistic` 原生支持乐观 UI
- **TanStack Query v5**：`onMutate` → `onError` → `onSettled` 回滚范式为事实标准
- **现代浏览器**：Chrome 79+ / Firefox 71+ / Safari 14+ 根据 `<img>` 的 width/height 自动算 aspect-ratio

## WCAG 准则速查表

| 准则 | 等级 | 名称 | 核心要求 | 技术 / 失败 |
| --- | --- | --- | --- | --- |
| **2.5.8** | AA | Target Size (Minimum) | 指针输入目标 ≥ 24×24 CSS px | 5 例外：Spacing / Equivalent / Inline / User Agent Control / Essential |
| **2.5.5** | AAA | Target Size (Enhanced) | 指针输入目标 ≥ 44×44 CSS px | 4 例外：Equivalent / Inline / User Agent Control / Essential；技术 C44 |
| **1.3.5** | AA | Identify Input Purpose | 用 HTML `autocomplete` 标准 token 标识输入用途 | H98（实现）/ F107（失败：值不合法） |
| **3.3.1** | A | Error Identification | 自动检测的错误以**文本**告知用户 | 不能只靠颜色 / 图标 |
| **3.3.3** | AA | Error Suggestion | 识别错误并给**可操作的修正建议** | 不只说「错误」「无效」 |
| **3.3.4** | AA | Error Prevention（Legal/Financial/Data） | 法律 / 财务 / 删数据类操作三选一 | 可撤销 / 检查错误给修正 / 提交前确认 |
| **1.1.1** | A | Non-text Content | 所有非文本内容提供 `alt` 等文本替代 | inline img 无 alt 即违反 |
| **1.4.13** | AA | Content on Hover or Focus | hover / focus 弹出层可关闭 / 可悬停 / 持久 | tooltip、菜单弹出层 |

> WCAG 2.2 于 **2023-10-05** 成为 W3C 正式推荐标准（Recommendation），新增 2.5.8 Target Size (Minimum) AA；2.5.5 Target Size (Enhanced) 自 WCAG 2.1 (2018) 起即为 AAA。

## NN/g 响应时间表

| 等待时长 | 用户感知 | 反馈方式 | 例子 |
| --- | --- | --- | --- |
| **< 0.1s** | 瞬时、直接操控感 | **无需反馈**（感官上因果连为一体） | 按钮按下、checkbox 勾选 |
| **0.1s – 1s** | 思路不中断，可察觉延迟 | 可略延迟，需要轻量 spinner 提示 | 局部刷新、tab 切换 |
| **1s – 10s** | 思路被打断，注意力流失 | spinner / 骨架屏明确反馈 | 表单提交、列表加载 |
| **> 10s** | 注意力上限，焦虑想离开 | **必须 percent-done 进度条 + 可中断** | 大文件上传、复杂分析 |

**反馈类型选型表**：

| 加载时长 | 推荐反馈 | 原因 |
| --- | --- | --- |
| < 1s | 不放反馈 | 闪一下是负优化（NN/g） |
| 2–10s | 骨架屏 或 spinner | 骨架屏适合整页（暗示结构 + 防 CLS）；spinner 适合单个模块 |
| > 10s | 必须用进度条（percent-done） | 长等待需明确进度 + 可中断 |

## 触摸目标速查表

### WCAG 2.5.8 Target Size (Minimum) AA

| 项 | 取值 |
| --- | --- |
| 最低尺寸 | **24×24 CSS px** |
| 例外数 | **5 个** |
| 例外名 | Spacing / Equivalent / Inline / User Agent Control / Essential |
| Spacing 判定 | 目标边界框中心画 24px 直径圆与其他目标圆不相交 |
| 引入版本 | WCAG 2.2（2023-10-05） |

### WCAG 2.5.5 Target Size (Enhanced) AAA

| 项 | 取值 |
| --- | --- |
| 最低尺寸 | **44×44 CSS px** |
| 例外数 | **4 个** |
| 例外名 | Equivalent / Inline / User Agent Control / Essential（**无 Spacing**） |
| 推荐技术 | C44（`min-width` + `min-height`） |
| 引入版本 | WCAG 2.1（2018） |

### 事实标准参考

| 来源 | 推荐尺寸 |
| --- | --- |
| WCAG 2.5.8 AA（底线） | 24×24 CSS px |
| WCAG 2.5.5 AAA（增强） | 44×44 CSS px |
| **Apple HIG** | **44 pt** |
| **Google Material** | **48 dp** |

## CLS 速查表

| 项 | 取值 |
| --- | --- |
| 良好（Good） | **≤ 0.1**（需覆盖 ≥75% 访问） |
| 需改善（Needs Improvement） | 0.1 – 0.25 |
| 差（Poor） | > 0.25 |
| 单位 | **无单位分数**（区别于 LCP/INP 的毫秒） |
| 计算公式 | 影响比例 × 距离比例 |
| 500ms 宽限规则 | 用户交互后 500ms 内的位移不计入 CLS |
| 滚动后位移 | **算入** CLS（无宽限） |

### CLS 成因与对策

| 成因 | 对策 |
| --- | --- |
| 图片 / iframe / video 无尺寸 | HTML 写 `width` + `height`（浏览器自动算 aspect-ratio） |
| 字体加载（FOIT/FOUT） | `font-display: optional` 或 `preload` 字体（归性能章） |
| 动态注入内容 | `min-height` / `aspect-ratio` 占位 |
| 广告位 / 嵌入 | 预留 `min-height`，**不要无广告时收回** |
| SSR hydration 二次插入 | 服务端 / 客户端渲染结果对齐 |

## ARIA Live 用法表

| 属性 / 角色 | 行为 | 用途 |
| --- | --- | --- |
| `aria-live="off"` | 不播报 | 不重要的动态内容 |
| `aria-live="polite"` | 当前任务结束才播报 | 普通内联验证、内容就绪、空状态变化 |
| `aria-live="assertive"` | 立即打断当前任务 | 紧急错误、必须立即通知 |
| **`role="alert"`** | 等同 `aria-live="assertive"` | **仅紧急错误**；多个并存是反模式 |
| `aria-atomic="true"` | 整个区域内容变化都重新播报 | 播报完整性优先 |
| `aria-atomic="false"`（默认） | 只播报变化部分 | 节省语音 |
| `aria-relevant="additions removals text"` | 决定哪些变化触发播报 | 默认 `additions text` |
| `aria-busy="true"` | 容器正在加载 / 修改，内容就绪后再暴露 | 骨架屏容器、乐观更新表单 |

> ARIA19 结论：`role="alert"` 等价 `aria-live="assertive"`，仅用于紧急错误；普通内联验证用 `aria-live="polite"`；多个 assertive 区域并存是反模式。

## 乐观更新三回调链速查（TanStack Query v5）

| 回调 | 触发时机 | 职责 |
| --- | --- | --- |
| **`onMutate`** | mutation 触发前 | ① `cancelQueries` 取消在飞查询<br>② `getQueryData` 存快照<br>③ `setQueryData` 写乐观值<br>④ `return { previousData }` 传给 onError |
| **`onError`** | mutation 失败 | `setQueryData(context.previousData)` 回滚 |
| **`onSettled`** | 成功或失败都触发 | `invalidateQueries` 与服务端对齐 |

| 缺哪步 | 后果 |
| --- | --- |
| 不 `cancelQueries` | 后台 refetch 旧数据覆盖乐观值 → UI 闪烁 |
| 不存快照 | 失败时无法回滚 → UI 停留在「成功」假象 |
| 不 `invalidateQueries` | UI 与后端持久不一致 |

**React 19 `useOptimistic`**（2024-12 稳定）：

```ts
const [optimisticState, addOptimistic] = useOptimistic(
  state,
  (currentState, newValue) => /* 返回新状态 */
);
```

## 表单 `autocomplete` 标准 token 速查

由 WHATWG HTML Living Standard 维护，WCAG 1.3.5 (AA) 引用之（技术 H98）。

| 场景 | token |
| --- | --- |
| 姓名 | `name` / `given-name` / `additional-name` / `family-name` |
| 联系 | `email` / `tel` / `tel-country-code` / `street-address` / `address-line1` |
| 账号 | `username` / `current-password` / `new-password` |
| 生日 | `bday` / `bday-day` / `bday-month` / `bday-year` |
| 性别 | `sex` |
| 支付 | `cc-name` / `cc-number` / `cc-exp` / `cc-exp-month` / `cc-exp-year` / `cc-csc` |
| 一次性 | `one-time-code` |

> `type="email"` **不满足** 1.3.5——「email」太粗，不区分本人邮箱还是他人邮箱。

## 浏览器与框架支持现状（2026-07）

| 特性 | 状态 |
| --- | --- |
| `<img width>` + `<height>` 自动算 aspect-ratio | Chrome 79+ / Firefox 71+ / Safari 14+，**Baseline** |
| `prefers-reduced-motion` 媒体查询 | Media Queries Level 5，主流浏览器稳定（Safari 10.1+ / Chrome 74+ / Firefox 63+） |
| WCAG 2.2 | 2023-10-05 W3C 正式推荐标准（含 2.5.8） |
| Core Web Vitals | LCP / INP / CLS（2024-03-12 INP 取代 FID） |
| React 19 `useOptimistic` | 2024-12 稳定 |
| TanStack Query v5 | `onMutate` → `onError` → `onSettled` 事实标准 |
| HTML `autocomplete` 标准 token | WHATWG HTML Living Standard 维护 |

## 反模式清单（一图速查）

| 反模式 | 后果 / 违规项 |
| --- | --- |
| Frame-display 骨架屏（只画 header/footer） | 等价 spinner，用户等久了判定页面无响应 |
| 不 `cancelQueries` 直接 `setQueryData` | 后台 refetch 覆盖乐观值，UI 闪烁 |
| 多个 `aria-live="assertive"` 并存 | 读屏互相打断、播报混乱 |
| 表单错误只说「错误」「无效」 | 违反 3.3.1 和 3.3.3 |
| 移除广告位预留 `min-height` | 移除预留本身造成 CLS |
| `<img>` 不写 `width/height` | 加载完成撑开布局 → CLS |
| onChange 每次按键报错 | 用户尚未输完被错误淹没，放弃率上升 |
| 触摸目标 16×16 / 20×20 无间距 | 24px 圆相交，违反 2.5.8 (AA) |
| 裸「No data」/ 空白页空状态 | 用户无法判断是出错还是真没数据 |
| opacity 闪烁代替骨架屏内容占位 | 对 prefers-reduced-motion 用户是生理伤害 |
| 乐观更新不 `invalidateQueries` | UI 与后端持久不一致 |
| `<img>` 无 `alt` 又无尺寸 | CLS 源头 + 违反 1.1.1 |

## 官方资源

### Nielsen Norman Group

- [Response Times: The 3 Important Limits](https://www.nngroup.com/articles/response-times-3-important-limits/)
- [Skeleton Screens 101](https://www.nngroup.com/articles/skeleton-screens/)
- [Designing Empty States in Complex Applications](https://www.nngroup.com/articles/empty-state-interface-design/)

### W3C WAI WCAG 2.2

- [Understanding WCAG 2.2（总入口）](https://www.w3.org/WAI/WCAG22/Understanding/)
- [2.5.8 Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)
- [2.5.5 Target Size (Enhanced)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html)
- [1.3.5 Identify Input Purpose](https://www.w3.org/WAI/WCAG22/Understanding/identify-input-purpose.html)
- [3.3.1 Error Identification](https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html)
- [3.3.3 Error Suggestion](https://www.w3.org/WAI/WCAG22/Understanding/error-suggestion.html)
- [3.3.4 Error Prevention (Legal, Financial, Data)](https://www.w3.org/WAI/WCAG22/Understanding/error-prevention-legal-financial-data.html)

### web.dev / MDN

- [web.dev - Optimize Cumulative Layout Shift](https://web.dev/articles/optimize-cls)
- [web.dev - Core Web Vitals](https://web.dev/articles/core-web-vitals)
- [MDN - ARIA Live Regions](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Guides/Live_regions)
- [MDN - aria-busy attribute](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-busy)

### 框架官方

- [TanStack Query v5 - Optimistic Updates](https://tanstack.com/query/v5/docs/framework/react/guides/optimistic-updates)
- [React 19 - useOptimistic](https://react.dev/reference/react/useOptimistic)
- [WHATWG HTML - autocomplete token 列表](https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#attr-fe-autocomplete)

### GitHub

- [whatwg/html](https://github.com/whatwg/html)
- [TanStack/query](https://github.com/TanStack/query)
- [WICG/nav-speculation（speculation rules）](https://github.com/WICG/nav-speculation)
