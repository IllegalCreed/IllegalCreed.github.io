---
layout: doc
outline: [2, 3]
---

# 指南 · 进阶

> 版本基线 **tsdown 0.22.x**。dts 双路径机制、`exports` 自动生成、publint/attw/--unused 发布质检、tsup 迁移完整实操与插件生态。

## 一、dts 深入：oxc 极速路径 vs tsc 回退

tsdown 内部用 **rolldown-plugin-dts** 生成并打包声明文件，存在两条路径：

| 条件                              | 引擎              | 特点                       |
| --------------------------------- | ----------------- | -------------------------- |
| tsconfig 开 `isolatedDeclarations` | **oxc-transform** | 「extremely fast」（推荐） |
| 未开启                            | TypeScript 编译器 | 可靠，但相对慢             |

原理：`isolatedDeclarations` 强制**每个文件的导出都带显式类型标注**，声明文件因此可**逐文件独立生成**、无需跨文件全局推导——这才轮得到 Rust 的 oxc-transform 上场。代价是写代码要补全导出类型（编辑器会提示）。

```jsonc
// tsconfig.json —— 吃到极速路径
{
  "compilerOptions": {
    "isolatedDeclarations": true,
    "declaration": true
  }
}
```

细节三条：

- **declaration map**：tsconfig `declarationMap: true` 或 tsdown `dts: { sourcemap: true }`；
- **双格式行为**：ESM 的 `.js` 与 `.d.ts` 同一构建产出；**CJS 的声明由独立构建过程专门生成**（保证 require 解析兼容）；
- 第三方复杂类型打包出问题时，可指定 `dts: { resolver: 'tsc' }` 提高兼容性。

## 二、exports 自动生成：告别手写 package.json

```ts
export default defineConfig({
  entry: { index: "src/index.ts", utils: "src/utils.ts" },
  format: ["esm", "cjs"],
  dts: true,
  exports: true, // 构建后自动回写 package.json
});
```

产出（自动维护，与产物永远一致）：

```jsonc
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs"
    },
    "./utils": { /* 同结构 */ }
  }
}
```

- 默认**只写 `exports` 字段**；`exports: { legacy: true }` 时连同顶层 `main`/`module`/`types` 一起生成，兼容旧工具；
- `exports.all: true`：导出所有相关产物文件，而不只入口；
- `customExports`：传对象或 `(exports, ctx) => exports` 函数做最终微调；
- CSS 不分割时，产物 `style.css` 也会自动进 exports。

> 手写 exports 与产物不一致是库发布的头号事故源，`exports: true` 把它变成构建产物的一部分。

## 三、发布质检：publint + attw + --unused

```bash
npm i -D publint @arethetypeswrong/core   # 可选依赖，用才装
```

```ts
export default defineConfig({
  publint: true, // 校验 package.json 与产物一致性，可 { level: 'error' }
  attw: {        // Are The Types Wrong：类型在各解析模式下是否正确
    profile: "node16",  // strict(默认) | node16 | esm-only
    level: "error",
    ignoreRules: ["false-cjs"],
  },
});
```

- CLI 等价：`tsdown --publint --attw`；
- 两者均支持 **`'ci-only'`**：本地构建跳过、CI 里强制——质检不拖慢日常迭代；
- **`tsdown --unused`**：检查 package.json 里声明却没用到的依赖，配合 deps 策略清理依赖表；
- 没有 package.json 时校验会跳过并警告。

## 四、tsup 迁移完整实操

### 1. 跑迁移工具

```bash
git add -A && git commit -m "before migrate"  # 工具会改文件，先存档
npx tsdown-migrate --dry-run                  # 预览
npx tsdown-migrate                            # 执行：改 import/重命名选项/装依赖
npx tsdown-migrate packages/*                 # monorepo 批量
```

### 2. 人工核对清单

```ts
// tsup（旧）
import { defineConfig } from "tsup";
export default defineConfig({
  entryPoints: ["src/index.ts"], // → entry
  format: ["cjs", "esm"],
  cjsInterop: true,              // → cjsDefault
  esbuildPlugins: [myPlugin()],  // → plugins + 换 Rolldown/unplugin 实现
  external: ["vue"],             // → deps.neverBundle
  bundle: false,                 // → unbundle: true
});
```

- **默认值翻转**：不写 format 时产物从 cjs 变 **esm**；clean 从关变**开**（残留文件会被清掉）；
- **dts 自动开**：package.json 有 `types` 字段时无需再写 `dts: true`；
- **不支持项**：`splitting: false`（分割恒开）、`metafile`（改 `devtools: true`）、`swc`、`experimentalDts`、`legacyOutput`；
- **IIFE 命名**：`[name].global.js` → `[name].iife.js`，要保持旧名用 `outputOptions: { entryFileNames: "[name].global.js" }`。

### 3. 插件迁移

tsdown 支持 **Rolldown / Rollup / unplugin 插件与部分 Vite 插件**，不支持 esbuild 插件：

```ts
// Before: import macros from "unplugin-macros/esbuild"
import macros from "unplugin-macros/rolldown"; // 改子路径即可

export default defineConfig({ plugins: [macros()] });
```

实验性 `--from-vite`：复用 vite.config 的 `resolve`/`plugins` 等部分选项，库与站点共配置时可试（注意只支持子集）。

## 五、CI 与 monorepo

```bash
tsdown --workspace                 # 构建工作区全部包
tsdown --workspace --filter ui     # 只构建匹配包
```

- workspace 模式内置（tsup 时代需 turbo/lerna 编排），各包仍用自己的 `tsdown.config.ts`；
- CI 套路：`tsdown && tsc --noEmit`——tsdown 管产物，tsc 管类型把关（tsdown 与 tsup 一样**不做类型检查**）；
- publint/attw 设 `'ci-only'`，把发布质检固化进流水线。

---

进入[指南 · 专家](./expert)：hooks 体系、devExports 与 stub mode 之争、unbundle、shims/cjsDefault 互操作细节与 0.x 工程化注意。
