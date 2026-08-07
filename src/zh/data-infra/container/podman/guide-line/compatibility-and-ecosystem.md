---
layout: doc
outline: [2, 3]
---

# 兼容性与 Red Hat 生态：Docker、Compose、K8s 与三件套

> 基于 Podman 5.x · 核于 2026-08

## 速查

- **CLI 兼容 Docker**：`run/ps/images/build/pull/push/logs/exec/inspect/volume/network` 等命令把 `docker` 换成 `podman` 几乎全部可用，`alias docker=podman` 多数场景直接工作。
- **Compose 兼容**：`podman compose up -d` 跑 `docker-compose.yml`（Podman 3+ 内置，底层调用 docker-compose v2 或 podman-compose）；少数高级特性（buildx、build secrets）支持程度不同。
- **docker.sock 兼容**：Podman 可暴露兼容 Docker API 的 socket（`systemctl enable --now podman.socket`），让依赖 `/var/run/docker.sock` 的工具（如 Portainer、部分 CI）能工作，但并非 100% API 等价。
- **Kubernetes 互操作**：`podman generate kube` 把 pod/容器导出成 K8s YAML；`podman play kube` 从 K8s YAML 跑起容器——本地用 Podman、生产上 K8s 的平滑桥梁。
- **Red Hat 容器三件套**：**Buildah**（构建镜像，比 `docker build` 更底层、可脚本化）、**Skopeo**（镜像复制/签名/校验，跨 registry 拷贝不靠本地缓存）、**Podman**（运行容器）——三者共享 `containers/storage`、`containers/image` 库，是 Red Hat 容器栈的骨干。
- **CRI-O**：Red Hat 主导的**Kubernetes 容器运行时**（实现 CRI 接口）——Podman 的「集群版兄弟」，让 K8s 节点跑容器时也是 daemonless 风格（无 dockerd/containerd）。OpenShift 默认用 CRI-O。
- **SELinux 集成**：Podman 默认给每个容器打 SELinux 标签（`system_u:system_r:container_t:s0:c1,c2`），即便容器逃逸也被 SELinux 策略限制——Red Hat 系（RHEL/Fedora/CentOS）默认开 SELinux，Podman 与之深度集成。
- **镜像兼容**：Podman 用 OCI 镜像格式，与 Docker 镜像**完全互通**（同一 registry、同一镜像可被 podman/docker 互相拉取运行）。
- **不兼容/差异点**：① `podman build` 默认 Buildah 后端，少数 Dockerfile 指令行为略有差异；② Docker Swarm、Docker Desktop 的 GUI、部分商业工具强依赖 dockerd；③ rootless 下 `--privileged` 被降级；④ Compose 的某些特性（如 `extends`、`buildx` 多架构构建）在 Podman 上需额外配置。
- **生态位**：Podman = **单机运行时 + 开发**；CRI-O = **K8s 运行时**；Buildah = **构建**；Skopeo = **传输**。Red Hat 系默认栈，Linux 发行版（Fedora/RHEL/CentOS）开箱预装。

## 一、与 Docker CLI 兼容：迁移几乎无痛

Podman 的命令设计刻意模仿 Docker，降低迁移成本：

```bash
# 这些命令把 docker 换成 podman 直接可用
podman run -d --name web -p 8080:80 nginx:alpine
podman ps [-a]                         # 列容器
podman images                          # 列镜像
podman pull docker.io/library/nginx:alpine
podman push / tag / rmi / build / history
podman logs / exec / inspect / stats / top
podman volume create/ls/rm/inspect
podman network create/ls/rm/connect/inspect
podman cp / commit / save / load
```

- **`alias docker=podman`**：在 `~/.bashrc`/`~/.zshrc` 加 `alias docker=podman`，让所有现有 docker 文档/脚本直接复用。Podman 官方曾用「**Podman for Docker**」（alias 标语）宣传这点。
- **命令行为差异**（少数）：
  - `podman ps` 默认只列当前用户的容器（rootless 与 root 的容器互不可见），docker 时代全归 dockerd 所以全局可见——这是 daemonless 架构的必然结果。
  - `podman build` 用 **Buildah** 后端，与 BuildKit 在缓存、多阶段、`--secret` 等细节上偶有差异。
  - 部分命令（如 `podman system connection`）是 Podman 独有，用于管理远程 Podman。

## 二、Docker Compose 兼容

Podman 支持 Compose 文件，让现有的 `docker-compose.yml` 直接跑：

```bash
# Podman 3+ 内置 compose 子命令（自动探测 docker-compose / podman-compose）
podman compose up -d
podman compose logs -f
podman compose down

# 指定文件
podman compose -f compose.prod.yml up -d
```

- **底层实现**：`podman compose` 不重写 Compose，而是**调用** `docker-compose`（v2，Go 实现，二进制名 `docker-compose`）或 `podman-compose`（Python 实现）。优先用前者（更成熟）。需要先安装其一。
- **兼容性现状**：基础特性（services、build、volumes、networks、env_file、depends_on、ports）工作良好。少数高级特性差异：
  - `buildx` 多架构构建：Podman 用其自有的多架构（`--platform`）支持，行为不完全等价。
  - `build.secrets`/`build.ssh`：Buildah 后端支持方式不同。
  - 部分与 dockerd socket 强绑定的 Compose 插件需手动适配。
- **替代方案**：Podman 原生的 **Quadlet**（`.container` 单元）是更「systemd 原生」的多服务定义方式——但需要手写单元文件，复用现有 Compose 文件时仍优先 `podman compose`。

## 三、Docker API（docker.sock）兼容

很多工具（Portainer、Watchtower、Jenkins Docker 插件、各种 GUI）依赖 dockerd 暴露的 `/var/run/docker.sock`。Podman 可暴露一个**兼容 Docker API 的 socket**：

```bash
# 启用 Podman 的兼容 socket（rootful）
sudo systemctl enable --now podman.socket
# socket 路径：/run/podman/podman.sock

# rootless
systemctl --user enable --now podman.socket
# socket 路径：/run/user/1000/podman/podman.sock

# 让依赖 docker.sock 的工具用 Podman（建软链或改配置）
# 注意：这是「兼容层」不是 100% API 等价，少数 API 端点不支持
```

- **不是完全等价**：Podman 的 Docker 兼容 API 覆盖大部分常用端点（容器/镜像/网络/卷的增删查改），但少数 dockerd 专有 API（如 Swarm 相关）不支持。
- **典型用例**：让 Portainer/Web GUI 连 Podman、让某些 CI 通过 socket 跑容器。

## 四、与 Kubernetes 互操作

Podman 与 K8s 的「Pod」概念同源，所以二者 YAML 互转很顺：

```bash
# 1. 从已运行的 pod 生成 K8s YAML
podman pod create --name webapp -p 8080:80
podman run -d --pod webapp --name app nginx:alpine
podman generate kube webapp > webapp.yaml   # 导出 K8s YAML

# 2. 从 K8s YAML 在本地跑起来（Podman 实现 Deployment/Service 的子集）
podman play kube webapp.yaml
```

- **`podman generate kube`**：把本地 pod/容器导出成 K8s Pod/Deployment + Service 的 YAML，可直接 `kubectl apply` 到集群（虽然生产 K8s 一般手写更精细的 YAML，但这是快速起手的好工具）。
- **`podman play kube`**：反向——读 K8s YAML（Pod/Deployment/Service），在本地用 Podman 跑起来。支持 Deployment（Podman 自己保证副本数）、Service、ConfigMap/Secret 挂载、PersistentVolumeClaim。
- **适用场景**：① 本地开发用 Podman 跑（轻量、rootless），生产上 K8s——同一份 YAML 两地复用；② 从 K8s 排查问题，本地用 Podman 复现；③ 把「单机 Podman 部署」演进到 K8s 集群。
- **局限**：`podman play kube` 不支持 K8s 的全部对象（如 CRD、Operator、复杂的 NetworkPolicy），主要是 Pod/Deployment/Service/ConfigMap/Secret/PVC 子集。

## 五、Red Hat 容器三件套：Buildah、Skopeo、Podman

Red Hat 的容器工具栈是**模块化**的——把「构建、传输、运行」拆成独立工具，各有专精，共享底层库（`containers/storage`、`containers/image`）：

### Buildah：构建镜像

```bash
# 1. 从 Dockerfile 构建（与 docker build 兼容）
buildah build -t myapp:1.0 .

# 2. 用脚本式命令构建（比 Dockerfile 更灵活）
container=$(buildah from alpine)
buildah run $container -- apk add --no-cache curl
buildah copy $container ./app /app
buildah config --cmd "/app/server" $container
buildah commit $container myapp:1.0
buildah rm $container
```

- **特点**：① **去 Dockerfile 化**——可用 shell 脚本构建，适合复杂/动态构建；② 不需要守护进程；③ 更细粒度控制每一步；④ 与 `podman build` 共享后端（`podman build` 内部就调 Buildah）。

### Skopeo：镜像复制与校验

```bash
# 在两个 registry 间直接复制镜像（不落本地缓存）
skopeo copy docker://docker.io/nginx:alpine docker://registry.example.com/nginx:alpine

# 检查镜像（不拉取，只读 manifest）
skopeo inspect docker://docker.io/nginx:alpine

# 签名/校验镜像
skopeo copy --sign-by dev@example.com docker://... dir:./local
```

- **特点**：① **跨 registry 直接拷贝**——不经本地 `pull/push`，省空间省带宽，适合 registry 迁移/同步；② **校验签名**——企业镜像安全（防篡改）的关键工具；③ 轻量、无守护进程。

### 三者关系

| 工具 | 职责 | 对应 Docker |
| --- | --- | --- |
| **Podman** | 运行容器（+ 管理 pod/卷/网络） | `docker run/ps/...` |
| **Buildah** | 构建镜像 | `docker build` |
| **Skopeo** | 镜像复制/传输/校验 | `docker pull/push`（强化版） |

这套模块化设计比 Docker「一个 dockerd 干所有事」更符合 Unix「**一个工具干好一件事**」的哲学，也是 Red Hat 在 RHEL 系默认推 Podman+Buildah+Skopeo 而非 dockerd 的原因。

## 六、CRI-O：Kubernetes 运行时

**CRI-O** 是 Red Hat 主导的 **Kubernetes 容器运行时**——它实现 K8s 的 **CRI（Container Runtime Interface）**，让 K8s 不依赖 dockerd/containerd 也能跑容器：

- **定位**：Podman 的「集群兄弟」。Podman 是单机 CLI，CRI-O 是 K8s 节点的运行时（被 kubelet 通过 CRI 调用）。
- **共享栈**：CRI-O 用同样的 OCI 运行时（runc/crun）、`containers/storage`、`containers/image` 库——与 Podman 同根。
- **去 dockerd 化**：早期 K8s 用 dockerd 作运行时（经 docker-shim），后来 K8s 弃用 docker（v1.24 移除 dockershim），转向 CRI-O 或 containerd。CRI-O 是 Red Hat / OpenShift 的默认选择。
- **不替代 Podman**：CRI-O 只服务于 K8s（无 CLI 给人用），日常 `run`/`ps` 仍用 Podman。二者分工：单机 = Podman，集群 = CRI-O。

## 七、SELinux 与安全集成

Red Hat 系（RHEL/Fedora/CentOS）默认开 SELinux，Podman 与之深度集成：

- **每个容器自动打 SELinux 标签**：`svirt_lxc_net_t` 类型 + 唯一的 MCS 类别（`s0:c1,c2`），即便容器逃逸到宿主，SELinux 策略也阻止它访问非授权文件。
- **挂载卷的 `:Z`/`:z` 标志**：`-v ./data:/data:Z` 让 Podman 自动给该卷打上与容器匹配的 SELinux 标签（`:Z` 私有，`:z` 共享）——这是 Podman/Docker 在 SELinux 系统上的必备技巧，否则容器读不到挂载的卷。
- **rootless + SELinux 双保险**：rootless 用 user namespace 限制 uid，SELinux 限制访问权限——二者叠加构成强纵深防御。

## 八、迁移决策：从 Docker 到 Podman

| 场景 | 是否好迁 | 备注 |
| --- | --- | --- |
| 单机 `docker run` 脚本 | ✅ 几乎零成本 | `alias docker=podman` |
| `docker-compose.yml` 部署 | ✅ 多数可用 | `podman compose` |
| CI 流水线（用 docker socket） | ⚠️ 需适配 | 启用 podman.socket，少数 API 差异 |
| 依赖 Docker Desktop GUI | ❌ 不适合 | Podman 有 Podman Desktop（开源）但生态较新 |
| Docker Swarm 集群 | ❌ 不适合 | Podman 无 Swarm，转 K8s 或用 Podman + 自定义编排 |
| K8s 节点运行时 | ✅ 用 CRI-O | 与 containerd 二选一 |

## 下一步

兼容性与生态讲完后，进入[参考](../reference)：命令速查、Quadlet 模板、rootless 配置、易错点、与 Docker/K8s/CRI-O 的对比表。
