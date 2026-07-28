---
layout: doc
---

# PaddlePaddle

PaddlePaddle（中文名「飞桨」）是百度主导、中国唯一自主研发并开源的工业级深度学习平台。它的核心定位是「源于产业实践」——框架本身与一套**产业模型库**深度绑定：**PaddleOCR**（86k+ star 的多语种 OCR 工具箱，PP-OCR 系列）、**PaddleNLP**（NLP 库，承载百度自研的 **ERNIE** 大模型家族与 ERNIEKit 工业开发套件）、**PaddleDetection**（PP-YOLOE 等目标检测）、**PaddleSeg**（图像分割）等，这些套件开箱即用，是飞桨区别于其他框架的最大特色。框架层面，飞桨 3.x 以**动态图为主要开发模式**（与 PyTorch 一致），同时提供**动静统一**（动态图与静态图产出一致）与**自动并行**（只需少量张量切分标注即可分布式训练）的 3.x 新特性。**分布式训练**走 Fleet API（`paddle.distributed.fleet`），覆盖数据并行、模型并行、混合并行。**推理部署**有完整工具链：Paddle Inference（服务端 GPU/CPU，含 TensorRT 集成）、Paddle Lite（移动端/边缘/IoT）、Paddle Serving（在线微服务）、Paddle2ONNX（转 ONNX）。飞桨另一独特优势是**国产化硬件适配**——对昆仑芯 XPU、华为昇腾 NPU（CANN）、海光 DCU、寒武纪 MLU 等国产芯片有一等支持，这是国内信创场景的刚需。截至 2026 年 7 月，飞桨框架版本为 **3.3**（PyPI `paddlepaddle`，2026 年 3 月最近发布）。信源 paddlepaddle.org.cn。

## 评价

**优点**

- **产业模型库开箱即用**：PaddleOCR/PaddleNLP/PaddleDetection 等套件直接可用，省去从零搭建，是企业落地最快的路径
- **ERNIE 大模型原生**：百度自研 ERNIE 系列（含 ERNIE 4.5、轻量 0.3B 等）首发于 PaddleNLP，中文场景表现强
- **国产硬件一等支持**：昆仑芯/昇腾/海光/寒武纪等国产芯片适配成熟，信创、政企、金融场景刚需且几乎无替代
- **动静统一与自动并行**：3.x 动静产出一致，自动并行降低分布式门槛（少量张量切分标注即可）
- **完整部署工具链**：训练→Paddle Inference（服务端）/ Paddle Lite（端侧）/ Paddle Serving（在线）一条龙，无需拼凑第三方
- **分布式 Fleet API 成熟**：大规模推荐、搜索等百度内部场景锤炼过的分布式能力（数据/模型/混合并行）

**缺点**

- **国际生态远小于 PyTorch**：顶会论文代码、Hugging Face 权重多以 PyTorch 为一等公民，飞桨适配常滞后或缺失
- **动态图曾长期为次选项**：2.x 时代静态图优先、动态图后补，3.x 才以动态图为主，历史 API 包袱重
- **文档与社区以中文为主**：国际开发者门槛高，英文资料密度不及 PyTorch/JAX
- **创新跟随而非引领**：多数新架构（Transformer 变体、扩散模型）先在 PyTorch 落地，飞桨跟进
- **调试体验与工具链打磨**：profiler、可视化、错误信息等周边工具成熟度不及 PyTorch 生态

## 文档地址

- [飞桨官方文档（paddlepaddle.org.cn）](https://www.paddlepaddle.org.cn/)
- [Paddle 3.x 文档](https://www.paddlepaddle.org.cn/documentation/docs/zh/develop/)
- [PaddleOCR 文档](https://github.com/PaddlePaddle/PaddleOCR)
- [PaddleNLP 文档](https://github.com/PaddlePaddle/PaddleNLP)
- [Paddle Inference 部署指南](https://www.paddlepaddle.org.cn/documentation/docs/zh/guides/infer/infer/inference.html)

## GitHub地址

[PaddlePaddle/Paddle](https://github.com/PaddlePaddle/Paddle)（24k+ star）

## 幻灯片地址

<a href="/SlideStack/paddlepaddle-slide/" target="_blank">PaddlePaddle</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=PaddlePaddle" target="_blank" rel="noopener noreferrer">PaddlePaddle 测试题</a>
