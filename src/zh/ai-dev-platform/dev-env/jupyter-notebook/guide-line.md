---
layout: doc
outline: [2, 3]
---

# 进阶指南

> 基于 JupyterLab 4.x / Notebook 7.x 编写，参考 [jupyterlab.readthedocs.io](https://jupyterlab.readthedocs.io/en/latest/) 与 [jupyter.org](https://jupyter.org/)

## 速查

- **JupyterLab 核心**：文件浏览器 / 多标签 / 终端 / 调试器 / 命令面板（`Ctrl+Shift+C`）/ 设置编辑器（`Settings → Advanced Settings Editor`）
- **实时协作（RTC）**：`pip install jupyter-collaboration` 后 `jupyter lab --collaborative`，多用户同改一文件
- **调试器**：装 `xeus-python`（`conda install -c conda-forge xeus-python`）后切到该内核即可断点 / 变量面板
- **目录**：左侧「Table of Contents」自动按 Markdown 标题生成导航
- **扩展系统**：JupyterLab 4 起用 federated extension（prebuilt），通过 `pip install` 或 `jupyter labextension install` 装
- **Voilà Dashboard**：`pip install voila && voila my.ipynb` 把 notebook 转交互式 web 应用
- **papermill**：`pip install papermill`，参数化批量执行 notebook
- **jupytext**：`pip install jupytext`，`.ipynb` ⇄ `.py:percent` 双向同步
- **nbstripout**：清空 `.ipynb` 输出后再 git commit
- **ipywidgets**：交互式 widget（slider / dropdown / button），数据探索 UI
- **Dask JupyterLab**：Dask Lab Extension 显示任务图、worker 状态
- **nbdev**：写 notebook 同时出包 + 文档（fast.ai 出品）

## JupyterLab 完整 IDE 体验

JupyterLab 是 Project Jupyter 的下一代 Web IDE——把 notebook、文件管理、终端、调试器、富文本编辑、Git、扩展市场揉到一个界面。

### 主要 UI 区域

```
┌─────────────────────────────────────────────────────┐
│ Menu Bar (File / Edit / View / Run / Kernel / ...)  │
├──────┬──────────────────────────────────┬───────────┤
│ Left │                                  │ Right     │
│ Side │       Main Work Area             │ Sidebar   │
│ bar  │  ┌──────────────────────────┐    │           │
│      │  │ Notebook tab 1           │    │           │
│ ▢ 文 │  │                          │    │  Property │
│ ▢ 搜 │  │  [code cell]             │    │  Inspector│
│ ▢ 目 │  │  [markdown]              │    │ / Debugger│
│ ▢ 终 │  │  ...                     │    │           │
│ ▢ 扩 │  └──────────────────────────┘    │           │
│      │  ┌──────────────────────────┐    │           │
│      │  │ Terminal / Console       │    │           │
│      │  └──────────────────────────┘    │           │
├──────┴──────────────────────────────────┴───────────┤
│ Status Bar (kernel / mode / line:col)               │
└─────────────────────────────────────────────────────┘
```

### 命令面板（Command Palette）

`Ctrl+Shift+C`（macOS: `Cmd+Shift+C`）调出，几乎所有操作都能在这里搜——VS Code 用户应该很熟悉。

### 多 Tab 与拖放

- 多个 notebook / 文件 / 终端 并排显示（拖放分屏）
- 单元格可以拖到 notebook 外、变成 console（独立运行空间）
- Markdown 预览实时分屏

### 终端

`File → New → Terminal` 起一个 web terminal，跑 git / ssh / shell 都行（与本地终端体验一致，但走 WebSocket）。

## 调试器

JupyterLab 内置 debugger UI，但**只有部分内核支持断点**：

| 内核 | 是否支持断点 |
|---|---|
| `xeus-python` | ✅ 完整支持 |
| `ipykernel`（默认 Python） | ❌ 至 7.x 仍不支持断点（设计限制） |
| `xeus-lua` / `xeus-sql` | ✅ |

安装 xeus-python：

```bash
conda create -n debug python=3.11 xeus-python jupyterlab
conda activate debug
jupyter lab
```

UI 上切到该内核即可用 `设置断点 / 单步 / Step Into / 变量面板`。

## 扩展系统

JupyterLab 4 起用 **federated extensions**（预构建扩展，不重编译）：

```bash
# 通过 pip 装最常见扩展
pip install jupyterlab-git          # Git 集成
pip install jupyterlab-lsp          # LSP 自动补全 / 跳转
pip install jupyterlab-favorites    # 收藏夹
pip install @jupyterlab/google-drive  # Google Drive 集成

# 通过 labextension（旧方式，老扩展）
jupyter labextension install @jupyter-widgets/jupyterlab-manager

# 列出已装扩展
jupyter labextension list

# 卸载
jupyter labextension uninstall @xxx/yyy
```

**老扩展系统**（JupyterLab 3 之前的 source extension）已废弃，新扩展都用 `pip` 一行装好。

## 实时协作（RTC）

多人同时编辑一个 notebook，类似 Google Docs：

```bash
pip install jupyter-collaboration
jupyter lab --collaborative         # 启动时开 RTC
```

每个打开 notebook 的用户都会出现在右上角的协作头像列表，光标位置实时同步。基于 Yjs CRDT，支持断网重连。

::: warning RTC 的限制
- 仅对 `.ipynb` 与 `.json` 文件生效
- 内核只有一个——多人共享同一份运行时状态（你的变量 = 我的变量）
- RTC 文件存到 `~/.jupyter/rtc/`（或自定义路径）
:::

## ipywidgets：交互式 widget

```python
import ipywidgets as widgets
from IPython.display import display

slider = widgets.IntSlider(value=5, min=0, max=10, description='x:')
button = widgets.Button(description='Click')

def on_click(b):
    print(f'clicked, x={slider.value}')
button.on_click(on_click)

display(slider, button)
```

`@widgets.interact` 装饰器自动按函数签名生成 UI：

```python
@widgets.interact(x=(0, 10), color=['red', 'blue'])
def plot(x=5, color='red'):
    import matplotlib.pyplot as plt
    plt.plot(range(x), color=color)
```

> **JupyterLab 4 / Notebook 7 默认就支持 widget**，无需额外装 `jupyterlab-widgets`（已内置）。

## Voilà：notebook 转 web 应用

Voilà 把 notebook 渲染成「**隐藏代码 + 展示输出 + widget 可交互**」的 web 应用，类似轻量 Streamlit：

```bash
pip install voila
voila my_dashboard.ipynb          # 启动 http://localhost:8866
voila --template=gridstack my.ipynb   # 模板：gridstack / material / vuetify
```

典型用法：

- notebook 里写好 `ipywidgets` UI + 数据加载逻辑
- `voila notebook.ipynb` 部署成内部 dashboard
- 嵌入 iframe 给业务方看，不需要看代码

配合 `voila-gridstack` 可拖拽布局，类似 Jupyter Dashboard 的体验。

## papermill：参数化批量执行

数据 pipeline 场景的「**带参数批跑 notebook**」工具，被 Netflix / Stitch Fix 等公司用于 ETL：

```bash
pip install papermill
```

在 notebook 第一个 cell 用「Parameters」tag 标记参数 cell：

```python
# Parameters（cell tag: parameters）
alpha = 0.1
data_path = 'data/train.csv'
```

命令行传参覆盖：

```bash
papermill train.ipynb out.ipynb \
  -p alpha 0.05 \
  -p data_path 'data/test.csv' \
  -k python3
```

特点：

- 输入 + 输出都是 `.ipynb`，输出包含执行结果
- 支持 S3 / Azure / GCS / 本地路径
- 可被 Airflow / Prefect / Dagster 调度（`PapermillOperator`）
- `@parameterize_notebook` 装饰器，编程式批量执行

## jupytext：`.ipynb` 与 `.py` 双向同步

解决「notebook 难 diff、难 review」的方案：把 `.ipynb` 与 `.py:percent`（VS Code 支持）配对，编辑任一文件另一方同步。

```bash
pip install jupytext

# 配置 .ipynb ⇄ .py:percent
jupytext --set-formats ipynb,py:percent my.ipynb

# 之后编辑 .ipynb 或 .py 都会同步
jupytext --sync my.ipynb
```

`.py:percent` 格式示例：

```python
# %%
import pandas as pd

# %% [markdown]
# # 标题
# 这是 markdown

# %%
df = pd.read_csv('x.csv')
```

被 VS Code / PyCharm / Cursor 当作 notebook 直接打开。

## nbdev：notebook 驱动开发

fast.ai 出品的「**写 notebook 同时出 Python 包 + 文档 + 测试**」工具：

```bash
pip install nbdev
nbdev_new           # 初始化项目结构
nbdev_prepare       # 出 .py + 文档 + 跑测试
```

把每个 `.ipynb` 当一个模块，标记 `#| export` 的 cell 自动进 `.py`，其余的进文档。fast.ai 自己的库（`fastcore` / `fastai`）就是这么写的。

## 与 Git 配合：nbstripout

`.ipynb` 含输出 + metadata 会污染 git 历史：

```bash
pip install nbstripout

# 全局装 git filter（自动清输出）
nbstripout --install
nbstripout --install --attributes .gitattributes

# 配置：保留某文件输出
nbstripout --install --keep-output 'reports/*.ipynb'
```

之后 `git diff` / `git commit` 自动剥离输出，merge 冲突大幅减少。

## 远程 / 云端 notebook

| 方案 | 特点 |
|---|---|
| **JupyterHub**（自建） | 多用户中央服务，配合 K8s 弹性 |
| **JupyterLab on SSH** | `jupyter lab --no-browser --port=8888` + SSH 隧道 |
| **VS Code Remote** | 装远程 Jupyter 直接连 |
| **Google Colab** | 免费 GPU，云端 notebook（[详见 Colab 叶](../google-colab/)） |
| **Kaggle Notebooks** | 免费 GPU + 数据集内置 |
| **Databricks / SageMaker / Vertex AI** | 企业级 ML 平台内置 notebook |

### SSH 隧道连远程 notebook

```bash
# 远端
jupyter lab --no-browser --port=8888

# 本地（建立隧道）
ssh -L 8888:localhost:8888 user@remote-host

# 本地浏览器开
http://localhost:8888/lab
```

## 安全加固（生产部署）

部署对外的 JupyterHub / JupyterLab 时至少做：

1. **强制 HTTPS**：Nginx / Caddy 反代 + Let's Encrypt 证书
2. **限源**：`c.NotebookApp.allow_origin = 'https://your-domain.com'`
3. **禁 root**：`c.NotebookApp.allow_root = False`
4. **限制 token 访问**：`c.ServerApp.token = ''` 仅本地 dev；生产用 OAuth + 短 token
5. **关停 `.ipynb` 自动信任**：陌生 notebook 不自动执行
6. **沙箱化**：用 Docker / Kubernetes 限制资源（CPU / 内存 / 磁盘配额）
7. **关 `nbconvert --to html` 不受信富文本**：避免 XSS

```python
# jupyter_server_config.py
c = get_config()
c.ServerApp.ip = '0.0.0.0'
c.ServerApp.port = 8888
c.ServerApp.open_browser = False
c.ServerApp.root_dir = '/srv/jupyter'
c.ServerApp.allow_remote_access = True
c.ServerApp.trust_xheaders = True
c.IdentityProvider.token = '...'   # 长随机串
```

## 性能优化

- **长任务用 `%%capture` 或重定向**：避免前端渲染大量输出导致卡顿
- **大数据用 `pandas` chunk / Dask**：避免一次性 load 进内核
- **关掉自动补全的 LSP**：`pip uninstall jupyterlab-lsp`，编辑大文件提速
- **降低 widget 重渲染**：`traitlets.observe` + `suppress_callback`
- **重启内核释放内存**：内核是常驻进程，长期跑会内存泄漏
- **nbclient 无头执行**：批处理不走 UI

```python
# 用 nbclient 在脚本里执行 notebook
from nbclient import NotebookClient
client = NotebookClient(nb, timeout=600, kernel_name='python3')
client.execute()
```
