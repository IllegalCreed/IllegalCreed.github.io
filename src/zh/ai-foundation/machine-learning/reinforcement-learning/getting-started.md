---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 OpenAI Spinning Up（RL Intro + Key Algorithms）+ Sutton & Barto《Reinforcement Learning》第二版 + Hugging Face RLHF 文档编写，对照当前主流实践

## 速查

- **定义**：智能体（Agent）与环境（Environment）交互，依据奖励（Reward）信号学习策略（Policy）最大化长期累计回报
- **MDP 五元组**：`S`（状态集）/ `A`（动作集）/ `P(s'|s,a)`（转移概率）/ `R(s,a)`（奖励）/ `γ`（折扣因子，0-1，权衡眼前 vs 长远）
- **三大核心函数**：`V^π(s)`（状态价值，按策略 π 从 s 出发的期望回报）/ `Q^π(s,a)`（动作价值，从 s 做 a 再按 π）/ `π(a|s)`（策略，状态到动作的映射）
- **贝尔曼方程**：`V(s) = E[R + γ·V(s')]`，价值 = 即时奖励 + 折扣后继价值，是所有 RL 算法的递归根基
- **三大算法阵营**：**基于价值**（Q-Learning/DQN，学 Q 表/网络）/ **基于策略**（Policy Gradient，直接优化 π）/ **Actor-Critic**（PPO/SAC，两者结合）
- **on-policy vs off-policy**：on-policy（SARSA/PPO）用当前策略采的数据更新当前策略，稳定但样本效率低；off-policy（Q-Learning/DQN/SAC）可用旧数据，样本效率高但有偏差
- **Q-Learning 更新式**：`Q(s,a) ← Q(s,a) + α[r + γ·max_a' Q(s',a') - Q(s,a)]`，off-policy，用 max 估计后继
- **SARSA 更新式**：`Q(s,a) ← Q(s,a) + α[r + γ·Q(s',a') - Q(s,a)]`，on-policy，用实际下一动作 a'
- **DQN 三大创新**：经验回放（experience replay，打破样本相关性）+ 目标网络（target network，稳定训练）+ Q-learning 损失
- **PPO 核心**：on-policy Actor-Critic，clipped surrogate objective 限制策略更新幅度（clip 比率到 `[1-ε, 1+ε]`，ε=0.2），稳定易调，OpenAI 默认算法
- **RLHF 三阶段**：1. SFT 监督微调 → 2. 奖励模型（RM）训练（人类偏好对打分）→ 3. PPO 优化（带 KL 惩罚防漂移），是 ChatGPT 对齐标准
- **折扣因子 γ**：接近 0 重眼前（贪心），接近 1 重长远（远视），常取 0.9-0.99；过大会导致价值发散

## 强化学习是什么

强化学习的「强化」源自行为主义心理学——智能体通过试错获得奖励或惩罚，强化获得奖励的行为、抑制招致惩罚的行为，最终学会在环境中获得最大长期回报。

- **智能体（Agent）**：学习者/决策者（游戏 AI、机器人、推荐器）
- **环境（Environment）**：智能体交互的世界（游戏模拟器、物理引擎、用户群）
- **状态 s ∈ S**：环境的完整描述；观察（observation）是部分可观测时的局部信息
- **动作 a ∈ A**：智能体的选择；动作空间可离散（上下左右）或连续（关节角度）
- **奖励 r ∈ R**：环境的即时数值反馈，「当前世界有多好」
- **回报 G_t**：从时刻 t 起的累计折扣奖励 `G_t = R_{t+1} + γR_{t+2} + γ²R_{t+3} + ...`，RL 优化的目标
- **策略 π(a|s)**：智能体的决策规则，给定状态选动作的概率（随机策略）或确定动作（确定性策略）

> 对比监督学习（有标签 y 直接告诉答案）和无监督学习（无标签发现结构）：RL 没有「正确答案」，只有延迟的奖励信号——智能体要在「现在做这个动作」和「未来可能的好结果」之间建立因果。

### MDP：强化学习的数学语言

马尔可夫决策过程（MDP）用五元组 `(S, A, P, R, γ)` 形式化 RL 环境，核心是**马尔可夫性**——下一步只依赖当前状态和动作，与历史无关（`P(s'|s,a)`，不是 `P(s'|s,a,s_{-1},...)`）。

```text
循环：
1. 智能体在状态 s_t 观察环境
2. 依据策略 π 选动作 a_t ~ π(·|s_t)
3. 环境响应：转移 s_{t+1} ~ P(·|s_t, a_t)，给奖励 r_{t+1} ~ R(s_t, a_t)
4. 智能体收到 r_{t+1} 和 s_{t+1}，更新策略
直到回合结束（terminal）或时间到
```

> 部分可观测 MDP（POMDP）是 MDP 的推广——智能体只能看到观察 `o` 而非完整状态 `s`（如扑克牌看不到对手手牌），需用信念状态或 RNN 估计。

## 第一个 RL：Q-Learning 网格世界

```python
import numpy as np

# Q 表：状态数 × 动作数
n_states, n_actions = 16, 4  # 4x4 网格，上下左右
Q = np.zeros((n_states, n_actions))

alpha, gamma, epsilon = 0.1, 0.95, 0.1  # 学习率/折扣/探索率

for episode in range(1000):
    s = 0  # 起点
    while s != 15:  # 未到终点
        # epsilon-greedy：epsilon 概率随机探索，否则取 Q 最大的动作
        if np.random.random() < epsilon:
            a = np.random.randint(n_actions)
        else:
            a = np.argmax(Q[s])

        # 环境响应（伪代码：实际需对接环境 step）
        s_next, r, done = env_step(s, a)

        # Q-Learning 更新（off-policy，用 max 估计后继）
        td_target = r + gamma * np.max(Q[s_next]) * (not done)
        Q[s, a] += alpha * (td_target - Q[s, a])

        s = s_next
```

> Q-Learning 是 tabular RL 的「Hello World」——状态空间小到能用表存。状态空间一大（如棋盘 10^47）就必须用神经网络近似 Q 函数，这就是 DQN。

## Q-Learning vs SARSA：on-policy 的关键区别

两者都是 TD（时序差分）学习，更新式只差一个细节，但学习行为截然不同：

| 维度 | Q-Learning | SARSA |
| --- | --- | --- |
| **更新式** | `r + γ·max_a' Q(s',a')` | `r + γ·Q(s',a')` |
| **后继动作** | 假设最优 max | 实际执行的动作 a' |
| **策略类型** | off-policy | on-policy |
| **行为策略** | 学习时用 ε-greedy，更新假设未来用贪心 | 学习和更新用同一 ε-greedy |
| **悬崖行走** | 学到最优贴边路径（更新用 max 忽略探索风险） | 学到安全远绕路径（更新考虑实际探索的掉崖风险） |

```python
# SARSA 更新（on-policy，用实际下一动作 a_next）
td_target = r + gamma * Q[s_next, a_next] * (not done)
Q[s, a] += alpha * (td_target - Q[s, a])
```

> **直觉**：Q-Learning 是「乐观主义者」（假设未来能选最优），SARSA 是「现实主义者」（知道未来还得 ε 探索会犯错）。高风险环境（自动驾驶、医疗）SARSA 更安全。

## DQN：深度 Q 网络

状态空间巨大时，用神经网络 `Q(s,a;θ)` 近似 Q 函数。DeepMind 2013/2015 用 DQN 攻克 Atari，开启深度强化学习时代。两大稳定化创新：

1. **经验回放（Experience Replay）**：把交互存成 `(s, a, r, s', done)` 元组到缓冲区，训练时随机采样打破样本时序相关性，且一份数据多次复用
2. **目标网络（Target Network）**：用单独的网络 `Q_target` 算 TD target，每隔 N 步同步 `Q_target ← Q`，避免追逐移动目标导致的震荡发散

```python
# 伪代码：DQN 主循环
replay_buffer = []
for episode in range(n_episodes):
    s = env.reset()
    while not done:
        a = epsilon_greedy(Q_main, s)              # 用主网络选动作
        s_next, r, done = env.step(a)
        replay_buffer.append((s, a, r, s_next, done))

        # 从缓冲区随机采样批次
        batch = random.sample(replay_buffer, 64)
        # 用目标网络算 TD target（稳定训练的关键）
        td_target = r + gamma * Q_target(s_next).max() * (not done)
        loss = mse(Q_main(s, a), td_target)
        Q_main.backward(loss)

    if episode % N == 0:
        Q_target.load_state_dict(Q_main.state_dict())  # 同步目标网络
```

> DQN 是离散动作空间的基石；连续动作空间用 DDPG/TD3/SAC（Actor-Critic）。

## PPO：当前主流的 Actor-Critic

Proximal Policy Optimization（近端策略优化）是 OpenAI 默认算法，因稳定、易调、效果好成为 RLHF 的首选。核心是 clipped surrogate objective——限制新旧策略的比率到 `[1-ε, 1+ε]`（ε=0.2），防止单步更新破坏策略。

```python
# PPO clipped objective（伪代码）
ratio = exp(log_pi_new(a|s) - log_pi_old(a|s))   # 新旧策略概率比
surrogate1 = ratio * advantage
surrogate2 = clip(ratio, 1 - 0.2, 1 + 0.2) * advantage
loss = -min(surrogate1, surrogate2)              # 取下界避免过大更新
```

> PPO 是 on-policy：必须用当前策略采的数据更新当前策略，旧数据不能复用（牺牲样本效率换稳定）。这正是 RLHF 第三阶段用 PPO 而非 SAC 的原因之一（稳定性优先）。

## 下一步

- [指南](./guide-line.md)：算法谱系深析 + PPO/SAC 对比 + RLHF 三阶段详解
- [参考](./reference.md)：算法选型决策表 + API 速查 + 经典环境 + 官方资源
