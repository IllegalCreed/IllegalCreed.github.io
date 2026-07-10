---
layout: doc
outline: [2, 3]
---

# 指南 · 进阶

> 版本基线 **Zod 4.4.3**。把 Zod 用进真实项目：`refine`/`superRefine` 跨字段校验、`transform`/`pipe` 流水、判别联合、递归 schema、错误处理，以及 tRPC / React Hook Form / env 校验生态接入。

## 速查

- 跨字段规则放在对象级 `.refine()`，用 `path` 把单个 issue 定位到表单字段；异步规则改用 `parseAsync` / `safeParseAsync`
- 需要一次产生多个 issue 或指定 issue code 时用 `.superRefine()`；更底层的 v4 API 是 `.check()`
- `.transform()` 里不要靠 `throw` 表示校验失败，应写入 `ctx.issues` 并返回 `z.NEVER`
- `.pipe(next)` 将前一 schema 的输出交给下一 schema；类型和执行顺序都以管道方向为准
- 具有稳定判别键的对象联合优先 `z.discriminatedUnion(key, members)`；普通 `z.union` 会逐分支尝试
- v4 递归对象可用 getter 延迟引用自身；仍要避免运行时数据本身形成循环
- 错误明细读 `ZodError.issues`；展示用 `z.treeifyError`、`z.flattenError` 或 `z.prettifyError`
- Zod 4 暴露 Standard Schema `~standard`；框架集成前仍要核对 resolver 和目标库版本

## 一、refine：自定义与跨字段校验

`.refine(fn, params)` 接收返回布尔的函数，`false` 即失败。关键是 `path`——把错误挂到具体字段，前端表单才能在对应输入框下显示。**跨字段逻辑必须放在「对象级」refine**（才能拿到整份 data）：

```ts
const Register = z
  .object({
    password: z.string().min(8),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    error: "两次密码不一致",
    path: ["confirm"], // 错误挂到 confirm 字段
  });
```

`refine` 也支持 async（须用 `parseAsync`）：

```ts
const Email = z
  .email()
  .refine(async (e) => await notTaken(e), { error: "邮箱已被注册" });
await Email.parseAsync("a@b.com");
```

## 二、superRefine：多 issue 与自定义 code

单个 `refine` 只能产生一个 issue。要一次报告多处问题、或用不同 error code，用 `.superRefine((val, ctx) => ...)`（v4 中也可用 `.check()`），通过 `ctx.addIssue` 按需添加：

```ts
const Tags = z.array(z.string()).superRefine((val, ctx) => {
  if (val.length > 3) {
    ctx.addIssue({
      code: "too_big",
      maximum: 3,
      inclusive: true,
      message: "最多 3 个",
    });
  }
  if (val.length !== new Set(val).size) {
    ctx.addIssue({ code: "custom", message: "不允许重复" });
  }
});
```

## 三、transform 与 pipe：构建流水

`.transform()` 在校验后改变数据；若在转换里发现问题要报错，**不要 throw**，而是 push issue 并返回 `z.NEVER`：

```ts
const Parsed = z.string().transform((val, ctx) => {
  const n = Number.parseInt(val);
  if (Number.isNaN(n)) {
    ctx.issues.push({ code: "custom", message: "不是数字", input: val });
    return z.NEVER;
  }
  return n;
});
```

`.pipe()` 把多个 schema 串成流水：前一段输出作为后一段输入，表达「校验 → 转换 → 再校验」：

```ts
// 字符串 → 转数字 → 断言非负
const NonNegFromString = z
  .string()
  .pipe(z.coerce.number())
  .pipe(z.number().nonnegative());
```

> `z.preprocess(fn, schema)` 与 transform 相反，在**校验前**预处理原始输入（如先 `trim`、把 `null` 兜成默认值），再交给 schema 校验。

## 四、判别联合：按字段选分支

普通 `z.union` 逐个尝试成员；当各分支有一个共同的「判别字段」（字面量）时，用 `z.discriminatedUnion` 一步选中分支——**更快、错误信息更精准**：

```ts
const Result = z.discriminatedUnion("status", [
  z.object({ status: z.literal("success"), data: z.string() }),
  z.object({ status: z.literal("error"), message: z.string() }),
]);

Result.parse({ status: "error", message: "oops" });
```

## 五、递归 schema

v4 推荐用对象字面量里的 **getter** 引用自身（延迟求值，规避自引用初始化问题），比 v3 的 `z.lazy()` + 显式标注更简洁：

```ts
const Category = z.object({
  name: z.string(),
  get subcategories() {
    return z.array(Category); // getter 延迟求值
  },
});

// 互相递归
const User = z.object({
  email: z.email(),
  get posts() {
    return z.array(Post);
  },
});
const Post = z.object({
  title: z.string(),
  get author() {
    return User;
  },
});
```

## 六、错误处理三件套（v4）

`ZodError.issues` 是错误明细数组，每项含 `code`/`path`/`message`。v4 用**顶层函数**格式化（取代 v3 实例方法）：

```ts
const r = Register.safeParse(input);
if (!r.success) {
  z.treeifyError(r.error); // 与 schema 同构的嵌套树（取代 error.format()）
  z.flattenError(r.error); // { formErrors, fieldErrors }（取代 error.flatten()，适合单层表单）
  z.prettifyError(r.error); // 人类可读多行字符串（适合日志）
}
```

```ts
// flattenError 输出示例
{
  formErrors: [],
  fieldErrors: { confirm: ["两次密码不一致"] }
}
```

## 七、生态接入

**React Hook Form**：通过官方 resolver 接 Zod，错误自动映射到字段：

```ts
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const form = useForm({ resolver: zodResolver(Register) });
```

**tRPC**：用 `.input()` 校验过程入参，同时获得端到端类型：

```ts
const appRouter = t.router({
  createUser: t.procedure
    .input(z.object({ name: z.string(), email: z.email() }))
    .mutation(({ input }) => {
      /* input 已带类型且经校验 */
    }),
});
```

**环境变量校验**（T3 Env / 自建）：把 `process.env` 在启动时收敛为可信、带类型的配置：

```ts
const env = z
  .object({
    NODE_ENV: z.enum(["development", "production", "test"]),
    PORT: z.coerce.number().default(3000),
    DATABASE_URL: z.url(),
  })
  .parse(process.env); // 缺失/非法即 fail fast
```

> Zod 4 实现了 **Standard Schema** 规范（schema 上暴露 `~standard`），因此 TanStack Form、各类工具能直接消费 Zod schema，无需逐库适配。

---

进入 [指南 · 专家](./expert)：v3 → v4 完整迁移、Zod Mini 与 tree-shaking、`z.toJSONSchema` 与元数据注册表、品牌类型、全局错误与 i18n、库作者最佳实践。
