---
layout: doc
outline: [2, 3]
---

# 核心防护实践

> 基于 npm 官方文档（docs.npmjs.com）+ pnpm Supply Chain Security + MDN SRI + SLSA v1.0 spec + CycloneDX 1.7 + IBM audit-ci 编写，对照 npm CLI v10 / pnpm v10+ 稳定版

## 速查

- **依赖投毒三件套**：typosquatting（拼错抢注）/ install scripts 投毒（postinstall）/ dependency confusion（私有名公共 registry 抢先发布）
- **lockfile 锁定**：CI 用 `npm ci`（不可改 lockfile）/ `pnpm install --frozen-lockfile`；lockfile 必须提交版本库
- **禁脚本**：`.npmrc ignore-scripts=true`（npm）or pnpm v10 默认禁 + `onlyBuiltDependencies`/`allowBuilds` 白名单（推荐）
- **SRI 语法**：`<script integrity="sha256-... sha384-..." crossorigin="anonymous">`，空格分隔多 hash，浏览器选最强算法；同算法任一匹配即通过
- **SRI 强制 crossorigin**：no-cors 模式启用 SRI 会带来 XS-Leak（推断跨域内容）；CDN 需返回 `Access-Control-Allow-Origin`
- **npm audit**：`--audit-level` 取值 null/info/low/moderate/high/critical/none，**只改阈值不过滤报告**；`fix --force` 允许 SemVer major 跳变（危险）
- **audit-ci 三精度 allowlist**：module（不含传递依赖）/ advisory（GHSA ID）/ path（含 `*` 通配符 + `pkg>pkg>pkg`）；NSPRecord 有 expiry/active/notes
- **SBOM**：`@cyclonedx/cyclonedx-npm --output-file bom.json --output-format JSON --spec-version 1.5`；VEX 字段声明「受影响但不 exploitable」
- **provenance 前置**：npm CLI 9.5.0+ / `package.json.repository` 公开且与 CI 来源大小写敏感匹配 / GitHub Actions 或 GitLab 云端托管 runner / `permissions.id-token: write`
- **sigstore keyless**：Fulcio CA（OIDC 签发短期证书）+ Rekor（不可篡改透明日志）+ Cosign/CLI
- **.npmrc 关键项**：`ignore-scripts=true`、`strict-ssl=true`（默认）、`@scope:registry=`、`always-auth`、`//host/:_authToken=${NPM_TOKEN}`、`cafile=`
- **反模式**：明文写 token 到项目 .npmrc 提交、`strict-ssl=false`、`npm audit fix --force` 不 dry-run、SRI 漏 crossorigin、`dangerouslyAllowAllBuilds: true`

## 依赖投毒防御

### typosquatting（拼写抢注）

攻击者注册与热门包**拼写相似**的包名（`loadsh` vs `lodash`、`react-native` 后缀变种），等用户 `npm i` 拼错时植入恶意代码。

**防御**

- 安装前核对包名（npm 官网 / `npm view <pkg>` 检查 maintainer、周下载量、最近版本时间）
- 用 lockfile 锁定（已安装的包不会因为拼写错误被替换）
- 工具：`can-i-ignore-scripts` 评估安装脚本、Socket Dev 等扫描服务

### install scripts 投毒（postinstall）

npm lifecycle 脚本顺序（install 时）：`preinstall` → `install` → `postinstall` → `prepublish`（已弃用）→ `preprepare` → `prepare` → `postprepare`。`npm@7+` 起 `prepare` 在后台运行。

**为何 postinstall 是投毒首选**

- 执行时机晚于杀软扫描
- 可读 env 凭据（`process.env.NPM_TOKEN` / `AWS_*`）
- 跨平台执行任意 JS（无需触发构建即被 install）
- 涉及面广（一个包被传递依赖到几千项目就放大几千倍）

**防御**

```bash
# npm：项目 .npmrc
ignore-scripts=true

# pnpm v10+：默认已禁，用白名单显式放行可信构建脚本
# pnpm-workspace.yaml:
# onlyBuiltDependencies:    # v11 起改名为 allowBuilds
#   - esbuild
#   - swc
#   - prisma
```

> 本仓库 `apps/quiz-backend` 的 `postinstall: pnpm run prisma:generate` 必须白名单放行 prisma，否则 client 生成失败。

### dependency confusion（依赖混淆）

私有 scope 包名（如 `@mycorp/utils`）在公共 npm registry 未占位 → 攻击者抢注同名包 + 你的 CI 配置允许从公共 registry 拉取 → 私有包被公共同名恶意包替换。Alex Birsan 2021 用此手法打进过 Apple、Microsoft、PayPal 等 35+ 公司。

**防御三件套**

- `.npmrc` 用 `@mycorp:registry=` 把内部 scope 锁到私有 registry，且**禁止回退公共 registry**
- 在公共 registry **抢注同名 / 同 scope 占位**包（占位即预防）
- virtual registry（Artifactory / Nexus / CodeArtifact）配置正确的查找顺序（私有先于公共）

## lockfile 锁定与 `npm ci`

### `npm ci` vs `npm install`

| 维度 | `npm ci` | `npm install` |
| --- | --- | --- |
| 是否需要 lockfile | **是**（缺失直接报错） | 否 |
| 是否修改 lockfile | **否** | **是** |
| 是否删除现有 node_modules | 是（清空重装） | 否 |
| 安装速度 | 更快（已有依赖图） | 慢 |
| 确定性 | 完全按 lockfile | 受 semver 范围 + registry 元数据影响 |
| 适用 | **CI / 生产部署** | 本地开发新装包 |

> pnpm 等价物：`pnpm install --frozen-lockfile`（CI）/ `pnpm install`（默认允许写 lockfile）。

### lockfile 必须提交版本库

`package-lock.json` / `pnpm-lock.yaml` 是**依赖完整性与来源 hash 的可审计清单**：

- 每个 tarball 都带 `integrity: sha512-...` 字段
- PR review 能让 lockfile 的可疑改动可见（新包、版本跳变、host 异常）
- CI 用 `npm ci` 保证本地、CI、生产环境装出来的依赖树完全一致

## SRI（Subresource Integrity）

### 语法

```html
<script src="https://cdn.example.com/lib.js"
        integrity="sha256-abc... sha384-def... sha512-ghi..."
        crossorigin="anonymous"></script>
```

**关键规则**

- `integrity` 用**空格分隔多 hash**，浏览器选**最强算法**（SHA-256 < SHA-384 < SHA-512）
- **同算法**多 hash：任一匹配即通过
- 完全不匹配 → 返回**网络错误**，阻止执行
- `crossorigin="anonymous"` 是**强制**（见下文）

### 生成 SRI hash

```bash
# 命令行（openssl）
cat lib.js | openssl dgst -sha384 -binary | openssl base64 -A
# 输出：sha384-<base64hash>

# 或在线工具：https://www.srihash.org/
```

### 为何强制 `crossorigin="anonymous"`

no-cors 模式下启用 SRI 会带来 **XS-Leak**——攻击者可借加载成功 / 失败事件**推断跨域资源内容**。浏览器要求 SRI 切换到 CORS 模式（`crossorigin="anonymous"`），CDN 必须返回 `Access-Control-Allow-Origin` 头。

> 若只加 `integrity` 漏了 `crossorigin`，浏览器拒绝校验 → **脚本反而加载不出来**。

### Integrity-Policy HTTP 头

`Integrity-Policy: blocked-destinations=(script), endpoints=(...)` 在 HTTP 层强制 SRI（适用于自有站点统一管控）。

## npm audit / audit-ci

### npm audit 基础

```bash
npm audit                       # 列出全部漏洞
npm audit --audit-level=high    # 仅当存在 high 以上时让命令 exit 非零
npm audit fix                   # 自动升级不破坏 SemVer 的修复
npm audit fix --force           # ⚠️ 允许 major 跳变（包括 breaking change）
npm audit signatures            # 验证 registry 签名 + provenance attestation
```

**`--audit-level` 取值**：`null` / `info` / `low` / `moderate` / `high` / `critical` / `none`。

> **关键陷阱**：`--audit-level` **只改阈值不过滤报告**——它决定命令 exit code，但漏洞清单仍全部列出。要「过滤报告」需配合 `--omit=dev` 或第三方工具。

**`npm audit fix --force` 为何危险**

npm 官方明文警告：`--force` 允许 **SemVer 主版本变更**（包括 breaking change），可能直接打断生产构建。正确流程是先 `--dry-run` 评估影响。

### npm audit signatures

```
Verified 52 signatures and 12 attestations in 1247 packages
```

- **registry signatures**（ECDSA）：所有包都有，由 npm registry 签发
- **attestations**（带 provenance 的包才有）：用 `npm publish --provenance` 发布的包才会被验证

### audit-ci（IBM）

更精细的策略工具，支持：

- **配置文件**：`.audit-ci.jsonc`
- **阈值**：`low/moderate/high/critical: true` 任一为阈值
- **allowlist 三种精度**

| 精度 | 写法 | 含义 |
| --- | --- | --- |
| module | `"axios"` | 该包所有漏洞豁免（**不含传递依赖**） |
| advisory | `"GHSA-xxxx-xxxx-xxxx"` | 按 GHSA ID 精确豁免 |
| path | `"pkg>pkg>pkg"` 含 `*` 通配 | 按依赖链路精确豁免 |

- **NSPRecord 对象**：`{ active: true, expiry: "2026-12-31", notes: "..." }` 防止豁免被遗忘

> 把 allowlist 当永久豁免不设 expiry 是反模式——漏洞豁免会沉淀成永久债。

## SBOM（CycloneDX）

### 工具

```bash
# 生成 bom.json
npx @cyclonedx/cyclonedx-npm \
  --output-file bom.json \
  --output-format JSON \
  --spec-version 1.5
```

**BOM 媒体类型**：`application/vnd.cyclonedx+json; version=1.7`，predicate `https://cyclonedx.org/bom`。

**字段**：`components` / `dependencies` / `services` / `vulnerabilities` / `VEX`。

### CycloneDX vs SPDX

| 维度 | CycloneDX | SPDX |
| --- | --- | --- |
| 标准 | Ecma TC54 / **ECMA-424** | Linux Foundation / **ISO/IEC 5962:2021** |
| VEX | 原生内嵌 | 走单独 profile |
| 依赖图 | 完整 | 较弱 |
| CI/CD 性能 | 优化 | 较重 |
| 起点强项 | 漏洞管理 | 许可证合规 |

### SBOM 的实际价值

- **合规**：满足 EU CRA / EO 14028（关键基础设施网络安全）
- **反查**：「Log4Shell 爆出后，我的哪个 release 含 Log4j 2.14?」→ 直接 grep `bom.json`
- **VEX**：声明「受影响但不 exploitable」减少误报噪音

## sigstore 签名与 provenance

### `npm publish --provenance`

**前置条件**

- npm CLI **9.5.0+**
- `package.json.repository` 字段**公开**且与 CI 来源**大小写敏感匹配**
- GitHub Actions 或 GitLab CI **云端托管 runner**（不支持自托管）
- GitHub: `permissions.id-token: write`
- GitLab: `id_tokens.SIGSTORE_ID_TOKEN`

**配置**

```json
// package.json
{
  "publishConfig": {
    "provenance": true
  }
}
```

或环境变量 `NPM_CONFIG_PROVENANCE=true`。

### Sigstore 三组件

| 组件 | 作用 |
| --- | --- |
| **Fulcio CA** | 基于 OIDC token 签发**短期临时证书**（keyless 核心） |
| **Rekor** | 不可篡改的**透明日志账本**（公开可审计） |
| **Cosign / CLI** | 签名 / 验证工具 |

**keyless 原理**：用 OIDC 身份（GitHub Actions / GitLab CI 的 short-lived token）替代长期密钥，验证方查透明日志确认签名发生过。

### SLSA 三级

| 级别 | 要求 |
| --- | --- |
| **L1** | provenance **存在**（可未签名） |
| **L2** | 托管平台生成并**签名** provenance |
| **L3** | 构建平台**硬隔离**防篡改，签名密钥对构建步骤不可见 |

> `npm publish --provenance` 实际把包从 SLSA L1 提到 **L2**（GitHub Actions 是托管平台，自动签名 provenance）。

### 重要边界

`npm publish --provenance` 之后**不代表包是安全的**——官方明确 provenance 只提供「where & how built」的可验证链接，**不保证无恶意代码**，仍需源码审计。

## .npmrc 配置安全

### 关键配置项

| 配置 | 作用 | 默认 |
| --- | --- | --- |
| `ignore-scripts=true` | 禁 lifecycle 脚本 | false（npm 默认开脚本，**是攻击面**） |
| `strict-ssl=true` | 强制 HTTPS 验证 | **true（默认，别关）** |
| `registry=` | 默认 registry | `https://registry.npmjs.org/` |
| `@scope:registry=` | 把 scope 锁到私有 registry | - |
| `always-auth` | 每次请求都带认证 | false |
| `//host/:_authToken=` | 鉴权 token | - |
| `cafile=` | 自定义 CA 证书路径 | - |
| `provenance=true` | 发布时启用 provenance | false |

### 配置优先级链（高 → 低）

1. 命令行 flag
2. 环境变量 `npm_config_*`
3. 项目 `.npmrc`（仓库根）
4. 用户 `~/.npmrc`
5. 全局 `$PREFIX/etc/npmrc`
6. 内置默认

> 排查「为何这个包仍被安装」时沿这条链从高到低找覆盖。

### pnpm 配置（pnpm-workspace.yaml）

| 配置 | 作用 |
| --- | --- |
| `onlyBuiltDependencies` / v11 改名 `allowBuilds` | 白名单允许跑构建脚本的依赖 |
| `dangerouslyAllowAllBuilds` | 一放了之（**反模式**） |
| `minimumReleaseAge` | v11 默认 1440 分钟（1 天），延迟引入新版本 |
| `trustPolicy: no-downgrade` | 阻止信任等级降低的版本 |
| `blockExoticSubdeps: true` | 阻止外来 URL 子依赖 |
| `pnpm.overrides` | 强制传递依赖版本（临时止血，应跟踪上游修复后移除） |

### token 安全

**正确做法**：CI 用 secret 环境变量；项目 `.npmrc` 只写占位

```bash
//registry.npmjs.org/:_authToken=${NPM_TOKEN}
```

**反模式**：明文写 token 到项目 `.npmrc` 并提交到仓库。

## lockfile-lint（互补于 npm audit）

```bash
npx lockfile-lint --path package-lock.json --type npm \
  --allowed-hosts npm yarn --validate-https
```

**检查维度**

- `allowed-hosts`：依赖来源 host 是否在白名单
- `validate-https`：所有 URL 是否走 HTTPS
- 完整性：tarball integrity hash 是否存在

**为何与 npm audit 互补**

- npm audit 查**已知 CVE**（漏洞数据库）
- lockfile-lint 查**来源是否被替换**（lockfile 中被注入非预期 registry / host）
- 两者覆盖不同攻击面，**应并用**

> pnpm 因「lockfile 不维护 tarball 源」反而对 lockfile-lint **不敏感**，需用其他手段（如 `pnpm audit` + 自定义钩子）。

## 反模式（避坑）

- **明文 token 写进项目根 .npmrc 并提交**：token 应放 CI secret 环境变量或 `~/.npmrc`，项目级 .npmrc 仅写 `${NPM_TOKEN}` 占位
- **为「解决报错」随手设 `strict-ssl=false`**：开 MITM 大门，等同关掉 TLS 验证
- **`npm config set ignore-scripts false` 全局关掉**：让任意 postinstall 在你机器上执行任意代码
- **CI 用 `npm install` 而非 `npm ci`**：依赖树漂移、可被 PR 中插入的恶意版本污染
- **pnpm 用 `pnpm install` 而非 `install --frozen-lockfile`**：同上，CI 必须冻结 lockfile
- **无脑 `npm audit fix --force`**：允许 SemVer major 跳变（含 breaking change），可能直接打断生产构建；应先 `--dry-run`
- **CDN script 加 SRI 但漏 `crossorigin="anonymous"` 或 CDN 没配 CORS**：浏览器拒绝在 no-cors 下做 SRI 校验，脚本反而加载不出来
- **私有 scope 同名包在公共 registry 未占位**：典型 dependency confusion 入口
- **`dangerouslyAllowAllBuilds: true`**：把 pnpm v10 默认禁 postinstall 的保护全开，等于回到 npm 默认行为，丢失白名单审计价值
- **allowlist GHSA 标识当永久豁免不设 expiry**：audit-ci 的 NSPRecord 提供 expiry/active/notes 字段正是为了防止漏洞豁免被遗忘
- **以为 `npm publish --provenance` 后包就安全**：官方明确 provenance 只提供「where & how built」的可验证链接，**不保证无恶意代码**，仍需源码审计
- **用 `pnpm.overrides`/`overrides` 锁死 transitive 依赖到老旧版本长期不升级**：overrides 是临时止血，应跟踪上游修复后及时移除，否则债务累积到下次 major 升级爆雷

## 下一步

- [参考](./reference.md)：防护层级完整表、工具命令清单、版本变化、官方资源
