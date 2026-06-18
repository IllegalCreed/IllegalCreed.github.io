---
layout: doc
outline: [2, 3]
---

# 类与模块

> 基于 JSDoc 4.0.x 编写

## 速查

- JSDoc **自动识别** ES2015 `class`、构造函数、静态方法、继承——**无需**到处写 `@class` / `@constructor`
- 继承显式用 `@extends`（别名 `@augments`）；接口契约用 `@implements` + `@interface`
- 访问修饰符 `@private` / `@protected` / `@public` / `@package` 仅文档语义，运行时不强制
- `@module color/mixer` 把文件标记为模块，其符号命名路径带 `module:` 前缀
- 支持 CommonJS / ES2015 / AMD 三种模块形态；导出形态复杂时用 `@exports` 显式标注
- **namepaths** 符号：`#` 实例成员、`.` 静态成员、`~` 内部成员（inner）
- 可链式嵌套 `Person#Idea#consider`；跨模块用 `module:`、内置对象用 `external:`、事件用 `event:`
- 名称含特殊字符时引号包裹并转义内部引号，如 `chat."#channel"`

## 类与继承（ES2015 class）

现代 JSDoc 对 ES2015 `class` 语法**开箱即用**：class 本身、constructor、实例方法、静态方法、继承关系都能自动识别，开发者主要补 `@param` / `@returns` / `@type` 描述类型，**不必**再手写 `@class` / `@constructor`。

```js
/** 表示一个点。 */
class Point {
  /**
   * @param {number} x
   * @param {number} y
   */
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  /** @returns {number} */
  getX() {
    return this.x;
  }

  /**
   * 静态方法自动识别。
   * @param {string} str
   * @returns {Point}
   */
  static fromString(str) {
    /* ... */
  }
}
```

### 继承、接口与重写

| 标签                            | 用途                                              |
| ------------------------------- | ------------------------------------------------- |
| `@extends` / `@augments`        | 显式声明继承的父类（两者别名）                     |
| `@implements`                   | 声明实现某接口                                     |
| `@interface`                    | 把符号标记为接口（契约）                            |
| `@override`                     | 标记方法重写了父类成员                              |
| `@abstract` / `@virtual`        | 抽象成员（别名）                                    |
| `@mixin` / `@mixes`             | 混入声明 / 引用                                    |

```js
/**
 * @extends Point
 */
class Dot extends Point {
  /**
   * @override
   * @returns {number}
   */
  getX() {
    return this.x + 1;
  }
}
```

::: tip 继承关系要显式标注
虽然 JS 引擎里 `class Dot extends Point` 已表达继承，但 JSDoc 生成文档时需要 `@extends Point`（或 `@augments`）才能把父类成员正确归并到子类页面。接口实现同理用 `@implements`。
:::

## 模块文档

`@module` 把整个文件标记为一个模块，模块内符号的命名路径自动带上 `module:` 前缀。JSDoc 支持三种模块形态：**CommonJS、ES2015、AMD**。

```js
/** @module color/mixer */

/**
 * 混合两种颜色。
 * @param {string} c1
 * @param {string} c2
 * @returns {string}
 */
export function blend(c1, c2) {
  /* ... */
}
```

上例中 `blend` 的命名路径是 `module:color/mixer.blend`。

### @exports：显式标注导出

当导出形态复杂（如 CommonJS 里把一个对象整体赋给 `module.exports`，或 AMD 的 `define`）、JSDoc 无法自动判断导出对象时，用 `@exports` 显式标注：

```js
/**
 * @module greeting
 * @exports Greeter
 */

/** @constructor */
function Greeter() {}

module.exports = Greeter;
```

| 模块系统      | 典型导出写法                          | 说明                              |
| ------------- | ------------------------------------- | --------------------------------- |
| **ES2015**    | `export function` / `export default`  | 多数情况自动识别                  |
| **CommonJS**  | `module.exports = ...` / `exports.x`  | 整体赋值时常需 `@exports`         |
| **AMD**       | `define([...], factory)`              | 需配合 `@module` / `@exports`     |

## namepaths（命名路径）

命名路径是 JSDoc 引用符号的「地址」，`@see`、`{@link}`、`@memberof` 等都靠它定位。核心是三个分隔符：

| 符号        | 含义                                  | 例                              |
| ----------- | ------------------------------------- | ------------------------------- |
| `#`         | **实例**成员                          | `Book#title`                    |
| `.`         | **静态**成员                          | `Point.fromString`              |
| `~`         | **内部**成员（inner，外部不可直接访问）| `Person~say`                    |
| 链式        | 嵌套构造                              | `Person#Idea#consider`          |
| `module:`   | 模块                                  | `module:foo/bar`                |
| `external:` | 内置 / 外部对象                       | `external:String`               |
| `event:`    | 事件（模块内）                        | `module:foo/bar.event:MyEvent`  |

```js
/**
 * 详见实例方法 {@link Book#getTitle}、
 * 静态方法 {@link Book.create}、
 * 模块成员 {@link module:color/mixer.blend}。
 */
```

::: warning 名称含特殊字符要引号 + 转义
若成员名本身含 `#`、`.`、空格等特殊字符，需用引号包裹，并转义内部引号。例如频道名 `#channel` 作为 `chat` 的成员，写作：

```js
/** @memberof chat."#channel" */
```

:::

::: tip `#` 实例 vs `.` 静态最易错
`Book#title` 指**实例**上的 `title`（每个实例各有一份），`Book.title` 指**类静态**的 `title`（挂在构造函数上）。两者命名路径不同，链接和归属都会受影响，写 `{@link}` 时务必区分。
:::

下一步：[核心标签详解](./tags.md) · [类型表达式全集](./types.md) · [配合 TypeScript](./typescript.md) · [速查参考](../reference.md)
