---
layout: doc
outline: [2, 3]
---

# 参考

> Immer **核心 API、插件开关、配置、补丁格式、返回值规则与常见模式** 速查。版本基线 **Immer 11.1.11**。

## 速查

- 核心更新：`produce(base, recipe)`；无改动时返回 `base` 原引用，改动时只复制变更路径
- draft 检视：`current(draft)` 看当前快照，`original(draft)` 取原始对象；两者都只接受 draft
- 可选能力：Map/Set、patches、array methods 分别调用 `enableMapSet()`、`enablePatches()`、`enableArrayMethods()`
- 补丁：`produceWithPatches()` 返回 `[next, patches, inversePatches]`；路径是数组，且不保证最小集
- 冻结：auto-freeze 默认开启；`freeze(value)` 浅冻结，`freeze(value, true)` 深冻结
- 手动 draft：`createDraft()` / `finishDraft()` 是低级 API，应尽快完成，不要让 draft 跨越异步流程
- 返回值：改 draft 与返回新对象二选一；要产出 `undefined` 请 `return nothing`

## 一、核心 API

| 导出 | 签名 / 用途 |
|---|---|
| `produce` | `produce(base, recipe, patchListener?)` → 新不可变状态；第一参为函数时返回柯里化生产者 |
| `produceWithPatches` | 同 produce，返回 `[nextState, patches, inversePatches]` |
| `applyPatches` | `applyPatches(base, patches)` → 把补丁重放到状态，产出新状态 |
| `current` | `current(draft)` → draft 当前状态的普通快照（非 Proxy、未冻结）；非 draft 会抛错 |
| `original` | `original(draft)` → draft 对应的原始基对象；非 draft 会抛错 |
| `createDraft` | `createDraft(base)` → 创建需手动终态化的 draft（低级 API） |
| `finishDraft` | `finishDraft(draft, patchListener?)` → 终态化 draft（不可用于 produce 的 draft） |
| `freeze` | `freeze(obj, deep?)` → 冻结对象，`deep=true` 递归深冻结 |
| `isDraft` | 判断是否为 draft 对象 |
| `isDraftable` | 判断对象能否被 Immer 草稿化 |
| `Immer` | `new Immer(config)` → 配置隔离的独立实例 |

## 二、符号与哨兵值

| 导出 | 用途 |
|---|---|
| `immerable` | 符号；给类设 `[immerable] = true` 使其可 draft |
| `nothing` | 从配方 `return nothing` 表示「产出 undefined」（区别于「未改动」） |

## 三、插件开关（默认关闭，需显式启用）

| 函数 | 启用能力 | 注意 |
|---|---|---|
| `enableMapSet()` | 支持 `Map` / `Set` 作为状态 | 应用入口调用一次 |
| `enablePatches()` | 启用 patches（produceWithPatches / applyPatches / patchListener） | 补丁不保证最小集 |
| `enableArrayMethods()` | 数组方法性能优化（v11+，回调收 base 值） | 部分方法返回 draft，部分返回 base 值 |

```js
import { enableMapSet, enablePatches, enableArrayMethods } from "immer"
enableMapSet()        // 应用入口处各调一次
enablePatches()
enableArrayMethods()
```

## 四、全局配置

| 函数 | 作用 | 默认 |
|---|---|---|
| `setAutoFreeze(bool)` | 是否递归深冻结产出结果 | `true` |
| `setUseStrictShallowCopy(mode)` | 浅拷贝是否含非可枚举属性（`true` / `"class_only"`） | `false` |
| `setUseStrictIteration(bool)` | 迭代是否覆盖 symbol / 非可枚举（v11 默认 loose） | `false` |

## 五、TypeScript 工具类型

| 类型 / 函数 | 用途 |
|---|---|
| `Draft<T>` | 把 immutable 类型转为可变（去 readonly） |
| `Immutable<T>` | 把类型递归转为深 `readonly` |
| `castDraft(x)` | 运行时 no-op；把 immutable 值「看作」可变以解赋值冲突 |
| `castImmutable(x)` | 运行时 no-op；把可变值标注为 immutable |
| `Patch` | 描述补丁对象结构的类型 |

```ts
// 柯里化时显式给类型，避免变宽/变窄
const toggler = produce<Todo>(draft => { draft.done = !draft.done })
// typeof toggler === (state: Todo) => Todo

// 带额外参数：用元组泛型
const set = produce<Todo, [boolean]>((draft, v) => { draft.done = v })
```

## 六、返回值规则速记

| 写法 | 结果 |
|---|---|
| 改 draft，不 return | ✅ 产出改动后新状态 |
| 不改 draft，`return 新对象` | ✅ 整体替换状态 |
| `return draft` | ✅ 等价于不 return |
| `return nothing` | ✅ 产出 `undefined` |
| `return undefined` | ⚠️ 当作「未改动」 |
| `draft = 新对象` | ❌ 无效（重指局部变量） |
| 改 draft **且** return 新值 | ❌ 抛错 |

> 单行简写可用 `void`：`produce(draft => void (draft.age += 1))`，避免赋值结果被当作返回值。

## 七、补丁（Patch）格式

```js
// 类 RFC 6902，但 path 是「数组」而非斜杠字符串
{ op: "replace", path: ["users", 3, "name"], value: "Bob" }
{ op: "add",     path: ["tags", 0],          value: "new" }
{ op: "remove",  path: ["tags", 3] }
```

- op ∈ `add` / `replace` / `remove`。
- 与标准 JSON Patch 互通时需把 `path` 数组 ↔ `/users/3/name` 字符串相互转换。
- Immer **不保证补丁为最小集**。

## 八、常见更新模式

```js
produce(state, draft => {
  // 对象
  draft.obj.key = value
  delete draft.obj.key
  Object.assign(draft.obj, { a: 1, b: 2 })

  // 数组
  draft.arr.push(x); draft.arr.unshift(x)
  draft.arr.pop();   draft.arr.shift()
  draft.arr.splice(i, n)
  draft.arr[i].field = v
  draft.arr = draft.arr.filter(pred)

  // Map / Set（需 enableMapSet）
  draft.map.set(k, v); draft.map.delete(k)
  draft.set.add(v);    draft.set.delete(v)
})
```

## 九、限制清单

- 不支持 exotic 对象：DOM Node、Buffer、`window.location`；`Date` 应创建新实例替换。
- 不支持子类化的 Map/Set/Array。
- 数组只处理数字索引与 `length`，自定义（非索引）属性不保留。
- 假设单向树：循环引用 / 同一对象出现两次会出错，需 normalize。
- 类需 `[immerable] = true`；构造函数不会被调用。

---

API 查完，回 [指南 · 基础](./guide-line/base) 理解机制，或 [指南 · 进阶](./guide-line/advanced) 看 patches / 集成实战。
