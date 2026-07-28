---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Jupyter Notebook 7.x / IPython 8.x / JupyterLab 4.x 编写，参考 [jupyter-notebook.readthedocs.io](https://jupyter-notebook.readthedocs.io/en/latest/)、[ipython.readthedocs.io](https://ipython.readthedocs.io/en/stable/interactive/magics.html)、[nbformat.readthedocs.io](https://nbformat.readthedocs.io/)

## 速查

- **`.ipynb` 结构**：`nbformat` (4.5) / `nbformat_minor` / `metadata` / `cells` 四大字段
- **cell 类型**：`code` / `markdown` / `raw`
- **nbformat Python 库**：`nbformat.read(path)` / `nbformat.writes(nb)` / `new_code_cell(source=...)`
- **快捷键命令模式**：A/B 增 cell、DD 删、M/Y 切类型、Z 撤销、Shift+M 合并
- **快捷键编辑模式**：Ctrl+Enter / Shift+Enter / Alt+Enter、Ctrl+/ 注释、Ctrl+Shift+- 分割 cell
- **kernel 协议**：Jupyter Messaging Protocol（基于 ZeroMQ + WebSocket）
- **配置文件**：`jupyter notebook --generate-config` → `~/.jupyter/jupyter_notebook_config.py`
- **元数据关键字段**：`kernelspec.name`、`language_info.name`、`orig_nbformat`、`display_name`
- **CLI 入口**：`jupyter notebook` / `jupyter lab` / `jupyter nbconvert` / `jupyter kernelspec` / `jupyter trust` / `jupyter migration`

## `.ipynb` 文件结构详解

最小化的 `.ipynb` JSON：

```json
{
  "nbformat": 4,
  "nbformat_minor": 5,
  "metadata": {
    "kernelspec": {
      "display_name": "Python 3 (ipykernel)",
      "language": "python",
      "name": "python3"
    },
    "language_info": {
      "codemirror_mode": { "name": "ipython", "version": 3 },
      "file_extension": ".py",
      "mimetype": "text/x-python",
      "name": "python",
      "nbconvert_exporter": "python",
      "pygments_lexer": "ipython3",
      "version": "3.11.6"
    }
  },
  "cells": [
    {
      "cell_type": "markdown",
      "id": "abc123",
      "metadata": {},
      "source": ["# 标题\n", "正文"]
    },
    {
      "cell_type": "code",
      "id": "def456",
      "execution_count": 1,
      "metadata": {},
      "outputs": [
        {
          "output_type": "stream",
          "name": "stdout",
          "text": ["hello\n"]
        }
      ],
      "source": ["print('hello')"]
    }
  ]
}
```

字段说明：

| 字段 | 用途 |
|---|---|
| `nbformat` | 主版本（当前 `4`） |
| `nbformat_minor` | 次版本（`5` 起支持 `cell.id`） |
| `metadata.kernelspec` | 用什么内核跑，名字对应 `jupyter kernelspec list` |
| `metadata.language_info` | 语言元数据（影响高亮、扩展名） |
| `cells[].id` | nbformat 4.5+ 必需，cell 唯一 ID（用于 RTC、扩展） |
| `cells[].source` | 内容字符串数组（按行，含 `\n`） |
| `cells[].outputs` | 仅 code cell 有，记录执行输出 |
| `cells[].execution_count` | 仅 code cell 有，对应 `In [n]` |

### 用 nbformat 操作 notebook

```python
import nbformat

# 读
nb = nbformat.read('my.ipynb', as_version=4)

# 改
nb.cells.append(nbformat.v4.new_code_cell('print("new cell")'))

# 校验
nbformat.validate(nb)

# 写
nbformat.write(nb, 'my2.ipynb')
```

## 完整 magic 命令速查

### Line magics（前缀 `%`）

| Magic | 用途 | 示例 |
|---|---|---|
| `%alias` | 定义 shell 别名 | `%alias l ls -la` |
| `%autocall` | 函数自动加 `()` | `%autocall 1` |
| `%automagic` | 关 magic 前缀 | `%automagic on` |
| `%bookmark` | 目录书签 | `%bookmark proj /code/proj` |
| `%cd` | 切目录（持久跨 cell） | `%cd /tmp` |
| `%colors` | 配色 | `%colors Linux` |
| `%conda` | 用当前内核装 conda 包 | `%conda install numpy` |
| `%config` | 配置类 | `%config InlineBackend.figure_format='retina'` |
| `%debug` | 进入事后调试器 | `%debug` |
| `%dhist` | 目录历史 | `%dhist` |
| `%dirs` | 列目录栈 | `%dirs` |
| `%edit` | 编辑器打开文件 | `%edit utils.py` |
| `%env` | 设环境变量 | `%env OMP_NUM_THREADS=4` |
| `%gui` | 启 GUI 事件循环 | `%gui qt5` |
| `%hist` / `%history` | 历史 | `%history 5:10` |
| `%killbgscripts` | 杀后台脚本 | `%killbgscripts` |
| `%load` | 加载文件到 cell | `%load utils.py` |
| `%load_ext` | 加载扩展 | `%load_ext autoreload` |
| `%loadpy` | 同 `%load` | |
| `%logoff` / `%logon` | 日志开关 | `%logon` |
| `%lsmagic` | 列 magic | `%lsmagic` |
| `%macro` | 定义宏 | `%macro foo 1-5` |
| `%magic` | magic 全文档 | `%magic` |
| `%matplotlib` | matplotlib 后端 | `%matplotlib inline` |
| `%notebook` | 把历史导出 notebook | `%notebook history.ipynb` |
| `%page` | 分页显示 | `%page dict_long` |
| `%pastebin` | 上传到 pastebin | `%pastebin 1-7` |
| `%pdb` | 异常自动进调试器 | `%pdb on` |
| `%pdef` / `%pdoc` / `%pfile` / `%pinfo` / `%pinfo2` / `%psearch` / `%psource` | 各种自省 | `%pinfo print` |
| `%pip` | 用当前内核装 pip 包 | `%pip install requests` |
| `%popd` | 弹目录栈 | `%popd` |
| `%pprint` | pretty print 开关 | `%pprint` |
| `%precision` | float 显示精度 | `%precision 4` |
| `%prun` | profile（cProfile） | `%prun my_function()` |
| `%psearch` | 对象搜索 | `%psearch dict.*` |
| `%pushd` / `%popd` | 目录栈 | |
| `%pwd` | 当前目录 | `%pwd` |
| `%pycat` | 语法高亮显示文件 | `%pycat utils.py` |
| `%pylab` | 一行导入 numpy + matplotlib | `%pylab inline` |
| `%qtconsole` | 开 Qt console | |
| `%quickref` | 速查 | `%quickref` |
| `%recall` | 把历史放回输入 | `%recall 4` |
| `%rehashx` / `%alias_magic` | 别名管理 | |
| `%reload_ext` | 重载扩展 | `%reload_ext autoreload` |
| `%rep` | 同 `%recall` | |
| `%rerun` | 重跑历史 | `%rerun 5` |
| `%reset` | 清空命名空间 | `%reset -f` |
| `%reset_selective` | 选择性清空 | `%reset_selective -f temp` |
| `%run` | 执行外部文件 | `%run preprocess.py` |
| `%save` | 把历史存文件 | `%save session.py 1-20` |
| `%sc` | shell capture | `%sc var = ls` |
| `%set_env` | 设环境变量 | `%set_env FOO=bar` |
| `%store` | 跨 notebook 传变量 | `%store x` / `%store -r x` |
| `%sx` | 同 `!` 但捕获 | `%sx ls` |
| `%system` | 同 `!` | |
| `%tb` | 打印最近 traceback | `%tb` |
| `%time` | 单次计时 | `%time my_func()` |
| `%timeit` | 多次计时取均值 | `%timeit sum(range(1000))` |
| `%unalias` | 删别名 | `%unalias l` |
| `%unload_ext` | 卸扩展 | |
| `%who` / `%whos` / `%who_ls` | 命名空间变量 | `%whos` |
| `%xdel` | 删变量（含引用） | `%xdel df` |
| `%xmode` | 异常显示模式 | `%xmode Verbose` |

### Cell magics（前缀 `%%`）

| Magic | 用途 | 示例 |
|---|---|---|
| `%%!` | 全 cell 走 shell | `%%bash` |
| `%%bash` | 跑 bash | 见入门 |
| `%%capture` | 捕获输出 | `%%capture out` |
| `%%cmd` / `%%script` | 跑任意解释器 | `%%script python3` |
| `%%debug` | 调试整个 cell | |
| `%%file` | 同 `%%writefile` | |
| `%%html` | 渲染 HTML | `%%html` |
| `%%javascript` / `%%js` | 跑 JS | `%%javascript alert(1)` |
| `%%jsx` | 跑 JSX | （需扩展） |
| `%%latex` | 渲染 LaTeX | `%%latex E=mc^2` |
| `%%markdown` | 渲染 markdown | |
| `%%perl` / `%%ruby` / `%%python2` / `%%python3` | 各种解释器 | |
| `%%pypy` | 跑 PyPy | |
| `%%prun` | profile cell | |
| `%%pypy` | | |
| `%%sh` | 跑 sh | |
| `%%svg` | 渲染 SVG | |
| `%%sx` / `%%system` | 全 cell shell + 捕获 | |
| `%%time` | 计时整 cell（单次） | `%%time` |
| `%%timeit` | 计时整 cell（多次） | `%%timeit -n 100 -r 5` |
| `%%writefile` | 写文件 | `%%writefile utils.py` |

::: tip 查文档的最快办法
在 cell 里 `%pinfo &lt;magic&gt;` 或 `%&lt;magic&gt;?`：

```python
%timeit?
```

会弹出 docstring。
:::

## 快捷键完整表

### 命令模式（按 `Esc`）

| 快捷键 | 行为 |
|---|---|
| `Enter` | 进入编辑模式 |
| `Shift+Enter` | 运行 + 跳到下一个 |
| `Ctrl+Enter` | 运行 + 停在原位 |
| `Alt+Enter` | 运行 + 在下方插新 cell |
| `A` | 上方插入 cell |
| `B` | 下方插入 cell |
| `X` | 剪切 cell |
| `C` | 复制 cell |
| `V` / `Shift+V` | 粘贴到下方 / 上方 |
| `D` `D` | 删除 cell |
| `Z` | 撤销删除 |
| `Y` | 切换为 code |
| `M` | 切换为 markdown |
| `R` | 切换为 raw |
| `↑` / `K` | 选上一个 cell |
| `↓` / `J` | 选下一个 cell |
| `Shift+↑/↓` | 多选 |
| `Shift+M` | 合并选中 cell |
| `Ctrl+S` | 保存 |
| `L` | 切换行号 |
| `O` | 切换输出显示 |
| `H` | 切换输出滚动 |
| `I` `I` | 中断内核 |
| `0` `0` | 重启内核 |
| `Space` | 向下滚动 |
| `Shift+Space` | 向上滚动 |
| `Shift+L` | 全局行号 |

### 编辑模式（按 `Enter`）

| 快捷键 | 行为 |
|---|---|
| `Esc` | 进入命令模式 |
| `Ctrl+Enter` / `Shift+Enter` / `Alt+Enter` | 运行 |
| `Ctrl+C` | 复制选区 |
| `Ctrl+V` | 粘贴 |
| `Ctrl+/` | 注释切换 |
| `Ctrl+]` | 缩进 |
| `Ctrl+[` | 反缩进 |
| `Ctrl+Z` | 撤销 |
| `Ctrl+Shift+Z` | 重做 |
| `Ctrl+Home` / `Ctrl+End` | 跳到 cell 首尾 |
| `Ctrl+←` / `Ctrl+→` | 按 word 跳 |
| `Ctrl+Backspace` / `Ctrl+Delete` | 删 word |
| `Ctrl+Shift+-` | 在光标处分割 cell |
| `Tab` | 补全 / 缩进 |
| `Shift+Tab` | 函数签名 / docstring |

## 配置文件

### 生成默认配置

```bash
jupyter server --generate-config
# → ~/.jupyter/jupyter_server_config.py

jupyter notebook --generate-config   # 老命令（等价）
```

### 关键配置项

```python
# ~/.jupyter/jupyter_server_config.py
c = get_config()

# 监听
c.ServerApp.ip = '0.0.0.0'
c.ServerApp.port = 8888
c.ServerApp.port_retries = 50
c.ServerApp.open_browser = False

# 根目录（限制访问范围）
c.ServerApp.root_dir = '/srv/jupyter'

# Token / 鉴权
c.IdentityProvider.token = 'long-random-string'
c.ServerApp.password = ''   # 老版本用 password（已弃用）
c.ServerApp.allow_remote_access = True

# HTTPS（生产建议反代 Nginx/Caddy，这里仅自签证书演示）
c.ServerApp.certfile = '/path/to/cert.pem'
c.ServerApp.keyfile = '/path/to/key.pem'

# CORS / 嵌入
c.ServerApp.allow_origin = '*'
c.ServerApp.allow_credentials = True

# 资源
c.ServerApp.tornado_settings = {
    'max_body_size': 1024 * 1024 * 1024,   # 1 GB
    'max_buffer_size': 1024 * 1024 * 1024,
}

# Notebook 7 / JupyterLab 默认 UI
c.LabApp.default_url = '/lab'   # 默认进 JupyterLab
```

### 用户数据目录

```bash
~/.jupyter/                  # 配置 + 数据
├── jupyter_server_config.py
├── jupyter_notebook_config.py   # 兼容老配置
├── lab/                     # JupyterLab 用户数据
├── runtime/                 # 运行时（pid、连接文件）
└── nbsign/                  # trust 数据库（sqlite）
```

环境变量 `JUPYTER_CONFIG_DIR` / `JUPYTER_DATA_DIR` 可改路径。

## CLI 命令总览

```bash
jupyter --version            # 全套版本
jupyter --paths              # 配置/数据路径
jupyter --config             # 当前生效配置
jupyter troubleshoot         # 诊断环境

# 主要入口
jupyter notebook             # Notebook 7 前端
jupyter lab                  # JupyterLab 前端
jupyter server               # 通用 jupyter_server（不带 UI）

# 文件操作
jupyter nbconvert --to=html my.ipynb
jupyter nbconvert --execute --to=notebook --inplace my.ipynb
jupyter trust my.ipynb       # 信任（执行 nbconvert 输出无警告）
jupyter nbextension install --py jupyter_highlight_selected_word
jupyter labextension list
jupyter labextension install @xxx/yyy

# 内核管理
jupyter kernelspec list
jupyter kernelspec uninstall python3
python -m ipykernel install --user --name=myenv

# 配置 / 迁移
jupyter notebook --generate-config
jupyter lab --generate-config
jupyter migration            # 从老 notebook 迁移到 jupyter_server
```

## Jupyter Messaging Protocol

前端 ⇄ 内核通信的底层协议（基于 ZeroMQ + WebSocket）：

```
                  ┌─────────────────┐
   浏览器 ──WS──> jupyter_server ──ZMQ──> Kernel
                                          │
   Channels:                              ├─ shell (execute_request/response)
   - shell   (代码执行、inspect)            ├─ iopub  (输出、状态广播)
   - iopub   (输出、状态)                   ├─ stdin  (input() 等待)
   - stdin   (input())                     ├─ control(interrupt、shutdown)
   - control (中断、关闭)                    └─ heartbeat(心跳保活)
```

- 每条消息是 JSON，包含 `header` / `parent_header` / `metadata` / `content`
- 内核跑代码时通过 `iopub` 实时广播输出（`stream` / `display_data` / `execute_result` / `error`）
- 前端发 `execute_request` 在 `shell` 通道，内核异步执行
- 这个协议让 Jupyter 的「前端 / 内核」可分离——Colab / Kaggle / nteract 都自己写前端用同一套内核

## nbformat 4.5 关键变化

- **cell.id 必需**：4.5 起，每个 cell 必须有 `id`（短字符串，全 notebook 唯一），用于实时协作、扩展追踪
- **新 cell 类型 `widget` 已废弃**：widget 状态走 `metadata.widgets`
- **`nbformat_minor` 仍为 4 / 5**：旧文件升级时自动补 `id`

## 生态与版本

| 项目 | 仓库 | 当前稳定 | 说明 |
|---|---|---|---|
| Jupyter Notebook | [jupyter/notebook](https://github.com/jupyter/notebook) | 7.x | Notebook 7，基于 JupyterLab 组件 |
| JupyterLab | [jupyterlab/jupyterlab](https://github.com/jupyterlab/jupyterlab) | 4.x | 完整 IDE 体验 |
| JupyterHub | [jupyterhub/jupyterhub](https://github.com/jupyterhub/jupyterhub) | 5.x | 多用户分发 |
| Voilà | [voila-dashboards/voila](https://github.com/voila-dashboards/voila) | 0.5.x | notebook 转 web 应用 |
| nbconvert | [jupyter/nbconvert](https://github.com/jupyter/nbconvert) | 7.x | 格式转换 |
| nbformat | [jupyter/nbformat](https://github.com/jupyter/nbformat) | 5.x | `.ipynb` 格式库 |
| IPython | [ipython/ipython](https://github.com/ipython/ipython) | 8.x / 9.x | IPython kernel + magic |
| ipykernel | [ipython/ipykernel](https://github.com/ipython/ipykernel) | 6.x | Python 内核 |
| ipywidgets | [jupyter-widgets/ipywidgets](https://github.com/jupyter-widgets/ipywidgets) | 8.x | 交互式 widget |
| jupyter_server | [jupyter-server/jupyter_server](https://github.com/jupyter-server/jupyter_server) | 2.x | 服务器后端 |

## 与其他工具对比

| 工具 | 定位 | 与 Jupyter 差异 |
|---|---|---|
| **JupyterLab** | 完整 IDE | Notebook 7 是其简化版，共享组件 |
| **Google Colab** | 云端免费 notebook | 内核协议相同，UI 加了 Drive 集成 / Colab AI / 免费 GPU；本地控制力弱 |
| **Kaggle Notebooks** | 数据竞赛环境 | 内置数据集 + GPU，类似 Colab 但封闭 |
| **VS Code Notebook** | IDE 内 notebook | 直接用本地 Python 解释器，集成调试更顺 |
| **Databricks Notebook** | 企业 Spark 平台 | 内核是 Scala/SQL/PySpark，深度绑定 Spark |
| **Observable** | JS notebook | 前端生态，cell 之间是 reactive graph |
| **Hex / Deepnote** | 数据协作平台 | Jupyter 内核 + 协作 UI + 数据连接器 |
| **Streamlit / Dash** | web 应用 | 不是 notebook，是 Python 写 web dashboard |

## 常见问题

### Q: 重启内核后变量消失？

A: 是。重启 = 杀进程起新的，所有变量 / import / 全局状态全部清空。这就是「Restart & Run All」做复现测试的原因。

### Q: 跑 cell 太慢，如何找瓶颈？

A: 用 `%%time` 或 `%%prun` 单 cell 计时 / profile：

```python
%%prun
slow_function()
```

会打印 cProfile 输出，定位热点函数。

### Q: 输出图不显示？

A: 默认情况下：

```python
%matplotlib inline     # Jupyter 5+ 默认开启，但显式更稳
```

Bokeh / Plotly 需要：

```python
import plotly.io as pio
pio.renderers.default = 'iframe'   # 或 'notebook_connected'
```

### Q: `.ipynb` 太大 / 太卡？

A: 几个常见原因：

- 嵌入了 base64 图片 / 视频 → 用 `clear_output()` 或 `%%capture`
- 历史 `execution_count` 累积 → `jupyter nbconvert --clear-output --inplace`
- 单 cell 太长 → 拆分

### Q: 怎么把 notebook 当 Python 模块用？

A: **不能直接 import**。两种方案：

- `jupytext --to py:percent my.ipynb` 同步成 `.py`
- `nbdev`：标记 `#| export` 的 cell 自动进 `.py`
- `importnb`：第三方库，能 `from my import notebook_func`（不推荐生产用）
