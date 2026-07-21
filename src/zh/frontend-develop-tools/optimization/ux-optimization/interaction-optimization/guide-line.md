---
layout: doc
outline: [2, 3]
---

# 深入指南

> 基于 Nielsen Norman Group（Response Times / Skeleton Screens / Empty States）、W3C WAI WCAG 2.2 Understanding、web.dev CLS、MDN ARIA Live / aria-busy、TanStack Query v5 / React 19 官方文档编写

## 速查

- **NN/g 三档响应时间**：0.1s 瞬时无需反馈 / 1s 思路不中断可略延迟 / 10s 注意力上限需进度条 + 可中断
- **CLS**：良好 ≤ 0.1，无单位分数；500ms 交互宽限规则；图片 / iframe / 广告位缺尺寸是主因
- **骨架屏**：占位与真实内容几何一致防 CLS；容器 `aria-busy="true"`；shimmer 必须用 `prefers-reduced-motion: reduce` 降级
- **乐观更新三回调链**（TanStack Query v5）：`onMutate`（cancelQueries + 存快照 + setQueryData）→ `onError`（回滚）→ `onSettled`（invalidate 重取）
- **触摸目标**：2.5.8 AA 24×24 CSS px / 2.5.5 AAA 44×44 CSS px；2.5.8 有 5 个例外（Spacing / Equivalent / Inline / User Agent Control / Essential）
- **表单 UX**：实时验证在 blur 触发而非 keystroke；`autocomplete` 标准 token（H98）；3.3.1 识别错误 / 3.3.3 给修正建议 / 3.3.4 法律财务类操作三选一
- **错误空状态**：解释「为什么空 + 下一步做什么」+ 至少一个主 CTA；裸「No data」是反模式
- **ARIA Live**：`role="alert"` = `aria-live="assertive"` 仅紧急错误；普通内联验证用 `aria-live="polite"`；多 assertive 并存是反模式
- **反模式**：Frame-display 骨架屏 / 不 cancelQueries 直接 setQueryData / 多 assertive 区域 / onChange 即报错 / 裸 No data 空状态 / `<img>` 不写尺寸 / 移除预留空间

## 一、骨架屏防 CLS

### CLS 是什么

CLS（Cumulative Layout Shift，累计布局偏移）是 Core Web Vitals 三件套之一，量化页面生命周期内**布局位移分数的累计**（无单位分数，区别于 LCP / INP 的毫秒）。

- 分数 = **影响比例**（视口内被位移影响的比例）× **距离比例**（最大位移距离 / 视口尺寸）
- 三档阈值：良好 **≤ 0.1**（需覆盖 ≥75% 访问）/ 需改善 0.1–0.25 / 差 > 0.25
- **500ms 宽限规则**：用户交互后 500ms 内发生的位移**不计入** CLS（视为预期位移）；但滚动后懒加载内容造成的位移**算入**

### CLS 常见成因

| 成因 | 说明 |
| --- | --- |
| **图片 / iframe / video 无尺寸** | 资源下载完成后撑开布局 |
| **字体加载** | 文本块尺寸变化（FOIT / FOUT） |
| **动态注入内容** | 弹窗 / 广告 / cookie banner 把已有元素推开 |
| **SSR hydration 后二次插入节点** | 服务端 HTML 与客户端渲染结果不一致 |
| **广告位 / 嵌入收回预留空间** | 资源没返回时把 `min-height` 收回，本身就是 CLS 源（web.dev 明确警告） |

### 骨架屏防 CLS 的正确做法

骨架屏的本质是「**让占位与真实内容几何一致**」——加载完成时，骨架屏所在区域被同样尺寸的真实内容替换，**几乎零位移**。

```html
<!-- 1. 真实卡片 -->
<article class="card" style="min-height: 320px">
  <img src="cover.webp" width="320" height="180" alt="..." />
  <h3>标题</h3>
  <p>摘要...</p>
</article>

<!-- 2. 对应的骨架屏（几何与真实卡片完全一致） -->
<article class="card skeleton" style="min-height: 320px" aria-busy="true">
  <div class="skeleton-block" style="width: 320px; height: 180px"></div>
  <div class="skeleton-line" style="width: 60%; height: 24px"></div>
  <div class="skeleton-line" style="width: 100%; height: 18px"></div>
</article>
```

**骨架屏无障碍三件套**：

1. **`aria-busy="true"`**：标记容器正在加载 / 修改，辅助技术在内容就绪后再暴露
2. **`aria-live="polite"`**：真实内容替换时通知读屏用户「内容到了」
3. **`@media (prefers-reduced-motion: reduce)`**：shimmer / 脉冲动画必须关闭或降级——前庭功能障碍用户对持续动画会产生眩晕 / 恶心

### 图片 / 媒体防位移（非骨架屏场景）

```html
<!-- ✅ 正确：HTML 写 width + height 属性，浏览器自动算 aspect-ratio -->
<img src="hero.webp" alt="..." width="800" height="600" />

<!-- ❌ 错误：只写 CSS width:100%，加载完才撑开高度 -->
<img src="hero.webp" alt="..." style="width: 100%" />

<!-- ✅ 广告位 / 嵌入兜底：CSS min-height 或 aspect-ratio -->
<div class="ad-slot" style="min-height: 250px"></div>
```

> **关键**：现代浏览器（Chrome 79+ / Firefox 71+ / Safari 14+）会根据 `<img>` 的 `width` + `height` 属性自动计算 `aspect-ratio` 预留空间，无需手写 CSS。但**移除预留空间本身也会造成 CLS**——广告没返回时把 `min-height` 收回，下波广告来了又撑开，web.dev 明确警告不要这样做。

## 二、乐观更新（Optimistic Updates）

### 乐观更新是什么

乐观更新 = 用户操作后**立即把预期结果写到 UI**（不等服务端响应），失败再回滚。它把交互延迟从「网络往返时间」降到「本地写入时间」，让操作感知**瞬时完成**。

适用场景：点赞、收藏、勾选 todo、文本输入这类「用户预期必然成功」的操作。不适用：支付、删除重要数据这类「失败代价大」的操作（用 3.3.4 三选一）。

### TanStack Query v5 三回调链

```ts
const mutation = useMutation({
  mutationFn: (newTodo) => api.createTodo(newTodo),

  // 1. onMutate：mutation 触发前，写乐观值
  onMutate: async (newTodo) => {
    // ① 取消在飞查询，否则后台 refetch 会用旧数据覆盖乐观值（造成 UI 闪烁）
    await queryClient.cancelQueries({ queryKey: ["todos"] });

    // ② 存快照，失败时回滚用
    const previousData = queryClient.getQueryData(["todos"]);

    // ③ 写乐观值
    queryClient.setQueryData(["todos"], (old) => [...old, newTodo]);

    // ④ 把快照放进 context，传给 onError
    return { previousData };
  },

  // 2. onError：mutation 失败，回滚
  onError: (_err, _newTodo, context) => {
    queryClient.setQueryData(["todos"], context.previousData);
  },

  // 3. onSettled：成功或失败都重取，与服务端对齐
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ["todos"] });
  },
});
```

### 三回调缺一不可的原因

| 缺哪一步 | 后果 |
| --- | --- |
| **不 `cancelQueries`** | 后台 refetch 的旧数据会覆盖乐观值，UI 出现「闪一下又变回去」的闪烁（TanStack discussion #10712） |
| **不存快照** | 失败时无法回到一致状态，UI 停留在「成功」假象 |
| **不 `invalidateQueries`** | UI 与后端持久不一致，乐观值成了「不需要服务端确认」的假象 |

### React 19 原生乐观 UI

React 19（2024-12 稳定）引入 `useOptimistic` hook 提供等价能力：

```ts
const [optimisticTodos, addOptimisticTodo] = useOptimistic(
  todos,
  (state, newTodo) => [...state, newTodo]
);
```

> React 19 `useOptimistic` / TanStack Query `onMutate` 仅作实现注脚，hook 内部原理归前端框架章。

### 乐观更新的反馈与可访问性

- **乐观更新期间**：禁用按钮 + 加 `aria-busy="true"` 防止用户重复提交
- **失败回滚**：用 `role="alert"`（assertive）通知用户「操作失败，已恢复」
- **成功**：用 `aria-live="polite"` 轻量通知（不必打断）

## 三、反馈即时性（NN/g 三档限制）

Nielsen Norman Group 经典研究（[Response Times: The 3 Important Limits](https://www.nngroup.com/articles/response-times-3-important-limits/)）：

| 等待时长 | 用户感知 | 反馈方式 | 例子 |
| --- | --- | --- | --- |
| **< 0.1s** | 瞬时、直接操控感 | **无需反馈**（感官上因果连为一体） | 按钮按下变色、checkbox 勾选 |
| **0.1s – 1s** | 思路不中断，可察觉延迟 | 可略延迟，无需显式进度，但需要轻量提示（spinner） | 局部刷新、tab 切换 |
| **1s – 10s** | 思路被打断，注意力开始流失 | spinner / 骨架屏明确反馈 | 表单提交、列表加载 |
| **> 10s** | 注意力上限，用户焦虑想离开 | **必须 percent-done 进度条 + 可中断** | 大文件上传、复杂分析 |

### 关键反模式：过度反馈

NN/g 实测：**加载 < 1s 放骨架屏或 spinner 反而是负优化**——闪一下让用户感觉「跟不上节奏」。反馈只在 ≥ 1s 才有意义。

### 反馈类型与等待时长对应

| 加载时长 | 推荐反馈 | 原因 |
| --- | --- | --- |
| < 1s | 不放反馈 | 闪一下是负优化（NN/g） |
| 2–10s | 骨架屏 或 spinner | 骨架屏适合整页（暗示结构 + 防 CLS）；spinner 适合单个模块（按钮 loading、卡片局部刷新） |
| > 10s | **必须 percent-done 进度条** | 长等待让用户焦虑，进度条 + 可中断才能留住用户 |

## 四、触摸目标（WCAG 2.5.8 / 2.5.5）

### WCAG 2.5.8 Target Size (Minimum) (AA)

WCAG 2.2（2023-10-05 成为 W3C 正式推荐标准）新增准则：

> **指针输入目标尺寸 ≥ 24×24 CSS px**，例外除外

**5 个例外**：

| 例外 | 说明 |
| --- | --- |
| **Spacing** | 目标尺寸 < 24×24 时，**目标边界框中心画 24px 直径圆与其他目标圆不相交**（间距补偿） |
| **Equivalent** | 存在 ≥ 24×24 的等价替代目标 |
| **Inline** | 行内链接 / 行内文本中的目标 |
| **User Agent Control** | 由浏览器原生控制（如 native select 选项） |
| **Essential** | 改变目标尺寸会**本质性破坏信息传达**（如解剖图上的标注点） |

### WCAG 2.5.5 Target Size (Enhanced) (AAA)

WCAG 2.1 起即为 AAA 准则：

> **指针输入目标尺寸 ≥ 44×44 CSS px**，例外除外

**4 个例外**：Equivalent / Inline / User Agent Control / Essential（**没有 Spacing 例外**）。

技术 C44 用 `min-width` + `min-height` 保证 44×44：

```css
.icon-button {
  min-width: 44px;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
```

### Spacing 例外判定（重要）

当目标做不到 24×24 时，必须留足「以目标边界框中心画 24px 直径圆，与其他目标圆不相交」的间距：

```text
目标 A (20×20)              目标 B (20×20)
   ┌──────┐                    ┌──────┐
   │      │                    │      │
   └──────┘   ←  24px 间距  →  └──────┘
              两目标的 24px 圆不相交 → 满足 Spacing 例外
```

### 触摸目标的工程建议

- **AA 24px 是底线**，但**强烈建议做到 44px**——即使只追求 AA。理由：手指是粗粒度输入且遮挡视线，手指粗 / 手震 / 颠簸（公交、单手）环境下 24px 仍易误触
- **Apple HIG 44pt** 与 **Google Material 48dp** 都高于 AA 下限，是事实上的产品标准
- 图标按钮用 padding 扩大可点区域，比改图标本身视觉尺寸更优雅

## 五、表单 UX

### WCAG 1.3.5 Identify Input Purpose (AA)

> 收集用户信息的 input 必须用 HTML `autocomplete` 标准 token 标识用途

**技术 H98**：用 `<input autocomplete="...">` 的标准 token。**失败 F107**：`autocomplete` 值不合法。

`type="email"` **不满足** 1.3.5——「email」太粗，不区分本人邮箱还是他人邮箱。`autocomplete` 标准 token 由 WHATWG HTML Living Standard 维护：

| 场景 | 常用 token |
| --- | --- |
| 姓名 | `name` / `given-name` / `family-name` |
| 联系 | `email` / `tel` / `street-address` |
| 账号 | `username` / `current-password` / `new-password` |
| 日期 | `bday` / `bday-day` / `bday-month` / `bday-year` |
| 支付 | `cc-name` / `cc-number` / `cc-exp` |

**为什么必填**：让浏览器自动填充，对记忆障碍 / 阅读障碍 / 运动障碍用户显著降负；同时减少全人群的输入摩擦。

### 错误提示三阶梯（3.3.1 / 3.3.3 / 3.3.4）

| 准则 | 等级 | 要求 | 反例 |
| --- | --- | --- | --- |
| **3.3.1 Error Identification** | A | 自动检测的错误**以文本告知用户**（识别 + 定位） | 只显示红色边框无文字说明 |
| **3.3.3 Error Suggestion** | AA | 识别错误并**给可操作的修正建议** | 「错误」「无效」而不说哪里错、怎么修 |
| **3.3.4 Error Prevention** | AA | 法律 / 财务 / 删数据类操作三选一：**可撤销 / 提交前校验给修正 / 提交前二次确认** | 删账号按钮无任何确认 |

**3.3.4 三条满足路径**——满足任一即合规：

- **可撤销**：操作后给一段时间撤销（如 Gmail 发信 30 秒撤销）
- **检查错误给修正机会**：提交前校验，发现问题让用户改
- **提交前用户确认**：弹窗「确认要执行 X 吗？」

### 实时验证的时机（重要）

- **正确做法**：在 **blur（失焦）后触发** 实时验证
- **反模式**：onChange 每次按键都报错——用户尚未输完就被错误淹没，放弃率上升

理由：blur 表示用户**认为该项已完成**，此时反馈才被接受；键入中用户尚未输完，过早报错会淹没用户。

```html
<!-- ✅ blur 触发验证 -->
<input
  type="email"
  autocomplete="email"
  @blur="validateEmail"
  aria-describedby="email-error"
/>
<div id="email-error" role="alert" v-if="error">{{ error }}</div>
```

### 错误提示的可访问性

- **关键错误**用 `role="alert"`（等同 `aria-live="assertive"`）立即通知读屏用户
- **普通内联验证**用 `aria-live="polite"`，不打断当前任务
- 错误消息用 `aria-describedby` 关联到对应 input，读屏用户能定位

## 六、错误状态与空状态

### 错误状态

错误状态必须传达三件事：

1. **出错了**（视觉 + 文本，不能只靠颜色）
2. **错在哪**（3.3.1 Error Identification）
3. **怎么修**（3.3.3 Error Suggestion）

```html
<!-- ✅ 错误状态：标题 + 详情 + 行动 CTA -->
<div role="alert" class="error-state">
  <h3>加载失败</h3>
  <p>无法获取列表数据：网络连接超时</p>
  <button @click="retry">重试</button>
</div>
```

### 空状态

NN/g 研究（[Designing Empty States in Complex Applications](https://www.nngroup.com/articles/empty-state-interface-design/)）：

> **空白页让用户以为系统坏了或自己用错了**。空状态必须解释「为什么空 + 下一步做什么」并提供至少一个主 CTA。

| 空状态类型 | 设计要点 | 例子 |
| --- | --- | --- |
| **首次空状态**（onboarding） | 解释价值 + 引导首次操作 | 「还没有笔记，点这里新建第一篇」 |
| **完成空状态**（success） | 庆祝 + 后续动作 | 「全部完成！查看归档」 |
| **无结果空状态**（no match） | 解释 + 调整筛选 / 关键词 | 「没有匹配结果，试试清除筛选」 |
| **错误空状态** | 见上「错误状态」 | 「加载失败，重试」 |

**反模式**：裸「No data」或纯空白页——无解释、无 CTA，用户无法判断是出错还是真没数据，更不知道下一步。

## 七、`aria-busy` 与 `aria-live`

### `aria-busy`（全局 ARIA 状态）

标记容器**正在加载 / 修改**，辅助技术在内容就绪后再暴露：

```html
<section aria-busy="true">
  <!-- 加载完成后改 aria-busy="false"，或用 JS 移除整个 skeleton 容器 -->
</section>
```

适用：骨架屏容器、乐观更新期间的表单、动态刷新的列表。

### `aria-live`（Live Regions）

让读屏用户感知动态内容变化。三档：

| 值 | 行为 | 用途 |
| --- | --- | --- |
| **`off`** | 不播报 | 不重要的动态内容 |
| **`polite`** | 当前任务结束才播报 | 普通内联验证、空状态变化、内容就绪 |
| **`assertive`** | 立即打断当前任务 | 紧急错误、必须立即通知 |

**ARIA19 关键结论**：`role="alert"` 等价 `aria-live="assertive"`，**仅用于紧急错误**；多个 `aria-live="assertive"` 区域并存是反模式——读屏软件互相打断、播报顺序混乱。

### `aria-atomic` 与 `aria-relevant`

控制播报粒度：

- `aria-atomic="true"`：整个区域内容变化时全部重新播报（而非只播变化部分）
- `aria-relevant="additions removals text"`：决定哪些变化触发播报

```html
<div aria-live="polite" aria-atomic="true">
  <!-- 任何内容变化都重新播报整段 -->
</div>
```

## 反模式（避坑）

- **Frame-display 骨架屏**：只渲染 header / footer + 空背景，不画内容占位——NN/g 明确不推荐，等价于 spinner，用户等久了判定页面无响应离开
- **乐观更新不 `cancelQueries` 就 `setQueryData`**：后台 refetch 的旧数据会覆盖乐观值，UI 出现「闪一下又变回去」的闪烁（TanStack discussion #10712）
- **多个 `aria-live="assertive"` 区域同时存在**：读屏软件互相打断、播报顺序混乱（Stack Overflow 案例）
- **表单错误只显示「错误」「无效」而不说哪里错、怎么修**：违反 3.3.1 和 3.3.3
- **广告 / 嵌入位无广告返回时把预留的 `min-height` 收回**：web.dev 明确警告，移除预留空间本身会产生与插入内容等量的 CLS
- **`<img>` / `<iframe>` / `<video>` 不写 `width` / `height` 属性，指望 CSS `width:100%` 自适应**：资源下载完成前浏览器无法预留高度，正文被推下造成位移
- **键入即校验**（onChange 每次按键都报错）：用户尚未输完就被错误淹没，放弃率上升
- **触摸图标按钮 16×16 或 20×20 且无间距**：24px 直径圆相交，直接违反 2.5.8 (AA)
- **裸「No data」/ 空白页作为空状态**：无解释、无 CTA，用户无法判断是出错还是真没数据
- **用 opacity 闪烁 / 纯闪烁背景代替骨架屏内容占位**：对 `prefers-reduced-motion` 用户是生理伤害，且不传达页面结构
- **把乐观更新当成「不需要服务端确认」**：`onSettled` 必须 `invalidateQueries` 重取服务端真实状态，否则 UI 与后端持久不一致
- **inline 的 `<img>` 不设 `alt` 也不设尺寸**：既是 CLS 源头，也违反 1.1.1 无障碍
- **混淆 WCAG 版本号**：2.5.8 (AA) 是 WCAG 2.2（2023）新增，老资料常缺；2.5.5 (AAA) 自 WCAG 2.1 (2018) 起
- **混淆 CLS 阈值单位**：CLS 是无单位分数 ≤ 0.1，不是毫秒或百分比

## 与相邻概念的边界

| 边界 | 归本叶 | 归相邻章 |
| --- | --- | --- |
| 防抖 / 节流 | UX 维度（输入延迟感） | **性能维度（调度算法）→ 性能优化·事件属性叶** |
| RAIL 模型 | 引用响应时间限制 | **性能预算与执行维度 → 性能优化章** |
| `requestAnimationFrame` / `requestIdleCallback` | 不展开 | **性能优化章** |
| Web Worker / 虚拟列表 / 时间切片 | 不展开 | **性能优化章** |
| CLS 性能手段 | 引用 CLS 作度量目标 | **字体 `size-adjust` / bfcache → 性能章** |
| React 19 `useOptimistic` / TanStack Query API | 实现注脚 | **hook 内部原理 → 前端框架章** |
| 防抖节流「调度算法」 | 不展开 | **性能优化·事件属性叶** |

## 下一步

- [参考](./reference.md)：WCAG 准则速查表 + 响应时间表 + 触摸目标表 + ARIA Live 用法 + 官方资源链接
