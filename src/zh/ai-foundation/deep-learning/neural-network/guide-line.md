---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 PyTorch 2.x `torch.nn` / `torch.optim` 官方文档 + cs231n 神经网络章节（neural-networks-1/2/3）编写，对照当前版本行为

## 速查

- **激活函数选型**：默认 ReLU；Transformer/GPT 选 GELU 或 SiLU；输出二分类概率用 Sigmoid；隐藏层避免 Sigmoid（梯度饱和）
- **Sigmoid 两大坑**：饱和区梯度近零（kill gradient）+ 输出非零均值（zig-zag 更新）
- **ReLU 一坑**：负区梯度恒零，大学习率下神经元「永久死亡」（dying ReLU），解法是 Leaky ReLU / GELU
- **损失对齐**：回归=MSE；多分类=CrossEntropyLoss（输入 logits，内含 Softmax）；二分类可 BCEWithLogitsLoss
- **Focal Loss**：`(1-p_t)^γ · CE`，γ=2 常用，专为类别极不平衡（如目标检测正负样本 1:1000）设计
- **优化器默认 Adam**：`lr=1e-3, betas=(0.9,0.999), eps=1e-8`；大模型精调用 SGD+Momentum（lr=0.1, momentum=0.9）
- **Adam = Momentum + RMSProp**：一阶动量 m（方向）+ 二阶动量 v（自适应步长）+ 偏差校正
- **学习率衰减**：Step / Cosine / Warmup，Transformer 训练标配 Warmup + Cosine
- **权重初始化**：ReLU 系用 He / Kaiming；Tanh·Sigmoid 用 Xavier / Glorot；切勿全零初始化（所有神经元对称，无法学习）
- **Dropout**：训练时按 p 随机置零并缩放（inverted dropout），推理时恒等；`nn.Dropout` 默认 p=0.5
- **BatchNorm vs LayerNorm**：BN 按 batch 维度归一（依赖 batch size，CNN 友好）；LN 按特征维归一（batch 无关，RNN/Transformer 友好）

## 激活函数深析

激活函数引入非线性，是神经网络区别于线性回归的本质所在。cs231n 重点对比了几个经典激活函数的优缺点。

| 名称 | 公式 | 输出范围 | 优点 | 缺点 | 适用 |
| --- | --- | --- | --- | --- | --- |
| **Sigmoid** | `σ(x) = 1/(1+e⁻ˣ)` | (0, 1) | 输出可解释为概率 | 饱和区梯度近零；非零均值致 zig-zag | 输出层二分类 |
| **Tanh** | `tanh(x) = 2σ(2x)-1` | (-1, 1) | 零均值，比 Sigmoid 好 | 仍会饱和 | 早期隐藏层（现已被 ReLU 取代） |
| **ReLU** | `max(0, x)` | [0, +∞) | 计算快；非饱和，加速收敛；稀疏激活 | 负区梯度恒零，神经元可能「死亡」 | **隐藏层默认首选** |
| **Leaky ReLU** | `max(αx, x)`，α≈0.01 | (-∞, +∞) | 解决死亡 ReLU | 多一个超参 α | ReLU 死亡时的备选 |
| **GELU** | `x·Φ(x)`，Φ 为标准正态 CDF | (-0.17, +∞) | 处处可微；平滑 | 计算稍贵 | BERT/GPT 等 Transformer |
| **SiLU/Swish** | `x·σ(x)` | (-0.28, +∞) | 平滑、自门控 | 计算稍贵 | EfficientNet/现代大模型 |

```python
import torch.nn as nn
nn.ReLU()              # 默认首选，隐藏层
nn.LeakyReLU(0.01)     # 解决死亡 ReLU
nn.GELU()              # Transformer 默认
nn.SiLU()              # Swish，现代大模型
nn.Sigmoid()           # 仅输出层二分类
```

> cs231n 明确建议：「**ReLU 是默认非线性的首选**」。新项目应从 ReLU 起步，遇死亡神经元再换 GELU 或 Leaky ReLU，避免一开始就用 Sigmoid 做隐藏层激活。

**Sigmoid 饱和杀梯度**：当 `|x|` 较大时 `σ(x)` 趋近 0 或 1，导数 `σ(1-σ)` 趋近 0——反向传播时梯度在这里被「乘以 0」传不回去，前面几层的参数几乎不更新，深层网络因此训不动。

**ReLU 神经元死亡**：当输入持续为负，ReLU 输出恒为 0、梯度也恒为 0，该神经元对所有输入「失声」且无法恢复。大学习率或不良初始化会放大这个问题，改用 He 初始化 + 适中学习率可缓解。

## 损失函数选型

损失函数告诉网络「预测得有多错」，直接决定优化方向。

| 任务 | 损失 | PyTorch | 公式要点 |
| --- | --- | --- | --- |
| **回归** | MSE | `nn.MSELoss()` | `mean((y-ŷ)²)`，对大误差敏感 |
| **回归** | MAE | `nn.L1Loss()` | `mean(|y-ŷ|)`，对异常值鲁棒 |
| **多分类** | 交叉熵 | `nn.CrossEntropyLoss()` | 内含 Softmax，输入**原始 logits** |
| **二分类** | 二元交叉熵 | `nn.BCEWithLogitsLoss()` | 内含 Sigmoid，输入 logits |
| **类别极不平衡** | Focal Loss | (自定义) | `(1-p_t)^γ · CE`，γ=2 常用 |

**交叉熵 vs Softmax 的关系**：`CrossEntropyLoss` 内部先对 logits 做 Softmax 再算负对数似然。**切勿手动 Softmax 后再传 CE**，会做两次导致数值错误。同样 `BCEWithLogitsLoss` 内部已含 Sigmoid。

**Focal Loss 直觉**：普通 CE 对所有样本一视同仁，但简单样本（已分对）仍贡献损失；Focal 用 `(1-p_t)^γ` 把已分对样本的损失权重压低，让网络聚焦难分样本。在目标检测（正负样本比 1:1000）中效果显著。

```python
# 多分类标准用法
logits = model(x)                       # [B, C]，原始 logits
loss = nn.CrossEntropyLoss()(logits, y) # y 是类索引 [B]，不是 one-hot

# Focal Loss 实现（用于类别极不平衡）
class FocalLoss(nn.Module):
    def __init__(self, gamma=2.0):
        super().__init__()
        self.gamma = gamma
    def forward(self, logits, target):
        ce = nn.functional.cross_entropy(logits, target, reduction="none")
        p_t = torch.exp(-ce)            # 分对样本 p_t 接近 1
        return ((1 - p_t) ** self.gamma * ce).mean()
```

## 优化器对比

优化器决定「拿到梯度后如何更新参数」。cs231n 给出三大流派的更新规则。

| 优化器 | 核心思想 | 更新规则（简化） | 默认超参 | 适用 |
| --- | --- | --- | --- | --- |
| **SGD** | 沿负梯度方向走 | `x -= lr · dx` | lr=0.01 | 简单任务、理论分析 |
| **SGD+Momentum** | 引入「速度」累积方向 | `v = μ·v - lr·dx; x += v` | lr=0.1, μ=0.9 | 大模型精调（CV 主流） |
| **RMSProp** | 自适应学习率（按梯度平方衰减） | `cache = ρ·cache + (1-ρ)·dx²; x -= lr·dx/(√cache+ε)` | lr=0.001, ρ=0.9 | RNN、非平稳目标 |
| **Adam** | Momentum + RMSProp | `m=β₁·m+(1-β₁)·dx; v=β₂·v+(1-β₂)·dx²; x -= lr·m/(√v+ε)` | lr=0.001, β₁=0.9, β₂=0.999 | **默认首选** |

```python
import torch.optim as optim

optim.Adam(model.parameters(), lr=1e-3)                              # 默认首选
optim.SGD(model.parameters(), lr=0.1, momentum=0.9, weight_decay=1e-4)  # CV 大模型精调
optim.RMSprop(model.parameters(), lr=1e-3)                           # RNN 老项目
```

> cs231n 结论：「**Adam 是当前推荐使用的默认算法**」。新项目从 Adam 起步；若做 ImageNet 级 CV 大模型精调或追求极致泛化，再考虑 SGD+Momentum（带 weight_decay 后泛化常优于 Adam）。

**Adam 偏差校正**：因 `m` 和 `v` 初始化为 0，初期会偏小。完整 Adam 用 `m̂ = m/(1-β₁ᵗ)`、`v̂ = v/(1-β₂ᵗ)` 修正（PyTorch 内部已实现，使用者无感）。

## 正则化与归一化

防止过拟合、稳定训练的关键手段。

### Dropout

训练时按概率 `p` 随机把神经元置零，强制网络不依赖单一神经元，相当于训练 exponentially 多个子网络的集成。

```python
nn.Dropout(p=0.5)  # 训练时每个神经元有 0.5 概率被丢弃
```

- **训练 vs 推理**：训练时随机置零并按 `1/(1-p)` 缩放（inverted dropout）；推理时恒等（不丢弃、不缩放）。PyTorch 用 `model.eval()` 自动切换
- **典型 p**：全连接层 0.5；Transformer 注意力 0.1；CNN 末端 0.25-0.5
- **位置**：常放在激活之后，输出层之前一般不加

### BatchNorm（批归一化）

在层与激活之间插入归一化，强制每层输入分布稳定（缓解内部协变量偏移），让网络对初始化更鲁棒、可用更大学习率。

```python
nn.BatchNorm1d(128)   # 全连接层后，按 batch 归一
nn.BatchNorm2d(64)    # 卷积层后，按 batch×空间归一
```

- **训练 vs 推理**：训练用当前 batch 的均值方差；推理用训练累计的滑动均值方差（`model.eval()` 切换）
- **依赖 batch size**：batch 太小（<8）统计量不准，效果变差
- **learnable γ/β**：归一化后用可学习参数缩放平移，恢复表达能力

### LayerNorm（层归一化）

按特征维度对单个样本归一，与 batch size 无关——这是 RNN/Transformer 选 LN 不选 BN 的根本原因。

```python
nn.LayerNorm(768)     # Transformer 隐藏维度归一
```

> **BN vs LN 一句话**：BN 跨样本归一（CNN 友好，依赖 batch）；LN 跨特征归一（序列模型友好，batch 无关）。Transformer 一律用 LN。

## 权重初始化

初始化决定训练能否起步。全零初始化会让所有神经元对称（前向相同、反向梯度相同），网络永远学不到差异化特征。

| 初始化 | 公式 | 适用 |
| --- | --- | --- |
| **零初始化** | `W = 0` | **禁用**（破坏对称性失败） |
| **Xavier / Glorot** | `std = sqrt(2/(fan_in+fan_out))` | Tanh / Sigmoid |
| **He / Kaiming** | `std = sqrt(2/fan_in)` | ReLU 系（默认） |

```python
# PyTorch 线性层默认就是 Kaiming uniform，多数情况无需手动改
nn.init.kaiming_normal_(layer.weight, mode="fan_in", nonlinearity="relu")
nn.init.xavier_normal_(layer.weight)
```

> cs231n 警告：初始化不当会导致前向值爆炸（饱和激活）或反向梯度消失（深层学不动）。ReLU 网络必须用 He，否则容易训练崩溃。

## 学习率与衰减

学习率是最重要的单一超参。cs231n 与 PyTorch 社区共识：

- **太大**：loss 震荡甚至 NaN（梯度爆炸）
- **太小**：收敛极慢，可能卡在局部最优
- **起步值**：Adam `1e-3`；SGD `1e-2`
- **衰减策略**：Step（每若干 epoch 乘 0.1）/ Cosine（余弦退火）/ Warmup（先升后降，Transformer 标配）

```python
from torch.optim.lr_scheduler import StepLR, CosineAnnealingLR
scheduler = StepLR(optimizer, step_size=10, gamma=0.1)     # 每 10 epoch 衰减 10 倍
scheduler = CosineAnnealingLR(optimizer, T_max=50)        # 余弦退火
# 训练循环末尾调用 scheduler.step()
```

## 反模式（生产坑）

1. **Sigmoid 做隐藏层激活**：深层网络梯度全部饱和消失，训不动。正确：隐藏层用 ReLU/GELU，Sigmoid 只留给输出层二分类
2. **全零初始化**：所有神经元对称，反向梯度相同，网络永远等价于单神经元。正确：用 He/Xavier
3. **手动 Softmax 后传 CrossEntropyLoss**：CE 内部已含 Softmax，做两次会把概率压到极小。正确：直接传 logits
4. **忘记 zero_grad**：梯度累加把上一 batch 方向叠进来，训练发散。正确：每个 batch 开头 `optimizer.zero_grad()`
5. **Dropout 在推理时未关闭**：预测结果随机抖动。正确：`model.eval()` 自动关闭 Dropout/BN 切换推理模式
6. **学习率一刀切不衰减**：后期仍用大学习率在最优点附近震荡无法精调。正确：加 Step/Cosine scheduler
7. **BatchNorm 用 batch_size=1**：方差统计为 0，归一化崩坏。正确：推理前确保 `model.eval()` 用滑动统计；训练 batch ≥ 8

## 下一步

- [参考](./reference.md)：nn 模块速查 + 超参默认值表 + 官方资源
