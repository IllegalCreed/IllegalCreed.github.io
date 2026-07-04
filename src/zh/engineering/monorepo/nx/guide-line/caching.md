---
layout: doc
outline: [2, 3]
---

# 计算缓存与哈希

> 基于 Nx（20/21.x）· 核于 2026-07

## 速查

- **缓存单位是「task」**（一个 target 的一次调用）；命中即 **replay**：还原终端输出 + 恢复 `outputs` 文件
- **computation hash** 由这些组成：本项目及依赖的**源文件**、相关**全局配置**、**外部依赖版本**、**运行时值**、**CLI 参数**
- **开启缓存**：target 上 `"cache": true`（Nx 17+），通常写在 `nx.json` 的 `targetDefaults`
- **inputs 文件集**：`{projectRoot}/**/*`、`{workspaceRoot}/...`；`!` 前缀=排除；`^` 前缀=作用于**依赖项目**
- **高级 inputs**：`{ "env": "API_KEY" }`、`{ "runtime": "node --version" }`、`{ "externalDependencies": ["jest"] }`、`{ "dependentTasksOutputFiles": "**/*.d.ts", "transitive": true }`
- **namedInputs 约定**：`default` / `production` / `sharedGlobals`；`namedInputs` 在 nx.json 与项目间**合并**，而 `inputs` 是**替换**
- **outputs**：声明产物位置供缓存；默认已含 `{workspaceRoot}/dist/{projectRoot}`、`{projectRoot}/build`、`{projectRoot}/dist`、`{projectRoot}/public`
- **本地缓存目录**：`.nx/cache`（用 `cacheDirectory` 或环境变量 `NX_CACHE_DIRECTORY` 改）
- **缓存容量**：`maxCacheSize` 默认「磁盘的 10%，上限 10GB」；无论容量，**超过 7 天未访问**的条目会被清理
- **跳过 / 清理**：临时跳过用 `--skip-nx-cache`；清空本地缓存用 `nx reset`
- **正确性第一原则**：**宁可多算，不可算错**——不确定就把更多东西纳入 inputs，再逐步收窄
- **远程缓存 = Nx Replay**（Nx Cloud 提供），详见 [Nx Cloud 与分布式 CI](./nx-cloud.md)

## 缓存的心智模型

Nx 按任务图的顺序执行任务。**运行每个 task 之前先算它的 computation hash**——只要哈希相同，运行结果就一定相同。

算完哈希，Nx 先查**本地**缓存，若未命中且配置了**远程**缓存再查远程：

- **命中**：取出缓存，把产物文件放回对应目录、并原样打印终端输出。从用户视角看命令照常跑了，只是快得多。
- **未命中**：真正执行 task，完成后把 `outputs` 与终端输出**存入**本地（并按需存远程）。

为让「replay」体验无缝，Nx 还做了很多优化：跨平台（含 Windows）捕获 stdout/stderr、最小化 IO、大任务图下只显示相关输出、为缓存未命中提供排查信息等。

## computation hash 由什么决定

默认情况下，`nx test app1` 的哈希包含：

- `app1` 及其依赖 `lib` 的**所有源文件**
- 相关的**全局配置**
- **外部依赖的版本**
- 用户提供的**运行时值**
- **CLI 命令参数**

这套行为可定制：例如 lint 可能只依赖本项目源码 + 全局配置；build 可以依赖被编译库的 `.d.ts` 而非其全部源码。定制的入口就是 `inputs` 与 `outputs`。

## inputs：决定缓存何时失效

Nx 计算哈希时会考虑 target 的 `inputs`——一组**文件集、运行时输入、环境变量**。任一 input 变化即让缓存失效、任务重跑。可用的 input 类型：

- **项目配置**：本项目与依赖项目的配置**永远**纳入哈希。
- **命令参数**：不同参数常改变行为，故纳入哈希；但 Nx 会滤掉对任务本身无影响的 Nx 专用参数（如 `--parallel`、`--projects`）。`nx build app --prod` 与 `nx build app` 因此互不复用缓存。
- **源文件**：按 glob 匹配，须以 `{projectRoot}` 或 `{workspaceRoot}` 开头（`{workspaceRoot}` 只能在开头；`{projectRoot}`/`{projectName}` 可出现在中间做插值）；`!` 排除、`^` 作用于依赖项目。

```json
{
  "inputs": [
    "{projectRoot}/**/*",
    "{workspaceRoot}/.gitignore",
    "{projectRoot}/**/*.ts",
    "!{projectRoot}/**/*.spec.ts"
  ]
}
```

- **环境变量**：`{ "env": "API_KEY" }` 把 `$API_KEY` 的值纳入哈希。
- **运行时输入**：`{ "runtime": "node --version" }` 把某命令的输出纳入哈希（常用于工具版本；脚本要跨平台，别用 `.sh`/`.bat`）。
- **外部依赖**：`{ "externalDependencies": ["jest"] }`。默认若不声明，Nx 会把**工作区全部外部依赖**的哈希纳入——保守但可能过度失效；显式声明可提高命中率：

```json
{
  "targets": {
    "lint": {
      "command": "eslint .",
      "inputs": [
        "default",
        { "externalDependencies": ["eslint", "eslint-config-airbnb"] }
      ]
    }
  }
}
```

- **依赖任务的产物**：`{ "dependentTasksOutputFiles": "**/*.d.ts", "transitive": true }`，把依赖任务产出的文件纳入；`transitive: true` 则连传递依赖的产物也算。
- **root tsconfig 子集**：存在 `tsconfig.json`/`tsconfig.base.json` 时，Nx 永远考虑与本项目相关的部分（`compilerOptions` 与相关 `paths`），从而不会一改路径映射就让所有任务失效。

## namedInputs：复用输入集

把常用输入集在 `nx.json` 的 `namedInputs` 里命名，之后在 `inputs` 里像变量一样引用。Nx 默认生成三个约定命名：

```json
{
  "namedInputs": {
    "default": ["{projectRoot}/**/*", "sharedGlobals"],
    "production": ["default", "!{projectRoot}/**/*.spec.tsx"],
    "sharedGlobals": []
  }
}
```

- **default**：项目全部文件 + 共享全局输入，确保「默认永远该跑就跑」。
- **production**：只含影响**生产行为**的文件——通常写成「default 排除掉那些只影响开发工具、不影响终端用户的文件」（测试、配置等）。
- **sharedGlobals**：所有任务都该看的东西，如 OS、Node 版本。

**合并 vs 替换**（易错点）：`namedInputs` 在 `nx.json` 与项目配置之间是**合并**的（`{...nxJson, ...projectJson}`）；而某 target 的 `inputs` 一旦在项目里定义，就**整体替换** `nx.json` 里同名 target 的 `inputs`。

依赖项目常用 `^` 前缀区分。例如「测本项目要看它全部文件，但只看依赖的生产文件」：

```json
{
  "name": "myreactapp",
  "targets": {
    "test": {
      "inputs": ["default", "^production", "{projectRoot}/jest.config.js"]
    }
  }
}
```

## outputs：缓存什么

`outputs` 告诉 Nx 一个 target 会把产物写到哪、以便缓存与恢复。多数情况**无需手写**——Nx 默认缓存这些位置：

- `{workspaceRoot}/dist/{projectRoot}`
- `{projectRoot}/build`
- `{projectRoot}/dist`
- `{projectRoot}/public`

需要精确控制时可显式声明，甚至用 glob（由 Rust 的 GlobSet 解析）只缓存部分文件、或排除子目录：

```json
{
  "targets": {
    "build-js": {
      "outputs": ["{workspaceRoot}/dist/libs/mylib/**/*.{js,map}"]
    },
    "build-css": {
      "outputs": ["{workspaceRoot}/dist/libs/mylib/**/!(secondary).css"]
    }
  }
}
```

::: warning outputs 漏声明 = 缓存「假命中」
如果 target 实际写到某目录，但没被默认位置覆盖、也没在 `outputs` 里声明，缓存命中时那部分产物**不会被恢复**，表现为「明明命中却缺文件」。产物落在非默认目录时务必显式声明 `outputs`。
:::

## 本地缓存的位置与容量

- **目录**：默认 `.nx/cache`，用 `nx.json` 的 `cacheDirectory` 或环境变量 `NX_CACHE_DIRECTORY` 覆盖。
- **容量**：`maxCacheSize` 未设时默认为「所在磁盘的 10%，最多 10GB」；超限时按最近最少使用清理到限额的 90% 以下。可用 `NX_MAX_CACHE_SIZE` 覆盖，设 `"0"` 表示不限。
- **过期**：无论容量设置，**超过 7 天未访问**的缓存条目都会被移除。

## 缓存正确性与常见坑

- **保守优先**：Nx 官方建议「先把范围放宽，确保不会算错，再在有明确机会时收窄 inputs 提升命中率」。宁可偶尔多跑，也不要产出错误产物。
- **临时跳过缓存**：`nx build app --skip-nx-cache`。
- **清空本地缓存**：`nx reset`（同时清理 Nx daemon 等状态）。
- **排查未命中**：用 `nx show project <p> --web` 看 inputs 是否如预期；Nx 官方有 “Troubleshoot Cache Misses” 专页。
- **禁用缓存会影响分布式**：给某 target 关掉缓存后，它（及依赖它的 target）将无法用 Nx Agents 分布式执行——分布式以缓存为传输机制，见 [Nx Cloud 与分布式 CI](./nx-cloud.md)。
