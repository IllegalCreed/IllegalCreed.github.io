---
layout: doc
outline: [2, 3]
---

# 参考

> ts-pattern **常用 API、`P.*` 模式、链式断言与类型工具**速查。版本基线 **ts-pattern 5.9.0**。导入：`import { match, P, isMatching } from 'ts-pattern'`。

## 速查

- 包基线：`5.9.0`，零依赖、ESM / CommonJS 双入口、约 2 kB 量级；实际体积以生产构建为准
- 匹配链：`.with()` 声明分支，`.exhaustive()` 穷尽收尾，`.otherwise()` 兜底，`.run()` 执行但不检查穷尽性
- 分支规则自上而下短路；`.returnType<T>()` 在分支前锁定输出，`.narrow()` 在分支后深度排除已处理情况
- `P._` / `P.any` 匹配任意值；基础类型、数组、Record、Set、Map、类实例均有对应模式
- 组合模式：`P.union` / `P.intersection` / `P.not`；可选属性使用 `P.optional`
- 提取：单个匿名 `P.select()` 或多个命名 `P.select(name)`；可附带子模式先校验再提取
- `isMatching` 支持柯里化和两参形式，可把 `unknown` 收窄；失败只返回 false，不生成错误树
- 类型工具：`P.infer` 从模式推类型，`P.Pattern<T>` 约束模式，`P.narrow` 计算模式兼容的输入子集

## 一、顶层导出

| 导出                         | 作用                                                   |
| ---------------------------- | ------------------------------------------------------ |
| `match(value)`               | 开启匹配链，传入待匹配的值                             |
| `P`                          | 模式（Pattern）命名空间，聚合所有 `P.*` 模式与类型工具 |
| `isMatching(pattern)`        | 柯里化类型守卫，返回 `(value) => boolean`              |
| `isMatching(pattern, value)` | 直接判断 value 是否匹配 pattern，返回 boolean          |
| `Pattern` / `P.Pattern<T>`   | 类型 `T` 的所有合法模式的类型                          |

## 二、match 链上的方法

| 方法                             | 作用                                                  |
| -------------------------------- | ----------------------------------------------------- |
| `.with(pattern, handler)`        | 声明「模式 → 处理函数」分支                           |
| `.with(p1, p2, ..., handler)`    | 多模式：命中任一即执行同一 handler                    |
| `.with(pattern, guard, handler)` | 带守卫：匹配 pattern 且 guard 返回 true 才命中        |
| `.when(predicate, handler)`      | 对整个输入施加谓词作为一个独立分支                    |
| `.returnType<T>()`               | 显式锁定整条表达式返回类型为 `T`（放在 `.with` 之前） |
| `.narrow()`                      | 深度排除此前已处理的输入组合，再继续添加分支          |
| `.exhaustive()`                  | 收尾执行 + **编译期穷尽检查**（漏分支报错）           |
| `.exhaustive(handler)`           | 同上，但运行时遇未覆盖值时调用 handler 而非抛错       |
| `.otherwise(handler)`            | 兜底收尾，等价 `.with(P._, handler).exhaustive()`     |
| `.run()`                         | 收尾执行，**不做**穷尽检查（不安全）                  |

## 三、通配 / 基础类型模式

| 模式            | 匹配                              |
| --------------- | --------------------------------- |
| `P._` / `P.any` | 任意值（二者为别名）              |
| `P.string`      | 任意 `string`                     |
| `P.number`      | 任意 `number`                     |
| `P.boolean`     | 任意 `boolean`                    |
| `P.bigint`      | 任意 `bigint`                     |
| `P.symbol`      | 任意 `symbol`                     |
| `P.nullish`     | `null \| undefined`               |
| `P.nonNullable` | 除 `null \| undefined` 外的任意值 |

## 四、集合 / 组合模式

| 模式                       | 匹配                                               |
| -------------------------- | -------------------------------------------------- |
| `P.array(sub?)`            | 元素都满足 `sub` 的数组（省略 `sub` 则不约束元素） |
| `...P.array(sub)`          | 变长元组里的「任意多个满足 sub 的元素」            |
| `P.set(sub)`               | 元素都满足 `sub` 的 `Set`                          |
| `P.map(keySub, valSub)`    | 键值都满足子模式的 `Map`                           |
| `P.record(keySub, valSub)` | 键值类型统一的字典对象（也可只传 valSub）          |
| `P.union(...subs)`         | 命中任一子模式即匹配（逻辑或）                     |
| `P.intersection(...subs)`  | 同时满足所有子模式（逻辑与）                       |
| `P.not(sub)`               | 不满足子模式（否定）                               |
| `P.optional(sub)`          | 对象模式中：该键可缺失，存在则须满足 `sub`         |
| `P.instanceOf(Class)`      | 是 `Class`（或子类）的实例                         |

## 五、守卫与提取

| 模式                    | 作用                                       |
| ----------------------- | ------------------------------------------ |
| `P.when(predicate)`     | 谓词返回 true 才命中；写成类型守卫可收窄   |
| `P.select()`            | 匿名提取：选中值作为 handler 第一个参数    |
| `P.select('name')`      | 命名提取：所有命名选择汇成对象传入         |
| `P.select('name', sub)` | 带子模式的命名提取：先约束条件，再提取该值 |

## 六、字符串链式断言（`P.string.*`）

| 断言             | 匹配          |
| ---------------- | ------------- |
| `.startsWith(s)` | 以 `s` 开头   |
| `.endsWith(s)`   | 以 `s` 结尾   |
| `.includes(s)`   | 包含 `s`      |
| `.regex(re)`     | 匹配正则 `re` |
| `.minLength(n)`  | 长度 ≥ n      |
| `.length(n)`     | 长度恰好 = n  |
| `.maxLength(n)`  | 长度 ≤ n      |

## 七、数字链式断言（`P.number.*` / `P.bigint.*` 同款）

| 断言                          | 匹配                        |
| ----------------------------- | --------------------------- |
| `.between(min, max)`          | 在 [min, max] 区间          |
| `.gt(n)` / `.gte(n)`          | 大于 / 大于等于             |
| `.lt(n)` / `.lte(n)`          | 小于 / 小于等于             |
| `.int()`                      | 整数                        |
| `.positive()` / `.negative()` | 正数 / 负数                 |
| `.finite()`                   | 非 `Infinity` / `-Infinity` |

> 链式断言后还可接 `.optional()`（如 `P.number.between(1,5).optional()`），等价于把该模式包进 `P.optional`。

## 八、类型工具

| 工具                           | 作用                                 |
| ------------------------------ | ------------------------------------ |
| `P.infer<typeof pattern>`      | 由模式反推「可被它匹配的值」的类型   |
| `P.Pattern<T>`                 | 类型 `T` 的所有合法模式的类型        |
| `P.narrow<In, typeof Pattern>` | 把输入类型按模式收窄（通常自动发生） |

---

API 查完，进 [指南 · 基础](./guide-line/base) 理解模式语言，或 [指南 · 进阶](./guide-line/advanced) 看 select / 守卫 / 判别联合实战。
