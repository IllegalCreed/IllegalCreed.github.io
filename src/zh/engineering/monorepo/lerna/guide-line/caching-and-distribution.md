---
layout: doc
outline: [2, 3]
---

# 缓存与分布式执行

> 基于 Lerna（9.x，由 Nx 团队维护）· 核于 2026-07

## 速查

- **本地计算缓存（借 Nx）**：*"never rebuild the same code twice"*——输入未变则**瞬时重放**输出（含终端日志 + 输出目录文件）。
- **启用缓存**：需有 `nx.json`（`npx lerna add-caching` 生成），在 `targetDefaults.<target>.cache: true` 打开。
- **`inputs`**：决定缓存命中；支持 fileset（`"{projectRoot}/**/*.ts"`）、runtime（`{"runtime":"node -v"}`）、env（`{"env":"MY_VAR"}`）、`namedInputs`。
- **`outputs`**：指定被缓存的产物目录，如 `["{projectRoot}/dist"]`。
- **可缓存操作必须无副作用**：同输入必同输出——打外部 API 的 E2E **不可缓存**。
- **清缓存**：`nx reset` 清空重建；`--skip-nx-cache` 单次跳过；本地缓存约保留 **1 周**。
- **远程/共享缓存**：团队与 CI 共享计算结果，用 **Nx Cloud**（`npx nx connect`）；`--no-cloud` 或 `NX_NO_CLOUD=true` 关闭。
- **`--since` / affected**：`lerna run build --since=origin/main` 只跑受变更影响的包——优化「平均」耗时。
- **DTE（分布式任务执行）**：把单个任务按耗时分派到多台 agent——优化「最坏」耗时；需 **Nx Cloud** 编排。
- **DTE 限制**：**只有可缓存操作能被分布式执行**（需在主 job 重放）；`--concurrency` 会传播到 agent。
- **Project Graph**：Lerna 借 Nx 从各 `package.json` 依赖构建项目图，用于拓扑排序与受影响检测；`nx graph` 可视化。

## 本地计算缓存

Lerna 借 Nx 实现**计算缓存**：只要某个任务的**输入**没变，就直接**重放**上次的输出（终端日志 + 产物文件），不再真正执行——口号是「同样的代码不构建第二次」。

启用需要 `nx.json`（`npx lerna add-caching` 会生成并配好）：

```json
{
  "targetDefaults": {
    "build": {
      "cache": true,
      "inputs": ["{projectRoot}/**/*.ts", { "runtime": "node -v" }],
      "outputs": ["{projectRoot}/dist"]
    },
    "test": { "cache": true }
  }
}
```

- **`inputs`**：决定缓存键。支持 **fileset**（`"{projectRoot}/**/*.ts"`）、**runtime**（`{"runtime":"node -v"}`）、**env**（`{"env":"MY_VAR"}`）、以及可复用的 **`namedInputs`**（如定义一个 `prod` 输入集合）。
- **`outputs`**：声明哪些产物目录要被缓存并在命中时恢复。
- **无副作用铁律**：**只有「同输入必同输出」的任务能被缓存**；对外部 API 有副作用的 E2E 测试不可缓存。

缓存演示：

```bash
lerna run build --scope=header      # 首次真正构建（~2s）
nx reset                            # 清空本地缓存
lerna run build --scope=header      # 输入未变 → 从缓存重放（~600ms）
```

- **清理 / 跳过**：`nx reset` 清空重建；`--skip-nx-cache` 单次绕过；本地缓存约保留 1 周。

## 远程 / 共享缓存

本地缓存只惠及你自己的机器；**团队成员与 CI 之间共享**需要**远程缓存**：

- 方案是 **Nx Cloud**：`npx nx connect`（或 `connect-to-nx-cloud`）接入，对 OSS 与多数闭源项目免费。
- 关闭云缓存：`--no-cloud` 或环境变量 `NX_NO_CLOUD=true`。
- 效果：一个人（或 CI）构建过的产物，其他人命中后**秒回**，无需重复计算。

## --since / affected：只跑受影响的包

```bash
lerna run test --since=origin/main    # 只测相对 main 有变更（含受其影响）的包
lerna changed                         # 列出自上次 tag 以来变更的包
```

`--since` 基于 Project Graph 的**受影响检测**：改动一个包，只有它及其**下游依赖者**会被纳入。它优化的是**平均 CI 耗时**——但「改了核心底层包 → 几乎全量受影响」的**最坏情况**它救不了，那要靠 DTE。

## 分布式任务执行（DTE）

- **解决什么**：核心包改动触发**全量**任务的最坏情况。缓存与 `--since` 优化平均值，**DTE 优化最坏值**。
- **原理**：不按「任务类型分箱」（易空转），而是**把单个任务按平均耗时分派到多台 agent 机器**，最小化空闲、仍保正确的拓扑顺序。
- **需 Nx Cloud 编排**：自动在 agent 间搬运文件、把产物回收到主 job，效果如同在一台机器上全跑。
- CI 骨架：

```bash
npx nx-cloud start-ci-run
lerna run lint --since=main & lerna run test --since=main & lerna run build --since=main
npx nx-cloud stop-all-agents
# 每台 agent 机器上：npx nx-cloud start-agent
```

- **限制**：**只有可缓存操作能被分布式执行**（需在主 job 重放结果）；`--concurrency` 会传播到各 agent。

## Project Graph 与可视化

- **构建来源**：Lerna 借 Nx 从各 `package.json` 的依赖关系构建「项目 → 项目」的依赖图。
- **两大用途**：① 任务的**拓扑执行顺序**；② `--since` 的**受影响检测**。
- **可视化**：`nx graph`（浏览器交互图）、`nx graph --file=output.json`（导出 JSON）。
- **隐式依赖**：在包 `package.json` 的 `nx` 字段里用 `implicitDependencies` 声明 package.json 之外的依赖（如 `["projecta", "!projectb"]`）。
- **编程式**：`const { detectProjects } = require("lerna/utils")` 可拿到 `projectGraph` / `projectFileMap`。
