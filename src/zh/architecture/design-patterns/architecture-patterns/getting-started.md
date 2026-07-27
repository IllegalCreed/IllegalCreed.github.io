---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Martin Fowler「GUI Architectures / Passive View / Presentation Model」+ MDN MVC 词条 + React/Vue/Angular 官方文档编写，对照 2026-07 框架现状

## 速查

- 三模式共同根：**Separated Presentation（分离表现层）**——Model 不依赖 UI 框架
- **MVC 三角色**：Model（数据 + 业务逻辑）/ View（展示）/ Controller（输入分发），同步机制 = Observer Synchronization
- **MVP 关键差异**：Presenter **完全中介**，View 与 Model 彻底解耦（无可见性）
- **MVP 两变体**：Passive View（Presenter 操纵全部 widget，最可测）/ Supervising Controller（简单同步仍由 View 绑定）
- **MVVM = Presentation Model 特化**：ViewModel 不持 View 引用，靠 Data Binding + Change Notification 同步
- **React**：单向数据流（data down / events up），无双向绑定，Lifting State Up
- **Vue**：one-way-down + `v-model` 是 `:modelValue` + `@update:modelValue` 的语法糖
- **Angular**：组件类 = ViewModel，模板 = View，`[(ngModel)]` = banana in a box
- 可测试性排序：**Passive View > MVVM > Supervising Controller > 经典 MVC**
- Humble Object 原则：把逻辑从难测的 View（DOM）推到可测的 Presenter/ViewModel

## 三大模式是什么

「架构模式（MVC / MVP / MVVM）」要解决的是**同一类问题**：如何把用户界面（View）、用户输入处理（Controller/Presenter/ViewModel）、领域数据与业务逻辑（Model）三块职责切开，让它们能各自演化、各自测试。

Martin Fowler 把这一切的**根原则**叫做 **Separated Presentation（分离表现层）**：

> Model 完全不感知 UI 框架；UI 重构不牵连业务逻辑；领域逻辑可脱离渲染器单元测试与复用。

三模式之间的差别，**只在于「中间层」长什么样**：

| 模式 | 中间层 | 是否持 View 引用 | 与 Model 的可见性 | 同步机制 |
| --- | --- | --- | --- | --- |
| **MVC** | Controller | 短期持（处理手势时） | View 观察 Model | Observer Synchronization |
| **MVP** | Presenter | 长期持 | View 对 Model **零可见** | Presenter 显式命令 |
| **MVVM** | ViewModel | **不持** | ViewModel 持 Model | Data Binding + Change Notification |

> 三模式的演化主线是「让 View 越来越被动、让逻辑越来越可测」。Fowler 称这是从 MVC → MVP → Presentation Model 的自然推进。

## 核心心智模型：Separated Presentation

不论选哪个模式，下面三句话都成立：

1. **Model 是自包含的**：领域数据 + 业务规则，不知道有 View，也不知道用 React 还是 Angular
2. **View 只负责展示 + 把用户手势转发出去**：不写业务规则，最多做格式化（如日期格式）
3. **中间层负责编排**：拿到 View 转过来的手势 → 调 Model → 把 Model 的新状态投影回 View

> 反例：Fat Controller / Massive View Controller——把业务规则、数据访问、视图编排全塞 Controller，是 iOS/MVC 时代经典反模式。

## 三模式速览

### MVC（Model-View-Controller）

1970s Smalltalk-80 提出，三角色：

- **Model**：领域数据 + 业务逻辑，**完全自包含、不感知 UI**
- **View**：展示 Model 当前状态，**观察 Model 的变更通知**
- **Controller**：接收用户输入，决定如何作用于 Model

数据流：

```
用户输入 → Controller → 更新 Model → Model 发变更通知
              ↑                            ↓
              └────── View 观察并自行刷新 ────┘
```

**Observer Synchronization** 是 MVC 的灵魂：所有 View 与 Controller 都观察 Model，Model 一变就广播，View 各自决定怎么刷新。优点是多屏自动同步、Controller 不必直接 set View 的值；缺点是更新链路**隐式难追踪**（一个 Model 变化触发一串 View 刷新）。

> 注意：Web 时代「MVC」常被重新解释为「路由层 = Controller」，与原意已分裂。Fowler 强调真正的 MVC 必须 View 观察 Model 自动同步，而不是 Controller 渲染 View。

### MVP（Model-View-Presenter）

1996 年 Mike Potel 提出，2004 年 Martin Fowler 在 [GUI Architectures](https://martinfowler.com/eaaDev/uiArchs.html) 系统化，并**拆分成两个变体**：

- **Passive View（被动视图）**：Presenter 负责全部 widget 操纵（包括数据填充），View 对 Model **零可见**，形成「被动视图」。可测试性最高，但需要 Test Double 替身。Fowler 直言「测试是 Passive View 的首要动机」。
- **Supervising Controller（监督控制器）**：Presenter 处理**复杂逻辑**，简单字段同步仍由 View 通过数据绑定/观察 Model 完成。混合策略，样板代码更少，但可测试性稍弱（简单同步逻辑无法测）。

三角色：

- **Model**：同 MVC
- **View**：widget 结构，**无 view/controller 分裂**，只是一个被动壳子
- **Presenter**：主动响应用户手势，**完全中介**

数据流：

```
用户手势 → View 转发 → Presenter → 调 Model → 拿新状态
                                                ↓
                              Presenter 主动 set View 各字段
```

> MVP 的关键价值：**View 与 Model 彻底解耦**，所以 Presenter 可以脱离 UI 框架做纯逻辑单测。

### MVVM（Model-View-ViewModel）

2005 年 John Gossman 为 Microsoft WPF 提出，本质是 Fowler **Presentation Model（2004）** 在声明式数据绑定框架上的特化：

- **ViewModel = 视图的抽象**：持有 UI 状态（选中态、启用态、错误提示）+ 展示逻辑（格式化、过滤），但**不持有 View 引用**
- **靠 Data Binding + Change Notification 自动同步**：View 绑定到 ViewModel 的属性，ViewModel 属性一变自动通知 View 刷新；View 用户输入也通过绑定自动写回 ViewModel

```ts
// ViewModel 示例（伪代码）
class CounterVM {
  count = 0;          // 暴露给 View 绑定的状态
  increment() {       // View 通过绑定触发
    this.count++;
    this.notify('count'); // 通知 View 刷新
  }
}
```

> MVVM 与 Presentation Model 的唯一差别：MVVM 框架提供了声明式数据绑定，让 ViewModel 不必自己写同步逻辑；Presentation Model 是更通用的形式（在没有绑定的环境里也成立）。

## 现代框架归属速查

| 框架 | 模式归属 | 关键证据 |
| --- | --- | --- |
| **Angular 17-20** | MVVM 直接实现 | 组件类 = ViewModel，模板 = View；`[( )]` 两路绑定由 signal 驱动 |
| **Vue 3.5** | 类 MVVM（声明式 + 响应式） | `v-model` 是 props + emit 的语法糖，本质单向 |
| **React 19** | 单向数据流（非 MVVM） | 无框架级双向绑定；用受控组件 + Lifting State Up 实现表单同步 |

> 不要强行往 React 上套 MVVM——逆范式会造成级联更新难追踪。React 的状态管理见「状态管理」章（Redux/Pinia/Zustand）。

## 选型决策骨架

按场景选模式，不要套公式：

- **简单展示页**：写一个组件即可，不必硬拆 MVC 三角
- **复杂表单 + 需要单测**：MVP（Passive View）或 MVVM
- **声明式框架（Angular/Vue）**：直接用框架内置的 MVVM 机制
- **大型应用 + 跨组件共享状态**：在模式层之上加状态管理（Redux/Pinia）
- **领域规则复杂**：把业务下沉到 Model/Service 层，Controller/ViewModel 只做编排

## 下一步

- [深度指南](./guide-line.md)：MVC 三角色职责、Observer Sync、MVP 两变体差异、MVVM/Presentation Model、React/Vue/Angular 映射、可测试性排序、反模式
- [参考](./reference.md)：三模式对比表、框架映射表、官方资源
