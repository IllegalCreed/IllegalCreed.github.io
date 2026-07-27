---
layout: doc
---

# 结构型设计模式

「结构型设计模式」是 GoF 二十三模式中的第二大类，共 **7 个**——适配器（Adapter）、桥接（Bridge）、组合（Composite）、装饰器（Decorator）、外观（Facade）、享元（Flyweight）、代理（Proxy）。与创建型模式关注「对象怎么建」不同，结构型关注「**类与对象怎么组合成更大的结构**」：适配器让不兼容接口协作，桥接拆开多维度变化的类爆炸，组合用统一接口递归处理树形结构，装饰器以组合优于继承的方式动态叠加职责，外观给复杂子系统一个简化入口，享元通过共享细粒度对象省内存，代理在访问对象前后插入控制逻辑。这七个模式在前端工程中无处不在：React **HOC（高阶组件）** 是装饰器模式的函数式落地、Vue 3 **reactive 系统**基于 ES6 Proxy 实现、虚拟列表是享元的工程化、`window.$API` 之类的封装层是外观、组件树天然是组合模式、回调转 Promise 是适配器的经典案例。理解结构型模式，能让你在选型时正确区分意图相近的模式（Adapter vs Bridge vs Facade vs Proxy vs Decorator 是面试与实战最常考的辨析），避免「事后补救该用 Adapter 却写成 Facade」「本应懒加载却写成 Decorator」等反模式，并能直接对应到现代框架的实现原理（Proxy 设计模式与 JavaScript Proxy 对象是「意图」与「实现手段」的两个层次）。

## 评价

**优点**

- **接口协作解耦**：Adapter / Facade 让不兼容或复杂的子系统协作变得简单，旧 API 与新代码、第三方库与内部抽象可平滑共存
- **组合优于继承**：Decorator 用持有引用的方式动态叠加职责，避免类爆炸（继承每加一种组合就需新子类），是 GoF 设计原则的范本
- **统一接口递归处理**：Composite 让 Leaf 与 Composite 共享同一 Component 接口，前端 UI 组件树、AST、虚拟 DOM 都是这一思路
- **访问控制细粒度化**：Proxy 六种变体（虚拟 / 保护 / 远程 / 日志 / 缓存 / 智能引用）覆盖懒加载、权限、缓存等典型场景，Vue 3 reactive 即 Proxy 落地
- **多维度变化独立演化**：Bridge 把「抽象」与「实现」拆成两套独立继承树，避免控件类型 × 渲染后端的笛卡尔积爆炸
- **内存友好**：Flyweight 区分内在 / 外在状态，让万级相似对象（DOM 节点池、虚拟列表、纹理缓存）可共享不可变部分

**缺点**

- **意图相近易混淆**：Adapter / Bridge / Facade / Proxy / Decorator 结构相似但意图不同，选错引入不必要复杂度或丧失递归扩展能力
- **类与对象数量膨胀**：装饰器链、代理层、桥接拆分都会增加小类数量，调试栈变深，新人上手成本上升
- **过度设计陷阱**：享元在对象数量少时强用反而拖慢 CPU；多层 Proxy / Decorator 在简单场景是噪音
- **JS Proxy 限制硬**：无法代理私有字段 `#field`、不能转发 Map / Set / Date 的内部插槽、无法 polyfill 到 ES5
- **TC39 装饰器未定**：截至 2024 年仍处 Stage 3，函数 / 对象字面量装饰器仅 Stage 1，生产依赖需谨慎

## 文档地址

- [Refactoring.Guru - 结构型模式](https://refactoring.guru/design-patterns/structural-patterns)
- [Refactoring.Guru - Adapter / Bridge / Composite / Decorator / Facade / Flyweight / Proxy 各模式页](https://refactoring.guru/design-patterns/adapter)
- [MDN Web Docs - JavaScript Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy)
- [TC39 Decorators 提案](https://github.com/tc39/proposal-decorators)
- [GoF 原书《设计模式：可复用面向对象软件的基础》](https://en.wikipedia.org/wiki/Design_Patterns)

## GitHub地址

无独立 GitHub 仓库（理论模式）。框架实现参考：[Vue 3 reactive](https://github.com/vuejs/core) · [React HOC](https://legacy.reactjs.org/docs/higher-order-components.html) · [Refactoring.Guru 源码](https://github.com/RefactoringGuru/design-patterns-typescript)

## 幻灯片地址

<a href="/SlideStack/structural-patterns-slide/" target="_blank">结构型设计模式</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=699" target="_blank" rel="noopener noreferrer">结构型设计模式 测试题</a>
