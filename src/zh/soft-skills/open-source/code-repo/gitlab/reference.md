---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 GitLab 官方文档 —— 形态对照 / 生命周期 / 安全能力 / Duo / Registry / Runner / 计划 / 与 GitHub 对比

## 部署形态对照

| 形态 | 是否开源 | 运维 | 适用 |
|---|---|---|---|
| **GitLab SaaS**（gitlab.com）| 平台代码开源（EE 许可）| GitLab 官方 | 中小团队 |
| **CE 自托管** | 开源（MIT 内核）| 自己 | 内网、成本敏感 |
| **EE 自托管** | 开源核心 + 企业功能（订阅）| 自己 | 企业 |
| **Dedicated** | 闭源 | GitLab 托管单租户 | 要隔离又免运维 |

## DevOps 生命周期阶段

GitLab 把 DevOps 分为八个阶段，全在一个应用内：

| 阶段 | 能力 |
|---|---|
| **Plan** | Issues、Boards、Roadmaps、Epics、Milestones |
| **Code** | 仓库、MR、Code Review、Gitaly（存储）|
| **Build** | CI pipeline、Auto Build |
| **Test** | Unit/Integration、Coverage、Code Quality |
| **Release** | Release、Package Registry、Deploy Boards |
| **Deploy** | Auto Deploy、K8s/集成、Environments |
| **Operate** | Monitoring、Incidents、Error Tracking |
| **Monitor** | Metrics、Value Stream Analytics |

## 安全能力对照

| 能力 | 模板/功能 | 作用 |
|---|---|---|
| **SAST** | `Security/SAST.gitlab-ci.yml` | 源码静态安全分析 |
| **DAST** | `Security/DAST.gitlab-ci.yml` | 运行时动态扫描 |
| **Dependency Scanning** | `Security/Dependency-Scanning.gitlab-ci.yml` | 依赖漏洞 |
| **Container Scanning** | `Security/Container-Scanning.gitlab-ci.yml` | 镜像漏洞 |
| **Secret Detection** | `Security/Secret-Detection.gitlab-ci.yml` | 泄露密钥 |
| **License Scanning** | `Security/License-Scanning.gitlab-ci.yml` | 许可证合规 |
| **Fuzz Testing** | `Security/coverage-fuzzing.gitlab-ci.yml` | 模糊测试 |
| **Compliance Framework** | 项目标记 | GDPR/PCI 等合规 |

## GitLab Duo 功能对照

| 功能 | 触发位置 | 说明 |
|---|---|---|
| **Code Suggestions** | IDE 插件 | 补全/生成代码 |
| **Duo Chat** | 网页/IDE | 对话式问答 |
| **Code Review** | MR 页 | AI 评审改动 |
| **Vulnerability Explanation** | 安全仪表盘 | AI 解释漏洞 |
| **Root Cause Analysis** | 失败 job 页 | AI 找失败根因 |
| **Self Hosted Models** | Ultimate | 接自托管模型，数据不出企业 |
| **AI Impact Dashboard** | Ultimate | AI 采用与效能度量 |

## Runner 类型对照

| Runner | 作用域 | 注册 token 来源 |
|---|---|---|
| **Shared** | 实例级（所有项目）| 管理员 |
| **Group** | 组级（组内项目）| 组 owner |
| **Specific** | 单项目 | 项目 maintainer |
| **Instance** | 全实例（自建常用）| 管理员 |

### Executor 对照

| Executor | 说明 | 适用 |
|---|---|---|
| `shell` | 直接跑宿主 shell | 简单但有污染风险 |
| `docker` | Docker 容器隔离 | **最常用** |
| `kubernetes` | K8s Pod 弹性 | 大规模 |
| `docker+machine` | Docker 自动扩缩 | 中规模 |
| `virtualbox`/`parallels` | 虚拟机 | macOS/iOS 构建 |

## Registry 对照

| Registry | 内容 | 地址 |
|---|---|---|
| **Container Registry** | Docker 镜像 | `registry.gitlab.com/&lt;group&gt;/<project>` |
| **Package Registry** | npm/Maven/PyPI/NuGet/Composer/Terraform | 项目级 API |
| **Infrastructure Registry** | Terraform modules | 项目级 |

## 计划与定价（SaaS）

| 计划 | 价格（参考）| 关键能力 |
|---|---|---|
| **Free** | $0 | 私有库、CI 分钟有限、基础安全 |
| **Premium** | ~$29/user/月 | 高级 CI/CD、Code Review、审批 |
| **Ultimate** | ~$99/user/月 | 全套安全扫描、合规、Value Stream、Duo Enterprise |

- 自建 **CE 免费**，**EE** 按 Premium/Ultimate 订阅
- **Duo Pro/Enterprise** 一般为附加订阅

## 与 GitHub 全面对比

| 维度 | GitLab | GitHub |
|---|---|---|
| CI/CD | built-in（深度集成）| Actions（生态强）|
| 安全 | DevSecOps 全内建 | Dependabot/CodeQL + Marketplace |
| 自托管 | CE 开源 / EE | Enterprise Server（付费）|
| AI | Duo（全生命周期）| Copilot（IDE 领先）|
| 评审单元 | Merge Request（MR）| Pull Request（PR）|
| 项目管理 | Issues/Boards/Epics 内建 | Issues + Projects v2 |
| 开源生态 | 中 | 全球第一 |
| 国内访问 | 中（自建快）| 慢 |

## 镜像配置

| 类型 | 方向 | 用途 |
|---|---|---|
| **Pull mirroring** | GitHub → GitLab | GitLab 拉取 GitHub 代码 |
| **Push mirroring** | GitLab → GitHub | 备份/开源发布 |
| **CI for external repos** | GitHub 源 + GitLab CI | 直接对 GitHub 仓库跑 GitLab CI |

## 参考

- 官方文档：<https://docs.gitlab.com/>
- 关于 GitLab：<https://about.gitlab.com/>
- 安装 CE：<https://about.gitlab.com/install/>
- GitLab Runner：<https://docs.gitlab.com/runner/>
- 安全扫描：<https://docs.gitlab.com/ee/user/application_security/>
- GitLab Duo：<https://docs.gitlab.com/ee/user/ai/>
- Container Registry：<https://docs.gitlab.com/ee/user/packages/container_registry/>
- 与 GitHub 迁移：<https://docs.gitlab.com/ee/user/project/import/github.html>
