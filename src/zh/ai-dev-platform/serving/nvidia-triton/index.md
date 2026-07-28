---
layout: doc
---

# NVIDIA Triton

NVIDIA 开源的**多框架推理服务器**（Triton Inference Server），把「同一 GPU 上跑多个模型 + 多种框架 + 动态批处理 + 多协议接入」这件事做成生产级。核心定位：在 CPU/GPU 上托管来自 TensorRT、PyTorch（libtorch）、TensorFlow（SavedModel/GraphDef/Keras）、ONNX Runtime、Python、OpenVINO、FIL、DALI、TensorRT-LLM、vLLM 等后端的模型，通过 HTTP/REST 与 gRPC 对外提供推理服务。其杀手锏是 **Dynamic Batching**（请求到来后动态聚合为更大的 batch 再推理，最大化吞吐）和 **Concurrent Model Execution**（同一 GPU 上多个模型实例并发执行，榨干 SM/CUDA 流）。配置由基于文件系统的 **Model Repository** + 每个模型一份的 `config.pbtxt`（protobuf 文本格式）声明，支持模型版本管理、热加载、模型预热（`model_warmup`）和响应缓存。最新主线对应 NGC 容器 26.06（仓库 v2.70.x）。

## 评价

**优点**

- **多后端统一**：一套服务把 TensorRT / PyTorch / TF / ONNX / Python 全接管，不用为每种框架单独起一套 serving，运维心智模型唯一
- **吞吐优化开箱即用**：Dynamic Batching + Concurrent Model Execution + Response Cache + Model Warmup 四件套是生产级推理服务的标配，配置文件改几个字段就能上
- **协议齐全**：HTTP/REST 与 gRPC 双协议，C++/Python 客户端带共享内存（CUDA/system）加速；Java/Go/JS 通过 gRPC stub 接入
- **生态与 NGC 深度集成**：与 TensorRT、TensorRT-LLM、vLLM、DALI、Triton Client、Model Analyzer、Perf Analyzer 形成 NVIDIA 推理全家桶
- **模型仓库即配置**：纯文件系统的 Model Repository（目录 + `config.pbtxt`）+ 版本子目录，与 Git/对象存储天然契合，CI/CD 友好
- **可观测**：内置 Prometheus metrics（请求计数、延迟分位、GPU 利用率、队列时长），生产监控开箱即用

**缺点**

- **学习曲线陡**：`config.pbtxt` 字段多（`dynamic_batching` / `instance_group` / `sequence_batching` / `model_warmup` / `rate_limiter`），调优需要同时理解 GPU 调度与框架特性
- **TensorRT 加速代价高**：要从 PyTorch/TF 先导出 ONNX，再用 `trtexec` 编译成 plan，链路长且对算子版本敏感，新模型常踩兼容性坑
- **非 NVIDIA 硬件支持弱**：虽然能跑 CPU 后端，但真正发挥价值依赖 NVIDIA GPU；AMD/Intel 推理靠 OpenVINO 等有限适配，跨厂商一致性差
- **容器镜像大**：NGC 容器动辄 10+ GB，启动慢，K8s 部署需要预拉镜像与镜像分层优化
- **调试与日志**：错误信息偏底层（CUDA error / backend 报错），出问题时定位模型本身还是 Triton 配置需要经验

## 文档地址

[Triton Inference Server Documentation](https://docs.nvidia.com/deeplearning/triton-inference-server/)

## GitHub 地址

[triton-inference-server/server](https://github.com/triton-inference-server/server)

## 幻灯片地址

<a href="/SlideStack/nvidia-triton-slide/" target="_blank">NVIDIA Triton</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=NVIDIA%20Triton" target="_blank" rel="noopener noreferrer">NVIDIA Triton 测试题</a>
