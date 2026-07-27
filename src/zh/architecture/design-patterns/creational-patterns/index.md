---
layout: doc
---

# 创建型设计模式

创建型设计模式（Creational Design Patterns）是 GoF 二十三种设计模式中的第一大类，共五种——**工厂方法（Factory Method）、抽象工厂（Abstract Factory）、建造者（Builder）、原型（Prototype）、单例（Singleton）**，它们抽象了「对象实例化」的过程，让客户端代码不再 `new` 具体类，而是通过统一的创建接口拿到对象。它们的本质差异在于「创建的维度」：工厂方法聚焦「单一产品的子类化创建」，抽象工厂扩展为「一族相关产品的组合创建」，建造者拆解「多步骤分步装配复杂对象」，原型用「克隆已有实例」替代新建，单例则保证「全局只有一个实例」。落到前端 JavaScript/TypeScript，这些模式与 ES2015+ 原生能力深度对应——`class` + 私有字段 `#instance` 实现单例、`Object.create(proto)` 直接是原型模式的语言级 API、`structuredClone`（2022 起全浏览器可用）提供了现代深拷贝、ES Module 规范本身即天然单例（模块仅求值一次）；主流框架也内置了工厂实践：`React.createElement(type, props, ...children)` 与 Vue 3 `h(type, props, children)` 都是封装虚拟 DOM 节点构造的工厂函数，调用方从不直接 `new VNode`，Pinia / Vuex store 则是单例模式在状态管理层的真实落地。学习这一章的意义不止于「面试题库」——它给出的是把「对象怎么来」与「对象怎么用」解耦的工程思维，是后续理解结构型、行为型模式以及 IoC / DI 容器（Angular、NestJS）的前置基础。

## 评价

**优点**

- **解耦创建与使用**：客户端依赖产品接口而非具体类，新增 ConcreteProduct 不需要改客户端（依赖倒置 + 开闭原则）
- **控制实例化时机与数量**：工厂可延迟到首次调用才创建、单例可强制全局唯一，避免重复构造和资源浪费
- **屏蔽复杂构造过程**：Builder 把 10+ 参数的伸缩构造函数拆成链式可读步骤，Director 还能复用标准装配流程
- **与 JS 原生能力无缝衔接**：`Object.create` / `structuredClone` / ES Module 单例都是模式直接的语言级实现，无需引入额外抽象层
- **主流框架真实落地**：React `createElement` / Vue `h()` / Pinia store 让这些模式在前端日常开发中随处可见

**缺点**

- **过度设计风险**：简单场景（1-2 种产品）套用抽象工厂会导致接口与工厂类爆炸，违反 YAGNI
- **单例易演化为 God Object**：把所有全局状态塞进一个 Singleton 会形成隐藏依赖中心，单元测试几乎无法 mock
- **角色数量多、初学门槛高**：抽象工厂与建造者各有 4-5 个角色（接口 / 实现工厂 / 产品接口 / 产品实现 / Director），上手成本不低
- **JS 中部分模式被语言能力简化**：原型链继承被 `class extends` 取代、单例被 ES Module 取代，硬套「面向对象式」实现反而冗余

## 文档地址

- [Refactoring.Guru 创建型模式总览](https://refactoring.guru/design-patterns/creational-patterns)
- [MDN Object.create](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/create)
- [MDN structuredClone](https://developer.mozilla.org/en-US/docs/Web/API/structuredClone)
- [Addy Osmani《Learning JavaScript Design Patterns》](https://patterns.addyosmani.com)
- [Vue 渲染函数 h() 官方文档](https://vuejs.org/guide/extras/render-function.html)

## 幻灯片地址

<a href="/SlideStack/creational-patterns-slide/" target="_blank">创建型设计模式</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=698" target="_blank" rel="noopener noreferrer">创建型设计模式测试题</a>

