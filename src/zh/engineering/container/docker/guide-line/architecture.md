---
layout: doc
outline: [2, 3]
---

# 指南 - 引擎架构

> 基于 Docker（Engine 2x / BuildKit 默认）· 核于 2026-07

## 速查

- **分层调用链**：`docker`(CLI) → **`dockerd`**(守护进程, REST API) → **`containerd`**(gRPC, 容器生命周期) → **`containerd-shim`**(每容器一个, 守护) → **`runc`**(OCI 运行时, 真正建容器)。
- **dockerd 干嘛**：管镜像/网络/卷、暴露 REST API、构建；**不直接**碰容器进程，全委托 containerd。
- **containerd**：CNCF 毕业的行业标准运行时，负责拉镜像、管容器/快照；Engine 29 内置 **v2.2.x**。
- **runc**：轻量 OCI 运行时，`clone()` + 配好 namespaces/cgroups 后 `execve` 你的进程，然后**退出**（容器不依赖它常驻）。
- **shim 的意义**：runc 退出后由 shim 当容器"养父"，即使 **dockerd 重启容器也不挂**（daemonless 容器）。
- **镜像分层 + CoW**：镜像是只读层叠加，容器加**薄可写层**；改文件时才 `copy_up` 到可写层——**写时复制**。
- **overlay2**：经典默认存储驱动，用 `lowerdir`(只读镜像层) + `upperdir`(可写层) 合并成 `merged` 视图。
- **containerd 镜像存储（snapshotter）**：Engine **29.0+ 新装默认**，用 `overlayfs` snapshotter，支持多平台镜像/attestation/懒拉取，但更吃磁盘、与 userns-remap 不兼容。
- **隔离靠内核**：**namespaces**（pid/net/mnt/ipc/uts/user 隔"看到什么"）+ **cgroups**（限 CPU/内存/IO"能用多少"）+ **capabilities/seccomp**（收权）。
- **BuildKit**：默认构建后端，并行构建、跳过无用 stage、增量传上下文、缓存挂载、密钥挂载；LLB + 可插拔前端。

## 一、分层架构：docker / dockerd / containerd / runc

Docker 不是一个大块头，而是一条**分层委托**的调用链，每层各司其职、且都遵循 OCI 标准：

```
┌──────────┐   REST API (unix socket / tcp)
│  docker  │───────────────────────────────►┌──────────┐
│  (CLI)   │                                 │ dockerd  │  管镜像/网络/卷/构建/API
└──────────┘                                 └────┬─────┘
                                        gRPC       │
                                                   ▼
                                             ┌──────────┐
                                             │containerd│  容器/镜像生命周期、快照
                                             └────┬─────┘
                                   每个容器一个     │  fork
                                                   ▼
                                         ┌──────────────────┐
                                         │ containerd-shim  │  容器"养父"，常驻
                                         └────────┬─────────┘
                                                  │ 调用后退出
                                                  ▼
                                            ┌──────────┐
                                            │   runc   │  按 OCI spec 建容器进程后退出
                                            └────┬─────┘
                                                 │ clone()+namespaces+cgroups+execve
                                                 ▼
                                          [ 你的容器进程 (PID 1) ]
```

- **`docker`（CLI）**：把命令编码成 REST 请求发给 `dockerd`，自己不干重活。
- **`dockerd`（守护进程）**：管理镜像、网络、卷，暴露 Docker API，处理构建。容器的实际起停它**委托给 containerd**。
- **`containerd`**：CNCF 毕业的**行业标准容器运行时**，负责镜像拉取/存储、容器生命周期、快照（存储）。也能脱离 Docker 独立用（K8s 直接用 containerd）。
- **`containerd-shim`**：每个容器一个 shim 进程，作为容器的直接父进程常驻。
- **`runc`**：最底层的 **OCI 运行时**，真正调 Linux `clone()` 建 namespaces、配 cgroups，然后 `execve` 拉起容器主进程，**随即退出**。

Engine 29 内置 containerd **v2.2.x** + runc **v1.3.x**。

## 二、一次 docker run 发生了什么

以 `docker run -d nginx` 为例，串起整条链：

1. `docker` CLI 把请求 POST 给 `dockerd` 的 `/containers/create` + `/start`。
2. `dockerd` 检查本地有没有 `nginx` 镜像，没有就让 containerd 从 registry `pull`。
3. `containerd` 准备镜像的**快照（snapshot）**——把只读镜像层 + 一层可写层组织成容器的根文件系统。
4. `containerd` fork 出一个 **`containerd-shim`** 作为容器的父进程。
5. shim 调用 **`runc`**，`runc` 依据 OCI `config.json`：`clone()` 出新进程并放进一组新的 **namespaces**，套上 **cgroups** 限额，切 rootfs（`pivot_root`），最后 `execve` 拉起 nginx 主进程作为容器内 **PID 1**。
6. `runc` 退出；nginx 由 shim 托管。**此时就算 `dockerd` 重启，容器照样活着**（shim 与 containerd 解耦了容器与守护进程）——这就是"daemonless 容器"。

## 三、overlay2 与写时复制

### 镜像分层与共享

镜像是一叠**只读层**，每层是相对下层的文件差异；除最上一层外都只读。**多个镜像/容器共享相同的底层**，同一层在 `/var/lib/docker/` 里只存一份——省磁盘、省带宽（pull 只下缺的层）。注意：只有改文件系统的指令（`RUN`/`COPY`/`ADD`）才生成层，纯元数据指令（`LABEL`/`CMD`/`ENV`）不产层。

### 写时复制（Copy-on-Write）

容器 = 镜像只读层 + 一层**薄可写层**。overlay2 把它们叠成一个统一视图：

```
merged/  (容器看到的最终文件系统)
  ▲   叠加（overlay）
  ├── upperdir/   ← 可写层：容器所有写入都落这
  └── lowerdir/   ← 只读：镜像的各层（多容器共享）
```

- **读**：直接读 `lowerdir` 里的镜像层，零拷贝。
- **写/改**：第一次修改某个只读文件时，overlay2 先把它从 `lowerdir` **`copy_up` 复制到 `upperdir`**，再在副本上改——这就是 **CoW**。
- **删**：在 upperdir 放一个 "whiteout" 标记遮住下层文件。

CoW 让所有容器共享镜像层、启动无需整份拷贝，因此**秒起 + 省空间**。代价：首次写大文件会触发 `copy_up`，有一次性开销。所以**写密集数据（数据库、日志）应放到 volume**，绕开可写层，见 [存储与网络](./storage-network.md)。

> `vfs` 驱动没有 CoW（每层整份复制），只在不支持 overlay 的环境兜底，慢且费空间。

## 四、namespaces 与 cgroups

容器隔离**不是 Docker 发明的魔法，而是 Linux 内核特性**。Docker 只是把它们组合编排。

### namespaces：隔离"看得见什么"

每个容器进程被放进一组独立的 namespace，让它以为自己独占系统：

| namespace | 隔离的资源                        |
| --------- | --------------------------------- |
| `pid`     | 进程号（容器内 PID 1 就是主进程） |
| `net`     | 网络栈（独立网卡、IP、端口、路由）|
| `mnt`     | 挂载点 / 文件系统视图             |
| `ipc`     | 进程间通信（信号量、共享内存）    |
| `uts`     | 主机名 / 域名                     |
| `user`    | UID/GID 映射（容器内 root ≠ 宿主 root）|

一个容器里的进程看不到、也动不了另一个容器或宿主的进程、网络、挂载。

### cgroups：限制"能用多少"

control groups 负责**资源计量与限额**，防止单个容器吃垮整机：

```bash
docker run -d \
  --memory=512m \        # 内存上限 512MB（超了触发 OOM kill）
  --cpus=1.5 \           # 最多用 1.5 个 CPU
  --pids-limit=200 \     # 进程数上限（防 fork 炸弹）
  --blkio-weight=500 \   # 块设备 IO 权重
  my-app
```

namespaces 管"隔离视图"、cgroups 管"资源配额"，二者合力 = 容器。此外 **capabilities**（默认丢弃大部分 root 特权，只留必需）、**seccomp**（过滤危险 syscall）、**user namespace remap**（把容器 root 映射成宿主非特权用户）进一步收紧攻击面。

::: warning 容器隔离弱于 VM
所有容器**共享同一个宿主内核**——内核漏洞可能被容器逃逸利用。所以多租户/不可信负载场景，业界会在 VM 里再跑容器（K8s 节点即 VM），或用 gVisor / Kata Containers 这类"沙箱运行时"加固。
:::

## 五、BuildKit：现代构建后端

**BuildKit 是 Docker 自 Engine 23.0 起的默认构建后端**（旧的 legacy builder 仅在 Windows 容器等少数场景用）。相比旧 builder，它：

- **并行构建**互不依赖的 stage（旧 builder 严格顺序执行）。
- **自动跳过**没被 `COPY --from` 用到的 stage。
- **增量传输**构建上下文，只发变动的文件；还能跳过上下文里用不到的文件。
- 靠**内容寻址**精确判缓存（而非旧 builder 的启发式），缓存更准。
- 支持 `RUN --mount`：**缓存挂载**（依赖/编译缓存跨构建复用）、**密钥挂载**（密钥不入镜像层）、**SSH 挂载**（拉私有仓库）。

原理：BuildKit 把 Dockerfile 经**前端（frontend）**翻译成 **LLB（Low-Level Build）**——一张内容寻址的依赖图，再由"完全并发的求解器"调度执行。前端可作为镜像分发，这就是首行 `# syntax=docker/dockerfile:1` 的意义：**锁定/自动更新 Dockerfile 语法前端**，无需升级整个 Docker 就能用上新指令。

```dockerfile
# syntax=docker/dockerfile:1        ← 指定前端镜像，解锁最新 Dockerfile 特性
```

- 开关：环境变量 `DOCKER_BUILDKIT=1/0`（现代版本默认已开）。
- `docker buildx`：BuildKit 的增强 CLI 入口，支持多平台构建（`--platform linux/amd64,linux/arm64`）、多种 build driver、导出缓存。

## 六、containerd 镜像存储（2026 默认）

**自 Docker Engine 29.0 起，新装默认启用 containerd 镜像存储（snapshotter）**，取代经典的 overlay2 graph driver（默认用 `overlayfs` snapshotter）。带来的能力：

- **本地就能构建 + 存储多平台镜像**，不必依赖外部 builder。
- 支持带 **attestation（provenance、SBOM）** 的镜像。
- 可跑 **WebAssembly** 容器。
- 高级 snapshotter 解锁**懒拉取（lazy-pulling，如 stargz）**、**P2P 分发（nydus/dragonfly）**。

代价与限制：

- **更吃磁盘**——镜像同时以压缩和非压缩两种形式存储。
- **与 `userns-remap`（用户命名空间重映射）不兼容**。

老机器（29 之前升级上来的）仍可能用 overlay2 graph driver；要切换在 `/etc/docker/daemon.json` 加：

```json
{
  "features": { "containerd-snapshotter": true }
}
```

改完 `systemctl restart docker`。`docker info` 里看 `Storage Driver` 可确认当前用的是哪套。

## 下一步

- 镜像分层如何影响缓存与构建见 [Dockerfile](./dockerfile.md#七、缓存分层优化与-buildkit-挂载)。
- CoW 与 volume 的分工见 [存储与网络](./storage-network.md#一、为什么需要外挂存储)。
- 基于隔离原理的安全加固见 [最佳实践](./best-practice.md#四、安全加固)。
- 组件/命令速查见 [参考](../reference.md)。
