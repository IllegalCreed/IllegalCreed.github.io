---
layout: doc
outline: [2, 3]
---

# 流水线模型：Stage / Job / DAG / 缓存 / 并发

> 基于 CI/CD 通用模型 · 核于 2026-07

## 速查

- **层级**：`Pipeline ⊃ Stage ⊃ Job ⊃ Step`；同 Stage 内 Job 常**并行**，Stage 间**顺序**推进，Step 在 Job 内**串行**。
- **needs / DAG**：用 `needs` 声明 Job 只依赖指定的前置 Job，**打破「必须等整个 Stage」的限制**，形成有向无环图，让无关快 Job 不等慢 Stage，缩短总时长。
- **matrix（矩阵）**：一份 Job 定义按变量组合**展开成多个并行 Job**（如 `node: [18,20,22] × os: [...]`），少量配置覆盖多维兼容测试。
- **fail-fast**：矩阵/并行中有一个失败就尽快取消其余；调试兼容问题时可临时关掉（`fail-fast: false`）看全貌。
- **cache**：加速用、尽力而为；**key 绑定 lockfile 哈希**（依赖变则失效）；key 过宽→命中过期缓存，过窄→几乎不命中。
- **artifact**：Job 间传递/交付产物，靠**上传/下载**（Job 环境隔离，不共享文件系统）；有保留期，长期物另发仓库。
- **concurrency（并发组）**：同组只允许一个运行、新运行可取消旧运行；常用于**同 PR 取消过时构建**、**串行化同环境部署**防踩踏。
- **quality gate**：让「部署」依赖「构建/测试/扫描全过」，把不合格变更挡在生产前。
- **continue-on-error / allow_failure**：容忍某步/某 Job 失败不阻断整体，适合非关键任务；滥用会掩盖真实失败。
- **timeout / retry**：给 Job 设超时防卡死占用；retry 对抗偶发抖动（勿掩盖真正不稳定的测试）。

## 一、Stage / Job / Step 的并行与顺序

三层嵌套决定了「什么并行、什么顺序」：

- **Step** 在一个 Job 内**严格串行**（前一步失败通常中止后续）。
- **Job** 在同一 Stage 内**默认并行**（互不依赖时同时跑）。
- **Stage** 之间**顺序**：前一 Stage 的所有 Job 成功，才进入下一 Stage。

这套默认规则简单，但「必须等整个 Stage 完成」有时太粗——于是有了 DAG。

## 二、needs 与 DAG：打破 Stage 的粗粒度

用 `needs`（GitHub Actions / GitLab CI 都有）让一个 Job 只等**它明确依赖的少数 Job**，而不是等整个前置 Stage：

```yaml
jobs:
  build-web:   { stage: build }
  build-api:   { stage: build }
  test-web:    { needs: [build-web] }   # 只等 build-web，不等 build-api
  deploy-web:  { needs: [test-web] }
```

这样 `build-api` 慢也不拖累 `test-web` 开跑，整条流水线按真实依赖并行，墙钟时间由「最长依赖链」而非「各 Stage 之和」决定。合理用 `needs` 是提速关键。

## 三、matrix：一份定义，多维并行

矩阵构建让你用一份 Job 定义覆盖多维组合：

```yaml
strategy:
  matrix:
    node: [18, 20, 22]
    os: [ubuntu-latest, windows-latest, macos-latest]
  fail-fast: false   # 想看到所有组合是否都失败时关掉
# 展开成 3 × 3 = 9 个并行 Job
```

典型用于「多运行时版本 × 多操作系统」的兼容性测试，或多目标并行部署。`fail-fast` 控制「一个失败是否取消其余」。

## 四、缓存 vs 制品：再强调一次

- **cache**：为提速复用（依赖、编译中间物）。key 设计是关键——常绑定 `hashFiles('**/package-lock.json')` 之类，依赖变则 key 变、缓存失效重建；依赖没变则命中、跳过重装。
- **artifact**：Job 间传递产物 / 供下载。因为每个 Job 通常在独立、干净的环境（不同 Runner/容器）运行，**不共享文件系统**——上游 Job `upload-artifact`，下游 Job `download-artifact`，是标准的产物传递方式。

误区：假设下游 Job 能直接读到上游 Job 的工作目录（不能）；把长期发布物存在会过期的 artifact 里（应发到 registry）。

## 五、concurrency：并发控制与自动取消

并发组让你规定「同一组同时只能有一个运行」，新运行可取消进行中的旧运行：

```yaml
concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true
```

（上面的 <code v-pre>${{ github.ref }}</code> 是 GitHub Actions 表达式，非普通花括号插值。）典型用途：同一 PR 连续推送时取消上一次尚未跑完的构建，省资源、快反馈；或保证同一环境的部署不并发互相踩踏。

## 六、质量门与容错开关

- **质量门（quality gate）**：把 build/test/lint/安全扫描设为「部署」的前置依赖，只有全过才允许进入部署阶段——用流水线结构把不合格变更挡在生产之前。
- **continue-on-error / allow_failure**：让某个非关键步骤/Job 失败也不使整体失败（以警告呈现）。适合可选的实验性任务；但滥用会让「绿色构建」名不副实，需克制。
- **timeout**：给 Job 设合理超时，避免卡死的任务无限占用 Runner、堆积成本、阻塞后续。
- **retry**：自动重试失败 Job（可按失败原因限定），用于对抗网络抖动等偶发故障——但不应用它来长期掩盖真正 flaky 的测试。

## 七、把流水线做「快」的组合拳

慢流水线会摧毁 CI 的反馈价值。常见提速手段叠加使用：

1. **并行**：无依赖的 Job/矩阵项并行跑。
2. **缓存**：依赖、构建产物按内容 key 复用。
3. **只测受影响部分**：monorepo 里用 affected/受影响检测，只对改动波及的包跑任务。
4. **快慢分层**：PR 阶段只跑快测试（秒级/分钟级反馈），慢的全量 E2E 放合并后或定时跑。

这些机制的目标一致：让开发者尽快拿到「这次改动行不行」的反馈。
