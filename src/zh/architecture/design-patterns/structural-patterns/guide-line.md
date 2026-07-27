---
layout: doc
outline: [2, 3]
---

# 七大模式详解

> 基于 Refactoring.Guru 结构型模式合集、MDN Web Docs（JavaScript Proxy）、GoF 原书编写，覆盖适配器 / 桥接 / 组合 / 装饰器 / 外观 / 享元 / 代理 七个模式的前端 JS / TS 实现、应用场景与反模式

## 速查

- **Adapter**：`Target` / `Adaptee` / `Adapter`；对象适配器基于组合（implements Target + 持 Adaptee），前端用于回调转 Promise、第三方库封装、新旧 API 迁移
- **Bridge**：`Abstraction` / `RefinedAbstraction` / `Implementor` / `ConcreteImplementor`；拆开「抽象层」与「实现层」两套继承树，解决多维度变化类爆炸
- **Composite**：`Component` / `Leaf` / `Composite`；透明式（add/remove 放 Component，Leaf 留空 / 抛异常）vs 安全式（只放 Composite，需 instanceof）
- **Decorator**：`Component` / `ConcreteComponent` / `BaseDecorator`（持引用 + 默认委托）/ `ConcreteDecorator`；链式叠加成栈；前端典型为 React HOC、middleware
- **Facade**：`Facade` / `Subsystem`；为复杂子系统定义**新的简化统一接口**，与 Adapter 包装单个对象不同
- **Flyweight**：`Flyweight` / `ConcreteFlyweight` / `FlyweightFactory`（对象池）/ `Context`；内在状态（共享、不可变、Object.freeze）vs 外在状态（实例独有）
- **Proxy**：`Subject` / `RealSubject` / `Proxy`；六变体（Virtual / Protection / Remote / Logging / Caching / Smart Reference）；与 RealSubject 接口一致可互换
- **JS Proxy**：`new Proxy(target, handler)` + `Proxy.revocable`；13 个 trap；必须配合 `Reflect` 转发；`set` 必须返回 true
- **Vue 3 reactive**：基于 ES6 Proxy；get 中 track、set 中 trigger；能感知属性增删 / `in` / `ownKeys` / 数组索引；惰性深度响应
- **React HOC**：`HOC(Wrapped) => Enhanced`；六大注意：组合不修改原型 / 透传 props / 不在 render 调用 / forwardRef 透 ref / hoist-non-react-statics / displayName

## 1. Adapter 适配器

**意图**：把一个类的接口转换成客户端期望的另一个接口，让原本接口不兼容的类能协作。

**角色**

- **Target**：客户端期望的接口
- **Adaptee**：需要被适配的现有类（接口与 Target 不兼容）
- **Adapter**：实现 Target 接口，内部持有 Adaptee 引用，把 Target 调用转发给 Adaptee

**前端实现**

```ts
// Target：现代业务期望的 Promise 接口
interface Fetcher {
  fetch(url: string): Promise<string>;
}

// Adaptee：老旧的回调式 SDK，与 Target 不兼容
class LegacyAjax {
  request(url: string, cb: (err: Error | null, data: string) => void): void {
    // ...老逻辑
    cb(null, "data from " + url);
  }
}

// Adapter：实现 Target，内部委托给 Adaptee
class AjaxAdapter implements Fetcher {
  private legacy = new LegacyAjax();
  fetch(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.legacy.request(url, (err, data) =>
        err ? reject(err) : resolve(data)
      );
    });
  }
}

// 客户端只认 Target
const fetcher: Fetcher = new AjaxAdapter();
fetcher.fetch("/api").then(console.log);
```

**前端典型场景**

- **回调转 Promise**：把 Node 风格 `(err, data) => void` 包成 Promise（`util.promisify` 也是这个思路）
- **第三方库封装**：jQuery 风格 API 适配到现代 fetch / axios 接口
- **新旧 API 迁移**：v1 与 v2 接口不一致，用 Adapter 让 v1 调用方继续工作
- **类适配器**（仅多继承语言如 C++）：同时继承 Target + Adaptee；JS / TS 只能用对象适配器

**反模式**

- 把 Adapter 用在「设计阶段就预知多维度变化」的场景——应改用 Bridge 拆继承树
- 适配器写成了改接口（增删方法）——Adapter 必须**保持接口契约**，只做协议转换

## 2. Bridge 桥接

**意图**：把「抽象层」与「实现层」拆成两套独立继承树，使它们可以独立演化，避免多维度变化的类爆炸。

**角色**

- **Abstraction**：高层抽象，持有 Implementor 引用
- **RefinedAbstraction**：扩展 Abstraction
- **Implementor**：实现层接口
- **ConcreteImplementor**：具体实现

**类爆炸问题**：假设有 `Button` × 颜色（红 / 蓝）× 平台（Web / Mobile）× 主题（亮 / 暗）四维变化，纯继承需 2 × 2 × 2 = 8 个子类，加一维就翻倍。Bridge 把「抽象」（Button 的行为）与「实现」（颜色 / 平台 / 主题）拆开，独立演化。

**前端实现**

```ts
// Implementor：渲染后端接口
interface Renderer {
  renderCircle(radius: number): void;
}
class WebGLRenderer implements Renderer {
  renderCircle(r: number) { console.log(`WebGL 绘制 r=${r}`); }
}
class CanvasRenderer implements Renderer {
  renderCircle(r: number) { console.log(`Canvas 绘制 r=${r}`); }
}

// Abstraction：抽象层持 Implementor 引用
abstract class Shape {
  constructor(protected renderer: Renderer) {}
  abstract draw(): void;
}
class Circle extends Shape {
  constructor(renderer: Renderer, private r: number) { super(renderer); }
  draw() { this.renderer.renderCircle(this.r); }
}

// 两个维度独立演化：任意组合
new Circle(new WebGLRenderer(), 5).draw();
new Circle(new CanvasRenderer(), 5).draw();
```

**前端典型场景**：跨平台 UI 框架（React Native `Renderer` 抽象 + iOS / Android 实现）、跨终端 SDK、主题系统（控件类型 × 主题色）。

**反模式**

- 把 Bridge 用在「事后补救一个不兼容接口」——Bridge 是设计期决策，事后补救应改用 Adapter

## 3. Composite 组合

**意图**：把对象组合成树形结构，使叶子（Leaf）与容器（Composite）共享同一接口，让客户端能统一递归处理整棵树。

**角色**

- **Component**：统一接口（含 `operation()` / `add()` / `remove()` / `getChild()`）
- **Leaf**：叶子节点，无子节点
- **Composite**：容器节点，持有子 Component 列表，operation 委托给所有子节点

**透明式 vs 安全式**

| 设计 | add/remove 位置 | 优点 | 缺点 |
| --- | --- | --- | --- |
| **透明式** | Component 接口（Leaf 留空或抛异常） | 客户端无需 instanceof 判断 | 违反接口隔离原则（Leaf 实现冗余方法） |
| **安全式** | 只在 Composite 上定义 | 接口干净 | 客户端需 instanceof 判断才能 add/remove |

**前端实现**（透明式）

```ts
interface FSNode {
  getName(): string;
  getSize(): number;
  print(indent?: string): void;
  add?(node: FSNode): void; // 透明式：放在接口上
}

class FileNode implements FSNode {
  constructor(private name: string, private size: number) {}
  getName() { return this.name; }
  getSize() { return this.size; }
  print(indent = "") { console.log(`${indent}- ${this.name} (${this.size}B)`); }
  add() { throw new Error("叶子节点不能 add"); }
}

class DirNode implements FSNode {
  private children: FSNode[] = [];
  constructor(private name: string) {}
  getName() { return this.name; }
  getSize() { return this.children.reduce((s, c) => s + c.getSize(), 0); }
  add(node: FSNode) { this.children.push(node); return this; }
  print(indent = "") {
    console.log(`${indent}+ ${this.name}/ (${this.getSize()}B)`);
    this.children.forEach((c) => c.print(indent + "  "));
  }
}

const root = new DirNode("src")
  .add(new FileNode("index.ts", 200))
  .add(new DirNode("utils").add(new FileNode("fn.ts", 50)));
root.print();
```

**前端典型场景**：UI 组件树（React `<Component>` 树）、AST（Babel / ESLint 遍历）、虚拟 DOM diff、文件系统、可折叠菜单。

**反模式**

- 透明式在 Leaf 中 `throw new Error('不能 add')` 让客户端遍历时崩溃——应留空或用安全式
- 安全式中频繁 `instanceof Composite` 判断——违背了「统一处理」初衷

## 4. Decorator 装饰器

**意图**：动态地给一个对象叠加额外职责，比继承更灵活——通过持有原对象引用 + 委托 + 增强，可在运行时自由组合多个装饰器。

**角色**

- **Component**：统一接口
- **ConcreteComponent**：被装饰的原对象
- **BaseDecorator**：实现 Component 接口，持有 Component 引用，默认全部委托
- **ConcreteDecorator**：扩展 BaseDecorator，在委托前后加增强

**链式叠加**：装饰器像洋葱一样层层包裹，最外层先执行前置逻辑，逐层向内委托到最内层原对象，执行完再逐层返回后置逻辑。

**前端实现**

```ts
interface DataSource {
  write(value: string): void;
  read(): string;
}

// ConcreteComponent：被装饰的原对象
class FileDataSource implements DataSource {
  constructor(private filename: string) {}
  write(value: string) { console.log(`写入 ${this.filename}: ${value}`); }
  read() { return "raw"; }
}

// BaseDecorator：持引用 + 默认委托
class DataSourceDecorator implements DataSource {
  constructor(protected wrappee: DataSource) {}
  write(value: string) { this.wrappee.write(value); }
  read() { return this.wrappee.read(); }
}

// ConcreteDecorator：加密
class EncryptionDecorator extends DataSourceDecorator {
  write(value: string) { super.write("[enc]" + value); }
  read() { return super.read().replace("[enc]", ""); }
}

// ConcreteDecorator：压缩
class CompressionDecorator extends DataSourceDecorator {
  write(value: string) { super.write("[zip]" + value); }
  read() { return super.read().replace("[zip]", ""); }
}

// 链式组合：Compression → Encryption → FileDataSource
const source = new CompressionDecorator(
  new EncryptionDecorator(new FileDataSource("a.txt"))
);
source.write("hello");
// 输出：写入 a.txt: [zip][enc]hello
```

### React HOC = Decorator 的函数式实现

React 官方明确把 HOC 定义为 Decorator 模式的函数式实现——签名 `HOC(WrappedComponent) => EnhancedComponent`，单参一等函数，是组件级 Decorator：

```tsx
// withAuth 是一个 Decorator：持 Wrapped 引用 + 增强行为 + 透传 props
function withAuth<P extends object>(
  Wrapped: React.ComponentType<P>
): React.ComponentType<P> {
  function Enhanced(props: P) {
    const user = useCurrentUser();
    if (!user) return <Redirect to="/login" />;
    return <Wrapped {...props} user={user} />;
  }
  // 必须设置 displayName 便于 DevTools 调试
  Enhanced.displayName = `withAuth(${Wrapped.displayName || Wrapped.name})`;
  return Enhanced;
}

// 柯里化形式（react-redux connect）：connect(selector)(Component)
const ProtectedPage = withAuth(MyPage);
```

### React HOC 六大注意事项（官方）

1. **用组合不修改原型**——React 官方反对 mixins 与改 `prototype.componentDidUpdate`，函数组件不可用且多个增强相互覆盖
2. **透传无关 props**——`const { extraProp, ...passThroughProps } = this.props; <Wrapped injectedProp={...} {...passThroughProps} />`，否则破坏下游接口契约
3. **绝不在 render 内部调用 HOC**——`const Enhanced = enhance(C); return <Enhanced/>` 每次渲染创建新组件类，React 协调算法判定 `!==` 卸载整个子树重挂载，state 与子节点全丢
4. **ref 不自动透传**——需用 `React.forwardRef` 把 ref 转发给被包裹组件
5. **静态方法需手动拷贝**——用 `hoist-non-react-statics` 把 Wrapped 的静态方法搬到 Enhanced
6. **设 displayName**——`getDisplayName(Wrapped) => WithX(WrappedName)` 便于 React DevTools 辨识

### 装饰器链的执行顺序

```ts
// Compression(外) → Encryption(中) → FileDataSource(内)
// write 时：前置逻辑由外到内，最终写入最内层
// read 时：从最内层读出，后置逻辑由内到外
const ds = new Compression(new Encryption(new FileSource("a")));
ds.write("x");
// ① Compression.write：[zip] + x
// ② Encryption.write：[enc] + [zip]x
// ③ FileSource.write：写入文件 → "[enc][zip]x"
```

**反模式**

- 修改被装饰组件原型（mixins）——React 官方明确反对
- 在 render 内部调用 HOC——子树卸载重挂载
- HOC 不透传 props——破坏下游契约

## 5. Facade 外观

**意图**：为复杂子系统定义一个**新的、简化、统一**的接口，让客户端无需了解子系统内部结构。

**角色**

- **Facade**：对外暴露的简化接口
- **Subsystem Classes**：复杂子系统的多个类，Facade 持有它们的引用

**与 Adapter 的区别**：Adapter 包装**单个对象**做协议转换，**接口必须与 Target 一致**；Facade 给**整个子系统**定义**新的简化接口**，可以与子系统接口完全不同。

**前端实现**

```ts
// Subsystem：复杂的通知系统（多个分散模块）
class EmailService {
  send(to: string, body: string) { console.log(`email → ${to}`); }
}
class SmsService {
  text(phone: string, msg: string) { console.log(`sms → ${phone}`); }
}
class PushService {
  notify(uid: string, payload: object) { console.log(`push → ${uid}`); }
}

// Facade：对外暴露统一简化接口
class NotificationFacade {
  private email = new EmailService();
  private sms = new SmsService();
  private push = new PushService();
  // 一键多渠道通知
  broadcastAll(contact: { email: string; phone: string; uid: string }, msg: string) {
    this.email.send(contact.email, msg);
    this.sms.text(contact.phone, msg);
    this.push.notify(contact.uid, { text: msg });
  }
}

// 客户端只认 Facade，不直接接触子系统
new NotificationFacade().broadcastAll(
  { email: "a@b.com", phone: "13800000000", uid: "u1" },
  "hello"
);
```

**前端典型场景**

- **统一 API 封装层**：`window.$API` 把分散的 fetch / WebSocket / localStorage 包成统一入口
- **SDK 简化入口**：支付 SDK 把风控、签名、下单、跳转等多个服务封装成 `sdk.pay(amount)`
- **智能家居一键模式**：「回家模式」一键关窗帘、开灯、开空调

**反模式**

- 把 Facade 当 Adapter 用（仅包装一个对象）——失去了「为整个子系统定义简化接口」的意义
- Facade 越来越胖——Facade 应保持精简，膨胀时考虑拆成多个 Facade

## 6. Flyweight 享元

**意图**：通过共享细粒度对象的**内在状态**来支持大量相似对象，省内存。

**角色**

- **Flyweight**：享元接口
- **ConcreteFlyweight**：享元对象，只包含**内在状态**（可共享、不可变）
- **FlyweightFactory**：对象池，`getFlyweight(key)` 返回已缓存的实例或新建
- **Context**：调用方持有**外在状态**（实例独有），调用时把外在状态作为参数传入

**内在状态 vs 外在状态**

| 维度 | 内在状态（intrinsic） | 外在状态（extrinsic） |
| --- | --- | --- |
| 是否可共享 | 是 | 否 |
| 是否可变 | 不可变（必须 `Object.freeze`） | 可变 |
| 持有者 | Flyweight | Context |
| 例子 | 按钮样式（bg / border / font）、棋子颜色 | 坐标、文本、速度 |

**前端实现**（围棋棋子，颜色只有黑白两种内在状态）

```ts
// Flyweight：内在状态（颜色）—— 不可变、可共享
interface ChessFlyweight {
  color: "black" | "white";
  display(pos: [number, number]): void; // 外在状态作为参数传入
}
class ChessPiece implements ChessFlyweight {
  constructor(public readonly color: "black" | "white") {}
  display(pos: [number, number]) {
    console.log(`${this.color} at (${pos[0]}, ${pos[1]})`);
  }
}

// FlyweightFactory：对象池
class ChessFactory {
  private static pool = new Map<string, ChessPiece>();
  static get(color: "black" | "white"): ChessPiece {
    if (!this.pool.has(color)) {
      this.pool.set(color, new ChessPiece(color));
    }
    return this.pool.get(color)!;
  }
  static count() { return this.pool.size; }
}

// Context：位置是外在状态，每步棋独有
const moves: { piece: ChessFlyweight; pos: [number, number] }[] = [];
moves.push({ piece: ChessFactory.get("black"), pos: [3, 3] });
moves.push({ piece: ChessFactory.get("white"), pos: [4, 4] });
moves.push({ piece: ChessFactory.get("black"), pos: [5, 3] });
// 3 步棋只有 2 个 ChessPiece 对象（黑白各一）
console.log(ChessFactory.count()); // 2
```

**前端典型场景**

- **虚拟列表**（react-window / vue-virtual-scroller）：只渲染可视区域 DOM，滚动时复用节点更新数据——DOM 结构是内在状态、数据项是外在状态
- **DOM 节点对象池**：游戏 / 表格大量相似节点复用
- **纹理 / 字体 / 图标精灵图缓存**：图集（sprite sheet）一次加载多处复用

**何时该用 / 不该用**

| 场景 | 是否用 Flyweight |
| --- | --- |
| 对象数量万级以上 + 大量重复数据 | ✅ 该用 |
| 对象数量少 + 无可共享状态 | ❌ 不该用，徒增复杂度 |
| 外在状态频繁重算拖慢 CPU | ⚠️ 权衡 RAM 换 CPU 是否值 |

**反模式**

- 内在状态可变——混入可变字段会污染所有引用者
- 在对象数量少时强用——「过早优化」，复杂度收益为负
- 没用 `Object.freeze` 保护内在状态——意外修改会破坏共享前提

## 7. Proxy 代理

**意图**：为另一个对象提供代理以控制访问——Proxy 与 RealSubject **接口完全一致可互换**，可附加延迟初始化、权限校验、缓存、日志等控制逻辑。

**角色**

- **Subject**：统一接口
- **RealSubject**：真实对象（被代理的对象）
- **Proxy**：代理对象，持有 RealSubject 引用，自主管理其生命周期

**Proxy vs Decorator（关键区别）**

| 维度 | Proxy | Decorator |
| --- | --- | --- |
| 接口 | 与 RealSubject 完全一致 | 与原对象一致或扩展 |
| 生命周期管理 | **Proxy 自主管理** RealSubject（懒加载、引用计数） | **客户端组装**，不管理生命周期 |
| 意图 | 控制访问 | 增强行为 |
| 何时用 | 权限 / 懒加载 / 缓存 | 日志 / 性能埋点 / 职责叠加 |

**六种变体**

| 变体 | 意图 | 前端典型场景 |
| --- | --- | --- |
| **Virtual Proxy** 虚拟 | 延迟初始化（首次访问才创建） | 图片懒加载、按需加载大对象 |
| **Protection Proxy** 保护 | 权限校验后转发 | 接口鉴权、字段级权限 |
| **Remote Proxy** 远程 | 本地代表远程对象 | RPC、本地调用网络服务 |
| **Logging Proxy** 日志 | 记录调用 | 性能监控、审计日志 |
| **Caching Proxy** 缓存 | 缓存结果 | 请求缓存、计算结果 memo |
| **Smart Reference** 智能引用 | 引用计数、空时加载 | 对象池、自动释放 |

**虚拟代理实现**（懒加载图片）

```ts
interface Image {
  display(): void;
}
class RealImage implements Image {
  constructor(private file: string) {
    console.log(`从磁盘加载 ${file}...`); // 构造时即加载
  }
  display() { console.log(`显示 ${this.file}`); }
}
class ProxyImage implements Image {
  private real?: RealImage;
  constructor(private file: string) {}
  display() {
    if (!this.real) this.real = new RealImage(this.file); // 首次访问才加载
    this.real.display();
  }
}

// 首次 display 才加载，未访问不消耗资源
const img = new ProxyImage("big.jpg");
console.log("代理已创建，未加载");
img.display(); // 此时才从磁盘加载
```

### JavaScript Proxy 对象 = Proxy 设计模式的语言特性

ES2015 引入的 `new Proxy(target, handler)` 是语言级别的 Proxy 能力——可拦截 13 种基本操作（trap），是「用语言特性落地设计模式」的范例：

```ts
// Caching Proxy：用 JS Proxy 实现请求缓存
function cached<T extends object>(target: T): T {
  const cache = new Map<string, unknown>();
  return new Proxy(target, {
    get(obj, key, receiver) {
      if (cache.has(key as string)) return cache.get(key);
      const val = Reflect.get(obj, key, receiver);
      cache.set(key as string, val);
      return val;
    },
  });
}
```

### 13 个 trap 与对应操作

| trap | 被拦截操作 |
| --- | --- |
| `get` | 属性读 `obj.key` |
| `set` | 属性写 `obj.key = v`（**必须返回 true**） |
| `has` | `in` 操作符、`with` 块 |
| `deleteProperty` | `delete obj.key` |
| `ownKeys` | `Object.keys` / `getOwnPropertyNames` / `Reflect.ownKeys` |
| `defineProperty` | `Object.defineProperty` |
| `getOwnPropertyDescriptor` | `Object.getOwnPropertyDescriptor` |
| `getPrototypeOf` | `Object.getPrototypeOf` / `__proto__` |
| `setPrototypeOf` | `Object.setPrototypeOf` / `obj.__proto__ =` |
| `isExtensible` | `Object.isExtensible` |
| `preventExtensions` | `Object.preventExtensions` |
| `apply` | 函数调用 `proxy(...)` |
| `construct` | `new proxy(...)` |

**必会三原则**

1. **必须配合 `Reflect` 转发**——`return Reflect.get(...arguments)` 保持默认行为并正确处理 receiver
2. **`set` trap 必须返回 `true` 或反映成功**——违反 Proxy invariants 会抛 TypeError（对不可配置 / 只读属性）
3. **私有字段 / 原生对象内部插槽用 target 而非 receiver**——`Map` / `Set` / `Date` 的 `[[MapData]]` 等内部插槽用 receiver 会无限递归

### Vue 3 reactive = JS Proxy 落地

Vue 3 用 Proxy 替代 Vue 2 的 `Object.defineProperty`，是「Proxy 设计模式 + 语言特性」的工业级落地：

```ts
function reactive<T extends object>(target: T): T {
  return new Proxy(target, {
    get(obj, key, receiver) {
      track(obj, key); // 收集依赖
      // 子对象递归 reactive（惰性深度响应——访问时才转换）
      const val = Reflect.get(obj, key, receiver);
      return typeof val === "object" && val !== null ? reactive(val) : val;
    },
    set(obj, key, value, receiver) {
      const old = obj[key];
      const ok = Reflect.set(obj, key, value, receiver);
      if (old !== value) trigger(obj, key); // 触发更新
      return ok; // ⚠️ 必须 return true
    },
    has(obj, key) {
      track(obj, key); // 拦截 in 操作符
      return Reflect.has(obj, key);
    },
    deleteProperty(obj, key) {
      const ok = Reflect.deleteProperty(obj, key);
      if (ok) trigger(obj, key); // 拦截 delete
      return ok;
    },
  });
}
```

**为何 Vue 3 弃 `Object.defineProperty` 选 Proxy**

| 维度 | `Object.defineProperty`（Vue 2） | `Proxy`（Vue 3） |
| --- | --- | --- |
| 属性增删 | ❌ 检测不到，需 `Vue.set` / `$delete` | ✅ 自动感知 |
| `in` 操作符 | ❌ 不能拦截 | ✅ `has` trap |
| `Object.keys` | ❌ 不能拦截 | ✅ `ownKeys` trap |
| 数组索引 / 长度 | ❌ 需重写 7 个数组方法 | ✅ 原生拦截 |
| 深度响应 | 初始化时全量递归转换 | **惰性**——访问时才递归，首屏更快 |
| 兼容性 | ES5，可 polyfill 到 IE8 | ES2015，**无法 polyfill / transpile** |

### Proxy 的限制与坑

- ❌ 不能代理私有字段 `#field`——需用 target 而非 receiver 转发
- ❌ 不能转发 `Map` / `Set` / `Date` / `WeakMap` 等原生对象的内部插槽——会抛 TypeError
- ❌ target 必须是对象——`new Proxy("str", {})` 抛错
- ❌ 无法 polyfill / transpile 到 ES5——Proxy 拦截的是引擎内部方法 `[[Get]]` / `[[Set]]`，ES5 无等价物
- ❌ 违反 invariants 抛 TypeError——如对不可配置属性 `get` 返回非真实值

## 反模式（避坑）

- **修改被装饰组件原型**（mixins / 改 prototype）——React 官方反对，多增强相互覆盖，函数组件不可用
- **在 render 内部调用 HOC**——每次渲染创建新组件类，触发子树卸载重挂载，state 与子节点全丢
- **Proxy trap 不用 Reflect、`set` 不返回 true**——违反 Proxy invariants 抛 TypeError
- **Proxy get 在 receiver 上递归调用同名方法**——导致无限递归（私有字段 / 原生对象内部插槽需用 target）
- **享元滥用**——对象数量少或无可共享状态时强套，徒增复杂度
- **混淆 Adapter / Bridge / Facade / Decorator 意图**——Adapter 包装单对象协议转换、Bridge 设计期拆两套继承树、Facade 给子系统定义新简化接口、Decorator 同接口增强
- **Composite 透明式 Leaf 中 `throw new Error`**——客户端遍历时误触叶子崩溃
- **Proxy 与 Decorator 混用**——本应懒加载写成 Decorator（客户端被迫组装）、本应日志增强写成 Proxy（生命周期自管无法移除）
- **HOC 不透传 props**——吞掉 `input` 的 `value` / `onChange` 等破坏下游契约
- **继续把 Vue 2 `Object.defineProperty` 思路用于新项目**——无法感知新增属性、需 `$set` / `$delete`、需重写数组方法

## 下一步

- [参考](./reference.md)：七模式对比表、前端映射、官方资源链接
