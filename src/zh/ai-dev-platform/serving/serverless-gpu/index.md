---
layout: doc
---

# Serverless GPU 平台

按调用计费、自动扩缩容、无需管理 GPU 实例的**托管式 GPU 推理平台**类别，代表产品是 **Modal** 与 **Replicate**。核心模式：开发者把模型代码 / 权重交给平台，平台负责容器化、GPU 调度、冷启动优化、按秒计费与流量扩缩容；用户只按实际推理时长付费（vs 传统 GPU 包月租赁的「开机即付费」）。**Modal**（modal.com）是 Python 原生 serverless 平台，以 `@app.function` 装饰器把 Python 函数变成云端可执行单元，主打亚秒级冷启动、`modal.Image` 基础设施即代码、支持 T4 / L4 / A10 / L40S / A100-40GB / A100-80GB / H100 / H200 / B200 / B300 等全档位 GPU（按秒计费，T4 约 0.59 美元/小时、H100 约 3.95 美元/小时）。**Replicate**（replicate.com）则专注「模型托管 API」：用 **cog** 工具把模型打包成标准生产容器（cog.yaml 声明 GPU / Python / 依赖，predict.py 定义 `BaseRunner` 的 setup/run），`cog push` 上传后即可通过 REST Prediction API 调用，平台自动处理模型仓库、版本管理与硬件调度。两者共同替代了「自己租 GPU 实例 + 装 Docker + 部署 Triton + 配负载均衡」的传统链路，让 ML 工程师聚焦模型本身。

## 评价

**优点**

- **按秒计费成本可控**：只在推理时付费，闲时零成本，对低 QPS / 突发流量场景比包月 GPU 便宜一个数量级
- **零运维**：不碰 Docker / K8s / 负载均衡 / 自动扩缩容，平台全包，ML 工程师专注模型与 Prompt
- **冷启动优化**：Modal Memory Snapshot + 容器复用实现亚秒级冷启动；Replicate 用 cog 标准容器 + 模型预热，让无状态推理几乎无感
- **GPU 档位齐全**：从 T4（推理入门）到 H100/B300（大模型）全覆盖，平台自动按需调度
- **开发体验流畅**：Modal 用 `modal serve` 实时热重载、`modal deploy` 一键上线；Replicate 用 cog 本地 `cog predict` 调试、`cog push` 部署，本地与云端一致
- **生态丰富（Replicate）**：官方模型库 + 社区模型库覆盖主流开源模型，调用一个 API endpoint 即可试用

**缺点**

- **稳态高 QPS 时成本反而更高**：长期满载推理时按秒计费累加超过包月 GPU，规模化后自建 SageMaker Endpoint / 自有 GPU 集群更划算
- **冷启动无法完全消除**：即便 Memory Snapshot，首次加载大模型（如 70B LLM）仍需数秒到数十秒，不适合硬实时场景
- **数据与模型出域**：把权重 / 数据交给第三方托管，合规 / 数据敏感场景受限（金融 / 医疗等需私有部署）
- **可定制性弱于自建**：无法深入调整 CUDA / cuDNN 版本、操作系统级优化、网络拓扑；与 Triton + TensorRT 的硬优化极限有差距
- **供应商锁定**：Modal 的 `@app.function` / Replicate 的 cog 都是平台特定 API，迁移到自建需要重写
- **可观测性受限**：监控 / 日志 / 链路追踪依赖平台提供的面板，深度不及自建 ELK / Prometheus 体系

## 文档地址

- [Modal Documentation](https://modal.com/docs)
- [Replicate Documentation](https://replicate.com/docs)

## GitHub 地址

- [modal-labs/modal-client](https://github.com/modal-labs/modal-client)
- [replicate/cog](https://github.com/replicate/cog)

## 幻灯片地址

<a href="/SlideStack/serverless-gpu-slide/" target="_blank">Serverless GPU 平台</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=Serverless%20GPU%20%E5%B9%B3%E5%8F%B0" target="_blank" rel="noopener noreferrer">Serverless GPU 平台 测试题</a>
