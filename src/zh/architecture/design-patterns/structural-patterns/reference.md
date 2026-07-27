---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Refactoring.Guru、MDN Web Docs（JavaScript Proxy）、GoF 原书编写，含七模式对比表、前端框架映射、版本状态与官方资源

## 速查

- 结构型模式共 **7 个**：适配器 / 桥接 / 组合 / 装饰器 / 外观 / 享元 / 代理
- 五者意图：**Adapter** 改现有接口 / **Bridge** 设计期拆两套继承树 / **Facade** 定义新简化接口 / **Proxy** 同接口控制访问 / **Decorator** 增强不改接口
- Decorator 链执行：最外层前置逻辑 → 逐层向内 → 最内层执行 → 逐层向外后置逻辑
- Composite：透明式（add/remove 放 Component，违反 ISP）vs 安全式（只放 Composite，需 instanceof）
- Flyweight：内在状态（共享 / 不可变 / Object.freeze / 存于 Flyweight）vs 外在状态（实例独有 / Context 持有）
- Proxy 六变体：Virtual 延迟 / Protection 权限 / Remote 远程 / Logging 日志 / Caching 缓存 / Smart Reference 引用计数
- JS Proxy：13 trap（get / set / has / deleteProperty / ownKeys / defineProperty / getOwnPropertyDescriptor / getPrototypeOf / setPrototypeOf / isExtensible / preventExtensions / apply / construct）
- JS Proxy 三原则：① 配合 Reflect 转发 ② `set` 返回 true ③ 私有字段 / 内部插槽用 target
- Vue 3 reactive：基于 ES6 Proxy，替代 `Object.defineProperty`
- React HOC 六大注意：组合不修改原型 / 透传 props / 不在 render 调用 / forwardRef / hoist-non-react-statics / displayName
- TC39 装饰器：截至 2024 仍 Stage 3，函数 / 对象字面量装饰器 Stage 1

## 七模式意图对比表

| 模式 | 意图 | 接口变化 | 生命周期 | 典型前端场景 |
| --- | --- | --- | --- | --- |
| **Adapter** | 转换不兼容接口 | Target 接口 | 包装单对象 | 回调转 Promise、新旧 API 迁移 |
| **Bridge** | 拆抽象与实现两套继承树 | 两套接口 | 设计期决策 | 跨平台 UI、主题系统 |
| **Composite** | 树形结构统一处理 | Component 统一 | 递归组合 | UI 组件树、AST、虚拟 DOM |
| **Decorator** | 动态叠加职责 | 同接口 | 客户端组装 | React HOC、middleware |
| **Facade** | 定义简化统一接口 | 新接口 | 子系统封装 | `window.$API`、SDK 入口 |
| **Flyweight** | 共享细粒度对象省内存 | Flyweight 接口 | 工厂池化 | 虚拟列表、DOM 节点池 |
| **Proxy** | 控制访问 | 与 Subject 一致 | 自主管理 RealSubject | Vue reactive、懒加载、缓存 |

## Adapter vs Bridge vs Facade vs Proxy vs Decorator 辨析

| 维度 | Adapter | Bridge | Facade | Proxy | Decorator |
| --- | --- | --- | --- | --- | --- |
| 时机 | 事后补救 | 设计期决策 | 重封装子系统 | 访问控制 | 行为增强 |
| 对象 | 单个 | 抽象 + 实现两套 | 整个子系统 | 单个（RealSubject） | 单个（Component） |
| 接口 | 与 Target 一致 | 拆开两套接口 | 新的简化接口 | 与 Subject 一致 | 同接口或扩展 |
| 生命管理 | 不管理 | 不管理 | 不管理 | **自主管理** RealSubject | 客户端组装 |
| 可递归 | ❌ | ❌ | ❌ | 视变体而定 | ✅ 链式叠加 |

> 选型决策树：① 事后补救接口不兼容 → Adapter；② 设计期预知多维度变化 → Bridge；③ 重封装复杂子系统简化入口 → Facade；④ 懒加载 / 权限 / 缓存控制访问 → Proxy；⑤ 动态叠加日志 / 性能 / 缓存 → Decorator；⑥ 树形结构统一处理 → Composite；⑦ 万级相似对象省内存 → Flyweight。

## Decorator 链执行顺序

```
客户端 → Compression(外) → Encryption(中) → FileSource(内)
write 调用链：
  ① Compression.write("[zip]" + value)
  ② Encryption.write("[enc]" + "[zip]" + value)
  ③ FileSource.write("[enc][zip]" + value)
read 调用链（反向）：
  ③ FileSource.read() → "[enc][zip]x"
  ② Encryption.read() → "[zip]x"
  ① Compression.read() → "x"
```

## Composite 透明式 vs 安全式

| 维度 | 透明式 | 安全式 |
| --- | --- | --- |
| `add` / `remove` 位置 | Component 接口 | 仅 Composite |
| Leaf 实现 | 留空或抛异常 | 不实现 |
| 客户端 | 无需 instanceof | 必须判断类型 |
| 设计原则 | 违反接口隔离（ISP） | 违反统一处理初衷 |

## Flyweight 状态归属

| 状态类型 | 是否共享 | 是否可变 | 存储位置 | 例子 |
| --- | --- | --- | --- | --- |
| **内在状态**（intrinsic） | ✅ | ❌（Object.freeze） | Flyweight 对象 | 棋子颜色、按钮样式、DOM 结构 |
| **外在状态**（extrinsic） | ❌ | ✅ | Context | 坐标、文本、速度、数据项 |

## Proxy 六变体速查

| 变体 | 意图 | 前端场景 |
| --- | --- | --- |
| **Virtual Proxy** | 延迟初始化 | 图片懒加载、按需加载大对象 |
| **Protection Proxy** | 权限校验 | 接口鉴权、字段级权限 |
| **Remote Proxy** | 远程对象本地代表 | RPC、本地调用网络服务 |
| **Logging Proxy** | 调用日志 | 性能监控、审计 |
| **Caching Proxy** | 缓存结果 | 请求缓存、计算 memo |
| **Smart Reference** | 引用计数 | 对象池、自动释放 |

## JavaScript Proxy 速查

**基础语法**

```ts
const proxy = new Proxy(target, handler); // target 必须是对象
const { proxy, revoke } = Proxy.revocable(target, handler); // 可撤销
revoke(); // 之后访问 proxy 抛 TypeError
```

**13 个 trap**

| trap | 被拦截 |
| --- | --- |
| `get` | `obj.key` |
| `set` | `obj.key = v`（**返回 true**） |
| `has` | `in` / `with` |
| `deleteProperty` | `delete` |
| `ownKeys` | `Object.keys` 等 |
| `defineProperty` | `Object.defineProperty` |
| `getOwnPropertyDescriptor` | 属性描述符读取 |
| `getPrototypeOf` | 原型读取 |
| `setPrototypeOf` | 原型设置 |
| `isExtensible` | `Object.isExtensible` |
| `preventExtensions` | `Object.preventExtensions` |
| `apply` | 函数调用 `proxy()` |
| `construct` | `new proxy()` |

**三原则**

```ts
new Proxy(target, {
  get(obj, key, receiver) {
    return Reflect.get(obj, key, receiver); // ① 配合 Reflect 转发
  },
  set(obj, key, value, receiver) {
    const ok = Reflect.set(obj, key, value, receiver);
    return ok; // ② set 必须 return true
  },
});
// ③ 私有字段 #field / Map / Date 内部插槽必须用 target 而非 receiver
```

**限制**

- 不能代理私有字段 `#field`（需用 target 转发）
- 不能转发 `Map` / `Set` / `Date` / `WeakMap` 内部插槽
- target 必须是对象（原始值不行）
- 无法 polyfill / transpile 到 ES5（拦截的是引擎内部方法）

## Vue 3 reactive vs Vue 2 defineProperty

| 维度 | `Object.defineProperty`（Vue 2） | `Proxy`（Vue 3） |
| --- | --- | --- |
| 属性增删 | ❌ 需 `$set` / `$delete` | ✅ 自动感知 |
| `in` 操作符 | ❌ | ✅ `has` trap |
| `Object.keys` | ❌ | ✅ `ownKeys` trap |
| 数组索引 / 长度 | ❌ 需重写 7 个数组方法 | ✅ 原生拦截 |
| 深度响应 | 初始化全量递归 | 惰性——访问时才递归 |
| 兼容性 | ES5（可 polyfill 到 IE8） | ES2015（无法 polyfill） |

## React HOC 速查

**签名**：`HOC(WrappedComponent) => EnhancedComponent`

**经典柯里化**：`connect(selector)(Component)`（react-redux）、`withRouter(Component)`（react-router）

**六大注意事项**

1. 用组合不修改原型（mixins 是反模式）
2. 透传无关 props（`<Wrapped {...passThroughProps} />`）
3. 绝不在 render 内部调用 HOC（触发子树卸载重挂载）
4. ref 不自动透传，需 `React.forwardRef`
5. 静态方法需 `hoist-non-react-statics` 拷贝
6. 设 `displayName = WithX(getDisplayName(Wrapped))`

**HOC 与 Decorator 关系**：HOC 是 Decorator 模式的函数式实现——单参一等函数 `Component => Component`，可作为 ES 装饰器语法使用（`@withRouter`）。

## 前端框架映射

| 模式 | 框架落地 |
| --- | --- |
| **Decorator** | React HOC（`connect` / `withRouter`）、TS `@decorator`、Koa / Express middleware |
| **Proxy** | Vue 3 reactive（基于 ES6 Proxy）、MobX observable、JS Proxy API |
| **Composite** | React 组件树、Vue 组件树、AST（Babel / ESLint）、虚拟 DOM |
| **Facade** | `window.$API` 封装层、SDK 简化入口、SDK 命名空间 |
| **Adapter** | `util.promisify`、jQuery → axios 适配层、v1 → v2 接口迁移 |
| **Flyweight** | react-window、vue-virtual-scroller、对象池、纹理缓存 |
| **Bridge** | React Native Renderer 抽象（iOS / Android 实现）、主题系统 |

## Proxy 设计模式 vs JavaScript Proxy 对象

| 层次 | Proxy 设计模式 | JavaScript Proxy 对象 |
| --- | --- | --- |
| 性质 | OOP 设计模式（意图） | 语言特性（实现手段） |
| 来源 | GoF 1994 | ES2015 |
| 关系 | 概念层 | Vue 3 reactive 等的设计模式落地手段 |

> 不要把两者混为一谈。Proxy 设计模式是「控制访问的意图」，JS Proxy 是「语言层面拦截 13 种操作的能力」。Vue 3 reactive = Proxy 设计模式（控制访问 + 依赖收集） + JS Proxy（语言能力） 的组合落地。

## TC39 装饰器版本状态

| 项 | 状态 |
| --- | --- |
| 类 / 方法 / 字段 / accessor 装饰器 | Stage 3（截至 2024） |
| 函数 / 对象字面量装饰器 | Stage 1 |
| TypeScript 5.0+ | 默认 Stage 3 语义（`experimentalDecorators: false`） |
| 旧 TS experimentalDecorators | Stage 1 旧语义 |

> Stage 3 未达 Stage 4（需至少 2 个浏览器独立实现），生产依赖需谨慎。

## 官方资源

- Refactoring.Guru 结构型模式总入口：[refactoring.guru/design-patterns/structural-patterns](https://refactoring.guru/design-patterns/structural-patterns)
- Adapter / Bridge / Composite / Decorator / Facade / Flyweight / Proxy 各模式页（含 TypeScript 示例）：从总入口导航
- MDN JavaScript Proxy：[developer.mozilla.org/.../Global_Objects/Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy)
- MDN Reflect：[developer.mozilla.org/.../Global_Objects/Reflect](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Reflect)
- TC39 Decorators 提案：[github.com/tc39/proposal-decorators](https://github.com/tc39/proposal-decorators)
- TC39 提案 HTML 版：[tc39.es/proposal-decorators](https://tc39.es/proposal-decorators/)
- React HOC 官方文档（legacy）：[legacy.reactjs.org/docs/higher-order-components](https://legacy.reactjs.org/docs/higher-order-components.html)
- Vue 3 reactive 源码：[github.com/vuejs/core](https://github.com/vuejs/core) `packages/reactivity`
- GoF 原书 Wikipedia：[Design_Patterns](https://en.wikipedia.org/wiki/Design_Patterns)
- Refactoring.Guru GitHub：[RefactoringGuru/design-patterns-typescript](https://github.com/RefactoringGuru/design-patterns-typescript)

## 下一步

- [入门](./getting-started.md)：定位 / 七模式速览 / 前端应用场景
- [七大模式详解](./guide-line.md)：逐个讲 JS / TS 实现 + 应用场景 + 反模式
