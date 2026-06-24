---
layout: doc
outline: [2, 3]
---

# 继承与 super

> 基于现代 JavaScript（ES2025 · 核于 2026-06）

## 速查

- **`extends`**：`class B extends A {}` 让 `B.prototype` 继承自 `A.prototype`，实例同时是两者的实例
- **单继承**：只能 `extends` 一个目标；目标可是任意构造函数或 `null`
- **`super()`**：子类构造函数里调父类构造函数，**必须在用 `this` 之前调**，否则 `ReferenceError`
- **没写 `constructor`**：子类自动获得隐式构造函数 `constructor(...args) { super(...args); }`
- **`super.method()`**：在子类方法 / 静态方法里调用父类同名实现，常用于「先调父类再加料」
- **字段初始化时机**：子类实例字段在 `super()` 返回之后才初始化
- **私有字段不继承**：子类访问不到父类的 `#field`
- **静态成员可继承也可被覆盖**：`B` 继承 `A` 的静态方法，且能用 `super.xxx` 在静态方法里调父类静态
- **继承内置类**（`Array`/`Error`/`Map`…）：可行，子类实例保有内置行为

## `extends`：建立继承关系

`extends` 让子类原型链接到父类，子类自动获得父类的实例方法与静态方法：

```js
class Animal {
  constructor(name) {
    this.name = name;
  }
  speak() {
    console.log(`${this.name} 发出声音`);
  }
}

class Dog extends Animal {
  speak() {
    console.log(`${this.name} 汪汪叫`);
  }
}

const d = new Dog("旺财");
d.speak(); // "旺财 汪汪叫"
console.log(d instanceof Dog); // true
console.log(d instanceof Animal); // true —— 也是父类的实例
```

`extends` 后面可以跟任意「能用 `new` 的构造函数」，甚至是 `null`（极少用，得到一个原型链不挂 `Object.prototype` 的特殊类）。

## `super()`：构造链与「先父后子」

子类一旦有自己的 `constructor`，就**必须**调用 `super()` 来跑父类构造函数——而且要在访问 `this` **之前**调用，因为 `this` 是由父类构造链初始化出来的：

```js
class Animal {
  constructor(name) {
    this.name = name;
  }
}

class Dog extends Animal {
  constructor(name, breed) {
    super(name); // ① 必须先调，初始化 this
    this.breed = breed; // ② 之后才能用 this
  }
}

new Dog("旺财", "柴犬"); // ✅
```

如果在 `super()` 之前碰 `this`，会抛错：

```js
class Bad extends Animal {
  constructor(name) {
    this.x = 1; // ReferenceError: Must call super constructor before accessing 'this'
    super(name);
  }
}
```

::: tip 不写 constructor = 自动转发
如果子类不需要额外初始化，干脆别写 `constructor`——引擎会补一个隐式构造函数，把参数原样转发给父类：

```js
class Cat extends Animal {} // 等价于 constructor(...args){ super(...args); }
new Cat("咪咪").name; // "咪咪"
```
:::

### 字段初始化发生在 `super()` 之后

子类的实例字段在 `super()` 返回之后才初始化。这意味着父类构造函数运行期间，子类字段尚未赋值——若父类构造函数调用了被子类覆盖、且依赖子类字段的方法，会读到尚未初始化的值，是一个隐蔽坑，设计基类时需留意。

## `super.method()`：改写父类行为

在子类方法里用 `super.方法名()` 调用父类的同名实现，典型用法是「在父类基础上追加」：

```js
class Animal {
  speak() {
    console.log(`${this.name} 发出声音`);
  }
}

class Dog extends Animal {
  speak() {
    super.speak(); // 先跑父类的
    console.log(`${this.name} 汪汪叫`); // 再加自己的
  }
}

const d = Object.assign(new Dog(), { name: "旺财" });
d.speak();
// "旺财 发出声音"
// "旺财 汪汪叫"
```

`super` 也能在**静态方法**里调用父类静态方法：

```js
class Base {
  static create() {
    return "base";
  }
}
class Derived extends Base {
  static create() {
    return super.create() + "+derived";
  }
}
console.log(Derived.create()); // "base+derived"
```

## 继承内置类

可以 `extends` 内置类（`Array`、`Error`、`Map`、`Set`、`EventTarget` 等），子类实例会保留这些内置类型的特有行为：

```js
class Stack extends Array {
  peek() {
    return this[this.length - 1];
  }
}

const s = new Stack();
s.push(1, 2, 3); // 复用 Array.prototype.push
console.log(s.peek()); // 3
console.log(s.length); // 3
console.log(s instanceof Array); // true
```

继承 `Error` 是工程里很常见的「自定义错误」写法：

```js
class ValidationError extends Error {
  constructor(message, field) {
    super(message); // 让 message 正常工作
    this.name = "ValidationError"; // 覆盖默认 name
    this.field = field;
  }
}

try {
  throw new ValidationError("邮箱格式不对", "email");
} catch (e) {
  console.log(e instanceof Error); // true
  console.log(e.name, e.field); // "ValidationError" "email"
}
```

::: warning 私有字段不沿继承链共享
子类**访问不到**父类的私有字段——`#` 私有性是「按类」隔离的，不会因为继承而对子类开放。需要让子类读写的状态，要用受保护约定（如普通字段或带访问器的公有接口），而不是父类的 `#field`。详见 [私有字段 #](./private-fields)。
:::

## 接下来

继承讲的是「实例之间」如何复用。下一页转向「挂在类自身」的成员——不依赖实例、随类一起存在的数据与行为：[静态成员](./static-members)，含 `static` 字段/方法、私有静态与**静态初始化块**。
