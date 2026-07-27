---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Martin Fowler「GUI Architectures / Passive View / Presentation Model」+ MDN MVC 词条 + React/Vue/Angular 官方文档编写，对照 2026-07 框架现状

## 速查

- 三模式共同根：**Separated Presentation（分离表现层）**——Model 不依赖 UI 框架
- **MVC**：Model（数据 + 业务）/ View（展示 + 观察 Model）/ Controller（输入分发），Observer Synchronization
- **MVP**：Presenter 完全中介，View 对 Model 零可见；Passive View / Supervising Controller 两变体
- **MVVM**：ViewModel 不持 View 引用，Data Binding + Change Notification 同步
- **React**：单向数据流（data down / events up），Lifting State Up，无双向绑定
- **Vue**：one-way-down；`v-model` = `:modelValue` + `@update:modelValue`
- **Angular**：组件类 = ViewModel，模板 = View；`[(ngModel)]` banana in a box
- 可测试性：Passive View > MVVM/PM > Supervising Controller > 经典 MVC
- Humble Object：把逻辑从难测的 View 推到可测的 Presenter/ViewModel
- 完整说明见 [入门](./getting-started.md) / [深度指南](./guide-line.md)

## 三模式对比表

| 维度 | MVC | MVP | MVVM |
| --- | --- | --- | --- |
| **起源** | 1970s Smalltalk-80 | Mike Potel 1996；Fowler 2004 系统化 | John Gossman 2005（WPF）；源头 Fowler PM 2004 |
| **中间层** | Controller | Presenter | ViewModel |
| **中间层持 View 引用** | 短期（处理手势时） | 长期持 | **不持** |
| **View 对 Model 可见性** | 有（观察 Model） | **零**（彻底解耦） | 仅通过 VM 间接 |
| **同步机制** | Observer Synchronization | Presenter 显式命令 | Data Binding + Change Notification |
| **可测试性** | 最低 | 高（Passive View 最高） | 好 |
| **典型框架** | Smalltalk / 早期 Swing | Windows Forms / 部分企业应用 | Angular / Vue / WPF |
| **适用场景** | 多屏自动同步 | 需要严格单测 | 声明式框架的表单 / 复杂 UI |

### MVP 两变体对比

| 维度 | Passive View | Supervising Controller |
| --- | --- | --- |
| Presenter 操纵范围 | **全部 widget**（含数据填充） | 仅复杂逻辑 |
| View 对 Model 可见性 | **零** | 有（仅简单同步用绑定） |
| 样板代码 | 多 | 少 |
| 可测试性 | **最高** | 中 |
| 适用场景 | 严格单测 / UI 框架替换可能 | 大多数场景，平衡可测与样板 |

## 现代框架映射表

| 框架 | 模式归属 | 关键证据 | 反模式警示 |
| --- | --- | --- | --- |
| **React 19** | 单向数据流（非 MVVM） | 无双向绑定；data down / events up；Lifting State Up | 受控/非受控混用、子组件 mutate prop |
| **Vue 3.5** | 类 MVVM（声明式 + 响应式） | `v-model` 是 props + emit 语法糖，本质单向 | 子组件 mutate prop、深层 v-model 串联 |
| **Angular 17-20** | MVVM 直接实现 | 组件类 = VM；`[( )]` 两路绑定由 signal 驱动 | 深层 `[(ngModel)]` 串联 |

### React 单向数据流三原则

```text
1. data flows down     父 → 子 通过 props
2. events flow up      子 → 父 通过 callback
3. Lifting State Up    多子组件共享状态 → 提升到共同父
```

### Vue v-model 脱糖

```vue
<Child v-model="text" />
<!-- 等价于 -->
<Child :modelValue="text" @update:modelValue="text = $event" />
```

### Angular [(ngModel)] 脱糖

```ts
<input [(ngModel)]="name" />
// 等价于
<input [ngModel]="name" (ngModelChange)="name = $event" />
```

## 可测试性排序（完整）

| 排名 | 模式 | 原因 |
| --- | --- | --- |
| 1 | **Passive View** | Presenter 纯逻辑，Test Double 替身 View 即可测 |
| 2 | **Presentation Model / MVVM** | ViewModel 不持 View 引用，纯逻辑测试 |
| 3 | **Supervising Controller** | 简单同步散落在 View，部分逻辑无法纯测 |
| 4 | **经典 MVC** | View 与 Model 双向耦合，View 难脱离框架单测 |

## 反模式清单（避坑速查）

| 反模式 | 修正 |
| --- | --- |
| Fat Controller（业务 + 视图 + 数据全塞 Controller） | 拆 Service / Repository，Controller 只做分发 |
| View 直接访问 / 观察 Model（违反 MVP） | View 只通过 Presenter/VM 中介 |
| 子组件直接 mutate prop（Vue） | emit 事件或用 `defineModel` / `computed` 代理 |
| 深层嵌套滥用 v-model / [(ngModel)] | 大状态用 store，跨层 provide/inject 单向传递 |
| Controller 直接操纵 View（MVC 退化） | View 由 Model 通知触发刷新 |
| ViewModel 持有 View 引用（MVVM 退化） | 纯 Data Binding 解耦 |
| 受控/非受控混用且数据源不唯一（React） | 明确「谁拥有这块状态」，保持 SSOT |
| 领域业务规则写进 ViewModel/Presenter | 业务下沉到 Model/Service 层 |

## 历史脉络

| 年份 | 事件 |
| --- | --- |
| 1970s | Trygve Reenskaug 在 Smalltalk-80 提出 MVC |
| 1996 | Mike Potel 提出 MVP |
| 2004 | Martin Fowler 在 eaaDev 系统化 MVP，拆分为 Passive View / Supervising Controller；同年提出 Presentation Model |
| 2005 | John Gossman 在 Microsoft WPF 团队提出 MVVM（PM 的特化） |
| 2010s | 单页应用兴起：Knockout / Ember / AngularJS 把 MVVM 引入前端 |
| 2014+ | React 出现，主打**单向数据流** + Flux/Redux，与 MVVM 形成两条路线 |
| 2024+ | Angular 17+ 全面转向 Signals；Vue 3.5 保持响应式；React 19 仍无双向绑定 |

## 版本现状（2026-07）

三大模式理论**无版本漂移**——都是 30+ 年稳定的设计模式。框架实现持续演进：

| 框架 | 版本 | 数据流模型 |
| --- | --- | --- |
| **React** | 19（2024-12 GA） | 单向 + Actions/use 钩子 + Server Components，仍无框架级双向绑定 |
| **Vue** | 3.5（2024-09） | one-way-down + v-model 语法糖 + Composition API |
| **Angular** | 17-20（2024-2025） | Signals（`signal()` / `computed()` / `model()`），zone.js 逐步可选化，变更检测更细粒度 |

> 三模式理论侧稳定，框架侧持续向 **signal / 细粒度响应式**演进。

## 官方资源

- Martin Fowler - GUI Architectures：[https://martinfowler.com/eaaDev/uiArchs.html](https://martinfowler.com/eaaDev/uiArchs.html)
- Martin Fowler - Passive View：[https://martinfowler.com/eaaDev/PassiveScreen.html](https://martinfowler.com/eaaDev/PassiveScreen.html)
- Martin Fowler - Presentation Model：[https://martinfowler.com/eaaDev/PresentationModel.html](https://martinfowler.com/eaaDev/PresentationModel.html)
- MDN Web Docs - MVC 词条：[https://developer.mozilla.org/en-US/docs/Glossary/MVC](https://developer.mozilla.org/en-US/docs/Glossary/MVC)
- Angular - Two-way binding：[https://angular.dev/guide/templates/two-way-binding](https://angular.dev/guide/templates/two-way-binding)
- Vue - One-way Data Flow：[https://vuejs.org/guide/components/props.html](https://vuejs.org/guide/components/props.html)
- Vue - v-model：[https://vuejs.org/guide/components/v-model.html](https://vuejs.org/guide/components/v-model.html)
- React - Sharing State Between Components（Lifting State Up）：[https://react.dev/learn/sharing-state-between-components](https://react.dev/learn/sharing-state-between-components)
