---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Refactoring.Guru 结构型模式合集、MDN Web Docs（JavaScript Proxy）、GoF 原书《设计模式》编写

## 速查

- 结构型模式共 **7 个**：适配器 / 桥接 / 组合 / 装饰器 / 外观 / 享元 / 代理
- 关注点：**类与对象怎么组合成更大结构**（区别于创建型的「对象怎么建」、行为型的「运行时职责分配」）
- 五者意图辨析：**Adapter** 改现有接口 / **Bridge** 设计期拆两套继承树 / **Facade** 定义新简化接口 / **Proxy** 同接口控制访问 / **Decorator** 增强不改接口
- 前端典型映射：
  - 装饰器 = **React HOC**（Component => Component）、TS `@decorator` 提案
  - 代理 = **Vue 3 reactive**（基于 ES6 Proxy）、JS Proxy 13 个 trap
  - 组合 = **UI 组件树**（Leaf + Composite 同接口）、AST、虚拟 DOM
  - 外观 = **`window.$API` 封装层**、SDK 简化入口
  - 适配器 = **回调转 Promise**、第三方库封装、新旧 API 迁移
  - 享元 = **虚拟列表**（react-window / vue-virtual-scroller）、DOM 节点池、纹理缓存
- Composite 透明式（add/remove 放 Component 接口）vs 安全式（只放 Composite）
- Flyweight 内在状态（可共享、不可变、Object.freeze）vs 外在状态（实例独有、Context 持有）
- Proxy 六变体：虚拟（懒加载）/ 保护（权限）/ 远程 / 日志 / 缓存 / 智能引用
- JS Proxy 必会：`new Proxy(target, handler)`、13 trap、必须配合 `Reflect` 转发、`set` 必须返回 true
- Vue 3 选 Proxy 替代 `Object.defineProperty`：能感知属性增删、拦截 `in` / `ownKeys` / 数组索引、惰性深度响应
- 优先**组合（has-a）而非继承（is-a）**做行为扩展

## 什么是结构型设计模式

GoF 把 23 个模式按意图分三大类，结构型模式关注的是「**如何把类或对象组合成更大的结构**」：

- **创建型**（5 个）：对象怎么建——单例、工厂、抽象工厂、建造者、原型
- **结构型**（7 个）：对象怎么组合——适配器、桥接、组合、装饰器、外观、享元、代理
- **行为型**（11 个）：对象怎么协作——责任链、命令、解释器、迭代器、中介者、备忘录、观察者、状态、策略、模板方法、访问者

结构型模式假设对象已经存在，关心它们的**接口契约**与**组合关系**，让原本不兼容或松散的类协作起来。

> 与创建型 / 行为型的边界：创建型关心「实例化」，结构型关心「静态组合关系」，行为型关心「运行时职责分配」。Composite 是结构型（静态树结构），Observer 是行为型（运行时事件流），两者常配合（UI 组件树 + 事件传播）。

## 七大模式速览

| 模式 | 一句话意图 | 经典角色 | 前端典型场景 |
| --- | --- | --- | --- |
| **Adapter** 适配器 | 把不兼容接口转换成兼容接口 | Target / Adaptee / Adapter | 回调转 Promise、第三方库封装、新旧 API 迁移 |
| **Bridge** 桥接 | 把抽象与实现拆成两套独立继承树 | Abstraction / Implementor | 控件类型 × 渲染后端、跨平台 UI 框架 |
| **Composite** 组合 | 用统一接口递归处理树形结构 | Component / Leaf / Composite | UI 组件树、AST、虚拟 DOM、文件系统 |
| **Decorator** 装饰器 | 不改接口下动态叠加职责 | Component / BaseDecorator | React HOC、middleware、TS `@decorator` |
| **Facade** 外观 | 给复杂子系统定义简化统一接口 | Facade / Subsystem | `window.$API`、SDK 入口、智能家居一键模式 |
| **Flyweight** 享元 | 共享细粒度对象的内在状态省内存 | Flyweight / Factory / Context | 虚拟列表、DOM 节点池、纹理 / 字体缓存 |
| **Proxy** 代理 | 同接口控制访问，自主管理生命周期 | Subject / RealSubject / Proxy | Vue 3 reactive、图片懒加载、权限校验、缓存 |

## 前端应用场景速览

### React HOC = Decorator 模式

React 官方定义 HOC 是「Decorator 模式的函数式实现」——签名 `higherOrderComponent(WrappedComponent) => EnhancedComponent`，通过持有原组件引用并组合渲染来增强行为，而非修改原型：

```ts
// withLogger 是一个 Decorator：持有 Wrapped 引用 + 增强行为 + 透传 props
function withLogger(Wrapped) {
  return function Enhanced(props) {
    console.log("render", Wrapped.name, props);
    return <Wrapped {...props} />;
  };
}
const LoggedButton = withLogger(Button);
```

### Vue 3 reactive = Proxy 设计模式

Vue 3 用 ES6 Proxy 实现 reactive 系统，是「用语言特性落地设计模式」的范例——get 中 track 收集依赖，set 中 trigger 触发更新：

```ts
function reactive(target) {
  return new Proxy(target, {
    get(obj, key, receiver) {
      track(obj, key);
      return Reflect.get(obj, key, receiver);
    },
    set(obj, key, value, receiver) {
      const old = obj[key];
      const ok = Reflect.set(obj, key, value, receiver);
      if (old !== value) trigger(obj, key);
      return ok; // 必须 return true 反映成功
    },
  });
}
```

### 组件树 = Composite 模式

UI 组件树天然是 Composite——叶子节点（`<button>`）和容器节点（`<div>`）共享同一个「组件」接口，可以统一递归渲染：

```
<App>              // Composite
  <Header />       // Leaf
  <Main>           // Composite
    <Card />       // Leaf
    <List>         // Composite
      <Item />     // Leaf
    </List>
  </Main>
</App>
```

### 虚拟列表 = Flyweight 模式

react-window / vue-virtual-scroller 只渲染可视区域 DOM，滚动时复用节点更新数据——DOM 结构是内在状态（可共享），数据项是外在状态（每行独有），万级数据用少量 DOM 即可渲染。

## 何时用哪个

| 场景 | 推荐模式 | 为什么 |
| --- | --- | --- |
| 老旧第三方库 API 不兼容新代码 | **Adapter** | 事后补救接口，包装单个对象 |
| 设计期就预知多维度变化 | **Bridge** | 拆两套继承树，独立演化 |
| 给复杂子系统定义简化入口 | **Facade** | 定义**新的**统一简化接口 |
| 懒加载 / 权限 / 缓存控制访问 | **Proxy** | 同接口可互换，自管生命周期 |
| 动态叠加日志 / 性能 / 缓存 | **Decorator** | 客户端组装，链式增强 |
| 树形结构统一处理 | **Composite** | Leaf 与 Composite 同接口 |
| 万级相似对象省内存 | **Flyweight** | 共享内在状态 |

> Adapter vs Bridge 的关键差异：Adapter 用于**事后**已存在的不兼容；Bridge 用于**设计阶段**预先分离抽象与实现。

## 反模式速览

- 修改被装饰组件原型（mixins / 改 prototype）——破坏可复用性，函数组件不可用
- 在 render 内部调用 HOC——每次渲染创建新组件类，触发整个子树卸载重挂载
- Proxy trap 不用 Reflect、`set` 不返回 true——违反 Proxy invariants 抛 TypeError
- 享元在对象数量少时强用——徒增工厂复杂度，无内存收益
- 混淆 Adapter / Bridge / Facade / Decorator / Proxy 意图——选错模式引入不必要复杂度

## 下一步

- [七大模式详解](./guide-line.md)：适配器 / 桥接 / 组合 / 装饰器 / 外观 / 享元 / 代理 逐个讲，含前端 JS / TS 实现与应用场景
- [参考](./reference.md)：七模式对比表、前端映射、官方资源链接
