---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Angular 20 + Angular DevTools 编写

## 速查

- 安装：Chrome / Firefox 商店「Angular DevTools」（仅扩展，无 standalone）
- 三大面板：Components（组件/指令树）+ Profiler（变更检测）+ Injector Tree（DI）
- Profiler：柱越高 = CD 耗时越长；捕获 CD + 生命周期钩子
- Injector Tree：Angular 17+；environment + element 两棵树
- Signals：Angular 18+，追踪依赖与传播
- 完整说明见 [入门](./getting-started.md) / [组件与指令](./guide-line/components.md) / [Profiler 变更检测](./guide-line/profiler.md) / [Injector 注入树](./guide-line/injector-tree.md) / [Signals 与优化](./guide-line/signals-cd.md)

## 三大面板

| 面板 | 用途 |
| --- | --- |
| Components | 组件 / 指令树，检查修改实例状态 |
| Profiler | 变更检测周期 + 生命周期钩子可视化 |
| Injector Tree | DI 层级（environment + element）与解析路径 |

## 变更检测优化三档

| 档位 | 做法 |
| --- | --- |
| OnPush | `ChangeDetectionStrategy.OnPush` |
| Signals | 用 signal 管理状态，细粒度更新 |
| zoneless | 去 Zone.js，signal 驱动 CD |

## 版本特性

| 特性 | 起始版本 |
| --- | --- |
| Components / Profiler | 早期即有 |
| Injector Tree | Angular 17+ |
| Signals 调试 | Angular 18+ |

## 与其他框架工具对比

| | Angular DevTools | React/Vue DevTools |
| --- | --- | --- |
| 核心 | 变更检测 + DI | 组件 + 状态 |
| 独有 | Injector Tree、CD Profiler | — |
| 形态 | 仅浏览器扩展 | 扩展 + standalone |

## 官方资源

- 文档：[https://angular.dev/tools/devtools](https://angular.dev/tools/devtools)
- Profiler：[https://angular.dev/tools/devtools/profiler](https://angular.dev/tools/devtools/profiler)
- Chrome 扩展：[Angular DevTools](https://chromewebstore.google.com/detail/angular-devtools/ienfalfjdbdpebioblfackkekamfmbnh)
- GitHub：[angular/angular · devtools](https://github.com/angular/angular/tree/main/devtools)
