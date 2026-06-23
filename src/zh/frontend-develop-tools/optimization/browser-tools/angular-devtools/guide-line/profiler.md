---
layout: doc
outline: [2, 3]
---

# Profiler 变更检测

> 基于 Angular 20 + Angular DevTools 编写

Angular Profiler 的核心是可视化 **变更检测（Change Detection, CD）**——这是 Angular 性能调试的关键。

## 速查

- 录制：Profiler 点录制 → 交互 → 停止
- 每个 CD 周期一根柱，**柱越高 = 该周期 CD 耗时越长**
- 视图：bar chart（周期序列）/ flame graph（组件层级）/ tree map
- 捕获事件：变更检测 + 生命周期钩子执行
- 点组件看它在本周期的 CD 耗时与触发
- 目标：减少不必要的 CD（OnPush / Signals / zoneless）

## 什么是变更检测

Angular 通过**变更检测**机制检查数据变化并更新视图。默认（Zone.js）下，异步事件（点击、定时器、HTTP）会触发 CD 遍历组件树。性能问题多源于 **CD 跑得太频繁或太重**——Profiler 正是诊断这点的工具。

## 录制与读图

- **录制**：点圆形按钮 → 在页面交互 → 停止
- **柱状视图**：每根柱代表一个 CD 周期，**高度 = 该周期耗时**，柱越高越值得关注
- **flame graph**：展开某个周期，看组件层级与各自 CD 耗时
- **tree map**：以面积表示各组件耗时占比

## 捕获的事件

Profiler 在录制期间捕获：

- **变更检测**：每个 CD 周期的执行
- **生命周期钩子**：`ngOnInit` / `ngOnChanges` / `ngDoCheck` / `ngAfterViewInit` 等的执行

> 看到某组件的 `ngDoCheck` 频繁执行且耗时高，往往是性能瓶颈的线索。

## 定位 CD 性能问题

1. 录制一段卡顿的交互
2. 找最高的柱（最重的 CD 周期）
3. 展开 flame graph，看哪个组件 CD 耗时最多
4. 分析：是否整棵树都在 CD？某组件 `ngDoCheck` 是否过重？

## 优化方向

减少不必要的变更检测：

- **OnPush 策略**：`changeDetection: ChangeDetectionStrategy.OnPush`，仅在 @Input 引用变化 / 事件 / async pipe 时才 CD
- **Signals**：基于 signal 的细粒度响应，精确更新（见 [Signals 与优化](./signals-cd.md)）
- **zoneless**：Angular 现代方向，去掉 Zone.js，由 signals 驱动 CD

> 优化后**重录 Profiler 验证**——确认重的 CD 周期真的变轻、变少。

## 下一步

依赖注入层级可视化见 [Injector 注入树](./injector-tree.md)。
