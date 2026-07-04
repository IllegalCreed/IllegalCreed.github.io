---
layout: doc
outline: [2, 3]
---

# 指南 - 进阶组合

> 基于 Docker Compose（V2 / Compose Spec）· 核于 2026-07

## 速查

- **多 `-f` 合并**：`docker compose -f a.yaml -f b.yaml ...`，按命令行顺序合并，**后者覆盖/追加前者**。
- **`compose.override.yaml` 自动叠加**：与 `compose.yaml` 并存时，`up` **自动**在其上叠加 override，无需显式 `-f`。
- **合并规则**：**标量**（`image`/`command`）后者替换；**序列**（`ports`/`expose`/`dns`）追加拼接；**映射**（`environment`/`labels`）按键合并、后者同键覆盖。
- **`docker compose config`**：解析、合并、插值后**渲染出最终规范文件**——调试多文件合并结果的利器。
- **`extends`**：**服务级**配置复用（从另一 service/文件继承），映射合并、当前定义优先。
- **`include`**：把被包含文件的**所有资源**拷进当前模型，可直接引用；用于**模块化组合独立子应用**。
- **三者区别**：`-f` 是「同一模型多层覆盖」；`extends` 是「单个服务复用」；`include` 是「组合独立子栈」。
- **`x-` 扩展字段**：`x-` 开头的顶层键被 Compose **静默忽略**（唯一例外），配合 YAML 锚点 `&`/`*`/`<<` 做 DRY。
- **YAML `<<` 合并键只作用于映射**，不能用于序列。
- **Compose Watch**：`develop.watch` 动作 `sync` / `rebuild` / `sync+restart` / `sync+exec`；**只对用 `build` 从本地源码构建的服务生效**；`ignore` 相对 `path`。
- **`configs` / `secrets`**：顶层定义 + 服务引用，挂载为文件；`secrets` 默认只读挂到 `/run/secrets/<name>`。

## 一、多文件叠加与 override

Compose 允许把配置拆成多个文件、按顺序合并，用于「基础配置 + 环境差异」的分层。

### 显式多 `-f`

```bash
# 后面的文件覆盖/追加前面的
docker compose -f compose.yaml -f compose.prod.yaml up -d
```

按命令行顺序合并，**后者覆盖或追加前者**。也可用 `COMPOSE_FILE` 环境变量替代（路径分隔符分隔）。

### 自动 override

`compose.yaml` 与 `compose.override.yaml` 并存时，`docker compose up` **自动**把 override 叠加到基础文件上，无需显式 `-f`。典型分工：`compose.yaml` 放通用定义，`compose.override.yaml` 放本地开发覆盖（挂源码、开调试端口）。

```yaml
# compose.yaml（通用）
services:
  web:
    image: myapp
    ports: ["3000"]

# compose.override.yaml（本地开发，自动叠加）
services:
  web:
    build: .                 # 本地改成从源码构建
    ports: ["3000:3000"]     # 固定宿主端口便于访问
    volumes:
      - ./src:/app/src       # 挂源码热更
```

### 合并规则

| 元素类型 | 合并行为 |
| --- | --- |
| 标量（`image` / `command` / `mem_limit`） | 后者**替换** |
| 多值序列（`ports` / `expose` / `dns` / `dns_search` / `tmpfs`） | **追加拼接** |
| 映射（`environment` / `labels` / `extra_hosts`） | **按键合并**，后者同键覆盖 |
| 卷 / 设备 | 按容器内挂载路径合并，同路径后者覆盖 |

## 二、用 `config` 命令查看合并结果

多文件叠加、插值、`include`/`extends` 之后，「最终究竟长什么样」常令人困惑。`docker compose config` 会**解析、合并、插值并渲染出规范化的最终文件**：

```bash
docker compose config                 # 打印合并 + 插值后的最终配置
docker compose -f a.yaml -f b.yaml config   # 看多文件合并结果
docker compose config --services      # 只列服务名
docker compose config --profiles      # 列出所有 profile
```

调试「为什么某个值不对 / 某服务没起」时，先跑 `config` 看 Compose 眼里的真实模型，往往一眼定位。

## 三、extends：服务级配置复用

`extends` 让一个服务**继承**另一个服务（可跨文件）的配置，避免重复：

```yaml
# common.yaml
services:
  base-app:
    image: myapp
    environment:
      LOG_LEVEL: info
    restart: unless-stopped

# compose.yaml
services:
  web:
    extends:
      file: common.yaml
      service: base-app       # 继承 base-app 的配置
    ports: ["8080:3000"]      # 再叠加/覆盖自己的
```

- 需要 `service`（+ 可选 `file`）；合并时**映射合并、当前定义优先**，序列合并，标量当前优先。
- `extends` 是**单服务**层面的复用，不引入被继承文件的其它服务/网络/卷。

## 四、include：组合独立子应用

`include` 把**另一个 compose 文件的全部资源**（services/networks/volumes/…）拷进当前模型，可直接引用：

```yaml
include:
  - ../commons/compose.yaml
  - path: ../another/compose.yaml
    project_directory: ..
    env_file: ../another/.env

services:
  webapp:
    depends_on:
      - included-service      # 直接引用被包含文件里定义的服务
```

三者区别（高频对比）：

- **`-f` 多文件**：对**同一个模型**做多层覆盖合并。
- **`extends`**：**单个服务**的配置复用。
- **`include`**：把**独立子应用**整体组合进来，被包含文件的资源被「拷贝」进当前模型、递归生效。

## 五、x- 扩展字段与 YAML 锚点（DRY）

```yaml
x-common-env: &common-env      # x- 开头的顶层键被 Compose 静默忽略（唯一例外）
  environment:
    LOG_LEVEL: info
    TZ: Asia/Shanghai

services:
  api:
    <<: *common-env            # YAML 合并键，把锚点内容并入本映射
    image: myapp/api
  worker:
    <<: *common-env
    image: myapp/worker
```

- **`x-` 前缀**：自定义扩展/复用块，Compose **静默忽略**（是唯一被忽略的顶层字段），也用于厂商扩展（如 `x-aws-*`）。
- **YAML 锚点**：`&name` 定义、`*name` 引用、`<<` 合并键把锚点映射并入当前映射。
- **`<<` 合并键只能用于映射（mapping），不能用于序列（sequence）**——想复用 `ports` 这类列表不能靠 `<<`。

## 六、Compose Watch：开发热更

`develop.watch` 让 Compose 监听宿主源码变化并自动同步/重建，替代手动 `up --build`：

```yaml
services:
  web:
    build: .
    develop:
      watch:
        - action: sync              # 宿主改动实时同步进容器（配合框架 HMR）
          path: ./src
          target: /app/src
          ignore: [node_modules/]   # ignore 相对 path，不是项目根
        - action: rebuild           # 变更触发重建镜像并替换容器（≈ up --build）
          path: package.json
        - action: sync+restart      # 同步后重启容器（改配置文件常用）
          path: ./config
          target: /etc/app
```

```bash
docker compose watch          # 或 docker compose up --watch
```

- 四种动作：`sync`（同步文件）/ `rebuild`（重建镜像）/ `sync+restart`（同步后重启）/ `sync+exec`（同步后在容器内执行命令）。
- **只对用 `build` 从本地源码构建的服务生效**，纯预构建镜像的服务不适用。
- 前提：镜像内需有 `stat`/`mkdir`/`rmdir`，目标路径用户有写权限。
- 相比裸绑定挂载的优势：可精细 `ignore`（如排除 `node_modules/`，避免同步平台相关的依赖产物）。

## 七、configs 与 secrets：以文件形式注入配置

把配置/密钥以**文件**形式挂进容器，比塞环境变量更适合大段配置与敏感数据：

```yaml
configs:
  app_config:
    file: ./config.yml            # 来自宿主文件
secrets:
  db_password:
    file: ./db_password.txt
  api_key:
    external: true                # 引用平台既有 secret（如 Swarm/外部管理）

services:
  app:
    configs:
      - app_config                # 短语法：挂到容器 /app_config
    secrets:
      - db_password               # 短语法：挂到 /run/secrets/db_password（只读）
```

- **`configs`** 短语法默认挂到容器 `/<config_name>`；长语法可指定 `source`/`target`/`uid`/`gid`/`mode`。
- **`secrets`** 默认**只读**挂到 `/run/secrets/<secret_name>`；长语法同样支持 `target`/`uid`/`gid`/`mode`。
- 二者都可 `external: true` 引用平台既有资源。应用读文件即可（如从 `/run/secrets/db_password` 读密码），避免密钥出现在 `docker inspect` 的环境变量里。

## 下一步

- service 各字段（`build`/`ports`/`depends_on`/`healthcheck` 等）见 [服务配置](./services.md)。
- 默认网络、命名卷生命周期见 [网络与数据卷](./networking-volumes.md)。
- 插值 `:-`/`-`、`.env`、`profiles`、优先级见 [环境变量与插值](./environment.md)。
- 命令 / 关键字 / 坑速查见 [参考](../reference.md)。
