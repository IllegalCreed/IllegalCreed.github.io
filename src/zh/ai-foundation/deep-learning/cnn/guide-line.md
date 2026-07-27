---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 cs231n 卷积网络章节 + torchvision 官方模型文档编写，对照 PyTorch 2.x 当前版本行为

## 速查

- **架构演化主线**：LeNet(1998)→AlexNet(2012)→VGG(2014)→GoogLeNet/Inception(2014)→ResNet(2015)→EfficientNet(2019)
- **AlexNet 三大贡献**：ReLU 替代 Sigmoid、Dropout 正则化、GPU 训练——开启深度学习时代
- **VGG 洞察**：全部用 3×3 卷积堆叠到 16-19 层，用更少参数获得更大感受野
- **Inception 核心**：多尺度并行（1×1/3×3/5×5 同层并行）+ 1×1 降维减参
- **ResNet 关键**：残差连接 `y=F(x)+x` 让梯度直通，可训上百层； pretrained ResNet50 是工业默认主干
- **EfficientNet**：复合缩放（深度/宽度/分辨率协同）+ NAS，用更少参数达更高精度
- **特征金字塔（FPN）**：自顶向下 + 横向连接，融合多尺度特征，目标检测/分割标配
- **语义分割**：编码器-解码器结构（U-Net/DeepLab），上采样恢复空间分辨率
- **1×1 卷积**：不改空间尺寸，做通道降维/升维与跨通道信息融合，瓶颈层设计核心
- **迁移学习**：ImageNet pretrained 主干 + 自定义分类头，小数据也能收敛——CV 工业标准

## 经典架构演化

cs231n 用「case study」串联了 CNN 架构的演化脉络，每个里程碑都解决了前代的瓶颈。

| 架构 | 年份 | 关键创新 | 参数量 | Top-5 错误率（ImageNet） |
| --- | --- | --- | --- | --- |
| **LeNet** | 1998 | 卷积+池化+全连接雏形 | 60K | （手写数字 99.2%） |
| **AlexNet** | 2012 | ReLU + Dropout + GPU + 数据增强 | 60M | 15.3% |
| **ZF Net** | 2013 | 调小 AlexNet 第一层步长与核 | 60M | 11.2% |
| **VGG** | 2014 | 全 3×3 堆叠到 16-19 层 | 138M | 7.3% |
| **GoogLeNet/Inception** | 2014 | Inception 多尺度 + 1×1 降维 + GAP | 4M | 6.7% |
| **ResNet** | 2015 | 残差连接，152 层可训 | 60M | 3.6% |
| **EfficientNet** | 2019 | 复合缩放 + NAS | 5M~66M | 2.9% |

### LeNet-5：开创者

LeCun 1998 年用于识别手写数字（MNIST、邮政编码），是第一个成功的 CNN。

```text
输入 32×32 → Conv5×5 → Pool → Conv5×5 → Pool → FC → FC → 输出 10 类
```

价值在于确立了「卷积→池化→全连接」的经典骨架，但受限于算力，深藏近 20 年才被 AlexNet 复兴。

### AlexNet：引爆深度学习

2012 年 ImageNet 大赛中以巨大优势夺冠（错误率从 26% 降到 15%），正式引爆深度学习浪潮。

**三大贡献**：

1. **ReLU 激活**替代 Sigmoid：解决梯度饱和，训练速度提升 6 倍
2. **Dropout 正则化**：全连接层 Dropout=0.5，强力抑制过拟合
3. **GPU 训练**：双 GTX 580 训练，证明大数据 + 大模型 + 大算力可行

### VGG：证明「更深更简单」

Oxford 2014 年的洞察：**全部用 3×3 卷积堆叠**，比大核（11×11）参数更少、非线性更多、感受野通过堆叠扩展。

```python
# VGG16 的卷积块：全是 3×3，每段后 MaxPool 减半
nn.Sequential(
    nn.Conv2d(64, 64, 3, padding=1), nn.ReLU(),
    nn.Conv2d(64, 64, 3, padding=1), nn.ReLU(),
    nn.MaxPool2d(2),
    # ... 重复，通道数 64→128→256→512
)
```

> VGG16 有 138M 参数（多数在末端全连接层），从此确立了「卷积主干 + 全连接头」的范式。后续 GoogLeNet 用全局平均池化砍掉了大头。

### Inception / GoogLeNet：多尺度并行

Google 2014 年提出 Inception 模块：同一层并行用 1×1、3×3、5×5 卷积和池化，再沿通道维拼接，让网络自己学该用哪种尺度。

```text
        ┌→ 1×1 conv  ─┐
输入 ────┼→ 3×3 conv  ─┼→ concat（通道维）
        ├→ 5×5 conv  ─┤
        └→ 3×3 pool  ─┘
```

**关键优化：1×1 卷积降维**。在 3×3/5×5 卷积前加 1×1 减通道数，把参数从爆炸式增长压到可控。GoogLeNet 仅 4M 参数就达 SOTA，并率先用全局平均池化替代末端全连接。

### ResNet：残差连接突破深度瓶颈

Microsoft 2015 年的核心发现：网络加深反而训不动（退化问题，非过拟合）。解法是**残差连接（skip connection）**。

```python
# 残差块：y = F(x) + x
class ResidualBlock(nn.Module):
    def __init__(self, c):
        super().__init__()
        self.conv1 = nn.Conv2d(c, c, 3, padding=1, bias=False)
        self.bn1 = nn.BatchNorm2d(c)
        self.conv2 = nn.Conv2d(c, c, 3, padding=1, bias=False)
        self.bn2 = nn.BatchNorm2d(c)
    def forward(self, x):
        out = torch.relu(self.bn1(self.conv1(x)))
        out = self.bn2(self.conv2(out))
        return torch.relu(out + x)   # 关键：加上输入 x
```

**为什么残差有效**：梯度可通过 `+x` 这条捷径直通到浅层，缓解深层梯度消失；网络只需学「增量」`F(x)=y-x`，比直接学 `y` 更容易。ResNet 可训到 152 层，是工业界默认主干。

### EfficientNet：复合缩放

2019 年提出：深度、宽度、输入分辨率三个维度应**协同缩放**（而非只加深或只加宽），用一个复合系数 φ 统一调控。配合神经架构搜索（NAS）找到 EfficientNet-B0 基线，再缩放出 B1-B7。

> 实战建议：**新项目默认用 ResNet50 或 EfficientNet-B0 作为基线主干**——`torchvision.models` 一行加载预训练权重，迁移学习即可。

## 特征金字塔（FPN）

目标检测与实例分割中，不同大小的物体需要在不同尺度的特征图上检测。FPN（Feature Pyramid Network）通过「自顶向下 + 横向连接」融合多尺度特征。

```text
自底向上（主干前向）：C2 → C3 → C4 → C5（分辨率递减，语义递增）
自顶向下 + 横向连接：
  C5 → 1×1 → M5
  M5 上采样 + C4 横向连接 → M4
  M4 上采样 + C3 横向连接 → M3
最终输出 P2-P5：每层都既有高分辨率又有强语义
```

**价值**：每个金字塔层都用同样强的语义特征做检测，小物体在大特征图上检测、大物体在小特征图上检测，全面提升各尺度检测精度。FPN 是 RetinaNet、Mask R-CNN、YOLOv3+ 等检测器的主干组件。

## 语义分割

语义分割要求**像素级分类**——给图中每个像素打类别标签。与图像分类（整图一个标签）和目标检测（框出物体）不同。

**编码器-解码器结构**：

```text
输入图 → 编码器（CNN 主干，逐层降分辨率、提语义）
      → 解码器（逐层上采样，恢复空间分辨率）
      → 像素级分类输出（每像素一个类别概率）
```

代表网络：

| 网络 | 特点 |
| --- | --- |
| **U-Net** | 对称编解码 + skip connection 拼接，医学影像标杆 |
| **DeepLab** | 空洞卷积扩大感受野 + ASPP 多尺度，自然图像主流 |
| **SegNet** | 池化索引上采样，保留细节 |

**关键技术**：

- **上采样**：双线性插值（无参数）/ 转置卷积（可学习，但易棋盘伪影）
- **空洞卷积（Dilated Conv）**：核内插间隔，不增加参数扩大感受野，DeepLab 核心
- **跳跃连接**：把编码器的高分辨率细节传给解码器，恢复边界精度（U-Net 灵魂）

## 1×1 卷积的妙用

1×1 卷积不改变空间尺寸（每个像素独立），只在通道维做线性组合。三个核心用途：

1. **通道降维**：把 512 通道降到 64，参数与计算量降 8 倍（Inception 瓶颈层）
2. **通道升维**：低成本增加非线性表达（ResNet 瓶颈块）
3. **跨通道信息融合**：让不同通道特征交互（等效逐像素全连接）

```python
nn.Conv2d(512, 64, 1)   # 1×1 卷积：512 通道降到 64，空间不变
```

## 迁移学习（Transfer Learning）

CV 工业实践几乎不从头训 CNN——用 ImageNet 预训练主干 + 自定义分类头微调。

```python
import torchvision
model = torchvision.models.resnet18(weights="IMAGENET1K_V1")  # 加载预训练权重
# 冻结主干（小数据集）
for p in model.parameters():
    p.requires_grad = False
# 替换最后一层
model.fc = nn.Linear(model.fc.in_features, num_classes)
# 只训新分类头；大数据可解冻全部微调
```

> 数据少（每类 <100 张）：冻结主干只训头；数据中（每类 ~1000）：解冻最后几块；数据多：全网络微调。这是 CV 工程的标准操作手册。

## 反模式（生产坑）

1. **第一层用大步长大核**：信息丢失过多，浅层学不到好特征。正确：入口用 7×7 stride 2 或 3 个 3×3 stride 1
2. **末端用大全连接层**：参数爆炸易过拟合。正确：用全局平均池化（GAP）替代
3. **不用 BatchNorm**：深层 CNN 训练不稳定。正确：每个 Conv 后加 BN 再 ReLU
4. **从头训 ImageNet 级任务**：算力浪费且难收敛。正确：用预训练权重迁移学习
5. **忽略感受野计算**：检测小物体时感受野不够导致漏检。正确：堆叠足够深度或用空洞卷积扩感受野

## 下一步

- [参考](./reference.md)：架构参数表 + torchvision 速查 + 官方资源
