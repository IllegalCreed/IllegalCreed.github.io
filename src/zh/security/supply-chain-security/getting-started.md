---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 npm 官方文档（docs.npmjs.com）+ pnpm Supply Chain Security + MDN SRI + SLSA v1.0 spec + CycloneDX 1.7 编写，对照 npm CLI v10 / pnpm v10+ 稳定版行为

## 速查

- 三条主线：**消费端**（lockfile / `npm ci` / `ignore-scripts` / `npm audit` / `.npmrc` / lockfile-lint / SRI）+ **发布端**（`npm publish --provenance` / Sigstore / SLSA / SBOM）+ **架构层**（私有 scope 锁定防 dependency confusion）
- 安装命令对比：`npm ci`（需 lockfile，**不可改 lockfile**，移除 node_modules 重装）/ `npm install`（**会改写 lockfile**）/ `pnpm install --frozen-lockfile`（CI 用）/ `pnpm install`（默认允许写）
- 安装脚本：npm 默认开 postinstall，pnpm v10+ **默认禁**，白名单字段 `onlyBuiltDependencies`（v11 改名 `allowBuilds`）
- npm audit：`--audit-level=low/moderate/high/critical`（**只改阈值不过滤报告**）；`npm audit fix --force` 允许 SemVer major 跳变，**危险**
- npm audit signatures 验证两类：**registry signatures**（ECDSA，所有包都有）vs **attestations**（带 provenance 的包才有）
- SRI：`<script integrity="sha384-..." crossorigin="anonymous">`；空格分隔多 hash，浏览器选最强算法；同算法任一匹配即通过
- SLSA 三级：**L1** provenance 存在（可未签名）/ **L2** 托管平台生成并签名 / **L3** 构建平台硬隔离、密钥对构建步骤不可见
- CycloneDX vs SPDX：CycloneDX（Ecma TC54 / ECMA-424，原生 VEX，依赖图完整）/ SPDX（Linux Foundation / ISO 5962:2021，许可证合规强，VEX 走单独 profile）
- `.npmrc` 配置优先级：命令行 > `npm_config_*` 环境变量 > 项目 .npmrc > 用户 ~/.npmrc > 全局 > 内置默认
- 关键默认值：`strict-ssl=true`（默认开，**别关**）/ `ignore-scripts=false`（npm 默认开脚本，是攻击面）

## 供应链安全是什么

供应链安全在前端 / Node 语境下，特指**保护 npm/前端依赖从「发布端 → 消费端」这条链路不被篡改、不投毒**。它的核心定位有三：

- **多层防御**：lockfile / audit / lockfile-lint / SBOM / SRI / provenance 各管一段，互补覆盖不同攻击面
- **可审计**：lockfile 是依赖完整性与来源 hash 的可审计清单，SBOM 让「是否含某 CVE 组件」可机器查询
- **可验证**：provenance + Sigstore 让下游能验证「这个包确实由这条 CI 构建」，不靠盲信 maintainer 账号

> 供应链安全 ≠ 源码 SAST/DAST 静态分析，≠ 运行时 XSS/CSRF/SSRF，≠ 容器镜像签名（cosign for OCI），≠ TLS 证书管理。本页只覆盖「npm 依赖链路 + 运行时与依赖完整性直接相关的 SRI」。

## npm 生态风险速览

| 攻击向量 | 入口 | 典型案例 / 形态 |
| --- | --- | --- |
| **typosquatting**（抢注） | 用户拼错包名 | `loadsh` 冒充 `lodash`、`react-native` 后缀变种 |
| **account takeover** | maintainer 账号被盗 | 2021 `ua-parser-js` / `coa` / `rc` 被植入挖矿/窃密 |
| **dependency confusion** | 私有包名在公共 registry 未占位 | Alex Birsan 用此手法打进过 Apple / Microsoft |
| **postinstall 投毒** | lifecycle 脚本执行任意代码 | 2018 `event-stream`、2024 多起 npm 包 postinstall 投毒 |
| **provenance 缺失** | 包无「where & how built」可验证链接 | 攻击者 fork 后重新发布，下游无法识别 |
| **registry MITM** | 中间人替换 tarball | 关闭 `strict-ssl` 或被劫持代理时可注入 |
| **lockfile 漂移** | CI 用 `npm install` 改写 lockfile | PR 中插入恶意版本被写入 lockfile 上线 |
| **CDN 篡改** | 跨域 CDN 资源被替换 | 无 SRI 的 `<script src=cdn>` 被改内容 |

> postinstall 是 npm 投毒最常用的载体——它执行时机晚于杀软扫描、可读 env 凭据、跨平台执行任意 JS。

## 防护层级（消费端 / 发布端 / 架构层）

### 消费端：你装的依赖

| 层 | 工具 / 做法 | 防什么 |
| --- | --- | --- |
| **lockfile 锁定** | `npm ci` / `pnpm install --frozen-lockfile` + 提交 lockfile | 防依赖树漂移、lockfile 被悄悄篡改 |
| **禁用/白名单安装脚本** | `.npmrc ignore-scripts=true` / pnpm v10 默认禁 + `allowBuilds` 白名单 | 防 postinstall 投毒 |
| **CVE 扫描** | `npm audit --audit-level=high` / audit-ci | 防已知漏洞进入依赖树 |
| **lockfile-lint** | `npx lockfile-lint --allowed-hosts npm yarn --validate-https` | 防 lockfile 注入非预期 registry/host |
| **SRI** | `<script integrity="sha384-..." crossorigin="anonymous">` | 防 CDN 资源被替换 |
| **.npmrc 配置** | `strict-ssl=true` / `@scope:registry=` / `cafile=` | 防 MITM、防 dependency confusion |

### 发布端：你发布的包

| 层 | 工具 / 做法 | 防什么 |
| --- | --- | --- |
| **provenance 签名** | `npm publish --provenance`（GitHub Actions / GitLab OIDC） | 让下游可验证「这包从这条 CI 出来」 |
| **SLSA 等级** | L1 → L2（托管签名）→ L3（构建隔离） | 量化构建可信度 |
| **Sigstore** | Fulcio CA + Rekor 透明日志 + Cosign | keyless 签名，验证方查透明日志 |
| **SBOM 归档** | `@cyclonedx/cyclonedx-npm` 输出 bom.json 随 release | 满足合规 + 反查「是否含某 CVE 组件」 |

### 架构层：你的私包生态

- **私有 scope 锁定**：`.npmrc` 用 `@mycorp:registry=` 把内部 scope 锁到私有 registry，且**禁止回退公共 registry**
- **同名包抢注**：在公共 registry 抢注同名 / 同 scope 占位包，防 dependency confusion
- **virtual registry**：Artifactory / Nexus / CodeArtifact 配置正确的查找顺序（私有先于公共）

## 最小防护清单（开箱即用）

```bash
# 1. CI 用 ci 而非 install（确定性、不改 lockfile）
npm ci            # npm
pnpm install --frozen-lockfile   # pnpm

# 2. 设审计阈值，让 CI 在高危漏洞处失败
npm audit --audit-level=high

# 3. 禁用安装脚本（npm），或用白名单（pnpm）
# .npmrc:
# ignore-scripts=true
# pnpm-workspace.yaml:
# onlyBuiltDependencies: [esbuild, swc]

# 4. lockfile-lint 校验 host 白名单 + HTTPS
npx lockfile-lint --path package-lock.json --type npm \
  --allowed-hosts npm yarn --validate-https

# 5. 发布自有包时启用 provenance
npm publish --provenance
```

> 本仓库（quiz-monorepo）`apps/quiz-backend` 自带 `postinstall: pnpm run prisma:generate`——若在 backend 子包无差别 `ignore-scripts=true` 会破坏 prisma client 生成，必须用 pnpm 的 `onlyBuiltDependencies`/`allowBuilds` 白名单方式精细放行。

## 下一步

- [核心防护实践](./guide-line.md)：依赖投毒防御、lockfile 锁定、SRI 完整性、npm audit / audit-ci、SBOM、sigstore 签名、.npmrc 配置、反模式
- [参考](./reference.md)：防护层级表、工具命令清单、版本变化、官方资源
