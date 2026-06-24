---
layout: doc
outline: [2, 3]
---

# Proxy 与 Reflect

> 基于现代 JavaScript（ES2025 · 核于 2026-06）

## 速查

- `new Proxy(target, handler)`：在 `target` 外包一层，`handler` 里的**陷阱（trap）**拦截对它的底层操作
- 共 **13 个陷阱**，覆盖对象的全部基础内部方法：`get` / `set` / `has` / `deleteProperty` / `ownKeys` / `getOwnPropertyDescriptor` / `defineProperty` / `getPrototypeOf` / `setPrototypeOf` / `isExtensible` / `preventExtensions` / `apply` / `construct`
- 没写的陷阱 → 操作**直接透传**给 `target`（默认行为）
- 返回值约定：`set` / `deleteProperty` / `defineProperty` / `has` / `preventExtensions` / `setPrototypeOf` 须返回 **boolean**；`get` 返回任意值；`apply` / `construct` 返回调用结果
- **不变量（invariant）**：陷阱必须与 `target` 的真实约束自洽（如不能为不可配置属性谎报值），违反抛 `TypeError`
- `Reflect.*`：与 13 个陷阱**一一对应**的静态方法命名空间——陷阱里写 `Reflect.xxx(...)` 即「执行该操作的默认行为」
- `Reflect.get(target, key, receiver)` / `Reflect.set(...)` 的 **`receiver`** 让 getter / setter 里的 `this` 指向代理（而非裸 target），是正确转发的关键
- `Reflect` 方法返回 boolean 而非抛错（`Reflect.set` / `deleteProperty` / `defineProperty`），比 `delete` / 赋值 / `Object.defineProperty` 更可控
- `Proxy.revocable(target, handler)`：返回 `{ proxy, revoke }`，`revoke()` 后再访问代理即抛错
- 应用：响应式（Vue 3 reactivity）、数据校验、属性默认值、负索引数组、只读 / 日志包装、Mock

## Proxy：给对象装一层「拦截器」

`Proxy` 让你在一个对象（`target`）外面套一层可编程的壳。所有对这层壳的操作——读属性、写属性、`delete`、`in`、`Object.keys`、函数调用……——都会先经过 `handler` 里对应的**陷阱**，由你决定「照常执行、改写、还是拦下」。

```js
const target = { msg: "hello" };

const proxy = new Proxy(target, {
  get(obj, key) {
    console.log(`读取 ${String(key)}`);
    return key in obj ? obj[key] : `<无 ${String(key)}>`;
  },
});

proxy.msg; // 打印「读取 msg」→ "hello"
proxy.nope; // 打印「读取 nope」→ "<无 nope>"
```

关键性质：**没写的陷阱会原样透传给 `target`**。所以一个空 `handler`（`new Proxy(target, {})`）的行为与直接用 `target` 几乎无异——你只需为想改变的操作写陷阱。

## 13 个陷阱全表

每个陷阱对应一个对象的「基础内部方法」（规范里用 `[[Xxx]]` 记），拦截一类语言操作：

| 陷阱 | 拦截的操作 | 返回值 |
| --- | --- | --- |
| `get(t, key, receiver)` | 读属性 `obj.key` / `obj[key]` | 任意值 |
| `set(t, key, value, receiver)` | 写属性 `obj.key = v` | boolean（成功与否） |
| `has(t, key)` | `key in obj` | boolean |
| `deleteProperty(t, key)` | `delete obj.key` | boolean |
| `ownKeys(t)` | `Object.keys` / `getOwnPropertyNames` / `for...in` | 键数组 |
| `getOwnPropertyDescriptor(t, key)` | `Object.getOwnPropertyDescriptor` | 描述符对象 / `undefined` |
| `defineProperty(t, key, desc)` | `Object.defineProperty` / 类字段 | boolean |
| `getPrototypeOf(t)` | `Object.getPrototypeOf` / `instanceof` | 对象 / `null` |
| `setPrototypeOf(t, proto)` | `Object.setPrototypeOf` | boolean |
| `isExtensible(t)` | `Object.isExtensible` | boolean |
| `preventExtensions(t)` | `Object.preventExtensions` | boolean |
| `apply(t, thisArg, args)` | 函数调用 `proxy(...)` | 调用结果 |
| `construct(t, args, newTarget)` | `new proxy(...)` | 新建的对象 |

一个读多个操作的体感示例：

```js
const spy = new Proxy(
  { a: 1 },
  {
    has(t, key) {
      console.log(`in: ${String(key)}`);
      return key in t;
    },
    deleteProperty(t, key) {
      console.log(`delete: ${String(key)}`);
      delete t[key];
      return true;
    },
    ownKeys(t) {
      console.log("枚举键");
      return Reflect.ownKeys(t);
    },
  },
);

"a" in spy; // 打印「in: a」→ true
delete spy.a; // 打印「delete: a」→ true
Object.keys(spy); // 打印「枚举键」→ []
```

## Reflect：陷阱的「默认实现」

陷阱里常常需要「先做点自己的事，再执行原本该发生的操作」。怎样「执行原本该发生的操作」？这正是 **`Reflect`** 的用途——它是一个静态方法命名空间（不是构造函数、不能 `new`、不能当函数调），其 13 个方法与 13 个陷阱**同名同参、一一对应**，每个方法就是对应底层操作的**默认实现**：

```js
const proxy = new Proxy(
  { name: "Ada", age: 36 },
  {
    get(t, key, receiver) {
      console.log(`读 ${String(key)}`);
      return Reflect.get(t, key, receiver); // ← 执行默认读取
    },
    set(t, key, value, receiver) {
      console.log(`写 ${String(key)} = ${value}`);
      return Reflect.set(t, key, value, receiver); // ← 执行默认写入，并返回它的 boolean
    },
  },
);
```

比起在陷阱里手写 `obj[key]` / `obj[key] = value`，用 `Reflect` 有三个实在好处：

1. **返回值天然契合陷阱约定**：`Reflect.set` / `deleteProperty` / `defineProperty` 返回 boolean，正好做陷阱返回值，不必自己拼。
2. **不抛错、可预测**：`delete obj.x`、`Object.defineProperty` 在失败时可能抛异常；`Reflect.deleteProperty` / `Reflect.defineProperty` 改为返回 `false`，更适合在基础设施里判断。
3. **能正确传 `receiver`**（见下节），这是手写赋值做不到的。

### `receiver`：getter/setter 里 `this` 的归属

`Reflect.get` / `Reflect.set` 的第三 / 第四个参数 `receiver`，决定属性是 getter / setter 时其内部 `this` 指向谁。在 Proxy 陷阱里**务必把陷阱收到的 `receiver` 透传给 `Reflect`**，否则继承的 getter 会以裸 `target` 为 `this`，绕过代理、导致依赖追踪 / 拦截失效：

```js
const target = {
  _value: 10,
  get value() {
    return this._value; // 这里的 this 该是谁？
  },
};

const proxy = new Proxy(target, {
  get(t, key, receiver) {
    // 传 receiver → getter 内 this 是 proxy（不是 t）
    return Reflect.get(t, key, receiver);
  },
});

proxy.value; // 10；getter 以 proxy 为 this 执行
```

这一点在响应式系统里是命门：只有 `this` 是代理，getter 里对 `this.xxx` 的进一步读取才会再次触发 `get` 陷阱、从而被完整追踪。

## 不变量：陷阱不能「睁眼说瞎话」

陷阱给了你巨大自由，但不是无法无天。引擎强制一组**不变量（invariant）**——陷阱的返回必须与 `target` 的真实约束自洽，违反则抛 `TypeError`。直觉是「代理不能对外谎报对象的不可变事实」：

- `get`：若 `target` 上某属性是**不可配置且不可写**的数据属性，陷阱必须返回它的真实值，不能改；
- `deleteProperty`：不能「删掉」一个不可配置的属性（不能返回 `true`）；
- `defineProperty` / `setPrototypeOf`：不能给**不可扩展**对象新增属性 / 改原型；
- `ownKeys`：返回的键必须包含 `target` 全部不可配置的自有键，且对不可扩展对象不能多报。

```js
const frozen = Object.freeze({ x: 1 }); // x 不可写不可配置
const p = new Proxy(frozen, {
  get() {
    return 999; // 想谎报 x 的值
  },
});
// p.x // ❌ TypeError：不变量被破坏（不可配置不可写属性必须返回真实值）
```

记住这条边界，就能解释一些「Proxy 看似该生效却抛错」的场景——多半是撞了不变量。

## 三个经典应用

### ① 属性默认值

读不存在的属性时给一个兜底值，而不是 `undefined`：

```js
function withDefault(obj, fallback) {
  return new Proxy(obj, {
    get(t, key, receiver) {
      return key in t ? Reflect.get(t, key, receiver) : fallback;
    },
  });
}

const config = withDefault({ port: 8080 }, "未配置");
config.port; // 8080
config.host; // "未配置"
```

### ② 数据校验

把校验逻辑收进 `set` 陷阱，非法赋值直接拦下：

```js
const user = new Proxy(
  {},
  {
    set(t, key, value, receiver) {
      if (key === "age") {
        if (!Number.isInteger(value)) throw new TypeError("age 必须是整数");
        if (value < 0 || value > 150) throw new RangeError("age 超出合理范围");
      }
      return Reflect.set(t, key, value, receiver);
    },
  },
);

user.age = 30; // OK
// user.age = "老"  // TypeError
// user.age = 999   // RangeError
```

### ③ 最小响应式（Vue 3 的内核思路）

Vue 3 的 `reactive()` 正是用 Proxy：`get` 时**收集依赖**、`set` 时**触发更新**。一个去掉调度细节的骨架：

```js
let activeEffect = null; // 当前正在运行、需要被追踪的副作用
const depsMap = new WeakMap(); // 对象 → (key → 订阅该 key 的 effect 集合)

function track(target, key) {
  if (!activeEffect) return;
  let deps = depsMap.get(target);
  if (!deps) depsMap.set(target, (deps = new Map()));
  let set = deps.get(key);
  if (!set) deps.set(key, (set = new Set()));
  set.add(activeEffect);
}

function trigger(target, key) {
  depsMap.get(target)?.get(key)?.forEach((effect) => effect());
}

function reactive(obj) {
  return new Proxy(obj, {
    get(t, key, receiver) {
      track(t, key); // 读 → 记下「谁依赖了这个 key」
      return Reflect.get(t, key, receiver);
    },
    set(t, key, value, receiver) {
      const ok = Reflect.set(t, key, value, receiver);
      trigger(t, key); // 写 → 通知所有依赖者重跑
      return ok;
    },
  });
}

// 用法
const state = reactive({ count: 0 });
activeEffect = () => console.log("count 变为", state.count);
activeEffect(); // 首次运行，顺便完成依赖收集 → "count 变为 0"
state.count++; // 触发 effect → "count 变为 1"
```

这就是「数据一变，视图自动更新」背后的全部魔法：`get` 收集、`set` 触发。理解了它，Vue 3 响应式不再是黑箱。

## 可撤销代理：`Proxy.revocable`

需要「用完就彻底断开」的代理（如交给第三方的临时句柄），用 `Proxy.revocable`——`revoke()` 之后，对代理的任何操作都抛 `TypeError`：

```js
const { proxy, revoke } = Proxy.revocable({ secret: 42 }, {});
proxy.secret; // 42
revoke(); // 撤销
// proxy.secret // ❌ TypeError: Cannot perform 'get' on a proxy that has been revoked
```

## Baseline 与版本

| 特性 | 版本 | 状态（2026-06 核） |
| --- | --- | --- |
| `Proxy` / 13 个陷阱 / `Proxy.revocable` | ES2015 | ✅ Baseline 广泛可用（2016 起） |
| `Reflect` 命名空间 / 13 个方法 | ES2015（`Reflect` 自身 ES2015，方法集对应陷阱） | ✅ Baseline 广泛可用 |

> Proxy 无法被 polyfill 到完整能力（它拦截的是引擎层操作），老到不支持的环境只能改用 getter/setter 等替代方案。

## 小结

`Proxy` 用 13 个陷阱拦截对象的全部底层操作，没写的陷阱自动透传；`Reflect` 提供与陷阱一一对应的默认实现，配合 `receiver` 才能正确转发 getter/setter 的 `this`；不变量是陷阱必须遵守的边界。这套机制是响应式、校验、默认值、Mock 等「魔法库」的共同地基——尤其 Vue 3 的 `reactive` 就是 `get` 收集 + `set` 触发。下一页把视野从「拦截操作」扩到「挂接语言协议」，并补上资源生命周期管理——[元编程进阶与资源管理](./metaprogramming-resources)。
