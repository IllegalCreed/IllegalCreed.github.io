---
layout: doc
---

# Vitest

由 Vite 原生驱动的新一代单元测试框架：直接复用项目的 `vite.config` 与插件 / 转换 / 解析管线，原生支持 ESM、TypeScript 与 JSX，配合模块依赖图的智能 watch，把“改一行只重跑相关测试”做到毫秒级。API 与 Jest 高度兼容，已是 Vue / Vite 生态的事实标准测试运行器（State of JS 满意度连年第一）。

## 评价

**优点**

- **与构建同源**：测试复用 `vite.config.ts` 的 alias / plugins / define，杜绝“构建能过、测试挂”或反之的环境漂移
- **原生 ESM + TS**：无需 babel / ts-jest 转译层，顶层 `await`、`import.meta` 开箱即用
- **极快的 watch**：基于模块依赖图，仅重跑受改动影响的测试，HMR 式体验
- **Jest 兼容**：`vi.*` 对应 `jest.*`，`expect` matchers、快照、`test.each` 几乎无缝迁移，学习与迁移成本低
- **能力完整**：内置 mock、假定时器、覆盖率、快照、类型测试、UI 面板；v4 起 Browser Mode 转正，可在真实浏览器跑组件测试

**缺点**

- **强绑 Vite**：非 Vite 项目收益下降（虽可独立配置），团队若用 webpack 等需额外权衡
- **`globals` 默认关闭**：不像 Jest 默认注入全局 `test` / `expect`，需显式 `globals: true` 并声明 `vitest/globals` 类型
- **mock 提升语义**：`vi.mock` 被提升到文件顶部，factory 内不能直接引用外部变量，须配合 `vi.hoisted`，初学易踩
- **迭代快**：版本演进迅速（如 `workspace` 配置已被 `projects` 取代），跨大版本升级需关注迁移说明

## 文档地址

[Vitest](https://vitest.dev/)

## GitHub地址

[Vitest](https://github.com/vitest-dev/vitest)

## 幻灯片地址

<a href="/SlideStack/vitest-slide/" target="_blank">Vitest</a>
