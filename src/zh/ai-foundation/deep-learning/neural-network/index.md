---
layout: doc
---

# 神经网络

神经网络（Neural Network）是深度学习的基本计算单元，把生物学「神经元」抽象为可微的数学算子，通过**层叠的非线性变换**从数据中端到端地学习特征表示。从结构看，最简单的形态是**感知机**——单层线性神经元，做二分类；当堆叠出至少一个**隐藏层**时，就成了**多层感知机（MLP）**，依靠通用近似定理可拟合任意连续函数。训练神经网络靠两套循环：**前向传播**算出预测与损失（输入逐层乘权重矩阵、过激活函数，到输出层算 MSE / 交叉熵 / Focal 损失），**反向传播**用链式法则把损失对每个参数的梯度逐层回传，再由**优化器**（SGD / Momentum / RMSProp / Adam）按梯度方向更新权重。要让网络真正训得动，还必须处理三件事：用 ReLU / GELU / SiLU 等激活函数引入非线性并避免梯度饱和，用 He / Xavier 初始化避免前向发散与反向消失，用 Dropout / BatchNorm / LayerNorm 等正则化与归一化手段抑制过拟合、稳定训练。神经网络是 CNN、RNN、Transformer 等所有现代深度学习架构的公共地基——它们的差异只在「如何组织连接拓扑」，可学习权重、梯度下降、反向传播这套机制完全一致。PyTorch 用 `torch.nn` 模块把线性层、激活、损失、优化器统一成可组合的积木，是当前最主流的实现载体。

## 评价

**优点**

- **通用近似能力**：只要隐藏层够宽够深，MLP 可逼近任意连续函数，表达能力远超线性模型与核方法
- **端到端学习**：特征提取与判别联合优化，免去传统机器学习的繁琐人工特征工程
- **生态成熟**：PyTorch / TensorFlow 提供自动微分、GPU 加速、丰富算子库，从研究到部署链路打通
- **可扩展到海量数据**：模型容量随参数量线性增长，配合大数据与算力持续提升性能，无饱和天花板
- **迁移与预训练**：参数可复用、可微调，预训练 + 下游适配成为工业标准（CV/NLP 通用范式）
- **架构高度模块化**：线性层、激活、归一化、损失可任意组合拼装，催生 CNN / RNN / Transformer 等变体

**缺点**

- **数据饥渴**：参数多需要大量带标数据，小样本场景易过拟合，传统树模型常更合适
- **算力与能耗高**：训练动辄千万亿 FLOPs，GPU/TPU 成本与碳排放不容忽视
- **黑盒可解释性差**：数百万参数难以追溯单次预测依据，合规审计与误差归因困难
- **对超参数敏感**：学习率、初始化、批量大小、正则化系数稍有偏差即训练不收敛或发散
- **易受对抗样本攻击**：人眼不可见的输入扰动即可让预测翻转，鲁棒性弱于传统方法
- **训练不稳定**：梯度消失 / 爆炸、神经元死亡、内部协变量偏移等问题需大量技巧缓解

## 文档地址

- [PyTorch torch.nn 官方文档](https://docs.pytorch.org/docs/stable/nn.html)
- [PyTorch torch.optim 优化器文档](https://docs.pytorch.org/docs/stable/optim.html)
- [cs231n 神经网络笔记 1：拓扑与激活函数](https://cs231n.github.io/neural-networks-1/)
- [cs231n 神经网络笔记 2：初始化与正则化](https://cs231n.github.io/neural-networks-2/)
- [cs231n 神经网络笔记 3：学习与优化](https://cs231n.github.io/neural-networks-3/)

## GitHub地址

[pytorch/pytorch](https://github.com/pytorch/pytorch)

## 幻灯片地址

<a href="/SlideStack/neural-network-slide/" target="_blank">神经网络</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=PENDING" target="_blank" rel="noopener noreferrer">神经网络测试题</a>
