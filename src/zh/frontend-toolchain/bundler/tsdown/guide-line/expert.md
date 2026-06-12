---
layout: doc
outline: [2, 3]
---

# 指南 · 专家

> hooks 体系、devExports 与 stub mode 的设计之争、unbundle 模式、shims/cjsDefault 互操作细节、0.x 工程化注意。版本基线 **tsdown 0.22.x**（2026-06，未到 1.0）。

## 一、hooks：受 unbuild 启发的构建生命周期

tsdown 的 hooks 基于 **hookable**（unjs），官方明言「inspired by unbuild」。共三个钩子：

| 钩子            | 时机                                          | 典型用途               |
| --------------- | --------------------------------------------- | ---------------------- |
| `build:prepare` | 每次构建开始前                                | 清理、生成版本文件     |
| `build:before`  | 每个 Rolldown 构建前（**多格式时按格式触发**）| 按格式微调上下文       |
| `build:done`    | 每次构建完成后                                | 拷贝产物、通知、后处理 |

```ts
export default defineConfig({
  hooks: {
    "build:done": async (ctx) => { /* 后处理 */ },
  },
  // 或函数式批量注册：
  // hooks(h) { h.hook("build:prepare", () => {}) },
});
```

> 注意与**插件钩子**区分：Rollup/Rolldown 插件的 `buildStart`/`transform` 作用于模块粒度；tsdown hooks 是**构建任务级**生命周期，二者互补。

## 二、devExports 与 stub mode：两种「开发期直连源码」哲学

monorepo 里包 A 改一行、包 B 要立刻感知，unbuild 的答案是 **stub mode**（产物变成转发源码的占位文件）。tsdown **有意（deliberately）不支持** stub：

- stub 文件在**导出列表变化时必须手动重建**，容易陈旧失真；
- stub 转发**绕过了插件管线**——经插件转换的代码在 stub 路径上行为不一致。

tsdown 的替代方案：

1. **watch 模式**：`tsdown -w`，真实构建、永远新鲜；
2. **`exports.devExports`**：开发期 exports 直指源码——

```ts
export default defineConfig({
  exports: { devExports: true }, // 或 "@my-org/source"（仅指定 condition 生效）
});
```

机制：package.json 顶层 `exports` 指向 `src/`，**生产映射移入 `publishConfig`**，yarn/pnpm 发布时用 publishConfig 覆盖顶层字段。**坑**：npm 的 publishConfig 不支持替换 exports——**npm 发布流程不要用 devExports**。

## 三、unbundle 模式：逐文件输出

```ts
export default defineConfig({
  entry: ["src/**/*.ts"],
  unbundle: true,                          // 替代 tsup 的 bundle: false
  outExtensions: () => ({ js: ".js" }),    // 想要 .js 而非默认 .mjs
});
```

- 产物**镜像源码目录结构**（每个模块一个文件），保留文件粒度，便于消费方按需引入与断点调试；
- 与 stub 本质不同：unbundle 输出**真实编译产物**，插件/转换全部生效；
- 适合组件库这类「希望 `dist/components/button.js` 可单独 import」的场景。

## 四、互操作细节：cjsDefault 与 shims

**cjsDefault（默认开启）**：模块**只有单一 `export default`** 且目标 CJS 时——JS 产物转 `module.exports = ...`，声明转 `export = ...`。效果：`require("pkg")` 直接拿到导出本体，不必 `.default`。对应 tsup 的 `cjsInterop`。

**shims 的三个方向，开关策略各不同**：

| 方向                                       | 行为                                        |
| ------------------------------------------ | ------------------------------------------- |
| CJS 产物里的 `import.meta.url/dirname/filename` | **始终自动 shim**，无需配置             |
| ESM 产物里的 `__dirname`/`__filename`      | 需显式 `shims: true`（未用到的会被摇掉）    |
| Node 平台 ESM 里的 `require`               | **总是注入**（`createRequire`），与 shims 无关 |

> 记忆法：「**进 CJS 总是补，回 ESM 要手开，require 永远有**」。

## 五、0.x 工程化注意

- **semver 现实**：0.22.x 未到 1.0，**minor 也可能破坏**——lockfile 锁版本，升级前读 [Releases](https://github.com/rolldown/tsdown/releases)，CI 里跑 publint/attw 兜底产物回归；
- **运行环境**：跑 tsdown 需 Node.js **22.18.0+**（产物 target 可更低，二者别混淆）；
- **minify 谨慎**：基于 Oxc minifier（官方标注仍较早期），开 `--minify` 后做产物 diff/E2E 验证；
- **生态位判断**：tsdown 是 Rolldown 官方项目、Rolldown-Vite Library Mode 的基础，VoidZero 体系内多包已迁移——押注方向上比继续留在 tsup（esbuild 系，维护趋缓）更顺生态主线；
- **何时不用 tsdown**：应用打包（用 Vite/Rolldown 本体）、需要 esbuild 插件且无替代、强依赖 stub mode 的工作流。

## 六、与 tsup / unbuild 终局对比

| 维度       | tsdown                     | tsup            | unbuild              |
| ---------- | -------------------------- | --------------- | -------------------- |
| 引擎       | Rolldown（Rust）           | esbuild（Go）   | Rollup（JS）+ mkdist |
| dts        | oxc 极速 / tsc 回退        | rollup-dts，偏慢 | tsc 体系            |
| 默认格式   | **esm**                    | cjs             | esm                  |
| exports 生成 | **内置**（exports: true） | 无              | 无（靠约定）         |
| 发布校验   | **publint + attw 内置集成**| 无              | 无                   |
| monorepo   | **--workspace 内置**       | 外部编排        | 外部编排             |
| 开发直连   | watch / devExports         | watch           | **stub mode**        |
| hooks      | 有（unbuild 启发）         | 无统一体系      | 有（鼻祖）           |

---

至此 tsdown 三篇指南完结。回到[入门](../getting-started)温习默认值，或到[参考](../reference)查迁移映射表。
