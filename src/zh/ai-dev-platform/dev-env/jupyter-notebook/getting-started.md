---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Jupyter Notebook 7.x / JupyterLab 4.x 编写，参考 [jupyter-notebook.readthedocs.io](https://jupyter-notebook.readthedocs.io/en/latest/) 与 [jupyter.org](https://jupyter.org/)

## 速查

- **安装**：`pip install notebook`（最简）或 `pip install jupyterlab`（推荐）；conda 用户用 `conda install -c conda-forge jupyterlab`
- **启动**：`jupyter notebook`（Notebook 7 前端）或 `jupyter lab`（JupyterLab 前端）；默认开 `http://localhost:8888`
- **文件格式**：`.ipynb`（JSON，含 `cells` / `metadata` / `nbformat` 三段）
- **三种 cell 类型**：Code（可执行，接内核）/ Markdown（富文本）/ Raw（原文，nbconvert 时按模板处理）
- **执行 cell**：`Shift+Enter`（运行并跳到下一个）/ `Ctrl+Enter`（运行停在当前）/ `Alt+Enter`（运行并插入新 cell）
- **核心架构**：前端 ⇄ `jupyter_server`（HTTP/WebSocket）⇄ Kernel（独立进程跑代码，默认 IPython = IPykernel）
- **常用 line magic**：`%matplotlib inline` / `%timeit` / `%run` / `%pwd` / `%who` / `%history` / `%load_ext` / `%lsmagic`
- **常用 cell magic**：`%%time` / `%%writefile foo.py` / `%%capture` / `%%bash` / `%%html` / `%%latex` / `%%javascript`
- **shell 转义**：`!pip list` / `!ls -lh` / `!git status` 直接调系统命令
- **保存与导出**：`Ctrl+S` 自动保存 `.ipynb`；`jupyter nbconvert --to=html|pdf|slides|script my.ipynb` 命令行转格式
- **VS Code 集成**：装 Python/Jupyter 扩展即可直接编辑 `.ipynb`，无需本地启服务
- **进阶生态**：JupyterLab（完整 IDE）/ JupyterHub（多用户）/ Voilà（web 应用）/ nbconvert（导出）/ nbstripout（清输出）/ jupytext（与 `.py` 双向同步）/ papermill（参数化批跑）

## Notebook 7 与 JupyterLab 的关系

很多人会把两者混在一起。理解的关键是：**Notebook 7 与 JupyterLab 4 共用同一套前端组件**（React + Lumino），后端都是 `jupyter_server`，差别只在前端 UI 的「外观与摆放」：

| 维度 | Jupyter Notebook 7 | JupyterLab 4 | Classic Notebook（6.x 已 EOL） |
|---|---|---|---|
| 定位 | 经典单文档 UI 的现代化版本 | 完整 IDE，多文档 + 文件浏览器 + 终端 | 老版单文档 UI |
| 前端栈 | JupyterLab 组件子集 | 完整 JupyterLab 前端 | Backbone.js + jQuery |
| 文件浏览器 | 简化（树形列表） | 完整双栏 + drag-and-drop | 单栏 |
| 终端 | 不支持（需要 JupyterLab） | 内置 Terminal tab | 不支持 |
| 实时协作 | 通过 `jupyter_collaboration` 扩展 | 同上 | 无 |
| 启动命令 | `jupyter notebook` | `jupyter lab` | `jupyter notebook`（老版） |
| 后端 | `jupyter_server` | `jupyter_server` | `notebook` 服务器（老版） |

**含义**：

- 升级到 Notebook 7 = 自动享受 JupyterLab 4 的渲染、富显示、扩展机制，但 UI 风格接近老 Classic
- 新项目优先选 **JupyterLab**，因为多标签 / 终端 / 调试器都开箱即用
- 老 Classic Notebook（6.x 及以下）已停止维护，建议迁移

## 安装与首次启动

### 用 pip 安装

```bash
# 选 A：Jupyter Notebook 7（极简单文档体验）
pip install notebook
jupyter notebook              # 浏览器自动开 http://localhost:8888

# 选 B：JupyterLab（推荐，含 IDE 体验）
pip install jupyterlab
jupyter lab                   # 浏览器自动开 http://localhost:8888/lab
```

### 用 conda 安装

```bash
conda install -c conda-forge jupyterlab
conda install -c conda-forge notebook
```

### 用 Docker 启动（隔离环境最稳）

官方维护 [`jupyter/scipy-notebook`](https://jupyter-docker-stacks.readthedocs.io/) 系列：

```bash
docker run -p 8888:8888 -v "$PWD":/home/jovyan/work jupyter/scipy-notebook:latest
```

镜像内置 Python + Scientific 栈（pandas / numpy / scikit-learn / matplotlib），适合临时探索或教学环境。

## 单元（Cell）的类型与执行

`.ipynb` 文件由一组 `cells` 组成，每个 cell 有 `cell_type`：

| cell_type | 用途 | 渲染方式 | 示例 |
|---|---|---|---|
| `code` | 跑代码 | 输出 `text/plain` / `text/html` / `image/png` 等多种 MIME | `print("hello")` |
| `markdown` | 写文字、标题、列表、公式 | Markdown + KaTeX（数学公式） | `## 标题`、`$E=mc^2$` |
| `raw` | 原始内容 | 不渲染，按 nbconvert 模板处理 | 给 `rst`/`latex` 导出留原文 |

### Code Cell 的执行流程

```python
# 一个 code cell
import pandas as pd
df = pd.read_csv('data.csv')
df.head()        # ← 最后一个表达式自动 display
```

- 内核（默认 IPykernel）接收整段代码，编译并执行
- 最后一个**未赋值的表达式**会自动调用 `display()` 渲染（不是 `print`）
- 输出有 `stream`（stdout/stderr）/ `execute_result`（返回值）/ `display_data`（显式 `display()`）/ `error`（带 traceback）四类

### Markdown Cell 公式

```markdown
$$
\text{MSE} = \frac{1}{n} \sum_{i=1}^{n} (y_i - \hat{y}_i)^2
$$
```

行内公式 `$\sigma$`，块级 `$$...$$`，渲染引擎是 [KaTeX](https://katex.org/)。

### 执行快捷键

| 快捷键 | 行为 |
|---|---|
| `Shift+Enter` | 运行当前 cell，光标跳到下一个 |
| `Ctrl+Enter` | 运行当前 cell，停在原位 |
| `Alt+Enter` | 运行当前 cell，并在下方插入新 cell |
| `Esc` + `DD` | 删除当前 cell（命令模式） |
| `Esc` + `A` / `B` | 在上方 / 下方插入新 cell |
| `Esc` + `M` / `Y` | 切换为 Markdown / Code |
| `Esc` + `Z` | 撤销删除 cell |

**两种模式**：

- **编辑模式**（绿色边框，按 `Enter` 进入）：编辑 cell 内容
- **命令模式**（蓝色边框，按 `Esc` 进入）：操作 cell（增删移动）

## 内核（Kernel）深入

内核是 notebook 「能跑代码」的核心——一个**独立进程**，专门负责接收前端发来的代码字符串、执行、回传输出。

```
浏览器 (React) ⇄ jupyter_server (HTTP/WebSocket) ⇄ Kernel (IPykernel)
                                                       │
                                                       └── Python 进程
```

### 内核的生命周期

- **内核 ≠ 文件**：关浏览器、关 notebook 文件，**内核仍在后台运行**（除非显式 Restart / Shutdown）
- **重启清空所有变量**：Restart Kernel = 杀掉进程、起一个新的，所有 `import` / 变量全部丢失（**这是为什么我们要「Restart & Run All」做复现测试**）
- **执行顺序与代码顺序不一致**：你可以从第 5 个 cell 跳回第 2 个 cell 再跑一次，导致状态混乱——`In [n]` 的 `n` 是执行序号，不是文件序号

### 多语言内核

| 语言 | 内核包 | 安装 |
|---|---|---|
| Python（默认） | `ipykernel` | `pip install ipykernel` |
| R | `IRkernel` | R 内 `install.packages('IRkernel'); IRkernel::installspec()` |
| Julia | `IJulia` | Julia 内 `using Pkg; Pkg.add("IJulia"); using IJulia; installkernel("Julia")` |
| Scala | `almond` | [almond.sh](https://almond.sh/) |
| C++ | `xeus-cling` | `conda install -c conda-forge xeus-cling` |
| Rust | `evcxr_jupyter` | `cargo install evcxr_jupyter` |

### 列出 / 切换内核

```bash
jupyter kernelspec list          # 列出所有可用内核
jupyter kernelspec uninstall python3   # 卸载某个内核
```

UI 上点右上角内核名（如 `Python 3 (ipykernel)`）即可切换。

### 虚拟环境作为内核

把 `conda env` 或 `venv` 注册成一个内核：

```bash
# 在虚拟环境里执行
pip install ipykernel
python -m ipykernel install --user --name=myenv --display-name="Python (myenv)"
```

之后 notebook 的内核选择列表里会出现 `Python (myenv)`。

## 魔法命令（Magics）

魔法命令是 IPython 内核独有的扩展（其他内核不一定有）。三类前缀：

| 前缀 | 名称 | 作用域 |
|---|---|---|
| `%xxx` | line magic | 单行 |
| `%%xxx` | cell magic | 整个 cell（必须放在 cell 第一行） |
| `!xxx` | shell escape | 调系统 shell（非正式 magic，但 IPython 内置） |

### 查看所有 magic

```python
%lsmagic        # 列出全部
%magic          # 详细文档（很长）
%quickref       # 速查卡片
?               # IPython 总览
```

### 最常用的 line magic

```python
# 内嵌图（Jupyter 5.x 起对 matplotlib 默认 inline，但显式更稳）
%matplotlib inline

# 计时（自动跑多次取均值）
%timeit sum(range(1000))

# 单次计时
%time my_function()

# 执行外部 .py 文件（注入到当前命名空间）
%run preprocess.py

# 执行外部 .ipynb（注入输出但不持久化变量）
%run my_notebook.ipynb

# 列出命名空间变量
%who            # 仅名字
%whos           # 名字 + 类型 + 值
%who_ls         # 返回 list

# 历史记录
%history -n 5:10        # 第 5-10 条历史
%history -g "import"    # 搜索包含 import 的历史

# 加载 IPython 扩展
%load_ext autoreload
%autoreload 2            # 改 .py 文件自动重载，调试库时救命

# 切换工作目录（持久化跨 cell）
%cd /tmp/data
%pwd
%ls
```

### 最常用的 cell magic

```python
# 计时整个 cell（跑一次，包含 setup）
%%time
import time
time.sleep(1)
result = sum(range(10**7))

# 写入文件（避免来回切编辑器）
%%writefile utils.py
def add(a, b):
    return a + b

# 捕获输出
%%capture captured
import matplotlib.pyplot as plt
plt.plot([1,2,3])
# captured.stdout / captured.outputs[] / captured.show()

# 跑 bash
%%bash
echo "Hello from bash"
ls -la

# 渲染富文本
%%html
<h1 style="color:red">Hello</h1>

%%latex
\begin{equation}
E = mc^2
\end{equation}

%%javascript
alert("hi")
```

### shell escape

`!` 把后面的内容交给系统 shell，输出捕获回 Python：

```python
!pip install requests
!ls -la /tmp
files = !ls -la              # 返回 IPython.utils.text.SList，可切片
"requirements.txt" in files
```

::: warning `!pip` 与 `%pip` 的区别
- `!pip install xxx`：调系统的 pip（可能不在当前虚拟环境，装错地方）
- `%pip install xxx`：**保证装到当前内核的 Python**（推荐）

同理有 `%conda install xxx`。
:::

## 富显示（Rich Display）

最后一个表达式的输出由 IPython 的 display 机制决定渲染方式：

```python
# pandas DataFrame 自动渲染成 HTML 表
import pandas as pd
pd.DataFrame({'a': [1,2], 'b': [3,4]})

# 显式控制
from IPython.display import display, HTML, Image, Markdown, JSON, Audio, Video, YouTubeVideo

display(HTML('<b style="color:blue">富文本</b>'))
display(Image('logo.png', width=200))
display(Markdown('# 内嵌标题\n- 列表项'))
display(JSON({'key': 'value'}))
display(Audio('song.mp3'))
display(YouTubeVideo('dQw4w9WgXcQ'))

# 交互式 widget
import ipywidgets as widgets
widgets.IntSlider(description='x:')
```

每种对象通过 `_repr_html_` / `_repr_png_` / `_repr_json_` 等魔术方法声明「我能被渲染成什么」，前端挑当前 MIME 渲染。

## nbconvert：导出多种格式

```bash
# 转 HTML（含交互式 plot）
jupyter nbconvert --to=html my.ipynb

# 转 PDF（需要 LaTeX 环境，如 texlive）
jupyter nbconvert --to=pdf my.ipynb

# 转纯 Python 脚本（剥离 cell 结构）
jupyter nbconvert --to=script my.ipynb

# 转 reveal.js 幻灯片
jupyter nbconvert --to=slides my.ipynb --post serve

# 执行后导出（跑一遍再转，适合 CI 出报告）
jupyter nbconvert --to=html --execute my.ipynb

# 清除输出
jupyter nbconvert --clear-output --inplace my.ipynb
```

`--execute` 模式与无头运行工具 `papermill` / `nbclient` 同源。

## JupyterHub：多用户分发

JupyterHub 把 notebook 服务端包装成「**给一组用户的中央服务**」——课堂 200 人开课、公司给数据科学家发账号都靠它。

```
[ 浏览器 ] ⇄ [ JupyterHub (单点) ]
                 │
                 ├─ Authenticator (PAM / OAuth / LDAP / FirstUse)
                 ├─ Spawner (LocalProcess / Docker / Kubernetes)
                 └─ 每个用户 → 独立的单用户 notebook server
```

关键组件：

- **Authenticator**：判断用户身份。开箱即用有 PAM（Linux 系统账号）、OAuth（GitHub/Google/CILogon）、FirstUseAuthenticator（首次设密码，教学用）
- **Spawner**：每个用户怎么起 notebook 进程。`LocalProcessSpawner`（一台机器多进程，小规模）、`DockerSpawner`（每用户一个容器）、`KubeSpawner`（[zero-to-jupyterhub-k8s](https://z2jh.jupyter.org/)，集群方案）
- **Proxy**：把不同 URL 路由到不同用户的 notebook（默认 `configurable-http-proxy`）

最流行部署是 zero-to-jupyterhub-k8s：

```bash
helm install jhub jupyterhub/jupyterhub \
  --version=4.0.0 \
  --values=config.yaml
```

## VS Code / PyCharm 中使用

无需本地启动服务——直接打开 `.ipynb`：

- **VS Code**：装 `Python` + `Jupyter` 扩展，命令面板 `Create: New Jupyter Notebook`
- **PyCharm Professional**：原生支持（Community 不支持）
- **Cursor / Windsurf**：基于 VS Code 内核，同 VS Code 用法

VS Code 里的 notebook 直接复用 Python 解释器（不必先注册成 kernel），变量查看器 / 内嵌图 / 调试都集成。

## 下一步

- 入门到此能跑通：装 → 起服务 → 写 cell → 用 magic → 导出
- 进阶内容（见 `guide-line.md`）：
  - JupyterLab 高级特性（多 tab / 终端 / 调试器 / 扩展 / RTC 实时协作）
  - 自定义内核（`xeus` 框架写新语言内核）
  - Voilà 把 notebook 转 web 应用
  - `papermill` 参数化批跑、`jupytext` 双向同步 `.py`
- 参考（见 `reference.md`）：
  - 全部 magic 命令表
  - 常用快捷键
  - 部署清单（生产环境配置、安全加固）
  - nbformat JSON 结构详解
