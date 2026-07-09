---
layout: doc
---

# Angular DevTools

Angular DevTools 是 Angular 官方维护的**浏览器扩展**（Chrome / Firefox），用于调试 Angular 应用。它补上浏览器内置 DevTools 看不到的 Angular 抽象层，提供三大能力：**Components**（组件与指令树，检查/修改实例状态）、**Profiler**（可视化 **Angular 变更检测（change detection）**与生命周期钩子的执行，定位渲染性能瓶颈）、**Injector Tree**（Angular 17+ 的依赖注入层级可视化）。配合 Angular 18 引入的 **Signals**，DevTools 还能追踪 signal 依赖与变化传播。Angular 的调试核心与 React/Vue 不同——它围绕**变更检测周期**与**依赖注入**这两个 Angular 特有机制展开，因此 Angular DevTools 的 Profiler 与 Injector Tree 是其他框架工具没有的视角。

## 评价

**优点**

- **Angular 官方**：与 Angular 同步，支持 Signals、Injector Tree 等新特性
- **变更检测可视化**：Profiler 直观展示每个 CD 周期的触发与耗时
- **Injector Tree**：DI 层级（environment + element）与解析路径可视化（Angular 17+）
- **Signals 调试**：追踪 signal 依赖与变化传播（Angular 18+）
- **组件/指令检查**：树形结构 + 实例状态查看修改
- **生命周期钩子追踪**：Profiler 捕获 CD 与生命周期事件

**缺点**

- **仅 Angular**：只服务 Angular 应用
- **仅浏览器扩展**：无 standalone 形态（不像 React/Vue）
- **需开发模式**：生产构建下调试信息受限
- **概念门槛**：理解变更检测 / Zone / DI 才能用好 Profiler 与 Injector Tree
- **中文生态较小**：Angular 在国内份额低于 React/Vue

## 文档地址

[Angular DevTools](https://angular.dev/tools/devtools)

## GitHub地址

[angular/angular · devtools](https://github.com/angular/angular/tree/main/devtools)

## 幻灯片地址

<a href="/SlideStack/angular-devtools-slide/" target="_blank">Angular DevTools</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=angular-devtools" target="_blank" rel="noopener noreferrer">Angular DevTools 测试题</a>
