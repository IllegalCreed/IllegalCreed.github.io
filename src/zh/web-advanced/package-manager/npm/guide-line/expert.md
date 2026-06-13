---
layout: doc
outline: [2, 3]
---

# 指南 · 专家

> lockfileVersion 演进、发布流程与 dist-tag、provenance 供应链安全、生命周期脚本攻击面、Corepack 时效。截至 **2026-06**：npm 基线 10.x/11.x；**Corepack 自 Node 25+ 起不再随发行版分发**（2025-03-19 TSC 投票）。

## 一、lockfileVersion 演进

`package-lock.json` 顶部的 `lockfileVersion` 标记格式版本，跨 npm 大版本协作时务必留意：

| 版本 | npm 版本 | 兼容性 |
|---|---|---|
| **v1** | v5 ~ v6 | 最初格式 |
| **v2** | v7 ~ v8 | 向后兼容 v1 |
| **v3** | **v9+（默认）** | 兼容 v7，**不再兼容 npm v6** |

- v3 移除了 v1 风格冗余的 `dependencies` 段，只保留扁平的 `packages` 段，更紧凑。
- 团队若混用 npm 6 与 9+，会因格式重写产生大量 lockfile diff 噪音——统一 npm 大版本（用 `engines` + `packageManager` 约束）可避免。

## 二、发布流程与 dist-tag

完整的发布链路：

```bash
npm version minor                # 1.2.0 → 1.3.0，自动 git commit + tag v1.3.0
npm publish                      # 打包上传，并把 latest 指向 1.3.0
git push --follow-tags           # 推送 commit 与 tag
```

**dist-tag（分发标签）**是指向版本的命名指针。`latest` 是特殊标签：`npm i <pkg>` 不带 specifier 时默认装 `latest` 所指版本；`npm publish` 默认会把 `latest` 移到新版本。预发布时要避免污染 `latest`：

```bash
npm publish --tag beta           # 只更新 beta 标签，latest 不动
npm i mypkg@beta                 # 用户显式选 beta 才拿到预发布
npm dist-tag add mypkg@2.0.0-rc.1 next   # 给已发布版本另贴 next 标签
npm dist-tag ls mypkg            # 查看所有标签指向
```

> 语义化发布（semantic-release 等工具）会读 Conventional Commits 自动决定版本号、生成 changelog、打 tag 并 publish——本质是把上面这套流程自动化，是开源库 CI 的常见配置。

## 三、provenance：可验证的来源证明

供应链安全的关键能力。在 CI（如 GitHub Actions）中发布时开启：

```bash
npm publish --provenance --access public
```

- **provenance** 为发布物附上**可验证的来源证明**：把 tarball 与构建它的**源码仓库、commit、CI 工作流**绑定，登记到公开透明日志（Sigstore）。
- 使用方能验证「这个包确实由该仓库的该流水线构建」，对抗**依赖投毒**（攻击者发布同名恶意包）。
- 配套：`publish token` 用细粒度/自动化 token（而非长期个人 token）做发布鉴权；账号开 2FA。

## 四、生命周期脚本：最大攻击面

`postinstall` 等脚本在**安装依赖时自动执行任意代码**，是近年供应链攻击的高发入口（窃取环境变量、植入挖矿/后门）：

```bash
npm install --ignore-scripts          # 单次跳过所有生命周期脚本
```

```ini
# .npmrc —— 全局禁用（CI 推荐）
ignore-scripts=true
```

- 默认 npm **不沙箱**脚本——它们以当前用户权限运行，能读你的 `~/.npmrc`（含 token）、环境变量。
- 防御组合：CI 设 `ignore-scripts=true`；用 lockfile + `npm ci` 固定版本；关键依赖人工审计；考虑 `--omit=optional` 减少攻击面；用 Socket、Snyk 等做依赖体检。
- 注意：禁用脚本后，某些依赖（需原生编译的）可能无法正常工作，需评估白名单。

## 五、npm 在 2026 的生态位

```text
基线层：npm（随 Node 分发，零安装）
优化层：pnpm（省盘、杜绝幽灵依赖）· yarn（PnP/插件）· bun（极速 + 运行时）
编排层：Turborepo · Nx（在 workspaces 之上做任务调度与缓存）
```

- npm 不追求「最快/最省」，而是守住**最低公分母**：任何 Node 环境都能直接用，文档/CI 模板/教程默认以它为准。
- 性能敏感、大型 monorepo 团队多迁 pnpm；但库作者发布、最小化依赖的工具、教学示例仍偏好 npm 的「无需额外安装」。

## 六、Corepack 与 packageManager（务必记准的时效）

`package.json` 的 `packageManager` 字段（如 `"packageManager": "pnpm@9.0.0"`）原本配合 **Corepack** 使用——Corepack 读它，自动准备/调用指定版本的包管理器，让「项目锁定 PM 版本」开箱即用。

**2026 关键事实（以官方为准）**：

- Corepack 由 **Node 16.9** 引入，长期为**实验性**。
- **Node.js TSC 于 2025-03-19 投票通过「停止随 Node 发行版分发 Corepack」**。
- **结果：Node 25+ 不再内置 Corepack、Node 26 LTS 也不含；Node 24 及之前（含其 LTS）仍内置但保持实验性。**
- Corepack **本身不消失**——它将作为**可独立安装的包**继续存在：`npm i -g corepack`。

> 实务影响：依赖「Node 自带 corepack」的 CI 脚本，在升级到 Node 25+ 后会失效，需显式 `npm i -g corepack` 或改用 `setup-node` 的 PM 缓存能力。`packageManager` 字段本身仍合法、仍被独立安装的 Corepack 读取——变的只是「Corepack 还在不在 Node 发行版里」。
