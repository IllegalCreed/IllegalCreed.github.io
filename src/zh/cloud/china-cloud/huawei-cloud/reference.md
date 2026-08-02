---
layout: doc
outline: [2, 3]
---

# 参考：华为云产品速查与对比

> 基于华为云 · 核于 2026-08

## 速查

- **定位**：国内第三/第四，政企基因，政务云/国产化替代独特。
- **通用产品**：ECS（对标阿里 ECS/腾讯 CVM）、OBS（对标 OSS/COS）、GaussDB（自研）、CDN。
- **两大差异化**：GaussDB（自研数据库替 Oracle）、鲲鹏（自研 ARM 算力替 Intel）。
- **合规**：等保三级、涉密、可信云，政务/金融首选。
- **备案强制**：境内服务器同样必须 ICP 备案。
- **安全铁律**：数据库端口禁公网，AK/SK 不写代码。

## 一、开发者核心产品速查（与阿里/腾讯对照）

| 华为云 | 阿里云 | 腾讯云 | 用途 |
| --- | --- | --- | --- |
| **ECS** | ECS | CVM | 云服务器 |
| **OBS** | OSS | COS | 对象存储（S3 兼容） |
| **GaussDB** | PolarDB/RDS | TDSQL-C/TDSQL | 数据库（自研） |
| CDN | CDN | CDN | 内容分发 |
| VPC | VPC | VPC | 私有网络 |
| **IAM** | RAM | CAM | 身份与访问管理 |
| **鲲鹏 ECS** | — | — | ARM 国产化算力（华为独有） |
| **华为云 Stack** | 专有云 | 专有云 | 混合云本地部署 |

## 二、国产化替代对照

| 国产化项 | 被替代（国外） | 华为替代 |
| --- | --- | --- |
| 数据库 | Oracle | **GaussDB**（自研） |
| 算力 CPU | Intel x86 | **鲲鹏 920**（ARM） |
| 操作系统 | CentOS/Windows | **openEuler**（开源） |
| 存储 | EMC | OBS/EVS |
| AI 算力 | NVIDIA GPU | **昇腾 Ascend**（NPU） |

## 三、ECS 实例规格

| 规格 | 适合 |
| --- | --- |
| 通用计算型 | 多数 Web 应用（均衡） |
| 计算加速型（GPU/NPU） | AI 训练推理、图形 |
| 内存优化型 | 数据库/大数据 |
| **鲲鹏通用计算型** | 国产化项目（ARM） |

## 四、三家云定位对比

| 维度 | 阿里云 | 腾讯云 | 华为云 |
| --- | --- | --- | --- |
| 起家 | 电商（双 11） | 社交游戏（微信） | 政企/硬件 |
| 国内份额 | 第一 | 第二 | 第三/第四 |
| 核心客群 | 互联网/企业 | 互联网/微信生态 | 政府/金融/国企 |
| 差异化 | 产品最全 | 微信生态 | 国产化/政企 |
| 自研芯片 | 无 | 无 | **鲲鹏/昇腾** |
| 自研数据库 | PolarDB | TDSQL-C | **GaussDB**（替 Oracle） |

## 五、安全组端口规范

| 端口 | 协议 | 源 IP | 用途 |
| --- | --- | --- | --- |
| 22 | TCP | 自己 IP/堡垒机 | SSH |
| 80 | TCP | 0.0.0.0/0 | HTTP（备案后） |
| 443 | TCP | 0.0.0.0/0 | HTTPS |
| 3306 | **禁公网** | VPC 网段 | MySQL（仅内网） |
| 6379 | **禁公网** | VPC 网段 | Redis（仅内网） |

## 六、易错点清单

- **"华为云和阿里/腾讯完全一样"**：片面。通用产品对标，但华为云的政企/国产化定位（GaussDB/鲲鹏/政务云）是独特差异化。
- **"GaussDB 就是 MySQL 改"**：错。GaussDB 分布式版是华为自研内核（非基于开源 MySQL 改），这是它"国产化替代 Oracle"的核心。
- **"鲲鹏 ECS 和 x86 完全兼容"**：不完全。鲲鹏是 ARM 架构，软件需 ARM 适配（多数开源软件已支持，少数 x86 闭源软件需替代）。
- **"华为云备案不用做"**：错。境内服务器同样强制 ICP 备案，与阿里/腾讯一致。
- **"AK/SK 写代码方便"**：严重事故。泄漏即全账号沦陷，应用 IAM 委托。
- **"openEuler 是华为私有"**：错。openEuler 是华为 2019 年捐赠开源的社区 Linux。
- **"政务云只是营销噱头"**：错。政务云通过等保/涉密/可信云等硬认证，是政府/金融招标的实质性准入门槛。
- **"华为云只做政务不做互联网"**：错。通用产品（ECS/OBS/CDN）同样服务互联网客户，只是政企口碑更深。

## 七、选型建议

| 场景 | 推荐 |
| --- | --- |
| 政府/金融/国企政企项目 | **华为云**（合规+国产化） |
| 国产化替代（替 Oracle/Intel） | **华为云**（GaussDB/鲲鹏） |
| 微信小程序后端 | 腾讯云（微信生态） |
| 通用互联网 Web | 阿里云（生态最全） |
| 已有华为硬件/技术栈 | 华为云 |

## 权威链接

- [华为云官网](https://www.huaweicloud.com/)
- [ECS 文档](https://support.huaweicloud.com/ecs/)
- [OBS 文档](https://support.huaweicloud.com/obs/)
- [GaussDB 文档](https://support.huaweicloud.com/gaussdb/)
- [鲲鹏社区](https://www.hikunpeng.com/)
- [openEuler](https://www.openeuler.org/)
- [openGauss](https://opengauss.org/)
- 本站幻灯片：<a href="/SlideStack/huawei-cloud-slide/" target="_blank">华为云</a>
- 关联：[阿里云](../aliyun/) · [腾讯云](../tencent-cloud/) · [ICP 备案与域名](../icp-filing/)
