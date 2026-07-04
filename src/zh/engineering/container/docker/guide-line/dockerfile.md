---
layout: doc
outline: [2, 3]
---

# 指南 - Dockerfile

> 基于 Docker（Engine 2x / BuildKit 默认）· 核于 2026-07

## 速查

- **两种命令形态**：**exec form** `["exe","arg"]`（推荐，直接 execve、无 shell、能收信号、进程是 PID 1）；**shell form** `cmd arg`（套一层 `/bin/sh -c`，支持变量展开但吞信号）。
- **`CMD` vs `ENTRYPOINT`**：`ENTRYPOINT` 定"固定要跑的程序"，`CMD` 定"默认参数/命令"；`docker run` 尾随参数**覆盖 CMD、追加到 ENTRYPOINT**。最佳组合：`ENTRYPOINT` exec form + `CMD` 给默认参数。
- **`COPY` vs `ADD`**：一律用 **`COPY`**；`ADD` 只在需要**自动解压本地 tar** 或**拉远程 URL/Git**（带 `--checksum`）时用。
- **`ARG` vs `ENV`**：`ARG` 是**构建期**变量（`--build-arg` 传，不进最终镜像，会被 `docker history` 看到，别放密钥）；`ENV` **写进镜像、运行时也在**。`ENV` 同名会覆盖 `RUN` 里的 `ARG`。
- **`ARG` 在 `FROM` 之前**：唯一可先于 `FROM` 的指令；跨 stage 用需在每个 stage 内**重新声明**。
- **`WORKDIR`**：设工作目录（会自动创建），可用 `ENV` 变量；别用 `RUN cd`。
- **`EXPOSE`**：只是**文档声明**，不发布端口；发布靠 `docker run -p`。
- **`VOLUME`**：声明挂载点；BuildKit 下 `VOLUME` 之后对该路径的改动会**保留**（旧 builder 会丢）。
- **`USER`**：切换后续指令与运行用户，安全基线是**非 root**。
- **`HEALTHCHECK`**：定义健康探测，状态见 `docker ps` 的 `(healthy)`。
- **多阶段构建**：多个 `FROM ... AS 名`，`COPY --from=名` 只捞产物，把编译工具链甩掉，最终镜像极小。
- **缓存分层**：**变动少的放上面、变动多的放下面**；先 `COPY package.json` 装依赖，再 `COPY . .` 拷源码——改代码不重装依赖。
- **`syntax` 指令**：文件首行 `# syntax=docker/dockerfile:1` 锁定/更新前端，解锁 `RUN --mount` 等 BuildKit 特性。

## 一、Dockerfile 骨架与构建流程

Dockerfile 是一份**声明式**文本，`docker build` 逐条执行、每条改文件系统的指令产出一个**只读层**，最终堆成镜像。

```dockerfile
# syntax=docker/dockerfile:1
FROM node:22-alpine                 # 基础镜像（第一条有效指令）
WORKDIR /app                        # 工作目录
COPY package.json pnpm-lock.yaml ./ # 先拷依赖清单（利用缓存）
RUN npm ci --omit=dev               # 装依赖
COPY . .                            # 再拷源码
EXPOSE 3000                         # 声明端口（仅文档）
USER node                           # 非 root 运行
CMD ["node", "server.js"]           # 默认启动命令
```

```bash
docker build -t my-app:1.0 .        # . 是"构建上下文"，会打包发给 daemon/BuildKit
```

::: tip 构建上下文（build context）
`docker build` 末尾的 `.` 是上下文目录，整个目录会被打包送给构建后端，`COPY`/`ADD` 只能引用其中的文件。务必配 `.dockerignore` 排除 `node_modules`、`.git`、构建产物，否则上下文巨大、构建变慢、还可能把密钥拷进镜像。
:::

## 二、RUN / CMD / ENTRYPOINT

### RUN：构建期执行

在**构建时**跑命令并把结果固化成一层。两种形态：

```dockerfile
RUN apk add --no-cache curl        # shell form：/bin/sh -c "..."，支持 && | 变量展开
RUN ["/bin/sh", "-c", "echo $VAR"] # exec form：不过 shell，变量不展开（除非显式 sh -c）
```

多条命令合并进一个 `RUN`（用 `&&` 串联 + `\` 换行）以**减少层数**、并保证 `apt update` 与 `install` 同层（避免缓存陷阱）：

```dockerfile
RUN apt-get update && apt-get install -y --no-install-recommends \
      ca-certificates \
      curl \
 && rm -rf /var/lib/apt/lists/*     # 同层清理缓存，才能真正减小体积
```

BuildKit 下 `RUN` 支持 `--mount`（见本页第七节），如缓存挂载、密钥挂载。

### CMD：默认命令/参数

`CMD` 给容器一个**默认**要跑的东西，`docker run` 后面跟的参数会**覆盖**它。一个 Dockerfile 只有最后一条 `CMD` 生效。

```dockerfile
CMD ["node", "server.js"]          # exec form（推荐）
CMD node server.js                 # shell form（套 sh -c）
CMD ["--port", "8080"]             # 只给参数（配合 ENTRYPOINT 用）
```

### ENTRYPOINT：固定入口程序

`ENTRYPOINT` 定义容器"天生就是干这个的"，`docker run` 的尾随参数会**追加**到它后面，而不是覆盖。

```dockerfile
ENTRYPOINT ["nginx"]               # exec form（推荐）
ENTRYPOINT nginx -g 'daemon off;'  # shell form（会被 /bin/sh -c 包裹，吞信号）
```

### CMD 与 ENTRYPOINT 如何配合（重点）

黄金组合：**`ENTRYPOINT` 定程序（exec form）+ `CMD` 给默认参数**。这样默认能跑，`docker run` 又能只改参数：

```dockerfile
ENTRYPOINT ["nginx", "-g", "daemon off;"]
CMD []                             # 默认无额外参数

# 或参数化：
ENTRYPOINT ["python", "app.py"]
CMD ["--port", "8080"]             # docker run img --port 9090 → 换端口，不用重指定 python app.py
```

官方交互表（记住这张就够）：

| 组合                         | 无 ENTRYPOINT              | ENTRYPOINT exec 形式                        |
| ---------------------------- | -------------------------- | ------------------------------------------- |
| 无 CMD                       | 报错                       | `exec_entry p1_entry`                       |
| CMD exec 形式 `["e","p"]`    | `exec_cmd p1_cmd`          | `exec_entry p1_entry exec_cmd p1_cmd`（追加）|
| CMD shell 形式               | `/bin/sh -c exec_cmd`      | `exec_entry p1_entry /bin/sh -c exec_cmd`   |

::: warning 一定用 exec form
shell form（`ENTRYPOINT node app.js`）会被包成 `/bin/sh -c "node app.js"`，于是 **PID 1 是 sh 而非你的进程**，`SIGTERM` 传不到应用 → `docker stop` 只能等 10 秒后被 `SIGKILL` 强杀，优雅关闭失效。exec form（`["node","app.js"]`）让应用直接当 PID 1、正常收信号。
:::

## 三、COPY vs ADD

两者都能把文件拷进镜像，**默认一律用 `COPY`**——语义清晰、无意外。

```dockerfile
COPY package.json ./               # 拷单文件
COPY src/ /app/src/                # 拷目录
COPY --chown=node:node . /app      # 拷同时改属主
COPY --from=build /bin/app /app    # 从其它 stage 拷（多阶段）
```

`ADD` 比 `COPY` 多两个"魔法"，也仅在需要它们时才用：

```dockerfile
ADD https://example.com/app.tar.gz /tmp/   # ① 拉远程 URL（建议配 --checksum 校验）
ADD --checksum=sha256:abc... app.tgz /opt/
ADD release.tar.gz /opt/app/               # ② 自动解压本地 tar（.tar/.gz/.bz2/.xz）
```

| 能力              | COPY | ADD                    |
| ----------------- | ---- | ---------------------- |
| 拷本地文件/目录   | ✅   | ✅                     |
| 自动解压本地 tar  | ❌   | ✅                     |
| 拉远程 URL        | ❌   | ✅（支持 `--checksum`）|
| 拉 Git 仓库       | ❌   | ✅（BuildKit）         |
| 语义可预期        | ✅   | 有隐式行为             |

::: tip 为什么不用 ADD 拉 URL
`ADD url` 下载的文件不做 mtime 缓存判断、不便校验，且容易把无关逻辑塞进构建。推荐 `RUN curl -fsSL url -o file`（可控、可校验、可清理），需要缓存/密钥再用 `RUN --mount`。
:::

## 四、ARG vs ENV

两者都是变量，但**生命周期完全不同**。

### ARG：构建期变量

- 只在 **build 阶段**存在，`docker build --build-arg KEY=val` 传入，**不写进最终镜像**。
- 作用域从声明行开始到当前 stage 结束；跨 stage 要**重新声明**。
- 可放在 `FROM` **之前**（唯一能先于 `FROM` 的指令），用来参数化基础镜像版本。

```dockerfile
ARG NODE_VERSION=22                # 全局 ARG（FROM 之前）
FROM node:${NODE_VERSION}-alpine

ARG BUILD_ENV=production           # stage 内 ARG，需在本 stage 重新声明
RUN echo "building for $BUILD_ENV"
```

### ENV：运行期环境变量

- 写进镜像、**运行时也存在**，`docker inspect` 看得到，`docker run --env` 可覆盖。
- 对后续所有指令生效，子 stage 继承父 stage 的 ENV。

```dockerfile
ENV NODE_ENV=production \
    PORT=3000
```

### 二者关系与坑

```dockerfile
ARG VERSION                        # 构建期传入
ENV APP_VERSION=${VERSION}         # 固化进镜像（想让运行时也能读，就这样"转存"）
```

- **`ENV` 优先级高于 `ARG`**：`RUN` 里同名时用 `ENV` 的值。
- **别拿 ARG/ENV 放密钥**：`ARG` 会出现在 `docker history`，`ENV` 直接躺在镜像里。传密钥用 **`RUN --mount=type=secret`**（见第七节）。

## 五、其它常用指令

```dockerfile
WORKDIR /app                       # 设工作目录（不存在自动建），别用 RUN cd
EXPOSE 3000/tcp                    # 声明监听端口（仅文档，不发布），协议默认 tcp
VOLUME ["/data"]                   # 声明匿名卷挂载点
LABEL org.opencontainers.image.source="https://github.com/me/app"  # 元数据
STOPSIGNAL SIGTERM                 # docker stop 发的信号（默认 SIGTERM）
SHELL ["/bin/bash", "-c"]          # 改 shell form 用的默认 shell
ONBUILD COPY . /app                # 当本镜像被当作基础镜像时才触发（做 base 镜像用）
```

### HEALTHCHECK

让 Docker 定期探测容器是否"真的还活着"，状态显示在 `docker ps` 的 `(healthy)/(unhealthy)`：

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -fsS http://localhost:3000/health || exit 1
```

- `--interval`：探测间隔；`--timeout`：单次超时；`--retries`：连续失败几次判 unhealthy。
- `--start-period`：启动宽限期，此期间失败不计数（给应用冷启动时间）。
- 探测命令 `exit 0` = 健康，`exit 1` = 不健康。编排层（Compose/K8s）可据此决定是否流量导入/重启。

::: warning EXPOSE ≠ 发布端口
`EXPOSE` 只是给读者/工具看的"我监听这个口"声明，**不会**让外部访问到。真正对外发布要 `docker run -p 主机:容器`，见 [存储与网络](./storage-network.md#端口发布)。
:::

## 六、多阶段构建（Multi-stage）

用多个 `FROM` 把"构建环境"和"运行环境"分开：编译阶段带全套工具链，最终阶段只 `COPY --from=` 捞出产物，**镜像体积从几百 MB 降到几 MB**。

```dockerfile
# ---- Stage 1: 构建（带编译器/依赖） ----
FROM golang:1.25 AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o /bin/app ./cmd/server

# ---- Stage 2: 运行（极小基础镜像） ----
FROM gcr.io/distroless/static-debian12
COPY --from=build /bin/app /app     # 只捞编译产物，不带 Go 工具链
EXPOSE 8080
ENTRYPOINT ["/app"]
```

要点：

- `FROM ... AS 名` 给 stage 命名，`COPY --from=名`（或 `--from=0` 用序号）跨 stage 拷贝。
- `--from` 也能引用**外部镜像**：`COPY --from=nginx:latest /etc/nginx/nginx.conf ./`。
- `docker build --target build .` 可**只构建到某个 stage**（调试、或产出 dev/prod 变体）。
- 前面的 stage 若最终没被 `COPY --from` 用到，BuildKit 会**自动跳过**不执行。

前端典型（Node 构建 → Nginx 托管静态产物）：

```dockerfile
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build                       # 产出 dist/

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
```

## 七、缓存分层优化与 BuildKit 挂载

### 缓存怎么失效

每条指令是一层，Docker 命中缓存的前提是"这条及**它上面所有层**都没变"。**一旦某层失效，它下面（后续）的层全部重建**——哪怕内容其实没变。所以：

- **把最不常变的放前面，最常变的放后面。**
- **依赖清单先拷、装依赖，再拷源码**——这是最重要的一条：

```dockerfile
# ✅ 正确：改源码不会重装依赖
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile     # 只要锁文件没变，这层就命中缓存
COPY . .                               # 源码天天改，放最后
RUN pnpm build

# ❌ 错误：先拷全部，任何源码改动都让 install 重跑
COPY . .
RUN pnpm install
RUN pnpm build
```

- `COPY`/`ADD` 按**文件内容 + 元数据**判断是否变化；`RUN` 按**指令字符串**判断（内容变了也不知道，需 `--no-cache` 或改指令）。

### RUN --mount：缓存挂载与密钥挂载（BuildKit）

首行加 `# syntax=docker/dockerfile:1` 解锁：

```dockerfile
# syntax=docker/dockerfile:1
FROM node:22-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
# 缓存挂载：把 pnpm store 缓存在跨构建复用的目录，二次构建秒装
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    corepack enable && pnpm install --frozen-lockfile
```

密钥挂载（不把密钥留在任何层里）：

```dockerfile
# docker build --secret id=npmrc,src=$HOME/.npmrc .
RUN --mount=type=secret,id=npmrc,target=/root/.npmrc \
    pnpm install --frozen-lockfile
```

`RUN --mount` 类型：`cache`（编译/依赖缓存）、`secret`（密钥，不入镜像）、`ssh`（拉私有仓库）、`bind`（只读挂上下文/其它 stage）、`tmpfs`（内存临时目录）。

## 下一步

- 数据卷、绑定挂载、tmpfs 与容器网络见 [存储与网络](./storage-network.md)。
- 缓存背后的分层/CoW 与 BuildKit 原理见 [引擎架构](./architecture.md)。
- 精简镜像、非 root、`.dockerignore`、digest 锁定见 [最佳实践](./best-practice.md)。
- 全量指令速查见 [参考](../reference.md)。
