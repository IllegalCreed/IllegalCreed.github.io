---
layout: doc
---

# 扩散模型

扩散模型（Diffusion Model）是一类**基于概率迭代去噪**的生成模型，核心思想受非平衡热力学启发：定义一个**前向过程**把真实数据逐步加高斯噪声，直到退化为纯噪声；再训练一个神经网络学习**反向过程**，从纯噪声逐步去噪还原出数据样本。其奠基性工作 **DDPM（Denoising Diffusion Probabilistic Models，Ho et al. 2020）** 给出了清晰的目标——在每个时间步 t，给定加噪样本 x_t，预测所加的噪声 ε_θ(x_t, t)，用简化的均方误差 `L_simple = E[‖ε - ε_θ(√ᾱ_t·x_0 + √(1-ᾱ_t)·ε, t)‖²]` 训练。前向过程是固定的马尔可夫链 `q(x_t|x_{t-1}) = N(√(1-β_t)·x_{t-1}, β_t·I)`，由方差调度 β_t 控制，借助 `α_t=1-β_t、ᾱ_t=∏α_i` 可写出任意步直接采样的闭式解 `q(x_t|x_0) = N(√ᾱ_t·x_0, (1-ᾱ_t)·I)`。数学上，扩散模型与**基于分数的模型（score-based models）**、**朗之万动力学（Langevin dynamics）**等价统一，预测噪声 ε_θ 等价于估计扰动数据分布的分数 ∇log p(x)。围绕效率与控制，关键改进包括：**DDIM（Song et al. 2020）**用非马尔可夫确定性采样把生成步数从上千降到几十；**Stable Diffusion / 潜空间扩散 LDM（Rombach et al. 2022）**把扩散搬到 VAE 的潜空间，算力消耗降低几十倍，让消费级 GPU 可用；**Classifier-Free Guidance（CFG，Ho & Salimans 2022）**用单一网络联合训练条件与无条件模型，推理时用 `ε̃ = (1+w)·ε(x|c) - w·ε(x|∅)` 在质量与多样性间权衡，是现代文生图的标配；**Latent Consistency Models（LCM）**把扩散蒸馏成 1-4 步极速生成器。扩散模型是当前图像/视频/音频/3D 生成的统治性范式，催生了 Stable Diffusion、DALL·E、Sora、Midjourney 等现象级产品。信源 DDPM 论文 + Lilian Weng 博客 + Stable Diffusion 论文。

## 评价

**优点**

- **生成质量与多样性顶尖**：在 FID 等指标上全面超越 GAN，图像保真度高、覆盖数据分布完整（几乎无模式崩溃）
- **训练稳定**：单一均方误差损失，无 GAN 那样的对抗博弈震荡，易复现、易扩展到超大规模
- **概率意义清晰**：优化的是变分下界（ELBO），有扎实的理论保证，能做似然估计、密度评估
- **条件控制极强**：通过 CFG、交叉注意力可灵活注入文本、图像、布局等多种条件，文生图可控性好
- **统一理论框架**：DDPM、分数模型、朗之万动力学、SDE 在连续时间下统一为一个数学框架，便于研究改进
- **可解释的生成过程**：不同时间步对应不同尺度的去噪（先全局结构后局部细节），渐进生成过程可解释

**缺点**

- **采样速度慢**：标准 DDPM 需上千步迭代去噪，生成一张图耗时数秒到数分钟（GAN 单次前向），是最大短板
- **计算资源消耗大**：每步都要跑一次 U-Net，推理算力高；潜空间扩散 LDM 缓解但仍是瓶颈
- **训练成本高**：需大量数据、长时间训练，Stable Diffusion 级模型训练成本达百万美元级
- **似然虽可估计但非最优**：相比自回归模型的精确似然，扩散的 ELBO 仍有差距
- **超参敏感**：步数 T、方差调度 β_t、CFG 强度 w 等选择显著影响效果，需仔细调
- **难以做实时/高频生成**：尽管 LCM/蒸馏把步数降到几步，仍不如 GAN 快，超低延迟场景受限

## 文档地址

- [Denoising Diffusion Probabilistic Models（Ho et al. 2020，DDPM 原论文）](https://arxiv.org/abs/2006.11239)
- [What are Diffusion Models?（Lilian Weng 博客，权威综述）](https://lilianweng.github.io/posts/2021-07-11-diffusion-models/)
- [Denoising Diffusion Implicit Models（Song et al. 2020，DDIM）](https://arxiv.org/abs/2010.02502)
- [High-Resolution Image Synthesis with Latent Diffusion Models（Rombach et al. 2022，Stable Diffusion）](https://arxiv.org/abs/2112.10752)
- [Classifier-Free Diffusion Guidance（Ho & Salimans 2022）](https://arxiv.org/abs/2207.12598)

## GitHub地址

[CompVis/stable-diffusion](https://github.com/CompVis/stable-diffusion) · [openai/improved-diffusion](https://github.com/openai/improved-diffusion)

## 幻灯片地址

<a href="/SlideStack/diffusion-model-slide/" target="_blank">扩散模型</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=PENDING" target="_blank" rel="noopener noreferrer">扩散模型测试题</a>
