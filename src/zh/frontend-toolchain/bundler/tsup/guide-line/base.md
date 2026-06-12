---
layout: doc
outline: [2, 3]
---

# 指南 · 基础

> 版本基线 **tsup 8.5.1**。本篇把「能构建」用到「懂构建」：构建管线、entry 写法、format 与扩展名两套规则、依赖外部化、target/platform 与 `--env`。

## 一、构建管线：esbuild 主链路

```text
读取配置（CLI / tsup.config.* / package.json tsup 字段）
  → 依赖分类（deps/peerDeps 外部化，其余打入）
  → esbuild 转译打包（每个 format 各跑一遍）
  → 可选：--treeshake（Rollup 摇树）→ --minify（esbuild 或 terser）
  → 可选：--dts（TS 编译器供类型 + rollup-plugin-dts 打包声明）
```

- JS 主链路全程 esbuild，秒级完成；**dts 是另一条慢速管线**（详见[进阶篇](./advanced)）；
- 配置加载基于 bundle-require，所以 `tsup.config.ts` 原生可用 TS 编写、无需预编译。

## 二、entry：显式传，键名即产物名

```ts
export default defineConfig({
  // 1. 数组（支持 glob）：产物名跟随源文件名 → dist/a.js
  entry: ["src/a.ts"],
  // 2. 对象命名入口：键名决定产物名 → dist/foo.js
  // entry: { foo: "src/a.ts" },
});
```

- CLI 等价：`tsup src/a.ts`（数组形式）｜`tsup --entry.foo src/a.ts`（命名入口）；
- **没有入口推断**：完全不传 entry 直接报 `No input files, try "tsup <your-file>" instead`；
- 多入口时每个入口各得一份产物（含各自的 `.d.ts` 与 source map），esm 下共享代码会拆 chunk。

## 三、format 与扩展名：两套规则

```bash
tsup src/index.ts --format esm,cjs,iife
```

| format | 无 `type` 字段      | `"type": "module"` |
| ------ | ------------------- | ------------------ |
| cjs    | **`index.js`**      | `index.cjs`        |
| esm    | `index.mjs`         | **`index.js`**     |
| iife   | `index.global.js`   | `index.global.js`  |

- 规则核心：**谁占裸 `.js` 由 package.json 的 `type` 决定**，另一方用 `.mjs`/`.cjs` 显式标记——保证每个产物在 Node 模块判定下语义正确（`type: module` 时 `.js` 按 ESM 解析，CJS 产物必须改名 `.cjs`）；
- iife 产物可用 `--global-name MyLib` 指定全局变量名；
- **不支持 umd**（esbuild 限制）；需要 UMD 的场景考虑 Rollup 或 tsdown（后者支持 umd）。

## 四、依赖外部化：库打包的关键默认值

| 依赖类型                            | 默认行为                                  |
| ----------------------------------- | ----------------------------------------- |
| `dependencies` / `peerDependencies` | **始终外部化**（不进 bundle，无开关可关） |
| `devDependencies`                   | **没有豁免**：被 import 就打入产物        |
| 幻影依赖（装了没声明）              | 被 import 就打入                          |

为什么合理：运行时依赖交给使用方安装，避免重复打包、保持可去重；这是库打包的默认语义。精细控制：

```ts
export default defineConfig({
  external: ["lodash", /^@aws-sdk\//], // 追加外部化（CLI: --external lodash）
  noExternal: ["@my-org/shared"],      // 强制打入（典型：monorepo 内部包）
  // skipNodeModulesBundle: true,      // 跳过打包所有 Node 包（即 tsup-node 的行为）
});
```

> 构建 Node 应用直接用 **`tsup-node`** 命令：自动跳过打包所有 node_modules 包，再用 `noExternal` 拉回需要内联的本地包（详见[专家篇](./expert)）。

## 五、target 与 platform

```ts
export default defineConfig({
  target: "es2020",   // 不写则：tsconfig compilerOptions.target → node14
  platform: "node",   // 默认 node（可选 browser / neutral）
});
```

- **target 解析顺序**：tsconfig 的 `compilerOptions.target` → 都没有则兜底 **`node14`**；支持 `es2020` 这类语言版本与 `node18`/`chrome100` 等环境版本；
- 特例 `--target es5`：esbuild 先转到 es2020，再交 **SWC** 降到 es5（esbuild 自己输出不了 es5）；
- target 只做语法降级，**不注入 polyfill**——缺 API 要自己解决；
- **platform 默认 `node`**：tsup 面向库/Node 场景，覆盖了 esbuild 自身的 browser 默认值。

## 六、--env：编译期替换的访问形式陷阱

```bash
tsup src/index.ts --env.NODE_ENV production
```

```ts
// ✓ 会被替换：全局形式访问
console.log(process.env.NODE_ENV);     // 编译后 → "production"
console.log(import.meta.env.NODE_ENV); // 编译后 → "production"

// ✗ 不会被替换：import 进来的 process 是普通模块绑定
import process from "node:process";
console.log(process.env.NODE_ENV);     // 保留为运行时读取
```

- `--env.X` 是 **esbuild define 的编译期替换**，只识别 `process.env.X` 与 `import.meta.env.X` 两种**全局形式**的访问；
- 官方原文告诫：「do not import `process` from `node:process`」——导入后的访问路径与 define 匹配不上，替换静默失效。

---

进入[指南 · 进阶](./advanced)：dts 机制与边界、双格式发布全流程（package.json exports 写法）、splitting/treeshake、minify/sourcemap 与 onSuccess 进阶。
