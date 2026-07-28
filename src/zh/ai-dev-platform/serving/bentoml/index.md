---
layout: doc
---

# BentoML

面向 ML 工程师的**统一模型服务化框架**（Unified Inference Platform），核心理念是「把模型推理脚本几行代码就变成生产级 REST/gRPC 服务」。开发心智：用标准 Python 类型提示定义 `@bentoml.service` 装饰的 Service 类，方法即 API；通过 `bentofile.yaml` 把代码 + 模型 + 依赖 + 系统包 + CUDA 版本打包成 **Bento**（标准化可部署单元，类似 Docker 镜像之于容器），再用 `bentoml serve / build / containerize / deploy` 完成开发-构建-容器化-上线的全链路。原生集成 PyTorch / ONNX / Hugging Face Transformers / TensorFlow / Scikit-Learn / XGBoost / Diffusers / Keras / Ray 等框架，并提供 Yatai（早期 K8s 部署平台，已演进为 BentoCloud 商业版本）实现多 Bento 编排与自动扩缩容。当前稳定版 1.4.x（PyPI），与 FastAPI 同属 Python 服务框架，但 BentoML 专注「ML 推理」场景（内置 dynamic batching / 微批 / 多 worker / 模型仓库），而 FastAPI 是通用 Web 框架。

## 评价

**优点**

- **ML 专用 serving 抽象**：`@bentoml.service` + IO descriptor（NumpyNdarray / JSON / Image / File / Multipart）天然贴合模型推理的数据流，比 FastAPI + 手写 schema 少写一半样板
- **Bento 打包标准化**：`bentofile.yaml` 一次性声明 service / 代码 / models / python / docker / conda / setup_script，构建产物自包含可复现，避免「我机器上能跑」
- **打包即容器化**：`bentoml containerize` 直接把 Bento 变成可上 K8s 的 OCI 镜像，BuildKit 加速、缓存友好，免手写 Dockerfile
- **多框架统一接入**：PyTorch / ONNX / HF / TF / Sklearn / XGBoost / Diffusers 都有 `bentoml.&lt;framework&gt;.get().to_runner()` 一致 API
- **Dynamic batching 与多 worker**：Runner 自动根据框架 GIL 行为选择 worker 数，`batchable=True` 让 API 自动聚合微批，吞吐与延迟兼得
- **Yatai / BentoCloud 一体化**：CI/CD、Canary 发布、自动扩缩容、模型仓库全在平台层接好，企业落地路径清晰

**缺点**

- **抽象层较厚**：Service / Runner / IO Descriptor / Bento / Yatai 多层抽象，学习曲线比 FastAPI 陡；早期 1.0 API（`bentoml.Service` + `@svc.api`）与新版 `@bentoml.service` 装饰器迁移成本不小
- **性能不如 Triton 极致**：与 NVIDIA Triton + TensorRT 的硬优化组合相比，纯 BentoML（默认 Python 后端）吞吐低一个数量级，需自行接 ONNX / TensorRT 才追平
- **生态相对集中**：最佳体验绑定 BentoCloud 商业产品，自建 Yatai 社区版文档与维护力度不及商业版
- **镜像偏大**：默认基于 debian + CUDA 的镜像体积常 5+ GB，需自定 distro / setup_script 优化
- **非 ML 场景冗余**：纯 CRUD / 业务 API 用 BentoML 反而比 FastAPI 笨重，定位明确但泛化能力弱

## 文档地址

[BentoML Documentation](https://docs.bentoml.com/en/latest/)

## GitHub 地址

[bentoml/BentoML](https://github.com/bentoml/BentoML)

## 幻灯片地址

<a href="/SlideStack/bentoml-slide/" target="_blank">BentoML</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=BentoML" target="_blank" rel="noopener noreferrer">BentoML 测试题</a>
