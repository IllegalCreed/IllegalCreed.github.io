---
layout: doc
outline: [2, 3]
---

# 指南 · 进阶

> 版本基线 **tsup 8.5.1**。dts 机制与边界、双格式库发布全流程（package.json exports 写法）、splitting 与 treeshake、minify 与 sourcemap、onSuccess 进阶。

## 一、dts 深入：一条独立的慢速管线

`--dts` 的实现是「**真 TypeScript 编译器 + rollup-plugin-dts**」：TS 编译器提供类型信息，rollup-plugin-dts 在 Rollup 管线里把声明**打包**成每入口、每格式各一份。esbuild 在这条链路上完全不出场——它没有生成声明的能力。这也是 `rollup` 是 tsup **直接依赖**、`typescript` 是 **peer 依赖**（>=4.5）的原因。

| 标志                 | 作用                                              |
| -------------------- | ------------------------------------------------- |
| `--dts`              | 生成并打包声明；多格式各一份                      |
| `--dts-only`         | 只产声明不产 JS                                   |
| `--dts-resolve`      | 实验性：解析并内联 node_modules 里的外部类型      |
| `--experimental-dts` | 8.0+，基于 @microsoft/api-extractor（peer 自装）  |

要点四条：

- **为什么每格式一份**：官方原文「This is required for consumers to get accurate type checking with TypeScript.」——Node16/NodeNext 解析下，import/require 分支各自解析到的声明必须与产物模块语义匹配（`.d.mts` 配 `.mjs`、`.d.cts` 配 `.cjs`），否则 attw 会报「Masquerading as ESM/CJS」类错配；
- **`--dts` 不解析外部类型**：声明里引用了 node_modules 的类型且想内联（典型：纯类型 devDependency，内联后使用方无需安装也有完整类型），用 `--dts-resolve`；
- **declaration map 生成不了**（issue #564）：要 `.d.ts.map` 的「点击类型跳到 .ts 源码」体验（主要服务 monorepo），构建后另跑 `tsc --emitDeclarationOnly --declaration`，官方点名可挂进 `onSuccess`；注意它**不该发布进 npm 包**；
- **慢与吃内存是机制性的**：真 TS 编译器全量分析 + Rollup 打包，与 JS 链路的 esbuild 差一个量级；且 `--dts` 构建**不支持 source map**。

> 发布前校验声明产物：`npx @arethetypeswrong/cli --pack .`——官方也提醒非 tsc 生成的声明不保证无错。

## 二、双格式库发布全流程

### 1. 构建配置

```ts
// tsup.config.ts
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"], // 双格式
  dts: true,              // 每格式各一份声明
  sourcemap: true,
  clean: true,            // 默认 false，发布构建务必打开
});
```

### 2. package.json（无 `type: "module"`，cjs 占裸 `.js`）

```jsonc
{
  "name": "my-lib",
  "main": "./dist/index.js",    // cjs 入口（旧解析）
  "module": "./dist/index.mjs", // 打包器识别的 esm 字段
  "types": "./dist/index.d.ts", // 旧解析的类型兜底
  "exports": {
    ".": {
      "import": { "types": "./dist/index.d.mts", "default": "./dist/index.mjs" },
      "require": { "types": "./dist/index.d.ts", "default": "./dist/index.js" }
    }
  },
  "files": ["dist"]
}
```

- **types 必须分支内对应**：import 分支配 `.d.mts`、require 分支配 `.d.ts`，与 tsup 产物一一对应——错配正是 attw 检出的头号问题；
- 设了 `"type": "module"` 则全部翻转：esm 是 `./dist/index.js` + `.d.ts`，cjs 是 `./dist/index.cjs` + `.d.cts`；
- tsup **没有内置** exports 生成与 publint/attw 集成（tsdown 已内置），这两步要自己挂进发布流程。

### 3. 互操作开关

- **`cjsInterop: true`**：模块**只有 default 导出且无具名导出**时，CJS 产物从 `module.exports.default = x` 改写为 `module.exports = x`——使用方 `require("my-lib")` 直接拿到本体，不用再 `.default`；
- **`shims: true`**：cjs 产物里垫 `import.meta.url`（基于 `__filename` 的等价表达式），esm 产物里垫 `__dirname`（基于 `fileURLToPath(import.meta.url)`）——一份源码无痛产双格式；esm 侧注入仅 `platform: 'node'` 时生效。

## 三、splitting 与 treeshake

- **代码分割**：官方原文「currently only works with the `esm` output format, and it's enabled by default」——**仅 esm、默认开**（继承 esbuild 限制）；多入口共享代码会拆 chunk，要单文件产物用 `--no-splitting` 关闭；给 **cjs** 分割是实验性 `--splitting`（tsup 绕过 esbuild 限制的扩展）；
- **`--treeshake`**：esbuild 默认就摇树，但「sometimes it's not working very well」（官方援引 esbuild #1794、#1435）——该标志**改用 Rollup** 在 esbuild 产物之上再摇一遍；选项类型与 Rollup 的 `treeshake` 相同（可传 `true` 或细粒度对象）；与 `--minify` 不互斥，常见组合正是摇完再压。

## 四、minify 与 sourcemap

- `--minify` 默认用 **esbuild** 压缩（极快，库场景通常够用）；`--minify terser` 切 Terser（压缩率略优但慢得多）——**terser 不是 tsup 的依赖，必须自装**；配置里可传 `terserOptions` 原样透传给 `terser.minify`；
- `--sourcemap` 为每个入口产 `.js.map`；`--sourcemap inline` 把 map 内联进产物，官方明确**仅限开发场景**（如浏览器扩展无法访问独立 .map 文件时），生产不推荐；
- 再次强调：`--dts` 构建不支持 source map；declaration map 是另一回事（见上文第一节）。

## 五、CSS 与资源文件（实验性）

```ts
export default defineConfig({
  entry: ["src/index.ts"],
  injectStyle: true, // 把 import 的 CSS 打进 JS 产物、运行时注入，而非单独出 .css
  loader: {
    ".jpg": "base64", // 资源文件需显式指定 esbuild loader
    ".webp": "file",
  },
});
```

- **CSS 支持是实验性的**：基于 esbuild 的实验性 CSS 能力；要叠 PostCSS 插件需**自装 postcss**（配置经 postcss-load-config 读取）；Sass/Less 未内置；
- **任意资源不开箱即用**：图片/字体等必须用 `loader`（CLI 写 `--loader ".jpg=base64"`）显式指定处理方式，没有泛化的资源管线；
- 组件库的复杂样式链路（预处理器、CSS Modules、抽取拆分）超出 tsup 舒适区——这类需求考虑 Vite 库模式或 unbuild 的 mkdist。

## 六、watch 与 onSuccess 进阶

```ts
export default defineConfig({
  // 函数形式只能写在配置文件里（CLI 只接受字符串命令）
  onSuccess: async () => {
    const server = await startDevServer(); // 每次构建成功后启动服务
    return async () => {
      await server.close(); // 返回清理函数：下一次重建前先执行
    };
  },
});
```

- CLI 形式：`--onSuccess "node dist/index.js"`（字符串命令）；**函数 + 清理函数**的写法专治 watch 模式下的常驻服务重启；
- watch 默认忽略 `dist`、`node_modules`、`.git`；`--ignore-watch folder1 --ignore-watch folder2` 可重复追加；
- 两条典型流水线：`tsup --watch --onSuccess "node dist/server.js"`（重建即重启）；`onSuccess: "tsc --emitDeclarationOnly --declaration"`（补 declaration map）。

---

进入[指南 · 专家](./expert)：混合引擎全景、装饰器与 SWC、tsup-node、扩展名逃生门与 2026 选型决策。
