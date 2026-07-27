---
layout: doc
---

# 循环神经网络（RNN）

循环神经网络（Recurrent Neural Network，RNN）是专为**序列数据**（文本、语音、时间序列、视频）设计的神经网络架构，核心思想是在时间步之间引入**隐藏状态（hidden state）**作为记忆，把过去的信息压缩成一个向量传递到当前时刻，从而建模「当前输出依赖历史上下文」的时序依赖。最朴素的 RNN 在每个时间步执行 `h_t = tanh(W_h·h_{t-1} + W_x·x_t + b)`，把新输入与上一时刻隐藏状态融合成新状态。但朴素 RNN 在反向传播时会沿时间展开（BPTT，Backpropagation Through Time），梯度连乘导致两个致命问题：**梯度消失**（连乘小于 1，长距离梯度归零，无法学习远距离依赖）与**梯度爆炸**（连乘大于 1，梯度发散为 NaN）。为破解梯度消失，学界提出**带门控机制的变体**——**LSTM**（长短期记忆网络）用遗忘门、输入门、输出门三道门控 + 独立的细胞状态（cell state）让信息长距离无衰减流动；**GRU**（门控循环单元）把 LSTM 的三门简化为更新门和重置门，合并细胞状态与隐藏状态，参数更少、速度更快且效果相当。在此基础上，**双向 RNN**（BiRNN）让序列每个位置同时看到左右两侧上下文，提升表示质量；**Seq2Seq**（编码器-解码器架构）把变长输入序列编码成固定向量再解码成变长输出，是机器翻译的开山范式，其改进催生了**Attention 机制**的雏形——让解码器动态关注编码器的不同位置而非依赖单一向量。然而 RNN 家族的根本缺陷在于**串行计算**（无法并行处理序列）与**长距离建模仍偏弱**，最终被完全基于 Attention 的 **Transformer** 取代。本叶聚焦 RNN 系列及其门控变体、为何被取代的工程动因；Transformer 是独立叶，本叶不展开。信源 cs224n（NLP 深度学习课程）。

## 评价

**优点**

- **天然适配变长序列**：通过时间步展开处理任意长度输入，无需固定尺寸，文本/语音/时序通用
- **参数跨时间步共享**：同一组权重在每个时间步复用，参数效率高、训练数据利用率高
- **门控变体可学长程依赖**：LSTM/GRU 的细胞状态让信息跨越数百步流动，缓解朴素 RNN 的梯度消失
- **双向 RNN 捕获全局上下文**：每个位置同时聚合左右信息，表示质量优于单向
- **Seq2Seq 框架统一了变长到变长映射**：机器翻译、摘要、对话的通用范式，是 Attention 思想的孵化器
- **理论与实现成熟**：从 cs224n 课程到 PyTorch `nn.LSTM`/`nn.GRU`，教学与工程链路完整

**缺点**

- **梯度消失/爆炸**：朴素 RNN 无法学习超过约 20 步的依赖，需 LSTM/GRU + 梯度裁剪缓解
- **串行计算无法并行**：每个时间步依赖前一步结果，训练速度远慢于可并行的 Transformer，长序列尤其瓶颈
- **长距离建模仍弱**：即便有门控，信息需逐步传递，远距离信号仍会衰减，不如 Attention 直接「直连」任意两位置
- **固定长度的编码瓶颈**：基础 Seq2Seq 把整个输入序列压成单一向量，长输入信息丢失严重（Attention 正是为此而生）
- **超参敏感**：隐藏维度、层数、梯度裁剪阈值、dropout 位置需反复调，训练不稳定
- **已被 Transformer 取代**：2017 年后 NLP 主力任务（翻译、问答、生成）几乎全部转向 Transformer，RNN 沦为边缘选择或轻量任务备选

## 文档地址

- [cs224n 自然语言处理与深度学习课程](https://web.stanford.edu/class/cs224n/)
- [Understanding LSTM Networks（Chris Olah）](https://colah.github.io/posts/2015-08-Understanding-LSTMs/)
- [PyTorch RNN/LSTM 文档](https://docs.pytorch.org/docs/stable/generated/torch.nn.LSTM.html)
- [The Illustrated Guide to Recurrent Neural Networks（Jay Alammar）](https://www.illustratedguides.ai/the-illustrated-guide-to-recurrent-neural-networks)
- [Jurafsky & Martin SLP3 第 9-10 章（RNN 与机器翻译）](https://web.stanford.edu/~jurafsky/slp3/)

## GitHub地址

[pytorch/pytorch](https://github.com/pytorch/pytorch)

## 幻灯片地址

<a href="/SlideStack/rnn-slide/" target="_blank">循环神经网络（RNN）</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=PENDING" target="_blank" rel="noopener noreferrer">循环神经网络（RNN）测试题</a>
