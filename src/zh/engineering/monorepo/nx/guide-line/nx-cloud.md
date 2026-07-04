---
layout: doc
outline: [2, 3]
---

# Nx Cloud 与分布式 CI

> 基于 Nx（20/21.x）· 核于 2026-07

## 速查

- **Nx Cloud** = 远程缓存（Nx Replay）+ 分布式执行（Nx Agents）+ 自愈 CI + 分析面板，是叠加在 Nx Core 上的**可选层**
- **接入**：`nx connect` 连接工作区；连接后 `nx.json` 里出现 `nxCloudId`
- **Nx Replay（远程缓存）**：团队与 CI 之间共享计算缓存；官方观测 **CI 提速 30–70%、成本约减半**
- **远程缓存存三样**：**终端输出**、**`outputs` 产物**、**输入哈希**（注意：只存哈希，不存原始输入）
- **安全**：缓存条目**不可变**、令牌控制**读/写**权限、**端到端加密**、SOC Type 1/2 认证、可自托管 / EU 区（企业版）
- **离线回退**：远程不可用时自动回退本地缓存，或直接跑任务
- **Nx Agents（DTE）**：把任务分布到多台机器；**声明式**——只报「几台、什么规格」，Nx Cloud 自动分派
- **一行开关**：CI 里 `nx-cloud start-ci-run --distribute-on="3 linux-medium-js" --stop-agents-after="build"`
- **传输机制**：Agents 用**远程缓存**在机器间搬运任务产物；任务只跑一次、跨 agent 共享
- **任务中心 vs 机器中心**：按历史耗时 + Nx 图依赖动态派发，比「预先把任务绑定到机器」更省更稳
- **组合拳**：`affected` + Nx Replay + Nx Agents 三者叠加，才是大仓低 CI 时间的关键
- **自愈 CI**：AI 检测、分析并自动修复 CI 失败（Nx Cloud 能力）

## Nx Cloud 是什么

Nx Core 本身自带**本地**计算缓存，已经很有用；但最大收益来自把缓存**跨团队、跨 CI 共享**，以及把任务**分布到多台机器**。这两件事由 Nx Cloud 提供，此外还有自愈 CI 与运行分析面板。

接入方式（连接后写入 `nxCloudId`）：

```bash
nx connect
```

```json
{
  "nxCloudId": "SOMEID"
}
```

Nx Cloud 是**可选**的：不接也能用 Nx 的全部本地能力；接入后按需启用远程缓存/分布式即可，非侵入。

## Nx Replay：远程缓存

反复重建/重测相同代码既费资源又费时间。Nx Replay 让「同一份计算永不跑第二次」的收益扩展到整个团队与 CI：

- **加速 CI**：PR 首次流水线跑过的任务，后续运行可复用缓存，配合 `affected` 只跑受影响项目，效果叠加。
- **本地提效**：按缓存读写权限设置，开发者本地可复用 CI 已算好的结果，build/test 可能瞬间完成。
- **支撑 Nx Agents**：远程缓存是 Agents 在机器间搬运产物的**传输机制**。

**远程缓存里存什么**：

- **终端输出**：任务运行时的日志/告警/错误。
- **任务产物**：项目配置 `outputs` 里声明的输出文件（构建产物、测试报告、lint 报告等）。
- **哈希**：输入的哈希（含源码、运行时值、命令行参数）。注意——**存的是哈希，不是原始输入**。

**安全模型**（Nx/Nx Cloud 面向银行、保险、政府等大型客户设计）：

- **不可变**：每条缓存一经写入不可篡改，杜绝往构建注入恶意产物。
- **令牌访问控制**：可配置为「CI 可写、开发者只读」等读/写权限。
- **端到端加密**：产物在发往远程前加密、取回时解密，即便有人拿到服务器也看不到内容。
- **企业版**：支持自托管、EU 区托管以满足合规/数据驻留要求。
- **SOC 认证**：Nx 与 Nx Cloud 通过 SOC Type 1 与 Type 2。

**离线**：Nx Replay 会把远程缓存同步到本地目录；远程不可用时自动回退本地缓存，或直接运行任务。临时跳过缓存见 [计算缓存与哈希](./caching.md) 的 `--skip-nx-cache`。

## Nx Agents：分布式任务执行

`affected` + 远程缓存能大幅加速 CI，但仓库继续变大仍会遇到瓶颈——这时需要把任务**分布到多台机器**。Nx Agents 是 Nx Cloud 的分布式任务执行系统，高效分派任务，免去手动搭建分布式的复杂与维护。

启用只需两步：连接 Nx Cloud，然后在 CI 配置里加**一行** `start-ci-run`：

```yaml
# .github/workflows/ci.yml（节选）
jobs:
  main:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
          filter: tree:0

      - run: pnpm dlx nx-cloud start-ci-run --distribute-on="3 linux-medium-js" --stop-agents-after="build"

      # 后续照常跑 Nx 命令，Nx Cloud 会把它们分发到 agents
      - run: pnpm exec nx affected -t lint test build
```

这行命令告诉 Nx Cloud：开一次 CI run、收集随后发出的所有 Nx 命令、把它们分发到 **3 台** `linux-medium-js`（预定义的 agent 启动模板）。若还没有 CI 配置，可用 `nx g ci-workflow` 之类生成器生成一份。

**为什么高效**：

- **声明式**：你只声明「几台 + 什么规格」，具体哪个任务跑在哪台由 Nx Cloud 决定；代码库演进时**无需改配置**。
- **任务中心 vs 机器中心**：传统 CI 是「预先把任务绑定到机器」，代码一变就要调；Nx Agents 依据**历史耗时**与 **Nx 图的依赖/顺序**动态派发任务，更快、资源利用率更高，且某台 agent 启动失败时其它 agent 能接手，更抗故障。
- **以缓存为传输**：某任务依赖的产物可能在别的 agent 上算出，Nx Replay 保证产物无缝传输，每个任务只跑一次。
- **非侵入**：不必重构现有 CI 或工作区；所有产物与日志都会回放到主 job，原有的后处理步骤照常工作。
- **动态分配**：可按 PR 大小动态调整 agent 数量，平衡成本与速度。

Nx Agents 支持主流 CI：Azure Pipelines、Circle CI、GitHub Actions、Jenkins、GitLab、Bitbucket Pipelines。

## 组合拳：affected + Replay + Agents

三者解决不同层面的浪费，叠加使用效果最佳：

- **affected**：跳过与本次改动无关的项目（少排任务）。
- **Nx Replay**：跳过输入未变的任务（命中即 replay）。
- **Nx Agents**：把剩下真正要跑的任务铺到多机并行（缩短墙钟时间）。

## 自愈 CI（简述）

Nx Cloud 还提供 **AI 驱动的自愈 CI**：自动检测 CI 失败、分析原因并尝试修复，减少人工盯屏与来回重跑。它与上述缓存/分布式能力同属 Nx Cloud 平台层，随工作区连接后按需启用。
