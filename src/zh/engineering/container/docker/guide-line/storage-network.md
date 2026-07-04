---
layout: doc
outline: [2, 3]
---

# 指南 - 存储与网络

> 基于 Docker（Engine 2x / BuildKit 默认）· 核于 2026-07

## 速查

- **持久化三选项**：**volume（数据卷）**、**bind mount（绑定挂载）**、**tmpfs（内存）**；容器可写层默认**不持久**，删容器即丢。
- **volume**：Docker 托管、存在 `/var/lib/docker/volumes/`，性能好、可移植，**生产持久化数据首选**。
- **bind mount**：把**宿主任意路径**挂进容器，主机与容器双向可改，**开发热更新首选**（挂源码）。
- **tmpfs**：只存**内存**、断电/停容器即消失，适合临时文件与敏感数据。
- **两种挂载语法**：`-v 卷:/路径[:ro]`（简写）与 `--mount type=volume,src=,dst=,readonly`（明确、推荐）。
- **命名卷 vs 匿名卷**：`-v data:/db` 命名卷可复用；`-v /db` 匿名卷随机名、易被 prune。
- **网络驱动**：**bridge**（默认，单机）、**host**（共享宿主网络栈）、**none**（无网）、**overlay**（跨主机/Swarm）、**macvlan/ipvlan**（容器直接上物理网）。
- **默认 bridge vs 自定义 bridge**：默认 bridge **不能按容器名互访**；**自定义 bridge 自带内嵌 DNS（127.0.0.11）**，可用容器名直接通信——一律建自定义网络。
- **端口发布**：`-p 主机:容器`（`-P` 随机发布所有 EXPOSE 口）；`EXPOSE` 只是声明不发布。
- **host 网络**：容器直接用宿主端口、无端口映射、性能最好，但**牺牲隔离**、端口冲突风险。
- **命令**：`docker volume ls/inspect/prune`、`docker network create/ls/inspect/connect`。

## 一、为什么需要外挂存储

容器的可写层是"用完即弃"的——`docker rm` 一删，改动全没。而且它锁在容器里，别的容器拿不到、宿主也难直接读。所以凡是**要留下来的数据**（数据库文件、上传内容、日志）都必须挂到容器外。Docker 提供三种挂载：

```
        ┌──────────────── 容器 ────────────────┐
        │  [可写层]  ← 用完即弃，别放重要数据    │
        └───┬──────────┬──────────┬────────────┘
            │          │          │
       ┌────▼───┐  ┌───▼────┐  ┌──▼─────┐
       │ volume │  │  bind  │  │ tmpfs  │
       │Docker托管│ │宿主路径│  │  内存  │
       └────────┘  └────────┘  └────────┘
```

## 二、volume vs bind mount vs tmpfs

| 维度       | volume（数据卷）             | bind mount（绑定挂载）        | tmpfs                    |
| ---------- | ---------------------------- | ----------------------------- | ------------------------ |
| 数据位置   | Docker 管理区 `/var/lib/docker/volumes/` | 宿主**任意路径**    | 宿主**内存**             |
| 谁管理     | Docker daemon                | 你自己（宿主文件系统）        | 内核                     |
| 持久性     | 持久（删容器仍在）           | 持久（就是宿主文件）          | **临时**，停容器即消失   |
| 性能       | 接近原生（Linux 上）         | 接近原生                      | 最快（内存）             |
| 可移植     | 好（`docker volume` 统管）   | 差（依赖宿主目录结构）        | -                        |
| 典型用途   | **生产数据库/持久数据**      | **开发挂源码**、挂配置文件    | 临时缓存、密钥、敏感数据 |

::: warning 别直接动 volume 的宿主目录
volume 的数据虽在 `/var/lib/docker/volumes/` 下，但**直接从宿主读写它是未定义行为**、可能损坏卷。要访问卷内容请通过容器（`docker run --rm -v vol:/data alpine ls /data`）。bind mount 才是"我就想主机容器共读同一目录"的正解。
:::

### volume：Docker 托管的持久卷

```bash
docker volume create pgdata                # 建命名卷
docker volume ls                           # 列出
docker volume inspect pgdata               # 看挂载点/驱动
docker volume prune                        # 删所有没被使用的卷

# 用命名卷跑 postgres，数据落在卷里，删容器不丢
docker run -d --name pg \
  -v pgdata:/var/lib/postgresql/data \
  -e POSTGRES_PASSWORD=secret \
  postgres:17

# --mount 等价写法（更明确，推荐脚本里用）
docker run -d --name pg \
  --mount type=volume,src=pgdata,dst=/var/lib/postgresql/data \
  -e POSTGRES_PASSWORD=secret postgres:17
```

- **命名卷**：`-v pgdata:/path`，名字固定、可复用、跨容器共享。
- **匿名卷**：`-v /path`（不给名），Docker 随机命名，容器删了往往就成了悬空卷，`docker volume prune` 会清掉。

### bind mount：挂宿主目录（开发利器）

把宿主目录直接映射进容器，两边看到同一份文件——改宿主源码，容器内立即可见（配合热重载）：

```bash
# 开发：挂当前目录源码进容器
docker run -it --rm \
  -v "$(pwd)":/app \
  -w /app \
  node:22-alpine sh

# --mount 写法 + 只读
docker run --rm \
  --mount type=bind,src="$(pwd)"/config,dst=/etc/app,readonly \
  my-app
```

`-v` 里加 `:ro` 或 `--mount` 里加 `readonly` 表示**容器只读**（防止容器改宿主文件）。

### tmpfs：内存临时挂载

```bash
docker run -d --tmpfs /tmp:size=64m,mode=1777 my-app
# 或
docker run -d --mount type=tmpfs,dst=/tmp,tmpfs-size=64m my-app
```

数据只在内存、停容器即消失，适合放临时文件、`/tmp`、或不想落盘的敏感数据。

### -v 与 --mount 怎么选

- `-v src:dst:opts`：短、老、开发手敲方便；但 bind mount 时若 src 宿主路径不存在，`-v` 会**自动建成空目录**（易踩坑）。
- `--mount key=value,...`：长、明确、出错更早报错（bind 源不存在直接报错），**脚本/生产推荐**。

## 三、容器网络驱动

`docker network ls` 默认能看到 `bridge`、`host`、`none` 三个内置网络。驱动全景：

| 驱动      | 作用                                       | 场景                         |
| --------- | ------------------------------------------ | ---------------------------- |
| `bridge`  | 默认，单机上建虚拟网桥 `docker0`，容器接入 | 单机多容器互联（最常用）     |
| `host`    | 去掉网络隔离，容器直接用宿主网络栈         | 极致网络性能、端口不映射     |
| `none`    | 只有 loopback，彻底断网                    | 最高隔离、纯计算任务         |
| `overlay` | 跨多台 Docker 主机组网（VXLAN）            | Swarm 集群 / 多主机服务      |
| `macvlan` | 给容器分配 MAC，像物理设备直连局域网       | 容器要有独立 IP 出现在 LAN   |
| `ipvlan`  | 接入外部 VLAN，不分独立 MAC                | 与既有网络设施集成           |

### 默认 bridge vs 自定义 bridge（关键差异）

- **默认 bridge**（`docker run` 不指定 `--network` 时）：容器间**只能靠 IP 互访，不能用容器名**——因为它没有内嵌 DNS 服务。
- **自定义 bridge**（`docker network create` 建的）：Docker 给它配了**内嵌 DNS 服务器（`127.0.0.11`）**，同网络的容器可以**直接用容器名当主机名互相访问**。

```bash
# 建自定义网络
docker network create app-net

# 两个容器接同一网络
docker run -d --name db  --network app-net postgres:17
docker run -d --name api --network app-net my-api

# api 容器里可直接连 "db"（容器名即 DNS 名），无需知道 IP：
#   DATABASE_URL=postgres://db:5432/mydb
```

::: tip 结论：永远建自定义网络
默认 bridge 只是为了向后兼容而保留，不能按名解析、隔离也弱。**只要多个容器要互联，就 `docker network create` 一个自定义 bridge**，用容器名通信、彼此隔离于其它网络。Docker Compose 会**自动**为每个项目建一个自定义网络，服务名即 DNS 名，所以 Compose 里天然能用服务名互访。
:::

### host 与 none

```bash
# host：容器直接用宿主网络，无需 -p，nginx 的 80 就是宿主的 80
docker run -d --network host nginx:alpine

# none：完全无网络，只有 lo
docker run --rm --network none alpine ip addr
```

`host` 性能最好（省掉 NAT/端口映射），但**放弃网络隔离**、端口直接和宿主抢，且在 macOS/Windows 的 Docker Desktop 上语义受限（daemon 跑在 Linux VM 里）。

## 四、端口发布

容器内的监听端口默认**外部访问不到**，要显式"发布"到宿主。

```bash
docker run -d -p 8080:80 nginx            # 宿主 8080 → 容器 80
docker run -d -p 127.0.0.1:8080:80 nginx  # 只绑本机回环（不对外网暴露）
docker run -d -p 8080:80/udp my-app       # 指定 UDP
docker run -d -P nginx                     # 大写 -P：把所有 EXPOSE 的口随机映射到高位端口
```

- 格式：`-p [宿主IP:]宿主端口:容器端口[/协议]`。
- `EXPOSE` 是 Dockerfile 里的**声明**（文档 + 配合 `-P`），**本身不发布**；发布靠 `-p`/`-P`。
- 查实际映射：`docker port <容器>`。

::: warning 发布端口绕过宿主防火墙
Docker 直接改 iptables/nftables 把发布端口打通，`-p 0.0.0.0:5432:5432` 会让数据库**对整个网络暴露**，常见的 UFW 规则也可能被绕过。生产上：只发布必要端口、优先绑 `127.0.0.1`、库/缓存这类内部服务**根本不发布**（走自定义网络容器名互访即可）。
:::

## 五、常用网络命令

```bash
docker network ls                          # 列出网络
docker network create --driver bridge app-net   # 建自定义 bridge
docker network inspect app-net             # 看网段/接入的容器/DNS
docker network connect app-net web         # 把已运行容器接入网络
docker network disconnect app-net web      # 断开
docker network prune                       # 删无用网络
docker run --network app-net ...           # 启动即指定网络
```

## 下一步

- bridge/overlay 背后靠 network namespace 隔离，原理见 [引擎架构](./architecture.md#四、namespaces--cgroups)。
- 卷、CoW 与镜像分层如何协作见 [引擎架构](./architecture.md#三、overlay2-与写时复制)。
- 数据/网络的生产安全基线见 [最佳实践](./best-practice.md)。
- 命令速查见 [参考](../reference.md#网络命令)。
