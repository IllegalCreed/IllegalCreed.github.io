---
layout: doc
outline: [2, 3]
---

# 生态与回调：npm、异步演进、权限与 Worker Threads

> 基于 Node.js（V8 + Libuv）· 核于 2026-08

## 速查

- **npm 注册表**：全球最大的公共 JS 包仓库（npmjs.com，300 万+ 包）。`npm install` 把包下载到本地 `node_modules/`，依赖是**嵌套树**（npm v3+ 改为扁平化 + 提升 hoisting）。
- **package.json**：项目清单——`dependencies`（生产依赖）、`devDependencies`（开发依赖）、`scripts`（命令别名）、`engines`（Node 版本约束）、`type`（CJS/ESM）、`exports`（包入口映射）。
- **`node_modules` 与依赖解析**：`require('foo')` 从当前目录向上逐级查找 `node_modules/foo`，直到根。**扁平化**让多个包共享同一版本的依赖（提升到顶层），不同版本则嵌套。pnpm 用**符号链接 + 内容寻址存储**解决重复与幽灵依赖问题。
- **Error-First Callback**：Node.js 的回调约定——`(err, result) => {}`，第一个参数永远是错误（无错误则 `null`）。所有原生异步 API（`fs.readFile`、`http.get`）都遵循它。
- **回调地狱 → Promise → async/await**：嵌套回调难维护，催生了 Promise（`then` 链），再到 `async/await`（Promise 的语法糖）。Node.js 8+ 原生支持 async/await，`util.promisify` 把 Error-First Callback 包成 Promise。
- **Permission Model**（20+，实验）：默认 Node.js 进程有当前用户的**全部权限**（能读写任意文件、起子进程、读环境变量）——和 Deno 的默认安全相反。Permission Model 用 `--allow-*` 标志收窄能力，防止第三方依赖越权。
- **Worker Threads**：`worker_threads` 模块提供基于 V8 isolate 的多线程，靠 `MessagePort` 的 `postMessage` 通信。用于 CPU 密集并行，绕开主线程单线程限制。
- **安全风险**：`node_modules` 里的传递依赖可能含恶意代码（postinstall 脚本能执行任意命令），供应链攻击（event-stream、ua-parser-js 被植入挖矿/后门）是持续威胁——需 `npm audit`、锁文件、私有 registry、SBOM 管理。

## 一、npm 注册表与依赖解析

npm 是 Node.js 生态的基石。一次 `npm install` 的过程：

```
   读取 package.json 的 dependencies
              │
   解析依赖树（递归，含传递依赖）
              │
   下载到 node_modules/（扁平化 + 提升）
              │
   生成 package-lock.json（锁定确切版本）
```

- **语义化版本（SemVer）**：`^1.2.3`（兼容 1.x.x）、`~1.2.3`（兼容 1.2.x）、`1.2.3`（精确）。`^` 是默认，允许小版本升级，但可能引入 break——锁文件 `package-lock.json` 锁住确切版本保证可复现。
- **依赖解析算法**：`require('foo')` 从当前文件目录的 `node_modules/` 找，找不到则向上一级 `../node_modules/`，直到文件系统根。这种"逐级向上"让每个包能用自己版本的依赖（避免冲突）。
- **扁平化（hoisting）**：npm v3+ 把大部分依赖提升到顶层 `node_modules/`，减少重复。副作用是**幽灵依赖**——你的代码能 `require` 一个没在 package.json 里声明、但被某个依赖提升上来的包（删除那个依赖就崩）。
- **pnpm 的改进**：用全局**内容寻址存储**（`~/.pnpm-store`）+ 项目内的**符号链接树**，严格隔离（无幽灵依赖）、节省磁盘、安装更快。

## 二、Error-First Callback 与异步演进

Node.js 的异步 API 历经三代演进，理解这条线就理解了 Node.js 风格变迁：

```
   第一代：Error-First Callback
     fs.readFile('a.txt', (err, data) => { if (err) ...; use(data); });
        │ 回调地狱、错误难统一处理
        ▼
   第二代：Promise
     promisify(fs.readFile)('a.txt').then(data => ...).catch(err => ...);
        │ 链式但仍是 then 嵌套
        ▼
   第三代：async/await
     const data = await fs.promises.readFile('a.txt');
        │ 同步写法、try/catch 错误处理、清晰可读
```

- **Error-First Callback 约定**：`(err, result) => {}`，err 非 null 即出错。`if (err) return cb(err);` 是 Node.js 老代码的标志。
- **回调地狱**：多层嵌套回调——读文件 → 解析 → 查库 → 写日志，每层缩进，错误处理分散。
- **util.promisify**：Node.js 8+ 提供，把 Error-First Callback 函数转成 Promise：`const readFile = util.promisify(fs.readFile);`。
- **fs.promises**：Node.js 10+ 提供 Promise 化的 fs API（`fs.promises.readFile`），无需手动 promisify。
- **async/await 是 Promise 语法糖**：`await` 暂停 async 函数等待 Promise resolve，写法像同步但本质异步。错误用 `try/catch`，比 `.catch()` 链更直观。

## 三、Permission Model：给 Node.js 加安全边界

Node.js 历来的安全短板：进程一启动就有当前用户的**全部权限**——能读写任意文件、起子进程、读所有环境变量、连任意网络。一个 npm 包的 postinstall 脚本就能偷走 SSH 密钥。Permission Model（Node.js 20+ 实验特性）回应了 Deno 的默认安全模型：

```bash
# 只允许读 /app/data 和 /tmp
node --allow-fs-read=/app/data --allow-fs-write=/tmp app.js

# 禁止起子进程
node --disallow-child-process app.js

# 程序内查询权限
import { process } from 'node:process';
if (process.permission.has('fs.write', '/etc')) { ... }
```

- **可控维度**：文件系统读写（`--allow-fs-read/write`）、子进程（`--allow-child-process`）、环境变量（`--allow-env`）、Worker Threads（`--allow-worker`）、原生插件（`--allow-addons`）。
- **现状**：仍是实验特性（`--experimental-permission`），API 可能变。但方向明确——让 Node.js 也能像 Deno 那样最小权限运行，缓解供应链攻击。
- **与 Deno 对比**：Deno 是**默认拒绝**（无权限则不能用），Node.js Permission Model 是**默认允许 + 显式收窄**（不加标志则全权限）。哲学不同。

## 四、Worker Threads：多核并行

单线程事件循环擅长 I/O 密集，但 CPU 密集任务（图像处理、加解密、大数据计算）会阻塞主循环。Worker Threads 提供真正的多线程：

```js
// 主线程
import { Worker } from 'node:worker_threads';

const worker = new Worker(new URL('./heavy.js', import.meta.url));
worker.postMessage({ array: bigArray });
worker.on('message', (result) => console.log('结果', result));
worker.on('error', (err) => console.error(err));
worker.on('exit', (code) => console.log('退出', code));
```

```js
// heavy.js（工作线程）
import { parentPort } from 'node:worker_threads';
import { sha256ManyTimes } from './crypto.js';

parentPort.on('message', ({ array }) => {
  const result = sha256ManyTimes(array);  // CPU 密集
  parentPort.postMessage(result);          // 结果拷贝回主线程
});
```

- **本质**：每个 Worker 是独立的 **V8 isolate**（独立堆、独立事件循环、独立模块缓存），通过 `MessagePort` 用 `postMessage` 通信。
- **通信代价**：`postMessage` 默认用**结构化克隆**（深拷贝数据），大数据慢。可用 `transferList`（转移 `ArrayBuffer` 所有权，零拷贝）或 `SharedArrayBuffer`（共享内存，需 Atomics 同步）优化。
- **何时用**：CPU 密集（图像/加密/压缩/JSON 大文件/ML 推理）。**何时不该用**：I/O 密集（异步就够，开 Worker 反增开销）；轻量任务（创建 Worker 的开销 > 收益）。
- **与子进程对比**：Worker Threads 共享进程地址空间（部分），通信快（消息传递而非 IPC 序列化）；子进程（`child_process.fork`）完全隔离，更安全但通信开销大。CPU 密集且需频繁通信用 Worker；需强隔离（跑不可信代码）用子进程。

## 下一步

掌握了 Node.js 的生态、异步演进、权限与多线程后，下一站横向对比另外两大 JS 运行时——[Deno](../../deno/)（默认安全 + 原生 TS + JSR）与 [Bun](../../bun/)（全能工具链 + 极致性能），理解三者各自的取舍与适用场景。
