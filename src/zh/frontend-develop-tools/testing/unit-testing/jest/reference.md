---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Jest v30.x 编写

## 速查

- 跑测试：`jest`；监听：`jest --watch`；覆盖率：`jest --coverage`；更新快照：`jest -u`
- 过滤：`-t "名"`（测试名）、`文件名`、`--testPathPatterns`（Jest 30 改名，注意末尾 s）
- 完整说明见 [入门](./getting-started.md) / [配置](./guide-line/configuration.md) / [测试 API](./guide-line/test-api.md) / [断言与快照](./guide-line/assertions.md) / [模拟](./guide-line/mocking.md)

## CLI 选项

| 命令                        | 说明                                       |
| --------------------------- | ------------------------------------------ |
| `jest`                      | 运行所有测试                               |
| `jest <pattern>`            | 按文件名正则过滤                           |
| `jest -t "<正则>"`          | 按测试名过滤                               |
| `jest --watch`              | 监听（只跑变更相关，需 git）               |
| `jest --watchAll`           | 监听（跑所有）                             |
| `jest --coverage`           | 收集覆盖率                                 |
| `jest -u`                   | 更新快照（`--updateSnapshot`）             |
| `jest --ci`                 | CI 模式：新快照直接失败、不自动保存        |
| `jest --runInBand` / `-i`   | 串行执行（调试用）                         |
| `jest --detectOpenHandles`  | 检测未关闭句柄（隐含 `--runInBand`）       |
| `jest --shard=1/3`          | 分片并行（CI）                             |
| `jest --testPathPatterns`   | 按路径正则（Jest 30 由 `--testPathPattern` 改名）|

## 常用配置项

| 配置                  | 默认               | 说明                                       |
| --------------------- | ------------------ | ------------------------------------------ |
| `testEnvironment`     | `"node"`           | `jsdom` 需单独装 `jest-environment-jsdom`  |
| `preset`              | —                  | 如 `ts-jest`                               |
| `transform`           | `{ "\\.[jt]sx?$": "babel-jest" }` | 转换器                      |
| `moduleNameMapper`    | —                  | 路径别名 / 资源 mock                       |
| `setupFilesAfterEnv`  | `[]`               | 框架就绪后、每文件前运行                   |
| `clearMocks` / `resetMocks` / `restoreMocks` | `false` | 自动清理策略             |
| `coverageProvider`    | `"babel"`          | 或 `"v8"`                                  |
| `automock`            | `false`            | 全模块自动 mock                            |
| `testEnvironmentOptions.globalsCleanup` | `"soft"` | Jest 30 省内存，可设 `"on"`        |

## `jest.*` API

| API                          | 用途                                    |
| ---------------------------- | --------------------------------------- |
| `jest.fn(impl?)`             | 造 mock 函数                            |
| `jest.spyOn(obj, key)`       | 监视方法（默认仍调原实现）              |
| `jest.mock(path, factory?)`  | 模块 mock（CJS 提升）                   |
| `jest.unstable_mockModule()` | ESM 模块 mock（factory 必填）           |
| `jest.requireActual(path)`   | 取原始模块（**同步**）                  |
| `jest.createMockFromModule()`| 从模块生成自动 mock                     |
| `jest.useFakeTimers()`       | 启用假定时器                            |
| `jest.advanceTimersByTime()` | 推进定时器                              |
| `jest.advanceTimersToNextFrame()` | 推进到下一 rAF 帧（Jest 30）       |
| `jest.onGenerateMock(cb)`    | mock 生成全局 hook（Jest 30）           |
| `jest.clearAllMocks()` 等    | 批量清理 / 重置 / 恢复                  |

## 常用 `expect` matchers

| matcher                              | 用途                       |
| ------------------------------------ | -------------------------- |
| `toBe` / `toEqual` / `toStrictEqual` | 相等（引用 / 深 / 严格）   |
| `toContain` / `toContainEqual` / `toHaveLength` | 包含 / 长度    |
| `toHaveProperty` / `toMatchObject`   | 属性 / 对象部分匹配        |
| `toThrow`                            | 抛错                       |
| `resolves` / `rejects`               | Promise（记得 `await`）    |
| `toHaveBeenCalledWith` 等            | mock 调用断言              |
| `expect.objectContaining` / `arrayOf`| 非对称匹配（`arrayOf` 为 Jest 30 新增）|
| `toMatchSnapshot` / `toMatchInlineSnapshot` | 快照               |

## 官方资源

- 文档：[https://jestjs.io/](https://jestjs.io/)
- 配置：[https://jestjs.io/docs/configuration](https://jestjs.io/docs/configuration)
- Jest 30 博文：[https://jestjs.io/blog/2025/06/04/jest-30](https://jestjs.io/blog/2025/06/04/jest-30)
- GitHub：[https://github.com/jestjs/jest](https://github.com/jestjs/jest)
