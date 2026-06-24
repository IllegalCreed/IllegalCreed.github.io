---
layout: doc
outline: [2, 3]
---

# 静态成员

> 基于现代 JavaScript（ES2025 · 核于 2026-06）

## 速查

- **静态成员挂在类自身**，用 `类名.成员` 访问，**实例上访问不到**（`new C().staticX` 是 `undefined`）
- **静态方法**：`static m() {}`，常用于工厂方法、工具函数（`Array.from`、`Object.keys` 即此类）
- **静态字段**（ES2022）：`static x = 1`，类级别的共享数据 / 计数器 / 常量表
- **静态 `get`/`set`**：`static get prop() {}`，类级别的访问器
- **私有静态**：`static #x`、`static #m()`，类级别且对外不可见
- **静态初始化块**（ES2022，2023 起广泛可用）：`static { ... }`，跑复杂初始化逻辑
- 块内 `this` 指向**类构造函数自身**，可访问私有静态成员，可用 `super.prop` 取父类静态
- **执行时机**：类定义被求值时按声明顺序执行（静态字段与静态块交错按出现顺序跑），仅一次
- 静态成员**可被子类继承**，并可在子类静态方法里用 `super.xxx` 调父类静态

## 静态方法：属于「类」而非「实例」

`static` 修饰的成员挂在类构造函数上，通过类名调用，常用来放「与某个具体实例无关」的逻辑——典型是工厂方法和校验工具：

```js
class Color {
  constructor(r, g, b) {
    this.values = [r, g, b];
  }

  // 工厂方法：换一种创建方式
  static fromHex(hex) {
    const n = parseInt(hex.slice(1), 16);
    return new Color((n >> 16) & 255, (n >> 8) & 255, n & 255);
  }

  // 校验工具：不需要实例
  static isValid(r, g, b) {
    return [r, g, b].every((v) => v >= 0 && v <= 255);
  }
}

const c = Color.fromHex("#ff8800");
console.log(c.values); // [255, 136, 0]
console.log(Color.isValid(255, 0, 0)); // true
console.log(new Color(0, 0, 0).isValid); // undefined —— 实例上没有
```

标准库里大量 API 就是静态方法：`Array.from(...)`、`Object.keys(...)`、`Promise.all(...)`、`Math.max(...)`。

## 静态字段与静态访问器

静态字段（ES2022）是类级别的共享数据，适合做计数器、配置表、单例缓存：

```js
class Widget {
  static count = 0; // 类级计数器
  static defaultTheme = "light"; // 类级配置

  constructor() {
    Widget.count++; // 共享，所有实例累加同一个
  }

  // 静态访问器
  static get total() {
    return Widget.count;
  }
}

new Widget();
new Widget();
console.log(Widget.total); // 2
```

## 私有静态成员

`static #x` / `static #m()` 把类级别的数据或工具藏起来，只在类体内可用：

```js
class IdGenerator {
  static #seed = 1000; // 私有静态字段

  static #next() {
    // 私有静态方法
    return ++IdGenerator.#seed;
  }

  static issue() {
    return `ID-${IdGenerator.#next()}`;
  }
}

console.log(IdGenerator.issue()); // "ID-1001"
console.log(IdGenerator.issue()); // "ID-1002"
// IdGenerator.#seed;  // SyntaxError：类外无法访问私有静态
```

## 静态初始化块

当静态成员的初始化**需要语句、循环、try/catch 或读取私有静态**时，单行的 `static x = ...` 不够用——这时用**静态初始化块**（ES2022，浏览器自 2023 年起广泛可用）：

```js
class Config {
  static #raw = '{"port": 8080, "host": "localhost"}';
  static port;
  static host;

  // 静态初始化块：跑任意初始化逻辑
  static {
    const parsed = JSON.parse(this.#raw); // this 指向 Config，可读私有静态
    this.port = parsed.port;
    this.host = parsed.host;
  }
}

console.log(Config.port, Config.host); // 8080 "localhost"
```

块内有三个要点：

- **`this` 指向类构造函数自身**——可以 `this.x = ...` 设静态属性，也能读 `this.#privateStatic`。
- **可访问私有静态成员**，这是它相对外部代码的独有能力。
- **可用 `super.prop`** 读取父类的静态属性：

```js
class A {
  static base = "A 的静态值";
}
class B extends A {
  static derived;
  static {
    this.derived = super.base + " · 扩展"; // 取父类静态
  }
}
console.log(B.derived); // "A 的静态值 · 扩展"
```

### 执行时机：定义类时跑一次

静态字段、静态块在**类定义被求值的那一刻**执行，且**严格按出现顺序**交错运行，仅一次——后面的块能读到前面已经设好的静态字段：

```js
class Order {
  static a = 1;
  static {
    console.log("块1，此时 a =", this.a); // 块1，此时 a = 1
    this.b = this.a + 1;
  }
  static c = this.b + 1; // 读到块里设的 b
  static {
    console.log("块2，此时 c =", this.c); // 块2，此时 c = 3
  }
}
// 输出顺序：块1 → 块2
```

可以写**多个**静态块，它们与静态字段按声明先后依次执行。

## 静态成员会被子类继承

子类继承父类的静态方法/字段，也能在自己的静态方法里用 `super` 调父类静态实现：

```js
class Repository {
  static tableName = "base";
  static describe() {
    return `表：${this.tableName}`;
  }
}

class UserRepository extends Repository {
  static tableName = "users"; // 覆盖静态字段
  static describe() {
    return super.describe() + "（用户）"; // 调父类静态方法
  }
}

console.log(UserRepository.describe()); // "表：users（用户）"
```

注意 `describe()` 里的 `this.tableName` 取的是**调用时所属类**的静态字段（`UserRepository` 的 `"users"`），这正是「静态方法里 `this` 指向类」带来的多态。

## 接下来

静态讲的是「类级别」的成员。下一页深入「实例级别」最强的封装手段——真正的硬私有：[私有字段 #](./private-fields)，含 `#field`、`#method()`、`#x in obj` 品牌检查与常见误区。
