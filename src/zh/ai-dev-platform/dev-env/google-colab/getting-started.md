---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Google Colab（AI-First Colab + Gemini）编写，参考 [research.google.com/colaboratory/faq.html](https://research.google.com/colaboratory/faq.html) 与 [colab.research.google.com](https://colab.research.google.com/)

## 速查

- **入口**：浏览器开 [colab.research.google.com](https://colab.research.google.com)，登录 Google 账号
- **文件来源**：新建空白 / 上传本地 `.ipynb` / 从 Drive 打开 / 从 GitHub 打开（输入仓库 URL）
- **运行时类型**：Runtime → Change runtime type → Hardware accelerator：None / **GPU（默认 T4）** / **TPU**
- **执行 cell**：`Shift+Enter`（运行并跳到下一个）/ `Ctrl+Enter` / `Alt+Enter`（与 Jupyter 一致）
- **保存**：文件自动存到 Google Drive；`File → Save a copy in Drive` 复制到自己 Drive
- **挂载 Drive**：`from google.colab import drive; drive.mount('/content/drive')`
- **装包**：`!pip install xxx`（Colab 自带的 Python 环境，每次重启需重装）
- **表单**：在代码 cell 里写 `#@param {type:"integer"}` 自动生成 UI
- **Colab AI**：右侧 Gemini 图标，输入自然语言生成 / 解释 / 修复代码
- **运行时限制**：免费层最长 12 小时（动态调整），idle 断开会话；Pro/Pro+ 最长 24 小时
- **临时磁盘**：约 100GB，VM 销毁即丢，必须持久化到 Drive / GCS
- **导出**：`File → Download → .ipynb` 或 `.py`

## Colab 是托管版 Jupyter

Colab 不是新协议，**底层就是 Jupyter 内核协议**——你在浏览器看到的 cell、Markdown、code、输出格式与本地 Jupyter 100% 兼容。差别只在：

| 维度 | 本地 Jupyter | Google Colab |
|---|---|---|
| 部署 | 自己装 Python / Jupyter / CUDA / 驱动 | 浏览器开即用 |
| 硬件 | 看本机 / 自购 GPU | 免费 T4 GPU / TPU |
| 文件存储 | 本地磁盘 | Google Drive |
| 操作系统 | 任意 | Ubuntu（VM） |
| 自定义环境 | venv / conda / Docker | 只能 `!pip install` |
| UI | JupyterLab / Notebook 7 / VS Code | Google 自研简化 UI |
| 协作 | 需要 JupyterHub RTC | 默认 Google Docs 式协作 |
| `.ipynb` 兼容 | ✅ 原生 | ✅ 完全兼容 |

**含义**：本地 Jupyter 写的 `.ipynb` 可直接上传到 Colab 跑；Colab 写的也可下载到本地用 VS Code / JupyterLab 打开。

## 第一次启动

### 进入 Colab

1. 浏览器开 https://colab.research.google.com
2. 用 Google 账号登录（首次会弹欢迎引导）
3. `File → New notebook in Drive` 新建一个 `.ipynb`

### 切换到 GPU 运行时

```
菜单 Runtime → Change runtime type
  Hardware accelerator: GPU      ← 选这个
  Runtime shape: Dynamic          ← 默认动态分配
  → Save
```

切换后 VM 重启，分配到一个新的 GPU 实例。

### 验证 GPU

```python
!nvidia-smi
```

输出会显示 GPU 型号（典型免费层是 **NVIDIA Tesla T4，16GB 显存**）、驱动版本、CUDA 版本、显存占用。

```python
import torch
torch.cuda.is_available()        # True
torch.cuda.get_device_name(0)    # 'Tesla T4'
```

## 挂载 Google Drive

Colab VM 是临时的（断开就丢），所以数据 / 模型要存到 Drive：

```python
from google.colab import drive
drive.mount('/content/drive')
```

执行后弹 OAuth 授权链接，登录 Google 复制验证码回贴。挂载后 Drive 出现在 `/content/drive/MyDrive/`：

```python
import os
os.listdir('/content/drive/MyDrive/')

# 切到工作目录
os.chdir('/content/drive/MyDrive/my_project/')

# 读写文件
with open('/content/drive/MyDrive/data.txt', 'w') as f:
    f.write('persistent storage')
```

::: warning Drive 是对象存储，不是文件系统
- 大量小文件读写**极慢**（每个文件一次 HTTP 请求）
- 解压数据集先复制到 `/content/`（VM 本地磁盘，~100GB），再操作
- 推荐：数据放 GCS / Hugging Face Datasets / Kaggle Datasets，比 Drive 快
:::

### 从 Drive 复制数据到本地

```python
# 把 Drive 上的压缩包复制到 VM 本地解压
!cp '/content/drive/MyDrive/data.tar.gz' /content/
!tar -xzf /content/data.tar.gz -C /content/
```

## 安装 Python 包

Colab 预装了主流科学计算栈（pandas / numpy / scikit-learn / TensorFlow / PyTorch / JAX / Transformers），但其他包要手动装：

```python
# 装到当前 VM（重启运行时会丢）
!pip install peft accelerate bitsandbytes

# 推荐用 %pip（绑定到当前 Python 解释器）
%pip install peft accelerate bitsandbytes

# 装到 Drive（持久化，跨会话）
!pip install peft --target='/content/drive/MyDrive/colab_pkgs/'
import sys
sys.path.append('/content/drive/MyDrive/colab_pkgs/')
```

::: tip 装包后「Restart runtime」
部分包（特别是改了底层库如 `bitsandbytes`）需要重启内核才能 import：`Runtime → Restart session`。Colab 会提示「You must restart the runtime in order to use newly installed versions」。
:::

## 表单（Forms）

表单让 notebook 变成可交互 Demo——用 `#@param` 注释在 cell 里声明参数，Colab 自动生成 UI 控件：

```python
#@title 表单示例
name = "Alice" #@param {type:"string"}
age = 25 #@param {type:"integer"}
weight = 60.5 #@param {type:"number"}
is_student = True #@param {type:"boolean"}
learning_rate = 0.001 #@param {type:"slider", min:0, max:0.1, step:0.001}
model = "bert-base" #@param ["bert-base", "gpt2", "t5-small"]

print(f"训练 {model}，lr={learning_rate}, 用户 {name}")
```

UI 操作流程：

1. 在代码 cell 第一行写 `#@title 表单标题`
2. 在每个变量后加 `#@param {type:"..."}`
3. Colab 在 cell 右侧渲染表单（输入框 / 下拉 / 滑块）
4. 改表单 → 变量值自动同步到代码
5. 运行 cell 使用最新值

支持类型：

| `type` | UI 控件 |
|---|---|
| `"string"` | 文本输入 |
| `"integer"` | 整数输入 |
| `"number"` | 浮点输入 |
| `"boolean"` | 复选框 |
| `"slider"` + `min/max/step` | 滑块 |
| `["a","b","c"]`（数组代替 type） | 下拉 |

也可用 `Insert → Add a form field` 菜单可视化添加。

## Colab AI（Gemini）

右侧栏的 Gemini 图标是 AI 编程助手，基于 Gemini 模型：

- **自然语言生成代码**：「用 PyTorch 写一个 ResNet18 训练循环」→ Colab 自动生成 cell
- **解释代码**：选中代码 → 「Explain this code」→ 输出自然语言说明
- **修复报错**：cell 报错时点「Explain error」/「Suggest fix」→ AI 给出修正
- **代码补全**：输入时 Tab 触发 AI 补全（类似 Copilot）
- **Data Science Agent**：描述分析目标，Agent 自动生成并执行整套 EDA 流程

::: tip Colab AI 的免费与付费
- 免费层有调用次数限制（动态）
- **Colab Pro / Pro+** 用户配额更高、优先级更高
- 也可在本地 VS Code 用 Gemini Code Assist（同模型）
:::

## 上传 / 下载 / 共享

### 上传本地 `.ipynb`

```
File → Upload notebook → 选择本地 .ipynb
```

或拖文件到 Colab 文件列表。

### 从 GitHub 打开

```
File → Open notebook → GitHub 标签
  → 输入 GitHub 仓库 URL（如 huggingface/transformers）
  → 选择仓库里的 .ipynb
```

会复制一份到你的 Drive（**不会改原仓库**）。如果要修改并提交 PR，需要 clone 到本地或用 GitHub Codespaces。

### 下载

```
File → Download → .ipynb  （含输出）
File → Download → .py     （纯 Python，剥离 cell 结构）
```

### 共享

notebook 存到 Drive 后，用 Drive 的共享机制——发链接、设权限（查看 / 评论 / 编辑）、协作者同时编辑（Google Docs 式实时协作）。

## 运行时管理

### 运行时类型

| 类型 | 硬件 | 用途 |
|---|---|---|
| **None (CPU only)** | 普通 CPU | 数据处理、推理小模型 |
| **GPU**（默认） | NVIDIA T4 16GB | 训练 / 推理中型模型（BERT、SD、7B 量化） |
| **TPU** | TPU v2（8 核心） | JAX / PyTorch/XLA 大模型训练 |

Pro / Pro+ 还有：

- **Premium GPU**：A100 40GB（Pro 可申请，按可用性分配）
- **High-RAM**：83GB 内存（Pro+）

### 重启 / 断开 / 删除

```
Runtime → Restart session         # 重启内核，变量清空，包保留
Runtime → Restart session and run all  # 重启并跑全部 cell（验证复现）
Runtime → Disconnect and delete runtime  # 销毁 VM（释放配额）
```

### 配额与限制

- **免费层**：动态配额，无固定上限，但 idle 断开 + 最长 12 小时
- **Pro（10 美元/月）**：优先 GPU、最长 24 小时、Premium GPU（A100）可申请
- **Pro+（50 美元/月）**：背景执行（关浏览器也跑）、High-RAM
- **Pay As You Go**：按计算单元（compute unit）付费，最灵活

::: warning 频繁申请会被风控
免费层短时间内多次重连 / 多个 notebook 同时申请 GPU，会被风控降权，后续更难拿到 GPU。建议一个 notebook 一台 GPU，用完 Disconnect。
:::

## 与本地 / Drive / GitHub 同步

### 从 GitHub clone 数据

```python
!git clone https://github.com/user/repo.git
```

私有仓库需要 token：

```python
!git clone https://USERNAME:TOKEN@github.com/user/repo.git
```

### 用 GCS（Google Cloud Storage）

大数据集推荐用 GCS 而非 Drive：

```python
from google.colab import auth
auth.authenticate_user()

!gsutil cp gs://my-bucket/data.parquet /content/
```

### Kaggle Datasets

```python
# 上传 kaggle.json 到 Drive
!mkdir -p ~/.kaggle
!cp /content/drive/MyDrive/kaggle.json ~/.kaggle/
!chmod 600 ~/.kaggle/kaggle.json
!pip install kaggle
!kaggle datasets download -d dataset-name
```

## 与本地 Jupyter / VS Code 的互通

- **下载 `.ipynb` → 本地**：File → Download → .ipynb，本地用 VS Code / JupyterLab 打开
- **本地 `.ipynb` → Colab**：上传到 Drive，在 Colab 打开
- **VS Code 连 Colab**：装 `colab-connector` 扩展（社区），一键打开 Colab

## 下一步

- 入门到此能跑通：开浏览器 → 起会话 → 切 GPU → 装 Drive → 写 cell → 跑模型
- 进阶内容（见 `guide-line.md`）：
  - TPU 训练（JAX / PyTorch/XLA）
  - Colab Pro/Pro+ 高级特性（A100、背景执行）
  - 与 Hugging Face Transformers / diffusers / PEFT 深度集成
  - 长任务持久化（GCS / Drive / Checkpoint）
  - Colab 与本地 JupyterHub / Vertex AI Workbench 的取舍
- 参考（见 `reference.md`）：
  - 全部 `#@param` 类型
  - 常用快捷键
  - 与本地 Jupyter / Kaggle 的对比表
  - 配额与定价
