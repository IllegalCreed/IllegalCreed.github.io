---
layout: doc
---

# Docker

**Docker** 是把应用连同它的依赖一起打包进**容器（Container）**、"一次构建、处处运行"的开源平台。它采用**客户端-守护进程（Client-Daemon）**架构：命令行 `docker` 通过 REST API 把指令发给后台常驻的守护进程 **`dockerd`**，`dockerd` 再委托 **containerd**（管容器生命周期）与 **runc**（真正 `clone` 出容器进程的 OCI 运行时）落地。容器**不是轻量虚拟机**——它不带自己的内核，而是靠 Linux 的 **namespaces（隔离视图）** + **cgroups（限制资源）**，让一组进程"以为"自己独占一台机器，因此启动是毫秒级、开销接近裸进程。应用被打包成分层、只读的**镜像（Image）**，推送到**镜像仓库（Registry，默认 Docker Hub）**分发；运行时在镜像顶上加一层可写层（**写时复制 CoW**）就成了容器。2026 年的现状是：**BuildKit** 已是默认构建器、**Compose V2**（`docker compose` 子命令）取代了旧的 `docker-compose`、Docker Engine 已到 **29.x**，且自 29.0 起新装默认启用 **containerd 镜像存储（snapshotter）**。

## 概述

- **解决什么问题**：消灭"在我机器上能跑"——把 OS 层以上的运行环境（依赖、库、配置）连同应用一起封装，跨开发/测试/生产完全一致。
- **容器 vs 虚拟机**：VM 虚拟化"硬件 + 完整 Guest OS"；容器只虚拟化"进程视图"，共享宿主内核，故更轻、更快、密度更高。
- **三个核心对象**：**镜像**（只读模板）、**容器**（镜像的可运行实例）、**仓库**（镜像的分发中心）。
- **构建靠 Dockerfile**：一份声明式文本，每条指令产出一个**层（Layer）**，层可缓存、可共享。
- **底层是内核特性**：namespaces 负责隔离、cgroups 负责限额、capabilities/seccomp 负责收权，Docker 只是把它们编排起来。
- **2026 默认栈**：BuildKit 构建、Compose V2 编排、containerd 镜像存储、Engine 29.x（containerd v2.2.x + runc v1.3.x）。
- **典型场景**：本地开发环境、CI 构建与测试、微服务打包、把任意服务（数据库/缓存）一行命令拉起。

## 本叶地图

- [入门](./getting-started) —— Docker 是什么、容器 vs VM、镜像与容器的关系、安装与跑起第一个容器、核心命令速通。
- [Dockerfile](./guide-line/dockerfile) —— 各指令详解：`CMD` vs `ENTRYPOINT`、`COPY` vs `ADD`、`ARG` vs `ENV`、多阶段构建、缓存分层优化。
- [存储与网络](./guide-line/storage-network) —— 数据卷 / 绑定挂载 / tmpfs 三种持久化，bridge/host/none 网络、端口发布、自定义网络的 DNS。
- [引擎架构](./guide-line/architecture) —— dockerd/containerd/runc 分层、overlay2 与写时复制、namespaces/cgroups 隔离原理、BuildKit。
- [最佳实践](./guide-line/best-practice) —— 精简镜像（alpine/slim/distroless）、非 root 运行、HEALTHCHECK、`.dockerignore`、tag vs digest、安全加固。
- [参考](./reference) —— 命令 / Dockerfile 指令 / 常见坑速查表 + 权威链接。

## 文档地址

[Docker Documentation](https://docs.docker.com/)

## 幻灯片地址

- <a href="/SlideStack/docker-slide/" target="_blank">Docker</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=docker" target="_blank" rel="noopener noreferrer">Docker 测试题</a>
