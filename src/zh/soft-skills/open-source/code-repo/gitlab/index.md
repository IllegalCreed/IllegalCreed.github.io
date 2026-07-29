---
layout: doc
---

# GitLab

**单应用一体化 DevSecOps 平台**——把规划、编码、构建、测试、发布、部署、运维、监控整套软件生命周期塞进**一个应用**，是 GitHub 之外最主流的代码托管与协作平台。GitLab 最鲜明的差异点是 **CI/CD 是内置的（built-in）**：不需要像 GitHub 那样靠 Actions + Marketplace 拼装，`.gitlab-ci.yml` 一行声明，pipeline 就跑在 GitLab 自家的 Runner 上，深度集成、开箱即用。其次，GitLab 把 **DevSecOps** 当作一等公民：应用安全测试（SAST/DAST/依赖扫描/容器扫描）、软件供应链安全、合规审计全部内建，不必再外接安全工具链。第三，**自托管优先**：除了 SaaS（gitlab.com），还提供 Community Edition（开源免费自建）和 Enterprise Edition（企业版自建），满足内网、合规、数据不出企业。第四，**可镜像 GitHub 跑 CI**：很多团队把 GitHub 当代码主仓，把 pipeline 镜像到 GitLab 享受其更强的内置 CI 与安全扫描。AI 方面有 **GitLab Duo**（Agentic AI 覆盖全生命周期，含 Code Suggestions、Chat、Root Cause Analysis）。本叶讲 **GitLab 平台定位与功能**；具体 `.gitlab-ci.yml` 语法、job/runner 细节见「GitLab CI/CD」叶。

## 评价

**优点**

- **CI/CD 内置（built-in）**：`.gitlab-ci.yml` 声明即用，无需 Actions+Marketplace 拼装，深度集成、配置即代码
- **单应用 DevOps**：plan/code/build/test/release/deploy/operate/monitor 全在一个平台，数据贯通、无工具孤岛
- **DevSecOps 一等公民**：SAST/DAST/依赖扫描/容器扫描/密钥检测/合规全内建，安全左移开箱即用
- **自托管友好**：Community Edition 开源免费自建、Enterprise Edition 企业级自建，数据完全自主
- **可镜像 GitHub**：仓库镜像 + CI 触发，让 GitHub 主仓享受 GitLab 的内置 CI 与安全扫描
- **Value Stream Analytics**：内置价值流管理，从需求到上线的全链路效能度量
- **GitLab Duo AI**：覆盖全生命周期的 Agentic AI，Code Suggestions、Chat、漏洞解释、根因分析
- **企业治理强**：组（Group）/子组/项目层级、细粒度权限、审计日志、合规框架

**缺点**

- **开源生态弱于 GitHub**：全球开源项目聚集度远不及 GitHub，国际化协作天然劣势
- **自建运维成本高**：CE/EE 自托管要自己管服务器、升级、备份、Runner，比 SaaS 重
- **一体化即「重」**：功能多导致界面复杂，只想用托管的小团队上手成本高
- **Duo AI 不如 Copilot 普及**：IDE 补全体验与生态广度不及 GitHub Copilot
- **国内 SaaS 访问一般**：gitlab.com 国内访问需代理，自建 CE 是国内常见折中
- **资源消耗大**：自建实例对内存/存储要求高（Omnibus 包较重）
- **私有库免费有限额**：SaaS Free 的 CI 分钟数和存储有上限，超量需升级

## 文档地址

[GitLab Docs](https://docs.gitlab.com/)

## GitHub 地址

[gitlabhq/gitlabhq (GitLab Community Edition 开源仓库)](https://gitlab.com/gitlab-org/gitlab)

## 幻灯片地址

<a href="/SlideStack/gitlab-slide/" target="_blank">GitLab</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=GitLab" target="_blank" rel="noopener noreferrer">GitLab 测试题</a>
