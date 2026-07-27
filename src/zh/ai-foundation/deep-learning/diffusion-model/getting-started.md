---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Ho et al. 2020《Denoising Diffusion Probabilistic Models》(DDPM) + Lilian Weng 博客编写，对照公式与训练流程

## 速查

- **核心思想**：前向过程逐步加高斯噪声把数据变成纯噪声，反向过程训练神经网络逐步去噪还原数据
- **前向单步**：`q(x_t|x_{t-1}) = N(√(1-β_t)·x_{t-1}, β_t·I)`，β_t 是方差调度（variance schedule）
- **前向闭式解**：`q(x_t|x_0) = N(√ᾱ_t·x_0, (1-ᾱ_t)·I)`，令 α_t=1-β_t、ᾱ_t=∏α_i，可一步从原图直接跳到任意 t
- **重参数采样**：`x_t = √ᾱ_t·x_0 + √(1-ᾱ_t)·ε`，ε~N(0,I)，这是训练时构造样本的方式
- **反向过程**：`p_θ(x_{t-1}|x_t) = N(μ_θ(x_t,t), Σ_θ(x_t,t))`，神经网络学每步去噪的高斯均值
- **DDPM 简化损失**：`L_simple = E[‖ε - ε_θ(x_t, t)‖²]`，网络预测噪声 ε 而非均值
- **完整 L_simple**：`E_{t,x_0,ε}[‖ε - ε_θ(√ᾱ_t·x_0 + √(1-ᾱ_t)·ε, t)‖²]`
- **U-Net**：去噪网络的事实标准架构，带跳跃连接的编码器-解码器 + 时间嵌入 +（条件扩散的）交叉注意力
- **时间步嵌入**：用正弦位置编码（类似 Transformer）把 t 注入 U-Net 每层
- **方差调度**：β_t 通常线性从 1e-4 增到 2e-2，T=1000（DDPM 默认）；β_t 递增使 ᾱ_T≈0（纯噪声）
- **采样**：从 x_T~N(0,I) 出发，迭代 T 步按 `x_{t-1} = (1/√α_t)·(x_t - (1-α_t)/√(1-ᾱ_t)·ε_θ(x_t,t)) + σ_t·z` 去噪
- **与分数模型等价**：预测噪声 ε_θ 等价估计分数 `∇log p(x_t) ≈ -ε_θ/√(1-ᾱ_t)`

## 扩散模型是什么

扩散模型是一类**生成模型**，回答「如何从噪声中生成数据」。它通过两步走实现：

- **前向过程（加噪）**：定义一个固定的马尔可夫链，把真实数据 x_0 逐步加高斯噪声，经过 T 步退化为纯噪声 x_T~N(0,I)。这个过程不需学习，是预设的。
- **反向过程（去噪）**：训练一个神经网络，学习把每一步噪声 x_t 还原为 x_{t-1}。采样时从纯噪声 x_T 出发，迭代去噪 T 步还原出数据样本。

```text
前向（加噪，固定）：x_0 → x_1 → ... → x_T （数据 → 纯噪声）
反向（去噪，学习）：x_T → x_{T-1} → ... → x_0 （纯噪声 → 数据）
```

> 直觉：前向过程像把一滴墨水滴入清水慢慢扩散均匀；反向过程像学会「倒放」——从均匀的墨水还原出最初那滴。模型学的就是「倒放」的能力。

## 前向过程：逐步加噪

前向过程是一个固定的马尔可夫链，每一步加一点高斯噪声：

```text
q(x_t | x_{t-1}) = N( x_t ; √(1-β_t)·x_{t-1}, β_t·I )

其中 β_t ∈ (0,1) 是第 t 步的「噪声方差」（variance schedule）
{β_1, ..., β_T} 是预设的递增序列（DDPM 线性从 1e-4 到 2e-2，T=1000）
```

**关键性质**：虽然前向是一步步加噪，但借助重参数化可以**一步直接从 x_0 跳到任意 x_t**（闭式解），无需逐步计算：

```text
令 α_t = 1 - β_t，ᾱ_t = ∏_{i=1}^{t} α_i  （累积乘积）

q(x_t | x_0) = N( x_t ; √ᾱ_t · x_0, (1 - ᾱ_t)·I )

等价的采样式（重参数化）：
x_t = √ᾱ_t · x_0 + √(1 - ᾱ_t) · ε ，  ε ~ N(0, I)
```

这是训练时的核心公式——给定原图 x_0，随机采一个 t 和一个噪声 ε，直接算出 x_t，无需跑 T 步前向。

| 时间步 t | ᾱ_t（信噪比） | x_t 的样子 |
| --- | --- | --- |
| t=0 | ᾱ_0=1 | 原图 x_0 |
| t 小 | ᾱ_t 接近 1 | 轻微噪声，能看清原图 |
| t 中 | ᾱ_t ≈ 0.5 | 强噪声，模糊可辨轮廓 |
| t 大 | ᾱ_t 接近 0 | 几乎纯噪声 |
| t=T | ᾱ_T≈0 | 纯高斯噪声 x_T~N(0,I) |

> β_t 递增（越往后加噪越狠）是为了让 ᾱ_T 尽快趋于 0，保证 x_T 是各向同性高斯。

## 反向过程：学习去噪

反向过程的目标是拟合 `q(x_{t-1}|x_t)`，但它无法直接计算（需要整个数据集）。DDPM 用神经网络参数化：

```text
p_θ(x_{t-1} | x_t) = N( x_{t-1} ; μ_θ(x_t, t), Σ_θ(x_t, t) )

μ_θ : 神经网络预测的去噪均值
Σ_θ : 方差（DDPM 通常固定为与 β_t 相关的常数，不学习）
```

**DDPM 的关键简化**：不直接预测均值，而是让网络预测**第 t 步加入的噪声 ε**（参数化重写）。这样去噪均值可写成：

```text
μ_θ(x_t, t) = (1/√α_t) · ( x_t - (1 - α_t)/√(1 - ᾱ_t) · ε_θ(x_t, t) )
                                                ↑ 网络预测的噪声
```

于是训练目标简化为纯粹的「预测噪声」回归：

```text
L_simple = E_{ t ~ [1,T], x_0 ~ data, ε ~ N(0,I) } [ ‖ ε - ε_θ( √ᾱ_t·x_0 + √(1-ᾱ_t)·ε , t ) ‖² ]

直觉：
  1. 从数据采 x_0
  2. 随机采时间步 t 与噪声 ε
  3. 用闭式解算出加噪样本 x_t = √ᾱ_t·x_0 + √(1-ᾱ_t)·ε
  4. 让网络 ε_θ 从 x_t 预测出 ε
  5. 用 MSE 拉近预测噪声与真实噪声 ε
```

> 这个简化损失（去掉了变分下界中的加权项）是 DDPM 的核心贡献，效果反而比完整 ELBO 更好，成为事实标准。

## U-Net：去噪网络架构

DDPM 的去噪网络 ε_θ 几乎都用 **U-Net**（带跳跃连接的编码器-解码器）：

```text
输入：x_t（图像）+ t（时间步）
        ↓
编码器（逐层降分辨率，提特征）+ 时间嵌入 t（正弦编码注入每层）
        ↓
瓶颈层
        ↓
解码器（逐层上采样，融合跳跃连接的编码器特征）
        ↓
输出：与 x_t 同尺寸的预测噪声 ε_θ
```

**关键组件**：

- **时间嵌入**：用正弦位置编码把时间步 t 变成向量，加到 U-Net 每层（让网络知道「现在是哪个去噪阶段」）
- **跳跃连接**：编码器特征直接拼接到解码器对应层，保留高频细节（这对去噪至关重要）
- **自注意力**：在中间分辨率层加入自注意力捕捉长程依赖（Stable Diffusion 的 U-Net 在 16×16、8×8 分辨率加注意力）

## 第一个扩散模型（PyTorch 伪代码）

```python
import torch
import torch.nn as nn
import torch.nn.functional as F

class Diffusion(nn.Module):
    def __init__(self, T=1000, beta_start=1e-4, beta_end=2e-2):
        super().__init__()
        self.T = T
        # 线性方差调度
        self.betas = torch.linspace(beta_start, beta_end, T)
        self.alphas = 1 - self.betas
        self.alpha_bars = torch.cumprod(self.alphas, dim=0)  # ᾱ_t 累积乘积
        self.unet = UNet()  # 去噪网络，输入 (x_t, t) 输出预测噪声

    def forward(self, x_0):
        """训练：随机采 t 与 ε，预测 ε"""
        bs = x_0.size(0)
        t = torch.randint(0, self.T, (bs,), device=x_0.device)          # 随机时间步
        eps = torch.randn_like(x_0)                                     # 随机噪声
        abar_t = self.alpha_bars[t].view(bs, 1, 1, 1)                  # 取出 ᾱ_t
        x_t = abar_t.sqrt() * x_0 + (1 - abar_t).sqrt() * eps          # 闭式解加噪
        eps_pred = self.unet(x_t, t)                                    # 网络预测噪声
        return F.mse_loss(eps_pred, eps)                               # L_simple

    @torch.no_grad()
    def sample(self, shape):
        """采样：从纯噪声迭代去噪"""
        x = torch.randn(shape)                                          # x_T ~ N(0,I)
        for t in reversed(range(self.T)):
            eps_pred = self.unet(x, torch.full((shape[0],), t))
            alpha_t, abar_t = self.alphas[t], self.alpha_bars[t]
            # 去噪一步：x_{t-1} = (1/√α_t)(x_t - (1-α_t)/√(1-ᾱ_t)·ε_θ) + σ_t·z
            mean = (1 / alpha_t.sqrt()) * (x - (1 - alpha_t) / (1 - abar_t).sqrt() * eps_pred)
            if t > 0:
                x = mean + self.betas[t].sqrt() * torch.randn_like(x)   # 加随机噪声（t>0）
            else:
                x = mean                                                # t=0 不加噪
        return x
```

> 生产级扩散模型用更精细的方差调度、潜空间扩散、CFG，但训练-采样的核心逻辑就是上面这些。

## 下一步

- [指南：DDIM/LDM/CFG/LCM 与采样加速](./guide-line.md)：扩散关键改进与效率优化
- [参考](./reference.md)：核心公式表 + 变体对比 + 经典论文资源
