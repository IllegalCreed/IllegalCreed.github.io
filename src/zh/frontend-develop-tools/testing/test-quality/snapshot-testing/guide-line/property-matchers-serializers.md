---
layout: doc
outline: [2, 3]
---

# 属性匹配器与序列化器

> 基于 Vitest v4.x / Jest v30.x 编写

## 速查

- 属性匹配器：`toMatchSnapshot({ id: expect.any(Number) })` 对动态字段验类型、其余精确比对
- 运行时序列化器：`expect.addSnapshotSerializer({ test, serialize })`
- 配置序列化器：`snapshotSerializers: ["path/to/serializer.ts"]`（全局生效）
- `snapshotFormat`：控制 `pretty-format` 输出风格（`printBasicPrototype` 等）
- Vitest 默认 `printBasicPrototype: false`（不打印 `Object`/`Array` 原型名）

## 属性匹配器（处理动态值）

含 ID、时间戳、随机数的对象，直接快照会每次都不一致。用属性匹配器对这些字段只验类型：

```ts
it("user 含动态字段", () => {
  const user = createUser("Alice");
  // { id: 42, createdAt: Date, name: "Alice" }

  expect(user).toMatchSnapshot({
    id: expect.any(Number), // 只验类型，不锁具体值
    createdAt: expect.any(Date), // 同理
    // name 未指定 → 精确比对快照里的值
  });
});
```

生成的快照：

```
{
  "id": Any<Number>,
  "createdAt": Any<Date>,
  "name": "Alice",
}
```

内联快照同样支持（属性匹配器作第一参数，快照串作第二参数）：

```ts
expect(user).toMatchInlineSnapshot(
  { id: expect.any(Number) },
  `
  {
    "id": Any<Number>,
    "name": "Alice",
  }
`,
);
```

> 这是快照测试稳定性的关键——所有非确定性字段都应交给 `expect.any()` / `expect.stringMatching()` 等。

## 自定义序列化器

控制特定类型值的序列化输出，常用于 CSS-in-JS、Immutable、自定义对象。

### 运行时注册（当前文件生效）

```ts
expect.addSnapshotSerializer({
  // test：判断是否由本序列化器处理该值
  test(val) {
    return val && Object.prototype.hasOwnProperty.call(val, "foo");
  },
  // serialize：转成快照字符串，printer 递归序列化子值
  serialize(val, config, indentation, depth, refs, printer) {
    return `Pretty foo: ${printer(val.foo, config, indentation, depth, refs)}`;
  },
});
```

### 配置注册（全局生效）

```ts
// vitest.config.ts
export default defineConfig({
  test: {
    snapshotSerializers: ["path/to/custom-serializer.ts"],
  },
});
```

Jest 用 `snapshotSerializers` 字段（jest.config.js），语义一致。常见第三方：`@emotion/jest`（Emotion 样式）、`jest-serializer-html`（HTML 格式化）。

## snapshotFormat（输出格式）

控制 `pretty-format` 的全局序列化风格：

```ts
// vitest.config.ts
export default defineConfig({
  test: {
    snapshotFormat: {
      printBasicPrototype: true, // 显示 Object/Array 原型名
    },
  },
});
```

| 选项 | Vitest 默认 | 说明 |
| ---- | ---------- | ---- |
| `printBasicPrototype` | `false` | 是否打印 `Object {}` 的原型名 |
| `escapeString` | `false` | 字符串是否转义特殊字符 |
| `escapeRegex` | `true` | 正则是否转义 |
| `printFunctionName` | `false` | 是否打印函数名 |

::: tip 自定义序列化要用 serializer 而非 plugins
Vitest 的 `snapshotFormat` 里 `plugins` 字段被忽略，自定义序列化必须用 `snapshotSerializers` 或 `expect.addSnapshotSerializer()`。Jest 30 已把 `printBasicPrototype` 默认也改为 `false`，与 Vitest 对齐。
:::