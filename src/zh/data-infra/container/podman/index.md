---
layout: doc
---

# Podman

**Podman** 是 Red Hat 主导、2018 年开源的**守护进程无关（daemonless）**容器引擎——它把 Docker「客户端 + 常驻 `dockerd` 守护进程」的架构，改造成了「**直接 fork-exec**」模式：每条 `podman run` 都是普通进程直接被你的 shell 拉起，**没有一个总览一切的 root 守护进程**。这一改动带来两项关键能力：①**Rootless（无根）**——普通用户无需 sudo 就能跑容器，容器进程作为该用户身份运行，靠**用户命名空间（user namespace）**把容器内的「root」映射到宿主的「普通用户」，从根本上缩小了被攻破后的爆炸半径；②**systemd 原生集成**——既然容器就是普通进程，自然能用 systemd 管理它，**Quadlet**（Podman 4.4+ 内置）让你用 `.container`/`.pod` 单元像写 systemd service 一样声明式跑容器。Podman 还原生了**Pod**概念（借鉴 K8s，一组共享网络/存储的容器），并做到**与 Docker CLI 几乎 100% 兼容**（`alias docker=podman` 多数场景直接可用）、通过 `podman compose` 支持 Compose 文件。2026 年的现状是：Podman 已到 **5.x**（5.0 于 2024 年发布，重写了 `podman machine`、强化 Quadlet），是 **Red Hat 生态（RHEL/Fedora/CentOS）默认容器引擎**，也是追求 rootless 安全与轻量单机部署场景下 Docker 的主流替代。

Podman 的全部考点围绕「**daemonless、rootless、pod、systemd、兼容性、生态**」展开：①**架构差异**（无 dockerd，fork-exec 模型，rootless 靠 user namespace）——回答「为什么 Podman 不需要守护进程、怎么做到非 root 跑容器」；②**Pod 概念**（一组共享网络的容器，源自 K8s 模型）——回答「Podman 的 pod 是什么、和 Docker 的容器组有什么不同」；③**systemd 集成与 Quadlet**（`.container`/`.pod` 单元，声明式管理）——回答「生产怎么让容器开机自启、随 systemd 管理」；④**兼容性**（CLI 兼容 Docker、`podman compose` 跑 Compose 文件、Kubernetes YAML 导入导出）——回答「从 Docker 迁移有多痛」；⑤**Red Hat 生态**（CRI-O、Buildah、Skopeo 三件套，RHEL 默认引擎，SELinux 集成）——回答「Podman 在企业 Linux 栈的位置」。本叶是容器编排组的**第二站**，先讲清 daemonless/rootless/pod/systemd 的内核机制，再讲与 Docker/Compose/K8s 的兼容性与 Red Hat 生态全貌，帮你判断「何时用 Podman 而非 Docker/K8s」。

## 评价

**优点**

- **Daemonless 无单点**：没有常驻 root 守护进程，容器进程直接 fork-exec——无 dockerd 崩溃拖垮所有容器、无「dockerd 挂了所有容器变孤儿」风险
- **Rootless 安全**：普通用户无需 sudo 跑容器，靠 user namespace 把容器内 root 映射到宿主普通用户——容器逃逸后仍是低权限，是单机/多租户安全利器
- **systemd 原生**：容器即进程，Quadlet 用 systemd 单元声明式管理，开机自启/依赖/日志/journal 集成天然顺畅，比 `restart: always` 优雅
- **CLI 兼容 Docker**：`alias docker=podman` 多数命令直接可用，迁移成本低；`podman compose` 支持 Compose 文件

**缺点**

- **生态不及 Docker**：Docker Desktop（GUI）、Docker Hub 的网络效应、第三方工具默认假设 dockerd，Podman 偶有兼容性边角问题
- **Rootless 有约束**：非 root 不能绑定 1024 以下端口、部分存储/网络驱动 rootless 支持有限、用户命名空间配置（subuid/subgid）要预先设好
- **无原生集群编排**：Podman 是单机引擎，跨机编排要交给 K8s（CRI-O 才是 K8s 运行时）或 Podman + 管理工具组合，本身不替代 K8s
- **macOS/Windows 需 VM**：`podman machine` 在非 Linux 上要跑虚拟机（Podman 5.0 重写了它），体验上比 Docker Desktop 略重

## 本叶地图

- [入门](./getting-started) —— Podman 是什么、daemonless vs dockerd、rootless 原理、pod 概念、CLI 兼容 Docker、跑起第一个容器
- [Daemonless、Rootless 与 Pod](./guide-line/daemonless-and-pods) —— fork-exec 架构、user namespace 与 rootless 实现、pod 共享网络/存储、systemd 集成与 Quadlet
- [兼容性与 Red Hat 生态](./guide-line/compatibility-and-ecosystem) —— 与 Docker CLI/Compose 兼容、Kubernetes YAML 导入导出、Buildah/Skopeo/CRI-O 三件套、SELinux 集成
- [参考](./reference) —— 命令速查、Quadlet 单元模板、rootless 配置、易错点、与 Docker/K8s 对比

## 文档地址

[Podman Documentation](https://podman.io/docs)

## 幻灯片地址

<a href="/SlideStack/podman-slide/" target="_blank">Podman</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=Podman" target="_blank" rel="noopener noreferrer">Podman 测试题</a>
