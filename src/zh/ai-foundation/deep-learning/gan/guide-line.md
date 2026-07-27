---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 Goodfellow 2014 + DCGAN(2015)/CGAN(2014)/CycleGAN(2017)/WGAN(2017)/WGAN-GP(2017)/StyleGAN(2019)/BigGAN(2019) 论文编写

## 速查

- **DCGAN 三准则**：用转置卷积（G）/步长卷积（D）替代池化；全用 BatchNorm（G 输出层与 D 输入层除外）；激活用 LeakyReLU/ReLU/Tanh（G 输出）
- **CGAN（条件 GAN）**：把条件 y 拼到 G 的输入与 D 的输入，目标 `min_G max_D E[log D(x|y)] + E[log(1-D(G(z|y)))]`，实现可控生成
- **CycleGAN**：无配对图像翻译（如马↔斑马），双 G 双 D + 循环一致性损失 `L_cyc = E[||F(G(x)) - x||] + E[||G(F(y)) - y||]`
- **WGAN 核心**：用 Wasserstein 距离 W(p_data, p_g) 替换 JS 散度，即使两分布不相交也提供平滑梯度
- **WGAN 关键约束**：critic（判别器）须满足 1-Lipschitz——原 WGAN 用权重裁剪，WGAN-GP 改用梯度惩罚
- **WGAN-GP 梯度惩罚**：在损失中加 `λ·E_{x̂}[(||∇_{x̂} D(x̂)||₂ - 1)²]`，x̂ 是真伪样本间插值点，λ 常取 10
- **WGAN 优势**：训练稳定、损失曲线与生成质量单调相关（loss 越低图越好）、几乎不需调参
- **StyleGAN**：用 AdaIN（自适应实例归一化）把风格 w 注入每层，解耦「全局风格」与「随机细节」，引入噪声实现局部随机性
- **StyleGAN 改进（2/3 代）**：StyleGAN2 去除 AdaIN 的伪影（path length regularization）、StyleGAN3 解决纹理粘附（alias-free）
- **BigGAN**：大规模 batch + 截断技巧（truncation trick，z 从截断正态采样）+ class-conditional + 自注意力，ImageNet 类条件生成 SOTA
- **模式崩溃对策**：Minibatch discrimination、Unrolled GAN、WGAN 系列、特征匹配、多样性正则

## GAN 训练难点：JS 散度的梯度消失

朴素 GAN 难训的根本原因在数学层面。原 GAN 目标等价于最小化 p_data 与 p_g 的 **JS 散度（Jensen-Shannon divergence）**：

```text
JS(p_data ‖ p_g) 在两种情况下梯度为零：
1. 两分布完全不相交（训练初期 p_g 与 p_data 毫无重叠）→ JS = log 2 常数，梯度为 0
2. 两分布完全重合（最优态）→ JS = 0 常数，梯度为 0
```

训练初期两分布几乎不相交，于是 D 轻松把 D(x)→1、D(G(z))→0，此时 G 的损失 `log(1-D(G(z)))` 梯度趋零，**G 学不动**。更糟的是 D 一旦太强，G 收到的梯度信号完全消失。这就是 GAN 训练不稳定的数学根源。

### 模式崩溃（Mode Collapse）

模式崩溃是另一个顽疾：G 找到一个「局部最优」——只生成能稳定骗过 D 的少数几种样本：

```text
理想：G 应覆盖 p_data 的所有模式（如能生成各种人脸）
崩溃：G 只输出 1 种样本（反复生成同一张脸），但 D 分不出真假
```

原因：G 用同一个 z（或极少数 z）映射到能骗 D 的「最优样本」，D 一旦识破，G 跳到另一个单点，循环往复却不扩大覆盖。常见对策：Minibatch discrimination（让 D 看一批样本的多样性）、Unrolled GAN（G 优化时考虑 D 未来几步）、特征匹配（G 匹配 D 中间层特征均值）、改用 WGAN（Wasserstein 距离天然缓解）。

## DCGAN：卷积 GAN 的奠基

DCGAN（Radford et al. 2015）第一次把 GAN 做到能稳定生成高质量图像（64×64 人脸/卧室），其架构准则成为图像 GAN 的事实标准：

```text
生成器 G（从噪声到图像）：
  z [batch, 100] → Linear → reshape [batch, 1024, 4, 4]
                 → ConvTranspose2d (stride=2) → [1024→512, 8, 8]
                 → ConvTranspose2d (stride=2) → [512→256, 16, 16]
                 → ConvTranspose2d (stride=2) → [256→128, 32, 32]
                 → ConvTranspose2d (stride=2) → [128→3,   64, 64]
                 → Tanh（输出归一化到 [-1,1]）
每层：BatchNorm + ReLU（G 输出层除外，无 BN，用 Tanh）

判别器 D（从图像到概率）：
  x [batch, 3, 64, 64]
                 → Conv2d (stride=2) → [3→128, 32, 32]
                 → Conv2d (stride=2) → [128→256, 16, 16]
                 → ... 逐步降分辨率
                 → 1×1 → Sigmoid
每层：BatchNorm（D 输入层除外）+ LeakyReLU(0.2)
```

**三条经验准则**：

1. **用步长卷积/转置卷积替代池化**——让网络自己学下采样/上采样
2. **全用 BatchNorm**——稳定训练，但 G 的输出层和 D 的输入层不用（避免样本独立性破坏与梯度震荡）
3. **激活函数**：G 用 ReLU（输出 Tanh），D 用 LeakyReLU（斜率 0.2）

> 优化器统一 Adam，lr=2e-4，beta1=0.5（降低动量避免震荡）。这套配置至今仍是图像 GAN 起点。

## 条件 GAN：可控生成

原始 GAN 只能随机生成，无法控制「生成什么」。条件 GAN（CGAN，Mirza & Osindero 2014）把额外条件 y（类别标签、文本、图像等）注入 G 和 D：

```text
G(z, y) : 噪声 z 与条件 y 拼接 → 生成符合 y 的样本
D(x, y) : 判别器也要看 y，判断「样本 x 是否符合条件 y 且为真」

目标：min_G max_D E_{x,y}[log D(x|y)] + E_z[log(1 - D(G(z|y)|y))]
```

**意义**：CGAN 开启了 GAN 的「可控生成」范式。后续所有条件生成（Pix2Pix 图像翻译、Text-to-Image、StyleGAN 的风格控制）都是它的延伸。

## CycleGAN：无配对图像翻译

图像翻译（把马变斑马、把照片变梵高画）通常需要配对数据（同一场景的两种风格），昂贵且难获取。CycleGAN（Zhu et al. 2017）用「循环一致性」摆脱配对依赖：

```text
两个生成器：G: X→Y（如马→斑马），F: Y→X（斑马→马）
两个判别器：D_Y 判 Y 真假，D_X 判 X 真假

循环一致性损失（核心）：
  L_cyc = E_{x~X}[ ||F(G(x)) - x||_1 ] + E_{y~Y}[ ||G(F(y)) - y||_1 ]
  含义：x 翻译过去再翻译回来应该≈x（信息不丢失）

对抗损失：
  L_GAN = E_y[log D_Y(y)] + E_x[log(1 - D_Y(G(x)))]  +  (X 方向同理)

总损失 = L_GAN(G,F,D_X,D_Y) + λ · L_cyc(G,F)，λ 常取 10
```

**关键**：循环一致性迫使翻译「保留内容、只改风格」，无需配对数据。广泛应用于风格迁移、季节转换、画质增强。

## WGAN：解决梯度消失的根本方案

WGAN（Arjovsky et al. 2017）从数学层面重新设计 GAN——用 **Wasserstein 距离**（又称 Earth-Mover 距离）替换 JS 散度：

```text
Wasserstein 距离 W(p_data, p_g)：
  W = inf ‖‖ γ ‖‖_1 ， γ 是 p_data 与 p_g 的联合分布
  直觉：把分布 p_g 「搬运」成 p_data 所需的最小「搬运代价」

根据 Kantorovich-Rubinstein 对偶，可转化为：
  W(p_data, p_g) = sup_{‖f‖_L ≤ 1}  E_{x~p_data}[f(x)] - E_{z~p_z}[f(G(z))]
                           ↑ f 必须满足 1-Lipschitz（梯度模长 ≤ 1）

WGAN 目标：
  判别器（改名 critic）参数化为 f_w，最大化上式（估 Wasserstein 距离）
  生成器最小化 -E[f_w(G(z))]
```

**为什么 Wasserstein 距离更好**：

| 性质 | JS 散度（原 GAN） | Wasserstein 距离（WGAN） |
| --- | --- | --- |
| 两分布不相交时 | 恒为 log 2，**梯度为 0** | 仍提供**平滑梯度**指向对方 |
| 损失与生成质量 | 无关（loss 降不代表图好） | **单调相关**（loss 越低图越好） |
| 训练稳定性 | 极易震荡/发散 | 显著更稳，几乎不需调参 |

**1-Lipschitz 约束的实现**——这是 WGAN 的关键工程难点：

1. **原 WGAN：权重裁剪（weight clipping）**——把 critic 权重截断到 [-c, c]。简单但粗暴，会限制模型容量、导致优化困难、生成低质量样本。
2. **WGAN-GP：梯度惩罚（gradient penalty）**——Gulrajani et al. 2017 提出，直接惩罚梯度的模长：

```text
损失 = 原始 WGAN 损失 + λ · E_{x̂}[(‖∇_{x̂} f(x̂)‖₂ - 1)²]
其中 x̂ = ε·x_real + (1-ε)·x_fake，是真伪样本之间的随机插值点
λ 常取 10
```

梯度惩罚更优雅、效果更好，成为 WGAN 的事实标准。critic 不再用 Sigmoid（输出不再是概率，而是实数 f(x)），不用 BatchNorm（改用 LayerNorm，避免样本间耦合破坏梯度估计）。

## StyleGAN：解耦风格的高质量人脸

StyleGAN（Karras et al. 2019，NVIDIA）把 GAN 推到 1024×1024 几可乱真的人脸生成，核心创新是**基于风格的生成器**：

```text
传统 GAN：z → 一连串卷积 → 图像（z 在输入端一次性注入）
StyleGAN：z → 映射网络 f → w（512 维「风格向量」）
        常量输入 → 每层用 AdaIN 注入 w 作为「风格」
        + 每层加随机噪声（控制头发等「随机细节」）
```

**AdaIN（Adaptive Instance Normalization）**——风格注入的核心：

```text
AdaIN(x_i, w) = w_i_scale · (x_i - μ(x_i)) / σ(x_i) + w_i_bias
即：把每层特征做实例归一化（去均值除标准差），再用 w 给出的 scale/bias 重新缩放
效果：w 控制每层的「全局风格」（姿态、肤色、发色...）
```

**核心收益**：风格解耦——高层 w 控制粗粒度（姿态、脸型），低层 w 控制细粒度（发色、肤色），随机噪声控制微观随机性（雀斑、发丝），三者分离可控。后续 StyleGAN2（去除 AdaIN 伪影、path length regularization）、StyleGAN3（alias-free，解决纹理随图像旋转的「粘附」问题）持续改进。

## BigGAN：规模 + 截断的 SOTA

BigGAN（Brock et al. 2019）把 GAN 推到 ImageNet 类条件生成的 SOTA，关键贡献：

- **大规模**：大 batch（2048）、大模型（参数量提升 2-4 倍）、大截断
- **截断技巧（truncation trick）**：采样时 z 不从 N(0,I) 而从「截断正态」采样——丢弃离均值过远的样本：

```text
z ~ TruncatedNormal(0, I, threshold)
threshold 越小 → 样本越集中 → 生成更「标准」但多样性下降
threshold 越大 → 样本越多样的但质量下降（可能出现怪样本）
```

- **自注意力（Self-Attention）**：在中间层加自注意力，捕捉长程依赖
- **类条件注入**：用类别嵌入 + 共享嵌入（shared embedding）

**权衡**：截断技巧直观体现 GAN 的「质量 vs 多样性」权衡——这是所有生成模型的核心矛盾。

## 反模式（生产坑）

1. **用 Sigmoid 输出 + JS 散度训大模型**：易梯度消失，大规模生成应改用 WGAN-GP/hinge loss/非饱和损失
2. **G 输出层用 ReLU 不用 Tanh**：输出不归一化，生成值域失控，训练崩；必须 Tanh 归到 [-1,1]
3. **WGAN critic 用 BatchNorm**：BatchNorm 让批内样本耦合，破坏 1-Lipschitz 梯度估计，应换 LayerNorm
4. **权重裁剪值 c 设置不当**：c 太小限制容量（图糊），c 太大约束失效；不如直接用梯度惩罚
5. **忽视模式崩溃**：只看几张样本觉得「不错」就收工，实际 G 可能只生成 1 种样本；必须用 FID/IS 量化多样性
6. **D 更新次数与 G 不匹配**：D 太强（更新 k 次太多）G 梯度消失，D 太弱（更新太少）G 没有压力；WGAN 推荐 D 更新 5 次 G 更新 1 次

## 下一步

- [参考](./reference.md)：GAN 变体对比表 + 关键公式速查 + 经典论文资源
