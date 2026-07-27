---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Refactoring.Guru + Node.js v26 / XState v5 / MDN 迭代协议官方文档编写

## 速查

- 行为型 **10 模式**：责任链 / 命令 / 迭代器 / 中介者 / 备忘录 / 观察者 / 状态 / 策略 / 模板方法 / 访问者
- 关注：**对象间职责分配 + 通信算法**（不涉及创建与结构装配）
- JS 语言级内置：迭代器 `Symbol.iterator`、观察者 EventEmitter / EventTarget
- XState **v5**：`createMachine` + `createActor().start()`（替代 v4 `interpret`）
- undo/redo：**双栈** + execute 前 saveBackup + 新命令清空 redoStack
- 策略 vs 状态：策略由客户端切换 / 状态由状态对象自身切换
- 责任链：`setNext` 返回 handler 支持链式，ConcreteHandler 要么处理要么传递
- 访问者：双分派 `accept(v)` 内 `v.visitXxx(this)`，Babel/ESLint 插件即此模式
- 详尽讲解见 [入门](./getting-started.md) / [十模式深度讲解](./guide-line.md)

## 十模式完整对比表

| 模式 | 意图（一句话） | 关键角色 | 前端典型落地 | 主要反模式 |
| --- | --- | --- | --- | --- |
| **责任链** | 请求沿链传递，每个 Handler 决定处理或转交 | Handler / ConcreteHandler / Client | Express/Koa middleware、axios interceptors | 链断裂（既不处理也不传递） |
| **命令** | 把请求封装成对象，支持 undo/redo 与排队 | Command / ConcreteCommand / Receiver / Invoker / History | 富文本 undo/redo、Redux dispatch | 单栈无法 redo、execute 前未 saveBackup |
| **迭代器** | 提供统一协议顺序遍历集合 | Iterable `[Symbol.iterator]()` / Iterator `next()→{value,done}` | `for...of` / Generator / Map/Set/Array | 共享迭代器实例致状态互踩 |
| **中介者** | 用中心对象协调多组件，消除网状依赖 | Mediator / ConcreteMediator / Component | Vue 3 mitt、对话框协调、Pinia 宏观中介 | God Mediator（中介者膨胀） |
| **备忘录** | 不破坏封装下保存与恢复对象内部状态 | Originator / 不可变 Memento / Caretaker | 编辑器撤销、表单草稿、游戏存档 | 不限制历史长度致快照栈爆炸 |
| **观察者** | 一对多依赖，目标变化自动通知所有订阅者 | Publisher / Subscriber | EventEmitter / Redux store.subscribe / mitt / EventTarget | 未取消订阅致内存泄漏、通知风暴 |
| **状态** | 状态变化时行为也跟着变，状态封装成独立类 | Context / State / ConcreteState | XState v5 状态机、订单/审批流、TCP 状态 | 巨型 switch-case + 布尔标志位 |
| **策略** | 一族可互换算法封装成独立类，运行时切换 | Context / Strategy / ConcreteStrategy | 表单校验器、排序规则、价格计算 | 1-2 个变体硬套类层次（过度设计） |
| **模板方法** | 父类定义算法骨架，子类重写个别步骤 | AbstractClass（模板方法 + 抽象/可选/钩子步骤）/ ConcreteClass | React 类组件生命周期、构建管线 | 子类重写模板方法破坏骨架 |
| **访问者** | 不修改类的前提下为其新增操作（双分派） | Element `accept(v)` / Visitor `visitXxx(this)` | Babel/ESLint AST 插件、编译器语义分析 | 用于变动结构（维护成本爆炸） |

## 易混模式对比

### 策略 vs 状态（最高频考点）

| 维度 | 策略 | 状态 |
| --- | --- | --- |
| 状态间感知 | 互不感知 | 可相互感知 |
| 主动切换方 | **客户端** `setStrategy()` | **状态对象自身** `context.changeState()` |
| 行为意图 | 算法可互换 | 状态驱动行为切换 |
| 数量 | 可任意多 | 通常有限（订单状态、连接状态等） |
| 转换规则 | 无 | 有（甚至有守卫 guards） |
| 典型场景 | 表单校验、排序 | 订单流、TCP 连接、视频播放器 |

### 中介者 vs 观察者

| 维度 | 中介者 | 观察者 |
| --- | --- | --- |
| 通信方式 | 集中式（中心对象协调） | 分布式（发布者广播） |
| 组件感知 | 中介者知道每个组件身份 | 只关心事件订阅 |
| 协调逻辑 | 封装在中介者内部 | 散落在订阅者 |
| 适用场景 | 组件交互复杂、强协调 | 跨组件解耦广播 |
| 关系 | 与观察者可混合（EventBus） | 独立 |

### 责任链 vs 装饰器（结构型）

| 维度 | 责任链（行为型） | 装饰器（结构型） |
| --- | --- | --- |
| 流向 | 可**中断** | 不可中断 |
| 意图 | **分发职责** | **增强功能** |
| 顺序 | 决定处理或传递 | 全程包裹 |

### 模板方法 vs 策略

| 维度 | 模板方法 | 策略 |
| --- | --- | --- |
| 机制 | **继承**（重写方法） | **组合**（持策略引用） |
| 切换时机 | 类级静态（编译期定） | 运行时可切换 |
| 骨架 | 父类固定骨架 | 无骨架概念 |
| 粒度 | 整个算法流程 | 单一算法 |

### 命令 vs 备忘录（undo 实现）

| 维度 | 命令 | 备忘录 |
| --- | --- | --- |
| 关注 | 操作的执行 + 撤销 | 状态的保存 + 恢复 |
| undo 实现 | `execute()` 反向操作 | restore 快照 |
| 配合 | 命令常当 Caretaker | 备忘录提供快照存储 |

## 前端映射速查表

| 模式 | 库 / 框架 / API | 映射点 |
| --- | --- | --- |
| **观察者** | Node.js `EventEmitter` | `on/emit/once/off` |
| **观察者** | Redux `store.subscribe` | 拉模型 + getState |
| **观察者** | 浏览器 `EventTarget` / `mitt` / `nanoevents` | 事件总线 |
| **迭代器** | ES2015 `Symbol.iterator` + `for...of` | 语言级内置 |
| **迭代器** | Generator `function*` / `yield` | 迭代器语法糖 |
| **状态** | XState v5 `createMachine` / `createActor` | 状态机工程化 |
| **责任链** | Express / Koa middleware `next()` | 中间件链 |
| **责任链** | axios `interceptors.request.use()` | 拦截器链 |
| **命令** | Redux `dispatch({type, payload})` | 命令对象（无 undo 时退化成事件） |
| **策略** | VeeValidate / Yup / Zod schema | 表单校验器 |
| **访问者** | Babel `@babel/traverse` 插件 visitor | AST 节点遍历 |
| **访问者** | ESLint 规则 create 方法返回 visitor | AST 节点遍历 |
| **中介者** | Pinia / Redux store | 宏观状态中介者 |
| **中介者** | Vue 3 mitt（替代 Vue 2 event bus） | 松散事件总线 |

## 三种步骤类型（模板方法）

| 步骤类型 | 父类提供 | 子类责任 | 用途 |
| --- | --- | --- | --- |
| **抽象步骤** | 仅声明 `abstract` | **必须实现** | 强制子类提供关键步骤 |
| **可选步骤** | 默认实现 | 可重写 | 给常见默认值，特殊情况可覆盖 |
| **钩子（Hook）** | 空方法 / 默认布尔 | 可选择性覆盖 | 扩展点，默认不影响骨架 |

## 双分派图解（访问者）

```text
普通多态（单分派）：
  element.foo() → JS 根据 element 的实际类型调用对应 foo

访问者（双分派）：
  element.accept(visitor)
    → 第 1 次分派：根据 element 实际类型决定调 visitUser/visitGroup/...
    → 第 2 次分派：根据 visitor 实际类型（PrintVisitor/ExportVisitor/...）
                  决定执行哪个具体实现
```

## 命令模式双栈图解

```text
初始：undoStack=[]  redoStack=[]

执行 cmd1：
  cmd1.execute() → undoStack=[cmd1]  redoStack=[]  (清空！)

执行 cmd2：
  cmd2.execute() → undoStack=[cmd1,cmd2]  redoStack=[]

undo：
  pop undoStack=cmd2 → cmd2.undo() → push redoStack
  → undoStack=[cmd1]  redoStack=[cmd2]

redo：
  pop redoStack=cmd2 → cmd2.execute() → push undoStack
  → undoStack=[cmd1,cmd2]  redoStack=[]

undo 后执行新 cmd3：
  → undoStack=[cmd1,cmd3]  redoStack=[]  (清空 redoStack！避免分支错乱)
```

## ES6 迭代协议要点

| 协议 | 必须 | 用法 |
| --- | --- | --- |
| **Iterable** | `[Symbol.iterator]()` 返回 Iterator | `for...of` 消费 |
| **Iterator** | `next()` 返回 `{value, done}` | 手动遍历 |
| **Generator** | `function*` + `yield` | 自动生成符合上述协议的对象 |
| **内置 Iterable** | Array / Map / Set / String / TypedArray / NodeList / arguments | 直接 `for...of` |

> 关键纪律：`[Symbol.iterator]()` **每次调用必须返回新迭代器**，否则多个消费者共享状态互相踩。

## XState v5 关键 API

| API | 作用 | v4 → v5 差异 |
| --- | --- | --- |
| `createMachine({...})` | 声明状态机配置 | 配置项兼容（states/on/target/actions/guards/context） |
| `createActor(machine).start()` | 创建并启动 actor 实例 | **替代 v4 `interpret(machine).start()`** |
| `actor.subscribe(cb)` | 订阅状态变化 | 类似 v4 但返回 ActorSubscription |
| `actor.send({type})` | 发送事件触发转换 | 与 v4 一致 |
| `assign(({ctx,event}) => ...)` | 声明式 context 更新 | 与 v4 一致 |

## 反模式清单（跨模式）

| 反模式 | 模式 | 后果 | 解法 |
| --- | --- | --- | --- |
| 链断裂 | 责任链 | 请求静默丢失 | 链尾兜底 + 显式 `super.handle()` |
| 单栈 undo | 命令 | 无法 redo | 双栈 |
| execute 前 saveBackup 缺失 | 命令 | undo 时无状态可恢复 | 强制 execute 第一步抓快照 |
| 共享迭代器实例 | 迭代器 | 多消费者互相踩状态 | 每次调用返回新迭代器 |
| God Mediator | 中介者 | 巨型类膨胀 | 拆多个职责单一中介者 |
| 不限制历史长度 | 备忘录 | 快照栈无限增长 | 限制 maxLen + 增量快照 |
| 未取消订阅 | 观察者 | 内存泄漏 | 组件卸载必 unsubscribe |
| 通知风暴 | 观察者 | 级联重渲染 | selector + 浅比较 / RxJS 节流 |
| 巨型 switch-case | 状态 | 非法转换无防护、不可维护 | XState 声明式状态机 |
| 类爆炸（过度设计） | 策略/状态 | 5+ 文件解决 1 个变体 | 用高阶函数 |
| 重写模板方法 | 模板方法 | 破坏骨架一致性 | 约定 + 注释禁重写 |
| Visitor 用于变动结构 | 访问者 | 每加元素改所有 Visitor | 结构稳定才用 Visitor |

## 版本与生态现状

| 项 | 取值 | 备注 |
| --- | --- | --- |
| GoF 行为型模式 | 1994 经典理论，无版本号 | 语言无关、稳定不变 |
| Node.js EventEmitter | 自 Node v0.1 稳定至今 | on/emit/once/removeListener 不变 |
| ES6 迭代协议 | ES2015 标准化 | 永久内置，无替代 |
| XState | **v5**（v4 已进维护期） | createActor 替代 interpret |
| Redux Toolkit | RTK 取代手写 reducer | 底层 store.subscribe 机制不变 |
| mitt | ~200B 事件总线 | Vue 3 推荐 |
| nanoevents | 极简事件总线 | ~93B |
| Vue 2 event-bus | **已移除** | Vue 3 用 mitt 或 props-down-events-up |

## 官方资源

- Refactoring.Guru 行为型模式总览：[https://refactoring.guru/design-patterns/behavioral-patterns](https://refactoring.guru/design-patterns/behavioral-patterns)
- 各模式分页：
  - [责任链](https://refactoring.guru/design-patterns/chain-of-responsibility)
  - [命令](https://refactoring.guru/design-patterns/command)
  - [迭代器](https://refactoring.guru/design-patterns/iterator)
  - [中介者](https://refactoring.guru/design-patterns/mediator)
  - [备忘录](https://refactoring.guru/design-patterns/memento)
  - [观察者](https://refactoring.guru/design-patterns/observer)
  - [状态](https://refactoring.guru/design-patterns/state)
  - [策略](https://refactoring.guru/design-patterns/strategy)
  - [模板方法](https://refactoring.guru/design-patterns/template-method)
  - [访问者](https://refactoring.guru/design-patterns/visitor)
- Node.js EventEmitter：[https://nodejs.org/api/events.html](https://nodejs.org/api/events.html)
- MDN 迭代协议：[https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols)
- MDN Generator：[https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function*](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function*)
- XState v5 文档：[https://stately.ai/docs/xstate](https://stately.ai/docs/xstate)
- Redux 单向数据流：[https://redux.js.org/tutorials/fundamentals/part-2-concepts-data-flow](https://redux.js.org/tutorials/fundamentals/part-2-concepts-data-flow)
- mitt 仓库：[https://github.com/developit/mitt](https://github.com/developit/mitt)
- Babel 插件手册（Visitor）：[https://github.com/jamiebuilds/babel-handbook](https://github.com/jamiebuilds/babel-handbook)
- GoF 原书（1994）：《Design Patterns: Elements of Reusable Object-Oriented Software》
- Refactoring.Guru 设计模式 TypeScript 示例仓库：[https://github.com/RefactoringGuru/design-patterns-typescript](https://github.com/RefactoringGuru/design-patterns-typescript)
