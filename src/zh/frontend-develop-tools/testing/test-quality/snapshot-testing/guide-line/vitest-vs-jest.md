---
layout: doc
outline: [2, 3]
---

# Vitest vs Jest 差异

> 基于 Vitest v4.x / Jest v30.x 编写

## 速查

- 仅 Vitest：`toMatchFileSnapshot`、`toMatchAriaSnapshot`（4.1.4+）、`toMatchScreenshot`（浏览器模式）
- 错误快照：Vitest `[Error: msg]`（含类名）vs Jest `"msg"`（仅消息）
- 文件头：`Vitest Snapshot v1` vs `Jest Snapshot v1`
- 路径配置：Vitest 函数 `resolveSnapshotPath` vs Jest 模块 `snapshotResolver`
- `hint` 分隔符：Vitest 用 `>` vs Jest 用 `: `
- 两者都：CI 默认不写快照、`pretty-format` 序列化、`printBasicPrototype: false`

## 差异汇总

| 特性 | Vitest v4.x | Jest 30.x |
| ---- | ----------- | --------- |
| `toMatchFileSnapshot` | 支持（异步须 `await`） | **不支持** |
| `toMatchAriaSnapshot` | 支持（4.1.4+） | 不支持 |
| `toMatchScreenshot` | 支持（浏览器模式） | 需第三方（jest-image-snapshot） |
| 错误快照格式 | `[Error: message]`（含类名） | `"message"`（仅消息） |
| 快照文件头 | `Vitest Snapshot v1` | `Jest Snapshot v1` |
| 自定义路径 | `resolveSnapshotPath`（函数） | `snapshotResolver`（模块，需正反向） |
| 内联快照格式化 | AST 改写 | 若装 Prettier 则自动格式化 |
| `hint` 分隔符 | `测试名 > hint` | `测试名: hint` |
| CI 未知快照 | 失败（不创建） | 失败（不创建） |
| 序列化引擎 | `pretty-format` | `pretty-format` |

## 切换框架要注意什么

- **错误快照需重新生成**：`[Error: ...]` 与 `"..."` 格式不同，跨框架必然不匹配
- **`toMatchFileSnapshot` 不可移植**：迁到 Jest 需换成第三方或改用 `.snap`
- **`hint` 分隔符变化**：同一测试多快照的 key 文案会变，快照需重建
- **`snapshotFormat` 细节**：`escapeRegex` / `printFunctionName` 默认值可能不同，必要时显式配置对齐
- **共性放心**：两者都用 `pretty-format`、都在 CI 不写快照、属性匹配器 / 内联 / 自定义序列化器 API 基本一致

> 结论：基础快照（对象 / 组件 HTML）跨框架迁移成本低；用到 Vitest 独有 API 或错误快照时，迁移需重新生成快照。