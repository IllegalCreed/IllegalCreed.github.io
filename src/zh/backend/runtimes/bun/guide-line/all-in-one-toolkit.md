---
layout: doc
outline: [2, 3]
---

# 全能工具链：运行时、打包、测试与包管理

> 基于 Bun（JavaScriptCore + Zig）· 核于 2026-08

## 速查

- **四合一**：Bun 把运行时（bun run）、打包器（bun build）、测试器（bun test）、包管理器（bun install/add）整合进单一二进制，替代 Node 生态的 node+ts-node+webpack+jest+npm 五件套。
- **运行时（bun run）**：执行 JS/TS，内置 TS/JSX 编译，无需 tsconfig。`bun run app.ts` 直接跑。`bun --hot app.ts` 热重载（保留部分状态，比 nodemon 快）。
- **打包器（bun build）**：内置打包，API 与 esbuild 兼容（`bun build ./index.ts --outdir ./dist`），支持 tree-shaking、sourcemap、多种格式（ESM/CJS/iife），无需 webpack/vite 配置。
- **测试器（bun test）**：兼容 Jest API（describe/it/expect/mock），自动发现 `*.test.ts`，比 Jest 快数倍（共享同一个 bun 进程，无子进程开销），内置快照、覆盖率。
- **包管理器（bun install）**：并行下载 + 全局缓存 + 精简元数据，比 npm 快数倍到数十倍。`bun add pkg` 增依赖，`bun install` 装全部，生成 bun.lock。
- **脚本运行（bun run）**：跑 package.json 的 scripts（`bun run start`），比 `npm run` 快（无 npm 启动开销）。
- **bunx**：执行本地或远程的 bin（类似 npx），`bunx prettier` 或 `bunx tsx`。
- **零配置理念**：Bun 的设计哲学是「开箱即用」——TS、JSX、打包、测试都无需配置文件，减少 Node 生态的「配置地狱」。

## 一、运行时：bun run

Bun 的运行时是其核心，执行 JS/TS：

```bash
bun run app.ts              # 运行 TS（内置编译，无需 ts-node）
bun app.ts                  # run 可省略
bun --hot app.ts            # 热重载（保留部分状态，开发期用）
bun run --watch app.ts      # 文件变化重启（类似 nodemon）
bun run dev                 # 跑 package.json 的 scripts.dev
```

- **原生 TS**：Bun 内置 TS 编译器（转译器），`bun run app.ts` 自动转译执行，无需 tsconfig/ts-node/tsx。支持所有 TS 语法（enum/decorator/参数属性），与 Deno 类似（完整编译），比 Node 22.18+ 的「只剥离」更全。
- **热重载（--hot）**：与 nodemon 的「重启进程」不同，Bun 的 --hot 尝试保留部分运行时状态（如已建立的连接），重载更快。注意它不是完整 HMR，复杂状态仍可能丢失。
- **顶层 await**：Bun 在 `.ts`/`.js`（ESM）里支持顶层 await，无需 async 包裹。
- **快启动**：因 JavaScriptCore 启动快 + Zig 核心，bun run 的进程启动比 node 快数倍，对 CLI 工具、脚本、CI 流水线尤其明显。

## 二、打包器：bun build

Bun 内置打包器，API 与 esbuild 兼容，可替代 webpack/esbuild/vite（在库/应用打包场景）：

```bash
# 基本打包
bun build ./src/index.ts --outdir ./dist --target=node

# 打包成单文件（bundle 所有依赖）
bun build ./src/cli.ts --outfile ./cli --target=bun

# 监听模式（开发期）
bun build ./src/index.ts --outdir ./dist --watch
```

- **esbuild 兼容**：`bun build` 的 flags 与 esbuild 接近（--outdir/--outfile/--target/--format），从 esbuild 迁移成本低。
- **极快**：用 Zig 实现，打包速度与 esbuild 同级（比 webpack 快一两个数量级）。
- **支持能力**：tree-shaking（摇树删死代码）、sourcemap、多种输出格式（ESM/CJS/iife）、代码分割、自动 JSX。
- **适用场景**：库打包、CLI 打包、应用构建。对需要复杂插件链（如 Vue SFC、特殊 loader）的场景，webpack/vite 生态仍更丰富。

## 三、测试器：bun test

Bun 内置测试器，兼容 Jest API，开箱即用：

```ts
// math.test.ts
import { expect, test, describe } from 'bun:test';
import { add } from './math';

describe('加法', () => {
  test('正数', () => {
    expect(add(1, 2)).toBe(3);
  });
  test('负数', () => {
    expect(add(-1, -2)).toBe(-3);
  });
});
```

```bash
bun test                 # 跑所有 *.test.ts
bun test math            # 只跑匹配 math 的测试
bun test --coverage      # 生成覆盖率
bun test --watch         # 监听变化重跑
```

- **兼容 Jest**：`describe/it/test/expect/beforeEach/mock` 与 Jest API 基本一致，Jest 测试文件大多可直接用 bun test 跑。
- **极快**：所有测试在同一个 bun 进程里跑（无 Jest 那样每个测试文件起子进程/worker 的开销），比 Jest 快数倍。
- **内置能力**：快照测试（snapshot）、mock、覆盖率（--coverage）、watch 模式。
- **与 Vitest 对比**：Vitest 也快，但需配置 Vite；Bun 零配置开箱即用。

## 四、包管理器：bun install

Bun 的包管理器是其性能优势最直观的体现：

```bash
bun install              # 装全部依赖（读 package.json）
bun add express          # 加生产依赖
bun add -d typescript    # 加开发依赖
bun remove lodash        # 删依赖
bun update               # 升级依赖
```

- **极快**：并行下载所有依赖（非 npm 的串行）+ 全局缓存（多项目共享，二次秒装）+ 用 Zig 写的精简元数据解析。大型项目 install 从分钟级降到秒级。
- **bun.lock**：生成文本格式的锁文件（易读、易合并、易 review），替代 package-lock.json/yarn.lock。提交版本控制保证可复现。
- **workspace 支持**：支持 monorepo 的 workspaces（package.json 的 workspaces 字段），与 pnpm/yarn workspace 体验一致。
- **Node 兼容**：读取标准 package.json，生成标准 node_modules，与 npm 装的结果互通——可无缝与 npm/yarn/pnpm 切换（删 lock 文件即可）。

## 五、bunx 与脚本运行

- **bunx**：执行本地或远程 bin（类似 npx），但快得多（无 npx 的解析开销）。`bunx prettier` 跑本地装的 prettier，`bunx create-vite` 跑远程包。
- **bun run**：跑 package.json 的 scripts。`bun run start` 等价 `npm run start` 但更快（无 npm 启动开销）。`bun run` 不带参数会列出所有可用 scripts。
- **bun create**：用模板初始化项目（`bun create react myapp`），类似 create-react-app/vite create，但快。

## 交互演示

本叶无专门可视化。建议实操：新建空目录，跑 `bun init` 初始化项目，写一个 `app.ts`（用 `Bun.serve` 起 HTTP），用 `bun run app.ts` 启动，用 `bun test` 跑测试，对比等价 Node 项目的命令数量与速度差异。

## 下一步

工具链讲完后，下一站进入[性能与兼容](./performance-and-compat)——Zig + JavaScriptCore 的性能原理、HTTP 约 4x 的实现、Node 兼容层机制（约 95% 兼容的边界）、bun.lock 包管理的细节。
