---
layout: doc
outline: [2, 3]
---

# Jest 覆盖率

> 基于 Jest v30.x 编写

## 速查

- 启用：`jest --coverage`（别名 `--collectCoverage`），无需额外装包
- 筛选：`collectCoverageFrom`（glob 数组，负号 `!` glob 须排在正 glob 之后）
- 阈值：`coverageThreshold`（global + 目录 + glob + 单文件；负数=最大未覆盖数）
- provider：`coverageProvider: "babel"`（默认）/ `"v8"`
- 报告：`coverageReporters`，默认 `["clover","json","lcov","text"]`
- 忽略路径：`coveragePathIgnorePatterns`（正则，默认 `["/node_modules/"]`）

## 启用

Jest 覆盖率内置，`--coverage` 即可：

```bash
jest --coverage
jest --collectCoverage          # 别名，等价
jest --coverage --coverageProvider=v8
jest --coverage --coverageDirectory=./coverage-report
```

## collectCoverageFrom：指定参与文件

glob 数组，决定哪些文件计入覆盖率（含未被任何测试引用的文件，避免「没写测试的文件不显示」造成虚高）：

```ts
// jest.config.ts —— 本项目 quiz-backend 真实配置
export default {
  preset: "ts-jest",
  collectCoverageFrom: [
    "**/*.(t|j)s",
    "!**/__tests__/**", // 排除测试目录
    "!**/*.spec.ts", // 排除测试文件
    "!**/main.ts", // 排除入口
    "!**/*.module.ts", // 排除 NestJS 模块声明
  ],
  coverageDirectory: "../coverage",
  coverageReporters: ["text", "text-summary", "lcov"],
};
```

> **负号 glob 顺序**：`!` 排除模式必须排在正向 glob 之后，否则不生效。

## coverageThreshold：阈值门禁

```ts
coverageThreshold: {
  global: {
    branches: 80,    // 正数 = 最低百分比
    functions: 80,
    lines: 80,
    statements: -10, // 负数 = 最多允许 10 条未覆盖语句
  },
  "./src/components/": {  // 目录级（该目录汇总）
    branches: 40,
  },
  "./src/reducers/**/*.ts": {  // glob 级
    statements: 90,
  },
  "./src/api/payment.ts": {  // 单文件级
    branches: 100, functions: 100, lines: 100, statements: 100,
  },
}
```

规则：

- 匹配 glob / path 的文件会从 `global` 中**扣除**，各自独立检查
- 阈值不满足 → Jest 以非零退出码退出，CI 自动 fail
- 指定的 path **不存在也会报错**（防止配置失效被忽视）

完整门禁策略见 [阈值门禁与 CI](./thresholds-ci.md)。

## 配置项参考

| 字段 | 类型 | 默认 | 说明 |
| ---- | ---- | ---- | ---- |
| `collectCoverage` | `boolean` | `false` | 自动收集（拖慢测试） |
| `collectCoverageFrom` | `string[]` | `undefined` | 参与文件 glob |
| `coverageDirectory` | `string` | `undefined` | 输出目录 |
| `coverageProvider` | `'babel' \| 'v8'` | `'babel'` | 插桩引擎 |
| `coverageReporters` | `(string \| [string,opts])[]` | `['clover','json','lcov','text']` | 报告格式 |
| `coverageThreshold` | `object` | `undefined` | 阈值 |
| `coveragePathIgnorePatterns` | `string[]` | `['/node_modules/']` | 跳过的路径正则 |
| `forceCoverageMatch` | `string[]` | `['']` | 强制收集通常被忽略的文件 |

## provider 差异

| | babel（默认） | v8 |
| --- | --- | --- |
| 原理 | Babel 插桩 | V8 原生 profiler |
| ignore 注释 | `/* istanbul ignore next */` | `/* c8 ignore next */` |

> 设 `coverageReporters` 会**覆盖默认值**——若只写 `["lcov"]`，终端就不再有 `text` 表格，需手动补回。
