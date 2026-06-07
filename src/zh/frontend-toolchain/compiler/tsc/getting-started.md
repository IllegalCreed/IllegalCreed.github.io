---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 **TypeScript 6.0.x**（npm `typescript` 的 `latest`）。TS 6.0 是**最后一个 JavaScript 实现版本**，已把 `strict` 设为默认、弃用 `es5`、移除 `amd`/`umd`/`systemjs`；Go 原生重写的 **TS 7.0「tsgo」** 仍在预览（见[专家篇](./guide-line/expert)）。涉及 5.x → 6.0 差异处均显式标注。

## 速查

- 安装：`npm install -D typescript`（提供 `tsc` 命令）；运行时类型按需 `npm i -D @types/node`
- 初始化：`npx tsc --init`（生成带注释的 `tsconfig.json`）
- 配置文件：`tsconfig.json`（项目根；`tsc` 无输入文件时从当前目录向上查找）
- 编译并产出：`tsc`（按 `outDir` 输出 `.js`）｜ 监听：`tsc -w`
- **只检查不产出**：`tsc --noEmit`（把 emit 交给 SWC/esbuild 时常用）
- 工程引用 / 增量构建：`tsc -b`（需 `composite: true`，产物记录在 `.tsbuildinfo`）
- 核心认知：**tsc 同时做「类型检查」+「emit JS」**，是唯一做完整类型检查的工具
- ⚠️ **TS 6.0 起 `strict` 默认 `true`**；`target` 最低 `es2015`（`es5` 已弃用）
- ⚠️ 命令行**指定了输入文件就会忽略 `tsconfig.json`**：`tsc a.ts` 用默认选项编译，不读配置

## 一、tsc 是什么

tsc 是 TypeScript 的官方编译器，干两件事：

1. **类型检查**：依据类型标注与推断，找出类型错误（传错参数、访问不存在的属性、可能为 `null` 等）。
2. **emit（产出）**：把 TS 语法（类型标注、`enum`、装饰器、JSX……）转换并**降级**成目标 ECMAScript 版本的 `.js`，可选地产出 `.d.ts` 声明与 source map。

> 关键区别：**只有 tsc 做类型检查**。Babel、SWC、esbuild、Oxc 都只是「逐文件剥掉类型再转译」，语法对就放行——类型错了它们照样产出。所以工程里常见组合是 **「快转译器负责 emit + `tsc --noEmit` 负责把关类型」**。

## 二、为什么需要 tsc

直接写 `.ts` 浏览器和 Node 都不认（运行时不理解类型标注、旧环境不支持新语法）。需要一个工具：

- 把类型信息**校验后抹去**，保证类型安全；
- 把新语法**降级**到目标环境能跑的 JS；
- 为库**产出 `.d.ts`**，让使用方获得类型提示。

tsc 把这三件事统一在一份 `tsconfig.json` 下完成，且它的类型语义就是 TypeScript 语言本身的定义——这是任何第三方转译器替代不了的。

## 三、安装与第一次编译

```bash
mkdir my-ts && cd my-ts
npm init -y
npm install -D typescript
npx tsc --init        # 生成 tsconfig.json
```

新建 `src/index.ts`：

```ts
const greet = (name: string): string => `Hello, ${name}`;
console.log(greet("TypeScript"));
```

最小可用 `tsconfig.json`：

```jsonc
{
  "compilerOptions": {
    "target": "es2022",          // 降级目标
    "module": "nodenext",        // 模块格式（按 Node 解析）
    "outDir": "./dist",          // 产物目录
    "rootDir": "./src",          // 源码根
    "strict": true,              // 一组严格检查（TS 6.0 起默认）
    "declaration": true,         // 顺带产出 .d.ts
    "sourceMap": true
  },
  "include": ["src"]
}
```

```bash
npx tsc            # 读 tsconfig → 检查 + 输出到 dist/
node dist/index.js # Hello, TypeScript
```

## 四、tsconfig.json 核心

> 官方定义：「The presence of a `tsconfig.json` file in a directory indicates that the directory is the root of a TypeScript project.」

`tsc` 无输入文件时，会**从当前目录向上查找** `tsconfig.json`；也可 `tsc -p ./path` 指定。最常用的几组选项：

| 选项 | 作用 | 常用值 |
|---|---|---|
| `target` | 降级到哪个 ES 版本 | `es2022` / `esnext`（**TS 6.0 起不再支持 `es5`**） |
| `module` | 输出哪种模块格式 | `nodenext` / `esnext` / `commonjs` |
| `moduleResolution` | 如何解析 `import` 路径 | `bundler`（配打包器）/ `nodenext` |
| `strict` | 启用全部严格检查 | `true`（**6.0 默认**） |
| `outDir` / `rootDir` | 产物目录 / 源码根 | `./dist` / `./src` |
| `noEmit` | 只检查不产出 | `true`（emit 交给别的工具时） |
| `declaration` | 产出 `.d.ts` | 库项目设 `true` |
| `lib` | 内置类型环境 | `["es2022", "dom"]` |
| `jsx` | JSX 处理方式 | `react-jsx` / `preserve` |
| `esModuleInterop` | 改善 CJS/ESM 互操作 | `true` |
| `skipLibCheck` | 跳过 `.d.ts` 的类型检查（提速） | `true` |

文件范围三选一：

```jsonc
{
  "files": ["src/main.ts"],        // 精确列举
  "include": ["src/**/*"],         // glob（推荐）
  "exclude": ["**/*.test.ts"],     // 从 include 里排除
  "extends": "@tsconfig/node22/tsconfig.json"  // 继承基础配置
}
```

> ⚠️ **`include`/`exclude` 只在「不指定输入文件」时生效**。一旦 `tsc foo.ts` 显式传文件，整个 `tsconfig.json` 都被忽略。

## 五、CLI 与常用 flag

```bash
tsc                      # 读 tsconfig，检查 + emit
tsc --noEmit             # 只类型检查（CI 把关、或 emit 另交他人）
tsc -w / --watch         # 监听变更增量编译
tsc -p tsconfig.build.json   # 指定配置文件
tsc -b / --build         # 工程引用构建（需 composite）
tsc --init               # 生成 tsconfig.json
tsc src/a.ts --outDir dist   # 直接编译指定文件（⚠️ 会忽略 tsconfig）
```

常配进 `package.json`：

```jsonc
{
  "scripts": {
    "build": "tsc",
    "typecheck": "tsc --noEmit",
    "dev": "tsc -w"
  }
}
```

## 六、TypeScript 6.0 关键变化速览

TS 6.0 是 JS 实现的收官版、向 Go 原生版（7.0）过渡的桥梁，默认值与可用选项有重要变化（详见[专家篇](./guide-line/expert)）：

- **`strict` 默认 `true`**：没显式设过 `strict` 的项目，升级后自动开启 `strictNullChecks` 等全套严格检查——最易「升级即报错」的一项。
- **`target: es5` 弃用**：最低目标提升到 `es2015`；仍需 ES5 产物得交给外部转译器（Babel/SWC）。
- **移除旧模块格式**：`module` 的 `amd` / `umd` / `systemjs` / `none` 被移除。
- **ES2025 类型支持**：Temporal、`Map.getOrInsert`、`RegExp.escape`、`#` 子路径导入等。
- **逃生舱**：`"ignoreDeprecations": "6.0"` 可临时压制「弃用选项」报错——**TS 7.0 会彻底移除该逃生舱**，只是缓冲不是长久之计。

---

掌握基本编译后，进入 [指南 · 基础](./guide-line/base)：`target` / `module` / `strict` 与产物形态的细节。
