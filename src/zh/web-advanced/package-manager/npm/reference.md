---
layout: doc
outline: [2, 3]
---

# 参考

> 版本基线 **npm 10.x / 11.x**。命令、package.json 字段、版本范围、.npmrc 与版本现状速查。

## 常用命令速查

```bash
npm init -y                       # 生成 package.json（默认值）
npm install                       # 按 package.json 安装全部依赖
npm i <pkg>                       # 装并写入 dependencies
npm i -D <pkg>                    # 装并写入 devDependencies
npm i -g <pkg>                    # 全局安装（注册 bin 到全局 PATH）
npm ci                            # 冻结式干净安装（CI/部署）
npm i --omit=dev                  # 只装生产依赖（跳过 devDependencies）
npm run <script>                  # 运行 scripts 中的脚本
npm test / npm start              # 内置脚本名（可省 run）
npx <pkg>                         # 临时执行包命令（本地优先）
npm update                        # 升级到 semver 范围内最新
npm outdated                      # 只读列出可更新项（Current/Wanted/Latest）
npm audit / npm audit fix         # 漏洞扫描 / 自动修复（兼容补丁）
npm version patch|minor|major     # 升版本号 + git commit + git tag
npm publish [--tag beta]          # 发布（--tag 不移动 latest）
npm dist-tag add pkg@1.2.3 next   # 给已发布版本贴标签
npm link                          # 本地包符号链接联调
npm ls / npm explain <pkg>        # 查看依赖树 / 解释某包为何被装
```

## package.json 核心字段

| 字段 | 作用 |
|---|---|
| `name` / `version` | **发布必填**；name 须 URL 安全小写、version 须合 semver |
| `description` / `keywords` | 影响 `npm search` 可发现性 |
| `main` / `exports` | 入口模块；`exports` 支持多入口与条件导出（现代首选） |
| `type` | `"module"` 让 .js 按 ESM 解析（**Node 行为开关，npm 不用它**） |
| `scripts` | 生命周期与自定义脚本字典 |
| `dependencies` | 运行时生产依赖 |
| `devDependencies` | 开发/测试/构建期依赖（下游不传递） |
| `peerDependencies` | 与宿主共享、由使用方提供的库 |
| `peerDependenciesMeta` | 把某 peer 标 `optional: true`（不自动安装） |
| `optionalDependencies` | 装失败不阻断的可选依赖 |
| `bundleDependencies` | 把指定依赖打进发布 tarball |
| `overrides` | **仅根包**有效，强制替换依赖树中某包版本 |
| `engines` | 声明 Node/npm 版本（**默认建议性**，需 engine-strict 才强制） |
| `os` / `cpu` / `libc` | 限定运行平台/架构（`!` 前缀为黑名单） |
| `files` | 发布白名单（省略默认 `["*"]`，配 `.npmignore`） |
| `bin` | 命令名 → 可执行脚本（发布 CLI 用） |
| `private` | `true` 禁止 `npm publish` 误发 |
| `workspaces` | monorepo 子包 glob 数组 |
| `packageManager` | 配合 **Corepack** 锁定 PM 版本（见时效） |
| `publishConfig` | 发布时覆盖配置（如 registry、access） |

## 版本范围速记

| 写法 | 等价 | 说明 |
|---|---|---|
| `^1.2.3` | `>=1.2.3 <2.0.0` | 锁主版本（npm 默认写入） |
| `^0.2.3` | `>=0.2.3 <0.3.0` | **0.x 特殊**：锁次版本 |
| `^0.0.3` | `>=0.0.3 <0.0.4` | **0.0.x 特殊**：锁补丁 |
| `~1.2.3` | `>=1.2.3 <1.3.0` | 锁次版本 |
| `~1.2` | `>=1.2.0 <1.3.0` | 同上 |
| `1.2.x` / `1.2` | `>=1.2.0 <1.3.0` | x-range |
| `1.2.3 - 2.3.4` | `>=1.2.3 <=2.3.4` | hyphen range |
| `*` / `x` | 任意 | 不锁 |

## .npmrc 速记

配置优先级（高 → 低）：**项目 `./.npmrc` → 用户 `~/.npmrc` → 全局 `$PREFIX/etc/npmrc` → 内置**。

```ini
registry=https://registry.npmjs.org/             # 默认 registry
@myorg:registry=https://npm.company.com/         # 作用域 registry（仅 @myorg/*）
//npm.company.com/:_authToken=${NPM_TOKEN}       # 鉴权（URI 片段，可用环境变量）
save-exact=true                                  # install 写精确版本而非 ^
engine-strict=true                               # 让 engines 变强制
ignore-scripts=true                              # 跳过生命周期脚本（安全）
```

## 生命周期脚本速记

| 脚本 | 触发时机 |
|---|---|
| `pre<X>` / `post<X>` | 任意 `npm run X` 自动前后包裹（如 prebuild/postbuild） |
| `preinstall`/`install`/`postinstall` | 安装时（依赖的 postinstall 会自动跑，**安全风险点**） |
| `prepare` | 本地无参 install、publish/pack 打包前、装 git 依赖时 |
| `prepublishOnly` | 仅 `npm publish` 打包前 |
| `prepack`/`postpack` | tarball 生成前/后 |

## npm 家族对比速记

| 维度 | **npm** | pnpm | yarn | bun |
|---|---|---|---|---|
| 是否随 Node 自带 | **是（基线）** | 否 | 否 | 否（含运行时） |
| node_modules 结构 | 扁平化提升 | 符号链接 + 内容寻址 | 扁平（berry 可 PnP） | 扁平 |
| 幽灵依赖 | 有 | **杜绝** | 有（PnP 杜绝） | 有 |
| 速度/磁盘 | 一般 | **最优** | 较快 | **极快** |
| lockfile | package-lock.json | pnpm-lock.yaml | yarn.lock | bun.lock(b) |

## 版本现状（2026-06）

| 项 | 状态 |
|---|---|
| npm | 随 Node 20+ 分发，基线 **10.x / 11.x** |
| lockfileVersion | v3（npm 9+ 默认，不兼容 npm v6） |
| peerDependencies 自动安装 | **npm v7 起默认安装**（v6 及前只警告） |
| Corepack | **Node 25+ 不再内置**（2025-03 TSC 投票），Node 24 及前仍内置（实验性），未来独立安装 |
