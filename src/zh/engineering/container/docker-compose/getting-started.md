---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Docker Compose（V2 / Compose Spec）· 核于 2026-07

## 速查

- **一句话**：Compose = 用一个 `compose.yaml` 声明**多个服务**，`docker compose up` 一键起、`down` 一键清；工作在**单台 Docker 主机**上。
- **V2 vs V1**：**`docker compose`**（空格，Go 写、CLI 插件，2026 标准）取代 **`docker-compose`**（连字符，Python 独立二进制，**2023 年 EOL**）。
- **`version:` 已过时**：Compose 始终用最新 schema 校验，写 `version:` 只收警告、无效果，**新文件不写**。
- **默认文件名**：首选 **`compose.yaml`**（也认 `compose.yml`、`docker-compose.yaml/.yml`）；并存时优先 `compose.yaml`。
- **最小服务**：一个 service 至少要有 `image`（拉现成镜像）或 `build`（从 Dockerfile 构建）二选一。
- **起停生命周期**：`up`（创建并启动，`-d` 转后台）/ `down`（停并删容器+网络）/ `ps`（看状态）/ `logs -f`（跟日志）/ `stop`·`start`·`restart`（不删）。
- **前台 vs 后台**：不加 `-d` 时 `up` 前台**聚合所有服务日志**，`Ctrl-C` 停止全部；`-d` 后台运行，用 `logs -f` 看日志。
- **默认网络**：`up` 自动建 `<项目名>_default`，所有服务加入。
- **服务名即主机名**：容器间**用服务名互访**（`web` 连 `db` 直接写 `db`），走内置 DNS；容器重建 IP 会变，服务名稳定。
- **端口语义**：容器间通信用**容器端口**；`ports: "8080:80"` 的宿主端口只给**外部（宿主）**访问用。
- **项目名**：默认取所在**目录名**，可用顶层 `name:` 或 `-p` 覆盖；它是网络/卷等资源的命名前缀。
- **一次性命令**：`docker compose run 服务 <cmd>` 跑一次性任务（如迁移脚本），`exec` 则进已运行的容器。

## 一、Compose 是什么，为什么需要它

一个真实应用很少只有一个容器：前端要连后端，后端要连数据库和 Redis，可能还有队列、对象存储。用原生 `docker run` 手工起这些容器，你得逐条敲一长串参数、手动建网络、按正确顺序启动、记住每个容器名——换台机器或换个人就难以复现。

**Docker Compose 把这一切收进一个声明式 YAML**：

```yaml
# compose.yaml
services:
  web:
    build: .
    ports:
      - "8080:3000"
    environment:
      - DATABASE_URL=postgres://app:secret@db:5432/app
    depends_on:
      db:
        condition: service_healthy

  db:
    image: postgres:17-alpine
    environment:
      - POSTGRES_USER=app
      - POSTGRES_PASSWORD=secret
      - POSTGRES_DB=app
    volumes:
      - db-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  db-data:
```

```bash
docker compose up -d      # 创建网络、卷，按依赖顺序拉起 db 和 web
```

一条命令，Compose 就完成了：建 `<项目名>_default` 网络、建 `db-data` 卷、先起 `db` 并等它健康、再起 `web`、把 `web` 的 3000 端口发布到宿主 8080。

::: tip Compose 与 docker run 的关系
Compose 底层仍然调用 Docker Engine API，它是「多容器编排的**声明式外壳**」：把你原本要写在无数 `docker run` / `docker network create` / `docker volume create` 里的东西，统一进一份可版本化、可共享的文件。
:::

## 二、V2、V1 与 `version:` 字段

### 命令：`docker compose`（空格）而非 `docker-compose`（连字符）

| 维度 | Compose V1 | Compose V2（2026 标准） |
| --- | --- | --- |
| 调用方式 | `docker-compose`（连字符，独立二进制） | **`docker compose`**（空格，Docker CLI 插件子命令） |
| 实现语言 | Python | **Go**（重写） |
| `version:` 顶层键 | 必填（标识 2.0–3.8 文件格式） | **忽略**，完全依据 Compose Specification |
| 现状 | **2023 年 EOL**，新版 Docker Desktop 已移除 | 当前标准，Docker Desktop / Engine 内置 |

V1 迁 V2 时 Docker 会建 `docker-compose` → `docker compose` 的兼容符号链接，老脚本仍能跑；但 2026 一律以 V2 为准。

### `version:` 已过时（obsolete）

历史上 `compose.yaml` 顶部要写 `version: "3.8"` 标识文件格式版本。**Compose V2 不再需要它**：Compose 始终用最新 schema 校验文件，写了 `version:` 只会得到一条「it is obsolete」的警告，**没有任何功能效果**。新文件直接从 `services:` 写起。

```yaml
# ❌ 过时写法，会警告
version: "3.8"
services: ...

# ✅ 2026 写法，直接顶层写 services
services: ...
```

### 文件命名与优先级

- 首选规范文件名 **`compose.yaml`**（`compose.yml` 亦可）。
- 向后兼容仍识别 `docker-compose.yaml` / `docker-compose.yml`。
- 多个候选**同时存在时，Compose 优先选用规范的 `compose.yaml`**。

## 三、核心命令：起停与观察

不加 `-d` 时，`up` 在**前台聚合所有服务的日志**（每行带服务名前缀），`Ctrl-C` 会停止整组服务——适合开发时盯日志。加 `-d` 则转入后台。

```bash
docker compose up            # 前台起，聚合日志，Ctrl-C 停全部
docker compose up -d         # 后台（detached）起
docker compose up -d --build # 起之前先（重新）构建镜像

docker compose ps            # 列出本项目的容器及状态、端口
docker compose logs -f       # 跟随全部服务日志（-f follow）
docker compose logs -f web   # 只看 web 服务日志

docker compose stop          # 停止容器但不删除（保留，可 start 复活）
docker compose start         # 重新启动已停止的容器
docker compose restart web   # 重启单个服务

docker compose down          # 停止并删除容器 + 默认网络（默认不删命名卷）
docker compose down -v       # 连命名卷、匿名卷一并删除（会丢数据！）
```

::: warning `down` 默认不删命名卷
`docker compose down` 只删容器和网络，**命名卷会保留**，所以数据库数据能跨 `up`/`down` 存活。要彻底清空数据（例如重置本地开发库）才用 `down -v`。这是最常被误用的一对命令。
:::

进容器与跑一次性命令：

```bash
docker compose exec db psql -U app      # 进「已运行」的 db 容器执行命令
docker compose run --rm web npm test    # 起一个「一次性」容器跑命令，退出即删
```

- `exec` 面向**已在运行**的容器（如进数据库敲 SQL）。
- `run` **新起一个**容器跑命令，命令行给的命令会**覆盖服务的默认 command**，常用于迁移、seed、跑测试等一次性任务。

## 四、服务名 DNS：容器间怎么互相访问

这是 Compose 最省心也最容易踩的一点。

- `up` 会创建一个名为 **`<项目名>_default`** 的网络（项目名默认取目录名，如目录 `myapp` → 网络 `myapp_default`），**所有服务自动加入**。
- 每个服务把**自己的服务名注册进内置 DNS**，于是容器之间**直接用服务名互访**。上面的例子里，`web` 连数据库的连接串写的是 `db:5432` 里的 `db`——就是那个服务名。

```yaml
services:
  web:
    environment:
      # 用服务名 db 作为主机名，容器端口 5432；不要写 IP，也不要写宿主端口
      - DATABASE_URL=postgres://app:secret@db:5432/app
  db:
    image: postgres:17-alpine
```

两个高频要点：

1. **用服务名，别用 IP**：容器重建后 IP 会变，服务名始终稳定。
2. **容器间用容器端口，不是宿主端口**：`ports: "8080:80"` 里的 `8080` 只用于**从宿主/外部**访问；`web` 在同一网络里连 `db` 用的是 `db` 监听的**容器端口**（如 5432），与 `ports` 发布无关。哪怕不写 `ports`，同网络内的服务照样能互访。

## 下一步

- 逐条掌握 `image`/`build`、`ports`、`environment`、`volumes`、`depends_on`+`healthcheck`、`restart`/`deploy` 见 [服务配置](./guide-line/services.md)。
- 默认网络、自定义网络、命名卷 vs 绑定挂载、`down -v` 见 [网络与数据卷](./guide-line/networking-volumes.md)。
- `.env`、插值语法、变量优先级、`profiles` 见 [环境变量与插值](./guide-line/environment.md)。
- 多文件叠加、`include`、`extends`、Watch 热更见 [进阶组合](./guide-line/advanced.md)。
- 命令与关键字速查见 [参考](./reference.md)。
