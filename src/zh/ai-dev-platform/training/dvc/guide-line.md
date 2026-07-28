---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 DVC 官方文档（Data Management / Data Pipelines / Experiments / Command Reference 章节）+ 3.67 行为编写

## 速查

- **缓存机制**：内容寻址（MD5），`.dvc/cache/<hash 前两位>/&lt;hash&gt;`；工作区用 reflink/hardlink/symlink/none 链接回缓存
- **`.dvc` 文件结构**：YAML，含 `outs`（路径 + md5）+ `wdir` + `meta`
- **`dvc.lock`**：流水线锁文件，记录每 stage 的 deps（含 md5）与 outs（含 md5），是 repro 判断的依据
- **repro 增量判定**：deps 哈希未变则复用缓存产物，变了才重跑该 stage 及下游
- **远程存储后端**：s3 / gcs / azure / ssh / hdfs / webhdfs / webdav / http(s) / local / remote
- **链接策略**：`dvc config cache.type reflink,symlink,hardlink,copy`，按系统支持选最优
- **共享缓存**：`dvc config cache.shared group` 让团队共享本地缓存目录
- **指标/参数文件**：metrics（JSON/YAML/CSV/TSV）、params（`params.yaml`）、plots（CSV/JSON/YAML/图像）
- **实验栈**：`dvc exp run/save/show/diff/apply/remove/push/branch`，基于 Git ref 存储
- **数据导入**：`dvc import` / `dvc import-url`（从其它 DVC 仓库或 URL 拉数据并保持依赖）
- **与 Git 协同纪律**：每次改数据先 `dvc add` + `git commit .dvc`；切换版本先 `git checkout` 再 `dvc checkout`

## 数据版本控制深入

### 缓存与链接策略

DVC 把跟踪的文件按内容哈希存入 `.dvc/cache/`，工作区文件则是缓存的一个链接（取决于系统支持）：

| 链接类型 | 说明 | 适用 |
| --- | --- | --- |
| `reflink` | 写时复制（CoW），最快且独立 | macOS APFS / Btrfs |
| `hardlink` | 硬链接，零拷贝 | 同文件系统 |
| `symlink` | 软链接 | 跨目录 |
| `copy` | 完整复制，最慢但最兼容 | 兜底 |

```bash
dvc config cache.type reflink,hardlink,symlink,copy   # 按优先级回退
```

链接策略决定 `dvc checkout` 切换版本的速度——reflink/hardlink 几乎瞬时，copy 要重写文件。

### `.dvc` 文件结构

```yaml
# data/raw.csv.dvc
outs:
  - md5: a1b2c3d4e5f6...
    path: data/raw.csv
    size: 12345678
```

`.dvc` 文件只记哈希、路径、大小——这是 Git 跟踪的对象，也是版本切换的依据。

### 多版本切换

```bash
# 切到旧版本的数据
git checkout HEAD~1 -- data/raw.csv.dvc   # 切 .dvc 文件版本
dvc checkout                               # 把工作区数据同步到该版本

# 或一步到位（推荐）
git checkout HEAD~1
dvc checkout
```

注意顺序：**先 `git checkout` 切 `.dvc` 文件，再 `dvc checkout` 同步数据**。反了会基于错误的 `.dvc` 同步。

### 数据共享：import 与 import-url

```bash
# 从另一个 DVC 仓库导入数据，保持依赖追踪（上游更新可 dvc update）
dvc import https://github.com/org/repo data/external

# 从任意 URL（http/s3/...）导入
dvc import-url s3://my-bucket/data.csv data/imported.csv
```

`import` 建立跨仓库的数据依赖，`dvc update` 可拉取上游变化；`import-url` 适合一次性拉取外部数据。

## 流水线深入

### dvc.yaml stage 字段

```yaml
stages:
  train:
    cmd: python train.py                # 执行命令（可多行 |）
    wdir: src                           # 工作目录
    deps: [train.py, data/train]        # 依赖（变化触发重跑）
    outs: [model.pkl]                   # 产物（进缓存）
    params:                             # 参数（来自 params.yaml）
      - train.lr
      - train.epochs
    metrics:                            # 指标（不进缓存，直接对比）
      - metrics.json
    plots:                              # 图表数据
      - logs/loss.csv
    frozen: false                       # true 则 repro 跳过此 stage
    always_changed: false               # 强制每次重跑
```

| 字段 | 作用 | 是否进缓存 |
| --- | --- | --- |
| `deps` | 依赖（代码、数据），变化触发重跑 | deps 本身被跟踪 |
| `outs` | 产物（模型、中间数据） | 进缓存 |
| `cmd` | 执行命令 | — |
| `params` | 参数（引用 `params.yaml` 的键） | params.yaml 进 Git |
| `metrics` | 指标文件（JSON/YAML/CSV） | 默认 `cache: false` |
| `plots` | 图表数据文件 | 默认 `cache: false` |
| `frozen` | 冻结此 stage，repro 跳过 | — |

### dvc.lock 与增量复现

```yaml
# dvc.lock（自动生成，进 Git）
stages:
  prepare:
    cmd: python src/prepare.py data/raw.csv data/prepared
    deps:
      - path: data/raw.csv
        md5: a1b2c3...
      - path: src/prepare.py
        md5: d4e5f6...
    outs:
      - path: data/prepared
        md5: 1a2b3c...
```

`dvc repro` 的判定逻辑：对每个 stage，比对当前 deps 的实际哈希与 `dvc.lock` 记录——一致则跳过（复用 outs 缓存），不一致则重跑该 stage 并更新 lock 与下游。

### dag 与 status

```bash
dvc dag                        # 文本依赖图
dvc dag --dot > dag.dot        # 导出 Graphviz
dvc status                     # 哪些 stage 需要重跑
dvc status --cloud             # 远端缓存缺哪些
```

## 实验：dvc exp

```bash
# 改参数跑实验（不改 params.yaml 主文件，用临时栈）
dvc exp run -S train.lr=0.01 -S train.epochs=50

# 列出实验（表格，含参数与指标）
dvc exp show

# 对比实验
dvc exp diff exp-abc123 exp-def456

# 应用某实验到工作区
dvc exp apply exp-abc123

# 把实验固化为 Git 分支
dvc exp branch exp-abc123 exp-lr001

# 推送实验到远端共享
dvc exp push origin exp-abc123
dvc exp pull origin exp-abc123
```

实验栈存储在 `.dvc/exps/`（Git ref `refs/exps/`），不污染主分支，但可 push/pull 共享。

## 缓存维护

```bash
dvc gc -w                       # 清理未被工作区引用的缓存项（-w 保留工作区用到的）
dvc gc -c                       # 仅清理云端缓存
dvc gc --all-branches --all-tags  # 保留所有分支/tag 用到的
dvc push                        # 上传缓存到远端
dvc fetch                       # 仅下载不 checkout
```

多人协作或长期项目，缓存会累积大量孤立项（旧实验、旧版本），定期 `dvc gc` 释放空间。

## 与 MLflow 配合

DVC 与 MLflow 互补：

| 维度 | DVC | MLflow |
| --- | --- | --- |
| 数据/模型版本 | ✅ 内容寻址缓存 | 部分（artifact） |
| 流水线复现 | ✅ dvc.yaml/repro | 弱（Projects 定位摇摆） |
| 实验运行追踪 | 弱（dvc exp） | ✅ Tracking/autolog |
| 模型注册/审批 | ✗ | ✅ Model Registry |
| 部署 | ✗ | ✅ flavor/Deployments |

典型组合：**DVC 管「数据集+模型文件+流水线」的版本与复现，MLflow 管「每次运行的指标/参数/追踪」与模型注册**。训练脚本里同时 `dvc repro` 触发 + `mlflow.autolog()` 记录，二者通过 Git commit 关联。

## 陷阱与最佳实践

- **顺序错乱**：必须 `git pull` 先（拉 `.dvc`/`dvc.lock` 版本）→ 再 `dvc pull`（同步数据）；反了会基于旧 `.dvc` 同步错版本
- **忘 commit `.dvc`/`dvc.lock`**：队友 `dvc pull` 找不到正确版本；养成改完即 `git add *.dvc dvc.lock && git commit` 的习惯
- **大文件直接进 Git**：`.gitignore` 没配好导致大文件被 Git 跟踪，仓库膨胀；`dvc add` 会自动加 `.gitignore`，但手改时易漏
- **缓存冲突**：`.dvc` 文件冲突需手动解决后 `dvc checkout`；多人改同一数据用分支隔离
- **repro 跑全量**：忘了 `frozen: true` 冻结耗时的数据准备 stage，每次 repro 都重跑；对稳定 stage 设 frozen
- **远程凭证泄露**：`.dvc/config` 别直接提交 access key，用环境变量或 Vault 管理
