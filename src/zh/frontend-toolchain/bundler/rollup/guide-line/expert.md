---
layout: doc
outline: [2, 3]
---

# 指南 · 专家

> 版本基线 **rollup 4.61.x**。本篇覆盖插件钩子体系、编程式 JavaScript API、Rollup 4 内部变化、疑难排错与 2026 生态格局。

## 一、插件钩子体系

插件 = `{ name, ...钩子 }` 的对象，由工厂函数返回。钩子分两大阶段：

| 阶段 | 何时运行 | 核心钩子（按序） |
|---|---|---|
| **Build** | `rollup.rollup()` 构建模块图，**整次构建一轮** | `options → buildStart → resolveId → load → transform → moduleParsed → buildEnd` |
| **Output** | `generate()/write()`，**每份输出各一轮** | `outputOptions → renderStart → renderChunk → generateBundle → writeBundle → closeBundle` |

执行方式三类（理解插件「为什么没被调到」的钥匙）：

- **first**：依次询问，**谁先返回非 null/undefined 谁赢**，后续跳过（`resolveId`、`load`）；
- **sequential**：串行依次执行、结果级联（`transform`）；
- **parallel**：并发执行互不等待（`buildStart`、`writeBundle`）。

钩子可写成 `{ order: 'pre' | 'post', handler }` 调整相对次序。

## 二、写一个插件：虚拟模块

```js
export default function virtualEnv() {
  const VIRTUAL_ID = "\0virtual:env"; // \0 前缀：官方虚拟模块约定
  return {
    name: "virtual-env",
    resolveId(source) {
      if (source === "virtual:env") return VIRTUAL_ID; // 认领该导入
      return null; // 礼让：交给其他插件或默认解析
    },
    load(id) {
      if (id === VIRTUAL_ID)
        return `export const mode = ${JSON.stringify(process.env.NODE_ENV)};`;
    },
  };
}
```

- **`\0` 前缀**告诉其他插件（如 node-resolve）「这是虚拟 id，别当文件路径处理」；
- 上下文工具：`this.resolve()`（走完整解析管线）、`this.emitFile()`（产出 chunk/asset）、`this.parse()`（用 Rollup 内置 SWC 解析器产 ESTree AST）、`this.warn()/this.error()`、`this.addWatchFile()`。

## 三、JavaScript API

```js
import { rollup, watch } from "rollup";

const bundle = await rollup(inputOptions); // 建模块图 + tree-shake，不产出
const { output } = await bundle.generate(esmOutput); // 内存产出（可多次、可换配置）
await bundle.write(cjsOutput); // 写盘
await bundle.close(); // 必须：让插件清理外部进程/服务
```

watch API 的资源纪律是高频坑：

```js
const watcher = watch(config);
watcher.on("event", (event) => {
  // START / BUNDLE_START / BUNDLE_END / END / ERROR
  if (event.result) event.result.close(); // 带 result 的事件必须 close，否则逐轮泄漏
});
// 结束时
await watcher.close();
```

两个配套工具：

- **`loadConfigFile`**：编程式加载 `rollup.config.mjs` 并复用 CLI 的参数覆盖逻辑——自建构建脚本时不必重新发明配置解析；
- **`@rollup/browser`**：浏览器内跑 Rollup（WASM 版），没有文件系统，**必须用插件通过 `resolveId`/`load` 提供全部模块内容**（在线 REPL/playground 的实现方式）。

## 四、Rollup 4 内部变化（迁移要点）

- **解析器换成基于 SWC 的 Rust 原生实现**：按平台以 optionalDependencies 分发原生二进制；不支持的平台用 **`@rollup/wasm-node`** 回退，浏览器版 `@rollup/browser` 走 WASM；
- **`acorn`/`acornInjectPlugins` 选项移除**（不能再注入 acorn 插件），后续基于 SWC 提供了内置 `jsx` 选项；另暴露 `rollup/parseAst`；
- **hash 从 base16 改为 URL 安全 base64**，最长 21 字符；
- `this.resolve()` 默认 `skipSelf: true`；es/cjs 产物自动保留入口 shebang；Node ≥ 18。

> 注意边界：原生化集中在解析等热点环节，**打包主逻辑仍是 JavaScript**——这正是 Rolldown 全量 Rust 重写的动机。

## 五、疑难排错

| 症状 | 根因与处理 |
|---|---|
| 产物含 `eval` 被警告 | scope hoisting 共享作用域下，eval 阻碍 minifier 改名、还能窥探其他模块变量；改**间接 eval**（`const eval2 = eval`）或 `new Function`（均在全局作用域求值） |
| `'this' has been rewritten to 'undefined'` | ESM 顶层 `this` 规范上就是 undefined；老 UMD 代码/TS 辅助产物常触发；用 `context`/`moduleContext` 调整或交给 commonjs 插件 |
| `Circular dependency` 警告 | 无循环时 Rollup 保证「被依赖者先执行」；有循环则初始化顺序可能不符预期（TDZ/undefined），根治靠抽公共依赖打破环 |
| polyfill 没生效在依赖之前 | external 依赖执行时机不受 Rollup 控制：无 external 需要时把 polyfill 放**每个静态入口第一条语句**；否则独立成 entry/manualChunks 由宿主先加载 |
| `"X" is not exported by Y` | CJS 依赖的具名导出探测失败，检查 commonjs 插件配置与依赖发布形态 |

## 六、2026 生态格局：Rollup 与 Rolldown

- **Rolldown**：VoidZero 主导、**Rust 编写**，提供 **Rollup 兼容 API 与插件接口**，官网自述「the unified bundler powering **Vite 8+**」——已发 **1.x**，统一了 Vite 此前「开发 esbuild + 生产 Rollup」的双引擎架构，配套 Oxc 解析/转换体系；
- **Rollup 本体**：**4.x 持续维护发版**（4.61.x），官方文档无废弃声明；海量库构建链、独立打包场景仍在其上；
- **怎么选**：新项目跟 Vite 8 走天然就是 Rolldown；存量库构建链、需要成熟插件细节兼容时 Rollup 依旧稳妥——插件 API 兼容意味着两者间迁移成本是所有打包器里最低的。

Rollup 的历史地位不止于工具本身：它把 **ESM 优先 + tree-shaking + 简洁插件 API** 变成了行业共识，Vite 与 Rolldown 都是这套设计的直接继承者。
