---
layout: doc
---

# Docker Compose

**Docker Compose** 是用**一个 YAML 文件**声明式定义整套**多容器应用**、再用**一条命令**起停的编排工具。它把一组相互依赖的服务（Web、数据库、缓存、队列……）连同它们的**网络（networks）**、**数据卷（volumes）**、**配置（configs）**、**密钥（secrets）**写进 `compose.yaml`，`docker compose up` 一次拉起、`docker compose down` 一次清理，团队成员 clone 仓库即可复现完全一致的运行环境。它工作在**单个 Docker 守护进程**之上，没有控制面、调度器与分布式状态——这是它与 Kubernetes 的根本分野，也决定了它的主战场是**本地开发、CI 自动化测试、单机部署**这三类场景。2026 年的现状是：**Compose V2**（Go 重写、以 `docker compose` 子命令形式内置于 Docker CLI）已全面取代旧的 **V1**（Python 的独立 `docker-compose`，2023 年 EOL）；文件格式统一到 **Compose Specification**（合并了历史上的 2.x / 3.x），顶层 **`version:` 字段已过时**——写了只警告、无任何功能效果，新文件不要再写。

## 概述

- **解决什么问题**：`docker run` 一次只能起一个容器、参数堆在命令行、多服务的网络/卷/依赖顺序全靠人肉串。Compose 用**声明式 YAML** 把整套栈描述清楚，一条命令统一起停、可版本化、可共享。
- **核心模型**：五类顶层元素——**services**（计算单元，核心）、**networks**（服务间通信）、**volumes**（持久化数据）、**configs**（非敏感配置文件）、**secrets**（敏感数据文件）；外加 `name`（项目名）、`include`（模块化引入）、`x-`（扩展字段）等顶层键。
- **默认文件名**：首选 **`compose.yaml`**（也认 `compose.yml`、`docker-compose.*`）；多个并存时优先规范的 `compose.yaml`。
- **开箱即用的网络**：`up` 自动建 `<项目名>_default` 网络，所有服务加入并以**服务名作为 DNS 主机名**互访——容器间用服务名 + 容器端口通信，不用 IP、不用宿主端口。
- **数据默认保留**：命名卷在 `up` 时创建、`down` 时**默认不删**，故数据跨重启保留（要删得 `down -v`）。
- **多环境定制**：变量插值 `${VAR}` + `.env` 文件 + 多 `-f` 叠加 + `profiles` 按需启用，一套文件适配 dev/CI/prod。
- **不是什么**：不是集群编排器。需要跨节点调度、自愈、扩缩容时，Compose 之上叠 Docker Swarm（`deploy` 键），或用 Kompose / Compose Bridge 转 Kubernetes 清单。

## 本叶地图

- [入门](./getting-started) —— Compose 定位与 `docker run` 的差异、V2/V1 与 `version:` 过时、写第一个 `compose.yaml`、`up/down/ps/logs -d` 生命周期、服务名 DNS 互访。
- [服务配置](./guide-line/services) —— `image`/`build`、`ports`/`expose`、`environment`/`env_file`、`volumes`、`depends_on` + `healthcheck` 条件、`restart` vs `deploy`、`command`/`entrypoint` 及常用属性。
- [网络与数据卷](./guide-line/networking-volumes) —— 默认项目网络与服务发现、自定义网络（driver/external/internal/ipam）、`network_mode`、命名卷 vs 绑定挂载 vs tmpfs、命名卷生命周期与 `down -v`。
- [环境变量与插值](./guide-line/environment) —— 「插值 vs 容器内变量」的关键区分、`${VAR:-x}` vs `${VAR-x}`、`$$` 转义、`.env` 文件、变量优先级、`profiles`、`COMPOSE_*` 与项目名解析。
- [进阶组合](./guide-line/advanced) —— 多 `-f` 合并与 `override`、`config` 看合并结果、`extends`、`include`、`x-` 与 YAML 锚点、Compose Watch 热更、`configs`/`secrets`。
- [参考](./reference) —— CLI 命令 / `compose.yaml` 关键字 / 常见坑速查表 + 权威链接。

## 文档地址

[Docker Compose Documentation](https://docs.docker.com/compose/)

## 幻灯片地址

- <a href="/SlideStack/docker-compose-slide/" target="_blank">Docker Compose</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=docker-compose" target="_blank" rel="noopener noreferrer">Docker Compose 测试题</a>
