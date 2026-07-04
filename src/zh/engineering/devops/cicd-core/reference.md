---
layout: doc
outline: [2, 3]
---

# 参考：CI/CD 概念速查

> 基于 CI/CD 通用模型 · 核于 2026-07

## 速查

- **CI**=频繁把改动合入主干 + 每次自动构建测试；**CD**=交付（人工放行）/ 部署（自动上生产）。
- **层级**：Pipeline ⊃ Stage ⊃ Job ⊃ Step；**needs/DAG** 打破 Stage 全等；**matrix** 展开多维并行。
- **artifact**（可靠传递的产物）≠ **cache**（尽力复用提速）；**cache key** 绑 lockfile 哈希。
- **发布策略**：蓝绿（切流量+秒级回滚）/ 金丝雀（小流量灰度）/ 滚动（逐批替换）。
- **安全**：加密 secret + 注入 + 打码；**OIDC** 换短时凭据；fork PR 不给密钥；Action **SHA 固定**；**SLSA/provenance**；防**缓存投毒**；最小权限。
- **DORA**：部署频率 / 变更前置时间 / 变更失败率 / MTTR。
- **实践**：主干开发、左移、流水线即代码、快慢测试分层、DevSecOps。

## 一、核心术语对照

| 术语 | 含义 | 备注 |
| --- | --- | --- |
| CI（持续集成） | 频繁合入主干 + 每次自动构建测试 | 本质是频繁集成，非「有台服务器跑测试」 |
| Continuous Delivery（持续交付） | 自动就绪，上生产需人工放行 | 有手动审批闸门 |
| Continuous Deployment（持续部署） | 通过检查自动上生产 | 无人工闸门 |
| Pipeline / Stage / Job / Step | 流水线 / 阶段 / 作业 / 步骤 | 逐层嵌套 |
| Runner / Agent / Executor | 执行 Job 的机器/进程 | 云托管 or 自托管 |
| artifact | 交付/传递的产物 | 可靠、有保留期 |
| cache | 加速用的复用物 | 尽力而为、可失效 |
| matrix | 一份定义展开多维并行 | 多版本×多 OS 兼容测试 |
| needs / DAG | Job 只依赖指定前置 | 打破 Stage 全等、提速 |
| environment | 部署目标抽象 + 保护规则 | 绑密钥/审批/分支限制 |
| OIDC | 短时令牌换云临时凭据 | 无长期密钥 |
| provenance | 制品来源可验证元数据 | SLSA 核心产物 |

## 二、触发器速查

| 触发器 | 时机 |
| --- | --- |
| push | 推送提交到分支 |
| pull_request / merge request | 开/更新 PR（常验证合并后结果） |
| tag | 打版本标签（常用于发布） |
| schedule / cron | 定时（如每晚全量） |
| workflow_dispatch | 手动（UI 按钮 / API），可带输入 |
| workflow_run / repository_dispatch | 被其它流水线 / 外部 webhook 触发 |

## 三、发布策略对照

| 策略 | 机制 | 优点 | 代价 |
| --- | --- | --- | --- |
| 蓝绿 blue-green | 两套对等环境，验证后整体切流量 | 零停机、秒级回滚 | 双份资源 |
| 金丝雀 canary | 小流量灰度，逐步扩大 | 风险可控、真实验证 | 需按比例切流量 + 指标 |
| 滚动 rolling | 逐批替换实例直到全量 | 平滑、控制不可用数 | 非流量灰度 |

## 四、DORA 四指标

| 指标 | 衡量 | 类别 |
| --- | --- | --- |
| 部署频率 | 多久部署一次 | 吞吐 |
| 变更前置时间 | 提交→上线耗时 | 吞吐 |
| 变更失败率 | 生产变更致故障比例 | 稳定 |
| MTTR / 服务恢复时间 | 故障→恢复耗时 | 稳定 |

## 五、易错点清单

- 把「上了 CI 工具」当成「在做 CI」——频繁集成的习惯才是核心。
- 混淆持续交付（人工放行）与持续部署（自动上生产）。
- 把该做 artifact 的长期发布物存进会过期的 cache/artifact。
- cache key 设计过宽 → 命中过期缓存拿到错依赖；过窄 → 几乎不命中。
- 假设下游 Job 能直接读上游 Job 的工作目录（Job 环境隔离，须靠 artifact 传递）。
- 把密钥明文写进 YAML / 打进镜像 / 打印到日志。
- 用可变标签（`@v3`/`@main`）引用第三方 Action 而不用 SHA 固定。
- 对公开仓库用自托管 Runner 跑 fork PR 代码而不隔离。
- 用 `continue-on-error`/`allow_failure`/`retry` 长期掩盖真正的失败或 flaky 测试。

## 六、权威链接

- [GitLab CI/CD 文档](https://docs.gitlab.com/ee/ci/) —— 概念与关键字
- [GitHub Actions 文档](https://docs.github.com/en/actions) —— Workflow/Job/Step/Runner
- [Martin Fowler: Continuous Integration](https://martinfowler.com/articles/continuousIntegration.html)
- [Martin Fowler: Continuous Delivery / Deployment](https://martinfowler.com/bliki/ContinuousDelivery.html)
- [DORA](https://dora.dev/) —— 四大指标与年度报告
- [SLSA 供应链框架](https://slsa.dev/)
- [OpenID Connect in CI（GitHub 文档）](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect)
