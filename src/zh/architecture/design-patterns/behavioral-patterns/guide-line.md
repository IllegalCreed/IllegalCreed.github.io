---
layout: doc
outline: [2, 3]
---

# 十模式深度讲解

> 基于 Refactoring.Guru 行为型模式 + Node.js v26 / XState v5 / MDN 迭代协议官方文档编写

## 速查

- **责任链**：Handler `setNext()` 返回 handler 支持链式，ConcreteHandler 要么处理要么 `super.handle()` 传递；前端映射 Express middleware `next()`
- **命令**：`execute()` + `undo()`，双栈 undoStack/redoStack，新命令入栈清空 redoStack，execute 前 `saveBackup()`
- **迭代器**：Iterable `[Symbol.iterator]()` + Iterator `next()→{value,done}`，Generator 是语法糖；Array/Map/Set/String 默认实现
- **中介者**：Mediator `notify(sender,event)`，ConcreteMediator 持所有 Component 引用；EventBus 是松散混合形式
- **备忘录**：Originator `createSnapshot/restore` + 不可变 Memento + Caretaker 管理栈；与 Command 配合实现 undo
- **观察者**：Publisher 维护 listeners + subscribe/unsubscribe/notify；EventEmitter / Redux store.subscribe / mitt 三种落地
- **状态**：Context 持当前 State 委托，State 间可相互感知主动触发转换；XState v5 `createMachine/createActor`
- **策略**：Context 持 Strategy 引用 + 客户端 `setStrategy` 运行时切换；表单校验器典型
- **模板方法**：抽象类 `final` 模板方法编排骨架 + 抽象步骤（必实现）+ 可选步骤（默认）+ Hook 钩子
- **访问者**：Element `accept(v)` 调用 `v.visitXxx(this)` 双分派；Babel/ESLint 插件 visitor 对象

## 1. 责任链（Chain of Responsibility）

**意图**：把请求沿一条处理器链传递，每个 Handler 决定**自己处理**还是**传给下一个**。

### UML 三角色

- `Handler`：抽象类，定义 `handle(request)` 接口，持有 `nextHandler` 引用
- `ConcreteHandlerA/B/C`：决定处理或调用 `super.handle()` 传递
- `Client`：组装链，发起请求

### TypeScript 实现

```ts
// 抽象 Handler：持 nextHandler 引用，setNext 返回 handler 支持链式调用
abstract class Handler {
  private nextHandler: Handler | null = null;

  // 关键：返回 handler 以支持 a.setNext(b).setNext(c) 链式组装
  public setNext(handler: Handler): Handler {
    this.nextHandler = handler;
    return handler;
  }

  // 处理逻辑：要么自己处理，要么传给 next
  public handle(request: string): string | null {
    if (this.nextHandler) {
      return this.nextHandler.handle(request);
    }
    return null; // 链尾兜底，约定返回 null 表示无人处理
  }
}

class AuthHandler extends Handler {
  public handle(request: string): string | null {
    if (request === "auth") return `Auth: 通过`;
    return super.handle(request); // 不归我管，传给下一个
  }
}

class LogHandler extends Handler {
  public handle(request: string): string | null {
    if (request === "log") return `Log: 记录`;
    return super.handle(request);
  }
}

// 链式组装：auth → log
const auth = new AuthHandler();
const log = new LogHandler();
auth.setNext(log);
console.log(auth.handle("log")); // Log: 记录
```

> `setNext` 返回 handler 是关键设计——这样才能链式写 `a.setNext(b).setNext(c)`，否则每步都要独立语句。

### 前端落地：Express/Koa 中间件

Express 中间件是责任链的工程化实现：

```ts
app.use((req, res, next) => {
  // 鉴权处理
  if (!req.headers.token) return res.status(401).end();
  next(); // 显式传递给下一个 Handler
});
app.use((req, res, next) => {
  // 日志处理
  console.log(req.url);
  next();
});
app.get("/", (req, res) => res.send("ok"));
```

Koa 的「洋葱模型」是责任链的扩展变体——请求时从外到内、响应时从内到外，每个中间件可在 `await next()` 后处理回程逻辑。axios 的 `interceptors.request.use()` / `interceptors.response.use()` 也是责任链。

### 反模式

- **链断裂**：Handler 既不处理也不调用 `next/super.handle()`，请求静默丢失无日志——必须在链尾设兜底处理
- **运行时打乱链顺序无校验**：链组装顺序变了行为变，应集中配置
- **链过长**：单条链超过 10 个 Handler 时调试困难，考虑改用观察者或中介者

## 2. 命令（Command）

**意图**：把请求封装成独立对象，包含执行所需的所有信息，支持**参数化、队列、撤销/重做、日志**。

### 五角色

- `Command` 接口：`execute()` + `undo()`
- `ConcreteCommand`：持有 `Receiver` 引用，execute 调用 receiver 的方法
- `Sender/Invoker`：触发 command（如菜单项、按钮）
- `Receiver`：实际业务逻辑所在
- `CommandHistory`：双栈管理 undo/redo

### 双栈 undo/redo 实现

```ts
interface Command {
  execute(): void;
  undo(): void;
}

class TextEditor {
  // Receiver：实际业务对象
  public text = "";
}

class AddTextCommand implements Command {
  private backup = ""; // execute 前 saveBackup

  constructor(private editor: TextEditor, private added: string) {}

  public execute(): void {
    this.backup = this.editor.text; // 关键：执行前必须抓快照
    this.editor.text += this.added;
  }

  public undo(): void {
    this.editor.text = this.backup; // 用快照恢复
  }
}

class CommandHistory {
  private undoStack: Command[] = [];
  private redoStack: Command[] = [];

  public push(cmd: Command): void {
    this.undoStack.push(cmd);
    this.redoStack = []; // 关键：新命令入栈清空 redoStack，避免分支历史错乱
  }

  public undo(): void {
    const cmd = this.undoStack.pop();
    if (!cmd) return;
    cmd.undo();
    this.redoStack.push(cmd);
  }

  public redo(): void {
    const cmd = this.redoStack.pop();
    if (!cmd) return;
    cmd.execute();
    this.undoStack.push(cmd);
  }
}
```

### 关键纪律

- **必须双栈**：单栈无法 redo
- **新命令入栈清空 redoStack**：否则从历史中点发新命令会创建出多条不一致的分支历史
- **execute 前 saveBackup**：否则 undo 时无状态可恢复；复杂状态用备忘录配合
- **redo 调 execute 不是再次 push**：redo 是「重放栈顶已存在的命令」

### 前端落地

- 富文本/绘图编辑器的撤销（VSCode、Figma、Photopea 都遵循双栈模型）
- Redux 的 `dispatch({type, payload})` 本质是命令对象（无 undo 时退化成纯事件）
- 表单「上一步/下一步」向导的状态回退

## 3. 迭代器（Iterator）

**意图**：提供一种统一协议**顺序遍历**集合元素，又不暴露集合内部结构。

### ES6 已语言级内置

JS 在 ES2015 把迭代器协议固化进语言，无需写 `Iterator` 抽象类：

- **Iterable 协议**：对象实现 `[Symbol.iterator]()` 方法，返回一个迭代器
- **Iterator 协议**：迭代器实现 `next()` 方法，返回 `{value, done}`
- **消费方式**：`for...of`、扩展运算符 `...`、解构 `[a, ...rest]`、`Array.from()`
- **内置 Iterable**：Array、Map、Set、String、TypedArray、NodeList、arguments

```ts
// 自定义 Range 类，实现 Iterable 协议
class Range {
  constructor(private start: number, private end: number) {}

  // 关键：每次调用必须返回新迭代器，否则多个消费者共享状态互相踩
  public [Symbol.iterator](): Iterator<number> {
    let current = this.start;
    const end = this.end;
    return {
      next(): IteratorResult<number> {
        if (current <= end) return { value: current++, done: false };
        return { value: undefined, done: true };
      },
    };
  }
}

const range = new Range(1, 3);
for (const n of range) console.log(n); // 1 2 3
```

### Generator 是迭代器的语法糖

```ts
function* rangeGen(start: number, end: number): Generator<number> {
  for (let i = start; i <= end; i++) yield i;
}

for (const n of rangeGen(1, 3)) console.log(n); // 1 2 3
```

> `function*` + `yield` 自动生成符合迭代器协议的对象，比手写 `next()` 简洁得多。

### `for...of` vs `forEach`

| 维度 | `for...of` | `forEach` |
| --- | --- | --- |
| 消费对象 | 任意 Iterable | 仅 Array |
| 中断 | `break` / `continue` / `return` | 无法中断 |
| `await` | 支持 | 不支持 |
| 索引访问 | 需 `entries()` | 直接 `arr[i]` |

### 反模式

- **共享迭代器实例**：多个消费者共用一个迭代器，第二次遍历得到空序列——正确做法是 Iterable 每次调用 `[Symbol.iterator]()` 返回**独立新迭代器**
- **混淆 Iterable 与 Iterator**：Iterable 是「可被迭代的东西」（有 `[Symbol.iterator]`），Iterator 是「正在迭代的游标」（有 `next()`）。Iterable 可以多次开始迭代，Iterator 一次性

## 4. 中介者（Mediator）

**意图**：用一个中心对象封装**一组组件之间的交互**，让组件之间互不感知，只通过中介者通信——消除网状依赖（N×N → N×1）。

### 三角色

- `Mediator` 接口：`notify(sender, event)` 接收组件消息
- `ConcreteMediator`：持所有 Component 引用，封装协调逻辑
- `Component`：只持 Mediator 引用，互不感知

### TypeScript 实现

```ts
// 中介者接口
interface Mediator {
  notify(sender: Component, event: string): void;
}

// 抽象组件：只持 Mediator 引用
abstract class Component {
  constructor(protected mediator: Mediator) {}
}

class Button extends Component {
  public click(): void {
    this.mediator.notify(this, "click");
  }
}

class Input extends Component {
  public value = "";
  public setValue(v: string): void {
    this.value = v;
    this.mediator.notify(this, "change");
  }
}

// 具体中介者：知道哪个组件对应哪个，封装协调逻辑
class DialogMediator implements Mediator {
  constructor(private button: Button, private input: Input) {}

  public notify(sender: Component, event: string): void {
    if (sender === this.button && event === "click") {
      console.log("提交：", this.input.value);
    } else if (sender === this.input && event === "change") {
      // 输入变化时启用按钮
    }
  }
}

const input = new Input(/* mediator 占位 */ null as any);
const button = new Button(/* mediator 占位 */ null as any);
const dialog = new DialogMediator(button, input);
// 实际工程中用 setter 注入 mediator
```

### 中介者 vs 事件总线（EventBus）

| 维度 | 经典 Mediator | EventBus（mitt/nanoevents） |
| --- | --- | --- |
| 通信方式 | 集中式显式协调 | 松散发布订阅 |
| 组件感知 | 中介者**知道**每个组件身份 | 只关心事件名，不知谁发 |
| 协调逻辑 | 封装在中介者内部 | 散落在各订阅者 |
| 适用场景 | 组件交互复杂、有强协调 | 跨组件解耦广播 |

> EventBus 是 Mediator + Observer 的**松散混合形式**。Refactoring.Guru 警告：纯事件总线无类型约束、流向难追踪，复杂交互应回归显式 Mediator。

### 反模式：God Mediator

中介者随时间膨胀成全知全能的巨型类——所有组件逻辑都堆在 `notify` 里。应拆分为多个职责单一的中介者，或回归事件总线。

### 前端落地

- Vue 2 的 `$emit/$on` event bus 是经典 Mediator，但 Vue 3 已移除（推荐 mitt / props-down-events-up）
- 复杂对话框（按钮 + 输入 + 列表 + 校验）的协调逻辑用一个 DialogMediator 集中管理
- Pinia/Redux 也是宏观中介者——所有组件通过它通信而非直接互调

## 5. 备忘录（Memento）

**意图**：在不破坏封装的前提下，**保存与恢复对象的内部状态**。

### 三角色

- `Originator`（原发器）：被保存状态的对象，提供 `createSnapshot()` 和 `restore(snapshot)`
- `Memento`（备忘录）：**不可变**的状态快照对象
- `Caretaker`（管理者）：管理快照栈，**只存取不修改内容**

### TypeScript 实现

```ts
// 不可变快照：用 readonly 字段保证创建后不被篡改
class EditorMemento {
  constructor(public readonly text: string, public readonly cursor: number) {}
}

class Editor {
  // Originator
  public text = "";
  public cursor = 0;

  public createSnapshot(): EditorMemento {
    return new EditorMemento(this.text, this.cursor);
  }

  public restore(snap: EditorMemento): void {
    this.text = snap.text;
    this.cursor = snap.cursor;
  }
}

// Caretaker：只管栈，不修改内容
class History {
  private stack: EditorMemento[] = [];
  private maxLen = 50; // 关键：限制长度防内存膨胀

  public push(snap: EditorMemento): void {
    this.stack.push(snap);
    if (this.stack.length > this.maxLen) this.stack.shift();
  }

  public pop(): EditorMemento | undefined {
    return this.stack.pop();
  }
}
```

### 关键纪律

- **Memento 必须不可变**：否则历史栈里的快照会被外部篡改，破坏「回到当时状态」的承诺
- **Caretaker 不修改内容**：只负责存取，不能改快照里的字段
- **限制历史长度**：频繁对大对象 createSnapshot 且不清理会无限增长，编辑器典型限制 50 步
- **大状态做增量快照**：全文快照太贵，可只存 diff（patch）

### 与命令模式配合

Command 模式的 `execute()` 内部可以抓一个备忘录，`undo()` 时 restore——这就是富文本编辑器 undo 的标准实现。Command 当 Caretaker。

## 6. 观察者（Observer）

**意图**：定义对象间**一对多**依赖，当一个对象（Subject/Publisher）状态变化时，所有依赖（Observer/Subscriber）自动收到通知。

### 三角色

- `Publisher`：维护 `listeners` 哈希，提供 `subscribe/unsubscribe/notify`
- `Subscriber` 接口：`update(data)`
- `Client`：注册订阅

### 三种前端落地形态

#### a. Node.js EventEmitter（推模型 + 拉模型）

```ts
import { EventEmitter } from "node:events";

const ee = new EventEmitter();

// subscribe
const onMsg = (data: string) => console.log("收到：", data);
ee.on("msg", onMsg);

// notify
ee.emit("msg", "hello");

// 一次性订阅
ee.once("boot", () => console.log("启动"));

// 关键：组件卸载必须取消订阅，否则内存泄漏
ee.off("msg", onMsg);
```

#### b. Redux store.subscribe（拉模型 + getState）

Redux 是发布订阅的「拉模型」变体——通知时只告诉你「变了」，订阅者自己 `getState()` 拉取具体数据：

```ts
const store = configureStore({ reducer });

const unsubscribe = store.subscribe(() => {
  console.log("新状态：", store.getState());
});

store.dispatch({ type: "increment" });

// 组件卸载时
unsubscribe();
```

> Redux 推荐用 `react-redux` 的 `useSelector` + 浅比较，避免每次 dispatch 触发全组件重渲染（观察者通知风暴）。

#### c. 浏览器端事件总线（mitt / nanoevents / EventTarget）

```ts
import mitt from "mitt";

type Events = { msg: string; boot: void };
const bus = mitt<Events>();

bus.on("msg", (data) => console.log(data));
bus.emit("msg", "hello");

// 关键：组件卸载必须 off
bus.off("msg");
```

> Vue 2 的 event-bus `$emit/$on` 在 Vue 3 已移除，官方推荐用 mitt 或 `props-down-events-up`。原生 `EventTarget` 也能用作轻量事件总线。

### 反模式

- **未取消订阅致内存泄漏**：监听器闭包持有组件引用，组件销毁后无法 GC——是前端内存泄漏的头号来源
- **通知风暴**：每次微小变化都 notify 全量订阅者，触发级联重渲染——应做 selector + 浅比较或 RxJS debounce/throttle
- **混淆推与拉**：推模型由发布者决定数据颗粒（可能过细或过粗），拉模型由订阅者按需 `getState`（Redux 模式）

## 7. 状态（State）

**意图**：对象状态变化时，**行为也跟着变**——把每个状态封装成独立类，消除巨型 `switch-case`。

### 与策略模式的关键区别（必考点）

| 维度 | 状态 | 策略 |
| --- | --- | --- |
| 状态间感知 | **可**相互感知 | 互不感知 |
| 主动切换方 | **状态对象自身** `context.changeState()` | **客户端** `setStrategy()` |
| 行为意图 | 状态驱动行为切换 | 算法可互换 |
| 数量 | 通常有限（订单/连接状态） | 可任意多（校验规则） |

### TypeScript 手写实现

```ts
interface State {
  handle(context: Context): void;
}

class Context {
  // 持当前 State 引用并委托
  public state: State;
  constructor(state: State) {
    this.state = state;
  }
  public request(): void {
    this.state.handle(this);
  }
}

class ConcreteStateA implements State {
  public handle(context: Context): void {
    console.log("A 处理");
    // 状态对象主动触发转换（区别于策略）
    context.state = new ConcreteStateB();
  }
}

class ConcreteStateB implements State {
  public handle(context: Context): void {
    console.log("B 处理");
    context.state = new ConcreteStateA();
  }
}
```

### XState v5 工程化实现

状态超过 3 个或转换有守卫/副作用时，用手写状态类易遗漏非法转换。XState v5 把规则声明式化：

```ts
import { createMachine, createActor, assign } from "xstate";

const toggleMachine = createMachine({
  id: "toggle",
  initial: "inactive",
  context: { count: 0 },
  states: {
    inactive: {
      on: {
        // target = 目标状态，actions = 转换时副作用，guards = 守卫
        TOGGLE: { target: "active", actions: assign({ count: ({ ctx }) => ctx.count + 1 }) },
      },
    },
    active: {
      on: { TOGGLE: "inactive" },
    },
  },
});

// v5 用 createActor 替代 v4 interpret
const actor = createActor(toggleMachine).start();

// 订阅状态变化
actor.subscribe((snap) => console.log(snap.value, snap.context.count));

// 发送事件
actor.send({ type: "TOGGLE" });
```

> v5 与 v4 关键差异：`createActor()` 替代 `interpret()`、API 全面 actor 模型化、`subscribe/send` 是 Actor 模型而非直接调用。

### 反模式

- **巨型 switch-case + 布尔标志位模拟状态机**：非法转换无防护、状态膨胀后不可维护——这是状态模式要消除的反模式本身
- **状态类爆炸**：1-2 个状态且不变就硬套类层次，过度设计——直接用枚举 + 函数即可

### 前端落地

- 订单流（待支付 → 已支付 → 已发货 → 已签收 / 已取消）
- 审批流（草稿 → 待审 → 审批中 → 通过 / 驳回）
- TCP 连接状态、视频播放器状态（loading / playing / paused / error）
- 复杂表单的多步向导

## 8. 策略（Strategy）

**意图**：把**一族可互换的算法**封装成独立类，让它们可以相互替换——客户端运行时切换。

### 三角色

- `Context`：持 Strategy 引用，把工作委托给 strategy
- `Strategy` 接口：声明 `execute(...)` 方法
- `ConcreteStrategyA/B/C`：互不感知的算法实现

### 表单校验器：经典应用

```ts
// Strategy 接口
interface Validator {
  validate(value: string): string | null; // null = 通过，string = 错误信息
}

// 一族可插拔校验器（ConcreteStrategy）
class RequiredValidator implements Validator {
  validate(v: string) {
    return v.trim() ? null : "不能为空";
  }
}

class EmailValidator implements Validator {
  validate(v: string) {
    return /^[^@]+@[^@]+\.[^@]+$/.test(v) ? null : "邮箱格式错误";
  }
}

class MinLengthValidator implements Validator {
  constructor(private min: number) {}
  validate(v: string) {
    return v.length >= this.min ? null : `至少 ${this.min} 个字符`;
  }
}

// Context
class FormField {
  constructor(private validators: Validator[] = []) {}

  public addValidator(v: Validator) {
    this.validators.push(v);
    return this;
  }

  public validate(value: string): string[] {
    return this.validators
      .map((v) => v.validate(value))
      .filter((r): r is string => r !== null);
  }
}

// 使用
const email = new FormField()
  .addValidator(new RequiredValidator())
  .addValidator(new EmailValidator());
console.log(email.validate("")); // ['不能为空']
console.log(email.validate("a@b")); // ['邮箱格式错误']
console.log(email.validate("a@b.c")); // []
```

### JS 高阶函数替代类

JS 一等函数天然适配策略——多数场景不需要 `Strategy` 抽象类：

```ts
type ValidatorFn = (v: string) => string | null;

const required: ValidatorFn = (v) => (v.trim() ? null : "不能为空");
const email: ValidatorFn = (v) =>
  /^[^@]+@[^@]+\.[^@]+$/.test(v) ? null : "邮箱格式错误";
const minLength = (min: number): ValidatorFn => (v) =>
  v.length >= min ? null : `至少 ${min} 个字符`;

const field: ValidatorFn[] = [required, email, minLength(8)];
```

> Refactoring.Guru 明确说：「现代语言可用匿名函数 / 高阶函数实现策略而无需额外类」。何时用类？当策略需要持有状态、被序列化、或需要被注入到 DI 容器时。

### 策略 vs 状态

见「状态」章节对比表。简言之：**策略由客户端主动切换，状态由状态对象自身切换**。

### 反模式

- **1-2 个变体硬套类层次**：过度设计，一个高阶函数参数即可
- **策略需要感知其他策略**：那就不是策略了，是状态

## 9. 模板方法（Template Method）

**意图**：在父类定义**算法骨架**（一系列步骤的固定顺序），把可变步骤延迟到子类实现。

### 三种步骤类型

- **抽象步骤**：父类声明 abstract，子类**必须实现**
- **可选步骤**：父类提供默认实现，子类可重写
- **钩子（Hook）**：父类提供空方法作为扩展点，子类可选择性覆盖（默认空操作不影响骨架）

### TypeScript 实现

```ts
abstract class DataPipeline {
  // 模板方法：final，子类不应重写（TS 无 final，靠约定 + 注释）
  // 编排骨架：fetch → parse → validate → save
  public run(): void {
    const raw = this.fetch();
    const parsed = this.parse(raw);
    if (this.shouldValidate(parsed)) {
      this.validate(parsed);
    }
    this.save(parsed);
    this.afterSave(); // 钩子，默认空操作
  }

  // 抽象步骤：子类必须实现
  protected abstract fetch(): string;
  protected abstract parse(raw: string): unknown;

  // 可选步骤：父类提供默认
  protected validate(data: unknown): void {
    console.log("默认空校验");
  }

  // 钩子：默认返回 true，子类可重写改变流程
  protected shouldValidate(data: unknown): boolean {
    return true;
  }

  // 钩子：默认空操作，子类可挂业务逻辑
  protected afterSave(): void {}
}

class ApiDataPipeline extends DataPipeline {
  protected fetch(): string {
    return "raw api data";
  }
  protected parse(raw: string) {
    return JSON.parse(raw);
  }
  protected afterSave(): void {
    console.log("发送 webhook");
  }
}

new ApiDataPipeline().run();
```

### 模板方法 vs 策略

| 维度 | 模板方法 | 策略 |
| --- | --- | --- |
| 机制 | **继承**（子类重写方法） | **组合**（持策略引用） |
| 静态/运行时 | 类级**静态**机制（编译期定） | **运行时**可切换 |
| 骨架 | 父类固定骨架 | 无骨架概念 |
| 粒度 | 整个算法流程 | 单一算法 |

### 关键纪律

- **模板方法本身应禁止子类重写**：TS 没有 `final`，靠约定 + 注释（或用 `Object.defineProperty` 设 `writable: false`）
- **允许重写模板方法会破坏算法骨架一致性**，违反该模式意图
- **钩子别滥用**：在钩子里塞大量业务逻辑改变流程，实质上重写了骨架

### 前端落地

- React 类组件的 `componentDidMount/render/componentWillUnmount` 是模板方法（生命周期）
- 通用构建管线 hook（pre-build / build / post-build）
- 数据获取流程：fetch → cache → parse → render

## 10. 访问者（Visitor）

**意图**：在不修改已有类的前提下，**为其新增操作**——把操作从对象内部抽离到独立 Visitor。

### 双分派（Double Dispatch）机制

普通多态是单分派——根据 `this` 的运行时类型调用对应方法。访问者通过 `accept` + `visit` 实现**两次分派**：

```ts
interface Visitor {
  visitUser(user: User): void;
  visitGroup(group: Group): void;
}

abstract class Element {
  // 关键：accept 接收 visitor 并回调其 visitXxx(this)
  // 这是「第二次分派」——根据 this 的具体类型 + visitor 的具体类型共同决定调用哪个方法
  public abstract accept(v: Visitor): void;
}

class User extends Element {
  constructor(public name: string) {}
  public accept(v: Visitor): void {
    v.visitUser(this); // 第一次分派：根据 this 类型决定调 visitUser
  }
}

class Group extends Element {
  constructor(public users: User[]) {}
  public accept(v: Visitor): void {
    v.visitGroup(this);
  }
}

// 新增操作不需要改 User/Group 类
class PrintVisitor implements Visitor {
  public visitUser(u: User): void {
    console.log(`User: ${u.name}`);
  }
  public visitGroup(g: Group): void {
    console.log(`Group 有 ${g.users.length} 人`);
  }
}

const elements: Element[] = [new User("张三"), new Group([new User("李四")])];
const visitor = new PrintVisitor();
elements.forEach((e) => e.accept(visitor));
```

> 「双分派」本质：`element.accept(visitor)` 中，**先按 element 的实际类型**决定调 `visitUser` 还是 `visitGroup`，**再按 visitor 的实际类型**（PrintVisitor vs ExportVisitor）决定执行哪个具体实现。

### 何时用 Visitor

仅在**对象结构稳定但操作频繁变化**时——典型场景是 AST（抽象语法树）：

- AST 节点类型固定（FunctionDeclaration、VariableDeclaration、IfStatement...）
- 但操作无限：lint 规则、transform 转换、格式化、统计...

### 前端落地：Babel / ESLint 插件

```ts
// Babel 插件 visitor 对象——访问者模式的直接体现
const babelPlugin = () => ({
  name: "no-console",
  visitor: {
    // 每个 AST 节点类型对应一个 visit 方法
    CallExpression(path) {
      const callee = path.get("callee");
      if (callee.isMemberExpression() && callee.get("object").isIdentifier({ name: "console" })) {
        path.remove();
      }
    },
    FunctionDeclaration(path) {
      // 处理函数声明节点
    },
  },
});
```

ESLint 规则也是同结构：

```ts
module.exports = {
  meta: { type: "problem" },
  create(context) {
    return {
      // visitor：每个 AST 节点类型的访问方法
      VariableDeclarator(node) {
        if (node.id.type === "Identifier" && node.id.name === "undefined") {
          context.report({ node, message: "禁止重定义 undefined" });
        }
      },
    };
  },
};
```

### 反模式

- **结构变动用 Visitor**：每加一个 Element 类型，所有 Visitor 接口和实现都要改——维护成本爆炸
- **混淆 Visitor 与遍历**：Visitor 解决「为结构加操作」，迭代器解决「按顺序遍历」——不冲突，常配合使用（访问 Composite 树）

## 共性反模式清单

跨模式的高频踩坑点，务必避免：

- **责任链断裂**：Handler 既不处理也不传递，请求静默丢失无日志
- **观察者未取消订阅**：组件卸载后监听器闭包仍持有引用，内存泄漏
- **单栈 undo**：无法 redo，必须双栈
- **巨型 switch-case 状态机**：非法转换无防护，状态膨胀不可维护
- **God Mediator**：中介者膨胀成全知全能巨型类
- **备忘录不限制历史长度**：快照栈无限增长，内存爆炸
- **Visitor 用于变动结构**：每加一个元素类型就要改所有 Visitor
- **模板方法钩子被滥用**：实质上重写骨架
- **迭代器共享状态**：多个消费者共用一个迭代器实例互相踩
- **策略/状态类爆炸**：1-2 个变体硬套类层次（过度设计）

## 下一步

- [参考](./reference.md)：10 模式对比表 + 前端映射表 + 官方资源
