---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 DVC 官方文档（doc.dvc.org/start，Get Started / Data Management / Data Pipelines / Experiments 章节）编写，对照当前稳定版 3.67.1（2026-03-31）

## 速查

- **安装**：`pip install dvc`（带云后端：`pip install "dvc[s3]"` / `dvc[gcs]"` / `dvc[azure]"`）
- **前提**：DVC 是 Git 扩展，必须先 `git init` 再 `dvc init`
- **数据版本核心命令**：`dvc init` / `dvc add &lt;file&gt;` / `dvc push` / `dvc pull` / `dvc checkout` / `dvc status` / `dvc diff`
- **远程存储**：`dvc remote add -d &lt;name&gt; <url>`，支持 S3/GCS/Azure/SSH/HDFS/本地/HTTP
- **元数据文件**：`&lt;file&gt;.dvc`（占位，进 Git）；`dvc.lock`（流水线锁定，进 Git）；`dvc.yaml`（流水线定义，进 Git）
- **缓存**：默认 `.dvc/cache`，内容寻址（按 MD5 哈希）
- **流水线**：`dvc.yaml` 的 `stages`（`deps`/`outs`/`cmds`/`metrics`/`params`）→ `dvc repro` 增量复现 → `dvc dag` 看图
- **指标/参数**：`dvc params show/diff`、`dvc metrics show/diff`、`dvc plots show/diff`
- **实验**：`dvc exp run` / `dvc exp show` / `dvc exp diff` / `dvc exp apply`
- **版本**：稳定版 **3.67.1**（2026-03-31）

## 安装与初始化

```bash
pip install "dvc[s3]"          # 装核心 + S3 后端（按需选 gcs/azure/ssh/all）

git init                       # ① 必须先有 Git 仓库
dvc init                       # ② 在 Git 仓库内初始化 DVC（生成 .dvc/ 配置）
git commit -m "init dvc"
```

`dvc init` 生成 `.dvc/` 目录（配置、缓存、钩子）与 `.dvcignore`，这些进 Git 跟踪。

## 数据版本控制：add / push / pull

```bash
# 跟踪一个大文件
dvc add data/raw.csv           # 原文件移到 .dvc/cache，工作区保留链接，生成 data/raw.csv.dvc
                                # 同时把 data/raw.csv 加入 .gitignore
git add data/raw.csv.dvc .gitignore
git commit -m "track raw data"

# 配远程存储并上传
dvc remote add -d myremote s3://my-bucket/dvc-store
dvc push                       # 把缓存内容上传到远端

# 团队成员还原
git clone <repo> && cd <repo>
dvc pull                       # 等价于 (dvc fetch + dvc checkout)：下载并同步数据到工作区
```

要点：

- **`dvc add` 不上传数据**——只是把数据移入本地缓存 + 生成 `.dvc` 占位文件。上传要 `dvc push`
- **`.dvc` 文件进 Git**：它记录数据的哈希与缓存路径，是版本切换的依据
- **`dvc pull` = `dvc fetch` + `dvc checkout`**：先从远端下载到缓存，再把工作区链接同步到当前版本
- **切换版本**：`git checkout &lt;commit&gt;`（切 `.dvc` 文件版本）→ `dvc checkout`（同步对应数据到工作区）

## 远程存储配置

```bash
dvc remote add -d storage s3://my-bucket/dvc
dvc remote modify storage endpointurl https://s3.example.com   # 自定义端点（MinIO 等）
dvc remote modify storage access_key_id XXX
dvc remote modify storage secret_access_key YYY

# 支持的后端
# s3://  gcs://  azure://  ssh://  hdfs://  remote://  /local/path  http(s)://
```

配置存在 `.dvc/config`，进 Git（敏感凭证用环境变量或单独管理）。

## 流水线：dvc.yaml 与 dvc repro

### 定义流水线

```yaml
# dvc.yaml
stages:
  prepare:
    cmd: python src/prepare.py data/raw.csv data/prepared
    deps:
      - src/prepare.py
      - data/raw.csv
    outs:
      - data/prepared
  train:
    cmd: python src/train.py data/prepared model.pkl
    deps:
      - src/train.py
      - data/prepared
    outs:
      - model.pkl
    metrics:
      - metrics.json:
          cache: false
    params:
      - train.epochs
      - train.lr
```

### 执行与复现

```bash
dvc repro                      # 自动判断哪些 stage 的 deps 变了，增量重跑
dvc repro train                # 只跑到 train stage
dvc dag                        # 可视化依赖图（prepare → train）
dvc status                     # 看哪些 stage 需要重跑
```

`dvc repro` 的核心：基于 `dvc.lock`（记录每个 stage 的 deps/outs 精确哈希）判断变化——只有 deps 变了的 stage 才重跑，未变的直接复用缓存产物，省算力（类似 Makefile 的依赖驱动）。

## 参数、指标与图表

```bash
# params.yaml（被 dvc.yaml 引用）
# train:
#   epochs: 10
#   lr: 0.001

dvc params show                # 列出所有参数
dvc params diff                # 对比当前与上次的参数变化

dvc metrics show               # 显示 metrics.json 当前值
dvc metrics diff               # 对比指标变化

dvc plots show                 # 生成图表（默认 HTML）
dvc plots diff                 # 对比多个实验的图表
```

`metrics`/`params`/`plots` 是 DVC 流水线的一等公民——`dvc.yaml` 里声明后，`show`/`diff` 命令直接对比，无需额外平台。

## 实验：dvc exp

```bash
dvc exp run -S train.lr=0.01   # 改参数跑实验（不污染主分支）
dvc exp show                   # 列出所有实验及其指标
dvc exp diff                   # 对比实验
dvc exp apply <exp-name>       # 把某实验结果应用到工作区
dvc exp branch <exp-name> exp-branch   # 把实验固化为 Git 分支
```

`dvc exp` 把实验管理内建到 Git 工作流：实验是临时栈，不进主分支，但可对比、可 apply、可固化为分支。

## 下一步

入门掌握 add/push/pull + dvc.yaml/repro 后，按方向深入：

- **要团队协作**：配好远程存储，约定 `git pull && dvc pull` 的同步纪律
- **要实验对比**：用 `dvc exp` 管理实验分支，配合 `dvc metrics/plots diff` 选最优
- **要端到端 MLOps**：DVC 管数据/流水线版本，再接 MLflow 管运行追踪与模型注册
- **要 CI/CD 复现**：在 CI 里 `dvc repro` 跑全流水线，保证提交即可复现
