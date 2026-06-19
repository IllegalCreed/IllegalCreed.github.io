---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Vitest v4.x / Jest v30.x 编写

## 速查

- 外部快照 `toMatchSnapshot()` / 内联 `toMatchInlineSnapshot()` / 文件 `toMatchFileSnapshot()`（Vitest）
- 动态值用属性匹配器 `{ id: expect.any(Number) }`
- 更新 `vitest -u` / `jest -u`；CI 默认不写、差异即失败
- 完整说明见 [入门](./getting-started.md) / [三种写法](./guide-line/snapshot-types.md) / [属性匹配器与序列化器](./guide-line/property-matchers-serializers.md) / [快照管理](./guide-line/managing-snapshots.md) / [Vitest vs Jest](./guide-line/vitest-vs-jest.md) / [最佳实践](./guide-line/best-practices.md)

## 快照 API

| API | 说明 |
| --- | ---- |
| `toMatchSnapshot(matchers?, hint?)` | 外部 `.snap` 文件快照 |
| `toMatchInlineSnapshot(matchers?, snap?)` | 内联快照，写回测试文件 |
| `toMatchFileSnapshot(path, hint?)` | 写到指定文件（**Vitest 独有**，须 `await`） |
| `toThrowErrorMatchingSnapshot(hint?)` | 抛错消息快照 |
| `toThrowErrorMatchingInlineSnapshot(snap?)` | 抛错消息内联快照 |
| `toMatchAriaSnapshot()` | ARIA 树快照（Vitest 4.1.4+） |
| `expect.addSnapshotSerializer(s)` | 运行时注册自定义序列化器 |

## 配置项

| 字段 | 工具 | 说明 |
| ---- | ---- | ---- |
| `snapshotFormat` | 两者 | `pretty-format` 输出风格（`printBasicPrototype` 等） |
| `snapshotSerializers` | 两者 | 全局自定义序列化器列表 |
| `resolveSnapshotPath` | Vitest | 自定义快照路径（函数） |
| `snapshotResolver` | Jest | 自定义快照路径（模块，需正反向 + 一致性检查） |

## Vitest vs Jest 速览

| | Vitest | Jest |
| --- | --- | --- |
| `toMatchFileSnapshot` | ✅ | ❌ |
| 错误快照格式 | `[Error: msg]` | `"msg"` |
| 文件头 | `Vitest Snapshot v1` | `Jest Snapshot v1` |
| `hint` 分隔 | `>` | `: ` |
| 路径配置 | 函数 | 模块 |

## 命令

```bash
# 更新快照
vitest -u
vitest -u -t "测试名"
jest -u
jest --testNamePattern="pattern" -u

# CI（不写快照，差异即失败）
vitest run
jest --ci
```

## 官方资源

- Vitest Snapshot：[https://vitest.dev/guide/snapshot.html](https://vitest.dev/guide/snapshot.html)
- Vitest expect：[https://vitest.dev/api/expect.html](https://vitest.dev/api/expect.html)
- Jest Snapshot Testing：[https://jestjs.io/docs/snapshot-testing](https://jestjs.io/docs/snapshot-testing)
- pretty-format：[https://github.com/jestjs/jest/tree/main/packages/pretty-format](https://github.com/jestjs/jest/tree/main/packages/pretty-format)