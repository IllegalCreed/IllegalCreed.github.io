---
layout: doc
---

# GitLab CI/CD

GitLab 自带的 CI/CD 系统，配置文件 `.gitlab-ci.yml` 放仓库根目录，与代码共版本控制。`gitlab-runner` 作为执行器分布在你的机器上（或用 GitLab.com 的共享 Runner），通过 webhook 触发 → 拉取 yml → 调度 Runner 执行流水线。与 Jenkins 比少了"独立服务器 + 插件 + UI 配置"的运维负担；与 GitHub Actions 比胜在私有部署 + 内网友好。

## 评价

**优点**

- **与仓库深度集成**：Issue / MR / Pipeline / Container Registry / Pages / Releases 一站式，无需第二系统
- **YAML 配置简单清爽**：相比 Jenkinsfile 的 Groovy DSL 学习成本低；Auto DevOps 模板甚至能"零配置"跑起来
- **Runner 灵活自托管**：shell / docker / kubernetes / docker-machine 等 executor 任选，私有 / 内网 / 离线都能跑
- **MR 流程闭环**：MR 触发 pipeline / 合并前必须通过 / 部署预览 / 自动撤销 / 评论级 review，团队协作非常顺
- **Self-Managed 完整**：开源 CE / 企业 EE 版功能一致，私有部署不用为 CI 额外付费

**缺点**

- **YAML 表达力有限**：复杂逻辑（动态生成 job / 跨条件依赖）要写得绕，远不如 Jenkins Groovy 灵活
- **Runner 维护是真工作**：自托管 Runner 要管 docker daemon / 磁盘清理 / 网络 / 注册轮换，规模大了不轻
- **DinD 性能 + 安全两难**：Docker-in-Docker 需 privileged 模式（安全风险）；kaniko / buildah 是替代，但速度更慢
- **大型集团式部署难调优**：千万级 pipeline 时的缓存 / artifacts / runner pool 调优坑不少，文档分散
- **生态比 GitHub Actions 小**：Marketplace / 第三方 Action 数量明显少，常用工具一般还要自己写 yml 模板

适合：私有部署 GitLab 实例 / 公司源代码托管在自家 GitLab / 需要把 CI / Registry / Issue 等闭环管理。开源仓库 / GitHub-only 项目仍优先 GitHub Actions。

## 文档地址

[GitLab CI/CD Documentation](https://docs.gitlab.com/ci/)

## GitHub 地址

[gitlab-org/gitlab](https://gitlab.com/gitlab-org/gitlab)（GitLab 自己托管在自己实例上）；Runner：[gitlab-org/gitlab-runner](https://gitlab.com/gitlab-org/gitlab-runner)

## 幻灯片地址

<a href="/SlideStack/gitlab-cicd-slide/" target="_blank">GitLab CI/CD</a>
