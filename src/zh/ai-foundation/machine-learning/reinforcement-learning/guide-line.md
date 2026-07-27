---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 OpenAI Spinning Up（Key Algorithms in Deep RL）+ Sutton & Barto 第二版 + Hugging Face RLHF 文档编写

## 速查

- **算法选型一句话**：离散动作→**DQN**；连续动作+确定策略→**DDPG/TD3**；连续动作+随机策略→**SAC**；通用稳定首选→**PPO**；表格小状态→**Q-Learning/SARSA**
- **三大函数**：`V^π(s)`（状态价值）/ `Q^π(s,a)`（动作价值）/ `π(a|s)`（策略），通过贝尔曼方程 `V(s)=E[R+γV(s')]` 自洽关联
- **TD 学习**：时序差分，用「估计 + 即时奖励」更新估计，无需等回合结束（对比蒙特卡洛需完整回合）
- **Q-Learning**：off-policy，`Q(s,a) ← Q(s,a) + α[r + γ·max_a' Q(s',a') - Q(s,a)]`，用 max 估计后继
- **SARSA**：on-policy，`Q(s,a) ← Q(s,a) + α[r + γ·Q(s',a') - Q(s,a)]`，用实际下一动作
- **DQN 创新**：经验回放（打破相关性）+ 目标网络（稳定训练），离散动作空间基石
- **PPO 核心**：on-policy Actor-Critic，clipped surrogate objective（clip 比率到 `[1±0.2]`），稳定易调，RLHF 首选
- **SAC 核心**：off-policy Actor-Critic + 最大熵强化学习（熵正则鼓励探索），连续动作空间 SOTA
- **Actor-Critic 架构**：Actor（策略网络）输出动作 + Critic（价值网络）评估状态，结合策略梯度与价值学习
- **优势函数 A(s,a) = Q(s,a) - V(s)**：动作相对平均的好坏，降低策略梯度方差的关键

## 核心概念深析

### 价值函数与贝尔曼方程

价值函数是 RL 的「地图」——告诉智能体每个状态（或状态-动作对）有多好。

**状态价值函数** `V^π(s)`：从状态 `s` 出发，按策略 `π` 行动的期望回报：

```text
V^π(s) = E_π[G_t | S_t = s]
       = E_π[R_{t+1} + γ·V^π(S_{t+1}) | S_t = s]    ← 贝尔曼方程
```

**动作价值函数** `Q^π(s,a)`：从状态 `s` 做动作 `a`，之后按策略 `π`：

```text
Q^π(s,a) = E_π[G_t | S_t=s, A_t=a]
         = E_π[R_{t+1} + γ·Q^π(S_{t+1}, A_{t+1}) | S_t=s, A_t=a]
```

**贝尔曼方程**是所有 RL 算法的递归根基——「当前价值 = 即时奖励 + 折扣后的后继价值」。Q-Learning/DQN/PPO 都是在不同近似下求解贝尔曼方程。

**最优性**：最优价值函数 `V*(s) = max_π V^π(s)`，最优策略 `π*(s) = argmax_a Q*(s,a)`。

### 探索 vs 利用困境

智能体面临两难：**利用（exploit）**当前知识选最优动作（短期回报高但可能陷局部最优），还是**探索（explore）**新动作（短期可能差但可能发现更好的）。常见策略：

| 策略 | 机制 | 适用 |
| --- | --- | --- |
| **ε-greedy** | ε 概率随机探索，否则贪心 | 通用、简单、Q-Learning/DQN 默认 |
| **Softmax/Boltzmann** | 按 Q 值 softmax 采样 | 平滑探索 |
| **UCB（置信上界）** | 选 Q + 置信上界最大者 | 多臂老虎机理论保证 |
| **熵正则（SAC）** | 在目标加 +α·H(π) 鼓励随机 | 连续动作 SOTA |
| **好奇心驱动** | 对预测误差大的状态给奖励 | 稀疏奖励环境 |

> ε 通常从 1.0 衰减到 0.05——前期多探索，后期多利用。

## 算法谱系深析

### Tabular RL（表格法，小状态空间）

状态空间小（如 4x4 网格）时用表存所有 `Q(s,a)`，理论完备。

| 算法 | 类型 | 特点 |
| --- | --- | --- |
| **Q-Learning** | off-policy TD | 用 max 估计，乐观，简单有效 |
| **SARSA** | on-policy TD | 用实际动作，安全，考虑探索风险 |
| **Expected SARSA** | on-policy | 用期望值替代 SARSA 的采样，方差更低 |
| **蒙特卡洛（MC）** | on-policy/off-policy | 需完整回合才更新，无偏但方差大 |

### 深度强化学习（DRL）

状态空间大（如棋盘 10^47、像素 84x84x4）时用神经网络近似价值/策略。

#### 基于价值（Value-Based）

**DQN 系列**（离散动作）：

- **DQN（2015）**：经验回放 + 目标网络，攻克 Atari
- **Double DQN**：用主网络选动作、目标网络估值，缓解 Q 值过高估计
- **Dueling DQN**：分解 Q(s,a) = V(s) + A(s,a)，学状态价值与动作优势分离
- **Rainbow DQN**：六大改进集成（Double/Dueling/Prioritized Replay/多步/n-step/分布型/噪声网络）

#### 基于策略（Policy-Based）

**策略梯度**（Policy Gradient）直接对策略 `π(a|s;θ)` 求梯度：

```text
∇J(θ) = E_τ~π[ ∇_θ log π(a_t|s_t;θ) · G_t ]
```

**REINFORCE**（VPG，Vanilla Policy Gradient）：蒙特卡洛策略梯度，方差大需基线（baseline）降低。

**TRPO（Trust Region Policy Optimization）**：用 KL 散度约束限制策略更新（信任域），理论保证单调改进，但实现复杂（二阶优化）。

#### Actor-Critic（结合两者）

| 算法 | 类型 | 动作空间 | 特点 |
| --- | --- | --- | --- |
| **A3C/A2C** | on-policy | 离散/连续 | 异步/同步 Actor-Critic，并行采样 |
| **PPO** | on-policy | 离散/连续 | clipped objective，稳定易调，**RLHF/通用首选** |
| **DDPG** | off-policy | 连续 | 确定性策略梯度，DQN 思路用于连续动作 |
| **TD3** | off-policy | 连续 | DDPG 改进——双 Q 网络 + 延迟更新 + 目标策略平滑 |
| **SAC** | off-policy | 连续 | 最大熵 RL，熵正则鼓励探索，**连续动作 SOTA** |

#### PPO 深析

PPO 是 OpenAI 默认算法，因稳定、易调、效果好成为工业主流。

**核心目标**：clipped surrogate objective，限制新旧策略的概率比 `r_t(θ) = π_new(a|s)/π_old(a|s)` 到 `[1-ε, 1+ε]`（ε=0.2）：

```text
L_CLIP(θ) = E[ min( r_t(θ)·A_t, clip(r_t(θ), 1-ε, 1+ε)·A_t ) ]
```

**为什么 clip**：策略梯度无约束时单步可能破坏策略（一步更新跳到完全不同的策略）。clip 防止概率比过大——若新策略已远好（r > 1+ε 且 A>0），不再额外奖励；若新策略远差（r < 1-ε 且 A<0），不再额外惩罚。这是「足够好就停」的保守哲学。

**完整 PPO 损失**：

```text
L = L_CLIP - c1·L_VF + c2·H(π)
    策略clip - 价值函数MSE + 熵奖励（鼓励探索）
```

**典型超参**：ε=0.2、clip 范围 `[0.8, 1.2]`、γ=0.99、GAE λ=0.95、多个 epoch 复用同一批数据（on-policy 内小批量更新）。

#### SAC 深析（连续动作 SOTA）

Soft Actor-Critic 用**最大熵强化学习**——目标从「最大化回报」变为「最大化回报 + 熵」：

```text
J(π) = E[ Σ_t (R_t + α·H(π(·|s_t))) ]
```

`α·H(π)` 鼓励策略保持随机性（探索），避免过早收敛到次优确定策略。`α` 可自动调节（自适应温度）。三大特点：off-policy（样本高效）、最大熵（探索强）、随机策略（抗干扰）。

> SAC 是连续动作空间（机器人、机械臂）的事实标准；离散动作用 DQN/Rainbow；通用/RLHF 用 PPO。

## RLHF 三阶段详解

RLHF（Reinforcement Learning from Human Feedback，基于人类反馈的强化学习）是 ChatGPT、GPT-4、Claude 对齐人类偏好的核心技术。三阶段：

### 阶段 1：监督微调（SFT）

用人工编写的「指令-回复」对微调预训练语言模型，让模型学会「按指令回答」。

```text
输入：prompt（如「用三句话解释量子力学」）
目标：人工写的高质量回复
损失：标准的交叉熵（监督学习）
```

输出：一个能回答指令但风格/质量不一定符合偏好的模型。

### 阶段 2：奖励模型（Reward Model）训练

让人类标注员对同一 prompt 的多个回复排序（A > B > C），训练一个「奖励模型」给回复打分。

```text
数据：同一 prompt 的多个回复两两对比（preference pairs）
模型：RM(prompt, response) → scalar score
损失：Bradley-Terry 偏好模型
  L = -log σ(r(chosen) - r(rejected))
目标：chosen（更好）的回复得分高于 rejected（更差）
```

奖励模型通常是 SFT 模型去掉最后的 LM head、换成一个输出标量的回归头。常用排序系统（如 Elo）把多回复排序转为标量。

### 阶段 3：PPO 优化

用奖励模型的分数作为 RL 奖励，PPO 优化 SFT 模型。关键创新是 **KL 惩罚**——防止优化后模型偏离原始 SFT 模型太远（否则会输出 reward hacking 的乱码骗高分）。

```text
奖励 = r_RM(prompt, response) - β·KL(π_new || π_SFT)
                                  ↑ KL 散度惩罚
```

- `r_RM`：奖励模型对生成回复的打分
- `KL(π_new || π_SFT)`：新策略与原 SFT 策略的 KL 散度，惩罚偏离
- `β`：KL 惩罚强度（也可用早停替代）

> 没有 KL 惩罚，模型会输出「奖励模型给高分但人类读不懂」的乱码（reward hacking）。这是 RLHF 稳定的关键。

**为什么用 PPO 而非 SAC**：LLM 训练中稳定性比样本效率更重要（一次错误更新可能毁掉模型），PPO 的 on-policy + clip 特性更可控。

### RLHF 变体

- **RLAIF（AI Feedback）**：用更强的模型（如 GPT-4）替代人类标注偏好，降低标注成本
- **DPO（Direct Preference Optimization）**：跳过奖励模型，直接用偏好数据微调，数学等价于 RLHF 但更简单稳定
- **Constitutional AI**：Anthropic 的方法，让模型按「宪法」自我批评和修正

## 反模式（生产坑）

1. **奖励函数钻空子（reward hacking）**：智能体找到拿高分却不解决任务的策略（赛车倒跑刷圈数）。应对：精心设计奖励 shaping、加约束、RLHF 引入人类偏好校准
2. **PPO 不加 KL 惩罚做 RLHF**：模型输出乱码骗奖励模型拿高分。应对：必须加 `β·KL(π||π_ref)` 或早停
3. **DQN 不用经验回放/目标网络**：样本时序相关导致训练发散。应对：经验回放 + 目标网络同步是 DQN 标配
4. **SAC 不调 α（温度）**：固定 α 在不同任务表现差异巨大。应对：用自适应 α（按目标熵自动调节）
5. **模拟器训练直接迁移真实环境**：Sim-to-Real Gap 导致策略失效。应对：域随机化（domain randomization）、渐进迁移、真实环境微调

## 下一步

- [参考](./reference.md)：算法选型决策表 + API 速查 + 经典环境 + 官方资源
