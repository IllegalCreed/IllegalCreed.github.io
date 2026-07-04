---
layout: doc
outline: [2, 3]
---

# 入门：CI/CD 是什么与核心概念

> 基于 CI/CD 通用模型（GitHub Actions / GitLab CI 为例）· 核于 2026-07

## 速查

- **CI（持续集成）**：开发者**高频**把小批量改动合入主干，**每次合并自动构建 + 测试**，尽早发现集成冲突与回归。本质是「频繁集成」，自动化只是手段。
- **CD（两层）**：**持续交付 Continuous Delivery** = 每次变更自动准备到「随时可发布」，上生产**保留人工放行**；**持续部署 Continuous Deployment** = 通过全部检查**自动上生产**、无人工闸门。**唯一区别在最后一步是否要人点头**（高频考点）。
- **Pipeline 模型**：`Pipeline ⊃ Stage ⊃ Job ⊃ Step`——流水线含阶段、阶段含作业、作业含步骤。
- **Runner / Agent / Executor**：真正执行 Job 的机器/进程（GitHub 叫 Runner、Jenkins 叫 Agent、GitLab 叫 Runner），分**云托管**与**自托管**。
- **触发器**：push、Pull/Merge Request、tag、定时（cron/schedule）、手动（`workflow_dispatch`）、被其它流水线触发、外部 webhook。
- **artifact vs cache**：artifact = 要**传递/交付的产物**（须可靠，如构建包/报告）；cache = **加速用的尽力复用**（如依赖目录，可失效不影响正确性）。
- **质量门（quality gate）**：用 Stage 顺序 + 依赖把「构建/测试/扫描全过」设为「部署」的前置条件，把不合格变更挡在生产前。
- **流水线即代码**：把流水线写成仓库里的文件（`.github/workflows/*.yml`、`.gitlab-ci.yml`、`Jenkinsfile`），可版本控制、随分支演进、经 Review。
- **快反馈是灵魂**：流水线慢 → 开发者失去耐心、攒批提交、跳过检查；优化靠并行 + 缓存 + 只测受影响部分 + 快慢测试分层。
- **进阶顺序**：先吃透本页概念 → [流水线模型](./guide-line/pipeline-model) → [部署策略](./guide-line/deploy-strategies) → [安全与供应链](./guide-line/security-supply-chain) → [度量与实践](./guide-line/metrics-practices)。

## 一、CI/CD 要解决什么问题

传统「攒一大批改动、隔很久集成一次、手工构建部署」的模式有三大痛点：集成时冲突爆炸（「合并地狱」）、缺陷发现太晚（修复成本高）、发布靠人工易错且不可复现。CI/CD 的答案是把「集成—验证—交付」变成**持续、自动、可复现的流水线**：

- **持续集成（CI）** 攻的是「集成太晚」：鼓励高频小步合入主干，每次都自动构建与测试，让冲突和回归在几分钟内暴露，而不是攒到发布前爆发。
- **持续交付/部署（CD）** 攻的是「发布慢且易错」：让每次通过 CI 的变更都自动被打包、验证到「可发布」状态，随时能一键（或自动）上线，把「发布」从一场紧张的手工仪式变成流水线里的一个普通步骤。

一句话：CI/CD 用自动化把软件交付的**反馈环**尽量缩短、把**发布风险**尽量降低。

## 二、CI：持续集成的准确含义

持续集成的核心不是「有一台服务器在跑测试」，而是**开发者的集成行为频率**。经典定义要求：团队成员**至少每天一次**把自己的工作合入共享主干，每次合入都触发自动化构建与测试。

- 若大家各自在长命特性分支上憋很久才合，即便有 CI 服务器，也只是「偶尔集成」，失去了 CI 尽早发现问题的意义。
- 配套实践：小批量提交、主干开发（trunk-based）、用特性开关（feature flag）隐藏未完成功能，从而敢于频繁合入。

所以「我们上了 GitHub Actions」不等于「我们在做 CI」——频繁集成的**习惯**才是关键。

## 三、CD 的两层含义：交付 vs 部署（最易混）

`CD` 这个缩写对应两个相关但不同的概念，务必分清：

| | 持续交付 Continuous Delivery | 持续部署 Continuous Deployment |
| --- | --- | --- |
| 自动化程度 | 自动构建/测试/准备到「可发布」 | 同左 |
| 上生产 | **需人工点一下「放行」** | **通过检查即自动上生产** |
| 类比 | 子弹上膛，等人扣扳机 | 全自动，达标即开火 |

两者都要求「每次变更都通过流水线、随时可发布」；**唯一区别是最后一步是否需要人工闸门**。很多团队先做到持续交付（保留人工把关），对流水线与测试有足够信心后，再演进到持续部署。

## 四、流水线的基本结构：Stage / Job / Step

一条流水线（Pipeline）由若干**阶段（Stage）** 组成，典型顺序是 build → test → deploy；每个 Stage 含一个或多个**作业（Job）**；每个 Job 由顺序执行的**步骤（Step）** 构成。

```yaml
# 以 GitHub Actions 为例（概念示意）
jobs:
  build:            # 一个 Job
    runs-on: ubuntu-latest   # 指定 Runner
    steps:          # 顺序执行的 Step
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run build
  test:
    needs: build    # 依赖 build 成功后才跑（DAG）
    runs-on: ubuntu-latest
    steps:
      - run: npm test
```

- 同一 Stage 内的 Job 通常**并行**；Stage 之间**顺序**推进（前一阶段全成功才进下一阶段）。
- **Runner** 是真正执行 Job 的机器/进程；控制面负责调度，Runner 负责落地跑命令。

## 五、触发器：流水线何时跑

常见触发方式：

- **push**：推送提交到某分支。
- **Pull/Merge Request**：开/更新 PR 时，通常验证「合并后」的结果。
- **tag**：打版本标签时（常用于发布）。
- **定时**：cron/schedule（如每晚跑一次全量）。
- **手动**：如 GitHub 的 `workflow_dispatch`，UI 按钮或 API 触发，可带输入。
- **被其它流水线/外部事件触发**：`workflow_run`、`repository_dispatch`（webhook）等。

## 六、制品与缓存：一字之差，语义天壤

初学者最容易混的两个概念：

- **artifact（制品）**：流水线要**交付或在 Job 间传递的产物**——构建出的包、测试报告、镜像。它必须可靠保存/传递（Job 环境相互隔离，靠上传/下载 artifact 传产物）。需长期留存的发布物应发到制品/镜像仓库，因为 CI 的 artifact 通常有保留期会过期。
- **cache（缓存）**：为**加速**而复用的中间物——`node_modules`、编译缓存。它是**尽力而为**的：命中就快、没命中只是慢，不影响正确性。缓存键（key）应绑定依赖清单哈希，依赖变了自然失效。

把该做 artifact 的东西当 cache（或反之）是常见错误。

## 七、一条「最小可用」流水线长什么样

一个健康的基础流水线通常是：

1. **触发**：push 或 PR。
2. **准备**：checkout 代码、恢复依赖缓存、安装依赖。
3. **质量门**：lint → 单元测试 →（可选）构建 →（可选）安全扫描；任一失败即中止。
4. **产物**：构建成功则上传 artifact / 推镜像。
5. **部署**：（交付）等人工放行 or（部署）自动上环境；配合环境保护规则。

理解了这条主线，再去看任何 CI 工具的 YAML，都能对号入座。接下来的[流水线模型](./guide-line/pipeline-model)会深入 needs/DAG、matrix、并发等提速与编排机制。
