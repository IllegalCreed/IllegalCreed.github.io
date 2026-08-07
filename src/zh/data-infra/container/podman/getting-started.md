---
layout: doc
outline: [2, 3]
---

# 入门：Daemonless、Rootless 与 Pod

> 基于 Podman 5.x · 核于 2026-08

## 速查

- **一句话**：Podman 是**守护进程无关（daemonless）**的容器引擎——没有常驻的 root 守护进程，每条 `podman run` 都是普通进程**直接 fork-exec**，默认**非 root（rootless）**也能跑。
- **vs Docker 的核心差异**：Docker = 客户端 + 常驻 **`dockerd`**（root，管所有容器）；Podman = **无守护进程**，容器进程作为调用者子进程。Docker 的 dockerd 是**单点 + 提权目标**，Podman 从架构上消除了这两点。
- **Rootless 原理**：靠 **user namespace**——把容器内的 root（uid 0）映射到宿主的一个**普通用户**（通过 `/etc/subuid`/`subgid` 配置的映射段）。容器内看自己是 root，宿主看它是普通用户——**容器逃逸后仍是低权限**。
- **Pod 概念**：Podman 原生支持 **Pod**（一组共享网络命名空间与可选存储的容器）——这是从 K8s 借来的概念。一个 pod 里的容器共享同一个 IP/端口空间，适合「主容器 + 边车」组合。
- **CLI 兼容 Docker**：`podman run/ps/images/build/logs/exec/pull/push` 与 docker 命令几乎一致，`alias docker=podman` 多数场景直接工作（不兼容点见[兼容性章节](./guide-line/compatibility-and-ecosystem)）。
- **跑一个容器**：`podman run -d --name web -p 8080:80 docker.io/library/nginx:alpine`（语法与 docker 完全一致）。
- **进容器**：`podman exec -it web sh`；看日志 `podman logs -f web`；列容器 `podman ps`（含停止的加 `-a`）。
- **Compose**：`podman compose up -d`（Podman 3+ 内置 `compose` 子命令，底层调用 docker-compose 或 podman-compose 兼容 Compose 文件）。
- **systemd 集成**：容器即进程，可用 systemd 管理；推荐用 **Quadlet** 写 `.container` 单元，`systemctl --user start web` 即可跑容器并开机自启。
- **坑**：rootless 不能绑 1024 以下端口（要改 `sysctl net.ipv4.ip_unprivileged_port_start`）；首次用要配 subuid/subgid；非 Linux 平台靠 `podman machine` 跑虚拟机。

## 一、为什么需要 Daemonless

要理解 Podman，先看它要解决 Docker 架构的什么问题。Docker 是**客户端-守护进程**架构：

```
docker (CLI)  --REST API-->  dockerd (常驻守护进程，以 root 运行)
                                  │  管所有容器、镜像、网络、卷
                                  └─> containerd -> runc -> 你的容器进程
```

这套架构有两个长期被诟病的问题：

1. **dockerd 是 root 单点**：守护进程以 **root** 身份常驻，**所有容器**都归它管。一旦 dockerd 崩溃，所有容器变孤儿；一旦 dockerd 被攻破（历史上有提权 CVE），整个宿主沦陷。
2. **所有容器共享一个 root 监护者**：你 `docker run` 时，容器进程的父进程是 dockerd，不是你的 shell——这违背了 Unix「**进程即用户身份**」的传统，也让你无法用 systemd 之类进程管理器直接管容器。

Podman 的解法是**去掉守护进程**——直接让 `podman` 这个短命进程（fork-exec 模型）拉起容器：

```
你的 shell
   │  podman run -d nginx
   ▼
podman (短命进程，做完就退)
   │  调 conmon（container monitor）+ OCI 运行时（crun/runc）
   ▼
conmon (每容器一个，作为该容器父进程，负责 reap 僵尸、收日志)
   │
   ▼
你的容器进程 (作为 conmon 的子进程运行)
```

- **fork-exec**：Podman 命令做完就退出，不常驻。容器由独立的 **conmon**（container monitor）进程监护——conmon 负责 reap 子进程、收集容器日志、记录退出码。
- **无单点**：没有「一个守护进程管所有容器」——每个容器有自己的 conmon，互不影响。一个容器崩溃不会拖垮别的。
- **进程身份清晰**：容器进程的父进程是 conmon（你的用户身份），符合 Unix 传统，可用 systemd/cgroup 直接管理。

## 二、Rootless：非 root 跑容器

Docker 时代，跑容器要 sudo（因为 dockerd 是 root），这意味着「**能跑 docker ≈ 能提权到 root**」——这也是为什么很多服务器把 `docker` 组等同于 `sudo` 组。Podman 的 **Rootless 模式**让普通用户无需 sudo 就能跑容器：

- **核心机制：user namespace**。Linux 的 user namespace 允许在容器内创建一个**虚拟的 uid 映射**：

```
宿主视角（普通用户 alice，uid=1000）
   容器内的 root (uid 0)  ──映射──>  宿主的 alice (uid 1000)
   容器内的 uid 1          ──映射──>  宿主的 100000（alice 的 subuid 段）
   容器内的 uid 2          ──映射──>  宿主的 100001
   ...
```

- **`/etc/subuid` 与 `/etc/subgid`**：配置每个用户可用的 uid/gid 映射段。例如 `alice:100000:65536` 表示 alice 可把容器内的 uid 映射到宿主的 100000-165535 段。用 `usermod --add-subuids 100000-165535 --add-subgids 100000-165535 alice` 配置。
- **安全意义**：容器内的 root（uid 0）在宿主看来其实是普通用户 alice——**即便容器逃逸到宿主，攻击者拿到的只是 alice 的权限，不是 root**。这是 rootless 的核心价值：缩小爆炸半径。
- **Rootless 的限制**：
  - 不能绑定 **1024 以下端口**（特权端口）——除非改 `sysctl net.ipv4.ip_unprivileged_port_start=80`。
  - 部分存储驱动（如老 devicemapper）、网络模式（host 网络）rootless 受限——默认用 **fuse-overlayfs** + **slirp4netns/pasta** 网络栈。
  - 资源限制（如 `--cpus`、ulimits）部分支持（cgroup v2 时代改善很多）。
  - 用户态 NFS、某些 SELinux 策略需要额外配置。

## 三、Pod：一组共享网络的容器

Podman 原生支持 **Pod** 概念（这是它的名字来源——**Pod Manager**）。一个 Pod 是一组**共享网络命名空间与可选存储**的容器：

```bash
# 创建一个 pod（带一个 infra 容器持有网络命名空间）
podman pod create --name webapp -p 8080:80

# 往 pod 里加容器（共享网络，相互 localhost 直连）
podman run -d --pod webapp --name nginx docker.io/library/nginx:alpine
podman run -d --pod webapp --name log-sidecar fluent-bit:2.2

# nginx 与 log-sidecar 在同一 pod，相互可用 localhost 通信
podman pod ls
podman pod ps
podman pod start/stop/rm webapp
```

- **infra 容器**：每个 pod 有一个极小的「infra 容器」（默认 `k8s.gcr.io/pause`，几 MB），它持有 pod 的网络命名空间。其他容器加入这个命名空间，从而共享 IP/端口。
- **为什么需要 pod**：① **边车模式**——主容器 + 日志/监控/mesh sidecar 共享网络，localhost 直连；② **K8s 一致性**——Podman 的 pod 模型与 K8s 一致，`podman generate kube` 能把 pod 导成 K8s YAML，`podman play kube` 能从 K8s YAML 跑起来，是「本地→K8s」的平滑桥梁。
- **与 Docker 的区别**：Docker 没有原生 pod，容器间共享网络要用 `docker network create` + `--network` 共享，或 `--network=container:web` 这种 hack；Podman 的 pod 是一等公民。

## 四、CLI 兼容 Docker：迁移几乎无痛

Podman 的命令设计与 Docker **几乎一致**：

```bash
# 这些命令把 docker 换成 podman 直接可用
podman run -d --name web -p 8080:80 nginx:alpine
podman ps                              # 列容器（-a 含停止的）
podman images                          # 列镜像
podman pull / push / build / tag / rmi
podman logs / exec / inspect / stats
podman volume create/ls/rm             # 卷
podman network create/ls/rm/connect    # 网络
```

- **`alias docker=podman`**：很多人在 shell 配置里加这个别名，让所有现有脚本/docker 文档直接复用。多数场景工作良好。
- **不兼容点**（详见[兼容性章节](./guide-line/compatibility-and-ecosystem)）：
  - `podman build` 默认用 **Buildah** 后端（与 `docker build` 的 BuildKit 行为略有差异）。
  - 部分老 API/插件假设 dockerd socket（`/var/run/docker.sock`），Podman 提供 `podman.socket` 兼容该接口但需手动启用。
  - Docker Compose 的某些高级特性（如 `build.secrets`、跨平台 buildx）在 `podman compose` 上支持程度不同。
- **Compose 支持**：`podman compose up -d` 直接跑 `docker-compose.yml`（Podman 3+ 内置，底层调用 docker-compose 或 podman-compose）。

## 五、跑起第一个容器（Rootless）

完整体验一次 rootless 跑容器：

```bash
# 1.（首次用）确认 subuid/subgid 已配（rootless 必需）
cat /etc/subuid | grep $USER       # 应有形如 alice:100000:65536

# 2. 普通用户直接跑（无需 sudo！）
podman run -d --name web -p 8080:80 docker.io/library/nginx:alpine

# 3. 看状态
podman ps
podman logs web

# 4. 进容器调试
podman exec -it web sh

# 5. 清理
podman rm -f web

# 6. （生产）用 Quadlet 写 systemd 单元，开机自启
mkdir -p ~/.config/containers/systemd
cat > ~/.config/containers/systemd/web.container <<'EOF'
[Container]
Image=docker.io/library/nginx:alpine
PublishPort=8080:80
EOF
systemctl --user daemon-reload
systemctl --user start web
systemctl --user enable web    # 开机自启（还要 loginctl enable-linger $USER）
```

- **非 Linux 平台**：macOS/Windows 上 Podman 用 `podman machine` 跑一个 Linux 虚拟机（Podman 5.0 重写了 machine，性能与体验改善）。先 `podman machine init && podman machine start`。
- **`enable-linger`**：rootless 容器要开机自启，需 `loginctl enable-linger <user>` 让 systemd 在用户未登录时也保留 user session。

## 六、Podman vs Docker：何时选 Podman

- **选 Podman**：① 单机/小集群生产，追求 rootless 安全；② Red Hat 生态（RHEL/Fedora/CentOS 默认）；③ 想用 systemd 原生管理容器；④ 受合规约束不能有 root 守护进程。
- **选 Docker**：① 依赖 Docker Desktop GUI/生态；② 团队已熟练 dockerd；③ 用 Docker Swarm（Podman 无原生集群）；④ 第三方工具强依赖 dockerd socket。
- **选 K8s**：① 跨多机集群编排；② 需要自愈/滚动更新/自动伸缩。Podman 是**单机引擎**，不替代 K8s（K8s 的运行时是 CRI-O/containerd）。

## 下一步

理解了 daemonless/rootless/pod/CLI 兼容后，下一步深入两类核心机制——[Daemonless、Rootless 与 Pod](./guide-line/daemonless-and-pods)（架构细节、user namespace、Quadlet）与[兼容性与 Red Hat 生态](./guide-line/compatibility-and-ecosystem)（Docker/Compose/K8s 兼容、Buildah/Skopeo/CRI-O、SELinux）。
