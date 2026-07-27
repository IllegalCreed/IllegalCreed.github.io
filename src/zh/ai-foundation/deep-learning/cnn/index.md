---
layout: doc
---

# 卷积神经网络（CNN）

卷积神经网络（Convolutional Neural Network，CNN）是专为**具有空间拓扑结构的数据**（图像、谱图、网格）设计的神经网络架构，核心思想是用**卷积层**替代全连接层来提取特征。卷积层通过三个关键设计大幅降低参数量并提升效果：**局部连接**（每个神经元只看输入的一小块区域而非全部，对应「感受野」概念）、**参数共享**（同一个卷积核在整张图上滑动复用，假设特征具有平移不变性）、**多通道堆叠**（一层用几十到几百个核学不同特征，输出深度方向堆叠成特征图）。一次卷积运算由四个超参控制——**卷积核大小** F、**步长** S、**零填充** P、**空洞率** dilation，输出空间尺寸由公式 `(W - F + 2P)/S + 1` 决定。在卷积层之间穿插**池化层**（最大池化最常用）逐步降分辨率、扩大感受野、聚合空间信息，再末端接全连接层做分类。经典架构演化清晰呈现了这条主线：LeNet（1998）开创、AlexNet（2012）引爆深度学习、VGG（2014）证明「更深的 3×3 堆叠」、ResNet（2015）用残差连接突破上百层、Inception/EfficientNet 探索多分支与神经架构搜索。CNN 在图像分类、目标检测、语义分割、特征金字塔等任务上是事实标准；医学影像、自动驾驶感知、人脸识别等工业级 CV 系统几乎都建立在 CNN 主干上。随着 Vision Transformer 兴起，CNN 在分类榜上不再是绝对王者，但其归纳偏置（局部性 + 平移不变性）在数据效率、小样本、移动端部署上仍不可替代。信源 cs231n 卷积网络章节。

## 评价

**优点**

- **参数效率极高**：局部连接 + 参数共享让 CNN 参数量比等价 MLP 少几个数量级（AlexNet 第一层从 1.05 亿降到 3.5 万）
- **平移不变性内建**：卷积核滑动 + 池化天然对物体位置变化鲁棒，识别准确率高
- **层次化特征学习**：浅层学边缘纹理、中层学部件、深层学语义物体，可解释性强
- **感受野可控**：堆叠小卷积核（如多个 3×3）以低参数量获得大感受野，兼顾效率与表达力
- **生态最成熟**：从 LeNet 到 EfficientNet，架构、预训练权重、部署工具链（TensorRT/CoreML/TFLite）完整
- **数据效率优于 ViT**：归纳偏置让 CNN 在小样本/移动端场景仍优于无偏置的 Transformer

**缺点**

- **仅适配网格数据**：对图结构、点云、无序集合等非欧数据需改用 GNN/PointNet，原生 CNN 不适用
- **全局建模弱**：感受野靠堆叠扩展，长距离依赖需很深的网络或 Attention 补强
- **对旋转/尺度变化不够鲁棒**：需数据增强（翻转/缩放）或专门设计（如 STN、可变形卷积）才能应对
- **计算密集**：高分辨率特征图卷积算力与显存消耗大，实时推理需量化/剪枝
- **架构设计经验重**：层数、核大小、通道数选型高度依赖试错，NAS 之前人工调参成本高

## 文档地址

- [cs231n 卷积神经网络章节](https://cs231n.github.io/convolutional-networks/)
- [cs231n 神经网络案例学习（架构演化）](https://cs231n.github.io/neural-networks-case-study/)
- [PyTorch torchvision.models 预训练架构](https://docs.pytorch.org/vision/stable/models.html)
- [PyTorch Conv2d 文档](https://docs.pytorch.org/docs/stable/generated/torch.nn.Conv2d.html)
- [Papers with Code 图像分类榜单](https://paperswithcode.com/task/image-classification)

## GitHub地址

[pytorch/vision](https://github.com/pytorch/vision)

## 幻灯片地址

<a href="/SlideStack/cnn-slide/" target="_blank">卷积神经网络（CNN）</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=PENDING" target="_blank" rel="noopener noreferrer">卷积神经网络（CNN）测试题</a>
