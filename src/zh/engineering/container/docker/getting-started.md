---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Docker（Engine 2x / BuildKit 默认）· 核于 2026-07

## 速查

- **一句话**：Docker = 把应用 + 依赖打包成**镜像**，在**容器**里跑；容器共享宿主内核，比 VM 轻得多。
- **三对象**：**Image**（只读模板）→ **Container**（运行实例）→ **Registry**（镜像仓库，默认 Docker Hub）。
- **镜像名格式**：`[registry/]namespace/repo:tag`，不写 tag 默认 `:latest`（生产别依赖 latest）。
- **跑一个容器**：`docker run -d --name web -p 8080:80 nginx:alpine`（`-d` 后台、`-p 主机:容器` 发布端口）。
- **进容器**：`docker exec -it web sh`（`-it` = 交互式终端）；一次性调试用 `docker run -it --rm alpine sh`。
- **看/管容器**：`docker ps`（加 `-a` 含已停）、`docker logs -f`、`docker stop/start/rm`。
- **镜像操作**：`docker pull` / `images` / `build -t 名:tag .` / `rmi` / `push`。
- **构建**：`docker build -t app:1.0 .`，`.` 是**构建上下文**，用 `.dockerignore` 排除无关文件。
- **清理**：`docker system prune -a`（删悬空镜像/停止容器/无用网络），`docker system df` 看占用。
- **`-v` 挂载**：`-v 卷名:/容器路径` 持久化；`docker run --rm` 退出即删容器。
- **exec form 优先**：`CMD ["node","app.js"]` 而非 shell form，保证进程是 PID 1、能收信号。
- **坑**：容器可写层随删容器一起丢；`EXPOSE` 只是声明不发布端口；默认 bridge 网络容器间不能按名互访。

## 一、Docker 是什么

Docker 是一个**打包 + 分发 + 运行**应用的平台。它把"应用能跑起来所需的一切"——代码、运行时、系统库、环境变量、配置——封装进一个标准化的**镜像**，任何装了 Docker 的机器都能用同一个镜像跑出**完全一致**的运行环境。这消灭了经典的"在我机器上明明能跑"问题。

它是**客户端-服务端**结构：

```
docker (CLI 客户端)  --REST API-->  dockerd (守护进程)
                                        │  管理镜像 / 容器 / 网络 / 卷
                                        └─> containerd -> runc -> 你的进程
```

- **`docker`**：你敲的命令行，把请求发给 daemon。
- **`dockerd`**：后台常驻，真正干活的守护进程，管理所有 Docker 对象。
- **Registry**：镜像的"应用商店"，`docker pull` 拉、`docker push` 推，默认是 Docker Hub。

## 二、容器 vs 虚拟机

这是理解 Docker 的第一关。**容器不是小型虚拟机。**

| 维度       | 虚拟机（VM）                   | 容器（Container）                 |
| ---------- | ------------------------------ | --------------------------------- |
| 虚拟化层   | Hypervisor 虚拟化**硬件**      | 内核 namespaces 虚拟化**进程视图**|
| 操作系统   | 每个 VM 一套完整 **Guest OS**  | **共享宿主内核**，无 Guest OS     |
| 启动速度   | 秒级~分钟级                    | **毫秒级**                        |
| 体积       | GB 级（含整个 OS）             | MB 级（只有应用 + 依赖）          |
| 资源开销   | 大（每台 VM 跑一个内核）       | 极小（接近裸进程）                |
| 隔离强度   | 强（硬件级）                   | 进程级（靠内核特性，弱于 VM）     |
| 密度       | 一台机器几十个                 | 一台机器成百上千个                |

```
虚拟机                              容器
┌──────┐ ┌──────┐ ┌──────┐        ┌──────┐ ┌──────┐ ┌──────┐
│ App  │ │ App  │ │ App  │        │ App  │ │ App  │ │ App  │
│ Bins │ │ Bins │ │ Bins │        │ Bins │ │ Bins │ │ Bins │
│GuestOS│ │GuestOS│ │GuestOS│      └──────┘ └──────┘ └──────┘
└──────┘ └──────┘ └──────┘        ┌────────────────────────┐
┌────────────────────────┐        │   Docker Engine        │
│      Hypervisor        │        ├────────────────────────┤
├────────────────────────┤        │   Host OS (共享内核)    │
│   Host OS / Hardware   │        ├────────────────────────┤
└────────────────────────┘        │      Hardware          │
                                   └────────────────────────┘
```

关键点：容器省掉了每实例一个 Guest OS 的巨大开销，代价是隔离强度弱于 VM（共享内核 = 内核漏洞可能穿透）。所以强隔离/多租户场景，业界常在 VM 里再跑容器（如 Kubernetes 节点是 VM）。

## 三、镜像与容器：分层与实例

### 镜像是"分层只读模板"

一个**镜像**由若干**只读层（layer）**自下而上堆叠而成，每一层是相对上一层的**文件差异（diff）**。Dockerfile 里每条会改文件系统的指令（`RUN`/`COPY`/`ADD`）就生成一层：

```
镜像 my-app:1.0
├── Layer 4  COPY . /app          (你的代码)
├── Layer 3  RUN npm ci           (依赖)
├── Layer 2  RUN apk add ...      (系统包)
└── Layer 1  FROM node:22-alpine  (基础镜像)
```

分层的好处：**层可缓存、可共享**。多个镜像共用 `node:22-alpine` 这层时，本地只存一份（在 `/var/lib/docker/` 下）；改代码只需重建最上面几层。

### 容器是"镜像 + 一层可写层"

`docker run` 一个镜像时，Docker 在只读层之上加一层**薄薄的可写层（thin writable layer）**，采用**写时复制（Copy-on-Write, CoW）**：读文件直接读下面的只读层，改文件时才把它复制到可写层再改。

```
容器 = [可写层 R/W]  ← 你在容器里的所有改动都写这
       ─────────────
       [只读层 4]   ┐
       [只读层 3]   │ 来自镜像，多个容器共享
       [只读层 2]   │
       [只读层 1]   ┘
```

::: warning 可写层随容器一起消失
容器删掉时，它的可写层也一并删掉，镜像不受影响。所以**容器里的数据默认不持久**——要持久化数据必须用**数据卷（volume）**，见 [存储与网络](./guide-line/storage-network.md)。
:::

## 四、安装与跑起第一个容器

### 安装

- **桌面**：装 **Docker Desktop**（Windows / macOS / Linux），自带 `dockerd` + `docker` CLI + Compose + 可选 Kubernetes。
- **Linux 服务器**：装 **Docker Engine**（`apt/dnf install docker-ce`），纯守护进程 + CLI，无 GUI。
- 验证：

```bash
docker version          # 看 Client / Server 版本
docker info             # 看引擎详情（存储驱动、cgroup 版本、容器数）
docker run hello-world  # 官方冒烟测试镜像
```

### 跑第一个容器

```bash
# 后台跑一个 nginx，把容器 80 端口发布到主机 8080
docker run -d --name web -p 8080:80 nginx:alpine

# 浏览器访问 http://localhost:8080 即见 nginx 欢迎页
docker ps                    # 看运行中的容器
docker logs -f web           # 跟踪日志
docker exec -it web sh       # 进容器内部（-it = 交互 + 终端）
docker stop web && docker rm web   # 停止并删除
```

参数拆解：

- `-d`：detached，后台运行（不写就前台，Ctrl+C 会停容器）。
- `--name web`：给容器起名，不写会随机生成如 `nostalgic_turing`。
- `-p 8080:80`：`主机端口:容器端口`，把容器内的 80 发布到主机 8080。
- `nginx:alpine`：镜像名:tag，本地没有会自动 `pull`。

### 一次性调试容器

```bash
# 拉个 alpine 进去随便折腾，退出即焚（--rm）
docker run -it --rm alpine sh
/ # cat /etc/os-release
/ # exit          # 容器随之删除
```

## 五、核心命令速通

### 容器生命周期

```bash
docker run [opts] 镜像 [cmd]   # 创建 + 启动（最常用）
docker ps                      # 运行中的容器
docker ps -a                   # 含已停止的
docker stop / start / restart 容器
docker rm 容器                 # 删除（加 -f 强删运行中的）
docker exec -it 容器 sh        # 在运行中的容器里执行命令
docker logs -f 容器            # 看日志（-f 跟踪）
docker inspect 容器            # 看完整 JSON 元数据
docker stats                   # 实时资源占用（类似 top）
```

### 镜像操作

```bash
docker pull 镜像:tag           # 从 registry 拉镜像
docker images                  # 列出本地镜像
docker build -t app:1.0 .      # 用当前目录 Dockerfile 构建
docker tag app:1.0 app:latest  # 打别名
docker push registry/app:1.0   # 推到 registry
docker rmi 镜像                 # 删镜像
docker history 镜像            # 看镜像每一层怎么来的
```

### 清理（磁盘吃紧时）

```bash
docker system df               # 看 Docker 占了多少磁盘
docker container prune         # 删所有已停止容器
docker image prune             # 删悬空镜像（<none>）
docker image prune -a          # 删所有没被容器用的镜像
docker volume prune            # 删没被挂载的卷
docker system prune -a         # 一键大扫除（容器/镜像/网络，加 --volumes 连卷）
```

::: tip 用 --format 定制输出
`docker ps` / `inspect` 支持 Go 模板定制列。例如只看容器 IP：

```bash
docker inspect --format '{{ .NetworkSettings.IPAddress }}' web
docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
```

模板语法里的双花括号只在这种 fenced 代码块里安全；写进正文行内需转义。
:::

## 下一步

- Dockerfile 各指令、`CMD` vs `ENTRYPOINT`、多阶段构建、缓存优化见 [Dockerfile](./guide-line/dockerfile.md)。
- 数据持久化（卷/绑定挂载/tmpfs）与容器网络见 [存储与网络](./guide-line/storage-network.md)。
- daemon/containerd/runc、overlay2、namespaces/cgroups 底层原理见 [引擎架构](./guide-line/architecture.md)。
- 精简镜像、非 root、安全加固见 [最佳实践](./guide-line/best-practice.md)。
- 全量命令与指令速查见 [参考](./reference.md)。
