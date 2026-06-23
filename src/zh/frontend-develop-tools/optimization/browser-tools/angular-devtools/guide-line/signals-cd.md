---
layout: doc
outline: [2, 3]
---

# Signals 与优化

> 基于 Angular 20 + Angular DevTools 编写

## 速查

- Signals：Angular 18+ 的细粒度响应式状态
- Angular DevTools 可追踪 signal **依赖与变化传播**
- 变更检测优化：OnPush → Signals → zoneless 三档
- 用 Profiler 验证优化前后的 CD 周期变化
- signals 让 CD 从「遍历整棵树」走向「精确更新」

## Signals 调试

Angular 18 引入 **Signals**——一种细粒度的响应式状态管理。Angular DevTools 支持：

- **追踪 signal 依赖**：查看哪些 computed / effect 依赖某个 signal
- **理解变化传播**：signal 值变化时，依赖链如何更新
- 在 DevTools 里直接观察 signal 的当前值与依赖关系

```ts
import { signal, computed } from "@angular/core";

const count = signal(0);
const double = computed(() => count() * 2); // 依赖 count
// DevTools 可看到 double 依赖 count，count 变化时如何传播
```

> Signals 的依赖关系在传统调试中难以追踪，DevTools 把它可视化，便于调试响应式状态。

## 变更检测优化三档

Angular 性能优化的核心是减少不必要的变更检测：

| 档位 | 做法 | 效果 |
| --- | --- | --- |
| **OnPush** | `ChangeDetectionStrategy.OnPush` | 仅 @Input 引用变 / 事件 / async pipe 时 CD |
| **Signals** | 用 signal 管理状态 | 细粒度响应，精确更新 |
| **zoneless** | 去掉 Zone.js，signal 驱动 CD | 消除全局 CD 触发 |

> 三档逐步细化：从「组件级跳过」到「signal 级精确更新」再到「去掉 Zone 全局触发」，是 Angular 现代性能方向。

## 用 Profiler 验证优化

优化变更检测后，回到 Profiler **重录验证**：

1. 优化前录一次，记下重的 CD 周期
2. 应用 OnPush / Signals
3. 优化后重录，对比 CD 周期是否变少、变轻

> 「优化」不能凭感觉——用 Profiler 的 CD 周期柱状图量化前后差异。

## 小结

Angular DevTools 的不可替代价值在于**围绕 Angular 特有机制调试**：Components 看组件/指令，Profiler 诊断变更检测，Injector Tree 可视化 DI，Signals 调试细粒度响应。掌握变更检测与 DI 这两个核心概念，才能把 Angular DevTools 用到位。

## 资源

- [Angular DevTools](https://angular.dev/tools/devtools)
- [Profiler](https://angular.dev/tools/devtools/profiler)
