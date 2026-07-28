---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Google Colab（含 Pro / Pro+ / Pay As You Go）编写，参考 [research.google.com/colaboratory/faq.html](https://research.google.com/colaboratory/faq.html) 与 [colab.research.google.com](https://colab.research.google.com/)

## 速查

- **入口**：[colab.research.google.com](https://colab.research.google.com)
- **`.ipynb` 兼容**：与本地 Jupyter 100% 兼容（底层是 Jupyter Messaging Protocol）
- **VM 规格**（免费层）：Ubuntu + 12GB 内存 + ~100GB 临时磁盘
- **GPU**：免费 T4 16GB；Pro 可申请 A100 40GB / L4
- **TPU**：免费 TPU v2（8 核心）
- **运行时上限**：免费最长 12 小时；Pro/Pro+ 最长 24 小时
- **存储**：Google Drive（持久化）+ `/content/`（VM 本地，临时）
- **Python**：3.10+（随版本更新）
- **预装**：TensorFlow / PyTorch / JAX / scikit-learn / pandas / Transformers
- **AI**：Colab AI（Gemini）—— 生成 / 解释 / 修复代码

## 运行时类型与硬件

### Hardware accelerator

| 类型 | 免费层 | Pro | Pro+ |
|---|---|---|---|
| **None (CPU)** | ✅ | ✅ | ✅ |
| **GPU** | T4 16GB | T4 / Premium (A100 40GB) | T4 / A100 / L4 |
| **TPU** | TPU v2 | TPU v2 | TPU v2 |

### Runtime shape

- **Dynamic**（默认）：Google 按负载分配资源
- **High-RAM**（Pro+）：~83GB 内存，跑大 batch

### 切换方法

```
Runtime → Change runtime type → 选 Hardware accelerator + Runtime shape → Save
```

切换后 VM 重启。

## 计划与定价

| 计划 | 价格 | 主要权益 |
|---|---|---|
| **Free** | 免费 | T4 GPU / TPU，最长 12h，动态配额 |
| **Pro** | 10 美元/月 | 优先 GPU、最长 24h、Premium GPU（A100）、更多 RAM |
| **Pro+** | 50 美元/月 | 背景执行、High-RAM、更多配额 |
| **Pay As You Go** | 按计算单元 | 灵活付费、企业级配额 |

::: tip Compute Units
Pay As You Go 用「compute unit」计费（约 100 个/100 美元）：

- 1 个 compute unit ≈ 1 个 GPU-hour（标准 T4）
- Premium GPU（A100）消耗 2-3 个/小时
- 用完即止，不过期（在订阅期内）
:::

## `#@param` 类型完整表

| `type` | 用法 | UI 控件 |
|---|---|---|
| `"string"` | `name = "Alice" #@param {type:"string"}` | 文本输入 |
| `"integer"` | `age = 25 #@param {type:"integer"}` | 整数输入 |
| `"number"` | `weight = 60.5 #@param {type:"number"}` | 浮点输入 |
| `"boolean"` | `is_ok = True #@param {type:"boolean"}` | 复选框 |
| `"date"` | `d = "2026-01-15" #@param {type:"date"}` | 日期选择器 |
| `"slider"` | `x = 50 #@param {type:"slider", min:0, max:100, step:1}` | 滑块 |
| `"raw"` | `s = "abc" #@param {type:"raw"}` | 原始输入（无验证） |
| 数组代替 type | `m = "a" #@param ["a", "b", "c"]` | 下拉 |

完整示例：

```python
#@title 训练配置
model_name = "bert-base-uncased" #@param ["bert-base-uncased", "gpt2", "t5-small"]
learning_rate = 0.0001 #@param {type:"slider", min:0.00001, max:0.01, step:0.00001}
batch_size = 32 #@param {type:"integer"}
epochs = 3 #@param {type:"integer"}
use_amp = True #@param {type:"boolean"}
output_dir = "/content/drive/MyDrive/outputs" #@param {type:"string"}
start_date = "2026-01-15" #@param {type:"date"}

print(f"训练 {model_name}: lr={learning_rate}, bs={batch_size}, amp={use_amp}")
```

## 快捷键表

Colab 快捷键与 Jupyter 大致一致，但有 Google 自定义：

| 快捷键 | 行为 |
|---|---|
| `Shift+Enter` | 运行 cell + 跳到下一个 |
| `Ctrl+Enter` / `Cmd+Enter` | 运行 cell 停在原位 |
| `Alt+Enter` / `Option+Enter` | 运行 cell + 插入新 cell |
| `Ctrl+M A` | 上方插入 cell |
| `Ctrl+M B` | 下方插入 cell |
| `Ctrl+M D D` | 删除 cell |
| `Ctrl+M M` | 切换为 markdown |
| `Ctrl+M Y` | 切换为 code |
| `Ctrl+M Z` | 撤销删除 |
| `Ctrl+M Shift+Enter` | 在 Colab Pro+ 后台运行 |
| `Ctrl+M H` | 显示快捷键列表 |
| `Ctrl+S` | 保存（自动保存到 Drive） |

::: tip 两种快捷键模式
Colab 默认用 `Ctrl+M` 前缀（与 Jupyter 的 `Esc` 命令模式不同），可在 `Tools → Keyboard shortcuts` 切换为「classic」模式（Jupyter 风格）。
:::

## `google.colab` 内置库

### `drive`：挂载 Drive

```python
from google.colab import drive
drive.mount('/content/drive')
drive.flush_and_unmount()  # 卸载
```

### `files`：上传 / 下载

```python
from google.colab import files

# 上传（弹文件选择）
uploaded = files.upload()
for name in uploaded:
    print(name, len(uploaded[name]), 'bytes')

# 下载
files.download('/content/result.csv')
```

### `auth`：GCP 鉴权

```python
from google.colab import auth
auth.authenticate_user()

# 之后用 gsutil / google-cloud-* 库
import google.cloud.storage
client = google.cloud.storage.Client()
```

### `output`：自定义输出

```python
from google.colab import output

# 注册 Python 函数让前端 JS 调
@output.register_callback('greet')
def greet(name):
    return f'Hello, {name}'

# 在 cell 输出区执行 JS
output.eval_js('alert("hello")')

# 实时更新输出（避免 print 刷屏）
with output.use_tags('some_tag'):
    print('更新中...')
output.clear(output_tags='some_tag')
```

## 预装包列表

Colab 镜像预装了主流科学计算栈（每次启动约 4GB）。可通过 `!pip list` 看完整列表，常见的：

| 类别 | 包 |
|---|---|
| **核心** | numpy / scipy / pandas / matplotlib / seaborn |
| **ML** | scikit-learn / xgboost / lightgbm |
| **DL** | tensorflow / torch / torchvision / torchaudio / jax / flax |
| **NLP / LLM** | transformers / tokenizers / datasets / sentence-transformers |
| **CV** | opencv-python / Pillow / albumentations |
| **可视化** | plotly / bokeh / altair |
| **Web** | requests / httpx / flask |
| **Notebook** | ipywidgets / notebook / jupyterlab |
| **Colab 自有** | google-colab（drive/files/auth/output） |

每次重启 VM 不会丢这些预装包；只有 `!pip install` 装的第三方包会丢。

## 与其他工具对比

| 维度 | Colab | Kaggle Notebooks | 本地 Jupyter | Vertex AI Workbench |
|---|---|---|---|---|
| 部署 | 浏览器即用 | 浏览器即用 | 自己装 | GCP 托管 |
| 免费 GPU | T4 16GB | T4 x2 / P100 | 无 | 无（按需付费） |
| 文件存储 | Google Drive | Kaggle Datasets | 本地磁盘 | GCS |
| 数据集 | 自带 / Drive | 内置 Kaggle 数据集 | 自带 | GCS / BigQuery |
| 运行时上限 | 12h（24h Pro） | 12h（30h/周） | 无 | 无（按需） |
| 协作 | Google Docs 式 | 不可协作 | RTC（JupyterLab） | GCP IAM |
| AI 助手 | Colab AI（Gemini） | 无 | 无 | Gemini in Vertex |
| 自定义环境 | 仅 `!pip` | 仅 `!pip` | venv/conda/Docker | Docker / 自定义 |
| 私有数据 | Drive（合规风险） | Kaggle Datasets | 本地 | GCS + IAM |
| 适合人群 | 学生、研究者、Demo | 竞赛选手 | 重度用户、工程师 | 企业 MLOps |

## 配额与限速细节

### 免费层配额

- **GPU 时长**：动态，无固定上限；高峰期可能拒绝分配
- **idle 断开**：约 30-90 分钟无操作会断
- **最长会话**：12 小时（墙钟）
- **多 notebook 并发**：通常 1-2 个

### Pro / Pro+ 配额

- **优先级**：GPU 队列优先分配
- **Premium GPU**：A100 40GB（受可用性限制）
- **背景执行**（Pro+）：关浏览器跑
- **配额提升**：约 2x / 5x 免费层

### 风控触发

- 短时间内多次 disconnect / reconnect
- 多账号在同一 IP 申请 GPU
- 高频调用 Colab AI
- 加密货币挖矿（会被永久封号）

## 安全检查清单

部署敏感项目时的检查项：

1. **API Key 不写硬编码**：用 Drive `.env` + `python-dotenv`，或 Google Secret Manager
2. **数据存私有 GCS**：用 IAM 权限控制，避免 Drive 公开链接
3. **关闭「保存到 Drive」**：敏感输出存到 VM 后立即删除，不持久化
4. **审计共享权限**：检查 Drive 文件夹的「任何人都能查看」
5. **登出 Google 账号**：用完 Colab 在 Google 账号页 revoke Colab 权限
6. **企业合规**：金融 / 医疗数据用 Vertex AI Workbench（有合规认证），不用公开 Colab

## 常见问题

### Q: 我能跑 7B 模型吗？

A: T4 16GB 上可以——但需要 4-bit 量化（`bitsandbytes`）+ LoRA（`peft`）。完整 BF16 推理 7B 需要 14GB+，T4 不支持 BF16，需要 FP16 或量化。

### Q: 12 小时墙之后怎么办？

A: 三种方案：

1. **Checkpoint + 重启恢复**：每 N 步存 Drive，新会话加载继续
2. **多 Colab 串联**：写个 controller notebook 触发下一个
3. **升级 Pro+**：24h + 背景执行

### Q: 训练突然被中断了？

A: 检查：

- 是否 idle 太久（移动鼠标 / 跑 cell）
- 是否触发了 12h 墙
- 是否被风控（短时间内多次申请 GPU）

### Q: Colab 能用 Docker 吗？

A: **不能**。Colab VM 不支持嵌套虚拟化，也不能 sudo 装 Docker。要自定义环境只能 `!pip install` 或把代码上传到 Drive。

### Q: 怎么本地编辑 Colab notebook？

A: 下载 `.ipynb` → 用 VS Code / JupyterLab 编辑 → 上传回 Drive / Colab。或装 `colab-cli` 命令行同步。

### Q: Colab 与 Vertex AI Workbench 什么关系？

A: 都是 Google 出品，Colab 是消费级（免费 / 低门槛），Vertex AI Workbench 是企业级（GCP 集成、IAM、合规、无 24h 限制）。后者底层也是 Jupyter，但运行在 GCP 用户自己的项目里。
