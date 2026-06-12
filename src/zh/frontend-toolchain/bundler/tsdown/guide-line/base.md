---
layout: doc
outline: [2, 3]
---

# 指南 · 基础

> 版本基线 **tsdown 0.22.x**。本篇把「能构建」用到「懂构建」：构建管线、entry 的四种写法、format 与扩展名、platform/target、依赖外部化策略。

## 一、构建管线：Rolldown + Oxc 各管什么

tsdown 一次构建大致经过：

```text
读取 package.json / tsconfig.json（推默认值）
  → 依赖分类（外部化 or 打入）
  → Rolldown 打包（tree-shaking 默认开）
  → 按 format 产出（esm/cjs/iife/umd）
  → dts 生成（oxc-transform 或 tsc 回退）
  → 可选：exports 回写 + publint/attw 校验
```

- **Rolldown**（Rust）：模块图、打包、分割、压缩入口——速度的主要来源。
- **Oxc**：`isolatedDeclarations` 下的 dts 极速路径（oxc-transform）、minify（Oxc minifier）。
- 默认值不是拍脑袋：**format 看场景（ESM 优先）、target 看 `engines.node`、dts 看 `types` 字段、依赖看 package.json 角色**——「配置即推断」。

## 二、entry 的四种写法

```ts
export default defineConfig({
  // 1. 字符串 / 数组
  entry: ["src/index.ts", "src/cli.ts"],
  // 2. 对象命名入口：key 决定输出名
  // entry: { main: "src/index.ts", utils: "src/utils.ts" },
  // 3. glob：负号排除
  // entry: ["src/**/*.ts", "!src/**/*.test.ts"],
  // 4. 对象 + 通配符：src/foo.ts → dist/lib/foo.js
  // entry: { "lib/*": "src/*.ts" },
});
```

- 不写 entry 且存在 **`src/index.ts`** → 自动作为入口（约定优于配置）。
- CLI 直接传文件：`tsdown src/a.ts src/b.ts`。
- 混用规则：数组里可同时放字符串/glob/对象，**输出名冲突时对象优先**；多个正向 glob 需共享同一基准目录。

## 三、format 与扩展名

```ts
export default defineConfig({ format: ["esm", "cjs"] });
```

| format | 适用                         | Node 平台默认产物 |
| ------ | ---------------------------- | ----------------- |
| `esm`  | 现代浏览器 + Node（**默认**）| `index.mjs`       |
| `cjs`  | 传统 Node / require 消费方   | `index.cjs`       |
| `iife` | `<script>` 直接引入          | `index.iife.js`   |
| `umd`  | AMD + CJS + 全局变量通吃     | `index.umd.js`    |

- `.mjs`/`.cjs` 固定扩展名从根上消除 package.json `type` 歧义；要改用 `outExtensions`（如 unbundle 场景想输出 `.js`）。
- 双格式一次构建完成；还可按格式写**差异化配置**（如不同 target）。

## 四、platform 与 target

```ts
export default defineConfig({
  platform: "neutral", // node（默认）| browser | neutral
  target: "es2022",    // 不写则自动读 engines.node
});
```

**platform** 决定运行时假设与模块解析（mainFields）：

- `node`（默认）：Node/Deno/Bun，内置模块（`fs`/`path`）直接外部化；mainFields `['main','module']`；
- `browser`：浏览器目标，用到 Node 内置模块会警告；mainFields `['browser','module','main']`；
- `neutral`：零运行时假设，纯靠 `exports` 解析——**双端通用库的推荐值**；
- 硬规则：**CJS 格式下 platform 恒为 `node`**，改不了。

**target** 只做**语法降级**（`a ||= b` → `a || (a = b)`），**不注入 polyfill**——旧环境缺 `Promise` 等 API 时 tsdown 不会帮你补（这点与 Babel preset-env 的 `useBuiltIns` 完全不同）。`target: false` 可全关降级与运行时 helper。

## 五、依赖外部化：库打包的关键默认值

tsdown 按 **package.json 角色**自动分类：

| 依赖类型                                   | 默认行为                     |
| ------------------------------------------ | ---------------------------- |
| `dependencies` / `peerDependencies` / `optionalDependencies` | **外部化**（不进 bundle）    |
| `devDependencies`                          | **被 import 才打入**         |
| 幻影依赖（装了没声明）                     | 被 import 才打入             |

为什么合理：运行时依赖交给使用方安装（避免重复打包、保持可去重）；构建期工具型依赖（devDeps）不随包发布，引用到就必须内联。

精细控制走 `deps`：

```ts
export default defineConfig({
  deps: {
    neverBundle: ["lodash", /^@my-scope\//], // 强制外部化
    alwaysBundle: ["tiny-helper"],            // 强制打入
    // onlyBundle: ["a"],   // 白名单：越界即报错
    // skipNodeModulesBundle: true, // node_modules 全外置（不可与 alwaysBundle 并用）
  },
});
```

> 旧的 `external`/`noExternal` 已映射为 `deps.neverBundle`/`deps.alwaysBundle`（暂可用，带废弃警告）。

## 六、clean 与 treeshake

- **clean 默认开**：每次构建先清空 outDir——tsup 迁来的项目注意，残留产物消失是预期行为；`clean: false` 关闭。
- **treeshake 默认开**：未被引用的导出直接剔除；调试需要全量保留时 `--no-treeshake`。
- tree-shaking 与 minify 是两个独立环节：前者删未用代码，后者（`--minify`，Oxc minifier）压缩剩余代码。

---

进入[指南 · 进阶](./advanced)：dts 双路径机制、exports 自动生成、publint/attw 质检与 tsup 迁移完整实操。
