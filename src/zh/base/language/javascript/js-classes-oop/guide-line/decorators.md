---
layout: doc
outline: [2, 3]
---

# 装饰器现状

> 基于现代 JavaScript（ES2025 · 核于 2026-06）

## 速查

- **不是原生特性**：装饰器是 **TC39 提案**，截至 2026-06 **尚未并入 ECMAScript 正式标准**，各引擎（V8 / SpiderMonkey / JavaScriptCore）**均未原生支持**
- **提案阶段**：处于 **Stage 3 收敛阶段**（仓库标注 Stage 2.7，已被各转写器按 Stage 3 实现），README 推荐新项目直接用「Stage 3 装饰器」转写
- **现在怎么用**：靠 **TypeScript** 或 **Babel** 转写——源码写 `@deco`，构建时降级成普通 JS，**浏览器/Node 不能直接跑装饰器语法**
- **作用目标**：类、方法、`get`/`set`、字段、以及新关键字 **`accessor`**（自动访问器）；都可公有/私有/静态
- **统一签名**：`function deco(value, context) {}`，`context` 含 `kind` / `name` / `static` / `private` / `access` / `addInitializer`
- **与 TS 旧装饰器不兼容**：TS 早年的「实验性装饰器」（`experimentalDecorators` + 常配 `reflect-metadata`）是**另一套规范**，签名 `(target, key, descriptor)` 完全不同
- **结论**：可在 TS/Babel 项目里用，但要清楚它是「构建时语法」，且新旧两套别混用

## 装饰器是什么

装饰器是一种**声明式语法**，用 `@name` 标注在类或其成员上，把「横切逻辑」（日志、校验、依赖注入、响应式绑定等）从业务代码里抽出来，附加到目标上：

```js
// 这是装饰器的「目标用法」——但注意：浏览器/Node 不能直接运行这段语法
@defineElement("my-counter")
class Counter extends HTMLElement {
  @reactive accessor count = 0;

  @logged
  increment() {
    this.count++;
  }
}
```

直觉上它像「给函数/类套一层壳」。但**关键事实**要先立住：这套 `@` 语法**至今不是 JavaScript 的原生能力**。

## 现状：Stage 3，非原生，必须转写

::: warning 装饰器不能直接在浏览器 / Node 里跑
截至 2026-06：

- 装饰器仍是 **TC39 提案**，**没有进入 ECMAScript 正式版**；
- 提案处于 **Stage 3 的收敛阶段**（GitHub 仓库的状态标注为 **Stage 2.7**，但已稳定到各转写器按 Stage 3 语义实现，README 明确「建议新项目使用最新的 Stage 3 装饰器转写」）；
- **V8、SpiderMonkey、JavaScriptCore 等引擎均未原生实现**——直接把含 `@deco` 的代码喂给浏览器或 Node 会**语法报错**。

所以现实用法只有一条路：**用 TypeScript 或 Babel 在构建期把装饰器转写成等价的普通 JavaScript**，运行的是转写后的产物，而非装饰器语法本身。
:::

要在项目里使用，需要相应的构建配置：

- **TypeScript**：现代 TS（5.0+）**默认**按这套标准（Stage 3）装饰器编译，**不再需要** `experimentalDecorators` 开关——那个开关对应的是下面要讲的「旧装饰器」。
- **Babel**：通过 `@babel/plugin-proposal-decorators` 并指定 `version: "2023-05"`（或更新）以使用 Stage 3 语义。

## 标准装饰器的统一签名

这套（Stage 3）装饰器的核心设计：**所有装饰器都是同一种函数签名** `deco(value, context)`：

```js
function deco(value, context) {
  // value：被装饰的东西（方法/访问器为其函数；字段为 undefined）
  // context：描述目标的上下文对象
  //   kind:   "class" | "method" | "getter" | "setter" | "field" | "accessor"
  //   name:   string | symbol
  //   static: boolean   —— 是否静态成员
  //   private:boolean   —— 是否私有成员
  //   access: { get?, set? }    —— 读写被装饰值的句柄
  //   addInitializer(fn)        —— 注册实例/类初始化时运行的回调
}
```

一个来自提案 README 的字段装饰器示例（字段装饰器返回的函数可改写初始值）：

```js
function logged(value, { kind, name }) {
  if (kind === "field") {
    return function (initialValue) {
      console.log(`初始化 ${name}，值为 ${initialValue}`);
      return initialValue;
    };
  }
}

class C {
  @logged x = 1;
}

new C();
// 初始化 x，值为 1
```

### 自动访问器 `accessor`

提案还引入了新关键字 `accessor`：它声明一个由私有字段背书的「自动 getter/setter 对」，装饰器可以同时拿到并改写其 `get` / `set`：

```js
class Example {
  accessor name = "默认"; // 自动生成一对 get/set，背后是一个私有存储
}
```

这是「响应式框架把属性变成可观察」之类用法的语法基础。

## 与 TypeScript「旧装饰器」的区别

很多人最早是在 Angular、NestJS、早期 TS 项目里见到装饰器的——那是 TypeScript 多年前实现的**实验性装饰器（legacy / experimental decorators）**，对应编译开关 `experimentalDecorators`，且常搭配 `reflect-metadata` 做元数据反射。**它和上面的标准装饰器是两套不兼容的规范**：

| 维度 | 旧装饰器（TS 实验性） | 标准装饰器（Stage 3） |
| --- | --- | --- |
| 开关 | `experimentalDecorators: true` | 现代 TS 默认；**不开**该开关 |
| 函数签名 | `(target, propertyKey, descriptor)` | `(value, context)` |
| 拿到的东西 | 目标类/原型 + 属性键 + **属性描述符** | 被装饰值 + `context` 上下文（**拿不到构造中的类**） |
| 改属性特性 | 可改 `enumerable` / `configurable` 等 | **不能**改描述符特性 |
| getter/setter | 合并成一个描述符一起装饰 | **getter、setter 各自独立**装饰 |
| 注入新成员 | 可向类**注入任意新元素** | 只能包裹/替换目标自身，不能凭空加成员 |
| 字段语义 | 用 setter 赋值（与现代字段语义冲突） | 用 `[[Define]]` 定义，契合现代字段语义 |
| 元数据 | 常依赖 `reflect-metadata` | 不绑定该库（另有独立的元数据演进） |

::: tip 实务建议
- **新项目**：用标准（Stage 3）装饰器——现代 TS 默认即是，或在 Babel 里配 `2023-05` 版本。
- **老项目（Angular / 旧 NestJS 等）**：可能仍依赖旧装饰器，迁移需谨慎，**两套语义不能混用**。
- 无论哪套，都要记住：装饰器是**构建期语法**，最终交付的是转写后的普通 JS。
:::

## 接下来

装饰器是类系统「面向未来」的一块拼图，现阶段靠工具链落地。把全叶要点、各特性的 ES 版本与 Baseline 状态、以及标准与调试链接汇总查阅：[参考](../reference)。
