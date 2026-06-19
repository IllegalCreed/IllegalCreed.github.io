---
layout: doc
outline: [2, 3]
---

# 测试 API

> 基于 Vitest v4.1.x 编写

## 速查

- 声明：`describe` 分组、`test` / `it` 用例（二者等价）
- 钩子：`beforeAll` / `afterAll` / `beforeEach` / `afterEach`；`beforeEach` 可 `return` 清理函数（≈ afterEach）
- 修饰符：`.skip` / `.only` / `.todo` / `.fails` / `.skipIf()` / `.runIf()`
- 参数化：`test.each`（数组 / 对象 / 模板）、`test.for`（v4，不展开数组）
- 并发：`test.concurrent`；并发里的快照必须用 `({ expect }) => ` 的 `context.expect`
- 夹具：`test.extend({ ... })`，支持 `scope: "file" | "worker"`、`test.override()`（v4.1+）

## 声明测试

```ts
import { describe, it, test, expect } from "vitest";

describe("数组工具", () => {
  test("push 后长度 +1", () => {
    const arr: number[] = [];
    arr.push(1);
    expect(arr).toHaveLength(1);
  });

  it("it 是 test 的别名", () => {
    expect(true).toBe(true);
  });
});
```

`describe` 可嵌套，用于组织层级；`test` / `it` 完全等价，按团队习惯择一。

## 钩子

```ts
import { describe, beforeAll, afterAll, beforeEach, afterEach, test } from "vitest";

describe("生命周期", () => {
  beforeAll(async () => {
    /* 组内所有测试前运行一次 */
  });
  afterAll(async () => {
    /* 组内所有测试后运行一次 */
  });
  beforeEach(() => {
    /* 每个测试前 */
  });
  afterEach(() => {
    /* 每个测试后 */
  });

  test("...", () => {});
});
```

::: tip 钩子返回清理函数（Vitest 特性，Jest 没有）

```ts
beforeEach(() => {
  const server = startServer();
  return () => server.close(); // 自动作为 afterEach 执行
});
```

把“建立”和“销毁”写在一起，避免共享变量在 `beforeEach` / `afterEach` 之间穿梭。
:::

## 修饰符

```ts
test.skip("暂时跳过", () => {});
test.only("本文件只跑这个", () => {});
test.todo("待实现，占位但不报错");
test.fails("预期失败，若通过反而报错", () => {
  expect(1).toBe(2);
});

// 条件跳过 / 条件运行
test.skipIf(process.env.CI)("本地跳过", () => {});
test.runIf(process.env.CI)("只在 CI 跑", () => {});

// 在测试函数内动态跳过
test("运行时判断", (ctx) => {
  if (!featureReady) ctx.skip();
});
```

::: warning `.only` 别提交进仓库
`.only` 会让该文件其它用例被静默跳过，CI 里可用 `--allowOnly=false` 强制报错防止误提交。
:::

## 参数化：test.each

同一逻辑跑多组数据，三种写法：

```ts
// 1) 数组：位置占位符 %i / %s / %o
test.each([
  [1, 1, 2],
  [2, 3, 5],
])("add(%i, %i) = %i", (a, b, expected) => {
  expect(a + b).toBe(expected);
});

// 2) 对象：$ 命名占位符
test.each([{ a: 1, b: 1, expected: 2 }])("add($a, $b) = $expected", ({ a, b, expected }) => {
  expect(a + b).toBe(expected);
});

// 3) 模板字符串：表格式，最直观
test.each`
  a    | b    | expected
  ${1} | ${1} | ${2}
  ${2} | ${3} | ${5}
`("$a + $b = $expected", ({ a, b, expected }) => {
  expect(a + b).toBe(expected);
});
```

`describe.each` 同理，用于参数化整组：

```ts
describe.each([
  { env: "dev", url: "http://localhost" },
  { env: "prod", url: "https://example.com" },
])("[$env]", ({ url }) => {
  test("url 合法", () => {
    expect(url).toMatch(/^https?:\/\//);
  });
});
```

## test.for（v4）

`test.for` 是 `test.each` 的新搭档：**不展开数组**，整组作为第一个参数传入，并能在第二参数拿到测试上下文（如并发安全的 `expect`）：

```ts
test.for([
  [1, 1, 2],
  [2, 3, 5],
])("add(%i, %i)", ([a, b, expected]) => {
  expect(a + b).toBe(expected);
});

// 并发 + 快照：用 context.expect 才能正确关联
test.concurrent.for([[1], [2]])("case %i", ([n], { expect }) => {
  expect(n).toMatchSnapshot();
});
```

## 并发

```ts
describe("并发组", () => {
  test("顺序执行", async () => {});
  test.concurrent("并行 1", async () => {});
  test.concurrent("并行 2", async () => {});
});
```

::: warning 并发里的快照
并发测试共享全局 `expect` 会导致快照错配，**必须**从上下文取 `expect`：

```ts
test.concurrent("快照", async ({ expect }) => {
  expect(await fetchData()).toMatchSnapshot();
});
```

:::

## 夹具（Fixtures）

`test.extend` 把“准备—注入—清理”封装成可复用的夹具，按需注入、用到才创建：

```ts
import { test as base, expect } from "vitest";

const test = base
  .extend("config", { port: 3000 })
  .extend("server", async ({ config }, use) => {
    const srv = await startServer({ port: config.port });
    await use(srv); // 把值交给测试
    await srv.close(); // use 之后是清理
  });

test("用到才会启动 server", async ({ server }) => {
  expect(server.listening).toBe(true);
});
```

夹具作用域，避免重复创建昂贵资源：

```ts
const test = base.extend("db", { scope: "file" }, async ({}, use) => {
  const db = await createDb(); // 整个文件共享一个
  await use(db);
  await db.close();
});
// scope 还可为 "worker"：整个 worker 进程共享
```

v4.1+ 可在 `describe` 块内覆盖夹具值：

```ts
describe("自定义端口", () => {
  test.override({ config: { port: 8080 } });
  test("用覆盖后的端口", ({ config }) => {
    expect(config.port).toBe(8080);
  });
});
```

::: tip 在 Vue 组件测试里
注入 Pinia、Vue Router、挂载组件等夹具模式，在「组件测试 > Vue Test Utils」「@pinia/testing」两章展开，那里以本页的 `test.extend` 为基础。
:::

## 断言去哪了

`expect` 的 matchers、`expect.soft`、类型测试等见 [断言](./assertions.md)；`vi.fn` / `vi.mock` / 假定时器见 [模拟（Mock）](./mocking.md)。
