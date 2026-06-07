---
layout: doc
outline: [2, 3]
---

# 指南 · 进阶

> 基于 **TypeScript 6.0.x**。模块解析、单文件转译约束、声明产出、工程引用与增量构建——把 tsc 用进真实大项目。

## 一、moduleResolution：如何解析 import 路径

决定 `import "x"` 时 tsc 去哪儿、按什么规则找文件与类型：

| 值 | 规则 | 适用 |
|---|---|---|
| `bundler` | 类 Node 但放宽（无需写扩展名、支持 `exports`） | 交给 Vite/webpack 等打包器时（最常用） |
| `nodenext` | 严格按 Node 的 ESM/CJS 双制式解析 | 直接跑在 Node、或发 npm 包 |
| ~~`node` / `node10`~~ | 旧 Node 解析 | **TS 6.0 已弃用** |

```jsonc
{ "compilerOptions": { "module": "esnext", "moduleResolution": "bundler" } }
```

> TS 6.0 弃用 `moduleResolution: node` 后，「`module: esnext`/`preserve` + `moduleResolution: bundler`」成了多数前端项目最顺的升级路径。

### 路径别名 baseUrl / paths

```jsonc
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  }
}
```

::: warning paths 只在「类型层面」生效
`paths` 只让 tsc **类型检查时**认得 `@/utils`。tsc emit 出的 JS **不会重写**这个路径——真正在运行时/打包时解析别名，要靠打包器（Vite `resolve.alias`）、`tsc-alias`、或 Node 的 `imports` 字段。只配 tsconfig 不配打包器 → 运行时 `Cannot find module '@/utils'`。
:::

## 二、isolatedModules：为单文件转译器让路

`isolatedModules: true` 让 tsc **强制要求每个文件都能被「单独」转译**，从而和 Babel/SWC/esbuild 这类逐文件工具行为一致。开启后会禁止依赖跨文件类型信息的写法：

- `export { SomeType }` 重导出类型 → 必须 `export type { SomeType }`；
- `const enum` 的跨文件内联不可靠 → 报错或需改普通 `enum`；
- 非模块文件（无 import/export）受限。

```jsonc
{ "compilerOptions": { "isolatedModules": true } }
```

> 只要你的 emit 是交给 SWC/esbuild/Babel 做的，就**应该开 `isolatedModules`**，让 tsc 提前帮你拦下那些「单文件转译器会出错」的写法。

## 三、verbatimModuleSyntax：所见即所得的 import/export

`verbatimModuleSyntax: true`（TS 5.0+，取代旧的 `importsNotUsedAsValues` + `preserveValueImports`）让 tsc **照原样保留**模块语法：标了 `import type` 的一定删除，没标的一定保留。

```ts
import { type Foo, bar } from "./mod"; // type Foo 被删，bar 保留
import type { Baz } from "./types";    // 整行删除
```

好处：消除「这个 import 到底会不会被 emit 进产物」的歧义，对 CJS/ESM 混用与单文件转译尤其重要。代价：**必须显式区分**类型导入与值导入，否则报错。

## 四、声明产出 declaration 的进阶

库项目除了 `declaration: true`，常配：

```jsonc
{
  "compilerOptions": {
    "declaration": true,
    "declarationMap": true,   // 让使用方「跳转到定义」能落到你的 .ts 源码
    "emitDeclarationOnly": false, // true = 只出 .d.ts，不出 .js（emit 交给别的工具）
    "stripInternal": true     // 删除带 @internal 注释的声明
  }
}
```

典型现代库构建：**用 SWC/esbuild/tsup 极速产出 `.js`，用 `tsc --emitDeclarationOnly` 单独产出 `.d.ts`**——各取所长。

## 五、Project References：大仓库分块构建

把一个大项目拆成多个相互引用的子工程，每个子工程 `composite: true`，主工程用 `references` 串起来，再用 `tsc -b` 按依赖拓扑顺序构建：

```jsonc
// packages/app/tsconfig.json
{
  "compilerOptions": { "composite": true, "outDir": "dist" },
  "references": [{ "path": "../shared" }]
}
```

```bash
tsc -b            # 按依赖顺序增量构建所有引用
tsc -b --watch    # 监听模式
tsc -b --clean    # 清理产物
```

- `composite: true` 隐式打开 `declaration` 与 `incremental`，并要求所有源文件都在 `include` 内。
- 引用的工程必须**先产出 `.d.ts`**，上游才能消费——这是 References 能增量的关键。

## 六、incremental：增量编译

```jsonc
{ "compilerOptions": { "incremental": true, "tsBuildInfoFile": "./.tsbuildinfo" } }
```

tsc 把上次的类型图与产物指纹存进 `.tsbuildinfo`，下次只重算受影响的部分。`composite` 会自动开启它。把 `.tsbuildinfo` 放进缓存目录、并加入 CI 缓存可显著提速。

## 七、watch 的取舍

`tsc -w` 适合「编译产出」的监听；但**纯类型检查的监听**更推荐交给编辑器的 `tsserver`（即时、按需）。CI 与 pre-push 用一次性 `tsc --noEmit` 即可，不必常驻 watch。

---

进入 [指南 · 专家](./expert)：`isolatedDeclarations`、TS 7.0「tsgo」原生编译器、性能调优与 6.0→7.0 迁移。
