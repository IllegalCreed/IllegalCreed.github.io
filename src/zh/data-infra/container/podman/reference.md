---
layout: doc
outline: [2, 3]
---

# 参考：Podman 命令、Quadlet 与生态速查

> 基于 Podman 5.x · 核于 2026-08

## 速查

- **架构**：Daemonless（无 dockerd）+ fork-exec + conmon 监护；rootless 靠 user namespace。
- **核心对象**：容器（container）、镜像（image）、**Pod**（共享网络的一组容器）、卷、网络。
- **CLI 兼容**：`run/ps/images/build/pull/push/logs/exec` 与 docker 一致；`alias docker=podman`。
- **Compose**：`podman compose up -d`（需装 docker-compose 或 podman-compose）。
- **systemd**：**Quadlet** `.container`/`.pod` 单元（Podman 4.4+ 推荐）。
- **Rootless 前置**：配 `/etc/subuid`/`/etc/subgid`；`loginctl enable-linger` 让 user systemd 常驻。
- **K8s 互操作**：`podman generate kube` / `podman play kube`。
- **三件套**：Podman（运行）+ Buildah（构建）+ Skopeo（传输）；CRI-O = K8s 运行时。
- **安全**：rootless（user namespace）+ SELinux（标签）+ capabilities 最小化。
- **版本**：2026 年 8 月主流 5.x（5.0=2024，5.6+ 强化 Quadlet，5.7+ `.artifact`）。
- **定位**：单机运行时/开发；不替代 K8s（集群用 CRI-O/K8s）。

## 一、命令速查

```bash
# —— 容器 ——
podman run -d --name web -p 8080:80 -v ./html:/usr/share/nginx/html:Z nginx:alpine
podman ps [-a]                          # 列容器（-a 含停止）
podman logs [-f] web                    # 日志
podman exec -it web sh                  # 进容器
podman inspect web                      # 详情
podman stats                            # 资源占用
podman rm -f web                        # 删容器

# —— 镜像 ——
podman images
podman pull docker.io/library/nginx:alpine
podman push registry.example.com/nginx:alpine
podman build -t myapp:1.0 .
podman tag / rmi / history / save / load

# —— 卷与网络 ——
podman volume create/ls/rm/inspect
podman network create/ls/rm/connect/inspect

# —— Pod ——
podman pod create --name webapp -p 8080:80
podman run -d --pod webapp --name app nginx:alpine
podman pod ls / ps
podman pod start/stop/rm webapp

# —— Compose ——
podman compose up -d [-f compose.yml]
podman compose logs -f
podman compose down

# —— K8s 互操作 ——
podman generate kube webapp > webapp.yaml   # 导出 K8s YAML
podman play kube webapp.yaml                # 从 K8s YAML 跑

# —— Rootless 配置 ——
cat /etc/subuid | grep $USER             # 检查映射段
sudo usermod --add-subuids 100000-165535 --add-subgids 100000-165535 $USER
podman system migrate                    # 应用 subuid 改动
loginctl enable-linger $USER             # rootless 开机自启前提

# —— 远程 / 其他 ——
podman system connection add remote ssh://user@host/run/podman/podman.sock
podman machine init && podman machine start   # macOS/Windows 启 VM
```

## 二、Quadlet 单元模板

### `.container`（最常用）

```ini
# ~/.config/containers/systemd/web.container（rootless）
# /etc/containers/systemd/web.container（rootful）

[Container]
Image=docker.io/library/nginx:alpine
ContainerName=web
PublishPort=8080:80
Environment=NGINX_HOST=example.com
Volume=./html:/usr/share/nginx/html:Z
AutoUpdate=registry             # 镜像更新自动拉取重启

[Service]
Restart=always

[Install]
WantedBy=default.target         # rootless；rootful 用 multi-user.target
```

### `.pod`

```ini
# webapp.pod
[Pod]
PodName=webapp
PublishPort=8080:80

[Install]
WantedBy=default.target
```

启用：`systemctl --user daemon-reload && systemctl --user start web`（rootless）。

## 三、Rootless 配置速查

```bash
# 1. 分配 subuid/subgid 段（首次使用必需）
sudo usermod --add-subuids 100000-165535 --add-subgids 100000-165535 alice
# 或手动写 /etc/subuid /etc/subgid：alice:100000:65536

# 2. 应用配置
podman system migrate

# 3. 让 1024 以下端口可用（可选）
echo "net.ipv4.ip_unprivileged_port_start=80" | sudo tee /etc/sysctl.d/podman.conf
sudo sysctl --system

# 4. 开机自启前提：user systemd 常驻
loginctl enable-linger alice
```

## 四、易错点清单

- **"Podman 跑容器要 sudo"**：错。Podman 默认 **rootless**，普通用户直接跑（前提是 subuid/subgid 已配）。
- **"Podman 有守护进程"**：错。Podman 是 **daemonless**——命令做完即退，容器由 conmon 监护，无常驻守护进程。
- **"rootless 容器内是 root，逃逸就是宿主 root"**：错。容器内 uid 0 经 user namespace 映射到宿主**普通用户**，逃逸后仍是低权限。
- **"rootless 能绑 80 端口"**：默认不能（1024 以下特权端口）。要改 `sysctl net.ipv4.ip_unprivileged_port_start`。
- **"rootless 支持 `--privileged`"**：被降级。rootless 无法获得宿主 root，要加权限用 `--cap-add`。
- **"Podman pod 等于 Docker 网络"**：不完全。pod 是一组**共享网络命名空间**的容器（同 localhost），Docker 网络是隔离命名空间靠 DNS 互访——模型不同。
- **"Podman 能替代 K8s"**：错。Podman 是**单机**引擎，无集群编排/自愈/HPA；集群用 K8s（CRI-O/containerd 作运行时）。
- **"Quadlet 改完立刻生效"**：要 `systemctl --user daemon-reload`（systemd 才会重新扫描 `.container`）。
- **"rootless 容器开机自启只要 `enable`"**：还要 `loginctl enable-linger <user>`，否则用户登出后 user systemd 关闭，容器跟着停。
- **"Podman 镜像和 Docker 镜像不互通"**：错。都用 OCI 镜像格式，同一 registry 同一镜像可被两者互相拉取运行。
- **"挂载卷容器读不到文件"**：SELinux 系统上要加 `:Z`（私有标签）或 `:z`（共享）——`-v ./data:/data:Z`，否则 SELinux 拦截。
- **"`podman ps` 看不到别的用户的容器"**：正常。daemonless 下每个用户的容器独立，互不可见（不像 dockerd 全局可见）。

## 五、与 Docker / Kubernetes / CRI-O 对比

| 维度 | Docker | Podman | Kubernetes | CRI-O |
| --- | --- | --- | --- | --- |
| 架构 | 客户端 + dockerd 守护 | daemonless（fork-exec + conmon） | 控制面 + 工作节点 | CRI 运行时（K8s 节点） |
| 守护进程 | dockerd（root 常驻） | 无 | apiserver/etcd 等 | 无（被 kubelet 调） |
| Rootless | 部分（rootless mode 较新） | ✅ 原生、成熟 | N/A | N/A |
| Pod 概念 | 无原生 pod | ✅ 原生 pod | ✅ Pod 是核心 | ✅（实现 K8s Pod） |
| 规模 | 单机 | 单机 | 多机集群 | 集群节点 |
| systemd 集成 | 弱（dockerd 自管重启） | ✅ Quadlet 原生 | 弱 | 弱 |
| Compose | docker compose | podman compose | Helm/Kustomize | N/A |
| 默认平台 | 全平台 | RHEL 系默认；全平台（machine） | 全平台 | K8s 节点 |
| 用途 | 通用、生态最广 | 单机/安全/Red Hat 系 | 集群编排 | K8s 运行时 |

## 权威链接

- [Podman 官方文档](https://podman.io/docs)
- [Podman Rootless 指南](https://github.com/containers/podman/blob/main/docs/tutorials/rootless_tutorial.md)
- [Quadlet 文档](https://docs.podman.io/en/latest/markdown/podman-systemd.unit.5.html)
- [Buildah 官方](https://buildah.io/)
- [Skopeo 官方](https://github.com/containers/skopeo)
- [CRI-O 官方](https://cri-o.io/)
- [Podman Desktop（GUI）](https://podman-desktop.io/)
- [Rootless Containers 社区](https://rootlesscontaine.rs/)
- 本站幻灯片：<a href="/SlideStack/podman-slide/" target="_blank">Podman</a>
