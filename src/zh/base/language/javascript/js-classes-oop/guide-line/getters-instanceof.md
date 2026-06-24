---
layout: doc
outline: [2, 3]
---

# 访问器与 instanceof

> 基于现代 JavaScript（ES2025 · 核于 2026-06）

## 速查

- **`get prop()`**：把方法伪装成「可读属性」，`obj.prop` 触发；**`set prop(v)`** 让 `obj.prop = v` 触发
- **只读属性**：只写 `get` 不写 `set`，赋值在严格模式下抛 `TypeError`（类体永远严格模式）
- **典型用途**：包装私有字段、计算属性、赋值时校验
- **`instanceof`**：`obj instanceof C` 沿原型链判断 `C.prototype` 是否在链上
- **`Symbol.hasInstance`**：在类上定义 `static [Symbol.hasInstance](x)` 可**自定义** `instanceof` 行为
- **`new.target`**：构造函数里得到「实际被 `new` 的那个类」；非 `new` 调用时为 `undefined`
- **抽象类**：`if (new.target === Base) throw ...` 阻止基类被直接实例化
- **判定可靠性**：`instanceof` 可被篡改；要「确实由本类构造」用品牌检查 `#x in obj`（见 [私有字段 #](./private-fields)）

## `get` / `set`：像属性一样的方法

访问器让「读写一个属性」背后跑你的逻辑，而调用方写起来就像普通属性。最常见的用途是给私有字段配一个受控的对外接口：

```js
class Temperature {
  #celsius = 0;

  // 读：obj.celsius 触发
  get celsius() {
    return this.#celsius;
  }
  // 写：obj.celsius = x 触发，可在此校验
  set celsius(value) {
    if (typeof value !== "number") throw new TypeError("必须是数字");
    this.#celsius = value;
  }

  // 计算属性：基于 #celsius 实时换算，只读
  get fahrenheit() {
    return this.#celsius * 1.8 + 32;
  }
}

const t = new Temperature();
t.celsius = 25; // 走 setter（含校验）
console.log(t.celsius); // 25（走 getter）
console.log(t.fahrenheit); // 77（计算属性）
```

### 只读属性

只定义 `get`、不定义 `set`，这个属性就是只读的。由于**类体永远是严格模式**，对只读属性赋值会**抛 `TypeError`**（而非像非严格模式那样静默失败）：

```js
class Circle {
  #r;
  constructor(r) {
    this.#r = r;
  }
  get area() {
    return Math.PI * this.#r ** 2;
  } // 只读
}

const c = new Circle(2);
console.log(c.area.toFixed(2)); // "12.57"
// c.area = 100;  // TypeError：Cannot set property area of #<Circle> which has only a getter
```

## `instanceof`：原型链上的判定

`obj instanceof C` 检查 `C.prototype` 是否出现在 `obj` 的原型链上。因此实例对它的类、以及所有祖先类，`instanceof` 都为 `true`：

```js
class Animal {}
class Dog extends Animal {}

const d = new Dog();
console.log(d instanceof Dog); // true
console.log(d instanceof Animal); // true
console.log(d instanceof Object); // true
```

## `Symbol.hasInstance`：定制 instanceof

`instanceof` 的行为可以被覆盖——在类上定义静态的 `[Symbol.hasInstance](x)` 方法，`instanceof` 就改用它来判定，从而实现「鸭子类型」式的检查（不看原型链，看特征）：

```js
class ArrayLike {
  // 自定义：任何「有 length 的对象」都算 ArrayLike
  static [Symbol.hasInstance](value) {
    return value != null && typeof value.length === "number";
  }
}

console.log([] instanceof ArrayLike); // true
console.log("abc" instanceof ArrayLike); // true
console.log({ length: 3 } instanceof ArrayLike); // true
console.log(42 instanceof ArrayLike); // false
```

::: warning instanceof 不是「绝对可靠」的身份证明
正因为 `instanceof` 既依赖原型链、又能被 `Symbol.hasInstance` 改写，它**可被伪造**。如果你要的是「这个对象确实是由本类构造出来的」这种强保证，应该用**品牌检查** `#privateField in obj`——拥有某私有字段无法伪造（见 [私有字段 #](./private-fields)）。
:::

## `new.target`：是谁在 new

`new.target` 是构造函数里的元属性：用 `new` 调用时，它指向**实际被 `new` 的那个构造函数**；普通函数调用（没有 `new`）时为 `undefined`。在继承场景下，它指向最初被 `new` 的子类：

```js
class Base {
  constructor() {
    console.log(new.target.name);
  }
}
class Sub extends Base {}

new Base(); // "Base"
new Sub(); // "Sub" —— 指向实际被 new 的子类
```

### 用 `new.target` 做「抽象类」

JavaScript 没有 `abstract` 关键字，但可以用 `new.target` 拦住「直接实例化基类」，强制只能通过子类使用：

```js
class Shape {
  constructor() {
    if (new.target === Shape) {
      throw new TypeError("Shape 是抽象类，不能直接实例化");
    }
  }
  area() {
    throw new Error("子类必须实现 area()");
  }
}

class Square extends Shape {
  constructor(side) {
    super();
    this.side = side;
  }
  area() {
    return this.side ** 2;
  }
}

// new Shape();  // TypeError：Shape 是抽象类
console.log(new Square(3).area()); // 9
```

## 接下来

到这里，原生 `class` 的全部能力——构造、成员、继承、静态、私有、访问器、类型判定——都讲完了。最后一页面对一个**尚未原生落地**的话题：用声明式语法增强类与成员的「装饰器」，看清它的提案现状与现实用法：[装饰器现状](./decorators)。
