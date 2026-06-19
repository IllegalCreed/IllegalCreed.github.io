---
layout: doc
outline: [2, 3]
---

# 断言与快照

> 基于 Jest v30.x 编写

## 速查

- 相等：`toBe`（`Object.is`）/ `toEqual`（深比较）/ `toStrictEqual`（更严格）
- 包含：`toContain` / `toContainEqual` / `toHaveLength` / `toHaveProperty` / `toMatchObject`
- 错误：`expect(fn).toThrow(类型 | 子串 | 正则)`
- Promise：`await expect(p).resolves...` / `.rejects.toThrow()`
- Mock：`toHaveBeenCalledWith` / `toHaveBeenCalledTimes`
- 非对称：`expect.objectContaining` / `arrayContaining` / `any`，Jest 30 新增 `expect.arrayOf`
- 快照：`toMatchSnapshot` / `toMatchInlineSnapshot`，更新用 `jest -u`

## 常用 matchers

```ts
expect(1 + 1).toBe(2); // Object.is
expect({ a: 1 }).toEqual({ a: 1 }); // 深比较（忽略 undefined 属性）
expect({ a: 1, b: undefined }).toStrictEqual({ a: 1, b: undefined }); // 更严格

expect(value).toBeTruthy();
expect(value).toBeNull();
expect(0.1 + 0.2).toBeCloseTo(0.3, 5); // 浮点数
expect(n).toBeGreaterThan(3);

expect("hello world").toContain("world");
expect("hello").toMatch(/ell/);
expect([1, 2, 3]).toHaveLength(3);
expect([{ id: 1 }]).toContainEqual({ id: 1 }); // 深度包含
expect(obj).toHaveProperty("a.b", 1); // 嵌套属性
expect(obj).toMatchObject({ a: 1 }); // 对象部分匹配
```

## 错误与 Promise

```ts
expect(() => JSON.parse("{bad}")).toThrow(SyntaxError);
expect(() => risky()).toThrow("timeout");

await expect(Promise.resolve("ok")).resolves.toBe("ok");
await expect(Promise.reject(new Error("fail"))).rejects.toThrow("fail");
```

::: warning resolves / rejects 必须 await
不 `await`（或 `return`）会让断言在测试结束后才完成，造成漏报。
:::

## 非对称匹配器

```ts
expect(user).toEqual(
  expect.objectContaining({
    name: expect.any(String),
    tags: expect.arrayContaining(["tag1"]),
  }),
);
expect(str).toEqual(expect.stringMatching(/^prefix/));

// Jest 30 新增：验证数组每个元素都满足某条件
expect([1, 2, 3]).toEqual(expect.arrayOf(expect.any(Number)));
```

::: tip Jest 30 行为变更
非枚举属性默认从 `toEqual` 等对象匹配器中**排除**（Breaking Change）；升级后若有依赖非枚举属性的断言需调整。
:::

## 快照测试

Jest 是快照测试的鼻祖。首次运行生成 `.snap` 文件并提交到 git，之后每次比对。

### 外部快照

```ts
it("渲染正确", () => {
  const tree = render(<Link page="https://example.com">Example</Link>);
  expect(tree.container.firstChild).toMatchSnapshot();
  // 首次：生成 __snapshots__/xxx.test.tsx.snap
  // 之后：与 .snap 对比，不一致则失败
});
```

### 内联快照

```ts
it("渲染正确", () => {
  expect(value).toMatchInlineSnapshot();
  // 首次运行后，Jest 自动把快照写进上面的调用参数里
});
```

### 处理动态字段

用非对称匹配器跳过随机字段（时间戳、自增 id）：

```ts
expect(user).toMatchSnapshot({
  createdAt: expect.any(Date),
  id: expect.any(Number),
});
```

### 更新快照

```bash
jest -u          # 更新所有变化的快照（--updateSnapshot）
jest --ci        # CI 模式：新快照直接失败，不自动写入
```

::: tip 快照概念单独成章
何时该用快照、快照滥用变技术债、`.snap` 评审与维护等，详见「测试方法与质量 > 快照测试」一章；本页只覆盖 Jest 的快照 API。
:::

mock 相关 matchers（`toHaveBeenCalledWith` 等）见 [模拟（Mock）](./mocking.md)。
