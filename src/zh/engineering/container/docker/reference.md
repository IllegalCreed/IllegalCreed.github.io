---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Docker（Engine 2x / BuildKit 默认）· 核于 2026-07

## 速查

- **本页含**：CLI 命令速查（容器/镜像/构建/网络/卷/系统）、Dockerfile 指令表、`docker run` 常用参数、常见坑、权威链接。
- **镜像名**：`[registry/]namespace/repo:tag[@sha256:digest]`，缺省 `:latest`。
- **最常敲五条**：`docker run` / `ps` / `exec -it` / `logs -f` / `build -t`。
- **一键清理**：`docker system prune -a --volumes`（慎用，删所有未用镜像/容器/网络/卷）。
- **构建后端**：BuildKit 默认；多平台/高级特性走 `docker buildx build`。
- **看状态**：`docker info`（引擎）、`docker version`（客户端+服务端）、`docker system df`（磁盘）。

## 一、CLI 命令速查

### 容器生命周期

| 命令                        | 作用                             |
| --------------------------- | -------------------------------- |
| `docker run [opts] 镜像 [cmd]` | 创建并启动容器                |
| `docker create` / `start`   | 只创建 / 启动已创建的            |
| `docker ps` / `ps -a`       | 运行中的 / 含已停止的            |
| `docker stop` / `start` / `restart` | 停 / 起 / 重启          |
| `docker kill`               | 立即 `SIGKILL`                   |
| `docker rm [-f] 容器`       | 删容器（`-f` 强删运行中的）      |
| `docker exec -it 容器 sh`   | 在运行容器内执行命令             |
| `docker logs -f 容器`       | 看日志（`-f` 跟踪）              |
| `docker inspect 容器`       | 完整 JSON 元数据                 |
| `docker stats`              | 实时资源占用                     |
| `docker top 容器`           | 容器内进程列表                   |
| `docker cp 容器:路径 本地`  | 容器与宿主之间拷文件             |
| `docker port 容器`          | 查端口映射                       |
| `docker rename 旧 新`       | 改容器名                         |
| `docker update --memory 512m 容器` | 改运行中容器的资源限额    |

### 镜像

| 命令                        | 作用                             |
| --------------------------- | -------------------------------- |
| `docker pull 镜像:tag`      | 拉镜像                           |
| `docker images` / `image ls`| 列本地镜像                       |
| `docker build -t 名:tag .`  | 构建（`.` 是上下文）             |
| `docker tag 源 目标`        | 打别名/标 registry               |
| `docker push 镜像`          | 推到 registry                    |
| `docker rmi 镜像`           | 删镜像                           |
| `docker history 镜像`       | 看每层来历                       |
| `docker save -o x.tar 镜像` | 导出为 tar                       |
| `docker load -i x.tar`      | 从 tar 导入                      |
| `docker image inspect 镜像` | 镜像元数据                       |
| `docker login` / `logout`   | 登录 / 登出 registry             |

### 构建（BuildKit / buildx）

| 命令                                             | 作用                        |
| ------------------------------------------------ | --------------------------- |
| `docker build -t app:1.0 .`                      | 基础构建（默认 BuildKit）   |
| `docker build --target build .`                  | 只构建到指定 stage          |
| `docker build --no-cache .`                      | 不用缓存全量重建            |
| `docker build --pull .`                          | 强制拉最新基础镜像          |
| `docker build --build-arg KEY=val .`             | 传构建参数                  |
| `docker build --secret id=x,src=./x .`           | 传构建期密钥                |
| `docker buildx build --platform linux/amd64,linux/arm64 -t app .` | 多平台构建 |
| `docker buildx build --cache-from --cache-to`    | 导入/导出缓存               |

### 网络

| 命令                                    | 作用                       |
| --------------------------------------- | -------------------------- |
| `docker network ls`                     | 列网络                     |
| `docker network create app-net`         | 建自定义 bridge            |
| `docker network inspect app-net`        | 看网段 / 接入的容器        |
| `docker network connect app-net 容器`   | 把容器接入网络             |
| `docker network disconnect app-net 容器`| 断开                       |
| `docker network prune`                  | 删无用网络                 |

### 卷

| 命令                        | 作用                       |
| --------------------------- | -------------------------- |
| `docker volume create 名`   | 建命名卷                   |
| `docker volume ls`          | 列卷                       |
| `docker volume inspect 名`  | 看挂载点 / 驱动            |
| `docker volume rm 名`       | 删卷                       |
| `docker volume prune`       | 删所有未用卷               |

### 系统 / 清理

| 命令                              | 作用                             |
| --------------------------------- | -------------------------------- |
| `docker info`                     | 引擎详情（存储驱动/cgroup/数量） |
| `docker version`                  | 客户端 + 服务端版本              |
| `docker system df`                | Docker 磁盘占用                  |
| `docker system prune`             | 删停止容器 + 悬空镜像 + 无用网络 |
| `docker system prune -a --volumes`| 连未用镜像和卷一起删（慎用）     |
| `docker container prune`          | 删所有已停止容器                 |
| `docker image prune [-a]`         | 删悬空 [或全部未用] 镜像         |

### Compose V2（`docker compose` 子命令）

| 命令                          | 作用                          |
| ----------------------------- | ----------------------------- |
| `docker compose up -d`        | 按 `compose.yaml` 起全部服务  |
| `docker compose down [-v]`    | 停并删（`-v` 连卷）           |
| `docker compose ps` / `logs -f` | 状态 / 日志                 |
| `docker compose build`        | 构建服务镜像                  |
| `docker compose exec 服务 sh` | 进某服务容器                  |

> Compose V2 是 Docker CLI 插件，命令是 `docker compose`（有空格），已取代旧的独立 `docker-compose`（连字符）。

## 二、Dockerfile 指令速查

| 指令          | 作用                                | 关键点                                   |
| ------------- | ----------------------------------- | ---------------------------------------- |
| `FROM`        | 基础镜像 / 开新 stage               | 首条有效指令；`AS 名` 命名 stage         |
| `RUN`         | 构建期执行命令                      | 产层；`&&` 合并；BuildKit 支持 `--mount` |
| `CMD`         | 默认命令 / 参数                     | 被 `docker run` 参数覆盖；仅最后一条生效 |
| `ENTRYPOINT`  | 固定入口程序                        | `docker run` 参数追加其后；配 CMD 给默认 |
| `COPY`        | 拷贝本地文件 / 跨 stage 产物        | 首选；`--from` / `--chown` / `--chmod`   |
| `ADD`         | 拷贝 + 解压 tar + 拉 URL/Git        | 仅需要这些特性时用；配 `--checksum`      |
| `ARG`         | 构建期变量                          | `--build-arg` 传；不入镜像；可先于 FROM  |
| `ENV`         | 环境变量                            | 入镜像、运行时存在；覆盖同名 ARG         |
| `WORKDIR`     | 工作目录                            | 自动创建；别用 `RUN cd`                  |
| `EXPOSE`      | 声明监听端口                        | 仅文档，不发布；发布靠 `-p`              |
| `VOLUME`      | 声明挂载点                          | JSON 数组形式；宿主路径不能在此定         |
| `USER`        | 切换用户                            | 安全基线非 root                          |
| `LABEL`       | 元数据                              | 用 OCI 规范 key                          |
| `HEALTHCHECK` | 健康探测                            | `--interval/--timeout/--retries/--start-period` |
| `STOPSIGNAL`  | 停止信号                            | 默认 `SIGTERM`                           |
| `SHELL`       | shell form 用的默认 shell           | 覆盖 `/bin/sh -c`                        |
| `ONBUILD`     | 被当基础镜像时才触发的指令          | 做 base 镜像用                           |

### exec form vs shell form

| 形态      | 写法                    | 是否过 shell | 变量展开 | 信号（PID 1） |
| --------- | ----------------------- | ------------ | -------- | ------------- |
| exec form | `["exe","arg"]`         | 否           | 不展开   | ✅ 应用是 PID 1 |
| shell form| `exe arg`               | 是(`sh -c`)  | 展开     | ❌ sh 是 PID 1  |

## 三、docker run 常用参数

| 参数                       | 作用                                   |
| -------------------------- | -------------------------------------- |
| `-d`                       | 后台运行                               |
| `-it`                      | 交互 + 分配终端（进 shell 必备）       |
| `--rm`                     | 退出即删容器                           |
| `--name 名`                | 命名容器                               |
| `-p 主机:容器`             | 发布端口                               |
| `-P`                       | 随机发布所有 EXPOSE 端口               |
| `-e KEY=val` / `--env-file`| 设环境变量 / 从文件读                  |
| `-v 卷:/路径[:ro]`         | 挂卷 / 绑定挂载                        |
| `--mount type=...`         | 明确挂载语法（推荐）                   |
| `--network 名`             | 指定网络                               |
| `-w /path`                 | 设工作目录                             |
| `-u 用户`                  | 指定运行用户                           |
| `--memory` / `--cpus`      | 资源限额                               |
| `--restart`                | 重启策略：`no`/`on-failure`/`always`/`unless-stopped` |
| `--read-only`              | 只读根文件系统                         |
| `--cap-drop` / `--cap-add` | 丢弃 / 添加 capability                 |
| `--security-opt=no-new-privileges` | 禁止提权                       |

## 四、常见坑速查

| 现象 / 坑                              | 原因与解法                                                       |
| -------------------------------------- | ---------------------------------------------------------------- |
| 容器数据一删就没                       | 可写层不持久；持久数据放 **volume**                              |
| `EXPOSE` 了却访问不到                  | `EXPOSE` 只是声明；发布要 `docker run -p`                         |
| 同网容器 ping 不通对方名字             | 用了**默认 bridge**（无 DNS）；建**自定义网络**用容器名          |
| `docker stop` 要等 10 秒才停           | 用了 **shell form**，PID 1 是 sh 收不到信号；改 **exec form**    |
| 改代码每次都重装依赖                   | 层序错了；**先 COPY 依赖清单装依赖，再 COPY 源码**              |
| `RUN rm` 删了文件镜像却没变小          | 删在新层；要在**同一 RUN** 内装完就清                            |
| 密钥被 `docker history` 看到           | 别用 `ARG`/`ENV` 传密钥；用 `RUN --mount=type=secret`            |
| alpine 上原生模块 / DNS 行为异常       | musl libc 与 glibc 差异；换 `-slim` 验证                         |
| 镜像巨大（几百 MB~GB）                 | 未用多阶段 / 基础镜像太大 / 没 `.dockerignore`                   |
| `-p 0.0.0.0:5432:5432` 库对外网暴露    | Docker 直改 iptables 绕过 UFW；内部服务别发布，绑 `127.0.0.1`    |
| 容器里是 root，安全审计不过            | 加 `USER`；运行时 `--user`、`--cap-drop=ALL`                    |
| `latest` 导致构建不可复现             | 锁 `@sha256:` digest                                             |
| 构建上下文很大、上传很慢               | 配 `.dockerignore` 排除 `node_modules`/`.git`/产物              |
| `docker build` 报缺 BuildKit 特性      | 加首行 `# syntax=docker/dockerfile:1`；或 `DOCKER_BUILDKIT=1`    |

## 五、组件与版本速记（2026-07）

| 组件                | 角色                                      | 版本（Engine 29）  |
| ------------------- | ----------------------------------------- | ------------------ |
| Docker Engine       | 整体（dockerd + CLI + 构建）              | 29.x               |
| `dockerd`           | 守护进程，管镜像/网络/卷/API              | -                  |
| `containerd`        | 容器/镜像生命周期，行业标准运行时         | v2.2.x             |
| `runc`              | 底层 OCI 运行时，真正建容器进程           | v1.3.x             |
| `containerd-shim`   | 每容器一个，容器"养父"，解耦守护进程       | -                  |
| BuildKit            | 默认构建后端                              | 默认（23.0+）      |
| Compose V2          | `docker compose` 子命令                   | CLI 插件           |
| 镜像存储            | containerd snapshotter（29.0+ 新装默认）  | `overlayfs`        |

## 六、权威链接

- 官方文档首页：[docs.docker.com](https://docs.docker.com/)
- 快速上手：[Get started](https://docs.docker.com/get-started/)
- Docker 概览与架构：[Docker overview](https://docs.docker.com/get-started/docker-overview/)
- Dockerfile 参考：[Dockerfile reference](https://docs.docker.com/reference/dockerfile/)
- 构建与缓存：[Build cache](https://docs.docker.com/build/cache/) · [Multi-stage](https://docs.docker.com/build/building/multi-stage/) · [BuildKit](https://docs.docker.com/build/buildkit/)
- 构建最佳实践：[Building best practices](https://docs.docker.com/build/building/best-practices/)
- 存储：[Storage overview](https://docs.docker.com/engine/storage/) · [Volumes](https://docs.docker.com/engine/storage/volumes/) · [Storage drivers](https://docs.docker.com/engine/storage/drivers/)
- 网络：[Networking overview](https://docs.docker.com/engine/network/)
- 安全：[Docker security](https://docs.docker.com/engine/security/)
- containerd 镜像存储：[containerd image store](https://docs.docker.com/engine/storage/containerd/)
- CLI 参考：[docker CLI](https://docs.docker.com/reference/cli/docker/) · [Compose](https://docs.docker.com/compose/)
