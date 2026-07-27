---
layout: doc
---

# 强化学习

强化学习（Reinforcement Learning, RL）是机器学习第三大范式：智能体（Agent）通过与环境（Environment）交互、试错，依据环境反馈的奖励（Reward）信号学习最优行为策略（Policy），目标是最大化长期累计回报。它的数学基础是**马尔可夫决策过程（MDP）**——用五元组 `(S, A, P, R, γ)` 描述状态转移，其中状态 `s` 是世界的完整描述、动作 `a` 是智能体的选择、转移 `P(s'|s,a)` 是环境如何响应、奖励 `r` 是即时反馈、`γ` 是折扣因子（权衡眼前 vs 长远）。核心概念包括价值函数 `V(s)`（状态好坏）、动作价值 `Q(s,a)`（在某状态做某动作的好坏）、策略 `π`（决策规则），三者通过**贝尔曼方程**自洽关联。RL 算法分三大阵营：**基于价值**（Q-Learning/DQN 学 Q 函数）、**基于策略**（Policy Gradient 直接优化策略）、**Actor-Critic**（两者结合，如 PPO/SAC）。深度强化学习（DRL）用神经网络近似价值/策略函数，攻克了 Atari 游戏、围棋（AlphaGo）、星际争霸等复杂任务。**RLHF（基于人类反馈的强化学习）**是 ChatGPT 对齐的核心技术，三阶段（SFT → 奖励模型 → PPO 微调）让大语言模型与人类偏好对齐，是当前 LLM 训练事实标准。OpenAI Spinning Up 是经典入门教材，Sutton & Barto《Reinforcement Learning: An Introduction》是理论权威。

## 评价

**优点**

- **能学超人类策略**：无需人类示范，靠奖励试错能发现人类想不到的策略——AlphaGo 的第 37 手、AlphaStar 的战术都是涌现而非编程
- **处理序列决策**：天然适配延迟奖励场景（围棋要下 200 手才有胜负），监督学习无法处理「当前动作影响未来」的长程依赖
- **无需标签只需奖励**：定义奖励函数比标注数据便宜得多（游戏胜负、机器人距离目标），适合模拟器充足的领域
- **自适应动态环境**：在线学习、持续与环境交互，能适应非平稳环境（推荐系统、交易）
- **统一框架覆盖广**：MDP 形式化覆盖游戏、机器人、推荐、广告、资源调度，理论一致
- **RLHF 开启对齐新范式**：解决了「LLM 输出有用且无害」的核心难题，成为 ChatGPT/GPT-4/Claude 的标准对齐技术

**缺点**

- **样本效率极低**：DRL 常需千万次交互才收敛（AlphaGo 自对弈数百万局），真实环境（机器人、医疗）成本极高，模拟器是刚需
- **奖励函数难设计**：奖励 shaping 不当会导致 reward hacking——智能体钻空子拿高分却不解决任务（如赛车游戏倒着跑刷圈数）
- **训练不稳定难复现**：超参敏感、随机种子影响巨大、同一算法多次跑结果可能天差地别，PPO/SAC 都需精调
- **探索 vs 利用困境**：探索不足陷局部最优，探索过多浪费样本，epsilon-greedy/熵正则/好奇心机制都是权衡手段，无银弹
- **模拟到现实鸿沟（Sim-to-Real Gap）**：模拟器训练的策略迁移到真实环境常失效（物理摩擦、传感器噪声未建模），机器人落地难
- **信用分配难题**：长序列中哪个动作导致了最终结果？蒙特卡洛需完整回合、TD 折中即时，复杂任务归因极难
- **算力门槛极高**：大规模 RLHF 训练需数百张 GPU/TPU 跑数周，只有大厂能负担

## 文档地址

- [OpenAI Spinning Up（RL 经典入门）](https://spinningup.openai.com/en/latest/)
- [Sutton & Barto《强化学习》第二版（在线全文）](http://incompleteideas.net/book/RLbook2020.pdf)
- [Hugging Face Deep RL Course](https://huggingface.co/learn/deep-rl-course/unit0/introduction)
- [Stable-Baselines3 文档（PPO/SAC 实现）](https://stable-baselines3.readthedocs.io/)
- [Hugging Face TRL（RLHF 工具）](https://huggingface.co/docs/trl/)

## GitHub地址

- [openai/spinningup](https://github.com/openai/spinningup)
- [DLR-RM/stable-baselines3](https://github.com/DLR-RM/stable-baselines3)
- [huggingface/trl](https://github.com/huggingface/trl)（RLHF/RLAIF 训练库）

## 幻灯片地址

<a href="/SlideStack/reinforcement-learning-slide/" target="_blank">强化学习</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=PENDING" target="_blank" rel="noopener noreferrer">强化学习测试题</a>
