---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 DDPM/DDIM/LDM/CFG/LCM 论文 + Lilian Weng 博客整理

## 速查

- **前向闭式解**：`x_t = √ᾱ_t·x_0 + √(1-ᾱ_t)·ε`，令 α_t=1-β_t、ᾱ_t=∏α_i
- **DDPM 简化损失**：`L_simple = E[‖ε - ε_θ(x_t,t)‖²]`，网络预测噪声
- **去噪均值**：`μ_θ = (1/√α_t)·(x_t - (1-α_t)/√(1-ᾱ_t)·ε_θ(x_t,t))`
- **DDIM**：η=0 确定性采样，20-50 步达 DDPM 1000 步质量，无需重训
- **CFG**：`ε̃ = (1+w)·ε(·|c) - w·ε(·|∅)`，w 常用 7-9
- **LDM**：扩散在 VAE 潜空间，算力降几十倍，文本条件经交叉注意力注入
- **分数等价**：`∇log p(x_t) ≈ -ε_θ/√(1-ᾱ_t)`
- **DDPM 默认**：T=1000，β 线性 1e-4→2e-2，U-Net
- **Stable Diffusion v1.5**：潜空间 64×64×4（图像 512×512），CLIP 文本编码器，CFG w=7.5

## 核心公式速查表

| 名称 | 公式 | 说明 |
| --- | --- | --- |
| 前向单步 | `q(x_t\|x_{t-1}) = N(√(1-β_t)x_{t-1}, β_t·I)` | 逐步加噪 |
| 前向闭式 | `q(x_t\|x_0) = N(√ᾱ_t·x_0, (1-ᾱ_t)·I)` | 一步到任意 t |
| 加噪采样 | `x_t = √ᾱ_t·x_0 + √(1-ᾱ_t)·ε` | 重参数化 |
| 反向过程 | `p_θ(x_{t-1}\|x_t) = N(μ_θ(x_t,t), Σ_θ)` | 神经网络参数化 |
| 去噪均值 | `μ_θ = (1/√α_t)(x_t - (1-α_t)/√(1-ᾱ_t)·ε_θ)` | 由预测噪声重写 |
| 简化损失 | `L_simple = E[‖ε - ε_θ(x_t,t)‖²]` | DDPM 训练目标 |
| 采样步 | `x_{t-1} = μ_θ + σ_t·z, z~N(0,I)` | 迭代去噪 |
| CFG | `ε̃ = (1+w)ε(·\|c) - w·ε(·\|∅)` | 引导采样 |
| 分数等价 | `∇log p(x_t) ≈ -ε_θ/√(1-ᾱ_t)` | 与分数模型统一 |
| 朗之万 | `x_t = x_{t-1} + (δ/2)∇log p + √δ·ε` | 分数采样 |

## 方差调度（Variance Schedule）对比

| 调度类型 | 形式 | 特点 | 代表 |
| --- | --- | --- | --- |
| **线性** | β_t 线性递增 | DDPM 默认，简单 | DDPM（1e-4→2e-2） |
| **余弦** | 余弦曲线递增 | ᾱ 衰减更平滑，高分辨率表现好 | Improved DDPM |
| **平方根** | √t 形式 | 早期加噪更慢 | 部分 LDM |
| **学习式** | β_t 可学习 | 自适应，复杂 | 较少用 |

## 变体与改进对比

| 模型/方法 | 年份 | 核心贡献 | 解决问题 |
| --- | --- | --- | --- |
| **DDPM** | 2020 | 预测噪声 + 简化损失 | 奠定扩散生成范式 |
| **DDIM** | 2020 | 非马尔可夫确定性采样 | 采样慢（千步→几十步） |
| **Improved DDPM** | 2021 | 余弦调度 + 学习方差 | 提升质量与似然 |
| **Score SDE** | 2021 | 连续时间 SDE 统一框架 | 理论统一 + 新采样器 |
| **LDM（Stable Diffusion）** | 2022 | 潜空间扩散 + 交叉注意力 | 算力消耗大 |
| **CFG** | 2022 | 无分类器引导 | 条件控制与质量提升 |
| **DALL·E 2 / Imagen** | 2022 | 文本到图像大模型 | 高质量文生图 |
| **DPM-Solver** | 2022 | 高阶 ODE 求解器 | 进一步加速采样 |
| **LCM** | 2023 | 一致性蒸馏 | 几步极速生成 |
| **DiT（Diffusion Transformer）** | 2023 | 用 Transformer 替代 U-Net | 架构扩展性（Sora 基础） |
| **Sora / 视频扩散** | 2024 | 时空扩散生成视频 | 视频生成 |

## U-Net 与 DiT 架构对比

| 维度 | U-Net（传统） | DiT（Diffusion Transformer） |
| --- | --- | --- |
| **主体** | 卷积编码器-解码器 + 跳跃连接 | Transformer blocks |
| **条件注入** | 交叉注意力 + 时间嵌入 | AdaLN-Zero（自适应 LayerNorm） |
| **扩展性** | 受限于卷积，难超大模型 | Scaling 友好，可吸收超大算力 |
| **代表** | Stable Diffusion v1.5/v2 | Sora、Stable Diffusion 3 |
| **趋势** | 仍是多数模型默认 | 大模型时代新方向 |

## 采样器对比（Stable Diffusion WebUI 常见）

| 采样器 | 类型 | 步数 | 特点 |
| --- | --- | --- | --- |
| Euler a | 原始 | 20-30 | 快、稳定，质量中上 |
| DDIM | 确定性 | 20-50 | 经典加速，可语义插值 |
| DPM++ 2M Karras | 高阶 ODE | 20-30 | 主流推荐，质量高 |
| UniPC | 高阶 | 10-20 | 新一代极速 |
| LCM | 蒸馏 | 4-8 | 极速（结合 LCM-LoRA） |

## 经典论文与资源

- [Denoising Diffusion Probabilistic Models（Ho et al. 2020）](https://arxiv.org/abs/2006.11239) —— DDPM 开山之作
- [Denoising Diffusion Implicit Models（Song et al. 2020）](https://arxiv.org/abs/2010.02502) —— DDIM 加速采样
- [What are Diffusion Models?（Lilian Weng 博客）](https://lilianweng.github.io/posts/2021-07-11-diffusion-models/) —— 权威综述
- [High-Resolution Image Synthesis with Latent Diffusion Models（Rombach et al. 2022）](https://arxiv.org/abs/2112.10752) —— Stable Diffusion
- [Classifier-Free Diffusion Guidance（Ho & Salimans 2022）](https://arxiv.org/abs/2207.12598) —— CFG
- [Score-Based Generative Modeling through SDEs（Song et al. 2021）](https://arxiv.org/abs/2011.13456) —— 统一框架
- [Denoising Diffusion Models: A Generative Learning Big Bang（CVPR 2023 Tutorial）](https://cvpr2023-tutorial-diffusion-models.github.io/) —— 系统教程
- [The Annotated Diffusion Model（Niels Rogge）](https://huggingface.co/blog/annotated-diffusion) —— 带代码注释
- [Latent Consistency Models（Luo et al. 2023）](https://arxiv.org/abs/2310.04378) —— LCM 加速
- [Scalable Diffusion Models with Transformers（Peebles & Xie 2023）](https://arxiv.org/abs/2212.09748) —— DiT
- [CompVis/stable-diffusion（官方实现）](https://github.com/CompVis/stable-diffusion)
- [huggingface/diffusers（主流推理库）](https://github.com/huggingface/diffusers)
