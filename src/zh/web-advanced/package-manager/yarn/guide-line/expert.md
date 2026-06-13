---
layout: doc
outline: [2, 3]
---

# 指南 · 专家

> 版本基线 **Yarn Modern 4.x**。本篇收口工程化深水区：constraints 约束引擎、plugins、PnP 编辑器 SDK、`supportedArchitectures` 多平台、与 npm/pnpm 的深度取舍。

## 一、constraints：monorepo 的 ESLint

约束让你**声明式**地强制全仓库满足某些规则（如同名依赖版本一致、必须有 `license` 字段、禁用某包）。Yarn 4 已从早期 **Prolog** 切换为 **JavaScript**：在项目根写 `yarn.config.cjs`。

```js
// yarn.config.cjs
const { defineConfig } = require('@yarnpkg/types');

module.exports = defineConfig({
  constraints: async ({ Yarn }) => {
    // 规则一：所有工作区里同名依赖版本必须一致
    for (const dep of Yarn.dependencies()) {
      if (dep.type === 'peerDependencies') continue;
      for (const other of Yarn.dependencies({ ident: dep.ident })) {
        if (other.type === 'peerDependencies') continue;
        dep.update(other.range);
      }
    }
    // 规则二：每个工作区都必须声明 MIT 许可证
    for (const ws of Yarn.workspaces()) {
      ws.set('license', 'MIT');
    }
  },
});
```

```bash
yarn constraints          # 检查，列出违规
yarn constraints --fix    # 自动改写各 package.json 修复
```

> 声明式心智：你只描述**期望状态**（「应当是什么」），不写 if/else 流程；`--fix` 负责把现实改成期望。`@yarnpkg/types` 提供完整 TS 类型。

## 二、plugins：可扩展、可随仓库分发

Modern 核心被设计为**可插件扩展**，许多能力以插件形式存在（交互式工具、版本工作流、约束的部分能力等）：

```bash
yarn plugin import interactive-tools   # 导入官方插件
yarn plugin import <url>               # 从 URL 导入
yarn plugin list                       # 列出已装插件
```

插件文件落在 **`.yarn/plugins`**，**可提交进仓库**随项目分发——团队成员 clone 后即拥有相同插件能力。这是 Classic 不具备的官方架构。

## 三、PnP 编辑器集成（SDK）

编辑器的语言服务（TS Server、ESLint）默认按 `node_modules` 解析，PnP 下会失效。用 SDK 生成垫片：

```bash
yarn dlx @yarnpkg/sdks vscode   # 为 VS Code 生成 .yarn/sdks + 设置
yarn dlx @yarnpkg/sdks base     # 不绑定具体编辑器
```

它在 `.yarn/sdks` 生成 **PnP 感知**的 TypeScript/ESLint 垫片，并写好编辑器设置（让 VS Code 用「工作区版 TypeScript」）。之后类型跳转、补全、报错都能正确走 PnP 解析。

> 这是 PnP 项目的**必做步骤**之一。漏了它，最常见症状是「命令行能跑、编辑器满屏红线找不到模块」。

## 四、supportedArchitectures：多平台预取

某些依赖含**平台相关的原生二进制**（按 OS/CPU/libc 分发）。默认只装当前机器的；要在一处（如 Linux CI）为多目标预取：

```yaml
# .yarnrc.yml
supportedArchitectures:
  os: ['current', 'darwin', 'win32']
  cpu: ['current', 'arm64', 'x64']
  libc: ['current', 'glibc', 'musl']
```

典型场景：构建跨平台产物、准备多架构 Docker 镜像、或让 zero-installs 的缓存覆盖团队所有平台，避免到目标机器才发现缺二进制。

## 五、与 npm / pnpm 的深度取舍

三者都能遏制幽灵依赖，但路线不同：

| 维度 | Yarn 4（PnP） | pnpm / Yarn pnpm-linker | npm |
|---|---|---|---|
| `node_modules` | **无**（`.pnp.cjs` 映射） | 有，但用符号/硬链接 | 有，平铺 |
| 磁盘/速度 | 安装极省 I/O、缓存 zip | 全局内容寻址、单版本一份 | 最朴素，冗余多 |
| 幽灵依赖 | 解析层严格杜绝 | 隔离杜绝 | 易出现（提升） |
| 工具兼容 | 少数需适配（RN/Expo 要 node-modules） | 接近 npm | 最佳 |
| 工程化 | 约束/补丁/插件/zero-installs 齐 | 较少 | 较少 |

**选型建议**：

- **追求极致严格 + 工程化能力（约束/补丁/zero-installs）+ monorepo**：Yarn 4 PnP。
- **想要隔离与省盘、但仍要 node_modules 兼容性**：pnpm，或 Yarn 的 `nodeLinker: pnpm`。
- **生态默认、最低门槛、随大流**：npm（11.x，随 Node 分发）。

## 六、版本现状与时效（2026-06）

- Yarn Modern 主线 **4.x**（master `4.16.0-dev`），活跃迭代。
- Yarn Classic **1.22.x** 已**冻结**，仅安全补丁——新项目不应基于 Classic 写文档/教程。
- 同期 npm **11.x**、Node 稳定版 **26.x**；Corepack 仍是官方推荐的 Yarn/pnpm 版本分发方式。

> 一句话收口：Yarn 4 的核心竞争力不是「装得快」，而是**「项目管理」整套能力**——PnP 的严格、约束的护栏、补丁/插件/zero-installs 的工程化。能吃下心智门槛与少量兼容成本的团队，回报很大。
