---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Refactoring.Guru 设计模式官方教程、MDN（Object.create / structuredClone）与 Addy Osmani《Learning JavaScript Design Patterns》编写，对照 ES2022 + TS 4.3+ 稳定行为

## 速查

- GoF 五种创建型模式：**工厂方法 / 抽象工厂 / 建造者 / 原型 / 单例**——核心都是「把对象实例化抽象出来」
- 工厂方法 = **继承 + 单一产品**（Creator 子类决定实例化哪种 Product）
- 抽象工厂 = **组合 + 一族产品**（WinFactory / MacFactory 保证产品族风格一致）
- 建造者 = **分步装配**（链式 `setA().setB().getResult()`，可选 Director 主管封装标准流程）
- 原型 = **克隆**（JS 原生 API：`Object.create(proto)`、`structuredClone(value)`、展开 `{...obj}` 浅拷贝）
- 单例三要素 = **私有静态 instance + 私有构造函数 + 公有静态 getInstance()**；JS 推荐 ES Module 天然单例
- 前端工厂实践：`React.createElement(type, props, ...children)`、Vue 3 `h(type, props, children)` 都是工厂函数
- 深拷贝优先 **structuredClone**（支持循环引用 / Date / Map / Set），别用 `JSON.parse(JSON.stringify())`（丢类型 / 循环引用抛错）
- 类实例克隆**不能用 structuredClone**——原型链会丢、`instanceof` 失败、方法变 undefined，要自实现 `clone()`
- `Object.create({}, { p: { value: 42 } })` 创建的属性默认 **writable/enumerable/configurable 全 false**

## 创建型模式是什么

创建型设计模式（Creational Design Patterns）抽象「对象实例化」的过程，让客户端代码不直接 `new` 具体类，而是通过工厂方法、建造者、原型、单例等机制拿对象。GoF 二十三种设计模式分为三大类——创建型（5 种，本章）、结构型（7 种，组合对象）、行为型（11 种，分配职责），其中创建型最早出现也最常用，是解耦「对象怎么来」与「对象怎么用」的基础工具。

五种模式的核心差异在于「创建的维度」：

- **工厂方法**：聚焦「单一产品的子类化创建」，由子类决定实例化哪种产品
- **抽象工厂**：扩展为「一族相关产品的组合创建」，保证产品族风格一致
- **建造者**：拆解「多步骤分步装配复杂对象」，避免构造器参数爆炸
- **原型**：用「克隆已有实例」替代新建，复制成本低于构造
- **单例**：保证「全局只有一个实例」并提供统一访问点

> 创建型模式的本质是「把 `new` 这个动作抽象出来」。所有五种模式解决的都是「对象怎么来」——而不是「对象怎么用、怎么组合、怎么协作」。

## 五模式速览

| 模式 | 意图 | 关键角色 | JS/TS 落地 |
| --- | --- | --- | --- |
| **工厂方法** | 子类决定实例化哪种产品 | Creator / ConcreteCreator / Product | React `createElement`、Vue `h()` |
| **抽象工厂** | 创建一族相关产品并保证一致 | GUIFactory / WinFactory / MacFactory | 多主题 UI 组件库 |
| **建造者** | 分步装配复杂对象 | Builder / ConcreteBuilder / Director（可选） | 链式 `setA().setB().getResult()` |
| **原型** | 克隆已有实例 | `clone(): T` 接口 + PrototypeRegistry | `Object.create` / `structuredClone` |
| **单例** | 全局唯一实例 + 统一访问点 | private constructor + `getInstance()` | ES Module `export const` |

> 五种模式不是孤立选择——抽象工厂常基于一组工厂方法实现、Builder / 原型 / 工厂都可以被实现为单例、原型与工厂方法互为替代（克隆 vs 继承）。

## 前端应用场景

创建型模式在前端日常开发中比想象中更常见，但大多被语言能力和框架掩盖：

- **工厂方法**：`React.createElement(type, props, ...children)`、Vue 3 `h(type, props, children)` 都是工厂函数——封装 vnode 的构造，调用方不直接 `new VNode`；UI 组件库（Element Plus / Ant Design）的 `<component :is>` 也走工厂思路
- **抽象工厂**：多主题 UI 库（暗色 / 亮色 / 高对比度）的 Button + Input + Modal 一套产品族；跨端框架（同一组件在 H5 / 小程序 / RN 渲染不同底层）的组件工厂
- **建造者**：复杂表单的链式构造（`form.addField().addRule().setSubmit()`）、HTTP 请求构造器（axios `request.url().method().data().send()`）
- **原型**：`Object.create(proto)` 直接是原型模式的语言级 API；`structuredClone(value)` 是现代深拷贝标准；前端复制对象字面量常用展开 `{...obj}`
- **单例**：ES Module `export const config = {...}` 是天然单例（模块仅求值一次）；Pinia / Vuex store 在应用生命周期内全局唯一；浏览器全局对象（`window` / `document` / `localStorage`）都是单例

> 现代前端更推荐「用语言能力替代手写模式」——ES Module 单例 > 手写 Singleton 类、`class extends` > 手动 `Object.create` 继承、`structuredClone` > 自己写深拷贝函数。

## 下一步

- [五种模式深度讲解](./guide-line.md)：工厂方法 + 抽象工厂 + 建造者 + 原型 + 单例 逐个讲，含 JS/TS 实现、应用场景、反模式
- [参考](./reference.md)：五模式对比表、前端映射速查、官方资源链接
