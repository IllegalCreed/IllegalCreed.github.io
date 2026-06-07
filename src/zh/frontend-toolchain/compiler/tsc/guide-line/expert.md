---
layout: doc
outline: [2, 3]
---

# 指南 · 专家

> TS 7.0「tsgo」原生编译器、`isolatedDeclarations`、性能调优与 6.0 → 7.0 迁移。截至 2026-06：TS 6.0.x 稳定、TS 7.0 以 `@typescript/native-preview` 预览。

## 一、TypeScript 7.0「tsgo」：用 Go 原生重写

TS 的瓶颈是**慢**：纯 JS、单线程，大项目类型检查与编辑器加载都吃力。微软的解法是把整个编译器**移植到 Go**（项目代号 **Project Corsa**，原生二进制命令叫 **`tsgo`**）。

官方实测（Anders Hejlsberg，[A 10x Faster TypeScript](https://devblogs.microsoft.com/typescript/typescript-native-port/)）：

| 项目 | JS 版 tsc | 原生版 | 提速 |
|---|---|---|---|
| VS Code（1.5M 行） | 77.8s | 7.5s | **10.4×** |
| Playwright | — | — | 10.1× |
| TypeORM | — | — | 13.5× |
| 编辑器加载 | 9.6s | 1.2s | **8×** |

> Hejlsberg：「The native implementation will drastically improve editor startup, reduce most build times by 10x, and substantially reduce memory usage.」

**关键认知**：

- 是 **Go**，不是 Rust（常见误传）。源码在 [microsoft/typescript-go](https://github.com/microsoft/typescript-go)。
- **语义完全一致**：是同一套类型系统的「换实现」，不是新方言；目标是行为对齐（官方报告原生编译器通过约 99.6% 的兼容性测试）。
- **当前状态**：以 `@typescript/native-preview` 预览，命令为 `tsgo`；稳定 7.0 会把它作为 `typescript` 包的 `tsc` 入口正式接班。

```bash
# 试用原生预览版（与现有 typescript 并存，不影响项目）
npm i -D @typescript/native-preview
npx tsgo --noEmit     # 用原生编译器跑一遍类型检查
```

## 二、TS 6.0 → 7.0：过渡策略

TS 6.0 是 JS 实现的**收官版**，专门为切到原生版「清场」。要点：

- **先无痛升到 6.0、修干净弃用项**：把 `amd`/`umd`/`systemjs`、`es5` target、`moduleResolution: node`、`downlevelIteration` 等弃用用法替换掉。`"ignoreDeprecations": "6.0"` 只能临时压制报错，**7.0 会移除该逃生舱**。
- **`--stableTypeOrdering`**：6.0 新增的迁移辅助开关，让类型/联合的排序在新旧实现间稳定，便于比对 6.0 与 7.0 的输出差异。
- **默认 `strict`、默认 targets 收紧**：升级前先显式锁定 `strict` 与 `target`/`lib`，避免「默认值变化」带来的隐性破坏。
- 升级顺序建议：`5.x → 6.0`（修弃用 + 锁默认值）→ 用 `tsgo` 预览跑 CI 比对 → `7.0` 正式切换。

## 三、isolatedDeclarations：可并行的声明产出

`isolatedDeclarations: true`（TS 5.5+）要求**每个导出都有足够显式的类型标注，使得 `.d.ts` 能在「不做跨文件类型推断」的前提下、逐文件生成**。

```jsonc
{ "compilerOptions": { "declaration": true, "isolatedDeclarations": true } }
```

意义：声明文件的生成本来必须依赖完整类型推断（慢、难并行）。加上这个约束后，**第三方工具（SWC、oxc、esbuild、tsgo）也能极速、并行地产出 `.d.ts`**，不必再回头调用慢速的 tsc。代价：库的公共 API 必须写出显式返回类型（不能全靠推断）。

> 这是「让 tsc 之外的快工具也能接管 `.d.ts`」的关键拼图，与 `isolatedModules`（让快工具接管 emit）一脉相承。

## 四、性能调优清单

在 7.0 普及前，JS 版 tsc 仍可显著提速：

- **`skipLibCheck: true`**：跳过 `node_modules` 里 `.d.ts` 的相互检查，通常是单项最大提速。
- **`incremental` / Project References**：只重算受影响的子工程，配合 `.tsbuildinfo` + CI 缓存。
- **`tsc --noEmit` 与 emit 分离**：类型检查交 tsc、emit 交 SWC/esbuild，两者可并行跑。
- **收窄 `include`、用 `exclude` 排除测试与产物**：减少进入类型图的文件。
- **`assumeChangesOnlyAffectDirectDependencies`**：watch 下用更激进的失效策略换速度。
- **诊断**：`tsc --extendedDiagnostics` 看各阶段耗时，`--generateTrace traceDir` 产出可在 `chrome://tracing` 分析的火焰图。

## 五、把 tsc 当 API 用

构建工具/脚本可直接调用 `typescript` 编程接口：

```ts
import ts from "typescript";

// 单文件「只转译、不检查」——等价于 SWC/Babel 的剥类型
const { outputText } = ts.transpileModule(src, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
});

// 完整 Program：拿到类型检查器做静态分析 / 自定义诊断
const program = ts.createProgram(fileNames, options);
const diagnostics = ts.getPreEmitDiagnostics(program);
```

- `transpileModule` 是「单文件、无类型检查」的快速路径（ts-jest、各类 loader 内部用它）。
- `createProgram` + `getTypeChecker()` 才是完整类型检查的入口（lint 规则、codemod、API 提取器靠它）。

## 六、专家级易错点

- **`verbatimModuleSyntax` + CJS**：开了之后在 CJS 文件里写 `import`/`export` 会按字面保留，需确保 `module` 与文件制式匹配。
- **`paths` 不重写产物**：见进阶篇——大型项目最常见的「类型能过、运行报错」根因。
- **声明产出的 `composite` 连锁**：开 `composite` 会强制 `declaration` 且要求所有文件入 `include`，遗漏文件会报 `not listed within the file list`。
- **`tsgo` 预览与插件生态**：原生版当前聚焦命令行类型检查与 emit，部分依赖 TS 语言服务插件/transformer 的工具链需确认兼容性后再切。

---

回到 [参考](../reference) 查 tsconfig 选项与 CLI 速查表。
