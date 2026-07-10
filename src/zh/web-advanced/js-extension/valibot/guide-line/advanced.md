---
layout: doc
outline: [2, 3]
---

# 指南 · 进阶

> 版本基线 **Valibot 1.4.2**。本篇覆盖真实业务里的硬骨头：递归结构、判别联合、跨字段校验、对象工具方法、错误处理与 i18n、异步校验。

## 速查

- 递归 schema 用 `v.lazy(() => Schema)` 延迟取值，并用 `GenericSchema<T>` 显式约束递归输出
- 有稳定判别键的对象联合用 `v.variant(key, options)`；没有判别键或成员不是对象时用 `v.union`
- 跨字段规则写在对象后的 pipeline：`v.partialCheck(paths, predicate)` 负责判断，`v.forward(action, path)` 定位 issue
- `v.pick` / `v.omit` / `v.partial` / `v.required` / `v.keyof` 都返回新 schema，不修改来源 schema
- `v.fallback` 处理任意校验失败；optional / nullable 的默认值只处理各自接受的空值
- 表单错误用 `v.flatten(issues)` 分组，日志或摘要用 `v.summarize(issues)`；单项路径可读 `v.getDotPath(issue)`
- 异步能力使用 `Async` 后缀并向外传播：`checkAsync` → `pipeAsync` → `objectAsync` → `safeParseAsync`
- 同步 schema 可以嵌入异步 schema，异步 schema 不能放入同步容器；能同步完成的规则保持同步

## 一、递归与自引用：lazy

递归结构（树、嵌套评论）会遇到「定义自己时引用自己」的循环，用 `v.lazy(() => Schema)` 延迟求值打破它：

```ts
import * as v from "valibot";

interface Category {
  name: string;
  children: Category[];
}

const CategorySchema: v.GenericSchema<Category> = v.object({
  name: v.string(),
  children: v.array(v.lazy(() => CategorySchema)), // 延迟引用自己
});
```

`lazy` 接收一个**返回 schema 的函数**，到校验时才求值，因此能引用尚未完成定义的自己。

## 二、判别联合：variant vs union

```ts
// union：通用联合，逐个尝试，无判别键
const A = v.union([v.string(), v.number()]);

// variant：按判别字段分流，更高效、报错更准（≈ Zod discriminatedUnion）
const Shape = v.variant("type", [
  v.object({ type: v.literal("circle"), radius: v.number() }),
  v.object({ type: v.literal("rect"), width: v.number(), height: v.number() }),
]);
```

对象联合**优先用 `variant`**：它直接看 `type` 字段选中对应分支，比 `union` 挨个试快，错误信息也精准定位到具体分支。

## 三、跨字段校验：forward + partialCheck

「确认密码必须等于密码」这类跨字段校验，要把 action 放在对象 schema **之后**的 pipe 里，用 `forward` 把 issue 转发到目标字段：

```ts
const RegisterSchema = v.pipe(
  v.object({
    password: v.pipe(v.string(), v.minLength(8)),
    confirm: v.string(),
  }),
  v.forward(
    v.partialCheck(
      [["password"], ["confirm"]], // 关注的字段路径
      (input) => input.password === input.confirm,
      "两次输入的密码不一致",
    ),
    ["confirm"], // issue 指到 confirm 字段
  ),
);
```

- `partialCheck` 拿到相关字段做布尔判断；
- `forward` 把产生的 issue「转发」到指定路径，从而让表单在 `confirm` 下展示错误。

单字段自身的 pipe 看不到兄弟字段，所以跨字段校验**必须**放对象之后。

## 四、对象工具方法（对位 TS 工具类型）

```ts
const User = v.object({ id: v.number(), name: v.string(), age: v.number() });

v.pick(User, ["id", "name"]); // 取子集（≈ Pick）
v.omit(User, ["age"]); // 去掉某些键（≈ Omit）
v.partial(User); // 全部可选（≈ Partial）
v.required(v.partial(User)); // 全部必填（≈ Required）
v.keyof(User); // 键名联合 picklist(['id','name','age'])
```

它们都以 schema 为第一个参数，返回**新 schema**，便于从一份基础 schema 派生出创建/更新等多种形态。

## 五、兜底与默认值方法

```ts
// fallback：任意校验失败时回退（≈ Zod 的 catch）
const Str = v.fallback(v.string(), "hello");
v.parse(Str, 123); // 'hello'

// 取默认值（不解析数据，常用于初始化表单）
const Form = v.object({
  theme: v.optional(v.picklist(["light", "dark"]), "light"),
});
v.getDefaults(Form); // { theme: 'light' }
```

区分：`fallback` 针对**任意非法输入**兜底；`optional` 的默认值只在**缺省/undefined** 时生效。

## 六、错误处理与 i18n

```ts
const result = v.safeParse(Schema, data);
if (!result.success) {
  // 扁平 issue → 按字段路径分组，便于表单展示
  const flat = v.flatten(result.issues);
  // { root?: [...], nested?: { 'user.email': [...] } }

  // 人类可读的汇总文本
  const text = v.summarize(result.issues);
}
```

自定义消息有两层：

```ts
// 逐条：作为 schema/action 的最后一个参数
v.pipe(v.string(), v.minLength(8, "至少 8 位"));

// 全局/多语言：setGlobalMessage / setSpecificMessage / setSchemaMessage
v.setGlobalMessage((issue) => `校验失败：${issue.message}`);
```

## 七、异步校验

涉及数据库查询、远程接口的校验要用 **Async 版本**——约定是「同名 + `Async` 后缀」：

```ts
import * as v from "valibot";
import { isUsernameAvailable } from "./api";

const ProfileSchema = v.objectAsync({
  username: v.pipeAsync(
    v.string(),
    v.checkAsync(isUsernameAvailable, "用户名已被占用"), // 返回 Promise<boolean>
  ),
  avatar: v.pipe(v.string(), v.url()), // 同步项照常
});

const result = await v.safeParseAsync(ProfileSchema, data);
```

两条铁律：

1. **异步函数只能嵌套在异步函数里**；同步函数可以嵌进异步（反之不行）。所以一旦某层异步，外层的 `object`/`pipe`/解析方法都要换成 `objectAsync`/`pipeAsync`/`parseAsync`。
2. 官方建议「**能同步就同步**，只把必须异步的部分换成 Async」，以控制复杂度与体积。

---

进入 [指南 · 专家](./expert)：体积与 tree-shaking 真相、safeParse 的 typed 三态、可复用 parser、brand 名义类型、从 Zod 迁移取舍。
