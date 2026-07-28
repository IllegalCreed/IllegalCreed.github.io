---
layout: doc
---

# Jupyter Notebook

Project Jupyter 出品的「**计算型笔记本（Computational Notebook）**」Web 应用——把代码、运行结果、可视化、Markdown 文档、数学公式（LaTeX）压缩进一个 `.ipynb`（基于 JSON 的开放格式）文件里，按**单元格（cell）**顺序执行：代码单元交给一个独立进程「**内核（kernel）**」跑、Markdown 单元渲染成富文本。Jupyter 这个名字 = **Julia + Python + R**（三大原始支持语言），现支持 40+ 内核语言（含 Scala、C++、Rust、Go、Haskell）。**Jupyter Notebook 7.x**（2023 年起稳定）已重写为「基于 JupyterLab 组件的简化前端」——和上一代 Classic Notebook（4.x/6.x 时代）共享同一套后端（`notebook` 服务器 + `jupyter_server`），但前端换成了 React + Lumino。配套生态包括 **JupyterLab**（完整 IDE 体验，文件浏览器 / 多标签 / 终端 / 扩展系统）、**JupyterHub**（多用户分发版，给课堂、企业、科研团队用，可插拔鉴权 PAM/OAuth，搭配 Kubernetes/Docker 横向扩展）、**Voilà**（把 notebook 转成「只看输出、不暴露代码」的交互式 Web 应用，类似 Dash/Streamlit 的轻量替代）。VS Code、PyCharm、Cursor 等 IDE 都内置了 notebook 编辑器，可直接打开 `.ipynb`。它是数据科学、机器学习探索、教学演示、可复现研究的事实标准。

## 评价

**优点**

- **叙事 + 代码 + 输出三位一体**：一篇文章既包含 Markdown 文字解释、又包含可执行代码和富文本输出（HTML/图片/视频/LaTeX/交互式 widget），完美契合「教学 + 探索 + 演示」三类场景；这是它打败纯 `.py` 文件的根本原因
- **零成本分享与可复现**：`.ipynb` 是单文件 JSON，邮件 / GitHub / nbviewer / Dropbox 都能直接分享；GitHub 渲染 `.ipynb` 是开箱即用的，远比截图 PPT 方便
- **语言无关的内核协议**：内核通过 ZeroMQ/WebSockets + JSON 与前端通信（Interactive Computing Protocol），任何语言只要实现一遍内核规范（IPykernel / IJulia / IRkernel）都能进 notebook；这让 Julia、R、Scala 都共享同一套 UI 生态
- **魔法命令（magics）大幅提效**：`%matplotlib inline` 一行内嵌图、`%timeit` 测性能、`%%time` 计时单元、`%%writefile` 写文件、`!` 直接调 shell——日常数据探索比纯 Python REPL 快 2-3 倍
- **JupyterLab 已演化为完整 IDE**：多标签 / 文件浏览器 / 目录树 / 终端 / 实时协作（RTC）/ 扩展市场，逐渐替代 Spyder / RStudio 在数据科学生态的位置
- **生态成熟**：与 pandas / numpy / matplotlib / scikit-learn / TensorFlow / PyTorch 深度集成，IPython 的富显示（`display()`、`IPython.display`）能输出任意 MIME 类型；nbformat / nbconvert / papermill / jupytext 形成完整工具链
- **企业级落地成熟**：JupyterHub 支持几千人课堂、LLM 训练集群可视化、SageMaker / Databricks / Vertex AI / Watson Studio 都把 notebook 作为交互层；Google Colab、Kaggle Notebooks 都基于 Jupyter 内核协议
- **完全开源 + 治理透明**：BSD 即议，由 NumFOCUS 维持非营利治理，决策流程公开（SEP 增强提案），无单一公司把控

**缺点**

- **状态混乱是经典坑**：notebook 是「带状态的内核 + 顺序可跳读执行」，重复跑单元、跳着跑单元会导致变量状态与代码顺序不一致——新手经常困惑「为什么这个变量有值」，大型分析难以复现；Jupyter 7 + JupyterLab 引入「Restart & Run All」鼓励线性执行，但治标不治本
- **不适合生产 / 工程化**：`.ipynb` 不是模块、不能被 import、不能跨 notebook 复用代码、Git diff 友好度差（输出 + metadata 噪声多），重生产代码必须迁移到 `.py` + 模块结构；典型反模式是把整套数据 pipeline 写在一个 notebook 里跑调度
- **输出与 metadata 污染版本控制**：`.ipynb` 默认包含 `execution_count` 和输出二进制（图片 base64），merge 冲突灾难；社区用 `nbstripout` / `jupytext`（同步成纯 `.py`）/ `clear output before commit` 缓解
- **Classic Notebook 体验落后**：原版 Notebook（4.x/6.x 时代）单文档、无终端、扩展系统脆弱（`jupyter contrib nbextensions`），新项目建议直接上 JupyterLab 或 Notebook 7
- **大型 notebook 性能差**：单文件几百个 cell 时浏览器卡顿；CPU 密集任务跑在前端进程会阻塞界面；推荐用 `nbclient` / `papermill` 做无头批跑
- **安全风险**：`.ipynb` 可包含自动执行的代码 + 富 HTML（`HTML()`、`Javascript()`），打开陌生 notebook 等同于运行未知代码；Jupyter 7 默认对 `nbconvert` 输出做 sanitize，但本地打开信任机制依赖 `trust` 数据库

## 文档地址

[Jupyter Notebook 文档](https://jupyter-notebook.readthedocs.io/en/latest/) | [JupyterLab 文档](https://jupyterlab.readthedocs.io/) | [JupyterHub 文档](https://jupyterhub.readthedocs.io/)

## GitHub 地址

[jupyter/notebook](https://github.com/jupyter/notebook) | [jupyterlab/jupyterlab](https://github.com/jupyterlab/jupyterlab) | [jupyterhub/jupyterhub](https://github.com/jupyterhub/jupyterhub)

## 幻灯片地址

<a href="/SlideStack/jupyter-notebook-slide/" target="_blank">Jupyter Notebook</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=Jupyter%20Notebook" target="_blank" rel="noopener noreferrer">Jupyter Notebook 测试题</a>
