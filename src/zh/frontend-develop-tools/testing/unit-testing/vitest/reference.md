---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Vitest v4.1.x 编写

## 速查

- 单次跑：`vitest run`；watch：`vitest`；覆盖率：`vitest run --coverage`；面板：`vitest --ui`
- 过滤：`-t "名"`（测试名）、`文件名`、`--changed`、`--project 名`
- 完整说明见 [入门](./getting-started.md) / [配置](./configuration.md) / [测试 API](./test-api.md) / [断言](./assertions.md) / [模拟](./mocking.md)

## CLI 命令

| 命令                          | 说明                                   |
| ----------------------------- | -------------------------------------- |
| `vitest`                      | watch 模式（默认）                     |
| `vitest run`                  | 单次执行，CI 用                        |
| `vitest --ui`                 | 启动可视化 UI（需 `@vitest/ui`）       |
| `vitest run --coverage`       | 生成覆盖率报告                         |
| `vitest -t "<正则>"`          | 按测试名过滤                           |
| `vitest <文件路径>`           | 按文件名过滤                           |
| `vitest --changed`            | 只跑改动相关的测试                     |
| `vitest related <源文件>`     | 只跑依赖该源文件的测试                 |
| `vitest run --shard=1/3`      | 分片，多机并行 CI                      |
| `vitest list`                 | 列出匹配的测试但不执行                 |
| `vitest run --bail=<n>`       | 失败 n 个后停止                        |
| `vitest run --reporter=<r>`   | 指定 reporter（`verbose` / `json` …）  |
| `vitest --project <name>`     | 只跑指定 project                       |
| `vitest --inspect-brk`        | 开 Node 调试，断点在首行              |
| `vitest bench`                | 跑基准测试（`bench`）                  |

## 常用配置项（`test.*`）

| 配置                | 默认       | 说明                                    |
| ------------------- | ---------- | --------------------------------------- |
| `environment`       | `"node"`   | `node` / `jsdom` / `happy-dom` / `edge-runtime` |
| `globals`           | `false`    | 注入全局 `test` / `expect`              |
| `setupFiles`        | `[]`       | 每个测试文件前运行                      |
| `globalSetup`       | `[]`       | 整进程启动 / 结束各一次                 |
| `include`           | `["**/*.{test,spec}.?(c\|m)[jt]s?(x)"]` | 测试文件匹配          |
| `clearMocks`        | `false`    | 每测试后 `.mockClear()`                 |
| `resetMocks`        | `false`    | 每测试后 `.mockReset()`                 |
| `restoreMocks`      | `false`    | 每测试后 `.mockRestore()`               |
| `testTimeout`       | `5000`     | 单测试超时（ms）                        |
| `hookTimeout`       | `10000`    | 钩子超时                                |
| `retry`             | `0`        | 失败重试次数                            |
| `isolate`           | `true`     | 文件级模块隔离                          |
| `projects`          | —          | 多项目配置（取代 `workspace`）          |
| `coverage.provider` | `"v8"`     | `v8` / `istanbul`                       |

## `vi.*` API

| API                            | 用途                                |
| ------------------------------ | ----------------------------------- |
| `vi.fn(impl?)`                 | 造 mock 函数                        |
| `vi.spyOn(obj, key)`           | 监视已有方法                        |
| `vi.mock(path, factory?)`      | 模块 mock（提升）                   |
| `vi.doMock(path, factory?)`    | 模块 mock（不提升，配动态 import）  |
| `vi.hoisted(fn)`               | 把变量提升到 mock 之前              |
| `vi.mocked(fn, opts?)`         | 类型安全包装                        |
| `vi.importActual(path)`        | 取原始模块（异步）                  |
| `vi.stubGlobal(name, val)`     | 替换全局变量                        |
| `vi.stubEnv(key, val)`         | 替换环境变量                        |
| `vi.useFakeTimers()`           | 启用假定时器                        |
| `vi.advanceTimersByTime(ms)`   | 推进定时器                          |
| `vi.setSystemTime(date)`       | 固定系统时间                        |
| `vi.waitFor(fn, opts?)`        | 轮询重试直到成功                    |
| `vi.clearAllMocks()` 等        | 批量清理 / 重置 / 恢复              |

## 常用 `expect` matchers

| matcher                          | 用途                            |
| -------------------------------- | ------------------------------- |
| `toBe` / `toEqual` / `toStrictEqual` | 相等（引用 / 深 / 严格）    |
| `toBeNull` / `toBeUndefined` / `toBeDefined` | 空值判断            |
| `toBeTruthy` / `toBeFalsy`       | 真假                            |
| `toBeGreaterThan` / `toBeCloseTo`| 数字比较                        |
| `toContain` / `toHaveLength` / `toHaveProperty` | 包含 / 长度 / 属性 |
| `toThrowError`                   | 抛错                            |
| `resolves` / `rejects`           | Promise（记得 `await`）         |
| `toHaveBeenCalledWith` / `toHaveBeenCalledTimes` | mock 调用断言   |
| `expect.objectContaining` 等     | 非对称匹配                      |
| `expect.soft`                    | 累积断言                        |

## 官方资源

- 文档：[https://vitest.dev/](https://vitest.dev/)
- 配置参考：[https://vitest.dev/config/](https://vitest.dev/config/)
- API：[https://vitest.dev/api/](https://vitest.dev/api/)
- GitHub：[https://github.com/vitest-dev/vitest](https://github.com/vitest-dev/vitest)
