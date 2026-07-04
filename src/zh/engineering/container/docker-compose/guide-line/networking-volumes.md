---
layout: doc
outline: [2, 3]
---

# 指南 - 网络与数据卷

> 基于 Docker Compose（V2 / Compose Spec）· 核于 2026-07

## 速查

- **默认网络**：`up` 自动创建 **`<项目名>_default`** 网络（项目名默认取目录名），**所有服务自动加入**，无需手动声明。
- **服务名即 DNS 主机名**：同网络的容器**用服务名互访**（`web` → `db`），走 Compose 内置 DNS。
- **用服务名，别用 IP**：容器重建 IP 会变，服务名始终稳定。
- **容器间用容器端口**：与 `ports` 发布无关；不发布端口也能内部互访。
- **自定义网络**：顶层 `networks:` 声明，服务用 `networks: [...]` 引用；`driver` 常见 `bridge`（单机默认）/ `overlay`（Swarm 多主机）。
- **`external: true`**：网络/卷需**预先存在**，Compose 不创建、不存在则报错。
- **`internal: true`**：网络对外隔离（无外部连通），适合纯内部服务。
- **`network_mode`** 与 `networks` **互斥**；可取 `bridge`/`host`/`none`/`service:<名>`/`container:<名>`。
- **三类存储**：**命名卷**（复用/持久，Docker 管理）、**绑定挂载**（宿主具体路径）、**tmpfs**（内存，不落盘）。
- **命名卷生命周期**：`up` 时若不存在则建、存在则复用；**`down` 默认不删**（数据保留），`down -v` 才删。
- **资源命名前缀**：网络/卷默认带 `<项目名>_` 前缀；顶层 `name:` 可指定真实名绕过前缀。

## 一、默认项目网络与服务发现

`docker compose up` 会**自动**为项目创建一个网络，名为 **`<项目名>_default`**（项目名默认取所在目录名，如目录 `myapp` → 网络 `myapp_default`）。你**不写任何 `networks:` 配置**，所有服务也都会加入这个默认网络。

在这个网络里，Compose 运行一个内置 DNS，**把每个服务名解析成对应容器的 IP**，于是容器之间**直接用服务名互访**：

```yaml
services:
  api:
    build: ./api
    # 代码里连数据库写 host = "db"，端口 = 5432（容器端口）
  db:
    image: postgres:17-alpine
```

```
api 容器内：  psql -h db -p 5432       ✅ 用服务名 db 作主机名
             psql -h 172.18.0.3        ❌ 别写 IP（重建即失效）
```

两个必记要点：

1. **服务名而非 IP**：容器重建（`up --force-recreate`、改配置）后 IP 会变，服务名保持稳定。
2. **容器端口而非宿主端口**：同网络内互访用目标服务**监听的容器端口**；`ports: "8080:5432"` 的 `8080` 只用于从宿主访问，与内部互访无关。哪怕完全不写 `ports`，`api` 也能连到 `db`。

## 二、自定义网络：分段与隔离

需要把服务分到不同网络（如把数据库与前端隔离）时，在**顶层 `networks:`** 声明，服务用 `networks:` 列表引用：

```yaml
services:
  frontend:
    image: nginx
    networks: [frontend]
  api:
    build: ./api
    networks: [frontend, backend]   # 同时接入两个网络，作为桥梁
  db:
    image: postgres:17-alpine
    networks: [backend]             # 只在 backend，前端无法直连

networks:
  frontend:
    driver: bridge
  backend:
    name: custom_backend            # 自定义真实名，绕过 <项目名>_ 前缀
    internal: true                  # 对外隔离：此网络内的容器无外部连通
```

关键属性：

| 属性 | 作用 |
| --- | --- |
| `driver` | `bridge`（单机默认）/ `overlay`（Swarm 多主机）/ `host` / `none` |
| `driver_opts` | 驱动相关选项 |
| `external: true` | 网络需**预先存在**，Compose 不创建、不存在则报错 |
| `internal: true` | 对外隔离网络（无外部连通） |
| `ipam` | 自定义子网 / 网关 / IP 范围（CIDR） |
| `name` | 给网络指定真实名字，绕过项目名前缀 |
| `attachable` | 允许非 Compose 容器手动接入 |

service 级还能给网络加别名和固定 IP：

```yaml
services:
  db:
    networks:
      backend:
        aliases: [database, pg]     # 额外 DNS 别名
        ipv4_address: 172.16.238.10 # 固定 IP（需配 ipam 子网）
```

## 三、network_mode 与多网络

```yaml
    network_mode: "service:proxy"   # 与目标服务「共享网络命名空间」（共用 localhost）
    # 其它取值：bridge / host / none / container:<容器名>
```

::: warning network_mode 与 networks 互斥
一个服务**要么**用 `networks:` 接入若干网络，**要么**用 `network_mode` 指定单一网络模式，二者不能同时出现。`network_mode: "service:X"` 让本服务与 X **共享网络栈**（同一 `localhost`、同一 IP），常见于 sidecar / 代理场景。
:::

## 四、三类数据存储：命名卷 / 绑定挂载 / tmpfs

容器可写层随容器删除而丢失，持久化必须靠挂载。Compose 支持三类：

| 类型 | 写法示例 | 数据存在哪 | 典型用途 |
| --- | --- | --- | --- |
| **命名卷** | `db-data:/var/lib/postgresql/data` | Docker 管理的卷区（`/var/lib/docker/volumes`） | 数据库等**需持久且不关心宿主路径**的数据 |
| **绑定挂载** | `./src:/app/src` | 宿主的**具体路径** | 开发时挂源码、挂配置文件 |
| **tmpfs** | `type: tmpfs` | **内存**，不落盘 | 临时/敏感数据，容器停止即消失 |

```yaml
services:
  db:
    image: postgres:17-alpine
    volumes:
      - db-data:/var/lib/postgresql/data   # 命名卷（顶层声明）
      - ./initdb:/docker-entrypoint-initdb.d:ro  # 绑定挂载，只读
      - type: tmpfs
        target: /tmp/cache                 # tmpfs 内存挂载

volumes:
  db-data:                                 # 顶层声明命名卷
```

选型经验：**持久数据用命名卷**（可移植、由 Docker 管理、性能好）；**开发挂源码/配置用绑定挂载**（宿主改动实时可见，但强耦合宿主路径）。

## 五、命名卷的生命周期与顶层 volumes

```yaml
volumes:
  db-data:                    # 最简：Compose 自动管理
  cache:
    driver: local
  logs:
    name: app_logs            # 自定义真实名，绕过 <项目名>_ 前缀
  shared:
    external: true            # 卷需预先存在（docker volume create），Compose 不创建
  host-mount:
    driver: local             # 用 local 驱动做 bind 到宿主具体路径
    driver_opts:
      type: none
      o: bind
      device: /srv/app-data
```

生命周期要点：

- **`up`**：命名卷不存在则创建、已存在则**复用**（保留旧数据）。
- **`down`**：**默认不删命名卷**——所以数据库数据能跨 `up`/`down` 存活。
- **`down -v`**：连命名卷、匿名卷一并删除（会丢数据，慎用；常用于重置本地开发数据）。
- **命名前缀**：卷默认命名为 `<项目名>_<卷名>`（如 `myapp_db-data`）；`name:` 可指定真实名绕过前缀。
- **`external: true`**：卷需**预先存在**，生命周期由外部管理，Compose 只引用不创建、不删除。

::: warning down vs down -v（最易误用的一对）
`docker compose down` 保留命名卷（数据安全）；`docker compose down -v` 才删卷。想彻底重置一个本地数据库，用 `down -v`；日常停服务用 `down` 即可，数据会留着。
:::

## 下一步

- service 级 `volumes`/`networks` 的短/长语法见 [服务配置](./services.md)。
- 变量插值、`profiles`、`COMPOSE_*` 见 [环境变量与插值](./environment.md)。
- 多文件叠加、`configs`/`secrets`、Watch 见 [进阶组合](./advanced.md)。
- 关键字与常见坑速查见 [参考](../reference.md)。
