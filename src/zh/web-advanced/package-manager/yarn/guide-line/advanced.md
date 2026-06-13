---
layout: doc
outline: [2, 3]
---

# 指南 · 进阶

> 版本基线 **Yarn Modern 4.x**。本篇深入：PnP 原理与 zip 缓存、zero-installs、`dlx`/`up`/`why`/`dedupe`、协议（patch/portal/link）、Classic→Berry 迁移与启用 PnP。

## 一、Plug'n'Play 原理

传统装法把依赖解压平铺进 `node_modules`，靠 Node 沿目录向上查找——文件量巨大、提升带来幽灵依赖。**PnP 换了一套解析模型**：

1. 安装时生成 **`.pnp.cjs`**：内含整棵依赖树的**精确映射**（谁依赖谁、每个包在磁盘哪）。
2. 包以 **zip 压缩包**存于 `.yarn/cache`，**不解压、不平铺**。
3. 运行时 PnP 钩子劫持 `require`/`import`，按映射**直接定位到 zip 内路径**。

```text
传统：require('x') → 沿 node_modules 逐级查找（慢、可命中未声明包）
PnP ：require('x') → 查 .pnp.cjs 映射 → 直达 .yarn/cache 里的 zip
```

**收益**：安装主要是「写映射文件」，省海量 I/O；解析 O(1) 确定；**严格只允许访问显式声明的依赖**（默认 `pnpMode: strict`），幽灵依赖在解析层即报错（且报错语义明确，指明缺哪个包）。

> 因为不再有 `node_modules`，直接 `node script.js` 会找不到模块——要用 **`yarn node`**（或 `yarn run`/`yarn exec`），它会先注入 PnP 钩子再执行。

## 二、缓存与 zero-installs

每个依赖在 `.yarn/cache` 是**一个 zip**。把它和 `.pnp.cjs` 都提交进 Git，就得到 **zero-installs（零安装）**：

- PnP 映射在任何机器内容一致 + 缓存提供了所有包文件 → **切分支后通常无需 `yarn install`**，clone 即可运行。
- 对比提交 `node_modules`：后者是几万个小文件、diff 灾难；而 cache 是「每包一个 zip」，diff 清爽。

zero-installs 需把缓存放进项目内（关闭全局缓存）：

```yaml
# .yarnrc.yml
enableGlobalCache: false   # 缓存落到项目内 .yarn/cache（offline mirror）
```

配套 `.gitignore`（先忽略再白名单放行）：

```gitignore
.yarn/*
!.yarn/cache
!.yarn/releases
!.yarn/plugins
!.yarn/sdks
node_modules
```

> 局限：含**原生编译**的依赖仍需 `yarn install`（二进制无法直接从 zip 运行）。是否上 zero-installs 取决于团队对仓库体积/原生依赖的取舍。

## 三、dlx / up / why / dedupe

```bash
yarn dlx create-vite my-app   # 临时下载并运行脚手架，用完即弃（对标 npx）
yarn up lodash                 # 升级 lodash（范围内最新，可跨工作区统一同名包）
yarn up '@types/*'             # 按模式批量升级
yarn why lodash                # 解释 lodash 为何被装、被谁引入
yarn dedupe                    # 合并范围重叠、可共用同一版本的重复包
```

- `dlx`：替代 Classic 的 `yarn global` 一次性执行用途；**Modern 已移除全局安装**。
- `up` vs Classic `upgrade`：不仅改名，还能跨整个项目/工作区统一同名依赖版本。
- `dedupe`：在不破坏 semver 约束的前提下收敛重复版本，缩小依赖图。

## 四、协议：patch / portal / link

### patch:（给依赖打补丁）

修一个上游短期不会发版的 bug：

```bash
yarn patch left-pad           # 解压到临时目录供你改
# ……改完……
yarn patch-commit -s /tmp/xxx # 生成 .yarn/patches/xxx.patch 并写回依赖
```

依赖里会出现 `left-pad@patch:left-pad@npm:1.3.0#./.yarn/patches/...`。配合 `resolutions` 还能给**深层传递依赖**打补丁并强制全树使用（常用于抢修传递依赖的安全漏洞）。它享受 Yarn 的缓存与校验，比 patch-package 的「postinstall 脚本层」更内聚。

### portal: vs link:（链接本地包）

```json
{
  "dependencies": {
    "@my/app": "link:./src",                 // 仅软链纯目录，不处理其依赖
    "eslint-plugin-foo": "portal:./pkgs/foo" // 像真实安装：解析其依赖与 peer
  }
}
```

| 协议 | 处理被链包的依赖/peer | 适用 |
|---|---|---|
| `portal:` | **会**（如真实安装的包） | 链接「带依赖」的本地包 |
| `link:` | **不处理** | 链接「无依赖的纯代码目录」 |

## 五、Classic → Berry 迁移

官方流程（**可保留 node_modules**，PnP 之后再上）：

```bash
corepack enable
cd my-project
yarn set version berry        # 切到 Modern
# 把旧 .yarnrc/.npmrc 配置改写成 .yarnrc.yml（registry→npmRegistryServer 等）
yarn install                  # 更新 lock
git add . && git commit -m "chore: migrate to Yarn Modern"
```

迁移期建议先 `nodeLinker: node-modules` 稳住兼容，再逐步评估 PnP。关键变更清单：

- 配置：`.yarnrc`/`.npmrc` 失效 → 改 `.yarnrc.yml`（`npmRegistryServer`、`npmAuthToken`）。
- 命令：`upgrade`→`up`、`audit`→`npm audit`、`publish`→`npm publish`、移除 `global`/`check`/`import`。
- 脚本：不再隐式跑任意 `pre`/`post`，需显式串联（`"start": "yarn prestart && ..."`）。
- 提升：`nohoist` → `.yarnrc.yml` 的 `nmHoistingLimits`。
- `bundleDependencies`：与 PnP 不兼容，改用 fork/`file:`/外部打包。

## 六、启用 PnP 的迁移要点

从 `node-modules` 切到 PnP（删掉 `nodeLinker: node-modules` 或显式设 `pnp`）后，最常见问题是**第三方包的幽灵依赖**集中报 `Cannot find module`。规范修法是补声明而非绕过：

```yaml
# .yarnrc.yml —— 给缺声明的包补上它实际需要的依赖
packageExtensions:
  "some-pkg@*":
    dependencies:
      "missing-dep": "^1.0.0"
```

> 过渡期可临时 `pnpMode: loose`（放宽到「传统提升下本可达的包」，仅警告），但牺牲了严格性，**不建议长期开**。React Native/Expo 等仍要求 `node_modules`，这类项目保持 node-modules linker 即可。

---

进入 [指南 · 专家](./guide-line/expert)：constraints 约束引擎、plugins、PnP 编辑器 SDK、`supportedArchitectures`、与 npm/pnpm 的深度取舍。
