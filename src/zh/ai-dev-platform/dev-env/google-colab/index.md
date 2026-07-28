---
layout: doc
---

# Google Colab

Google 出品的「**托管式 Jupyter Notebook 服务**」——开浏览器即用，无需安装 Python、CUDA、GPU 驱动，**免费提供 GPU（默认 NVIDIA T4，16GB 显存）和 TPU**，notebook 文件存到 Google Drive，与 Google Workspace 无缝集成。底层是一个完整的 Linux 虚拟机（Ubuntu，约 12GB 内存 + 100GB 临时磁盘），预装 Python 3.10+ 与主流科学计算栈（NumPy / pandas / scikit-learn / TensorFlow / PyTorch），用户也可用 `!pip install` 临时装包。**Colab Pro**（10 美元/月）/ **Pro+**（50 美元/月）/ **Pay As You Go** 升级到更强的 GPU（如 A100 40GB、L4）与更长的运行时（最长 24 小时）。「**AI-First Colab**」集成 **Gemini 驱动的 Colab AI**：自然语言生成代码、解释代码、修复报错、AI 编程助手（类似 Copilot）。Colab 把 notebook 协议（Jupyter Messaging Protocol）的内核放在云端，前端是 Google 自研的简化 notebook UI，因此**与本地 Jupyter 文件格式 100% 兼容**（`.ipynb` 可直接上传 / 下载）。它的目标人群是学生、研究者、数据科学家——把「跑一个 GPU 实验」的门槛降到「点开一个网页」。Kaggle Notebooks、Lightning Studio、Gradient 是同类竞品；自建 JupyterHub 是开源替代。

## 评价

**优点**

- **零安装、零成本上手**：注册 Google 账号即可，浏览器开 https://colab.research.google.com 直接写代码，省去 Python / CUDA / 驱动 / Jupyter 一整套环境配置；学生、教学、Demo 场景极爽
- **免费 GPU（T4）业界良心**：NVIDIA Tesla T4（16GB 显存），够跑 BERT-base、Stable Diffusion、小型 LoRA 微调；免费配额动态分配，日常实验完全够用
- **免费 TPU v2**：罕见的免费 TPU 资源，跑 JAX / PyTorch/XLA 模型训练，相比自购 TPU 节点（数千美元）几乎零成本
- **Google Drive 深度集成**：notebook 自动存到 Drive，可共享 / 协作编辑 / 版本控制；通过 `drive.mount` 一行挂载 Drive 当作持久化存储
- **Colab AI（Gemini）开箱即用**：自然语言生成代码、解释报错、代码补全，类似免费版 Copilot；和 Gemini 2.5 模型深度集成
- **预装主流库**：TensorFlow / PyTorch / JAX / scikit-learn / pandas / matplotlib / Hugging Face Transformers / diffusers 开箱可用，无需配置
- **表单（Forms）让 notebook 可参数化**：用 `#@param` 注释一键生成 UI（slider / dropdown / checkbox），把 notebook 变成可交互 Demo
- **与 GitHub 双向同步**：直接打开 GitHub 仓库里的 `.ipynb`、保存到 Gist / Repo；社区有海量 Colab Demo（Stable Diffusion / LLM 微调 / 论文复现）

**缺点**

- **运行时不稳定（最长 12 小时，免费层更短）**：会话 idle 会被强制断开，VM 被销毁，所有临时文件、变量、安装的包全部丢失；长任务必须靠 Drive / GCS 持久化
- **资源配额动态限制**：免费 GPU 不是「保证可用」，高峰期排队 / 拒绝分配；同一账号短时间内频繁申请会被风控（导致后续更难拿到 GPU）
- **临时磁盘 100GB 且不持久**：VM 销毁即丢，必须把数据 / 模型同步到 Drive 或 GCS；大量小文件读写 Drive 极慢（Drive 是对象存储，不是文件系统）
- **网络受限（大陆访问需翻墙）**：colab.research.google.com 与 Drive 都需特殊网络；中国用户上 Colab 的稳定性差
- **不支持自定义 Docker 镜像**：无法预装私有依赖、无法固定 CUDA 版本；要装一堆自定义库只能每次 `!pip install`，启动慢
- **隐私与商业敏感数据风险**：notebook 在 Google 服务器执行，敏感数据上传到 Drive / VM 有合规风险；企业用户更适合 Vertex AI Workbench 或自建 JupyterHub
- **Pro 计划 GPU 仍受限**：A100 / H100 不是「随时可用」，仍受配额限制；重训练任务还是推荐租 AWS / Lambda Cloud / RunPod
- **调试体验弱**：不支持断点（xeus-python 那种）、变量查看器比 VS Code Jupyter 弱；大型 notebook 浏览器卡顿

## 文档地址

[Colab 官方 FAQ](https://research.google.com/colaboratory/faq.html) | [Colab 帮助中心](https://colab.research.google.com/notebooks/)

## GitHub 地址

[googlecolab](https://github.com/googlecolab)（前端代码不公开，仓库主要是 `colabtools` 工具与示例）

## 幻灯片地址

<a href="/SlideStack/google-colab-slide/" target="_blank">Google Colab</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=Google%20Colab" target="_blank" rel="noopener noreferrer">Google Colab 测试题</a>
