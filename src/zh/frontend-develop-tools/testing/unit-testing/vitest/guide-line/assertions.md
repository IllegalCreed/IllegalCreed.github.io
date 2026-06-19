---
layout: doc
outline: [2, 3]
---

# 断言

> 基于 Vitest v4.1.x 编写

## 速查

- 相等：`toBe`（`Object.is`）/ `toEqual`（深比较）/ `toStrictEqual`（含 `undefined` 与类型）
- 真假：`toBeNull` / `toBeUndefined` / `toBeDefined` / `toBeTruthy` / `toBeFalsy`
- 数字：`toBeGreaterThan` / `toBeLessThanOrEqual` / `toBeCloseTo`
- 包含：`toContain` / `toHaveLength` / `toHaveProperty`
- 错误：`expect(fn).toThrowError(类型 | 子串 | 正则)`
- Promise：`await expect(p).resolves.toBe()` / `.rejects.toThrow()`
- Mock：`toHaveBeenCalled` / `toHaveBeenCalledWith` / `toHaveBeenCalledTimes`
- 非对称：`expect.objectContaining` / `arrayContaining` / `any` / `anything`
- 累积：`expect.soft`；异步安全：`expect.assertions(n)`
- 类型：`expectTypeOf` / `assertType`（需 `--typecheck`，不在运行时执行）

## 相等

```ts
expect(1 + 1).toBe(2); // Object.is，原始值 / 同一引用
expect({ a: 1 }).toEqual({ a: 1 }); // 递归深比较，忽略 undefined 属性
expect({ a: 1, b: undefined }).toStrictEqual({ a: 1, b: undefined }); // undefined 与类型也要一致
```

::: tip `toBe` vs `toEqual`
对象 / 数组比内容用 `toEqual`；`toBe` 只在比原始值或“是不是同一个对象”时用。需要把 `undefined` 属性、稀疏数组、类的差异也纳入比较时，用 `toStrictEqual`。
:::

## 真假与数字

```ts
expect(null).toBeNull();
expect(undefined).toBeUndefined();
expect(1).toBeDefined();
expect("x").toBeTruthy();
expect(0).toBeFalsy();

expect(10).toBeGreaterThan(9);
expect(10).toBeLessThanOrEqual(10);
expect(0.1 + 0.2).toBeCloseTo(0.3, 5); // 浮点数比较，避免精度误差
```

## 字符串、数组与对象

```ts
expect("hello world").toContain("world");
expect([1, 2, 3]).toContain(2);
expect([1, 2, 3]).toHaveLength(3);
expect({ name: "Alice", age: 20 }).toHaveProperty("name", "Alice");
expect("a1b2").toMatch(/\d/); // 正则
```

## 错误

```ts
expect(() => JSON.parse("{bad}")).toThrowError(SyntaxError); // 按类型
expect(() => JSON.parse("{bad}")).toThrowError("Unexpected token"); // 按消息子串
expect(() => risky()).toThrowError(/timeout/); // 按正则
```

## Promise

```ts
await expect(Promise.resolve(42)).resolves.toBe(42);
await expect(Promise.reject(new Error("fail"))).rejects.toThrow("fail");
```

::: warning 别忘了 await
`resolves` / `rejects` 返回 Promise，**必须 `await`**（或 `return`），否则断言可能在测试结束后才完成，造成漏报。
:::

## Mock 相关 matchers

```ts
expect(mockFn).toHaveBeenCalled();
expect(mockFn).toHaveBeenCalledTimes(2);
expect(mockFn).toHaveBeenCalledWith("arg1", 42);
expect(mockFn).toHaveBeenLastCalledWith("last");
expect(mockFn).toHaveReturnedWith(42);
```

`vi.fn` / `vi.spyOn` 的造法见 [模拟（Mock）](./mocking.md)。

## 非对称 matchers

只想断言“部分结构”而非完全相等时：

```ts
expect({ id: 1, name: "Alice", ts: Date.now() }).toEqual(
  expect.objectContaining({ name: "Alice" }), // 允许有其它属性
);
expect([1, 2, 3]).toEqual(expect.arrayContaining([1, 3])); // 允许顺序不同、有多余元素
expect("hello world").toEqual(expect.stringContaining("world"));
expect(42).toEqual(expect.any(Number)); // 只校验类型
expect({}).toEqual(expect.anything()); // 非 null / undefined 即可
```

## expect.soft — 累积断言

一个用例里想看到“所有失败”而非碰到第一个就停：

```ts
test("多处断言都跑完", () => {
  expect.soft(result.code).toBe(200); // 失败也继续
  expect.soft(result.msg).toBe("ok"); // 失败也继续
  expect.soft(result.data).toBeDefined();
  // 最后统一汇报所有失败项
});
```

## expect.assertions — 异步安全网

确保回调里的断言真的执行了（异步回调没被调用是隐蔽 bug）：

```ts
test("回调必须执行 2 次断言", async () => {
  expect.assertions(2);
  await withCallback((err, data) => {
    expect(err).toBeNull();
    expect(data).toBeDefined();
  });
});
```

## 类型测试

`expectTypeOf` / `assertType` 在**类型层面**断言，需 `vitest --typecheck` 或写在 `*.test-d.ts` 里，运行时不执行：

```ts
import { expectTypeOf, assertType } from "vitest";

expectTypeOf(42).toBeNumber();
expectTypeOf({ a: 1 }).toEqualTypeOf<{ a: number }>();

function greet(name: string): string {
  return `Hi, ${name}`;
}
expectTypeOf(greet).parameter(0).toBeString();
expectTypeOf(greet).returnType.toBeString();

assertType<number>(42);
// @ts-expect-error —— 预期类型不匹配
assertType<string>(42);
```

::: tip 类型测试是补充，不是替代
它保证“类型契约”不被改坏（如工具类型、泛型推断），与运行时断言互补。开 `--typecheck` 后 Vitest 会同时跑类型检查与运行时测试。
:::
