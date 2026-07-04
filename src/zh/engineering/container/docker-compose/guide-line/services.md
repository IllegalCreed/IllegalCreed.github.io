---
layout: doc
outline: [2, 3]
---

# 指南 - 服务配置

> 基于 Docker Compose（V2 / Compose Spec）· 核于 2026-07

## 速查

- **服务二选一**：每个 service 至少要有 **`image`**（用现成镜像）或 **`build`**（从 Dockerfile 构建）之一；二者并存时，`image` 值作为构建产物的 **tag**。
- **`build` 长语法**：`context`（目录或 Git URL）/ `dockerfile` / `args`（构建期 ARG）/ `target`（多阶段目标）/ `cache_from` / `platforms` / `no_cache`。
- **`ports` 短语法**：`"[HOST:]CONTAINER[/PROTOCOL]"`，如 `"8080:80"`；只写 `"3000"` 则宿主随机分配。长语法用 `target`/`published`/`protocol`/`mode`。
- **端口铁律**：**容器间通信用 CONTAINER 端口**，`ports` 的 HOST 端口只给**外部**访问；`expose` 只声明内部端口、不发布到宿主。
- **`environment` 优先于 `env_file`**：同名冲突时前者赢；`environment` 里只写 `KEY`（不给值）表示**从宿主环境透传**。
- **`volumes`（service 级）**：短语法 `SOURCE:TARGET[:MODE]`（`ro`/`rw`/`z`/`Z`）；长语法 `type` 可为 `volume`/`bind`/`tmpfs`/`image`。
- **`depends_on` 默认只等「启动」不等「就绪」**——经典坑；要等就绪须 `condition: service_healthy` + 目标配 `healthcheck`。
- **`condition` 三值**：`service_started`（默认）/ `service_healthy` / `service_completed_successfully`（等依赖跑完退出码 0）。
- **`healthcheck`**：`test` 用 `CMD`（不经 shell）或 `CMD-SHELL`（经 `/bin/sh -c`）；退出码 **0=healthy、1=unhealthy**；默认 `interval` 30s、`timeout` 30s、`retries` 3、`start_period` 0s。
- **`restart` ≠ `deploy.restart_policy`**：`restart`（`no`默认/`always`/`on-failure`/`unless-stopped`）是 `up` 的运行时策略；`deploy.*` 主要面向 **Swarm**。
- **`entrypoint` 会重置镜像默认 `command`**；`container_name` 固定名后**无法 scale 超过 1**。

## 一、image 与 build：用现成镜像还是自己构建

```yaml
services:
  cache:
    image: redis:7-alpine          # [registry/][namespace/]repo[:tag|@digest]；本地无则拉取
  web:
    build: ./web                   # 简写：整个路径作为构建上下文，找上下文根的 Dockerfile
```

`build` 长语法覆盖构建的方方面面：

```yaml
    build:
      context: ./backend                 # 目录或 Git URL，默认项目目录 "."
      dockerfile: ../backend.Dockerfile  # 相对 context 解析
      args:                              # 构建期 ARG（等价 docker build --build-arg）
        GIT_COMMIT: cdc3b19
        NODE_VERSION: "22"
      target: prod                       # 多阶段构建只构建到 prod 这个 stage
      cache_from:                        # 缓存来源，加速 CI 构建
        - type=registry,ref=myrepo/app:cache
      platforms: ["linux/amd64", "linux/arm64"]  # 多架构
      no_cache: true                     # 禁用构建缓存
      pull: true                         # 每次强制拉取基础镜像
```

- **`build` 与 `image` 并存**：`image` 的值成为构建产物的 tag（`docker compose build` 后可 `push`）；没有 `image` 的服务无法 `push`，Compose 会警告。
- **拉取还是构建**由 `pull_policy` 决定：`always`/`never`/`missing`/`build`/`daily`/`weekly`/`every_<duration>`。
- 构建触发：`docker compose build`、`docker compose up --build`，或某些 `pull_policy` 下自动构建。

## 二、ports 与 expose：谁能访问到

```yaml
    ports:
      - "8080:80"           # 短语法 [HOST:]CONTAINER[/PROTOCOL]
      - "127.0.0.1:5432:5432"  # 只绑本机回环，不对外网暴露（安全）
      - "3000"              # 只给容器端口，宿主随机
      - "6060:6060/udp"     # 指定协议
      - target: 80          # 长语法（更可读、可控 host_ip/mode）
        published: 8080
        host_ip: 127.0.0.1
        protocol: tcp
        mode: host          # host（直连宿主）或 ingress（Swarm 负载均衡）
    expose:
      - "5432"              # 仅声明容器内部端口，不发布到宿主
```

::: warning 端口语义：CONTAINER vs HOST（高频坑）
- **容器之间通信，用容器端口（CONTAINER_PORT）**，走服务名 DNS，与 `ports` 是否发布无关——哪怕完全不写 `ports`，同网络的服务照样互访。
- **`ports` 的宿主端口（HOST_PORT）只用于从宿主/外部访问**。
- 内部服务（数据库、Redis）**不必发布端口**；若要发布，绑到 `127.0.0.1` 而非默认的 `0.0.0.0`，否则会绕过防火墙对整个网络暴露。
:::

## 三、environment 与 env_file：给容器注入变量

```yaml
    environment:            # 可用 map 或 array 两种写法
      NODE_ENV: production
      DEBUG: "app:*"
      HOST_PROXY:           # 不给值 = 从「宿主环境」透传同名变量
    env_file:
      - ./default.env        # 从文件批量读入
      - path: ./secret.env   # 长语法
        required: false      # 文件不存在也不报错（默认 required: true）
```

- 两种写法：`environment` 用 `KEY: VALUE` 映射，或 `- KEY=VALUE` 数组。
- **只写 `KEY`（不带值）= 从宿主环境透传**该变量进容器。
- **同名冲突时 `environment` 优先于 `env_file`**。
- 注意区分：`env_file` 是「把文件里的变量注入容器」；而项目根的 `.env` 是「给 compose 文件做插值」——两者不是一回事（详见 [环境变量与插值](./environment.md)）。

## 四、volumes：service 级挂载

```yaml
    volumes:
      - db-data:/var/lib/postgresql/data    # 短语法：命名卷（需在顶层 volumes 声明）
      - ./html:/usr/share/nginx/html:ro     # 绑定挂载宿主目录，只读
      - /var/run/docker.sock:/var/run/docker.sock  # 挂宿主文件
      - type: volume                        # 长语法，语义更清晰
        source: db-data
        target: /data
        read_only: true
```

- 短语法 `SOURCE:TARGET[:MODE]`，`MODE`：`rw`（默认）/ `ro` / `z` / `Z`（SELinux 共享/私有标记）。
- 长语法 `type`：`volume`（命名卷）/ `bind`（绑定挂载）/ `tmpfs`（内存）/ `image` / `npipe` / `cluster`。
- 命名卷需在**顶层 `volumes:`** 声明；绑定挂载的宿主路径相对 compose 文件解析。命名卷 vs 绑定挂载的取舍与生命周期见 [网络与数据卷](./networking-volumes.md)。

## 五、depends_on 与 healthcheck：控制启动顺序与就绪

### depends_on 只保证「顺序」，默认不保证「就绪」

```yaml
    depends_on:
      db:
        condition: service_healthy               # 等 db「健康」才起本服务
        restart: true                            # db 被重启时，本服务也重启（重连）
      redis:
        condition: service_started               # 默认：只等 redis 容器「启动」
      migrate:
        condition: service_completed_successfully # 等 migrate 跑完且退出码 0
```

- 短语法 `depends_on: [db, redis]` 等价于所有依赖用 `condition: service_started`。
- **默认（`service_started`）只等容器进入 running，不等应用真正 ready/healthy**——这是最经典的坑：数据库容器「起来了」不代表「能连了」。
- **三个 condition**：
  - `service_started`：依赖容器一旦运行即启动本服务（默认）。
  - `service_healthy`：等依赖**通过 healthcheck** 才启动本服务（依赖必须配 `healthcheck`）。
  - `service_completed_successfully`：等依赖**执行完毕且退出码为 0**（适合迁移/初始化这类一次性任务）。
- Compose 的起停顺序由 `depends_on`、`links`、`volumes_from`、`network_mode: "service:..."` 共同决定；停止时按**反向依赖顺序**移除。

::: tip depends_on 并非万能，应用也要有韧性
即便用了 `service_healthy`，生产环境中依赖仍可能中途重启。健壮做法是让应用自身具备**连接重试**能力，把 `depends_on` 当「加速正确启动」而非「唯一保障」。
:::

### healthcheck：定义「就绪」的判据

```yaml
  db:
    image: postgres:17-alpine
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $${POSTGRES_USER}"]  # 注意 $$ 转义字面 $
      interval: 10s        # 探测间隔
      timeout: 5s          # 单次超时
      retries: 5           # 连续失败几次判 unhealthy
      start_period: 30s    # 启动宽限期，期间失败不计入 retries
      start_interval: 5s   # 宽限期内的探测间隔
      # disable: true      # 或 test: ["NONE"] 关闭镜像自带健康检查
```

- `test` 三种形态：`["NONE"]`（禁用）/ `["CMD", ...]`（**直接执行，不经 shell**）/ `["CMD-SHELL", "字符串"]`（用容器默认 shell `/bin/sh -c` 执行）。
- **退出码 0 = healthy，1 = unhealthy**（2 保留）；状态流转 `starting → healthy / unhealthy`。
- **默认值**（未显式配置时，继承镜像 Dockerfile 的 `HEALTHCHECK`）：`interval` 30s、`timeout` 30s、`retries` 3、`start_period` 0s、`start_interval` 5s。
- `start_period` 是宽限期，期间探测失败**不计入** `retries`、不标记 unhealthy，用于给应用冷启动时间。
- 注意 `test` 里若要用容器内的环境变量（如 `$POSTGRES_USER`），要写成 **`$$`** 防止被 Compose 当插值提前替换。

## 六、restart 与 deploy：重启与部署语义

### restart：`compose up` 的运行时重启策略

```yaml
    restart: unless-stopped   # no(默认) / always / on-failure[:max-retries] / unless-stopped
```

- `no`：不自动重启（默认）。
- `always`：总是重启（含守护进程重启后）。
- `on-failure[:N]`：仅非零退出码时重启，可限制次数。
- `unless-stopped`：类似 always，但**手动 stop 后不因守护进程重启而复活**。

### deploy：主要面向 Swarm

```yaml
    deploy:
      replicas: 3
      resources:
        limits:       { cpus: "0.50", memory: 512M }   # 上限
        reservations: { cpus: "0.25", memory: 256M }   # 预留
      restart_policy:
        condition: on-failure
        max_attempts: 3
      update_config:   { parallelism: 2, order: start-first }
      placement:       { constraints: ["node.role==worker"] }
```

::: warning restart ≠ deploy.restart_policy
`restart` 是**普通 `docker compose up`** 生效的运行时策略；`deploy.*`（`replicas`/`placement`/`update_config`/`rollback_config`/`endpoint_mode`）**主要在 Docker Swarm 下生效**，`docker compose up` 只部分支持（如 `resources` 限额、`replicas`）。此外 `container_name` 与多副本互斥。
:::

## 七、command、entrypoint 及其它常用属性

```yaml
    command: ["npm", "start"]      # 覆盖镜像 CMD
    entrypoint: ["/entry.sh"]      # 覆盖镜像 ENTRYPOINT，并「重置」镜像默认 CMD
```

- 设置 `entrypoint`（非 null）会让 Compose **忽略镜像自带的默认 command**；`command: []` 把命令置空，`null` 则用镜像默认。
- 推荐用 exec form（数组），信号能正确传到 PID 1。

其它高频 service 属性：

| 属性 | 作用 |
| --- | --- |
| `container_name: myapp-db` | 固定容器名；**设置后无法 scale 超过 1 个容器** |
| `profiles: [debug]` | 仅在对应 profile 激活时启动（见 [环境变量与插值](./environment.md)） |
| `init: true` | 注入 tini 作 PID 1，转发信号 + 回收僵尸进程 |
| `user` / `working_dir` | 运行用户 / 工作目录 |
| `stop_signal` / `stop_grace_period` | 停止信号（默认 `SIGTERM`）/ 宽限期（默认 **10s**，超时 SIGKILL） |
| `stdin_open` / `tty` | 等价 `-i` / `-t`，交互式调试 |
| `cpus` / `mem_limit` / `pids_limit` | 非 Swarm 下的资源限额 |
| `labels` / `annotations` | 元数据（建议反向 DNS 命名防冲突） |
| `configs` / `secrets` | 引用顶层同名定义，挂载为文件（见 [进阶组合](./advanced.md)） |
| `extends` | 从另一服务/文件复用配置（见 [进阶组合](./advanced.md)） |
| `network_mode` / `networks` | 网络模式 / 接入的网络（见 [网络与数据卷](./networking-volumes.md)） |

## 下一步

- 默认网络、服务发现、命名卷生命周期见 [网络与数据卷](./networking-volumes.md)。
- `env_file` 与顶层 `.env` 的区别、插值、`profiles` 见 [环境变量与插值](./environment.md)。
- 多文件叠加、`configs`/`secrets`、Watch 热更见 [进阶组合](./advanced.md)。
- 关键字与常见坑速查见 [参考](../reference.md)。
