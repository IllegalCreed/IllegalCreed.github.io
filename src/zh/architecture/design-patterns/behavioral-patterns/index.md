---
layout: doc
---

# 行为型设计模式

行为型设计模式（Behavioral Design Patterns）是 GoF 23 种设计模式中**关注「对象间职责分配与通信算法」**的一类，共 10 个：责任链、命令、迭代器、中介者、备忘录、观察者、状态、策略、模板方法、访问者。与创建型（关注「何时、由谁创建对象」）和结构型（关注「如何组合对象成更大结构」）不同，行为型回答的是**「对象之间怎么协作、谁在什么时候做什么、信息怎么流动」**。它们都是 1994 年 GoF《Design Patterns》经典理论，是语言无关的稳定范式，没有「废弃」一说——但其前端落地形态随 JS 生态演进而现代化：迭代器已被 ES6 语言级内置（`Symbol.iterator` + `for...of`）、观察者内置于 Node.js EventEmitter 与浏览器 EventTarget、状态模式被 XState v5 工程化为状态机、命令模式是 undo/redo 的标准答案、策略模式是表单校验器的天然结构、责任链结构是 Express/Koa 中间件的内核、访问者模式则驱动着 Babel/ESLint 的 AST 遍历。掌握这 10 个模式等于掌握前端工程化协作的底层词汇表。

## 评价

**优点**

- **抽象到位、词汇表通用**：把「谁处理请求」「谁拥有状态」「谁通知谁」这些常见协作难题抽象成 10 个具名模式，团队沟通成本下降
- **稳定不变的知识**：GoF 1994 至今 30 年验证，跨语言、跨框架、跨版本都可复用
- **前端落地形态现代且丰富**：迭代器/观察者是 JS 语言级内置、XState/Redux/Express middleware/mitt/Babel 插件都映射到具体模式
- **解耦能力突出**：观察者解耦「通知方与被通知方」、中介者解耦「组件间网状依赖」、命令解耦「请求方与执行方」、策略解耦「算法族与使用方」
- **可测试性提升**：状态/策略/命令把分支逻辑封装成独立类，单元测试可逐个覆盖

**缺点**

- **容易过度设计**：1-2 个变体的简单逻辑硬套 Strategy/State 类层次，引入 5+ 文件却收益甚微——JS 一等函数 + 高阶函数足以替代
- **样板代码偏多**：访问者/中介者/责任链的「纯类层次」实现比直接函数式写法啰嗦，需要权衡
- **部分模式有膨胀陷阱**：中介者易进化成 God Object、备忘录快照栈易内存爆炸、观察者通知易触发级联重渲染
- **Visitor 不适合变动结构**：元素类型一变就要改所有 Visitor 接口，维护成本高
- **学习曲线**：10 个模式 + 各自反模式需要时间消化，新手易在错误场景套用

## 文档地址

- [Refactoring.Guru 行为型模式总览](https://refactoring.guru/design-patterns/behavioral-patterns)（TypeScript 伪代码 + UML + 适用场景，最友好的入门资料）
- [Node.js EventEmitter 官方 API](https://nodejs.org/api/events.html)（观察者模式的最基础落地）
- [XState v5 官方文档](https://stately.ai/docs/xstate)（状态模式的工程化实现）
- [Redux 单向数据流](https://redux.js.org/tutorials/fundamentals/part-2-concepts-data-flow)（发布-订阅的前端范式）
- [MDN 迭代协议](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols)（迭代器模式的语言级内置）

## GitHub地址

- [Refactoring.Guru 仓库（含所有模式示例）](https://github.com/RefactoringGuru/design-patterns-typescript)
- [XState](https://github.com/statelyai/xstate) · [mitt](https://github.com/developit/mitt) · [nanoevents](https://github.com/ai/nanoevents)

## 幻灯片地址

<a href="/SlideStack/behavioral-patterns-slide/" target="_blank">行为型设计模式</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=700" target="_blank" rel="noopener noreferrer">行为型设计模式 测试题</a>
