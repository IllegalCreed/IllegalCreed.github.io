---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Docker Compose（V2 / Compose Spec）· 核于 2026-07

## 速查

- **本页含**：CLI 全局标志与子命令、`up`/`down` 关键标志、`compose.yaml` 顶层与 service 关键字、插值与合并速记、常见坑速查、权威链接。
- **最常敲五条**：`up -d` / `down` / `ps` / `logs -f` / `exec 服务 sh`。
- **调试合并结果**：`docker compose config`（渲染最终规范文件）。
- **命令语法**：`docker compose [全局标志] <子命令> [子命令标志]`；全局标志（`-f`/`-p`/`--profile`/`--env-file`）写在子命令**之前**。
- **数据安全**：`down` 默认保留命名卷，`down -v` 才删。
- **版本**：一律用 V2（`docker compose`）；不写 `version:`；文件名用 `compose.yaml`。
- **服务互访**：同网络用**服务名 + 容器端口**（走内置 DNS），别用 IP、别用宿主端口。
- **就绪等待**：`depends_on` 默认只等「运行」；等就绪要 `condition: service_healthy` + `healthcheck`。
- **变量注入**：`.env`/shell 只做**插值**；进容器靠 `environment`/`env_file`（前者优先）。
- **插值默认值**：`${VAR:-x}` 空值也兜底、`${VAR-x}` 仅未设置兜底；`$$` 转义字面 `$`。
- **一次性任务**：`run` 新起容器跑命令（覆盖默认 command）；`exec` 进已运行容器。
- **热更**：`develop.watch`（sync/rebuild/sync+restart），只对 `build` 本地源码的服务生效。

## 一、CLI 命令速查

### 全局标志（写在子命令之前）

| 标志 | 作用 |
| --- | --- |
| `-f, --file` | 指定 compose 文件（可多次，后者覆盖前者） |
| `-p, --project-name` | 项目名（覆盖默认目录名） |
| `--profile` | 激活 profile（可多次） |
| `--env-file` | 指定备用 env 文件（供插值） |
| `--project-directory` | 指定工作目录 |

### 子命令

| 命令 | 作用 |
| --- | --- |
| `up` | 创建并启动容器（`-d` 后台；默认前台聚合日志，Ctrl-C 停止） |
| `down` | 停止并**删除容器、网络**（默认不删命名卷） |
| `ps` | 列出本项目容器及状态 |
| `logs` | 查看服务日志（`-f` 跟随） |
| `exec` | 在**运行中**的容器里执行命令 |
| `run` | 起一个**一次性**容器（命令行 command 覆盖服务默认 command） |
| `build` | 构建 / 重建服务镜像 |
| `pull` / `push` | 拉取 / 推送服务镜像 |
| `start` / `stop` / `restart` | 起 / 停 / 重启（不删除） |
| `create` / `rm` | 仅创建 / 删除已停止容器 |
| `kill` | 强制停止（发信号） |
| `config` | 解析、合并、插值并渲染为规范格式（调试合并结果） |
| `cp` | 容器与宿主间复制文件 |
| `top` / `events` / `images` / `port` | 进程 / 实时事件 / 镜像 / 端口映射 |
| `pause` / `unpause` | 暂停 / 恢复 |
| `wait` | 阻塞直到指定服务容器退出 |
| `watch` | 监听源码变化并同步/重建 |
| `ls` | 列出正在运行的 compose 项目 |
| `version` / `scale` / `attach` | 版本 / 缩放 / 附加流 |

## 二、up / down 关键标志

### `up`

| 标志 | 作用 |
| --- | --- |
| `-d, --detach` | 后台运行 |
| `--build` / `--no-build` | 启动前先构建 / 即使策略要求也不构建 |
| `--no-deps` | 不启动依赖服务 |
| `--force-recreate` / `--no-recreate` | 强制重建 / 保留现有容器不重建 |
| `--scale SERVICE=N` | 运行 N 个实例（覆盖文件） |
| `--wait` / `--wait-timeout` | 等到服务 running/healthy 才返回 / 超时秒数 |
| `--remove-orphans` | 删除文件中已不存在服务的「孤儿」容器 |
| `--pull always\|missing\|never` | 拉取策略 |
| `--watch` | 起服务并监听文件变化 |
| `--abort-on-container-exit` | 任一容器退出即停止全部 |
| `--renew-anon-volumes` | 重建匿名卷（不复用旧数据） |

### `down`

| 标志 | 作用 |
| --- | --- |
| `-v, --volumes` | 同时删除命名卷与匿名卷（默认不删命名卷） |
| `--rmi all\|local` | 删除镜像 |
| `--remove-orphans` | 删除孤儿容器 |

## 三、compose.yaml 关键字速查

### 顶层元素

| 键 | 作用 |
| --- | --- |
| `services` | 服务（核心，计算单元） |
| `networks` | 网络（服务间通信抽象） |
| `volumes` | 命名卷（持久化数据） |
| `configs` | 非敏感配置，以文件挂入容器 |
| `secrets` | 敏感数据，以只读文件挂到 `/run/secrets/<name>` |
| `name` | 项目名（覆盖默认目录名） |
| `include` | 引入其它 compose 文件的全部资源 |
| `x-*` | 扩展字段，被 Compose 静默忽略（配合 YAML 锚点做 DRY） |
| `version` | **已过时**，写了只警告、无效果，勿用 |

### 常用 service 关键字

| 键 | 作用 |
| --- | --- |
| `image` / `build` | 用镜像 / 从 Dockerfile 构建（可并存，`image` 作产物 tag） |
| `ports` / `expose` | 发布到宿主 / 仅声明内部端口 |
| `environment` / `env_file` | 注入容器变量（前者优先） |
| `volumes` | 挂载（命名卷 / 绑定 / tmpfs） |
| `depends_on` | 启动顺序（`condition`: started/healthy/completed_successfully） |
| `healthcheck` | 健康探测（test/interval/timeout/retries/start_period） |
| `restart` | 运行时重启策略（no/always/on-failure/unless-stopped） |
| `deploy` | 部署配置（多为 Swarm；`resources` 等部分在 up 下生效） |
| `command` / `entrypoint` | 覆盖 CMD / 覆盖 ENTRYPOINT（重置默认 CMD） |
| `networks` / `network_mode` | 接入网络 / 网络模式（互斥） |
| `profiles` | 按需启用（无 profile 始终起） |
| `container_name` | 固定容器名（与 scale>1 互斥） |
| `pull_policy` | always/never/missing/build/daily/weekly/every_&lt;dur&gt; |
| `init` | 注入 PID 1，转发信号 + 回收僵尸进程 |
| `stop_signal` / `stop_grace_period` | 停止信号（默认 SIGTERM）/ 宽限期（默认 10s） |
| `extends` | 复用另一 service/文件的配置 |
| `develop.watch` | 热更监听（sync/rebuild/sync+restart/sync+exec） |
| `configs` / `secrets` | 引用顶层同名定义，挂载为文件 |

## 四、插值与合并速记

**插值语法**：

| 写法 | 触发条件 |
| --- | --- |
| `${VAR:-d}` | 未设置**或为空** → d |
| `${VAR-d}` | 仅未设置 → d |
| `${VAR:?e}` / `${VAR?e}` | 未设置(或空) / 未设置 → 报错 |
| `${VAR:+v}` / `${VAR+v}` | 已设置且非空 / 只要已设置 → v |
| `$$` | 转义字面 `$`（防插值） |

**合并规则**：标量替换、序列（ports/expose/dns…）追加、映射（environment/labels）按键合并；`<<` 合并键只用于映射。

**容器内变量优先级**（高→低）：`run -e` > shell(插值) > `environment` > `env_file` > Dockerfile `ENV`。

## 五、常见坑速查

| 现象 / 坑 | 原因与解法 |
| --- | --- |
| 还在用 `docker-compose`（连字符） | V1 已 **2023 EOL**；用 V2 `docker compose`（空格） |
| 写了 `version:` 报警告 | 已过时；删掉，Compose 用最新 schema |
| `depends_on` 了但连不上依赖 | 默认只等「运行」不等「就绪」；用 `condition: service_healthy` + 目标配 `healthcheck`，应用自身也要能重试 |
| `.env` 里的变量容器里读不到 | `.env`/shell 变量只做**插值**；进容器要在 `environment`/`env_file` 里引用 |
| `${VAR:-x}` 与 `${VAR-x}` 效果不同 | 冒号版把「空值」也当未设置 |
| healthcheck 里 `$VAR` 被提前替换 | 用 `$$` 转义，让容器内 shell 解析 |
| 容器间用 IP 连接时好时坏 | 用**服务名**（DNS），别用 IP（重建即变） |
| 连不到「发布端口」上的邻居服务 | 容器间用**容器端口**，宿主端口只给外部；不写 `ports` 也能内部互访 |
| `down` 后数据没了 | 多半误用了 `down -v`；日常用 `down`（保留命名卷） |
| 改了源码容器不更新 | 用 `up --build` 重建，或配 `develop.watch` 热更 |
| `container_name` 后无法 scale | 固定名与多副本互斥；去掉 `container_name` |
| 多 `-f` 合并结果不符预期 | 跑 `docker compose config` 看渲染后的最终模型 |
| `deploy.replicas` 在 `up` 下不生效 | `deploy.*` 多为 Swarm 语义；单机用 `--scale` 或 `deploy` 支持的子集 |
| watch 不触发 | watch 只对 `build` 本地源码的服务生效；检查 `path`/`ignore` |
| 数据库端口 `0.0.0.0` 对外暴露 | 内部服务别发布端口，或绑 `127.0.0.1` |

## 六、权威链接

- Compose 总览：[docs.docker.com/compose](https://docs.docker.com/compose/)
- 特性与用途：[Features and uses](https://docs.docker.com/compose/intro/features-uses/)
- 版本历史 / 迁移：[History](https://docs.docker.com/compose/intro/history/) · [Migrate to V2](https://docs.docker.com/compose/releases/migrate/)
- 应用模型：[How Compose works](https://docs.docker.com/compose/intro/compose-application-model/)
- 文件规范总入口：[Compose file reference](https://docs.docker.com/reference/compose-file/)
- services / networks / volumes：[services](https://docs.docker.com/reference/compose-file/services/) · [networks](https://docs.docker.com/reference/compose-file/networks/) · [volumes](https://docs.docker.com/reference/compose-file/volumes/)
- build / deploy / include：[build](https://docs.docker.com/reference/compose-file/build/) · [deploy](https://docs.docker.com/reference/compose-file/deploy/) · [include](https://docs.docker.com/reference/compose-file/include/)
- version 与 name：[version-and-name](https://docs.docker.com/reference/compose-file/version-and-name/)
- 启动顺序（depends_on/healthcheck）：[Startup order](https://docs.docker.com/compose/how-tos/startup-order/)
- 网络：[Networking](https://docs.docker.com/compose/how-tos/networking/)
- profiles：[Profiles](https://docs.docker.com/compose/how-tos/profiles/)
- 变量插值 / 优先级：[Interpolation](https://docs.docker.com/compose/how-tos/environment-variables/variable-interpolation/) · [Precedence](https://docs.docker.com/compose/how-tos/environment-variables/envvars-precedence/)
- 多文件合并：[Merge](https://docs.docker.com/compose/how-tos/multiple-compose-files/merge/)
- Compose Watch：[File watch](https://docs.docker.com/compose/how-tos/file-watch/)
- CLI 参考：[docker compose CLI](https://docs.docker.com/reference/cli/docker/compose/)
