---
layout: doc
---

# PyTorch 基础

PyTorch 是 Meta AI 主导、Linux 基金会托管的开源深度学习框架，核心由三部分构成：**多维张量（Tensor）计算库**（CPU/GPU 统一抽象，`torch.Tensor`）、**自动微分引擎（autograd）**（对任意张量运算自动构建动态计算图并反向求导）与**神经网络模块体系（torch.nn / torch.optim / torch.utils.data）**。它最大的设计取舍是**即时执行（eager mode）的 Pythonic 编程模型**——模型就是普通 Python 代码，前向计算即图构建，调试器可以直接断在任意一行，这与 TensorFlow 早期的静态图路线形成鲜明对比；2.x 时代又通过 `torch.compile`（Dynamo 捕获 + Inductor 代码生成）在保持 eager 开发体验的同时获得图编译优化。围绕核心，官方提供 torchvision（视觉）/ torchaudio（音频）/ torchtext（文本）等领域库，上游生态（Hugging Face、Lightning、vLLM 等）几乎全部以 PyTorch 为一等公民，使其成为当前学术研究与工业训练事实上的标准框架。截至 2026 年 7 月，稳定版为 **2.13.0**：FlexAttention 登陆 Apple Silicon（MPS）、新增 `nn.LinearCrossEntropyLoss`（大词表训练峰值显存最多省 4×）、FSDP2 通信重叠、torchcomms 新通信后端；分发侧 PyPI 默认 CUDA 13.0 wheel（旧驱动回退 cu126），Python 支持 3.10–3.14（Linux 另有 3.15 wheel）。信源 docs.pytorch.org 官方文档 + GitHub Releases。

## 评价

**优点**

- **Pythonic eager 体验**：模型即普通 Python，print/pdb/控制流随便写，学习曲线平缓，研究迭代快
- **autograd 通用优雅**：任意张量运算自动可导，`loss.backward()` 一行反向传播，自定义 `autograd.Function` 可扩展任意算子
- **生态统治力**：Hugging Face、PyTorch Lightning、torchvision、vLLM、FSDP 等训练推理栈全部原生支持；顶会论文代码复现率碾压级领先
- **torch.compile 兼得性能**：`model = torch.compile(model)` 一行即可获得内核融合与图优化收益，不改 eager 开发习惯
- **硬件覆盖广**：CUDA / ROCm / Apple MPS / Intel XPU / CPU 统一 API（`torch.accelerator` 抽象），2.13 仍在扩展
- **分布式成熟**：DDP / FSDP / FSDP2 / DeviceMesh / torchcomms 覆盖单机多卡到万卡集群（见「PyTorch 分布式训练」叶）

**缺点**

- **显存占用偏高**：eager 模式下激活值全量保留，大模型训练必须搭配梯度检查点/FSDP/混合精度等技巧
- **部署链路割裂**：训练到生产需经 torch.export / ONNX / TorchScript 二次转换（2.9 起 ONNX 默认 dynamo 导出，旧 TorchScript 持续退役），不如训练侧顺滑
- **移动端/边缘端偏弱**：ExecuTorch 起步晚，端侧推理生态不如 TFLite/NCNN 成熟
- **API 面庞大且历史包袱重**：`torch.`/`torch.nn.functional`/方法重载三套风格并存，新老接口（如 `torch.jit` → `torch.compile`）迁移期文档混杂
- **版本兼容敏感**：CUDA 与 wheel 强绑定，升级偶有静默行为变化（如 2.11 PyPI 默认 CUDA 13 导致旧驱动安装失败）
- **Windows 体验次优**：部分分布式/编译特性 Linux 优先，Windows 偶有滞后

## 文档地址

- [PyTorch 官方文档（stable）](https://docs.pytorch.org/en/stable/)
- [Learn the Basics 官方教程](https://docs.pytorch.org/tutorials/beginner/basics/intro.html)
- [安装向导（get-started/locally）](https://pytorch.org/get-started/locally/)
- [PyTorch 2.13.0 Release Notes](https://github.com/pytorch/pytorch/releases)

## GitHub地址

[pytorch/pytorch](https://github.com/pytorch/pytorch)

## 幻灯片地址

<a href="/SlideStack/pytorch-basics-slide/" target="_blank">PyTorch 基础</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=PENDING" target="_blank" rel="noopener noreferrer">PyTorch 基础测试题</a>
