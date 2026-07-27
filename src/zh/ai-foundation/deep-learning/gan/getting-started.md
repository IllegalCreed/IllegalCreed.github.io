---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Goodfellow et al. 2014《Generative Adversarial Nets》原论文 + DCGAN/WGAN 论文编写，对照 PyTorch 实现

## 速查

- **核心定义**：GAN = 生成器 G + 判别器 D 的极大极小博弈（minimax game），G 学拟合数据分布，D 学分辨真假
- **价值函数**：`min_G max_D V(D,G) = E_{x~p_data}[log D(x)] + E_{z~p_z}[log(1 - D(G(z)))]`
- **G 的目标**：最小化 `log(1 - D(G(z)))`，即让 D 把假样本判为真（D(G(z))→1）
- **D 的目标**：最大化 V，把真样本判 1、假样本判 0
- **理论最优**：博弈达到纳什均衡时 G 的分布 p_g = p_data，此时 D(x) = 1/2（真假难辨）
- **训练算法**：每次先 k 步更新 D（梯度上升），再 1 步更新 G（梯度下降），交替进行
- **为何不用 JS 散度直接训**：当 p_g 与 p_data 不相交时 JS 散度恒为 log2，梯度为零，G 学不动——这是 GAN 训练难点根源
- **模式崩溃（mode collapse）**：G 收敛到只能输出少数几种样本，丧失多样性
- **DCGAN 三大准则**：用转置卷积/步长卷积替代池化、全用 BatchNorm（G 输出层和 D 输入层除外）、用 LeakyReLU（G 输出用 Tanh）
- **噪声分布**：z 通常采样自标准正态 N(0, I) 或均匀分布，维度 100 是经典默认
- **评估指标**：IS（Inception Score）评质量+多样性，FID（Fréchet Inception Distance）算特征分布距离，越低越好
- **训练技巧**：D 太强时 G 梯度消失，需控制 D 容量/更新次数；常用 Adam（lr=2e-4, beta1=0.5）

## GAN 是什么

GAN 是一个**生成模型框架**——给定一批真实数据（如人脸图片），学一个能「凭空生成」类似新样本的模型。它没有像 VAE 那样显式建模概率密度，而是用一个精妙的「对抗博弈」绕开了这一难题：

- **生成器 G**：输入随机噪声 z，输出生成样本 G(z)。它像一个「造假者」，努力造出以假乱真的样本
- **判别器 D**：输入样本（真的或 G 造的），输出「这是真样本的概率」D(x)∈[0,1]。它像一个「鉴定师」，努力识破假货

二者在博弈中共同进步：D 越厉害，G 被迫造得越逼真；G 越逼真，D 被迫练得更敏锐。最终理想态：G 造的样本与真样本分布完全一致，D 再也分不出真假（输出恒为 1/2）。

> 「the generative model can be thought of as analogous to a team of counterfeiters, trying to produce fake currency... the discriminative model is analogous to the police」——Goodfellow 原论文用「造假者 vs 警察」的比喻奠定了 GAN 的直觉基础。

## 价值函数：minimax 博弈

GAN 的核心是这样一个极大极小目标：

```text
min_G max_D  V(D, G) = E_{x~p_data}[ log D(x) ]       ← D 把真样本判对的奖励
                    + E_{z~p_z}[ log(1 - D(G(z))) ]    ← D 把假样本识破的奖励

其中：
p_data : 真实数据分布
p_z    : 噪声分布（通常 N(0,I)）
G(z)   : 生成器把噪声 z 映射成样本
D(x)   : 判别器输出 x 是真样本的概率，∈(0,1)
```

**直觉**：D 想最大化 V（把真的判真、假的判假），G 想最小化 V（让 D 把假的也判真）。这是个零和博弈。

### 理论最优解

Goodfellow 在原论文证明了：对固定的 G，最优判别器为 `D*_G(x) = p_data(x) / (p_data(x) + p_g(x))`。当全局最优达到时 `p_g = p_data`，代入得 `D*(x) = 1/2`——判别器彻底失去判别力。

| 阶段 | p_g 与 p_data 关系 | D(x) 表现 |
| --- | --- | --- |
| 训练初期 | p_g 远离 p_data | D 轻松区分（真→1，假→0） |
| 训练中期 | p_g 靠近 p_data | D 区分变难 |
| 理论最优 | **p_g = p_data** | **D(x) = 1/2**（无法区分） |

> 这就是 GAN「生成分布」的本质：不显式写概率密度，而是通过博弈让 G 的输出分布收敛到数据分布。

## 训练算法

GAN 不能像普通网络那样一次性反向传播，因为 G 和 D 目标相反。原论文的训练算法是交替更新：

```text
for 每个训练批次:
    # 第 1 步：训练判别器 D（k 次，原论文 k=1）
    for i in 1..k:
        1. 从真实数据采样 m 个真样本 {x_1,...,x_m}
        2. 从噪声分布采样 m 个噪声 {z_1,...,z_m}
        3. 用梯度【上升】更新 D 最大化 V:
           ∇_θD  (1/m) Σ [log D(x_i) + log(1 - D(G(z_i)))]

    # 第 2 步：训练生成器 G（1 次）
    1. 从噪声分布采样 m 个噪声 {z_1,...,z_m}
    2. 用梯度【下降】更新 G 最小化 V:
       ∇_θG  (1/m) Σ log(1 - D(G(z_i)))
```

### 为何 G 改用 `-log D(G(z))` 最大化

实践中直接最小化 `log(1 - D(G(z)))` 有问题：训练初期 G 很差，D 轻松识破，D(G(z))≈0，此时 `log(1-D(G(z)))` 梯度极小，G 学不动。改用**最大化 `log D(G(z))`**（即 `-log D` 损失），梯度在初期更大，训练更稳。二者理论最优解相同，但后者优化更顺畅。

## 第一个 GAN（PyTorch）

```python
import torch
import torch.nn as nn

# 生成器：噪声 z → 样本
class Generator(nn.Module):
    def __init__(self, latent_dim=100, img_dim=784):  # MNIST 28*28=784
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(latent_dim, 256), nn.LeakyReLU(0.2),
            nn.Linear(256, 512), nn.LeakyReLU(0.2),
            nn.Linear(512, img_dim), nn.Tanh(),  # 输出归一化到 [-1,1]
        )
    def forward(self, z):
        return self.net(z)

# 判别器：样本 → 真/假概率
class Discriminator(nn.Module):
    def __init__(self, img_dim=784):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(img_dim, 512), nn.LeakyReLU(0.2),
            nn.Linear(512, 256), nn.LeakyReLU(0.2),
            nn.Linear(256, 1), nn.Sigmoid(),  # 输出 [0,1] 概率
        )
    def forward(self, x):
        return self.net(x)

G, D = Generator(), Discriminator()
opt_G = torch.optim.Adam(G.parameters(), lr=2e-4, betas=(0.5, 0.999))  # beta1=0.5 是 GAN 关键
opt_D = torch.optim.Adam(D.parameters(), lr=2e-4, betas=(0.5, 0.999))
bce = nn.BCELoss()  # 二分类交叉熵

for epoch in range(epochs):
    for real_imgs, _ in dataloader:           # real_imgs 已归一化到 [-1,1]
        bs = real_imgs.size(0)
        real_imgs = real_imgs.view(bs, -1)

        # ---- 训练判别器：max log D(real) + log(1 - D(fake)) ----
        opt_D.zero_grad()
        z = torch.randn(bs, 100)              # 采样噪声
        fake_imgs = G(z).detach()             # detach! 不让梯度流回 G
        d_real = D(real_imgs)
        d_fake = D(fake_imgs)
        loss_D = bce(d_real, torch.ones_like(d_real)) + bce(d_fake, torch.zeros_like(d_fake))
        loss_D.backward()
        opt_D.step()

        # ---- 训练生成器：max log D(fake)（骗 D 把假判真）----
        opt_G.zero_grad()
        z = torch.randn(bs, 100)
        d_fake = D(G(z))
        loss_G = bce(d_fake, torch.ones_like(d_fake))  # 注意标签用 1（真）
        loss_G.backward()
        opt_G.step()
```

> 这是最朴素的 GAN（Goodfellow 原论文同款）。图像生成实际用 DCGAN（卷积架构），见 [指南](./guide-line.md)。

## 下一步

- [指南：DCGAN/CGAN/CycleGAN/StyleGAN 系列与训练技巧](./guide-line.md)：架构演进 + 条件控制 + 模式崩溃对策
- [参考](./reference.md)：各 GAN 变体对比表 + 关键公式 + 经典论文
