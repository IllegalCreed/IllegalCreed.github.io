---
layout: doc
---

# 架构模式（MVC / MVP / MVVM）

「架构模式（MVC / MVP / MVVM）」是 UI 软件领域三大经典**表现层架构模式**，源自 Martin Fowler 在 [eaaDev](https://martinfowler.com/eaaDev/uiArchs.html) 系统梳理的 **Separated Presentation（分离表现层）** 思想：把「领域逻辑（Model）」与「用户界面（View）」分开，让业务规则脱离 UI 框架独立测试与复用。三模式差别在于谁负责响应用户输入、谁持有 View 的引用、Model 与 View 之间的同步机制——MVC 用 **Observer Synchronization（观察者同步）** 让 View 观察 Model 自动刷新；MVP 用 **Presenter 完全中介**彻底切断 View 与 Model 的可见性，并被 Fowler 拆分为 **Passive View（被动视图）** 与 **Supervising Controller（监督控制器）** 两个变体；MVVM（由 John Gossman 2005 为 WPF 提出）则是 Fowler **Presentation Model（2004）** 在声明式数据绑定框架上的特化——ViewModel **不持 View 引用**，靠 Data Binding + Change Notification 自动同步。现代主流前端框架都是这三大模式的某个变体：React 坚持**单向数据流**（data flows down / events flow up）+ Lifting State Up；Vue 是 one-way-down + `v-model` 语法糖；Angular 是组件类 = ViewModel、模板 = View 的 MVVM 直接映射，`[(ngModel)]`（banana in a box）= `[ ]` property binding + `( )` event binding 的组合。理解这三大模式，是看懂现代框架设计哲学、避免 Fat Controller / 子组件 mutate prop 等反模式的前提。

## 评价

**优点**

- **关注点分离**：Model 完全不依赖 UI 框架，领域逻辑可脱离渲染器独立单元测试与复用（Fowler 核心论点）
- **多视图复用同一 Model**：MVC Observer Synchronization 让所有 View 自动同步，多屏联动零样板
- **可测试性梯度清晰**：Passive View > Presentation Model/MVVM > Supervising Controller > 经典 MVC，可按测试投入度选型
- **声明式绑定解耦**：MVVM 把 View 与 ViewModel 用数据绑定连起来，UI 重构不牵连业务逻辑
- **跨框架心智模型统一**：理解 MVC/MVP/MVVM 后，迁移 React/Vue/Angular 不再重新建立范式

**缺点**

- **概念容易混淆**：MVC 在 Web 时代被重新解释（路由层 Controller），与原意（Smalltalk 输入分发器）已分裂，新人难对齐
- **模式与框架非一一对应**：React 不强求任何模式，强行套 MVVM 会逆范式造成级联更新难追踪
- **过度抽象坑**：小页面套 MVP/MVVM 拆三角色反而样板代码爆炸，比写一个组件还啰嗦
- **经典 MVC 难单测**：View 与 Model 双向耦合，Fowler 早已指出这是其被 MVP/Presentation Model 替代的主要原因
- **双向绑定调试难**：深层嵌套 `[(ngModel)]` / `v-model` 串联，级联更新链路长、性能与调试双输

## 文档地址

- [Martin Fowler - GUI Architectures](https://martinfowler.com/eaaDev/uiArchs.html)
- [Martin Fowler - Passive View](https://martinfowler.com/eaaDev/PassiveScreen.html)
- [Martin Fowler - Presentation Model](https://martinfowler.com/eaaDev/PresentationModel.html)
- [MDN Web Docs - MVC 词汇表](https://developer.mozilla.org/en-US/docs/Glossary/MVC)
- [Angular - Two-way binding](https://angular.dev/guide/templates/two-way-binding)

## GitHub地址

无独立 GitHub 仓库（理论模式）。框架实现参考：[Angular](https://github.com/angular/angular) · [Vue](https://github.com/vuejs/core) · [React](https://github.com/facebook/react)

## 幻灯片地址

<a href="/SlideStack/architecture-patterns-slide/" target="_blank">架构模式</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=697" target="_blank" rel="noopener noreferrer">架构模式（MVC / MVP / MVVM）测试题</a>

