---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 PaddlePaddle 3.3 官方文档（paddlepaddle.org.cn 飞桨 3.x 指南 / PaddleOCR / PaddleNLP）编写，对照当前稳定行为

## 速查

- **安装**：`pip install paddlepaddle`（CPU）；GPU 用 `pip install paddlepaddle-gpu`（按 CUDA 版本选索引）
- **核心张量**：`paddle.to_tensor(data)` / `paddle.randn/ones/zeros(shape)`，动态图为主
- **网络**：继承 `paddle.nn.Layer`，`__init__` 定义层、`forward(x)` 写前向（与 PyTorch 高度相似）
- **训练循环**：`forward` → `loss.backward()` → `optimizer.step()` → `optimizer.clear_grad()`（注意是 clear_grad 不是 zero_grad）
- **动态图**：3.x 默认且推荐；静态图 `paddle.static` 用于部署/性能优化（动静产出一致）
- **分布式**：`paddle.distributed.fleet`（Fleet API，数据/模型/混合并行）；3.x 新增「自动并行」
- **OCR**：`from paddleocr import PaddleOCR; ocr = PaddleOCR(); result = ocr.ocr(img)`
- **NLP/ERNIE**：`from paddlenlp import transformers`（ERNIE 系列、与 HF transformers 接口对齐）
- **推理部署**：Paddle Inference（服务端）、Paddle Lite（端侧）、Paddle Serving（在线）、Paddle2ONNX
- **国产硬件**：昆仑芯 XPU / 昇腾 NPU / 海光 DCU / 寒武纪 MLU
- **版本**：框架 **3.3**（PyPI paddlepaddle，2026 年）

## 安装

```bash
# CPU 版
pip install paddlepaddle

# GPU 版（NVIDIA，按 CUDA 版本从官网选 wheel 索引）
python -m pip install paddlepaddle-gpu==3.3.0 -f https://www.paddlepaddle.org.cn/whl/linux/mkl/avx/stable.html

# 验证
python -c "import paddle; paddle.utils.run_check()"
# 输出 "PaddlePaddle is installed successfully!" 即 OK
```

> 国产硬件版本通常需从对应厂商获取专用 wheel（如昇腾走 CANN 适配的 paddle-npu，昆仑芯走 paddle-xpu）。

## 张量与动态图

飞桨 3.x 以**动态图**为默认开发模式，API 风格与 PyTorch 高度相似，降低学习成本：

```python
import paddle

x = paddle.to_tensor([[1.0, 2.0], [3.0, 4.0]])   # 从数据建张量
y = paddle.randn([2, 2])                          # 随机张量
z = x + y                                         # 逐元素加（自动建图）
z = x @ y                                         # 矩阵乘
print(x.shape, x.dtype, x.place)                  # [2, 2] float32 Place(cpu)

# 设备搬运
if paddle.is_compiled_with_cuda():
    x = x.cuda()                                  # 或 paddle.device.set_device('gpu')
```

- `paddle.to_tensor` / `paddle.Tensor` 是核心容器
- 与 NumPy 互转：`x.numpy()`（→ ndarray）、`paddle.to_tensor(arr)`（← ndarray）
- 梯度：`x.stop_gradient = False` 开始追踪（默认叶子为 True 即不追踪）

## 第一个模型：paddle.nn.Layer

```python
import paddle
import paddle.nn as nn

class MLP(nn.Layer):
    def __init__(self, in_feat, out_feat):
        super().__init__()
        self.fc1 = nn.Linear(in_feat, 64)
        self.fc2 = nn.Linear(64, out_feat)

    def forward(self, x):
        return self.fc2(paddle.relu(self.fc1(x)))

model = MLP(784, 10)
if paddle.is_compiled_with_cuda():
    model = model.cuda()

logits = model(paddle.randn([32, 784]))           # 直接调用（经 __call__）
```

- 继承 `paddle.nn.Layer`（对应 PyTorch 的 `nn.Module`）
- `sublayers()` / `parameters()` 遍历子层与参数（对应 PyTorch 的 `children/parameters`）
- 输入是 logits，损失函数做归一化

## 训练循环

```python
loss_fn = nn.CrossEntropyLoss()
optimizer = paddle.optimizer.Adam(parameters=model.parameters(), learning_rate=1e-3)

model.train()                                     # 训练模式
for x, y in train_loader:
    if paddle.is_compiled_with_cuda():
        x, y = x.cuda(), y.cuda()

    logits = model(x)                             # 前向
    loss = loss_fn(logits, y)
    loss.backward()                               # 自动微分反向
    optimizer.step()                              # 更新参数
    optimizer.clear_grad()                        # 清梯度（注意：是 clear_grad，不是 zero_grad！）

model.eval()                                      # 评估模式
with paddle.no_grad():                            # 推理不建图
    pred = model(x).argmax(axis=1)
```

> **关键差异**：飞桨清梯度是 `optimizer.clear_grad()`，PyTorch 是 `optimizer.zero_grad()`。这是迁移时最易踩的命名差异。

## 保存与加载

```python
# 推荐方式：存参数
paddle.save(model.state_dict(), 'mlp.pdparams')
model_load = MLP(784, 10)
model_load.set_state_dict(paddle.load('mlp.pdparams'))
model_load.eval()

# 含优化器状态的断点续训
paddle.save({
    'model': model.state_dict(),
    'opt': optimizer.state_dict(),
    'epoch': epoch,
}, 'ckpt.pdparams')
```

- 参数文件后缀约定 `.pdparams`，优化器状态 `.pdopt`
- 部署需进一步转成推理模型（见下「部署」）

## PaddleOCR：一行 OCR

飞桨生态最出圈的产业套件，PP-OCR 系列支持 100+ 语言：

```python
from paddleocr import PaddleOCR

ocr = PaddleOCR(use_angle_cls=True, lang='ch')     # 中文 + 角度分类
result = ocr.ocr('invoice.png', cls=True)
# result: [[ [box], (text, confidence) ], ...]

for line in result[0]:
    print(line[1][0])                              # 识别文本
```

- 支持 PP-OCRv5、表格识别、版面分析、文档解析（JSON/Markdown 输出）
- 轻量模型可在移动端运行（配合 Paddle Lite）
- GitHub 86k+ star，是飞桨国际影响力最大的项目

## PaddleNLP 与 ERNIE

承载百度自研 ERNIE 大模型家族：

```python
from paddlenlp.transformers import AutoTokenizer, AutoModelForCausalLM

tokenizer = AutoTokenizer.from_pretrained('baidu/ERNIE-4.5-0.3B')
model = AutoModelForCausalLM.from_pretrained('baidu/ERNIE-4.5-0.3B')

inputs = tokenizer('你好，飞桨', return_tensors='pd')   # 'pd' = paddle tensor
outputs = model.generate(**inputs)
print(tokenizer.decode(outputs[0]))
```

- ERNIE 4.5 系列（含 0.3B 轻量版到数千亿参数）
- 接口与 Hugging Face transformers 对齐（`AutoTokenizer`/`AutoModel*`），迁移成本低
- 配套 ERNIEKit 工业开发套件（微调、量化、部署）

## 下一步

入门到此覆盖了张量、Layer、训练循环、PaddleOCR/PaddleNLP。下一步见「指南」：

- **动静统一与自动并行**：3.x 如何让动态图与静态图产出一致、自动并行分布式
- **Fleet API**：数据并行、模型并行、混合并行的具体配置
- **部署工具链**：Paddle Inference / Lite / Serving / Paddle2ONNX 的选型
- **国产硬件适配**：昆仑芯/昇腾/海光/寒武纪的接入方式
