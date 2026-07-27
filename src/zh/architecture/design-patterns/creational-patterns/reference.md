---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Refactoring.Guru 设计模式官方教程、MDN（Object.create / structuredClone）与 Addy Osmani《Learning JavaScript Design Patterns》编写，对照 ES2022 + TS 4.3+ 稳定行为

## 速查

- 五种创建型模式：**工厂方法 / 抽象工厂 / 建造者 / 原型 / 单例**——核心都是「抽象对象实例化」
- 工厂方法 vs 抽象工厂：**继承 + 单一产品** vs **组合 + 一族产品**
- 建造者 vs 抽象工厂：**末尾 getResult() 一次返回** vs **立即返回产品**
- 单例三要素：私有静态 instance + 私有构造函数 + 公有静态 getInstance()
- JS 原生 API：`Object.create(proto, desc)` 原型模式、`structuredClone(value, {transfer})` 深拷贝、展开 `{...obj}` 浅拷贝
- 前端工厂实践：`React.createElement(type, props, ...children)`、Vue 3 `h(type, props, children)`
- 单例最佳实践：ES Module `export const config` > 手写 Singleton 类
- structuredClone 不可克隆：函数 / DOM 节点 / Symbol / 描述符；**不保留原型链**
- `Object.create` 属性默认全 false：writable / enumerable / configurable
- 完整说明见 [入门](./getting-started.md) / [五种模式深度讲解](./guide-line.md)

## 五模式对比表

| 模式 | 意图 | 关键角色 | 创建时机 | 复杂度 | 适用场景 |
| --- | --- | --- | --- | --- | --- |
| **工厂方法** | 子类决定实例化哪种产品 | Creator / ConcreteCreator / Product | 子类重写工厂方法时 | 低（4 角色） | 单一产品类型、希望扩展时不改客户端 |
| **抽象工厂** | 创建一族相关产品并保证一致 | GUIFactory / WinFactory / MacFactory | 工厂方法立即返回 | 高（4×N 角色） | 多平台 / 多主题 / 一套兼容组件族 |
| **建造者** | 分步装配复杂对象 | Builder / Director（可选） / Product | 所有步骤完成后 `getResult()` | 中（4 角色） | 多参数 / 多步骤 / 有标准构造流程 |
| **原型** | 克隆已有实例 | `clone(): T` + PrototypeRegistry | 克隆时（已存在原型） | 低 | 创建成本高、子类数量爆炸时替代工厂方法 |
| **单例** | 全局唯一实例 | private constructor + `getInstance()` | 首次调用 getInstance() | 低（1 类） | 数据库连接 / 配置 / 全局状态 |

## 工厂方法 vs 抽象工厂

| 维度 | 工厂方法 | 抽象工厂 |
| --- | --- | --- |
| 创建维度 | 单一产品 | 一族相关产品 |
| 实现机制 | 继承（Creator 子类） | 组合（客户端持工厂） |
| 扩展产品类型 | 加 ConcreteCreator 子类（开闭友好） | 改所有工厂接口（开闭违反） |
| 扩展产品种类 | 不适用 | 加新产品种类 = 改接口（违反开闭） |
| 复杂度 | 4 角色 | 4 × N 产品种类 |
| 典型场景 | Dialog + 不同 Button | WinFactory / MacFactory 整族 UI |

## 建造者 vs 抽象工厂

| 维度 | 建造者 | 抽象工厂 |
| --- | --- | --- |
| 创建方式 | 分步 setXxx + 末尾 getResult() | 立即返回完整产品 |
| 返回时机 | 步骤完成后 | 调用工厂方法即返回 |
| 关注点 | 复杂对象的构造过程 | 整族产品的一致性 |
| Director | 可选，封装标准流程 | 无 |
| 典型场景 | 多字段 Car / 表单 / HTTP 请求 | 多主题 UI 组件库 |

## 原型模式 JS 原生 API

| API | 类型 | 行为 | 保留原型链 | 支持循环引用 | 备注 |
| --- | --- | --- | --- | --- | --- |
| `Object.create(proto, desc)` | 原型链继承 | 以 proto 为 [[Prototype]] 创建新对象 | 是（沿链查找） | N/A | propertiesObject 属性默认全 false |
| `structuredClone(value, {transfer})` | 深拷贝 | 递归复制全部字段 | **否**（原型方法丢失） | 是 | 2022 起全浏览器可用 |
| `{...obj}` / `[...arr]` | 浅拷贝 | 复制顶层字段，引用字段共享 | 否 | 否 | 简单对象常用 |
| `JSON.parse(JSON.stringify(obj))` | 深拷贝 | 走 JSON 序列化 | 否 | **抛错** | 丢 Date / Map / Set / RegExp / undefined |
| 自实现 `clone()` | 深拷贝 | 在构造函数里复制 | 是 | 取决于实现 | 类实例推荐方式 |

## structuredClone 能力边界

**支持**：

- 循环引用（自动处理）
- Date / RegExp / Error（部分浏览器）
- Map / Set / WeakMap（键值都被克隆）/ WeakSet
- TypedArray / ArrayBuffer / DataView
- Boolean / String / Number / BigInt 包装对象
- transferable 转移（ArrayBuffer / MessagePort / ImageBitmap）

**不支持**（抛 DataCloneError 或返回替代值）：

- **函数** → 抛 DataCloneError
- **DOM 节点** → 抛 DataCloneError
- **Symbol**（属性键 OK，但 Symbol 值不行）
- **属性描述符** / **setter / getter**
- **类实例的原型链** → 不抛错，但 `instanceof` 失败、原型方法变 undefined

## 单例实现对比

| 方式 | 实现 | 优点 | 缺点 |
| --- | --- | --- | --- |
| 手写 Singleton 类 | private constructor + getInstance() | 强制私有构造，TS 编译期报错 | 测试 mock 难、隐藏依赖 |
| ES Module 单例 | `export const config = {...}` | 模块仅求值一次、tree-shaking 友好、懒加载 | 不能强制私有构造 |
| 对象字面量 | `const logger = {...} as const` | 最简单 | 不能延迟初始化 |
| Symbol 防重复 | `Symbol.for("logger")` 作 key | 防止重复实例化 | 较少用，多用于底层库 |
| 全局变量（window.x） | `window.config = {...}` | 全局可见 | 污染全局、被覆盖风险高 |

## 前端框架工厂实践

### React.createElement

```ts
// 工厂函数签名——type + props + children
React.createElement(
  type: string | React.ComponentType,
  props?: Record<string, unknown>,
  ...children: React.ReactNode[]
): React.ReactElement
```

返回 React 元素（即 vnode 的 React 实现），调用方从不直接 `new ReactElement`——后续 React reconciler 根据 type 创建真实 DOM 或组件实例。

### Vue 3 h()

```ts
import { h } from "vue";

// h 是 hyperscript（生成 HTML 的脚本）的简称
h(
  type: string | Component,
  props?: Record<string, unknown>,
  children?: string | VNode[]
): VNode
```

返回 Vue 的 vnode 对象，调用方不直接 `new VNode`——后续 Vue patch 算法根据 vnode 创建真实 DOM。

### Pinia / Vuex store 单例

```ts
// Pinia——useXxxStore() 在应用生命周期内返回同一 store 实例
import { useUserStore } from "@/stores/user";

const userStore = useUserStore();
// 任意组件、任意时机调用拿到的都是同一实例——单例模式的状态管理落地
```

### Vue inject / provide

```ts
// 父级 provide 一次，所有子级 inject 拿到同一对象——单例语义
import { provide, inject } from "vue";

const ThemeKey = Symbol("theme");

// 父组件
provide(ThemeKey, { mode: "dark" });

// 任意深度的子组件
const theme = inject(ThemeKey);
```

## 反模式速查

| 反模式 | 后果 | 修复 |
| --- | --- | --- |
| God Object 单例 | 隐藏依赖中心，测试难 mock | 拆成多个独立模块 |
| JSON.parse(JSON.stringify) 深拷贝 | 丢 Date / Map / Set、循环引用抛错 | 用 structuredClone |
| structuredClone 类实例后期望保留方法 | 原型方法 undefined、instanceof 失败 | 自实现 clone() |
| Object.create(42) 等非对象 proto | 抛 TypeError | 传对象或 null |
| Object.create({}, { p: { value: 42 } }) | p 默认全 false，赋值静默失败 | 显式声明描述符 |
| 简单产品上抽象工厂 | 接口爆炸、违反 YAGNI | 用简单工厂函数 |
| JS 写双重检查锁（DCL） | 多余噪音 | 用 Promise 缓存解决异步竞态 |
| 工厂方法返回具体类型 | 改产品要改客户端 | 返回产品接口 |
| Builder 强加 Director | 徒增类数量 | 简单场景直接链式调用 |

## 官方资源

- Refactoring.Guru 创建型模式总览：[https://refactoring.guru/design-patterns/creational-patterns](https://refactoring.guru/design-patterns/creational-patterns)
- 工厂方法：[https://refactoring.guru/design-patterns/factory-method](https://refactoring.guru/design-patterns/factory-method)
- 抽象工厂：[https://refactoring.guru/design-patterns/abstract-factory](https://refactoring.guru/design-patterns/abstract-factory)
- 建造者：[https://refactoring.guru/design-patterns/builder](https://refactoring.guru/design-patterns/builder)
- 原型：[https://refactoring.guru/design-patterns/prototype](https://refactoring.guru/design-patterns/prototype)
- 单例：[https://refactoring.guru/design-patterns/singleton](https://refactoring.guru/design-patterns/singleton)
- MDN Object.create：[https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/create](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/create)
- MDN structuredClone：[https://developer.mozilla.org/en-US/docs/Web/API/structuredClone](https://developer.mozilla.org/en-US/docs/Web/API/structuredClone)
- Addy Osmani《Learning JavaScript Design Patterns》：[https://patterns.addyosmani.com](https://patterns.addyosmani.com)
- Vue 渲染函数 h()：[https://vuejs.org/guide/extras/render-function.html](https://vuejs.org/guide/extras/render-function.html)
- GoF 原书《Design Patterns: Elements of Reusable Object-Oriented Software》（1994）
