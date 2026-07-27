---
layout: doc
outline: [2, 3]
---

# 五种模式深度讲解

> 基于 Refactoring.Guru 设计模式官方教程、MDN（Object.create / structuredClone）与 Addy Osmani《Learning JavaScript Design Patterns》编写，对照 ES2022 + TS 4.3+ 稳定行为

## 速查

- **工厂方法**：Creator 声明工厂方法返回 Product 接口，ConcreteCreator 子类重写决定实例化哪种产品；返回类型必须是产品接口（依赖倒置）
- **抽象工厂**：GUIFactory 声明一族产品创建方法，WinFactory / MacFactory 保证产品族风格一致；新增产品种类要改所有工厂接口（违反开闭）
- **建造者**：Builder 接口声明 setA / setB / reset，ConcreteBuilder 链式返回 this，末尾 `getResult()` 返回产品；Director 主管封装标准流程但**不是必需**
- **原型**：`clone(): T` 接口 + 子类各自重写；JS 原生有 `Object.create(proto, desc)`、`structuredClone(value)`、展开 `{...obj}`；`Object.create` 创建的属性默认全 false
- **单例**：三要素 = 私有静态 instance + 私有构造函数 + `getInstance()`；JS 推荐 ES Module `export const`（模块仅求值一次）；避免双重检查锁（JS 单线程无抢占）
- **反模式**：God Object 单例、JSON.parse(JSON.stringify) 深拷贝、structuredClone 类实例后期望保留方法、Object.create 传非对象、简单产品上抽象工厂

## 工厂方法（Factory Method）

### 意图与角色

定义一个用于创建对象的接口，但让**子类决定实例化哪种产品**。工厂方法把「实例化操作」延迟到子类，让客户端依赖产品接口而非具体类。

四个核心角色：

- **Product（产品接口）**：所有产品的统一抽象（如 `Button`）
- **ConcreteProduct（具体产品）**：实际被创建的产品（如 `HTMLButton`、`WindowsButton`）
- **Creator（创建者基类）**：声明工厂方法 `createButton(): Button`，返回类型必须是**产品接口**
- **ConcreteCreator（具体创建者）**：重写工厂方法，`return new HTMLButton()`

### JS/TS 实现

```ts
// 产品接口
interface Button {
  render(): void;
  onClick(cb: () => void): void;
}

// 具体产品
class HTMLButton implements Button {
  render() { console.log("渲染 HTML 按钮"); }
  onClick(cb: () => void) { /* ... */ }
}

class WindowsButton implements Button {
  render() { console.log("渲染原生 Windows 按钮"); }
  onClick(cb: () => void) { /* ... */ }
}

// 创建者基类——工厂方法返回产品接口而非具体类
abstract class Dialog {
  // 工厂方法：由子类决定实例化哪种 Button
  abstract createButton(): Button;

  renderDialog() {
    const button = this.createButton(); // 客户端只依赖 Button 接口
    button.render();
    button.onClick(() => this.close());
  }

  protected close() { /* ... */ }
}

// 具体创建者
class WebDialog extends Dialog {
  createButton(): Button { return new HTMLButton(); }
}

class NativeDialog extends Dialog {
  createButton(): Button { return new WindowsButton(); }
}

// 使用——客户端不知道也不关心具体是哪种 Button
const dialog: Dialog = new WebDialog();
dialog.renderDialog();
```

### 关键要点

- **返回类型必须是产品接口**：`createButton(): Button` 而非 `createButton(): HTMLButton`——这是依赖倒置 + 开闭原则的落地
- **创建不是 Creator 的主业**：Refactoring.Guru 明确「product creation is NOT the primary responsibility of the creator」——Dialog 的主业是渲染对话框、处理交互，工厂方法只是其中一个钩子，让 Dialog 在不变核心逻辑的前提下适配不同 UI 风格
- **何时用**：希望客户端与具体产品解耦、希望在不变 Creator 核心业务逻辑的前提下扩展新产品类型

### 前端实践：React.createElement / Vue h()

React 与 Vue 的核心 API 本质就是工厂方法：

```ts
// React：工厂函数封装 vnode 构造，调用方不直接 new
const el = React.createElement(
  "button",
  { onClick: () => alert("hi") },
  "点我"
);

// Vue 3：h() 是 hyperscript（生成 HTML 的脚本）的简称
import { h } from "vue";
const vnode = h("button", { onClick: () => alert("hi") }, "点我");
```

两者的工厂函数都返回**抽象的虚拟节点（vnode）**而非具体 DOM——后续 reconciler（React）/ patch（Vue）根据 vnode 类型创建真实 DOM 或组件实例。调用方完全不需要知道 vnode 内部长什么样。

### 反模式

- **把工厂方法当 Creator 主业**：Dialog 只为创建按钮而存在——这违反「product creation is NOT the primary responsibility」原则，应抽成独立简单工厂
- **返回具体类型**：`createButton(): HTMLButton`——后续替换产品要改所有客户端，违反开闭原则
- **简单场景过度设计**：只有 1-2 种按钮时，直接 `new` 或简单工厂函数即可，不必上抽象类 + 工厂方法

## 抽象工厂（Abstract Factory）

### 意图与角色

创建**一族相关或相互依赖的产品**，并保证它们风格一致——同一个工厂生产的产品族不会出现「Windows 按钮 + macOS 复选框」这种混搭。

四个核心角色：

- **AbstractProduct（抽象产品族）**：每种产品一个接口（`Button`、`Checkbox`、`TextInput`）
- **ConcreteProduct（具体产品）**：WinButton / MacButton、WinCheckbox / MacCheckbox
- **AbstractFactory（抽象工厂）**：声明一族创建方法 `createButton() / createCheckbox() / createTextInput()`
- **ConcreteFactory（具体工厂）**：WinFactory / MacFactory / DarkFactory——每个具体工厂保证整族风格一致

### JS/TS 实现

```ts
// 抽象产品族
interface Button { render(): void; }
interface Checkbox { render(): void; }

// 具体产品（Windows 风格）
class WinButton implements Button { render() { console.log("Win 按钮"); } }
class WinCheckbox implements Checkbox { render() { console.log("Win 复选框"); } }

// 具体产品（macOS 风格）
class MacButton implements Button { render() { console.log("Mac 按钮"); } }
class MacCheckbox implements Checkbox { render() { console.log("Mac 复选框"); } }

// 抽象工厂——声明一族产品创建方法
interface GUIFactory {
  createButton(): Button;
  createCheckbox(): Checkbox;
}

// 具体工厂——保证整族风格一致
class WinFactory implements GUIFactory {
  createButton(): Button { return new WinButton(); }
  createCheckbox(): Checkbox { return new WinCheckbox(); }
}

class MacFactory implements GUIFactory {
  createButton(): Button { return new MacButton(); }
  createCheckbox(): Checkbox { return new MacCheckbox(); }
}

// 客户端只依赖抽象工厂与抽象产品
class Application {
  constructor(private factory: GUIFactory) {}

  renderUI() {
    // 同一工厂产出的按钮和复选框风格必然一致
    this.factory.createButton().render();
    this.factory.createCheckbox().render();
  }
}

// 根据平台选择工厂——一次性切换整个产品族
const factory: GUIFactory = process.platform === "darwin" ? new MacFactory() : new WinFactory();
new Application(factory).renderUI();
```

### 工厂方法 vs 抽象工厂

| 维度 | 工厂方法 | 抽象工厂 |
| --- | --- | --- |
| 创建维度 | **单一产品** | **一族相关产品** |
| 实现机制 | **继承**（Creator 子类重写工厂方法） | **组合**（客户端持有一个工厂实例） |
| 扩展方式 | 加 ConcreteCreator 子类（开闭友好） | 加新产品种类要改所有工厂接口（开闭违反） |
| 复杂度 | 4 角色，轻量 | 4 角色 × N 产品种类，重 |

> 抽象工厂常基于一组工厂方法实现——`GUIFactory.createButton()` 内部就是一个工厂方法。

### 反模式

- **产品类型稳定就上抽象工厂**：只有 Button 一种产品、且不会扩展 Checkbox 时，抽象工厂是过度设计——简单工厂函数足矣，违反 YAGNI
- **新增产品种类时忽视开闭违反**：加 `createSlider()` 要修改 GUIFactory 接口 + 所有 ConcreteFactory——这是抽象工厂的固有代价，决定前必须评估产品种类是否会频繁扩展

## 建造者（Builder）

### 意图与角色

把**复杂对象的构造过程**与它的表示分离，使同样的构造过程可以创建不同的表示。建造者模式解决「伸缩构造函数（Telescoping Constructor）」问题——避免构造器参数从 3 个涨到 10 个时被迫写 N 个重载。

四个核心角色：

- **Builder（建造者接口）**：声明 `setSeats() / setEngine() / setGPS() / reset()` 等构造步骤
- **ConcreteBuilder（具体建造者）**：实现步骤，**链式返回 `this`**；末尾提供 `getResult(): Product`
- **Director（主管，可选）**：封装标准构造流程（如「构造运动型汽车」「构造 SUV」），把构造步骤的调用顺序固化下来
- **Product（产品）**：被构造的复杂对象

### JS/TS 实现

```ts
// 产品
class Car {
  constructor(
    public seats: number = 2,
    public engine?: string,
    public gps: boolean = false
  ) {}
}

// 建造者——链式返回 this
class CarBuilder {
  private car = new Car();

  setSeats(n: number): this { this.car.seats = n; return this; }
  setEngine(engine: string): this { this.car.engine = engine; return this; }
  enableGPS(): this { this.car.gps = true; return this; }

  reset(): this { this.car = new Car(); return this; }

  // 末尾返回产品
  getResult(): Car { return this.car; }
}

// 简单场景直接链式调用，不需要 Director
const car = new CarBuilder()
  .setSeats(4)
  .setEngine("V8")
  .enableGPS()
  .getResult();

// Director 主管——封装标准流程，便于复用（可选）
class CarDirector {
  constructor(private builder: CarBuilder) {}

  // 「构造 SUV」的标准流程
  buildSUV() {
    return this.builder
      .reset()
      .setSeats(7)
      .setEngine("V6")
      .enableGPS()
      .getResult();
  }
}
```

### 关键要点

- **解决伸缩构造函数**：避免 `new Car(4, "V8", true, false, "red", ...)` 这种参数爆炸
- **链式调用的实现**：每个 `setXxx()` 都 `return this`——这是 TS/JS 链式 Builder 的惯用法
- **Director 不是必需**：Refactoring.Guru 明确「Director is optional」——只有「多套标准构造流程需要复用」时才有价值；简单场景直接链式调用即可
- **返回时机**：Builder 在所有步骤完成后通过 `getResult()` 一次性返回产品；与抽象工厂「立即返回产品」形成对比

### 反模式

- **简单对象套 Builder**：只有 2-3 个字段的对象直接用对象字面量或构造函数，Builder 是给「构造步骤多、可选参数多、构造流程有标准模板」的复杂对象用的
- **强加 Director**：所有调用方都自己写链式时还硬塞一层 Director，徒增类数量

## 原型（Prototype）

### 意图与角色

用**克隆已有实例**的方式创建新对象，避免重新执行昂贵的初始化过程。原型模式的核心是 `clone(): T` 接口——客户端不 `new`，而是从一个「原型对象」复制出新实例。

JS 原生 API 与原型模式深度对应：

- `Object.create(proto, descriptors?)`：以 `proto` 为 `[[Prototype]]` 创建新对象——这是原型模式最直接的语言级实现
- `structuredClone(value, options?)`：现代深拷贝标准（2022 年起全浏览器可用），支持循环引用、Date、Map / Set、ArrayBuffer
- 展开运算符 `{...obj}` / `[...arr]`：浅拷贝（共享引用字段）

### Object.create 的真实行为

```ts
const proto = { greet() { return "hi"; } };

// 以 proto 为原型创建新对象——obj.greet() 会沿原型链找到 proto.greet
const obj = Object.create(proto);
obj.greet(); // "hi"

// 陷阱 1：传非对象非 null 的 proto 会抛 TypeError
Object.create(42);          // TypeError
Object.create("foo");       // TypeError

// 陷阱 2：propertiesObject 创建的属性默认全 false（与对象字面量不同！）
const o = Object.create({}, { p: { value: 42 } });
o.p = 24;                   // 严格模式抛错；非严格模式静默失败（p 是只读的）
for (const k in o) { console.log(k); }  // 什么都打印不出（p 不可枚举）
```

修复陷阱 2 的方式是显式声明描述符：

```ts
const o = Object.create({}, {
  p: { value: 42, writable: true, enumerable: true, configurable: true }
});
```

### structuredClone 的能力边界

```ts
// 支持循环引用、Date、Map / Set、TypedArray、ArrayBuffer
const original = {
  date: new Date(),
  map: new Map([["k", 1]]),
  set: new Set([1, 2, 3]),
  self: null as any,
};
original.self = original; // 循环引用

const cloned = structuredClone(original);
console.log(cloned.date instanceof Date); // true
console.log(cloned.map.get("k"));         // 1
console.log(cloned.self === cloned);      // true（循环引用被正确处理）

// 转移 transferable（原对象失效）
const buf = new ArrayBuffer(8);
const cloned2 = structuredClone(buf, { transfer: [buf] });
console.log(buf.byteLength);    // 0——已被转移
console.log(cloned2.byteLength); // 8
```

**不可克隆的类型**：函数（抛 DataCloneError）、DOM 节点、Symbol、属性描述符、Error（部分浏览器支持）。

**重要陷阱：structuredClone 不保留原型链**——类实例克隆后 `instanceof` 失败、原型上方法全部丢失：

```ts
class Person {
  constructor(public name: string) {}
  greet() { return `hi, ${this.name}`; }
}

const p = new Person("Alice");
const clone = structuredClone(p);

console.log(clone.name);           // "Alice"——数据字段保留了
console.log(clone.greet);          // undefined！原型方法丢失
console.log(clone instanceof Person); // false
```

需要保留原型链时自己实现 `clone()` 方法：

```ts
class Person {
  constructor(public name: string) {}
  greet() { return `hi, ${this.name}`; }

  // 推荐写法：复制逻辑放在构造函数里（Refactoring.Guru 推荐）
  clone() {
    return new Person(this.name); // 直接走构造函数，保证原型链
  }
}

const p = new Person("Alice");
const clone = p.clone();
console.log(clone.greet());           // "hi, Alice"
console.log(clone instanceof Person); // true
```

### 反模式

- **用 JSON.parse(JSON.stringify) 深拷贝**：丢 Date（变 ISO 字符串）、Map / Set（变 `{}`）、RegExp、TypedArray、函数（变 `null`）、undefined 被剔除、循环引用直接 throw——应优先 structuredClone
- **structuredClone 类实例后期望保留方法**：原型链会被丢弃，`clone.greet` 是 undefined、`instanceof` 失败，运行期方法调用崩
- **Object.create 传非对象 proto**：抛 TypeError，必须传对象或 null
- **Object.create 用 propertiesObject 后忘记显式声明描述符**：默认 writable / enumerable / configurable 全 false
- **用 Object.create 实现继承后忘记修复 constructor**：`Child.prototype = Object.create(Parent.prototype)` 后 constructor 变成 Parent，需用属性描述符显式重置

## 单例（Singleton）

### 意图与角色

保证一个类**只有一个实例**，并提供一个全局访问点。单例模式的核心是「三要素」：

- **私有静态 instance 字段**：持有唯一实例
- **私有构造函数**：阻止外部 `new`
- **公有静态 getInstance()**：返回唯一实例（按需创建）

### TS 实现

```ts
class Database {
  // 1. 私有静态 instance 字段
  private static instance: Database;

  // 2. 私有构造函数——阻止外部 new
  private constructor(private connectionString: string) {}

  // 3. 公有静态 getInstance()——按需创建
  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database("mysql://localhost:3306/db");
    }
    return Database.instance;
  }

  query(sql: string) { /* ... */ }
}

// 外部不能 new Database(...)——TS 编译期报错
// const db = new Database("..."); // Error: Constructor of class 'Database' is private

// 只能通过 getInstance() 拿到唯一实例
const db = Database.getInstance();
const db2 = Database.getInstance();
console.log(db === db2); // true
```

### 现代 JS 替代方案：ES Module 天然单例

ES Module 规范保证模块**仅求值一次**——这意味着模块顶层导出的对象天生就是单例：

```ts
// config.ts
export const config = {
  apiBaseUrl: "https://api.example.com",
  timeout: 5000,
};

// 任何 import config 的地方拿到的都是同一个对象
// 不同模块多次 import 同一文件，引擎只跑一次模块顶层代码
```

推荐优先用 ES Module 单例而非手写 Singleton 类，原因：

- **没有隐藏静态依赖**：import 关系在文件顶部可见，依赖图清晰
- **懒加载友好**：ES Module 是按需加载的，首次 import 才执行
- **Tree-shaking 友好**：未使用的导出可被构建器消除
- **不引入测试 mock 困难**：手写 Singleton 的私有构造函数极难在单测里替换实例

### 单例违反单一职责

单例模式同时解决「唯一性」和「全局访问」两个问题——这违反单一职责原则：

- 「唯一性」：保证实例只创建一次
- 「全局访问」：提供从任意位置拿实例的入口

这种耦合让单例容易演化成「God Object」——所有需要全局访问的服务都被塞进同一个单例，最终成为隐藏依赖中心，使组件耦合、单元测试几乎无法 mock。

### 反模式

- **God Object 单例**：把 logger、config、cache、user state 全塞进一个 Singleton——应拆成多个独立模块
- **JS 写双重检查锁（DCL）**：JS 单线程、无抢占式多线程，DCL 是 JVM 多线程场景的产物，在 JS 里纯属噪音；异步初始化竞态用 Promise 缓存解决而非锁
- **手写 Singleton 类替代 ES Module 单例**：现代代码优先 `export const config`，手写类只在需要懒加载 + 私有构造 + 复杂初始化逻辑时才用

## 五模式间的关系

GoF 五种创建型模式并非互斥选择，常常组合使用：

- **抽象工厂常基于一组工厂方法实现**：GUIFactory 的每个 `createButton()` / `createCheckbox()` 内部都是工厂方法
- **Builder / 抽象工厂 / 原型 / 工厂都可以被实现为单例**：通常只需要一个工厂实例，单例化它能避免重复创建工厂
- **原型与工厂方法互为替代**：工厂方法用「继承 + 子类 new」创建产品，原型用「克隆已有实例」——当子类数量爆炸时，原型注册表（PrototypeRegistry）常是更轻量的替代
- **原型注册表常是单例**：全局共享一份「name → prototype」的 Map

## 下一步

- [参考](./reference.md)：五模式对比表、前端映射速查、官方资源链接
