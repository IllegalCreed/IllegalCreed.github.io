---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 npm 官方文档（docs.npmjs.com）+ pnpm Supply Chain Security + MDN SRI + SLSA v1.0 spec + CycloneDX 1.7 + IBM audit-ci 编写，对照 npm CLI v10 / pnpm v10+ 稳定版

## 速查

- 三条主线：**消费端**（lockfile / `npm ci` / `ignore-scripts` / `npm audit` / `.npmrc` / lockfile-lint / SRI）+ **发布端**（`npm publish --provenance` / Sigstore / SLSA / SBOM）+ **架构层**（私有 scope 锁定防 dependency confusion）
- 安装命令：CI 用 `npm ci`（不可改 lockfile）/ `pnpm install --frozen-lockfile`；lockfile 必须提交版本库
- npm audit：`--audit-level=low/moderate/high/critical`（**只改阈值不过滤报告**）；`fix --force` 允许 SemVer major 跳变（危险）
- npm audit signatures：**registry signatures**（ECDSA，所有包都有）vs **attestations**（带 provenance 的包才有）
- SRI：`<script integrity="sha256-... sha384-..." crossorigin="anonymous">`，空格分隔多 hash，浏览器选最强算法
- SLSA 三级：L1 provenance 存在 / L2 托管签名 / L3 构建隔离
- CycloneDX vs SPDX：CycloneDX（ECMA-424，原生 VEX）/ SPDX（ISO 5962:2021，许可证合规强）
- 关键默认：`strict-ssl=true`（默认，**别关**）/ `ignore-scripts=false`（npm 默认开脚本）
- `.npmrc` 优先级：命令行 > `npm_config_*` > 项目 > 用户 > 全局 > 内置
- 完整说明见 [入门](./getting-started.md) / [核心防护实践](./guide-line.md)

## 防护层级完整表

### 消费端

| 层 | 工具 / 做法 | 命令示例 | 防什么 |
| --- | --- | --- | --- |
| lockfile 锁定 | `npm ci` | `npm ci` | 依赖树漂移、lockfile 被悄悄篡改 |
| lockfile 锁定（pnpm） | `pnpm install --frozen-lockfile` | `pnpm install --frozen-lockfile` | 同上 |
| 禁脚本（npm） | `.npmrc ignore-scripts=true` | `npm config set ignore-scripts true` | postinstall 投毒 |
| 禁脚本（pnpm） | 默认禁 + `onlyBuiltDependencies`/`allowBuilds` 白名单 | `pnpm-workspace.yaml` | 同上，且保留可信构建 |
| CVE 扫描 | `npm audit --audit-level=high` | `npm audit --audit-level=high` | 已知漏洞进入依赖树 |
| CVE 扫描（精细化） | audit-ci | `audit-ci --config .audit-ci.jsonc` | 含 allowlist + expiry |
| lockfile-lint | `npx lockfile-lint` | `--allowed-hosts npm yarn --validate-https` | lockfile 注入非预期 host |
| SRI | HTML `integrity` + `crossorigin` | `<script integrity="sha384-..." crossorigin="anonymous">` | CDN 资源被替换 |
| .npmrc | `strict-ssl`/`@scope:registry=`/`cafile` | `.npmrc` | MITM / dependency confusion |
| sigstore 验证 | `npm audit signatures` | `npm audit signatures` | 包来源可验证 |

### 发布端

| 层 | 工具 / 做法 | 命令示例 | 防什么 |
| --- | --- | --- | --- |
| provenance | `npm publish --provenance` | `npm publish --provenance` | 下游可验证「这包从这条 CI 出来」 |
| SLSA 等级 | L1 → L2 → L3 | 配置 CI 满足各级要求 | 量化构建可信度 |
| Sigstore | Fulcio CA + Rekor + Cosign | 自动通过 OIDC | keyless 签名 |
| SBOM 归档 | `@cyclonedx/cyclonedx-npm` | `--output-file bom.json` | 合规 + 反查 CVE 组件 |

### 架构层

| 层 | 工具 / 做法 | 防什么 |
| --- | --- | --- |
| 私有 scope 锁定 | `.npmrc` `@mycorp:registry=` | dependency confusion |
| 同名包抢注 | 公共 registry 占位 | dependency confusion |
| virtual registry | Artifactory / Nexus / CodeArtifact 查找顺序 | dependency confusion |

## 工具命令清单

### npm

```bash
# CI 安装（确定性，需 lockfile，不可改）
npm ci

# 审计
npm audit                          # 列全部
npm audit --audit-level=high       # high 以上 exit 非零
npm audit --omit=dev               # 排除 devDependencies
npm audit fix                      # 自动升级（不破 SemVer）
npm audit fix --dry-run            # 预览变更（推荐先看）
npm audit fix --force              # ⚠️ 允许 major 跳变
npm audit signatures               # 验证签名 + provenance

# 发布
npm publish --provenance           # 启用 provenance
npm publish --provenance --access public
```

### pnpm

```bash
# CI 安装
pnpm install --frozen-lockfile

# 审计（pnpm v9+ 自带）
pnpm audit --audit-level=high
```

**pnpm-workspace.yaml 关键配置**

```yaml
# 白名单允许跑构建脚本的依赖（v10 字段名）
onlyBuiltDependencies:
  - esbuild
  - swc
  - prisma
# v11 起改名为 allowBuilds：
# allowBuilds: [esbuild, swc, prisma]

# 默认延迟引入新版本（v11 默认 1440 分钟 = 1 天）
minimumReleaseAge: 1440

# 阻止信任等级降低的版本
trustPolicy: no-downgrade

# 阻止外来 URL 子依赖
blockExoticSubdeps: true

# 强制传递依赖版本（临时止血）
overrides:
  lodash: 4.17.21
```

### SRI 生成

```bash
# 命令行（openssl）
cat lib.js | openssl dgst -sha384 -binary | openssl base64 -A
# 输出：sha384-<base64hash>

# 或在线工具：https://www.srihash.org/
```

### CycloneDX SBOM

```bash
npx @cyclonedx/cyclonedx-npm \
  --output-file bom.json \
  --output-format JSON \
  --spec-version 1.5
```

### lockfile-lint

```bash
npx lockfile-lint --path package-lock.json --type npm \
  --allowed-hosts npm yarn --validate-https
```

### audit-ci 配置（`.audit-ci.jsonc`）

```json
{
  "moderate": true,
  "allowlist": [
    "axios",
    "GHSA-xxxx-xxxx-xxxx",
    "pkg>pkg>pkg"
  ]
}
```

## SRI 语法完整表

| 元素 | 属性 | 示例 |
| --- | --- | --- |
| `<script>` | `integrity` + `crossorigin` | `<script src="cdn" integrity="sha384-..." crossorigin="anonymous">` |
| `<link>` | `integrity` + `crossorigin` | `<link rel="stylesheet" href="cdn" integrity="sha384-..." crossorigin="anonymous">` |

**关键规则**

- 空格分隔多 hash：`integrity="sha256-... sha384-... sha512-..."`
- 浏览器选**最强算法**（SHA-256 < 384 < 512）
- 同算法多 hash：**任一匹配即通过**
- 完全不匹配 → 返回**网络错误**，阻止执行
- `crossorigin="anonymous"` 强制（防 XS-Leak），CDN 需返回 `Access-Control-Allow-Origin`

**HTTP 层**：`Integrity-Policy: blocked-destinations=(script), endpoints=(...)` 强制 SRI。

## npm audit signatures 输出

```
Verified 52 signatures and 12 attestations in 1247 packages
```

| 类别 | 含义 |
| --- | --- |
| **registry signatures**（ECDSA） | 所有包都有，由 npm registry 签发 |
| **attestations**（带 provenance 的包才有） | 用 `npm publish --provenance` 发布的包才会被验证 |

## audit-ci allowlist 精度

| 精度 | 写法 | 含义 |
| --- | --- | --- |
| **module** | `"axios"` | 该包所有漏洞豁免（**不含传递依赖**） |
| **advisory** | `"GHSA-xxxx-xxxx-xxxx"` | 按 GHSA ID 精确豁免 |
| **path** | `"pkg>pkg>pkg"` 含 `*` 通配 | 按依赖链路精确豁免 |

**NSPRecord 对象**：

```json
{
  "active": true,
  "expiry": "2026-12-31",
  "notes": "等待上游 X 修复，预计 Q4 发版"
}
```

## SLSA Build L0-L3

| 级别 | 要求 | 实践 |
| --- | --- | --- |
| **L1** | provenance **存在**（可未签名） | 任何 CI 输出 |
| **L2** | 托管平台生成并**签名** provenance | GitHub Actions / GitLab CI 自动满足 |
| **L3** | 构建平台**硬隔离**防篡改，签名密钥对构建步骤不可见 | 需隔离构建机 + 参数化 |

> `npm publish --provenance` 把包从 L1 提到 L2（GitHub Actions 是托管平台自动签名）。

## Sigstore 三组件

| 组件 | 作用 |
| --- | --- |
| **Fulcio CA** | 基于 OIDC token 签发**短期临时证书**（keyless 核心） |
| **Rekor** | 不可篡改的**透明日志账本**（公开可审计） |
| **Cosign / CLI** | 签名 / 验证工具 |

**keyless 原理**：用 OIDC 身份（GitHub Actions / GitLab CI 的 short-lived token）替代长期密钥，验证方查透明日志确认签名发生过。

## CycloneDX vs SPDX

| 维度 | CycloneDX | SPDX |
| --- | --- | --- |
| 标准 | Ecma TC54 / **ECMA-424** | Linux Foundation / **ISO/IEC 5962:2021** |
| VEX | 原生内嵌 | 走单独 profile |
| 依赖图 | 完整 | 较弱 |
| CI/CD 性能 | 优化 | 较重 |
| 起点强项 | 漏洞管理 | 许可证合规 |
| 当前版本 | 1.7（2025-10-21，ECMA-424） | 2.4 |

## .npmrc 配置完整表

| 配置 | 作用 | 默认 |
| --- | --- | --- |
| `ignore-scripts=true` | 禁 lifecycle 脚本 | false（npm 默认开脚本） |
| `strict-ssl=true` | 强制 HTTPS 验证 | **true（默认，别关）** |
| `registry=` | 默认 registry | `https://registry.npmjs.org/` |
| `@scope:registry=` | 把 scope 锁到私有 registry | - |
| `always-auth` | 每次请求都带认证 | false |
| `//host/:_authToken=` | 鉴权 token | - |
| `cafile=` | 自定义 CA 证书路径 | - |
| `provenance=true` | 发布时启用 provenance | false |
| `unsafe-perm` | root 时以 root 跑脚本 | root 默认 false，非 root true |

**配置优先级链**（高 → 低）：命令行 flag > `npm_config_*` 环境变量 > 项目 `.npmrc` > 用户 `~/.npmrc` > 全局 `$PREFIX/etc/npmrc` > 内置默认。

## 版本与生态（2026-07）

| 项 | 取值 |
| --- | --- |
| npm CLI 主流版本 | **v10** |
| provenance 起始版本 | npm 9.5.0+（要求 GitHub Actions / GitLab 云端托管 runner，不支持自托管） |
| npm scripts lifecycle | v7+ 已稳定，`prepare` 在 v7+ 改为后台运行，需 `--foreground-scripts` |
| pnpm 默认禁 postinstall | **v10** 起（2025） |
| pnpm `allowBuilds` + `minimumReleaseAge` 默认 | **v11** 起（默认 minimumReleaseAge=1440 分钟即 1 天） |
| CycloneDX 当前版本 | **1.7**（ECMA-424，2025-10-21 发布）；1.5/1.6 在工具链最常见 |
| SLSA spec | **v1.0** 稳定（Build track L0-L3） |

## 官方资源

- MDN SRI：[https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Subresource_Integrity](https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Subresource_Integrity)
- npm Generating Provenance Statements：[https://docs.npmjs.com/generating-provenance-statements](https://docs.npmjs.com/generating-provenance-statements)
- npm-audit：[https://docs.npmjs.com/cli/v10/commands/npm-audit](https://docs.npmjs.com/cli/v10/commands/npm-audit)
- npm-scripts：[https://docs.npmjs.com/using-npm/scripts](https://docs.npmjs.com/using-npm/scripts)
- npm-config：[https://docs.npmjs.com/cli/v10/using-npm/config](https://docs.npmjs.com/cli/v10/using-npm/config)
- pnpm Supply Chain Security：[https://pnpm.io/supply-chain-security](https://pnpm.io/supply-chain-security)
- SLSA v1.0 Levels：[https://slsa.dev/spec/v1.0/levels](https://slsa.dev/spec/v1.0/levels)
- CycloneDX 1.7（ECMA-424）：[https://cyclonedx.org/specification/overview/](https://cyclonedx.org/specification/overview/)
- srihash.org（在线生成 SRI）：[https://www.srihash.org/](https://www.srihash.org/)
- Sigstore：[https://www.sigstore.dev/](https://www.sigstore.dev/)
- audit-ci：[https://github.com/IBM/audit-ci](https://github.com/IBM/audit-ci)
- lockfile-lint：[https://github.com/lirantal/lockfile-lint](https://github.com/lirantal/lockfile-lint)
- cyclonedx-npm：[https://github.com/CycloneDX/cyclonedx-npm](https://github.com/CycloneDX/cyclonedx-npm)
- npm blog（安全公告）：[https://github.blog/tag/npm/](https://github.blog/tag/npm/)
