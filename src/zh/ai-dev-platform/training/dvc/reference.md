---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 DVC 官方文档（doc.dvc.org/command-reference）+ iterative/dvc GitHub 整理，对照稳定版 3.67.1（2026-03-31）

## 速查

- **安装**：`pip install dvc` / `pip install "dvc[s3,gcs,azure]"` / `pip install "dvc[all]"`
- **数据版本**：`dvc init` / `add` / `push` / `pull` / `fetch` / `checkout` / `status` / `diff` / `remove` / `move` / `gc`
- **远程**：`dvc remote add/modify/remove/default/list`
- **流水线**：`dvc.yaml` + `dvc repro` / `dag` / `status` / `stage add` / `pipeline list/show`
- **参数/指标/图表**：`dvc params show/diff` / `dvc metrics show/diff` / `dvc plots show/diff`
- **实验**：`dvc exp run/save/show/diff/apply/branch/push/pull/remove/list`
- **缓存**：`.dvc/cache`，内容寻址；`cache.type`/`cache.shared`/`cache.dir` 配置
- **配置**：`.dvc/config`，`dvc config &lt;key&gt; <value>`
- **版本**：稳定版 **3.67.1**（2026-03-31）

## 命令全景表

### 数据版本控制

| 命令 | 说明 |
| --- | --- |
| `dvc init` | 在 Git 仓库内初始化 DVC |
| `dvc add &lt;file/dir&gt;` | 跟踪数据/模型，生成 `.dvc` 文件 |
| `dvc push` | 上传缓存到远程存储 |
| `dvc pull` | `fetch` + `checkout`，从远端同步到工作区 |
| `dvc fetch` | 仅从远端下载到缓存 |
| `dvc checkout` | 把工作区链接同步到 `.dvc` 指定的版本 |
| `dvc status` | 工作区与缓存/远端的差异 |
| `dvc diff` | 对比两个版本的数据差异 |
| `dvc remove <.dvc>` | 取消跟踪 |
| `dvc move &lt;src&gt; <dst>` | 移动跟踪的文件 |
| `dvc gc` | 清理未被引用的缓存项 |
| `dvc unprotect &lt;file&gt;` | 取消只读保护（允许修改） |
| `dvc get &lt;repo&gt; <path>` | 从远端 DVC 仓库取文件（不建依赖） |
| `dvc import &lt;repo&gt; <path>` | 从远端 DVC 仓库导入（保持依赖，可 update） |
| `dvc import-url &lt;url&gt; <path>` | 从任意 URL 导入 |

### 远程存储

| 命令 | 说明 |
| --- | --- |
| `dvc remote add -d &lt;name&gt; <url>` | 添加并设为默认远程 |
| `dvc remote modify &lt;name&gt; <key> <value>` | 修改远程配置（如 endpointurl/credentials） |
| `dvc remote remove &lt;name&gt;` | 删除远程 |
| `dvc remote default &lt;name&gt;` | 设默认远程 |
| `dvc remote list` | 列出所有远程 |

### 远程存储后端

| 协议 | 示例 URL |
| --- | --- |
| Amazon S3 | `s3://bucket/path` |
| Google Cloud Storage | `gs://bucket/path` |
| Azure Blob Storage | `azure://container/path` |
| SSH | `user@host:/path` |
| HDFS | `hdfs://host/path` |
| WebHDFS | `webhdfs://host/path` |
| WebDAV | `webdav://host/path` |
| HTTP/HTTPS | `https://host/path` |
| 本地 | `/abs/path` 或 `./rel/path` |
| 远程引用 | `remote://name/path` |

### 流水线

| 命令 | 说明 |
| --- | --- |
| `dvc stage add` | 添加一个 stage 到 dvc.yaml |
| `dvc repro [target]` | 复现流水线（增量，只重跑受影响 stage） |
| `dvc dag` | 可视化依赖图 |
| `dvc status` | 哪些 stage 需要重跑 |
| `dvc pipeline list/show` | 流水线信息 |
| `dvc commit` | 把当前 outs 写入 dvc.lock（不跑命令） |
| `dvc commit -f` | 强制更新所有 lock |

### 参数 / 指标 / 图表

| 命令 | 说明 |
| --- | --- |
| `dvc params show` | 列出参数（来自 params.yaml） |
| `dvc params diff [rev]` | 对比参数变化 |
| `dvc metrics show` | 显示指标（metrics.json 等） |
| `dvc metrics diff [rev]` | 对比指标变化 |
| `dvc plots show [file]` | 生成图表 |
| `dvc plots diff [rev]` | 对比图表 |
| `dvc plots modify` | 配置图表模板/字段 |

### 实验

| 命令 | 说明 |
| --- | --- |
| `dvc exp run [-S param=value]` | 跑实验（可临时改参数） |
| `dvc exp save &lt;name&gt;` | 保存当前为命名实验 |
| `dvc exp show` | 列出所有实验 |
| `dvc exp diff &lt;a&gt; <b>` | 对比实验 |
| `dvc exp apply &lt;name&gt;` | 应用实验到工作区 |
| `dvc exp branch &lt;exp&gt; <branch>` | 实验固化为 Git 分支 |
| `dvc exp push &lt;remote&gt; <exp>` | 推送实验 |
| `dvc exp pull &lt;remote&gt; <exp>` | 拉取实验 |
| `dvc exp remove &lt;exp&gt;` | 删除实验 |
| `dvc exp list` | 列出实验 |

## dvc.yaml 字段参考

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `stages` | map | stage 定义 |
| `stages.&lt;name&gt;.cmd` | string | 执行命令 |
| `stages.&lt;name&gt;.wdir` | string | 工作目录 |
| `stages.&lt;name&gt;.deps` | list | 依赖（代码/数据） |
| `stages.&lt;name&gt;.outs` | list | 产物（进缓存） |
| `stages.&lt;name&gt;.params` | list | 参数（引用 params.yaml） |
| `stages.&lt;name&gt;.metrics` | map/list | 指标文件 |
| `stages.&lt;name&gt;.plots` | map/list | 图表数据文件 |
| `stages.&lt;name&gt;.frozen` | bool | 冻结此 stage |
| `stages.&lt;name&gt;.always_changed` | bool | 强制每次重跑 |
| outs 项 `cache: false` | bool | 不进缓存（如 metrics） |
| outs 项 `persist: true` | bool | 持久（不被 repro 清除） |

## 配置参考（.dvc/config）

| 配置 | 说明 |
| --- | --- |
| `cache.type` | 链接策略：`reflink,symlink,hardlink,copy` |
| `cache.shared` | `group` 让团队共享缓存目录权限 |
| `cache.dir` | 自定义缓存目录 |
| `remote.&lt;name&gt;.url` | 远程存储地址 |
| `remote.&lt;name&gt;.endpointurl` | 自定义端点（MinIO 等） |
| `remote.&lt;name&gt;.access_key_id` / `secret_access_key` | 凭证（建议用环境变量） |
| `remote.&lt;name&gt;.region` | 区域 |
| `core.remote` | 默认远程名 |

## 关键文件清单

| 文件 | 是否进 Git | 作用 |
| --- | --- | --- |
| `.dvc/config` | ✅ | DVC 与远程配置 |
| `.dvc/cache/` | ❌ | 内容寻址缓存 |
| `.dvcignore` | ✅ | DVC 忽略规则 |
| `&lt;file&gt;.dvc` | ✅ | 跟踪文件的元数据（哈希+路径） |
| `dvc.yaml` | ✅ | 流水线定义 |
| `dvc.lock` | ✅ | 流水线锁（deps/outs 哈希） |
| `params.yaml` | ✅ | 参数文件 |
| `metrics.json` | ✅ | 指标文件（cache: false） |

## 与竞品/伙伴对照

| 维度 | DVC | MLflow | W&B |
| --- | --- | --- | --- |
| 数据版本控制 | ✅ 核心 | 弱 | Artifacts |
| 流水线复现 | ✅ dvc.yaml/repro | Projects（弱） | ✗ |
| 实验运行追踪 | dvc exp（轻） | ✅ Tracking/autolog | ✅ Run/log |
| 模型注册 | ✗ | ✅ Registry | ✅ Registry |
| 部署 | ✗ | ✅ flavor/Deployments | ✅ Serverless |
| 形态 | 开源 CLI | 开源/自托管 | SaaS/自托管 |

## 近期版本要点

| 版本 | 关键变化 |
| --- | --- |
| 3.x | 命令体系稳定；`dvc exp` 实验管理增强；远程后端覆盖广；`stage add` 命令化 |
| 3.65–3.67（2025-12 ~ 2026-03） | 持续性能优化、bug 修复、与新 Python/依赖兼容性 |

## 官方资源

- [DVC 官方文档](https://dvc.org/doc)（doc.dvc.org）
- [Get Started](https://doc.dvc.org/start)
- [命令参考](https://doc.dvc.org/command-reference)
- [iterative/dvc（GitHub）](https://github.com/iterative/dvc)
- [DVC 示例与教程](https://dvc.org/doc/use-cases)
- [Iterative 集成生态（VS Code 扩展 / Studio）](https://iterative.ai/)
