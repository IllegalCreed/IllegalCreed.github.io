---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Refactoring.Guru 行为型模式官方文档 + Node.js v26 EventEmitter / MDn 迭代协议 / XState v5 官方文档编写

## 速查

- 行为型模式共 **10 个**：责任链 / 命令 / 迭代器 / 中介者 / 备忘录 / 观察者 / 状态 / 策略 / 模板方法 / 访问者
- 关注点：**对象间职责分配 + 通信算法**（谁在何时做什么、怎么通信）
- 与其他分界：**不涉及**对象的创建（创建型）和对象组合装配（结构型）
- 前端语言级内置：迭代器（`Symbol.iterator` + `for...of`）、观察者（EventEmitter / EventTarget）—— 优先用内置而非重造类层次
- 状态机库 XState **v5**：`createMachine({states,on,target,actions,guards,context})` + `createActor().start()` 替代 v4 `interpret`
- 命令模式 undo/redo：**双栈**（undoStack + redoStack），新命令入栈清空 redoStack，execute 前 `saveBackup()`
- 观察者三类落地：**EventEmitter**（推/拉）、**Redux store.subscribe**（拉 + getState）、**mitt/EventTarget**（事件总线）
- 策略 vs 状态：策略由**客户端**调 `setStrategy`，状态由**状态对象自身**触发转换
- 责任链核心：`setNext` 返回 handler 以支持链式，ConcreteHandler 要么处理要么 `super.handle()` 传递
- 访问者双分派：`accept(v)` 内调用 `v.visitXxx(this)`，Babel/ESLint 插件 visitor 即此模式
- 反模式清单：God Mediator / 未取消订阅致内存泄漏 / 单栈 redo / 巨型 switch 状态机 / Visitor 用于变动结构

## 什么是行为型设计模式

GoF 在 1994 年《Design Patterns》把 23 个模式分成三类——创建型（5）、结构型（7）、行为型（11，但实际前端常用 10 个，Interpreter 几乎不前端用）。行为型模式的核心定位是：

- **「对象怎么通信」**：观察者、中介者、责任链回答「信息怎么流动」
- **「职责怎么分配」**：命令、策略、状态、模板方法、访问者回答「谁该做什么」
- **「状态怎么管理」**：备忘录、状态、命令（配合）回答「如何回滚与切换」
- **「遍历怎么抽象」**：迭代器回答「怎么按统一协议消费集合」

> 类比：创建型是「工厂造零件」、结构型是「零件装配成机器」、行为型是「机器运行时各零件如何协调」。

## 十个模式一句话

| 模式 | 一句话定义 | 前端典型落地 |
| --- | --- | --- |
| **责任链** | 把请求沿链传递，每个 Handler 决定处理或转交 | Express/Koa 中间件、axios 拦截器 |
| **命令** | 把请求封装成对象，支持 undo/redo 与排队 | 富文本编辑器 undo/redo、Redux dispatch |
| **迭代器** | 提供统一协议顺序遍历集合元素 | ES6 `Symbol.iterator` + `for...of`、Generator |
| **中介者** | 用一个中心对象协调多组件，消除网状依赖 | 弹窗+表单+列表联动、Vue 3 替代旧 event bus |
| **备忘录** | 在不破坏封装的前提下保存与恢复对象内部状态 | 编辑器撤销、游戏存档、表单草稿 |
| **观察者** | 一对多依赖，目标状态变化自动通知所有订阅者 | EventEmitter / Redux subscribe / mitt / DOM 事件 |
| **状态** | 对象状态变化时行为也跟着变，状态封装成分离类 | XState 状态机、订单/审批流、TCP 连接状态 |
| **策略** | 把一族可互换算法封装成独立类，运行时切换 | 表单校验器、价格计算、排序规则 |
| **模板方法** | 在父类定义算法骨架，子类重写个别步骤 | 构建管线 hook、生命周期模板 |
| **访问者** | 在不修改类的前提下为其新增操作（双分派） | Babel/ESLint AST 插件、编译器语义分析 |

## 行为型 vs 创建型 vs 结构型

| 类别 | 关注 | 典型模式 |
| --- | --- | --- |
| **创建型** | 何时、由谁创建对象 | 单例、工厂方法、抽象工厂、建造者、原型 |
| **结构型** | 如何组合对象成更大结构 | 适配器、装饰器、代理、外观、组合、享元、桥接 |
| **行为型** | 对象之间怎么协作通信 | 责任链、命令、迭代器、中介者、备忘录、观察者、状态、策略、模板方法、访问者 |

> 本章只讲行为型。创建型/结构型属于其他章节。注意：责任链结构与装饰器相似（都链式传递），但**装饰器不可中断流且意图是增强**，**责任链可中断且意图是分发职责**——边界要清楚。

## 前端落地核心三条

### 优先用语言内置而非重造类层次

JS/TS 的一等函数天然适配命令、策略、观察者模式。Refactoring.Guru 明确指出：「现代语言可以用匿名函数 / 高阶函数实现策略而无需额外类」。例如：

- **迭代器**：直接用 `Symbol.iterator` + Generator，不要写 `Iterator` 抽象类
- **观察者**：直接用 EventEmitter / EventTarget，不要手写 `Subject`/`Observer` 类层次
- **策略**：表单校验器用高阶函数 `Validator[]` 即可，无需 `Strategy` 抽象类
- **命令**：函数本身就是天然的 Command（如果想 undo，传一个返回 `undo()` 的对象即可）

### 状态超过 3 个或转换有守卫/副作用时用 XState

手写 `switch-case + 布尔标志位` 是反模式（非法转换无防护、状态膨胀后不可维护）。XState v5 用 `createMachine + guards + actions` 把转换规则声明式化，可可视化（Stately Editor）、可单测。

### undo/redo 必须用双栈 + execute 前 saveBackup

```text
新命令执行 → push undoStack，清空 redoStack
undo → pop undoStack，执行其 undo()，push redoStack
redo → pop redoStack，执行其 execute()，push undoStack
```

> 单栈无法 redo，不清空 redoStack 会导致分支历史错乱，execute 前不 saveBackup 则 undo 时无状态可恢复。

## 速判：什么场景用什么模式

| 场景 | 推荐模式 |
| --- | --- |
| 跨组件解耦通信，又不想引入 Pinia/Redux | **中介者** 或 mitt/EventTarget |
| 表单校验规则可插拔 | **策略**（或高阶函数数组） |
| 复杂订单/审批流，状态多 + 转换有守卫 | **状态** + XState |
| 富文本编辑器 undo/redo | **命令**（+ 备忘录配合大状态） |
| 中间件链（鉴权 → 日志 → 业务） | **责任链**（Express/Koa 已内置） |
| 事件订阅发布 | **观察者**（EventEmitter / mitt） |
| 遍历自定义数据结构（树/流） | **迭代器**（`Symbol.iterator`） |
| 不修改 AST 类的前提下加 lint 规则 | **访问者**（Babel/ESLint 已是此模式） |
| 算法骨架固定但步骤可变 | **模板方法** |

## 下一步

- [十模式深度讲解](./guide-line.md)：每个模式的 JS/TS 实现 + 前端应用场景 + 反模式
- [参考](./reference.md)：10 模式对比表 + 前端映射表 + 官方资源
