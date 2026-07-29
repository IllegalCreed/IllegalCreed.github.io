---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 GitHub 官方文档与 GitHub Blog 编写（github.com，2026.07 版本）

## 速查

- 官网：<https://github.com>
- 账号类型：**个人 Free / Pro** + **组织 Organization**（团队/企业）
- 仓库类型：**公开（Public）永久免费** / **私有（Private）**（Free 也已支持无限私有库）
- 协作核心流：**Fork → 分支 → Commit → Pull Request → Review → Merge**
- CI/CD：**GitHub Actions**（`.github/workflows/*.yml`）
- 包仓库：**GitHub Packages**（npm/Docker/Maven/NuGet/RubyGems）
- 静态站：**GitHub Pages**（`&lt;user&gt;.github.io/<repo>`）
- AI 助手：**GitHub Copilot**（2026-06-01 转用量计费，按 GitHub AI Credits 计量）
- 免费额度：Actions **2000 分钟/月**（私有库；公开库无限制）/ Packages **500MB** / Pages 无限
- Team 计划：Actions **3000 分钟/月**
- Runner OS 倍率：Linux ×1、Windows ×2、macOS ×10
- 触发器：`push` / `pull_request` / `schedule` / `workflow_dispatch` / `repository_dispatch`
- 云端 IDE：**GitHub Codespaces**（按计算分钟计费）
- 代码安全：**Dependabot**（依赖漏洞）/ **Secret Scanning** / **CodeQL**

## GitHub 是什么

GitHub 是**把 Git 仓库社交化、云端化、生态化的平台**。与同类对比：

| 维度 | GitHub | GitLab | Gitee |
|---|---|---|---|
| 定位 | **开源生态霸主** | **一体化 DevOps 平台** | **国内代码托管** |
| 开源生态 | **全球第一** | 中 | 国内为主 |
| CI/CD | **Actions**（生态强） | **built-in**（深度集成） | Go（轻量） |
| AI 助手 | **Copilot**（领先） | Duo | AI 队友 |
| 私有库免费 | 无限 | 无限 | 无限 |
| 国内访问 | 慢 | 中 | **快** |
| 内容审核 | 无 | 无 | **公开库需审核** |
| 自托管 | Enterprise Server | CE/EE 可自建 | 企业版私有化 |

**核心结论**：参与开源 / 国际项目首选 **GitHub**；要一体化 DevOps 用 **GitLab**；要国内速度与合规用 **Gitee**。

## 账号与第一个仓库

1. 注册 <https://github.com/signup>（个人账号）
2. 点 `+` → **New repository**
3. 填仓库名、选 Public/Private、勾 `Add a README`、选 License（开源必加）
4. `git clone` 到本地即可开始

### 个人 vs 组织

| 类型 | 用途 | 计费 |
|---|---|---|
| **个人账号** | 个人项目 | Free / Pro（$4/mo）|
| **Organization** | 团队协作 | Free / Team（$4/user/mo）/ Enterprise |

组织（Organization）是团队托管的标准形态：成员权限分组、Team 管理、统一计费、Organization 级 Actions/Secrets。

## Pull Request 协作流

GitHub 把代码评审做成了「社交事件」，这是它最大的产品创新：

```
upstream/main ──┐
                ├─ 你 fork → 你的仓库
                └─ 你开分支 → commit → push
                              ↓
                        开 Pull Request
                              ↓
                   CI 自动跑 / Reviewer 评审
                              ↓
                          Merge
```

1. **Fork**（或对组织内仓库直接开分支）源仓库到自己空间
2. `git checkout -b feature/x` 开分支
3. 改代码、`git commit -m "..."`
4. `git push origin feature/x`
5. 在 GitHub 网页点 **Compare & pull request**
6. 填标题/描述，关联 Issue（`Closes #123`）
7. 等 CI（Actions）跑绿、Reviewer approve
8. **Squash and merge** / **Rebase and merge** / **Create merge commit**

`Closes #123` / `Fixes #123` / `Resolves #123` 会在 merge 时自动关闭对应 Issue。

## GitHub Actions —— CI/CD

声明式 yaml workflow，`.github/workflows/ci.yml`：

```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest       # 托管 Runner
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm test
      - run: npm run build
```

**关键概念**

| 概念 | 说明 |
|---|---|
| `workflow` | 一个 yml 文件，定义自动化流程 |
| `job` | 一组 steps，跑在同一个 Runner 上 |
| `step` | 单个动作（`uses:` 调 Action / `run:` 跑命令）|
| `runner` | 执行机器（`ubuntu-latest` / `windows-latest` / `macos-latest`）|
| `action` | 可复用步骤单元（Marketplace 上有海量）|
| `secrets` | 加密变量（`secrets.TOKEN`）|
| `artifacts` | 构建产物（`actions/upload-artifact`）|
| `matrix` | 多版本/多平台并行（node 18/20、os linux/mac）|

**免费额度（2026）**

| 计划 | Actions 分钟/月 | 备注 |
|---|---|---|
| Free | **2000** | 私有库；**公开库无限免费** |
| Pro | 3000 | 个人 |
| Team | 3000 | 团队 |
| Enterprise | 50000 | 企业 |

**OS 倍率**：Linux ×1（1 分钟 = 1 分钟）、Windows ×2、macOS ×10（即 macOS 跑 1 分钟扣 10 分钟额度）。

## GitHub Packages —— 制品库

把 npm/Docker/Maven 包和代码放一起管理：

```yaml
# 发布 npm 包到 GitHub Packages
- run: npm publish
  env:
    NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

`.npmrc` 指向 GitHub registry：

```
@your-scope:registry=https://npm.pkg.github.com
```

Docker 镜像推到 `ghcr.io/&lt;user&gt;/<image>`。免费额度 500MB（Packages 存储），Team 2GB。

## GitHub Pages —— 静态站

仓库即网站，零成本上线文档/博客/项目主页：

1. 仓库 Settings → Pages
2. Source 选分支（如 `main` / `gh-pages`）+ 目录（`/root` 或 `/docs`）
3. 站点地址：`https://&lt;user&gt;.github.io/<repo>`（用户名仓库 `&lt;user&gt;.github.io` 走根域名）

配合静态站生成器（VitePress / Docusaurus / Hugo / Jekyll）一键部署。自带 HTTPS、无限流量。

## GitHub Copilot —— AI 编程

IDE 内（VS Code / JetBrains / Neovim）的 AI 结对编程：

- **代码补全**：灰字 ghost text，Tab 接受
- **Copilot Chat**：侧边栏对话，问代码、解释、改写、写测试
- **Agent 模式**：自主完成多文件任务
- **Copilot Review**：PR 自动代码审查

**计费（2026-06-01 用量计费，重要时效考点）**

| 计划 | 月费 | 含 GitHub AI Credits |
|---|---|---|
| **Pro** | $10/月 | $10 |
| **Pro+** | $39/月 | $39 |
| **Business** | $19/user/月 | $19 |
| **Enterprise** | $39/user/月 | $39 |

- 旧机制 **Premium Request Units (PRUs)** 被 **GitHub AI Credits** 取代
- Credits 按 **token 用量**（输入/输出/缓存）+ 各模型 API 费率换算消耗
- **代码补全与 Next Edit 不消耗 AI Credits**（仍含在订阅里）
- 超额可买额外 Credits，或开启按发布费率的 overage
- 月付用户 2026-06-01 自动迁移；年付用户到期前维持旧价，但模型倍率同日生效

## 下一步

入门到此——你已会建仓库、走 PR、配 Actions、用 Pages、了解 Copilot 计费。下一章 `guide-line.md` 深入讲 **Actions 进阶 / Secrets 与变量 / Runner 自建 / Packages 私有包 / Pages + 静态站生成器 / Copilot 用量管控 / 安全（Dependabot/Secret Scanning）/ 组织与企业治理 / 与 GitLab/Gitee 协同**。
