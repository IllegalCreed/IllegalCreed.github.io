---
layout: doc
outline: [2, 3]
---

# state / getter / 断言

> 基于 @pinia/testing v1.x 编写

## 速查

- 改 state：`store.x = 1` 或 `store.$patch({ ... })`（testing pinia 下可写）
- 覆盖 getter：`store.double = 3`（测试中 getter 可写）；赋 `undefined` 恢复
- 断言 action：`expect(store.action).toHaveBeenCalledOnce()` / `toHaveBeenCalledWith(...)`
- 类型：要用 `.mockResolvedValue` 等需 `mockedStore(useStore)` 包装

## 直接修改 state

testing pinia 下 state 可写，直接赋值或 `$patch`：

```ts
const store = useSomeStore();

store.name = "new name"; // 直接赋值
store.$patch({ count: 10 }); // 或 $patch

expect(store.name).toBe("new name");
```

测试中无需绕过任何 setter，状态设置极方便。

## 覆盖 getter

测试环境下 getter 是**可写的**，直接赋值即可 mock 返回：

```ts
const counter = useCounterStore();

counter.double = 3; // 覆盖 getter，返回 3

// 恢复默认计算：赋 undefined
// @ts-expect-error 类型是 number，但可这样重置
counter.double = undefined;
counter.double; // 回到正常计算
```

## 断言 action 被调用

stub（默认）或 `false` 模式下 action 都是 spy，用标准断言：

```ts
const store = useSomeStore();

expect(store.someAction).toHaveBeenCalledTimes(1);
expect(store.someAction).toHaveBeenCalledWith(arg1, arg2);
expect(store.someAction).toHaveBeenLastCalledWith(/* ... */);
expect(store.someAction).toHaveBeenCalledOnce(); // Vitest 语义化
```

## mockedStore 类型工具

TS 类型上 action 仍是普通函数，要用 `.mockResolvedValue()` 等 mock API 需用 `mockedStore` 包装（官方提供的类型工具）：

```ts
// 简化用法：把 store 的 action 标注为 Mock 类型
const store = mockedStore(useSomeStore);
store.someAction.mockResolvedValue("mocked value"); // 类型安全
```

> `mockedStore` 是一段类型工具函数（见官方文档），运行时只是 `useStore()`，作用是让 TS 把 action 识别为 spy，从而能用 `mockResolvedValue` 等。

action / 选项的完整说明见 [选项](./options.md)。
