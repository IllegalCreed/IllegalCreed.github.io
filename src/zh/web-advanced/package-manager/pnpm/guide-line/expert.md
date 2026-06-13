---
layout: doc
outline: [2, 3]
---

# 指南 · 专家

> 版本基线 **pnpm 11.x**（2026-06）。本篇覆盖安全默认、补丁、部署、Docker 层缓存、布局逃生舱与迁移实战——把 pnpm 用进生产链路。

## 一、安全默认：构建脚本拦截（v10+）

供应链攻击常借依赖的 `postinstall` 脚本投毒。**pnpm v10.0 起默认禁止依赖自动执行生命周期脚本**（`preinstall`/`install`/`postinstall`）。首次安装常见提示：某些包的 build 脚本被忽略、需要批准。

放行可信包有两种方式：

```bash
pnpm approve-builds      # 交互式勾选要放行的包，自动写入 allowBuilds
```

```yaml
# pnpm-workspace.yaml：显式声明（map：包名 → true/false，可精确到版本）
allowBuilds:
  esbuild: true
  "@swc/core": true
  core-js: false
  "nx@21.6.4 || 21.6.5": true
```

> ⚠️ **配置演进（务必分清）**：v10.0 用 `onlyBuiltDependencies`/`neverBuiltDependencies`/`ignoredBuiltDependencies` 列白/黑名单；**v10.26/v11 引入统一的 `allowBuilds`（map）取代它们**。要全局放开（强不推荐）才用 `dangerouslyAllowAllBuilds: true`。配 `strictDepBuilds` 可让「未审查的包想跑脚本」直接失败。

其他供应链设置：

- `minimumReleaseAge`: 拒绝安装发布过新的版本（按分钟，文档示例 `1440` = 1 天），给社区留发现/下架恶意包的窗口。
- `blockExoticSubdeps`（默认 `true`）：只许直接依赖用 git 等 exotic 来源，传递依赖必须来自 registry。

## 二、给依赖打补丁：pnpm patch

第三方包有 bug、上游短期不修，用内置补丁流程（替代 `patch-package`）：

```bash
pnpm patch express@4.18.1        # 解压到临时目录，输出可编辑路径
# —— 在该临时目录里改源码 ——
pnpm patch-commit <临时目录路径>   # 生成 .patch 并登记
```

登记信息写进 **`patchedDependencies`**（`pnpm-workspace.yaml` 或 `package.json`），此后**每次安装自动应用**：

```yaml
patchedDependencies:
  express@4.18.1: patches/express@4.18.1.patch
```

> 支持按版本范围匹配，优先级：精确版本 > 范围 > 仅包名。

## 三、补破损包：packageExtensions vs overrides

- 包**漏声明依赖/peer** → `packageExtensions` 给它补清单（见[进阶篇](./advanced)）。
- 包的某个**传递依赖版本**要强制改 → `overrides`。
- 包的**整段源码**要改 → `pnpm patch`。

三者职责不重叠，按「缺声明 / 改版本 / 改代码」对号入座。

## 四、部署：pnpm deploy

把 monorepo 里某个子服务连同依赖产出成**自包含目录**（`workspace:` 本地依赖会被展开成真实 `node_modules`），适合 Docker 生产镜像：

```bash
pnpm --filter=@app/api --prod deploy ./out
# ./out 是一个可直接 node 运行的自包含目录，不含整个 monorepo
```

- `--prod`：跳过 `devDependencies`，瘦身产物。
- 多阶段构建里：先在构建阶段 `build`，再 `deploy` 到精简基础镜像（如 `node:24-alpine`），镜像更小、启动更快。

## 五、Docker 层缓存：pnpm fetch

为避免「改一行业务代码就重装全部依赖」，用 `pnpm fetch` 把依赖层与源码解耦：

```dockerfile
# 1) 只 COPY 锁文件 —— 这层只在依赖变化时失效，缓存命中率极高
COPY pnpm-lock.yaml ./
RUN pnpm fetch              # 仅依据锁文件把依赖拉进虚拟 store（不需要 package.json）

# 2) 再 COPY 源码 —— 业务改动只让这之后的层失效
COPY . .
RUN pnpm install --offline  # 从本地 store 离线装齐，不再触网
RUN pnpm -r build
```

> `pnpm fetch` 的关键是**只读锁文件、与源码无关**，因此放在 Dockerfile 靠前位置能最大化层缓存复用。

## 六、布局逃生舱：nodeLinker / hoist

少数旧工具假定扁平 `node_modules`，或某个工具要在顶层找到未声明的包，按需开口子（优先用最小范围的方案）：

```yaml
# pnpm-workspace.yaml
# A) 定向：只把匹配的包提升到顶层（最推荐，影响面小）
publicHoistPattern:
  - "*eslint*"
  - "@types/*"

# B) 半步：整体退回扁平布局，兼容假定扁平的旧工具
nodeLinker: hoisted

# C) 大招（慎用）：把所有依赖提升到顶层，等价 publicHoistPattern: "*"
shamefullyHoist: true
```

> 取舍：`publicHoistPattern`（定向提升到顶层公共可见）< `hoistPattern`（提升到 `.pnpm/node_modules`，内部可见）< `nodeLinker: hoisted`（整体扁平）< `shamefullyHoist`（全量提升）。**能用窄的就别用宽的**——越宽越容易把幽灵依赖重新引回。

## 七、迁移实战：从 npm/Yarn 切到 pnpm

1. **转锁文件**：`pnpm import` 读现有 `package-lock.json`/`yarn.lock` 生成 `pnpm-lock.yaml`，尽量保留版本解析。
2. **首次安装暴露问题**：`pnpm install` 后若报 `Cannot find module 'xxx'`——这是**幽灵依赖现形**，把 `xxx` 补进对应包的 `dependencies`（**根治**）。
3. **临时兜底**：实在来不及补全，先用 `public-hoist-pattern` 定向提升让其可用，但记为技术债、后续补声明。
4. **构建脚本**：遇「需批准」用 `pnpm approve-builds` 放行可信包（如 `esbuild`/`@swc/core`）。
5. **锁版本**：`package.json` 写 `"packageManager": "pnpm@11.6.0"`，CI 用 `--frozen-lockfile`。

> 核心心态：pnpm 报的「错」大多是**它在帮你发现 npm 扁平布局掩盖的隐患**。补全声明后，项目反而更健壮、可复现。

## 八、版本现状与小结（2026-06）

- pnpm `latest` 在 **11.x**；安全默认（拦截构建脚本、`allowBuilds`/`approve-builds`）已成标配。
- 省盘（store + 硬链接）、严格（非扁平防幽灵）、monorepo 友好（`workspace:`/`--filter`/catalog）是 pnpm 的三块护城河。
- 生产链路：`pnpm deploy` 出自包含目录、`pnpm fetch` 优化 Docker 缓存、`--frozen-lockfile` 保可复现。
