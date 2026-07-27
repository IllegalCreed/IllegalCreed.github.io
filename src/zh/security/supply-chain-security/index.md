---
layout: doc
---

# 供应链安全

供应链安全（Supply Chain Security）指**保护软件从「源码 → 依赖 → 构建 → 发布 → 消费」整条链路免受篡改与投毒**的工程实践。在前端 / Node 生态，这条链路的具体形态是：你写了自己的代码，再用 `npm install` / `pnpm install` 拉来成百上千个第三方包，每个包又自带传递依赖、安装脚本、tarball 完整性 hash，最终拼成 node_modules 跑进 CI、构建产物、甚至生产运行时——任何一个环节被攻击者插入恶意代码（typo 抢注、账号窃取、registry 中间人、postinstall 投毒、构建机器被入侵），都会沿链路放大到你和你的用户。防护围绕三条主线展开：**消费端**（lockfile 锁定、`npm ci` 确定性安装、`ignore-scripts` / pnpm v10 默认禁 postinstall、`npm audit` + `audit-ci`、`.npmrc` 配置、lockfile-lint、SRI 校验 CDN 资源）、**发布端**（`npm publish --provenance` + Sigstore 签名、SLSA Build L1→L3、SBOM 归档），以及**架构层**（私有 scope 锁定防 dependency confusion、virtual registry 配置）。截至 2026-07，npm CLI v10 是主流，provenance 自 9.5.0+ 支持；pnpm v10 默认禁用依赖 postinstall、v11 引入 `allowBuilds` + `minimumReleaseAge=1440` 分钟；CycloneDX 当前 1.7（ECMA-424）；SLSA v1.0 稳定。本仓库（quiz-monorepo）使用 pnpm workspace，`apps/quiz-backend` 自带 `postinstall: pnpm run prisma:generate`，若要禁脚本必须用 `onlyBuiltDependencies`/`allowBuilds` 白名单放行 prisma，而不是无差别 `ignore-scripts=true`。

## 评价

**优点**

- **可验证链路**：provenance + Sigstore 透明日志（Rekor）让「这个包是不是从这条 CI 出来的」可独立验证，不再只能盲信 maintainer 账号
- **多层防御**：lockfile / audit / lockfile-lint / SBOM / SRI 各管一段，互补覆盖 registry 篡改、CVE、host 注入、CDN 篡改不同攻击面
- **生态默认收敛**：pnpm v10+ 把 postinstall 默认关掉、npm CI 把 lockfile 锁死，工具链正把「安全默认」做成开箱即用
- **合规可量化**：SBOM（CycloneDX / SPDX）+ VEX 让「是否含某 CVE 组件」从人工 grep 变成可机器查询，满足 EU CRA / EO 14028
- **本地可控**：`.npmrc` + `pnpm-workspace.yaml` 配置项粒度细，可按 scope / 包 / 行为精确放行
- **CI 友好**：`npm ci` / `pnpm install --frozen-lockfile` / `audit-ci` / lockfile-lint 都设计成可一条命令塞进 pipeline

**缺点**

- **传递依赖不可见**：一个直接依赖可能拉来上千个传递依赖，仅靠 review package.json 完全看不到攻击面
- **provenance 不能保证代码无恶意**：官方明确它只提供「where & how built」的可验证链接，仍需源码审计
- **`npm audit` 噪音大**：dev-only / 不可达路径的漏洞也全部计入，容易疲劳；`--audit-level` 改阈值不过滤报告
- **豁免易沉淀成债**：audit-ci 的 allowlist 不设 expiry，GHSA 标识会被当永久豁免长期遗忘
- **配置优先级链长**：命令行 / 环境变量 / 项目 .npmrc / 用户 ~/.npmrc / 全局 / 内置，排查「为何这个包仍被安装」时易迷失
- **跨工具命名漂移**：pnpm `onlyBuiltDependencies`（v10）→ `allowBuilds`（v11），配置写法在不同版本不一致

## 文档地址

- [MDN - Subresource Integrity (SRI)](https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Subresource_Integrity)
- [npm 官方 - Generating Provenance Statements](https://docs.npmjs.com/generating-provenance-statements)
- [npm CLI v10 - npm-audit](https://docs.npmjs.com/cli/v10/commands/npm-audit) · [npm-scripts](https://docs.npmjs.com/using-npm/scripts) · [npm-config](https://docs.npmjs.com/cli/v10/using-npm/config)
- [pnpm 官方 - Supply Chain Security](https://pnpm.io/supply-chain-security)
- [SLSA v1.0 spec - Levels](https://slsa.dev/spec/v1.0/levels)
- [CycloneDX 1.7（ECMA-424）规范概述](https://cyclonedx.org/specification/overview/)

## GitHub地址

[npm/cli](https://github.com/npm/cli) · [pnpm/pnpm](https://github.com/pnpm/pnpm) · [sigstore/sigstore-js](https://github.com/sigstore/sigstore-js) · [CycloneDX/cyclonedx-npm](https://github.com/CycloneDX/cyclonedx-npm) · [IBM/audit-ci](https://github.com/IBM/audit-ci) · [lmammino/lockfile-lint](https://github.com/lirantal/lockfile-lint)

## 幻灯片地址

<a href="/SlideStack/supply-chain-security-slide/" target="_blank">供应链安全</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=712" target="_blank" rel="noopener noreferrer">供应链安全测试题</a>
