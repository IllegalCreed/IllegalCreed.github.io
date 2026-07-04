---
layout: doc
outline: [2, 3]
---

# 指南 - 环境变量与插值

> 基于 Docker Compose（V2 / Compose Spec）· 核于 2026-07

## 速查

- **两条别混淆的路径**：**插值**（`.env` / shell 变量 → 替换 compose 文件里的 `${VAR}`）与 **容器内变量**（`environment` / `env_file` → 注入容器）是**两回事**。
- **`.env`/shell 变量本身不进容器**：它们只做文件插值；要进容器必须被 `environment` 或 `env_file` 引用。
- **默认 `.env`**：Compose 自动读**项目根**（与 `compose.yaml` 同级）的 `.env` 供插值；`--env-file` 可覆盖、可链式（后者覆盖前者）。
- **`${VAR:-default}` vs `${VAR-default}`**：冒号版把「**空值**」也当未设置；无冒号版只看「是否设置」。
- **`${VAR:?err}` / `${VAR?err}`**：未设置（或为空）时**报错退出**，用于强制必填。
- **`${VAR:+val}` / `${VAR+val}`**：已设置（且非空 / 只要设置）时替换成 `val`。
- **`$$` 转义字面 `$`**：防止被 Compose 当插值（如 healthcheck 里引用容器内变量）。
- **引号规则**：插值对**无引号与双引号**值生效；**单引号**值按字面处理、不插值。
- **容器内变量优先级**（高→低）：`run -e` > shell（经插值进 `environment`/`env_file`）> `environment` > `env_file` > Dockerfile `ENV`。
- **`profiles`**：无 profile 的服务**始终启动**；有 profile 的服务仅在 `--profile x` 或 `COMPOSE_PROFILES=x` 激活时启动。
- **项目名解析**（高→低）：`-p/--project-name` > `COMPOSE_PROJECT_NAME` > 顶层 `name:` > **目录名**。

## 一、先分清两条路径（最容易混淆的地方）

Compose 里「环境变量」有两条完全不同的路径，绝大多数困惑源于把它们混为一谈：

1. **插值（interpolation）**：在**解析 compose 文件时**，用 shell 环境变量或项目根 `.env` 里的值，替换文件里的 `${VAR}` 占位。作用对象是 **compose 文件本身**。
2. **容器内环境变量**：通过服务的 `environment` / `env_file` 属性，把变量**注入到容器进程**里。作用对象是**容器**。

```yaml
# .env（项目根）里有：TAG=1.2  PORT=8080
services:
  web:
    image: "myapp:${TAG:-latest}"   # ← 插值：用 .env 的 TAG 替换，得 myapp:1.2
    ports:
      - "${PORT}:3000"              # ← 插值：得 "8080:3000"
    environment:
      - APP_ENV=production          # ← 注入容器：容器内能读到 APP_ENV
      - TAG                         # ← 注入容器：把 shell/宿主的 TAG 透传进容器
```

::: warning .env 里的变量默认不进容器
`.env` 里的 `TAG`、`PORT` **只用于插值**，它们**不会自动出现在容器里**。上例中容器能读到 `TAG`，是因为 `environment` 里显式写了 `- TAG` 把它透传进去。想让某个 `.env` 变量进容器，必须在 `environment` 或 `env_file` 里引用它。
:::

## 二、插值语法：默认值、必填、转义

插值把 shell / `.env` 的值替换进 compose 文件。除简单的 `${VAR}` 外，有一组带默认值与报错的语法：

```yaml
services:
  web:
    image: "webapp:${TAG:-latest}"           # 未设置或为空 → latest
    ports:
      - "${PORT-8080}:80"                     # 仅未设置 → 8080（空值仍用空）
    environment:
      REQUIRED_KEY: "${MUST_SET:?该变量必须设置}"  # 未设置或为空 → 报错退出
      FLAG: "${DEBUG:+enabled}"               # 已设置且非空 → enabled，否则为空
```

| 写法 | 触发条件 | 结果 |
| --- | --- | --- |
| `${VAR:-default}` | VAR **未设置或为空** | 用 default |
| `${VAR-default}` | VAR **未设置**（空值不触发） | 用 default |
| `${VAR:?err}` | VAR 未设置或为空 | 打印 err 并**报错退出** |
| `${VAR?err}` | VAR 未设置 | 打印 err 并**报错退出** |
| `${VAR:+val}` | VAR 已设置**且非空** | 用 val（否则空） |
| `${VAR+val}` | VAR **已设置**（含空） | 用 val（否则空） |

两个易错点：

- **`:-` vs `-` 的区别在「空值」**：带冒号的把「设置成空字符串」也当作「未设置」；不带冒号的只看变量是否被设置。`:?`/`?`、`:+`/`+` 同理。
- **`$$` 转义字面 `$`**：想在文件里保留一个真正的 `$`（不被插值），写 `$$`。典型场景是 healthcheck 里引用**容器内**变量：

```yaml
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $${POSTGRES_USER}"]  # $$ → 容器内解析 $POSTGRES_USER
```

- **引号规则**：插值只对**无引号与双引号**的值生效；**单引号**值按字面处理，不做插值。

## 三、`.env` 文件

```bash
# .env（默认放项目根，与 compose.yaml 同级）
TAG=1.2
PORT=8080
POSTGRES_PASSWORD="s3cr3t"     # 双引号支持 \n \t \\ 等转义
# 以 # 开头是注释，空行忽略
```

- Compose **自动加载项目根的 `.env`**，其变量用于文件插值。
- `--env-file ./config/.env.dev` 覆盖默认；可链式 `--env-file a --env-file b`（**后者覆盖前者**）。
- 语法：`KEY=VALUE`（也支持 `KEY: VALUE`）、`#` 注释、空行忽略；双引号支持转义、单引号按字面。
- `.env` 只服务于**插值**（见第一节），不等同于服务的 `env_file` 属性。

## 四、容器内变量的优先级

当同一个变量在多处被定义，容器最终看到的值按下面的优先级（**高 → 低**）决定：

1. **`docker compose run -e KEY=VAL`**（命令行，最高）
2. **shell 环境变量**（经插值进入 `environment` / `env_file` 的值）
3. **compose 文件 `environment` 属性**（显式写死的值）
4. **`env_file` 属性**引入的值
5. **Dockerfile 的 `ENV`**（最低）

记忆法：越「靠近命令行/越显式」的越优先，镜像里烘焙的 `ENV` 垫底。再次强调：`.env` / shell 变量要能进容器，前提是被 `environment`/`env_file` 引用（第一节）。

## 五、profiles：按需启用服务

`profiles` 让一部分服务**默认不启动**，只有显式激活对应 profile 时才起——适合把调试工具、可选组件、seed 任务从默认启动集里摘出去。

```yaml
services:
  backend:              # 无 profiles = 始终启动（核心服务）
    image: backend
  db:
    image: postgres:17-alpine
  frontend:
    image: frontend
    profiles: [frontend]   # 仅 frontend profile 激活时启动
  phpmyadmin:
    image: phpmyadmin
    depends_on: [db]
    profiles: [debug]      # 仅 debug profile 激活时启动
```

```bash
docker compose up                                    # 只起 backend、db（无 profile 的）
docker compose --profile debug up                    # 起 backend、db、phpmyadmin
COMPOSE_PROFILES=frontend,debug docker compose up     # 用环境变量激活多个
docker compose --profile "*" up                      # 激活全部 profile
docker compose run phpmyadmin                         # 显式点名 → 自动激活其 profile 与依赖
```

- **未分配 profile 的服务始终启用**；分配了 profile 的仅在该 profile 激活时启动。
- 激活方式等价：`--profile x`（可多次）或 `COMPOSE_PROFILES=x`（逗号分隔多个）；`--profile "*"` 全开。
- **自动激活**：命令行**显式点名**一个带 profile 的服务（如 `run`/`up 某服务`），无需手动开 profile，其自身 profile 与 `depends_on` 依赖会一并启动。
- 合法 profile 名：`[a-zA-Z0-9][a-zA-Z0-9_.-]+`。

## 六、COMPOSE_* 环境变量与项目名

Compose 认一组 `COMPOSE_*` 环境变量，等价于命令行标志，便于在 CI / shell profile 里固定：

| 变量 | 作用 |
| --- | --- |
| `COMPOSE_PROJECT_NAME` | 项目名（等价 `-p`） |
| `COMPOSE_FILE` | 指定 compose 文件，替代多个 `-f`（用路径分隔符分隔，Linux/Mac 默认 `:`） |
| `COMPOSE_PROFILES` | 激活的 profile（逗号分隔） |
| `COMPOSE_ENV_FILES` | 指定 env 文件（等价 `--env-file`） |
| `DOCKER_HOST` | 目标 Docker 守护进程 |

**项目名解析顺序**（高 → 低）：

1. `-p` / `--project-name` 标志
2. `COMPOSE_PROJECT_NAME` 环境变量
3. 顶层 `name:` 属性
4. **所在目录名**（默认）

项目名会作为网络、卷等资源的命名前缀（如 `<项目名>_default`），也可在文件里用 `${COMPOSE_PROJECT_NAME}` 插值引用。

## 下一步

- `environment` / `env_file` 在 service 里的写法与优先细节见 [服务配置](./services.md)。
- 资源命名前缀、默认网络与卷名见 [网络与数据卷](./networking-volumes.md)。
- 多文件叠加、`include`、`extends`、Watch 见 [进阶组合](./advanced.md)。
- 插值与合并速记、常见坑见 [参考](../reference.md)。
