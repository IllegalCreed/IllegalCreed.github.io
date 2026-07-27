---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 OpenAI Spinning Up + Sutton & Barto 第二版 + Stable-Baselines3/Hugging Face TRL 文档整理

## 速查

- **算法选型一句话**：离散动作→**DQN/Rainbow**；连续动作→**SAC（首选）/TD3**；通用稳定→**PPO**；表格小状态→**Q-Learning/SARSA**；RLHF→**PPO + KL 惩罚**
- **主流库**：Stable-Baselines3（PPO/SAC/DQN 工业实现）/ Hugging Face TRL（RLHF/DPO/PPO 训练 LLM）/ Ray RLlib（分布式）/ OpenAI Spinning Up（教学）
- **on-policy 算法**：SARSA / REINFORCE / A2C / TRPO / **PPO**
- **off-policy 算法**：Q-Learning / DQN / DDPG / TD3 / **SAC**
- **actor-critic 算法**：A2C / A3C / PPO / DDPG / TD3 / SAC
- **核心库 import**：`stable_baselines3`（PPO/SAC/DQN）/ `trl`（RLHF/DPO）/ `gymnasium`（环境，原 OpenAI Gym）
- **RLHF 库**：`trl` 的 `PPOTrainer` / `DPOTrainer` / `SFTTrainer` / `RewardTrainer`
- **经典环境**：`gymnasium.make('CartPole-v1')`（入门）/ `Atari`（DQN 经典）/ `MuJoCo`（连续动作 SOTA 测评）
- **核心超参**：γ=0.99（折扣）/ α=0.001（学习率）/ ε=0.2（PPO clip）/ batch_size=64 / replay_size=10^6

## 算法选型决策表

| 场景 | 首选算法 | 备选 | 理由 |
| --- | --- | --- | --- |
| **离散动作（Atari/棋盘）** | DQN / Rainbow | PPO（离散版） | Q-learning 系列离散动作成熟 |
| **连续动作（机器人/控制）** | SAC | TD3 / PPO | 最大熵 RL，探索强，SOTA |
| **通用稳定/RLHF** | PPO | A2C | clipped 稳定，易调 |
| **表格小状态（教学）** | Q-Learning | SARSA | 表格法，理论完备 |
| **LLM 对齐（人类偏好）** | RLHF（PPO） | DPO / RLAIF | ChatGPT 标准，PPO + KL |
| **LLM 对齐（无奖励模型）** | DPO | — | 跳过 RM，直接偏好优化 |
| **超大规模分布式** | Ray RLlib | Sample Factory | 支持数千 worker |
| **部分可观测（POMDP）** | DRQN / RNN-PPO | — | 用 RNN 估计信念状态 |

## RL 算法谱系速查

| 算法 | 类型 | 动作空间 | 策略类型 | 代表应用 |
| --- | --- | --- | --- | --- |
| Q-Learning | off-policy TD | 离散 | — | 表格 RL 基础 |
| SARSA | on-policy TD | 离散 | — | 安全环境（悬崖） |
| DQN | off-policy value | 离散 | — | Atari 2015 |
| Double/Dueling DQN | off-policy value | 离散 | — | DQN 改进 |
| Rainbow | off-policy value | 离散 | — | DQN 集大成 |
| REINFORCE/VPG | on-policy PG | 离散/连续 | 随机 | 策略梯度基础 |
| TRPO | on-policy AC | 离散/连续 | 随机 | 信任域，理论强 |
| A2C/A3C | on-policy AC | 离散/连续 | 随机 | 同步/异步并行 |
| **PPO** | on-policy AC | 离散/连续 | 随机 | **通用首选/RLHF** |
| DDPG | off-policy AC | 连续 | 确定 | 连续 DQN |
| TD3 | off-policy AC | 连续 | 确定 | DDPG 改进（双 Q） |
| **SAC** | off-policy AC | 连续 | 随机 | **连续 SOTA** |

## 核心 API 速查（Stable-Baselines3）

```python
from stable_baselines3 import PPO, SAC, DQN
from stable_baselines3.common.evaluation import evaluate_policy
import gymnasium as gym

# 1. 创建环境
env = gym.make('CartPole-v1')

# 2. 实例化算法（统一接口）
model = PPO('MlpPolicy', env, verbose=1,
            learning_rate=3e-4, gamma=0.99, n_steps=2048,
            batch_size=64, clip_range=0.2)
# 或：
model = SAC('MlpPolicy', env, verbose=1)  # 连续动作
model = DQN('MlpPolicy', env, verbose=1)  # 离散动作

# 3. 训练
model.learn(total_timesteps=100_000)

# 4. 评估
mean_reward, std_reward = evaluate_policy(model, env, n_eval_episodes=10)

# 5. 使用/保存
obs, _ = env.reset()
action, _ = model.predict(obs)
model.save('ppo_cartpole')
```

## RLHF API 速查（Hugging Face TRL）

```python
from trl import SFTTrainer, RewardTrainer, PPOTrainer, DPOTrainer

# 阶段 1：SFT 监督微调
sft_trainer = SFTTrainer(model=base_model, train_dataset=sft_dataset, ...)
sft_trainer.train()

# 阶段 2：奖励模型训练
reward_trainer = RewardTrainer(model=reward_model, train_dataset=preference_dataset)
reward_trainer.train()

# 阶段 3：PPO 优化（带 KL 惩罚）
ppo_trainer = PPOTrainer(model=sft_model, reward_model=reward_model, ...)
for batch in dataloader:
    response = generate(sft_model, batch['prompt'])
    reward = reward_model(batch['prompt'], response)
    ppo_trainer.step(batch['prompt'], response, reward)  # 内含 KL 惩罚

# 替代：DPO（跳过奖励模型，直接偏好优化）
dpo_trainer = DPOTrainer(model=sft_model, train_dataset=preference_dataset)
dpo_trainer.train()
```

## 算法核心更新式

```python
# Q-Learning（off-policy）
Q[s,a] += alpha * (r + gamma * max(Q[s_next]) - Q[s,a])

# SARSA（on-policy）
Q[s,a] += alpha * (r + gamma * Q[s_next, a_next] - Q[s,a])

# 策略梯度（REINFORCE）
loss = -log_prob(action) * advantage

# PPO clipped objective
ratio = exp(log_pi_new - log_pi_old)
loss = -min(ratio * adv, clip(ratio, 1-0.2, 1+0.2) * adv)

# SAC（最大熵 RL）
loss = -E[r + gamma * (Q_target(s') - alpha * log_pi(a'|s'))]

# RLHF 奖励（带 KL 惩罚）
reward_total = r_RM(response) - beta * KL(pi_new || pi_SFT)
```

## 经典环境（Gymnasium，原 OpenAI Gym）

```python
import gymnasium as gym

# 经典控制（入门）
env = gym.make('CartPole-v1')       # 平衡杆，离散动作
env = gym.make('Pendulum-v1')       # 摆锤，连续动作（SAC/TD3 测评）
env = gym.make('MountainCar-v0')    # 爬坡，离散

# Atari（DQN 经典，需 ale-py）
env = gym.make('ALE/Breakout-v5')

# MuJoCo（连续动作 SOTA 测评，需 mujoco）
env = gym.make('HalfCheetah-v4')
env = gym.make('Humanoid-v4')

# 标准接口
obs, info = env.reset(seed=42)
action = model.predict(obs)
obs, reward, terminated, truncated, info = env.step(action)
```

> OpenAI Gym 2022 年起维护转移至 Farama Foundation 的 Gymnasium，API 基本兼容（step 返回 5 元组而非 4 元组，新增 truncated）。

## RLHF 工具链对比

| 工具 | 用途 | 特点 |
| --- | --- | --- |
| **TRL（Hugging Face）** | RLHF/DPO/SFT 训练 LLM | 集成 transformers，业界主流 |
| **DeepSpeed-Chat** | 大规模 RLHF | 微软，多 GPU 分布式 |
| **TRLX** | RLHF 训练 | 原 CarperAI，TRL 已吸收 |
| **Anthropic Constitutional AI** | 自我对齐 | 模型按「宪法」自我批评 |

## 核心超参速查

| 超参 | 典型值 | 作用 |
| --- | --- | --- |
| γ（折扣因子） | 0.99 | 权衡眼前 vs 长远，越大越远视 |
| α/lr（学习率） | 1e-4 ~ 3e-4 | 梯度步长 |
| ε（PPO clip） | 0.2 | 策略更新幅度限制 |
| ε（explore） | 1.0 → 0.05 | 探索率衰减 |
| batch_size | 64-256 | 每次更新样本数 |
| replay_size | 10^6 | 经验回放缓冲区大小 |
| target_update | 每 1000 步 | DQN 目标网络同步频率 |
| α（SAC 温度） | 自适应 | 熵正则强度 |
| β（RLHF KL） | 0.01-0.5 | KL 惩罚强度 |

## 官方资源

- [OpenAI Spinning Up（RL 经典入门）](https://spinningup.openai.com/en/latest/)（算法列表 + 术语表 + 实现）
- [Sutton & Barto《强化学习》第二版 PDF](http://incompleteideas.net/book/RLbook2020.pdf)（理论权威）
- [Hugging Face Deep RL Course](https://huggingface.co/learn/deep-rl-course/unit0/introduction)
- [Stable-Baselines3 文档](https://stable-baselines3.readthedocs.io/)（PPO/SAC/DQN 工业实现）
- [Hugging Face TRL 文档](https://huggingface.co/docs/trl/)（RLHF/DPO/SFT 训练 LLM）
- [Hugging Face RLHF 博客](https://huggingface.co/blog/rlhf)（三阶段详解）
- [Gymnasium 文档](https://gymnasium.farama.io/)（环境库，原 OpenAI Gym）
- [Ray RLlib 文档](https://docs.ray.io/en/latest/rllib/)（分布式 RL）
