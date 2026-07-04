---
layout: doc
---

# CI/CD 核心机制

CI/CD 是现代软件交付的中枢：**CI（持续集成）** 让开发者高频地把代码合入主干、每次合并都自动构建与测试，尽早暴露集成冲突；**CD** 有两层含义——**持续交付（Continuous Delivery）** 让每次变更都被自动准备到「随时可发布」、但上生产保留一道人工放行闸门，**持续部署（Continuous Deployment）** 则连这道闸门都自动化、通过全部检查即自动上生产。本叶讲的是**工具无关的理论地基**：流水线（Pipeline）的 Stage/Job/Step 模型、Runner 执行、触发器、缓存与制品、矩阵与 DAG、环境与审批、密钥与 OIDC、蓝绿/金丝雀/滚动发布、以及 DORA 效能度量与主干开发等最佳实践。吃透这些概念后，再看 GitHub Actions、GitLab CI/CD、Jenkins 等具体工具，会发现它们只是同一套机制的不同方言。

## 概述

- **CI 的本质是「频繁集成」**：自动化构建/测试只是手段，开发者每天多次把小批量改动合入主干、每次都自动验证，才是 CI 生效的前提；攒大批改动最后一次性合并会退化成「偶尔集成」。
- **CD 的两层含义要分清**：持续交付（Delivery）= 自动就绪 + 人工放行上生产；持续部署（Deployment）= 通过检查即自动上生产。二者唯一区别在「最后一公里是否需要人点头」，是最高频考点。
- **流水线模型**：Pipeline ⊃ Stage ⊃ Job ⊃ Step；同 Stage 内 Job 常并行、Stage 间顺序推进；`needs`/DAG 可打破 Stage 全等限制以提速；matrix 用一份定义展开多维并行。
- **制品与缓存**：artifact 是要交付/传递的产物（须可靠），cache 是加速用的尽力复用（可失效）——语义截然不同，别混用。
- **安全是一等公民**：密钥用加密存储 + 运行时注入 + 日志打码；用 OIDC 短时令牌换云端临时凭据以消除长期密钥；fork PR 默认不给密钥；第三方 Action 用 SHA 固定防供应链投毒。
- **效能用 DORA 度量**：部署频率、变更前置时间、变更失败率、服务恢复时间（MTTR）——前两个衡量吞吐，后两个衡量稳定，与主干开发、快速回滚强相关。

## 本叶地图

- [入门](./getting-started) —— CI/CD/CD 的准确定义、为何需要、Pipeline/Stage/Job/Step/Runner/触发器等基础概念、一条最小流水线
- [流水线模型](./guide-line/pipeline-model) —— Stage/Job/Step、needs 与 DAG、matrix、cache vs artifact、fail-fast、concurrency、质量门
- [部署策略](./guide-line/deploy-strategies) —— 持续交付 vs 持续部署、蓝绿/金丝雀/滚动发布、回滚、构建一次到处部署、幂等与可复现
- [安全与供应链](./guide-line/security-supply-chain) —— 密钥管理、OIDC 无密钥认证、临时 Runner、fork PR 风险、SLSA/provenance、缓存投毒、SHA 固定
- [度量与实践](./guide-line/metrics-practices) —— DORA 四指标、主干开发、左移、流水线即代码、快慢测试分层、DevSecOps
- [参考](./reference) —— 概念/术语/策略速查表 + 权威链接

## 文档地址

- [GitLab CI/CD Concepts](https://docs.gitlab.com/ee/ci/) —— 工具无关的 CI/CD 概念讲得较系统
- [Understanding GitHub Actions](https://docs.github.com/en/actions/learn-github-actions/understanding-github-actions) —— Workflow/Job/Step/Runner 模型
- [Martin Fowler: Continuous Integration](https://martinfowler.com/articles/continuousIntegration.html) —— CI 的经典定义
- [Martin Fowler: Continuous Delivery](https://martinfowler.com/bliki/ContinuousDelivery.html) —— Delivery vs Deployment
- [DORA / Google DevOps 指标](https://dora.dev/) —— 四大关键指标与研究

## 幻灯片地址

- <a href="/SlideStack/cicd-core-slide/" target="_blank">CI/CD 核心机制</a>
