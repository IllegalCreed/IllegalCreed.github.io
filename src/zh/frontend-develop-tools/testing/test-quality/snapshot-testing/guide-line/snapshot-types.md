---
layout: doc
outline: [2, 3]
---

# 三种快照写法

> 基于 Vitest v4.x / Jest v30.x 编写

## 速查

- `toMatchSnapshot()`：外部 `.snap` 文件，存测试文件旁 `__snapshots__/`
- `toMatchInlineSnapshot()`：内联，框架自动写回测试文件的断言参数
- `toMatchFileSnapshot(path)`：写到指定文件（**Vitest 独有**，异步须 `await`）
- 错误快照：`toThrowErrorMatchingSnapshot()` / `toThrowErrorMatchingInlineSnapshot()`
- `hint` 参数：区分同一测试内的多个快照

## 外部快照 toMatchSnapshot

最常用，快照存测试文件旁的 `__snapshots__/<测试文件>.snap`：

```ts
import { expect, it } from "vitest";

it("用户列表结构", () => {
  expect(getUsers()).toMatchSnapshot();
});
```

同一测试内多次快照可用 `hint` 区分：

```ts
expect(a).toMatchSnapshot("登录前");
expect(b).toMatchSnapshot("登录后");
```

签名（第一个参数也可传属性匹配器，见 [属性匹配器](./property-matchers-serializers.md)）：

```ts
toMatchSnapshot(propertyMatchers?: object, hint?: string): void
```

## 内联快照 toMatchInlineSnapshot

快照作为字符串参数写回测试文件本身，无需 `.snap`：

```ts
it("内联", () => {
  expect({ a: 1 }).toMatchInlineSnapshot(`
    {
      "a": 1,
    }
  `);
});
```

- 首次运行时框架自动填入快照字符串
- 适合**小输出**（几行内），可读性好、审查直观
- Jest 若装了 Prettier 会自动格式化内联快照；Vitest 用 AST 改写

## 文件快照 toMatchFileSnapshot（Vitest 独有）

把快照写到显式指定的文件，适合 HTML / SVG / CSS 等需要独立文件和语法高亮的整文件：

```ts
import { expect, it } from "vitest";

it("渲染 HTML", async () => {
  const html = renderHTML(/* ... */);
  await expect(html).toMatchFileSnapshot("./test/basic.output.html");
});
```

::: warning 必须 await
`toMatchFileSnapshot` 返回 Promise。**不 `await` 会按 `expect.soft` 处理**——代码继续执行，到测试结束才报失败，容易漏判。
:::

> Jest 30.x **没有**等价的 `toMatchFileSnapshot`，需第三方库手动实现。这是切换框架时要注意的差异之一。

## 错误快照

捕获抛出的错误消息并快照：

```ts
function drink(flavor: string) {
  if (flavor === "octopus") throw new Error("yuck, octopus flavor");
}

it("抛错快照", () => {
  expect(() => drink("octopus")).toThrowErrorMatchingSnapshot();
});

it("抛错内联", () => {
  expect(() => drink("octopus")).toThrowErrorMatchingInlineSnapshot(
    `[Error: yuck, octopus flavor]`,
  );
});
```

::: tip Vitest 与 Jest 的错误格式不同
Vitest 渲染为 `[Error: message]`（含类名），Jest 只快照消息字符串 `"message"`。切换框架时错误快照需重新生成。
:::