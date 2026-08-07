---
layout: doc
outline: [2, 3]
---

# Daemonless、Rootless 与 Pod：架构与 systemd 集成

> 基于 Podman 5.x · 核于 2026-08

## 速查

- **Daemonless 架构**：Podman 命令是**短命进程**（fork-exec），不常驻；每个容器由独立的 **conmon（container monitor）** 进程监护，conmon 是容器进程的父进程，负责 reap 僵尸、收日志、记退出码。没有「一个守护进程管所有容器」的单点。
- **vs dockerd**：dockerd 以 root 常驻、统管一切（单点 + 提权目标）；Podman 无此进程，容器作为调用者子进程运行（身份清晰、可用 systemd 管）。
- **Rootless 靠 user namespace**：`/etc/subuid`/`/etc/subgid` 配置用户映射段；容器内 uid 0 映射到宿主普通用户，uid 1+ 映射到 subuid 段。容器逃逸后宿主侧仍是非特权用户——**缩小爆炸半径**。
- **Rootless 限制**：① 不能绑 1024 以下端口（除非调 `sysctl net.ipv4.ip_unprivileged_port_start`）；② 存储默认 fuse-overlayfs，网络默认 slirp4netns/pasta；③ 部分资源限制（cgroup）支持受限（cgroup v2 时代已大幅改善）。
- **Pod = 共享网络的一组容器**：每个 pod 有一个 **infra 容器**（pause 镜像，几 MB）持有网络命名空间，其他容器加入；同 pod 容器 localhost 直连。模型与 K8s Pod 一致。
- **systemd 集成两条路**：① **传统**——`podman generate systemd --new` 生成 unit 文件（Podman 4 之前主流）；② **Quadlet（Podman 4.4+ 推荐）**——写 `.container`/`.pod`/`.network`/`.volume`/`.kube` 单元，systemd 启动时自动转成 service，是声明式、官方推荐的现代方式。
- **Quadlet 单元**：放 `~/.config/containers/systemd/`（rootless）或 `/etc/containers/systemd/`（rootful）。systemd 重载后自动生成 `.service`，`systemctl --user start web` 即跑容器。
- **`enable-linger`**：rootless 容器开机自启的前提——`loginctl enable-linger <user>` 让 user systemd 在用户未登录时也常驻。
- **坑**：rootless 不支持 `--privileged`（用 `--cap-add` 精细授权）；rootless 容器无法访问宿主 root-only 资源；Quadlet 改完要 `systemctl --user daemon-reload`。

## 一、Daemonless 架构：fork-exec 与 conmon

Podman 没有 dockerd 这样的常驻守护进程。每条 `podman run` 都是一次 fork-exec：

```
用户 shell (uid=1000, 普通用户)
   │  $ podman run -d nginx
   ▼
podman 进程（短命：解析参数、找镜像、配好 cgroup/namespace，做完即退出）
   │  fork
   ▼
conmon（container monitor，每容器一个）
   │  调用 OCI 运行时 crun/runc 创建容器
   ▼
nginx 主进程（容器内 PID 1，作为 conmon 的子进程）
```

各组件职责：

- **podman**：CLI 工具，命令式入口。解析参数、查找/拉取镜像、配置 namespaces/cgroups、调用运行时创建容器，**做完即退出**。它不是守护进程。
- **conmon（container monitor）**：每个容器一个 conmon 进程，它是容器主进程的**父进程**。职责：① **reap 僵尸子进程**（容器内 fork 出的进程退出后由 conmon 回收）；② **收集容器日志**（接 containerd 的日志管道或直接读 fifo）；③ **记录容器退出码**；④ **响应 attach/exec**。
- **OCI 运行时（crun/runc）**：真正调用 `clone()`/`unshare()` 创建 namespaces、设置 cgroups、`exec` 容器进程的低层工具。crun（C 实现）是 Red Hat 系默认，runc（Go 实现）是 Docker 系默认。
- **无单点**：容器崩溃只影响它自己的 conmon，不会像 dockerd 崩溃那样让所有容器变孤儿。整个 Podman 没有「全集群命脉」式的进程。

### 为什么这比 dockerd 优雅

- **进程身份清晰**：容器进程的父链是 `shell → podman → conmon → 容器进程`，完全在用户身份下，符合 Unix 传统。systemd、cgroup、`ps` 等工具能直接看到、管理。
- **可用 systemd 原生管**：既然容器就是普通进程，systemd 能像管任何服务一样管它——依赖、重启策略、日志（journald）、资源限制（slice）全部原生支持，不需要 `restart: always` 这种 Docker 自有的重启逻辑。
- **安全**：没有 root 常驻进程作为提权目标。Rootless 模式下整个链路（podman/conmon/容器）都是普通用户身份。

## 二、Rootless：user namespace 详解

Rootless 容器的核心是 Linux 的 **user namespace**——它允许在容器内创建一个独立的 uid/gid 视图，把宿主的普通用户「伪装」成容器内的 root。

### 映射原理

```
┌─────────────── 宿主视角 ───────────────┐   ┌─────── 容器内视角 ───────┐
│ alice  uid=1000  (普通用户)             │   │ root   uid=0             │ ←── 容器内是 root
│ （subuid 段 100000-165535 归 alice）    │   │ uid 1  → 宿主 100000     │
│                                         │   │ uid 2  → 宿主 100001     │
└─────────────────────────────────────────┘   │ ...                      │
                                              └──────────────────────────┘
配置：/etc/subuid   alice:100000:65536
      /etc/subgid   alice:100000:65536
```

- 容器内的 uid 0（root）在宿主看来其实是 alice（uid 1000）；容器内 uid 1、2、3... 映射到 alice 在 subuid 里分配的 100000、100001、100002...。
- **安全意义**：即便攻击者在容器内拿到 root，逃逸到宿主时拿到的身份只是 alice（普通用户）——他能造成的破坏被限制在 alice 的权限范围内，**不是宿主 root**。这就是 rootless 的「最小爆炸半径」。
- **配置 subuid/subgid**：
  ```bash
  # 给 alice 分配 65536 个映射 uid/gid（100000-165535）
  sudo usermod --add-subuids 100000-165535 --add-subgids 100000-165535 alice
  # 或用 podman 自带工具
  podman system migrate   # 应用配置
  ```

### Rootless 的存储与网络

Rootless 不能用需要 root 的内核特性，所以存储/网络驱动有限制：

- **存储驱动**：默认 **fuse-overlayfs**（用户态实现 overlay）或 **vfs**（直接拷贝，慢但兼容）。不能用 devicemapper（需要 root 配置块设备）。
- **网络**：默认 **slirp4netns** 或 **pasta**（Podman 4.5+ 默认 pasta）——用户态网络栈，把容器网络流量代理到宿主。性能略低于 root 的 bridge，但隔离性更好。host 网络模式 rootless 受限。
- **端口**：不能绑定 1024 以下（特权端口）。要绑 80/443 需：
  ```bash
  sudo sysctl -w net.ipv4.ip_unprivileged_port_start=80
  # 持久化写 /etc/sysctl.d/
  ```

### Rootless 的能力边界

- **不支持 `--privileged`**：rootless 无法获得宿主 root，`--privileged` 在 rootless 下被降级。要加权限用 `--cap-add CAP_NET_ADMIN` 这种精细授权。
- **cgroup 限制**：rootless 对 CPU/内存限制支持依赖 **cgroup v2 + systemd**（Delegated cgroup）。cgroup v1 时代 rootless 资源限制几乎不可用，v2 时代已大幅改善但仍非全功能。
- **挂载宿主目录**：可以（`-v ./data:/data`），但目录的宿主 uid 必须在映射段内，否则容器内看到的文件属主是「nobody」。

## 三、Pod：共享网络的容器组

Podman 的 Pod 是一组**共享网络命名空间与可选存储**的容器，模型直接源自 K8s：

```bash
# 1. 创建 pod（自动创建一个 infra 容器持有网络命名空间）
podman pod create --name webapp -p 8080:80

# 2. 加容器（--pod 加入该 pod，共享网络）
podman run -d --pod webapp --name app myapp:1.0
podman run -d --pod webapp --name log-collector fluent-bit:2.2

# 3. app 与 log-collector 在同一 pod
#    → 共享 localhost，相互可用 127.0.0.1 直连

# 4. 管理（pod 作为整体启停）
podman pod start webapp
podman pod stop webapp
podman pod rm webapp
```

- **infra 容器**：每个 pod 第一个创建的是一个极小的「infra 容器」（默认镜像 `registry.k8s.io/pause`，几 MB，只 `pause()` 睡眠）。它持有 pod 的**网络命名空间**（与 IPC 命名空间）。后续加入 pod 的容器都 `--network=container:<infra>`，共享这套网络。
- **共享什么**：网络（IP、端口空间、localhost）、IPC（可选）、卷（可选 `--pod` 创建时挂共享卷）。**不共享** mount/PID/UTS（这些命名空间每个容器独立）。
- **边车模式**：主容器（如 web app）+ 辅助容器（日志收集、metrics exporter、service mesh proxy）同处一 pod——主容器把日志写到共享卷或 localhost socket，sidecar 读取转发。这与 K8s 的 sidecar 模式完全一致。
- **K8s 桥梁**：`podman generate kube webapp > webapp.yaml` 把 pod 导出成 K8s YAML；`podman play kube webapp.yaml` 从 K8s YAML 跑起 pod。这是「本地开发用 Podman、生产上 K8s」的平滑过渡桥梁。

## 四、systemd 集成：Quadlet（推荐）

既然 Podman 容器是普通进程，systemd 是 Linux 的事实进程管理器，二者结合是天然选择。Podman 4.4+ 引入 **Quadlet**，让你**声明式**地用 systemd 单元跑容器，取代旧的 `podman generate systemd`。

### Quadlet 单元类型

| 文件类型 | 作用 | 示例 |
| --- | --- | --- |
| `.container` | 跑一个容器（最常用） | `web.container` |
| `.pod` | 定义一个 pod | `webapp.pod` |
| `.network` | 定义一个网络 | `mynet.network` |
| `.volume` | 定义一个卷 | `data.volume` |
| `.kube` | 从 K8s YAML 跑（`podman play kube`） | `app.kube` |
| `.image` | 拉取镜像（Podman 5.6+） | `busybox.image` |
| `.artifact` | 管理 OCI 工件（Podman 5.7+） | `data.artifact` |

### `.container` 单元示例

```ini
# ~/.config/containers/systemd/web.container（rootless）
# 或 /etc/containers/systemd/web.container（rootful）

[Container]
Image=docker.io/library/nginx:alpine
ContainerName=web
PublishPort=8080:80
Environment=NGINX_HOST=example.com
Volume=./html:/usr/share/nginx/html:Z

[Service]
# Quadlet 自动生成 [Service] 区，通常不用手写
Restart=always

[Install]
WantedBy=default.target    # rootless 用 default.target；rootful 用 multi-user.target
```

```bash
# 启用流程（rootless）
systemctl --user daemon-reload          # Quadlet 在启动时把 .container 转成 .service
systemctl --user start web
systemctl --user enable web             # 开机自启

# 前提：让 user systemd 在未登录时也常驻
loginctl enable-linger $USER
```

### Quadlet vs 旧 `podman generate systemd`

- **旧方式**（Podman 4 之前）：`podman generate systemd --new --name web > web.service`，手写生成、手动维护 unit 文件——冗长易错，已**不推荐**（Podman 5 仍在但标记弃用）。
- **Quadlet**（Podman 4.4+）：你只写简短的 `.container`，Quadlet 在 systemd 启动时自动渲染成完整 `.service`——声明式、自动跟随镜像更新、与 systemd 深度集成（依赖、Restart、journal 日志、slice 资源限制）。

### 与 Docker `restart: always` 的对比

Docker 的 `restart: always` 是 dockerd 自己的重启策略——dockerd 监测容器退出后重启它。Podman/Quadlet 则把重启交给 **systemd** 的 `Restart=` 指令，复用 systemd 几十年成熟的进程管理（依赖顺序、退避策略、资源限制、日志聚合到 journald）。后者更符合「Linux 原生」哲学，也是 Red Hat 推 Podman 的核心理由之一。

## 五、何时用 Rootless / Pod / Quadlet

- **Rootless 适用**：单机生产、CI runner、多租户共享主机、对安全（防逃逸）敏感的场景。
- **Pod 适用**：需要边车模式、需要与 K8s 模型一致便于迁移、需要一组容器共享网络的场景。
- **Quadlet 适用**：所有需要长期运行、开机自启、与 systemd 集成的 Podman 生产部署——已取代旧 `generate systemd`。

## 下一步

理解了 daemonless/rootless/pod/Quadlet 后，下一步进入[兼容性与 Red Hat 生态](./compatibility-and-ecosystem)：Docker CLI/Compose 兼容细节、Kubernetes YAML 导入导出、Buildah/Skopeo/CRI-O 三件套、SELinux 集成。
