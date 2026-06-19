---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Vitest v4.x / Jest v30.x 编写

## 速查

- 原理：序列化值 → 首次生成 `.snap` 基准 → 后续比对 → 不一致失败 → 审查后 `-u` 更新
- 外部快照：`expect(value).toMatchSnapshot()` → 存测试文件旁 `__snapshots__/*.snap`
- 内联快照：`expect(value).toMatchInlineSnapshot()` → 框架自动写回测试文件
- 文件快照：`await expect(html).toMatchFileSnapshot("./out.html")`（Vitest 独有，须 `await`）
- 动态值：`toMatchSnapshot({ id: expect.any(Number) })` 用属性匹配器
- 更新：`vitest -u` / `jest -u`；CI 默认不写快照，缺失/不符/过时均失败
- 序列化底层：`pretty-format`（Vitest 与 Jest 共用）

## 快照测试是什么

快照测试是一种「输出固化 + 回归比对」策略，三步走：

1. **首次运行**：把被测值（组件 HTML、对象、错误消息等）序列化成文本，写入 `.snap` 作为基准快照。
2. **后续运行**：对同一值重新序列化，与基准逐字符比对。
3. **不一致时**：测试失败并展示 diff，由你判断是 bug（修代码）还是预期变更（更新快照）。

> 序列化由 `pretty-format` 完成，能处理原始类型、对象、数组、DOM 节点、组件元素等。

## 第一个快照

```ts
import { expect, it } from "vitest";

it("toUpperCase 输出", () => {
  expect("foobar".toUpperCase()).toMatchSnapshot();
});
```

首次运行后，旁边生成 `__snapshots__/xxx.test.ts.snap`：

```
// Vitest Snapshot v1, https://vitest.dev/guide/snapshot.html
exports[`toUpperCase 输出 1`] = `"FOOBAR"`;
```

之后每次运行都会和这个基准比对，不一致即失败。

## 内联快照

`toMatchInlineSnapshot` 把快照直接写回测试文件，免去维护 `.snap`：

```ts
it("数据对象内联快照", () => {
  const data = { foo: new Set(["bar", "snapshot"]) };
  expect(data).toMatchInlineSnapshot();
  // 首次运行后，框架自动把上行改写为：
  // expect(data).toMatchInlineSnapshot(`
  //   {
  //     "foo": Set {
  //       "bar",
  //       "snapshot",
  //     },
  //   }
  // `)
});
```

适合输出较小、希望在代码审查里直接看到期望值的场景。

## 更新快照

确认变更合理后，更新基准：

```bash
vitest -u          # 更新所有失败快照（Vitest）
jest -u            # 同上（Jest）
vitest -u -t "名"  # 只更新匹配的测试
```

watch 模式下按 `u` 键可交互更新。

::: warning 更新前必须审查 diff
不看 diff 就 `-u`，会把真实 bug 当成预期变更固化进基准，快照就失去了意义。详见 [快照管理](./guide-line/managing-snapshots.md)。
:::

## 下一步

- [三种快照写法](./guide-line/snapshot-types.md)：外部 / 内联 / 文件快照、错误快照
- [属性匹配器与序列化器](./guide-line/property-matchers-serializers.md)：处理动态值、自定义输出、`snapshotFormat`
- [快照管理](./guide-line/managing-snapshots.md)：更新、CI 行为、过时快照、路径自定义
- [Vitest vs Jest 差异](./guide-line/vitest-vs-jest.md)：独有 API、格式、行为对照
- [最佳实践与反模式](./guide-line/best-practices.md)：组件快照、快照膨胀、盲目更新