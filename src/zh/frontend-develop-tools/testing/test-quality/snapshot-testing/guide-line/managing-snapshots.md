---
layout: doc
outline: [2, 3]
---

# 快照管理

> 基于 Vitest v4.x / Jest v30.x 编写

## 速查

- 更新：`vitest -u` / `jest -u`；可加 `-t "名"` 只更新匹配测试；watch 模式按 `u`
- CI 默认**不写**快照：缺失（新快照）/ 不匹配 / 过时都直接**失败**
- 过时快照（obsolete）：测试删改后的孤儿条目，`-u` 自动清理
- `.snap` 必须提交版本库，否则 CI 无法比对
- 路径自定义：Vitest `resolveSnapshotPath`（函数）/ Jest `snapshotResolver`（模块）

## 更新快照

```bash
vitest -u                 # 更新所有失败快照
vitest -u -t "用户列表"    # 只更新匹配名称的测试
jest --updateSnapshot     # Jest 写法（-u 是别名）
```

watch 模式下测试失败时按 `u` 键可交互更新。

## CI 模式行为

CI 环境（`process.env.CI` 为真）下，Vitest / Jest **不会写入快照**：

| 情况 | CI 下行为 |
| ---- | -------- |
| 遇到新快照（首次出现） | **失败**，不自动创建 |
| 快照不匹配 | **失败**，不自动更新 |
| 存在过时快照 | **失败** |

> 含义：所有 `.snap` 必须在提交前生成并 commit 进版本库。CI 只做比对、绝不写盘——这正是快照回归保护的保证。

## 过时快照（Obsolete）

测试被删除或重命名后，`.snap` 里对应的旧条目变成「孤儿」，即过时快照。

- 本地 `vitest -u` / `jest -u` 会**自动删除**这些孤儿条目
- CI 下过时快照会**导致失败**（提醒你清理）

定期 `-u` 并审查 diff，避免 `.snap` 堆积无用条目。

## 快照路径自定义

### Vitest：resolveSnapshotPath（函数）

```ts
// vitest.config.ts —— 快照放测试文件同级而非子目录
export default defineConfig({
  test: {
    resolveSnapshotPath: (testPath, snapExtension) => testPath + snapExtension,
  },
});
```

签名第三参数 `context: { config }` 可在 monorepo 多项目场景按项目分目录。

### Jest：snapshotResolver（模块）

Jest 需要独立模块文件，且**必须同时实现正向 + 反向解析 + 一致性校验**：

```js
// custom-snapshot-resolver.js
module.exports = {
  resolveSnapshotPath: (testPath, ext) =>
    testPath.replace("__tests__", "__snapshots__") + ext,
  resolveTestPath: (snapPath, ext) =>
    snapPath.replace("__snapshots__", "__tests__").slice(0, -ext.length),
  testPathForConsistencyCheck: "some/__tests__/example.test.js",
};
```

```js
// jest.config.js
module.exports = { snapshotResolver: "path/to/custom-snapshot-resolver.js" };
```

> 差异：Vitest 一个函数搞定；Jest 要独立模块，且强制提供反向解析与一致性检查样本。