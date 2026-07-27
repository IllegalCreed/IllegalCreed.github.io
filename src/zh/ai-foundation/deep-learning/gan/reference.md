---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Goodfellow 2014 + 各 GAN 变体论文整理

## 速查

- **核心公式**：`min_G max_D E[log D(x)] + E[log(1 - D(G(z)))]`
- **理论最优**：p_g = p_data 时 D(x) = 1/2
- **改进主线**：DCGAN（架构）→ CGAN（条件）→ CycleGAN（无配对翻译）→ WGAN/WGAN-GP（稳定）→ StyleGAN（解耦）→ BigGAN（规模）
- **损失函数谱系**：JS 散度（原 GAN）→ hinge loss（工业常用）→ Wasserstein 距离（WGAN）→ Wasserstein + 梯度惩罚（WGAN-GP）
- **评估**：FID（越低越好）/ IS（越高越好）/ 精确率-召回率（Precision-Recall）
- **常见配置**：Adam(lr=2e-4, beta1=0.5)、噪声维度 100、Tanh 输出、LeakyReLU(0.2)
- **WGAN-GP λ**：梯度惩罚系数默认 10；critic 不用 BatchNorm 改 LayerNorm
- **StyleGAN2 训练分辨率**：1024×1024，FFHQ 数据集 7 万张名人脸

## GAN 变体对比表

| 变体 | 年份 | 核心创新 | 解决的问题 | 代表应用 |
| --- | --- | --- | --- | --- |
| **GAN** | 2014 | 极大极小博弈框架 | 提出生成模型新范式 | 概念奠基 |
| **CGAN** | 2014 | 条件 y 注入 G/D | 不可控生成 | 类条件生成 |
| **DCGAN** | 2015 | 卷积架构准则 + BatchNorm | 架构不稳、质量差 | 图像生成奠基 |
| **CycleGAN** | 2017 | 双 G 双 D + 循环一致性 | 需配对数据 | 风格迁移、图像翻译 |
| **WGAN** | 2017 | Wasserstein 距离 | JS 散度梯度消失 | 训练稳定 |
| **WGAN-GP** | 2017 | 梯度惩罚替代权重裁剪 | 权重裁剪限制容量 | 稳定训练标配 |
| **Pix2Pix** | 2017 | 配对条件 GAN + L1 | 配对图像翻译 | 标注→图像、线稿→彩图 |
| **SNGAN** | 2018 | 谱归一化（Spectral Norm）| 稳定 D 的 Lipschitz | 类条件生成 |
| **StyleGAN** | 2019 | AdaIN 风格注入 + 映射网络 | 风格不可控 | 高质量人脸生成 |
| **BigGAN** | 2019 | 大规模 + 截断技巧 + 自注意力 | ImageNet 大规模生成 | 类条件 SOTA |
| **StyleGAN2** | 2020 | path length reg + 去伪影 | AdaIN 伪影 | 人脸/汽车/建筑 |
| **StyleGAN3** | 2021 | alias-free（抗混叠）| 纹理粘附 | 旋转/缩放不变生成 |

## 关键公式速查

### 原始 GAN 价值函数

```text
min_G max_D  V(D,G) = E_{x~p_data}[ log D(x) ] + E_{z~p_z}[ log(1 - D(G(z))) ]

等价于：min_G  2·JS(p_data ‖ p_g) - 2·log 2   （JS 散度）
```

### 最优判别器

```text
D*_G(x) = p_data(x) / ( p_data(x) + p_g(x) )
当 p_g = p_data 时，D*(x) = 1/2
```

### 非饱和损失（实践常用）

```text
G 的目标改为：max_G  E_z[ log D(G(z)) ]    （而非 min log(1-D(G(z))) ）
理论最优相同，但训练初期梯度更大
```

### WGAN 损失

```text
critic f_w 最大化： E_{x~p_data}[f_w(x)] - E_z[f_w(G(z))]
约束：f_w 是 1-Lipschitz
G 最小化： -E_z[f_w(G(z))]
```

### WGAN-GP 梯度惩罚

```text
L = 原始 WGAN 损失 + λ · E_{x̂}[ (‖∇_{x̂} f(x̂)‖₂ - 1)² ]
x̂ = ε·x_real + (1-ε)·x_fake ， ε ~ U(0,1)
λ = 10
```

### CycleGAN 循环一致性

```text
L_cyc = E_x[ ‖F(G(x)) - x‖_1 ] + E_y[ ‖G(F(y)) - y‖_1 ]
L_total = L_GAN + λ · L_cyc ， λ = 10
```

### StyleGAN AdaIN

```text
AdaIN(x_i, y) = y_scale · (x_i - μ(x_i))/σ(x_i) + y_bias
y 由风格向量 w 经线性层投影得到 (scale, bias)
```

## 评估指标

| 指标 | 全称 | 衡量 | 越好方向 | 说明 |
| --- | --- | --- | --- | --- |
| **FID** | Fréchet Inception Distance | 真实/生成特征分布的 Fréchet 距离 | **越低越好** | 主流指标，用 Inception 网络提特征，假设高斯算距离 |
| **IS** | Inception Score | 生成图像的「清晰度 + 多样性」 | **越高越好** | 早期间指标，不与真实数据对比，易被欺骗 |
| **P&R** | Precision & Recall | 生成质量（P）与覆盖度（R） | 都高 | 用特征流形判别，分离质量与多样性 |
| **KID** | Kernel Inception Distance | 核距离版本的 FID | 越低越好 | 无偏估计，小数据集更稳 |

> 生产环境以 **FID 为主**，辅以人工评估。IS 因不参考真实数据已逐渐被淘汰。

## 训练超参速查（DCGAN 基线）

| 参数 | 推荐值 | 说明 |
| --- | --- | --- |
| 噪声维度 | 100 | z ~ N(0, I) |
| 优化器 | Adam | lr=2e-4, beta1=0.5, beta2=0.999 |
| G 激活 | ReLU（输出 Tanh） | 输出归一到 [-1,1] |
| D 激活 | LeakyReLU(0.2) | 输出 Sigmoid（或 hinge loss 无激活） |
| BatchNorm | 全用 | G 输出层与 D 输入层除外 |
| 训练比 | D:G = 1:1 | WGAN 推荐 D:G = 5:1 |
| 数据归一化 | [-1, 1] | 配合 Tanh 输出 |
| 批大小 | 64-128 | BigGAN 用 2048 |

## 经典论文与资源

- [Generative Adversarial Nets（Goodfellow et al. 2014）](https://arxiv.org/abs/1406.2661) —— 开山之作
- [Conditional Generative Adversarial Nets（Mirza & Osindero 2014）](https://arxiv.org/abs/1411.1784) —— CGAN
- [Unsupervised Representation Learning with DCGAN（Radford et al. 2015）](https://arxiv.org/abs/1511.06434) —— 卷积 GAN 奠基
- [Unpaired Image-to-Image Translation using CycleGAN（Zhu et al. 2017）](https://arxiv.org/abs/1703.10593) —— 无配对翻译
- [Wasserstein GAN（Arjovsky et al. 2017）](https://arxiv.org/abs/1701.07875) —— WGAN，理论突破
- [Improved Training of Wasserstein GANs（Gulrajani et al. 2017）](https://arxiv.org/abs/1704.00028) —— WGAN-GP
- [A Style-Based Generator Architecture for GANs（Karras et al. 2019）](https://arxiv.org/abs/1812.04948) —— StyleGAN
- [Analyzing and Improving the Image Quality of StyleGAN（Karras et al. 2020）](https://arxiv.org/abs/1912.04958) —— StyleGAN2
- [Large Scale GAN Training for High Fidelity Natural Image Synthesis（Brock et al. 2019）](https://arxiv.org/abs/1809.11096) —— BigGAN
- [Spectral Normalization for GANs（Miyato et al. 2018）](https://arxiv.org/abs/1802.05957) —— SNGAN
- [NVIDIA StyleGAN3 官方实现](https://github.com/NVlabs/stylegan3)
- [eriklindernoren/PyTorch-GAN（多 GAN 变体实现）](https://github.com/eriklindernoren/PyTorch-GAN)
