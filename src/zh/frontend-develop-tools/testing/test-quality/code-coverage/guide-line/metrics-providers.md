---
layout: doc
outline: [2, 3]
---

# 指标与 Provider

> 基于 Vitest v4.x / Jest v30.x 编写

## 速查

- 四大指标：Statements / Branches / Functions / Lines；**Branches 最能反映测试质量**
- Vitest provider：`v8`（默认，快，V8 原生 profiler + AST 重映射）vs `istanbul`（Babel 插桩，跨运行时）
- v4 关键：v8 的 AST-aware remapping **已默认转正**，精度持平 istanbul（`experimentalAstAwareRemapping` 配置项被移除）
- Jest provider：`babel`（默认）vs `v8`；ignore 注释随 provider 不同（`istanbul ignore` / `c8 ignore`）
- 选型：纯 Node.js 用 v8；要跑 Firefox/Bun/Workers 用 istanbul

## 四大覆盖率指标

| 指标 | 英文 | 计算对象 | 说明 |
| ---- | ---- | -------- | ---- |
| 语句 | Statements | 每条可执行语句 | 粒度最细，一行多语句分别计 |
| 分支 | Branches | 每个条件的 true/false 分支 | `if/else`、三元 `?:`、`&&`/`\|\|` 短路、`switch`、`?.` |
| 函数 | Functions | 每个函数/方法/箭头函数 | 是否被调用至少一次 |
| 行 | Lines | 物理代码行 | 一行多语句只算一行 |

### 为什么 Branches 最关键

Statements / Lines / Functions 高，只说明代码「被执行过」，可能只走了 happy path。Branches 100% 才意味着每个判断两侧都覆盖。

```ts
function canEdit(user) {
  if (user && user.admin) return true; // 两个条件 = 多个分支
  return false;
}

// 只测这两种：
canEdit(null); // user 为假
canEdit({ admin: true }); // 两者都真
// → Statements / Lines / Functions 都是 100%
// → 但 user.admin === false 的分支没测，Branches 只有 ~67%
```

**结论**：把 Branches 当作下限门禁里最值得盯的单一指标。

## Vitest：v8 vs istanbul

| 维度 | v8（默认） | istanbul |
| ---- | ---------- | -------- |
| 包名 | `@vitest/coverage-v8` | `@vitest/coverage-istanbul` |
| 原理 | V8 运行时原生 profiler + AST 重映射 | Babel AST 插桩（注入追踪代码） |
| 精度（v4） | 与 istanbul 等价（AST 重映射已默认） | 精度标杆 |
| 速度 | 更快（无预编译插桩） | 较慢 |
| 内存 | 更低 | 较高 |
| 运行时 | 仅 V8（Node / Deno / Chromium） | 任意 JS 运行时（Firefox / Bun / Workers） |
| ignore 注释 | `/* v8 ignore next */` | `/* istanbul ignore next */` |

::: tip v4 里程碑
v3.2 引入的 `experimentalAstAwareRemapping` 在 **v4.0 转正为默认行为**，配置项本身被移除；`coverage.ignoreEmptyLines` 也一并移除（逻辑并入 AST 重映射）。所以 v4 的 v8 provider 精度已不再是短板。
:::

## Jest：babel vs v8

| 对比 | babel（默认） | v8 |
| ---- | ------------- | -- |
| 原理 | Babel 插桩（同 Istanbul 系） | V8 原生 profiler |
| 成熟度 | 极成熟 | 现代 Node 下精度良好 |
| ignore 注释 | `/* istanbul ignore next */` | `/* c8 ignore next */` |

切换方式：`coverageProvider: "v8"`（默认 `"babel"`）。

> 易混点：**Vitest 默认 v8，Jest 默认 babel**。同样写 `provider/coverageProvider`，默认值不一样。

## 选型建议

- **新项目 / 纯 Node.js**：用 v8（Vitest 已默认）——装包少、速度快、v4 精度持平
- **需跑 Firefox / Bun / Cloudflare Workers**：必须 istanbul（v8 profiler 只在 V8 系可用）
- **精度高度敏感的遗留项目**：可保留 istanbul，但 v4 下差距已可忽略

> 本项目实践：前端 `quiz-app` / `packages/ui` 用 Vitest `provider: "v8"`，后端 `quiz-backend` 用 Jest（`ts-jest` preset）默认 babel provider。
