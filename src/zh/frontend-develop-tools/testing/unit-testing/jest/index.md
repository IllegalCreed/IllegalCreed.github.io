---
layout: doc
---

# Jest

Meta（Facebook）出品的老牌 JavaScript 测试框架，一体集成测试运行器、断言、mock、快照与覆盖率，开箱即用。以 CommonJS 为先、生态极其成熟，是 React Native 与大量存量项目的事实标准，也是快照测试（snapshot testing）的鼻祖。Jest 30（2025-06）带来大幅性能提升。

## 评价

**优点**

- **开箱即用**：运行器 + `expect` 断言 + mock + 快照 + 覆盖率一体，无需拼装
- **生态成熟**：React Native 官方 preset、海量插件与文档、`__mocks__` 自动 mock 机制
- **快照鼻祖**：`toMatchSnapshot` 工具链最完整，`.snap` 文件格式被 Vitest 等沿用
- **强隔离**：每个测试文件跑在独立 VM context，互不污染
- **Jest 30 提速**：Rust 模块解析（unrs-resolver）+ 内存清理，大型 TS 项目实测耗时 -37%、内存 -77%

**缺点**

- **不支持 Vite**：官方明确不兼容 Vite 插件系统，Vite 项目应选 [Vitest](../vitest/)
- **ESM 仍 experimental**：需 `--experimental-vm-modules`，且 `jest.mock` 在 ESM 下不提升，要改用 `jest.unstable_mockModule`
- **配置较重**：TypeScript 需 `ts-jest` 或 `babel-jest` 转换层；`jest-environment-jsdom` 自 v28 起还需单独安装
- **冷启动偏慢**：相比 Vitest 的 Vite 管线，初次启动与 watch 重跑通常更慢

## 文档地址

[Jest](https://jestjs.io/)

## GitHub地址

[Jest](https://github.com/jestjs/jest)

## 幻灯片地址

<a href="/SlideStack/jest-slide/" target="_blank">Jest</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=jest" target="_blank" rel="noopener noreferrer">Jest 测试题</a>
