---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 GitLab 官方文档编写（about.gitlab.com / docs.gitlab.com，2026.07 版本）

## 速查

- 官网（SaaS）：<https://gitlab.com>
- 关于页：<https://about.gitlab.com>
- 版本：**SaaS（gitlab.com）** + **自托管 CE（开源免费）** + **自托管 EE（企业版）**
- 定位：**单应用一体化 DevSecOps 平台**
- CI/CD：**built-in（内置）**，配置文件 `.gitlab-ci.yml` 放仓库根目录
- Runner：**GitLab Runner**（Go 写，可自建）
- 安全：**Auto DevOps / Auto Security**（SAST/DAST/依赖扫描/容器扫描内建）
- AI：**GitLab Duo**（Code Suggestions、Chat、Root Cause Analysis、Vulnerability Explanation）
- 生命周期：plan / code / build / test / release / deploy / operate / monitor
- 层级：**Group → Subgroup → Project**
- 协作：**Merge Request（MR）**（对应 GitHub 的 PR）
- 包仓库：**GitLab Container Registry / Package Registry**（Docker/npm/Maven 等）
- 镜像：可配置**拉取/推送镜像**到 GitHub（双向同步）
- 定价：Free / Premium / Ultimate + 自建 CE 免费 / EE 按订阅

## GitLab 是什么

GitLab 是**把整套 DevOps 工具链收敛进一个应用**的平台。与 GitHub 对比：

| 维度 | GitLab | GitHub |
|---|---|---|
| CI/CD | **内置**（声明即用，深度集成）| Actions（生态强，需拼装）|
| 安全 | **DevSecOps 内建**（SAST/DAST/扫描全有）| 需 Dependabot/CodeQL + Marketplace |
| 自托管 | **CE 开源免费 / EE 企业版** | Enterprise Server（闭源、付费）|
| 生态定位 | 一体化平台 | 开源生态 + Marketplace |
| AI | Duo（全生命周期）| Copilot（IDE 领先）|
| 协作单元 | Merge Request（MR）| Pull Request（PR）|
| 层级 | Group/Subgroup/Project | Org/Repo |

**核心结论**：要**一体化 DevOps + 内置安全 + 可自建** 选 **GitLab**；要**开源生态 + Copilot + 海量 Action** 选 **GitHub**。两者常互补：GitHub 当代码主仓，GitLab 跑 CI 与安全扫描。

## SaaS vs 自托管

| 形态 | 说明 | 适用 |
|---|---|---|
| **GitLab SaaS**（gitlab.com）| 官方托管，免运维 | 中小团队、快速上手 |
| **CE 自托管** | 开源免费，自己装 | 内网、成本敏感、想定制 |
| **EE 自托管** | 企业版（订阅），更多治理/安全功能 | 企业、强合规 |
| **Dedicated** | GitLab 托管的「单租户」私有实例 | 要隔离又不想自运维 |

安装 CE 最快方式是 **Omnibus 包**（一键 deb/rpm）或 Docker：

```bash
# Docker 快速体验
docker run --detach \
  --hostname gitlab.example.com \
  -p 443:443 -p 80:80 -p 22:22 \
  --name gitlab \
  --restart always \
  --volume /srv/gitlab/config:/etc/gitlab \
  --volume /srv/gitlab/logs:/var/log/gitlab \
  --volume /srv/gitlab/data:/var/opt/gitlab \
  --shm-size 256m \
  gitlab/gitlab-ce:latest
```

::: warning 自建资源要求
GitLab 较重：小团队建议至少 4 核 8GB 内存 + SSD；上千人规模需 16 核 32GB+ 并配对象存储放 artifacts。Runner 单独部署。
:::

## Group / Project 层级

GitLab 用「组」组织项目，便于权限与治理：

```
顶级 Group（公司）
├── Subgroup（事业部）
│   └── Project（仓库）
└── Subgroup
    └── Project
```

- **Group/Subgroup**：在组级设权限、CI/CD 变量、Secrets，子项目自动继承
- **Project**：一个代码仓库 + 配套 issue/MR/wiki/CI
- **权限角色**：Owner / Maintainer / Developer / Reporter / Guest

## Merge Request（MR）

GitLab 的代码评审单元，对应 GitHub 的 PR：

1. 开分支、commit、push
2. 在 GitLab 网页点 **New merge request**
3. 填标题/描述，关联 Issue（`Closes #42`）
4. CI（pipeline）自动跑、Reviewer 评审
5. **Merge**（可选 Squash / Cherry-pick）

MR 比 PR 多了一些原生特性：**MR 评审可指定 approver 规则**、**Draft MR（WIP）**、** MR 关联多个 issue**、**Review 模式逐行批注**。

## 内置 CI/CD（built-in）

与 GitHub Actions 的「workflow 文件 + Runner」模式不同，GitLab CI 是**平台原生**的：仓库根目录放一个 `.gitlab-ci.yml`，GitLab 自动识别并调度 Runner 跑 pipeline。

```yaml
# .gitlab-ci.yml 最简示例
stages:
  - test
  - deploy

test:
  stage: test
  script:
    - npm ci
    - npm test

deploy:
  stage: deploy
  script:
    - ./deploy.sh
  only:
    - main
```

- **深度集成**：MR 页直接显示 pipeline 状态、artifacts、测试报告
- **Runner 可自建**：GitLab Runner（Go 写），注册到自己的实例，私有库 CI 完全自主
- **详见**：「GitLab CI/CD」叶（`.gitlab-ci.yml` 全字段、job/artifacts/cache/rules）

## DevSecOps 内建

GitLab 把安全扫描做成开箱即用：

| 能力 | 作用 |
|---|---|
| **SAST** | 静态应用安全测试（源码漏洞）|
| **DAST** | 动态应用安全测试（运行时）|
| **Dependency Scanning** | 依赖组件已知漏洞 |
| **Container Scanning** | 镜像漏洞 |
| **Secret Detection** | 仓库里泄露的密钥 |
| **License Compliance** | 开源许可证合规 |
| **Fuzz Testing** | 模糊测试 |

这些在 **Auto DevOps** 下默认开启，或在 `.gitlab-ci.yml` 里 `include` 对应模板。扫描结果聚合到 MR 与安全仪表盘。

## GitLab Duo（AI）

- **Code Suggestions**：IDE 内代码补全与生成
- **Duo Chat**：侧边栏对话，问代码/解释/改写
- **Vulnerability Explanation**：解释扫描出的漏洞
- **Root Cause Analysis**：job 失败时 AI 分析根因
- **Code Review**：MR AI 评审

Duo 一般是 Premium/Ultimate 附加订阅。

## 镜像 GitHub（CI 协同）

很多团队把 GitHub 当代码主仓（享受开源生态 + Copilot），把 pipeline 镜像到 GitLab 享受其内置 CI 与安全扫描：

- **Pull mirroring**：GitLab 定期从 GitHub 拉取最新代码
- **Push mirroring**：GitLab 推送到 GitHub（备份或开源发布）
- **CI for external repos**：直接对 GitHub 仓库跑 GitLab CI（GitHub 当源、GitLab 当 CI 引擎）

配置在 Project → Settings → Repository → Mirroring repositories。

## 下一步

入门到此——你已了解 GitLab 的平台定位、SaaS/自建、Group/Project、MR、内置 CI 与安全、Duo、镜像协同。下一章 `guide-line.md` 深入讲 **Group/Subgroup 治理 / CI 进阶要点 / Auto DevOps / 安全扫描配置 / Runner 管理 / Container & Package Registry / Pages / Duo 用法 / 与 GitHub/Gitee 多仓协同 / 迁移**。
