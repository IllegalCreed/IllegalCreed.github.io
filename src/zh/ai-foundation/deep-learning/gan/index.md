---
layout: doc
---

# 生成对抗网络（GAN）

生成对抗网络（Generative Adversarial Network，GAN）是 Goodfellow 等人 2014 年提出的**生成模型框架**，核心思想是让两个神经网络在「对抗博弈」中共同进化：**生成器 G**（generator）从随机噪声 z 出发生成假样本，目标是骗过判别器；**判别器 D**（discriminator）是一个二分类器，目标是分辨样本来自真实数据还是 G 生成的。二者构成一个**极大极小博弈（minimax game）**，价值函数为 `min_G max_D V(D,G) = E_x[log D(x)] + E_z[log(1 - D(G(z)))]`。理论上当博弈达到纳什均衡时，G 完美拟合数据分布 p_data，D 在任意样本上输出恒为 1/2（无法分辨）。GAN 的革命性在于：**无需显式定义似然函数**（区别于 VAE/扩散模型的概率建模），只需可微采样即可用反向传播训练，因此生成质量极高、速度快（单次前向）。但代价是训练极不稳定——**模式崩溃（mode collapse）**（G 只能生成少数几种样本）和不收敛是经典难题。围绕稳定性与质量，GAN 演化出庞大谱系：**DCGAN**（2015，卷积架构奠定图像生成）→ **条件 GAN（CGAN/cGAN）**（条件控制）→ **WGAN**（2017，用 Wasserstein 距离替换 JS 散度解决梯度消失）→ **WGAN-GP**（梯度惩罚替代权重裁剪）→ **CycleGAN**（无配对图像翻译，循环一致性）→ **StyleGAN**（2018/2019/2020 三代，AdaIN 解耦风格，人脸生成标杆）→ **BigGAN**（2019，规模 + 截断技巧，ImageNet SOTA）。在 AI 体系中，GAN 是深度生成模型三大范式之一（与 VAE、扩散模型并列），曾主导图像生成近十年，如今在实时/可控生成、风格迁移、超分等场景仍不可替代。信源 Goodfellow 2014 原论文 + 各改进论文。

## 评价

**优点**

- **生成质量高**：对抗训练驱使 G 逼近真实分布，图像分辨率、清晰度在生成模型中名列前茅（StyleGAN2/3 的 1024×1024 人脸几可乱真）
- **推理速度极快**：生成只需一次前向传播 G(z)，单步出图，比扩散模型快几百到几千倍，适合实时交互
- **无需似然建模**：不依赖对数似然下界（如 VAE 的 ELBO）或概率密度估计，对那些难以写出似然函数的数据更灵活
- **隐空间结构丰富**：训练良好的 GAN 隐空间具备可插值性、线性可加性（如「戴眼镜的男人 − 男人 + 女人 = 戴眼镜的女人」），支持语义编辑
- **架构灵活**：G/D 可任意设计（MLP/CNN/Transformer），适配图像、音频、视频、文本、分子等多模态
- **可控生成生态成熟**：CGAN/StyleGAN/ControlGAN 等提供了丰富的条件控制手段，工业落地（换脸、风格迁移、数据增强）案例多

**缺点**

- **训练不稳定**：G 与 D 相互博弈易失衡，常见震荡、发散、梯度消失，需要精细调参（学习率、网络容量匹配）
- **模式崩溃（mode collapse）**：G 找到一个能骗过 D 的局部最优，反复生成同一种或少数几种样本，丧失多样性（生成 1 万张人脸全是一个人）
- **难以评估**：没有显式似然，无法直接用对数似然度量，需依赖 FID（Fréchet Inception Distance）、IS（Inception Score）等代理指标，评估成本高且不完美
- **无显式概率密度**：只能采样不能求 p(x)，无法直接做密度估计、异常检测（需借助反演等额外技术）
- **超参敏感**：架构、优化器、批归一化位置等选择对结果影响极大，复现困难，论文结果常难复现
- **规模扩展性弱于扩散模型**：在文本/多模态大模型时代，GAN 难以像扩散模型那样平滑吸收文本条件、难以稳定训到超大规模，已被扩散模型在很多赛道超越

## 文档地址

- [Generative Adversarial Nets（Goodfellow et al. 2014 原论文）](https://arxiv.org/abs/1406.2661)
- [Wasserstein GAN（Arjovsky et al. 2017）](https://arxiv.org/abs/1701.07875)
- [Improved Training of WGANs（WGAN-GP, Gulrajani et al. 2017）](https://arxiv.org/abs/1704.00028)
- [A Style-Based Generator（StyleGAN, Karras et al. 2019）](https://arxiv.org/abs/1812.04948)
- [PyTorch GAN Zoo（NVIDIA 开源实现合集）](https://github.com/nvidia/DeepLearningExamples)

## GitHub地址

[eriklindernoren/PyTorch-GAN](https://github.com/eriklindernoren/PyTorch-GAN) · [nvlabs/stylegan3](https://github.com/NVlabs/stylegan3)

## 幻灯片地址

<a href="/SlideStack/gan-slide/" target="_blank">生成对抗网络（GAN）</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=PENDING" target="_blank" rel="noopener noreferrer">生成对抗网络（GAN）测试题</a>
