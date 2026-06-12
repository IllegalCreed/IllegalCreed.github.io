---
layout: doc
outline: [2, 3]
---

# 指南 · 专家

> 混合引擎全景、装饰器与 SWC、tsup-node 与 Node 应用构建、扩展名逃生门、2026 维护现状与选型决策。版本基线 **tsup 8.5.1**（2026-06）。

## 一、混合引擎全景：tsup 是指挥家

一条 `tsup src/index.ts --format esm,cjs --dts --treeshake`（且 tsconfig 开了 `emitDecoratorMetadata`）会动用**四个引擎**：

| 引擎              | 职责                                            | 何时上场                                 |
| ----------------- | ----------------------------------------------- | ---------------------------------------- |
| **esbuild**（Go） | TS/JS 转译与打包（esm/cjs 各跑一遍）、默认压缩与摇树 | 始终                                     |
| **SWC**（Rust）   | 转译 legacy 装饰器并发出元数据；es5 降级        | `emitDecoratorMetadata` / `--target es5` |
| **Rollup**（JS）  | `--treeshake` 兜底摇树；rollup-plugin-dts 打包声明 | `--treeshake` / `--dts`                  |
| **TypeScript**    | 为 dts 提供类型信息                             | `--dts`                                  |

这张分工图解释两件事：**速度构成**（JS 链路快在 esbuild，dts 链路慢在 TS + Rollup）与**每个 flag 的能力边界**（esbuild 给不了的，tsup 拿别的引擎补）。依赖关系佐证：`esbuild`/`rollup` 是直接依赖，`typescript`/`@swc/core`/`@microsoft/api-extractor` 全是可选 peer——用到哪个装哪个。

> 产物构成想看个明白：`--metafile` 产出 esbuild metafile（JSON），可丢进 esbuild 官方 Bundle Size Analyzer 分析哪个依赖占了体积——排查「devDependency 被意外打入」时最直接。

## 二、装饰器：SWC 接管的特殊通道

esbuild 不支持 `emitDecoratorMetadata`——发出装饰器元数据需要类型信息，而 esbuild 不做类型分析。tsup 检测到 tsconfig 开了该选项时**自动改用 SWC 转译装饰器**：

- `@swc/core` 是 **peer 依赖，需自装**；配置 `swc` 字段可传额外 SWC 选项，或 `swcrc: true` 读自定义 .swcrc；
- 部分选项被 tsup 固定、不可覆盖：`legacyDecorator: true`、`decoratorMetadata: true`、`keepClassNames: true`、`target: es2022`。

```ts
// tsup.config.ts —— 微调 SWC（仅装饰器转译场景生效）
export default defineConfig({
  swc: {
    jsc: { transform: { useDefineForClassFields: false } },
  },
  // swcrc: true, // 或改读项目里的 .swcrc
});
```

**经典报错**（官方 Troubleshooting 唯一条目）：`No matching export in "xxx.ts" for import "SomeType"`——SWC 先把装饰器转成 JS 时剥掉了纯类型导出，esbuild 随后解析 import 就找不到。**修复：把类型导入显式标注**——`import type { SomeType }` 或 `import { type SomeType }`。这是 esbuild/SWC/Babel 所有逐文件转译工具的通用约束（isolatedModules 语义），不是版本 bug。

## 三、tsup-node：Node 应用的正确姿势

构建 Node 应用/API 时，官方提供独立命令 **`tsup-node`**：

- 动机：打包依赖对 Node 应用通常没必要，「it can even break things, for instance, while outputting to ESM」——输出 ESM 时依赖内部的动态 require、`__dirname` 语义甚至会坏；
- 行为：**自动跳过打包所有 node_modules 包**（等价 `skipNodeModulesBundle: true`），比默认的「只豁免 deps/peerDeps」更彻底；其余 CLI 参数与 tsup 完全相同；
- 需要内联的包（monorepo 本地包）用 **`noExternal`** 拉回 bundle；
- 入口含 `#!` hashbang 时自动设置可执行权限——这是 tsup 的通用行为，CLI 工具开箱即用。

## 四、扩展名逃生门

产物要被不认识 `.mjs`/`.cjs` 的旧工具消费时，两条出路：

```ts
export default defineConfig({
  // 出路一：legacyOutput: true（CLI --legacy-output）
  // 按格式分目录、全 .js：dist/index.js（cjs）+ dist/esm/index.js + dist/iife/index.js

  // 出路二（更灵活）：outExtension 回调自定义扩展名
  outExtension({ format }) {
    return { js: `.${format}.js` }; // → index.esm.js / index.cjs.js
  },
});
```

> 回调上下文除 `format` 外还提供 `options`（解析后的配置）与 `pkgType`（package.json 的 `type` 字段）供决策；改 `type` 字段本身只能在两套默认规则间切换，自定义还得靠这两条。

## 五、2026 选型决策：留守还是迁移

**事实链**：README 官宣「**This project is not actively maintained anymore. Please consider using tsdown instead.**」；npm `latest` 停在 **8.5.1**（2025-11）；周下载仍约 **600 万+**——维护放缓但存量巨大，这就是 2026 年的真实画像。tsdown 是 VoidZero 主导、基于 Rolldown 的独立项目（不是 tsup 改名）。

| 维度                | tsup                       | tsdown                  | unbuild           |
| ------------------- | -------------------------- | ----------------------- | ----------------- |
| 引擎                | esbuild（Go）              | Rolldown（Rust）        | Rollup + mkdist   |
| 默认 format / clean | **cjs / false**            | esm / true              | esm               |
| dts                 | TS + rollup-plugin-dts，慢 | oxc 极速 / tsc 回退     | tsc 体系          |
| exports 生成 / 发布校验 | 无                     | **内置**（publint/attw）| 无                |
| 维护状态            | **官宣放缓**               | 活跃（VoidZero）        | 活跃（unjs）      |

- **留守合理的场景**：存量稳定库（构建脚本多年不动）、强依赖 esbuild 插件生态、不想吃 tsdown 0.x 阶段的 semver 风险；
- **迁移路径**：`npx tsdown-migrate --dry-run` 预览 → 执行（自动改配置、装依赖，支持 monorepo glob）；重点核对**默认值翻转**（format `esm`、`clean: true`）、选项重命名（`cjsInterop`→`cjsDefault`、`outExtension`→`outExtensions`）、esbuild 插件替换；
- **新库**：直接 tsdown 起步——本系列讲的概念几乎全部平移：deps/peerDeps 外部化语义、双格式 exports 写法、dts 每格式一份的原因，在 tsdown 中同样成立（详见 [tsdown 笔记](../../tsdown/getting-started)）。

---

至此 tsup 三篇指南完结。回到[入门](../getting-started)温习默认值，或到[参考](../reference)查 CLI 与扩展名规则表。
