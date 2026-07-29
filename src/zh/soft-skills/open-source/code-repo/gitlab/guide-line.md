---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 GitLab 官方文档编写（about.gitlab.com / docs.gitlab.com，2026.07）—— 治理 / CI 进阶 / Auto DevOps / 安全 / Runner / Registry / Pages / Duo / 多仓协同 / 迁移

## Group / Subgroup 治理

GitLab 的「组」是组织代码与权限的核心：

| 层级 | 作用 |
|---|---|
| **Group** | 顶级组（公司/大部门），承载子组与项目 |
| **Subgroup** | 嵌套子组（事业部/团队），可多层 |
| **Project** | 单个仓库 + 配套 issue/MR/wiki/CI |

### 组级继承

组级配置会被子项目**自动继承**：

- **CI/CD 变量**：组级设 `DOCKER_REGISTRY`，所有子项目 pipeline 可用
- **Secrets**：组级 secrets 不暴露给项目 maintainer（受保护变量）
- **权限**：在组级把某人设为 Developer，他对所有子项目都是 Developer
- **Approval rules**：组级评审规则下推
- **Compliance framework**：标记合规项目（如 GDPR/PCI）

### 权限角色

| 角色 | 权限 |
|---|---|
| **Owner** | 全部（含删除、计费）|
| **Maintainer** | 项目管理、合并 MR、改设置 |
| **Developer** | 写代码、开 MR、跑 pipeline |
| **Reporter** | 只读 + 评 MR / issue |
| **Guest** | 只读公开内容 |
| **Minimal Access** | 仅能看到组存在 |

企业版还有更细的 custom roles。

## CI/CD 进阶要点

> 完整 `.gitlab-ci.yml` 语法、job/artifacts/cache/rules 见「GitLab CI/CD」叶。这里讲平台层面要点。

### Runner 管理

| Runner 类型 | 说明 |
|---|---|
| **Shared Runner** | 实例级共享（SaaS 提供，自建可配）|
| **Group Runner** | 组级共享 |
| **Specific Runner** | 锁定单个项目 |
| **Instance Runner** | 全实例可用 |

注册自建 Runner：

```bash
sudo gitlab-runner register
# 输入 GitLab 实例 URL + registration token
# 选 executor：shell / docker / kubernetes
```

::: warning Runner executor 选择
`docker` executor 最常用（隔离、干净）；`shell` 直接跑在宿主（有污染风险）；`kubernetes` 适合大规模弹性。生产推荐 docker 或 k8s。
:::

### Auto DevOps

开启 Auto DevOps 后，GitLab 自动为没有 `.gitlab-ci.yml` 的项目生成一条完整 pipeline：构建、测试、代码质量、安全扫描、部署。适合快速上手，生产环境再换成自定义 `.gitlab-ci.yml`。

## 安全扫描配置

把扫描模板 `include` 进 pipeline：

```yaml
include:
  - template: Security/SAST.gitlab-ci.yml
  - template: Security/Dependency-Scanning.gitlab-ci.yml
  - template: Security/Container-Scanning.gitlab-ci.yml
  - template: Security/Secret-Detection.gitlab-ci.yml

# 可自定义镜像/排除路径
sast:
  variables:
    SEARCH_EXCLUDE: "vendor/*"
```

扫描结果：

- **聚合到 MR**：MR 页显示新增漏洞（与目标分支 diff）
- **安全仪表盘**：项目级 + 组级聚合
- **漏洞管理**：可忽略（dismiss）、建 issue、跟踪修复

许可证合规用 `License-Scanning.gitlab-ci.yml`，可设策略拒绝高风险许可证（如 AGPL）。

## Container & Package Registry

| Registry | 内容 |
|---|---|
| **Container Registry** | Docker 镜像（`registry.gitlab.com/&lt;group&gt;/<project>`）|
| **Package Registry** | npm/Maven/PyPI/NuGet/Composer/Terraform 等 |

```yaml
# 构建并推送镜像
build-image:
  script:
    - docker login -u gitlab-ci-token -p $CI_JOB_TOKEN $CI_REGISTRY
    - docker build -t $CI_REGISTRY_IMAGE:$CI_COMMIT_SHORT_SHA .
    - docker push $CI_REGISTRY_IMAGE:$CI_COMMIT_SHORT_SHA
```

`$CI_JOB_TOKEN` 是 pipeline 自动注入的临时 token，免额外配置即可推到本仓库的 Registry。

## GitLab Pages

和 GitHub Pages 类似，仓库即静态站：

1. 仓库名 `&lt;namespace&gt;.gitlab.io` 或任意项目
2. 用 `.gitlab-ci.yml` 构建并把产物传到 `public` 目录
3. `pages:` job 用 `artifacts: paths: [public]`

```yaml
pages:
  script:
    - npm ci && npm run build
    - mv dist public
  artifacts:
    paths: [public]
  only: [main]
```

地址：`https://&lt;namespace&gt;.gitlab.io/<project>`，自带 HTTPS。

## GitLab Duo（AI）用法

| 功能 | 用途 |
|---|---|
| **Code Suggestions** | IDE 插件，补全/生成代码 |
| **Duo Chat** | 网页/IDE 内对话，解释代码、写测试 |
| **Code Review** | MR AI 评审 |
| **Vulnerability Explanation** | 安全仪表盘里 AI 解释漏洞 |
| **Root Cause Analysis** | 失败 job 一键 AI 找根因 |
| **Self Hosted Models** | Ultimate 可接自托管模型（数据不出企业）|

Duo 一般是附加订阅，Ultimate 可走自托管模型满足强合规。

## 与 GitHub / Gitee 多仓协同

### 镜像 GitHub 跑 CI

- **CI for external repos**：把 GitHub 仓库连到 GitLab，直接跑 GitLab CI（GitHub 为源）
- **Pull mirroring**：GitLab 定期拉 GitHub 最新代码后跑 pipeline

### 三仓协同常见拓扑

```
GitHub（主仓 + 开源 + Copilot）
   ↓ mirror
GitLab（内置 CI + 安全扫描）  ←→  Gitee（国内镜像 + 加速）
```

- 代码主仓在 GitHub（享受开源生态）
- CI/安全交给 GitLab（内置强、可自建）
- Gitee 做国内镜像（访问快）

## 迁移

| 方向 | 方式 |
|---|---|
| **GitHub → GitLab** | GitLab 导入工具（填 GitHub URL + personal token）|
| **SVN → GitLab** | 内置 svn2git 迁移 |
| **GitLab → GitHub** | `git remote add` + `git push`，或第三方工具 |
| **实例间** | GitLab 迁移工具 / 直接 import by URL |

::: warning 边界提醒
本叶与「GitLab CI/CD」叶互补：本叶讲**平台定位、治理、安全、Duo、协同**；`.gitlab-ci.yml` 全字段语法、job/artifacts/cache/rules、parallel/matrix 见「GitLab CI/CD」叶。
:::
