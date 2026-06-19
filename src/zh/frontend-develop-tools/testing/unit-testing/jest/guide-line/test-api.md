---
layout: doc
outline: [2, 3]
---

# 测试 API

> 基于 Jest v30.x 编写

## 速查

- 声明：`describe` 分组、`test` / `it` 用例（等价）
- 修饰符：`.skip` / `.only` / `.todo`
- 参数化：`test.each`（数组 / 对象 `$名`），Jest 30 新增 `%$` 注入序号
- 钩子：`beforeAll` / `afterAll` / `beforeEach` / `afterEach`
- 嵌套执行顺序：外层 `beforeEach` 先、外层 `afterEach` 后

## 声明测试

```ts
import { describe, test, it, expect } from "@jest/globals";

describe("Calculator", () => {
  test("加法", () => {
    expect(1 + 2).toBe(3);
  });

  it("it 是 test 的别名", () => {
    expect(true).toBe(true);
  });
});
```

## 修饰符

```ts
test.skip("暂时跳过", () => {});
test.only("本文件只跑这个", () => {});
test.todo("待实现，仅占位、显示为 todo");
```

::: warning `.only` 别提交
`.only` 会让同文件其它用例被静默跳过，配 `--ci` 或 lint 规则防误提交。
:::

## 参数化：test.each

```ts
// 数组形式：位置占位符 %i / %s
test.each([
  [1, 1, 2],
  [2, 3, 5],
])("add(%i, %i) = %i", (a, b, expected) => {
  expect(a + b).toBe(expected);
});

// 对象形式：$ 命名占位符
test.each([
  { a: 1, b: 1, expected: 2 },
  { a: 2, b: 3, expected: 5 },
])("add($a, $b) = $expected", ({ a, b, expected }) => {
  expect(a + b).toBe(expected);
});
```

::: tip Jest 30 新增 `%$`
标题里用 `%$` 注入「测试序号」，便于定位第几条用例：

```ts
test.each(cases)("Case %$ 通过", () => {});
```

:::

`describe.each` 同理，可参数化整组用例。

## 钩子

```ts
import { beforeAll, afterAll, beforeEach, afterEach } from "@jest/globals";

beforeAll(async () => {
  await initDatabase(); // 全文件只跑一次
});
afterAll(async () => {
  await clearDatabase();
});
beforeEach(() => {
  /* 每个 test 前 */
});
afterEach(() => {
  /* 每个 test 后 */
});
```

## 嵌套钩子的执行顺序

这是面试高频点。外层 `beforeEach` 先于内层执行，外层 `afterEach` 后于内层执行：

```ts
beforeAll(() => console.log("1 - beforeAll"));
afterAll(() => console.log("1 - afterAll"));
beforeEach(() => console.log("1 - beforeEach"));
afterEach(() => console.log("1 - afterEach"));

test("", () => console.log("1 - test"));

describe("Scoped", () => {
  beforeAll(() => console.log("2 - beforeAll"));
  beforeEach(() => console.log("2 - beforeEach"));
  test("", () => console.log("2 - test"));
});

// 输出：
// 1 - beforeAll
// 1 - beforeEach → 1 - test → 1 - afterEach
// 2 - beforeAll
// 1 - beforeEach → 2 - beforeEach → 2 - test → 1 - afterEach
// 2 - afterAll → 1 - afterAll
```

要点：内层 `test` 也会触发外层 `beforeEach` / `afterEach`；`beforeAll` 按从外到内、`afterAll` 按从内到外。

断言与快照见 [断言与快照](./assertions.md)；mock 见 [模拟（Mock）](./mocking.md)。
