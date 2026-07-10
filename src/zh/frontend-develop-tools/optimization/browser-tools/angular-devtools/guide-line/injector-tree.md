---
layout: doc
outline: [2, 3]
---

# Injector 注入树

> 基于 Angular 20 + Angular DevTools 编写

## 速查

- 需 Angular 17+
- 两棵树：**environment hierarchy**（环境注入器）+ **element hierarchy**（元素注入器）
- 选中某注入器 → 高亮 Angular DI 从它到根的**解析路径**
- 排查「服务注入在哪层、为什么拿到这个实例」
- 配合 `providedIn` / `providers` 配置理解 DI 作用域

Injector Tree 是 Angular DevTools 独有的视角，可视化 Angular 的**依赖注入（DI）层级**——React/Vue 工具没有的能力。

## 什么是依赖注入层级

Angular 的 DI 是分层的：服务可在不同层级提供（root、模块、组件），同一服务在不同层级可能是不同实例。理解「某处注入的服务来自哪个注入器」对排查 DI 问题至关重要。

## 两棵注入器树

Injector Tree 展示两套层级：

| 树 | 含义 |
| --- | --- |
| **Environment hierarchy** | 环境注入器（root、平台、模块 / `providedIn` 等） |
| **Element hierarchy** | 元素注入器（组件 / 指令在 `providers` 提供的） |

Angular 解析依赖时先查元素层级，再查环境层级——两棵树共同决定最终拿到哪个实例。

## 解析路径高亮

**选中某个注入器**，Angular DevTools 会**高亮 DI 算法从该注入器到根的解析路径**：

- 直观看到「请求一个服务时，Angular 会沿哪条链查找」
- 排查「为什么注入到的是这个实例 / 报 NullInjectorError」

> 当依赖注入出错（拿错实例、找不到 provider），Injector Tree 的解析路径是最直接的诊断工具。

## 典型用途

- 确认服务的提供层级（root 单例 vs 组件级多实例）
- 排查 `providedIn: 'root'` 与组件 `providers` 的覆盖关系
- 理解懒加载模块 / standalone 组件的注入器边界

## 下一步

Signals 调试与变更检测优化见 [Signals 与优化](./signals-cd.md)。
