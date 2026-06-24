---
layout: doc
outline: [2, 3]
---

# 参考

> 基于现代 JavaScript（ES2025 · 核于 2026-06）

## 速查

- **类是函数**：`typeof C === "function"`，方法挂 `C.prototype`；类体永远严格模式；声明不提升（TDZ）；必须 `new`
- **成员归属**：方法在原型（共享）、字段在实例（各一份）、`static` 在类自身、`#` 私有按类隔离
- **继承**：`extends` 单继承；子类构造函数先 `super()` 再用 `this`；`super.m()` 调父类；私有字段不继承
- **私有**：`#field`/`#m()` 硬私有，类外访问是语法错误；`#x in obj` 做品牌检查
- **判定**：`instanceof` 看原型链、可被 `Symbol.hasInstance` 改写；强证明用品牌检查；`new.target` 认「谁在 new」
- **版本**：`class`/`extends`/`static`/`get·set` = ES2015；字段 / 私有 / 静态块 = ES2022（2023 起广泛可用）
- **装饰器**：**非原生**，TC39 Stage 3 收敛中，靠 TS/Babel 转写；与 TS 旧装饰器不兼容

## 类体成员一览

| 成员 | 可见性 | 归属 | 语法 | ES 版本 |
| --- | --- | --- | --- | --- |
| 构造函数 | 公有 | 实例 | `constructor() {}` | ES2015 |
| 实例方法 | 公有 | 原型 | `m() {}` | ES2015 |
| getter / setter | 公有 | 原型 | `get p() {}` / `set p(v) {}` | ES2015 |
| 实例字段 | 公有 | 实例 | `x = 值;` | ES2022 |
| 静态方法 | 公有 | 类 | `static m() {}` | ES2015 |
| 静态 getter / setter | 公有 | 类 | `static get p() {}` | ES2015 |
| 静态字段 | 公有 | 类 | `static x = 值;` | ES2022 |
| 私有字段 | 私有 | 实例 | `#x = 值;` | ES2022 |
| 私有方法 | 私有 | 实例 | `#m() {}` | ES2022 |
| 私有 getter / setter | 私有 | 实例 | `get #p() {}` / `set #p(v) {}` | ES2022 |
| 私有静态字段 | 私有 | 类 | `static #x = 值;` | ES2022 |
| 私有静态方法 | 私有 | 类 | `static #m() {}` | ES2022 |
| 静态初始化块 | —— | 类 | `static { ... }` | ES2022 |

> 方法名位还支持生成器 `*m() {}`、异步 `async m() {}`、计算名 `[expr]() {}`（均 ES2015+）。

## 关键字 / 元属性速查

| 写法 | 含义 |
| --- | --- |
| `new` | 调用构造函数创建实例；类必须用 `new` 调用 |
| `extends` | 声明继承；后接任意构造函数或 `null`（单继承） |
| `super(...)` | 子类构造函数中调用父类构造函数（须先于 `this`） |
| `super.m()` / `super.x` | 调用 / 读取父类的方法或（静态）属性 |
| `static` | 把成员挂到类自身，而非实例 |
| `#name` | 私有成员（字段 / 方法 / 访问器 / 静态） |
| `#name in obj` | 品牌检查：安全判断 obj 是否拥有该私有成员 |
| `instanceof` | 原型链判定；可被 `Symbol.hasInstance` 定制 |
| `new.target` | 构造函数内得到实际被 `new` 的类；非 new 调用为 `undefined` |
| `accessor` | （装饰器提案）自动访问器，非原生、需转写 |

## 常见坑速查

| 现象 | 原因 | 对策 |
| --- | --- | --- |
| 方法当回调 `this` 为 `undefined` | 类方法不自动绑定 + 严格模式 | `.bind(this)` 或箭头函数字段 |
| `new Foo()` 报「before initialization」 | 类声明不提升、有 TDZ | 类定义放在使用之前 |
| 子类构造函数报「must call super」 | `super()` 之前访问了 `this` | 先 `super(...)` 再用 `this` |
| 以为 `_x` 是私有，外部仍能改 | `_x` 只是命名约定 | 真私有用 `#x` |
| `obj.#x` 在类外报语法错误 | 私有字段类外不可访问 | 暴露公有 `get` 访问器 |
| 静态成员在实例上读到 `undefined` | 静态挂在类自身 | 用 `类名.成员` 访问 |
| 每个实例的方法 `===` 比较为 `false` | 把函数写成了实例字段 | 共享行为写成原型方法 |

## 各特性 Baseline 状态（2026-06 核）

| 特性 | 标准 | 状态 |
| --- | --- | --- |
| `class` 声明 / 表达式、`extends`、`super` | ES2015 | ✅ 广泛可用 |
| 实例方法、`get` / `set`、`static` 方法/字段 | ES2015 | ✅ 广泛可用 |
| 公有 / 私有实例字段（`x` / `#x`） | ES2022 | ✅ Baseline，2023-03 起广泛可用 |
| 私有方法 / 私有访问器、私有静态 | ES2022 | ✅ Baseline，2023 起广泛可用 |
| `#x in obj` 品牌检查 | ES2022 | ✅ Baseline，2023 起广泛可用 |
| 静态初始化块 `static {}` | ES2022 | ✅ Baseline，2023-03 起广泛可用 |
| `Symbol.hasInstance`、`new.target` | ES2015 | ✅ 广泛可用 |
| **装饰器 `@deco` / `accessor`** | TC39 提案 | 🟠 **非原生**，Stage 3 收敛中，须 TS / Babel 转写 |

## 权威链接

**标准 / 规范**

- [MDN: Classes（参考）](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes) · [Using classes（指南）](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_classes)
- [MDN: Private elements](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Private_elements) · [Static initialization blocks](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Static_initialization_blocks)
- [MDN: `extends`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/extends) · [`super`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/super) · [`new.target`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/new.target)
- [TC39: proposal-decorators](https://github.com/tc39/proposal-decorators)

**教程 / 指南**

- [javascript.info: Class basic syntax](https://javascript.info/class) · [Class inheritance](https://javascript.info/class-inheritance) · [Private and protected](https://javascript.info/private-protected-properties-methods)

**兼容性 / 调试**

- [Baseline 浏览器兼容查询：webstatus.dev](https://webstatus.dev/) · [caniuse.com](https://caniuse.com/)
- [TC39 提案进度总表](https://github.com/tc39/proposals)

## 相关页

- [入门](./getting-started) · [类语法：构造与成员](./guide-line/class-syntax) · [继承与 super](./guide-line/inheritance-super)
- [静态成员](./guide-line/static-members) · [私有字段 #](./guide-line/private-fields)
- [访问器与 instanceof](./guide-line/getters-instanceof) · [装饰器现状](./guide-line/decorators)
