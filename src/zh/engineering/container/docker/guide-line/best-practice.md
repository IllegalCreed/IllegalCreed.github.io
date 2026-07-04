---
layout: doc
outline: [2, 3]
---

# 指南 - 最佳实践

> 基于 Docker（Engine 2x / BuildKit 默认）· 核于 2026-07

## 速查

- **精简基础镜像**：优先 `alpine`（<6MB）/`-slim`/**distroless**/`scratch`；小 = 拉取快、攻击面小、扫描干净。
- **多阶段构建**：编译在 build 阶段、产物 `COPY --from` 进极小运行镜像，甩掉工具链。
- **非 root 运行**：`RUN` 建专用用户 + `USER app`；容器**默认 root 是安全红线**。
- **`.dockerignore`**：排除 `node_modules`/`.git`/`dist`/密钥，缩小上下文、防泄密、加速构建。
- **合并 RUN**：`apt-get update && install && rm -rf /var/lib/apt/lists/*` **同层**完成并清缓存。
- **缓存友好排序**：依赖清单先拷、装依赖，再拷源码（改代码不重装依赖）。
- **`COPY` 优先于 `ADD`**；`--no-install-recommends` / `--omit=dev` 少装东西。
- **exec form 启动**：`CMD ["node","app.js"]`，保证 PID 1 收信号、能优雅退出。
- **一容器一进程**：应用与数据库/缓存拆开，用网络互联，容器保持无状态、可随时重建。
- **tag vs digest**：可复现/生产用 `@sha256:` **digest 锁死**；`latest` 只用于本地随手跑。
- **HEALTHCHECK + STOPSIGNAL**：给编排层健康信号；处理 `SIGTERM` 做优雅关闭。
- **安全**：丢弃多余 capabilities、`--read-only` 根文件系统、密钥用 `--mount=type=secret`/运行时注入而非写进镜像、定期重建拉安全补丁、镜像扫描（`docker scout`）。

## 一、把镜像做小

镜像越小，拉取越快、启动越快、被攻击面越小、漏洞扫描越干净。三招叠加：

### 选对基础镜像

| 基础镜像                         | 体积       | 说明                                       |
| -------------------------------- | ---------- | ------------------------------------------ |
| `ubuntu` / `debian`              | ~30–70MB+  | 全功能，调试方便，但大                     |
| `node:22-slim` / `python:3-slim` | 中等       | 官方精简版，去掉文档/多余包                |
| `alpine` / `node:22-alpine`      | ~5–50MB    | musl libc 极小；注意 glibc 兼容/DNS 差异   |
| **distroless**（`gcr.io/distroless/*`） | 小   | 只有运行时 + 应用，**无 shell/包管理器**，攻击面极小 |
| `scratch`                        | 0          | 空镜像，适合静态编译的单二进制（Go/Rust）  |

::: tip alpine 的坑
alpine 用 musl libc（非 glibc），某些依赖 glibc 的二进制（如部分 Node 原生模块、`node-gyp` 产物）会跑不起来或 DNS 行为不同。遇到怪问题先换 `-slim`（debian 系）验证是否 libc 差异。
:::

### 多阶段构建甩掉工具链

```dockerfile
# 构建阶段：全套编译工具
FROM golang:1.25 AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o /bin/app ./cmd/server

# 运行阶段：distroless，只有二进制
FROM gcr.io/distroless/static-debian12
COPY --from=build /bin/app /app
USER nonroot:nonroot
ENTRYPOINT ["/app"]
```

### 合并 RUN、同层清理

每个 `RUN` 是一层，且**删文件不会缩小之前层**——必须在**同一层**装完就清：

```dockerfile
# ✅ 同层装 + 清，真正减小体积
RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates curl \
 && rm -rf /var/lib/apt/lists/*

# ❌ 分层：rm 只在新层加 whiteout，之前层的体积还在镜像里
RUN apt-get update
RUN apt-get install -y curl
RUN rm -rf /var/lib/apt/lists/*
```

## 二、.dockerignore 必配

构建上下文（`docker build .` 的 `.`）会整个打包发给构建后端。不排除就会把 `node_modules`、`.git`、构建产物甚至 `.env` 密钥一起打进去——上下文巨大、构建变慢、还可能泄密。

```gitignore
# .dockerignore
.git
node_modules
dist
build
*.log
.env
.env.*
Dockerfile
.dockerignore
**/.DS_Store
coverage
```

语法同 `.gitignore`。规则：**该进镜像的才留，其余全排除**。

## 三、以非 root 运行

容器里默认用户是 **root**（UID 0）。一旦容器被攻破，root + 内核漏洞 = 逃逸到宿主的风险。**基线是切非 root**：

```dockerfile
# Debian 系：建专用用户/组
RUN groupadd -r app && useradd --no-log-init -r -g app app
# Alpine：
# RUN addgroup -S app && adduser -S -G app app

WORKDIR /app
COPY --chown=app:app . .
USER app                        # 之后所有指令 + 运行进程都是 app 用户
CMD ["node", "server.js"]
```

- 很多官方镜像自带非 root 用户（如 `node` 镜像有 `node` 用户，distroless 有 `nonroot`）。
- 运行时也可强制：`docker run --user 1000:1000 ...`。
- 别装 `sudo`；确需降权启动脚本用 `gosu`/`su-exec`。

## 四、安全加固

```bash
# 只读根文件系统 + 可写目录用 tmpfs（应用不该改自己的镜像文件）
docker run --read-only --tmpfs /tmp my-app

# 丢弃所有 capabilities，只加回必需的
docker run --cap-drop=ALL --cap-add=NET_BIND_SERVICE my-app

# 禁止提权（阻止 setuid 拿到新特权）
docker run --security-opt=no-new-privileges my-app

# 限制资源，防单容器拖垮宿主
docker run --memory=512m --cpus=1 --pids-limit=200 my-app
```

密钥管理红线：

- **别把密钥写进镜像**——`ENV`/`ARG` 都会留在镜像/`docker history` 里。
- 构建期密钥用 `RUN --mount=type=secret`；运行期用 `docker run --env-file`、编排层 secret、或密钥管理服务注入。
- **定期重建镜像**拉基础镜像的安全补丁；用 `docker scout cves <镜像>` 或 Trivy 扫漏洞。
- 只从可信来源拉镜像（Docker Official / Verified Publisher），并锁 digest（见下）。

## 五、tag vs digest：可复现性

`:latest` 是**浮动标签**——今天和明天拉到的可能是不同镜像，破坏可复现构建。

```dockerfile
FROM node:22-alpine                    # 跟着 22-alpine 的更新走（会变）
FROM node:22.14.0-alpine               # 锁小版本（较稳）
FROM node:22-alpine@sha256:abc123...   # 锁 digest（完全不可变，生产/CI 推荐）
```

- **digest（`@sha256:...`）** 指向内容哈希，**永远是同一个镜像**，供应链最稳。
- 生产/CI：锁 digest + 用 Dependabot/Renovate 自动升级并留记录。
- 本地随手跑：`:latest` 或 `:主版本` 够用。

## 六、容器设计原则

- **一容器一进程（单一职责）**：Web、DB、缓存各一个容器，用[自定义网络](./storage-network.md#默认-bridge-vs-自定义-bridge关键差异)按名互联；别在一个容器里塞 nginx+php+mysql。
- **容器无状态、可随时重建（ephemeral）**：任何持久数据放 [volume](./storage-network.md#volumedocker-托管的持久卷) 或外部服务，容器本身删了重建应无影响。
- **配置从外部注入**：走环境变量 / 挂载配置文件，同一镜像跑遍 dev/staging/prod。
- **日志打到 stdout/stderr**：交给 Docker 日志驱动收集，别在容器里写日志文件。

## 七、优雅关闭与健康检查

```dockerfile
STOPSIGNAL SIGTERM                     # docker stop 默认就发 SIGTERM
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1
CMD ["node", "server.js"]             # exec form：node 是 PID 1，能直接收到 SIGTERM
```

- `docker stop` 先发 `SIGTERM`，默认等 **10 秒**再 `SIGKILL`。应用要**监听 SIGTERM**，停止收新请求、放完在途请求再退出。
- 用 **exec form** 保证应用是 PID 1 直接收信号；若用启动脚本，脚本里 `exec "$@"` 把 PID 1 交给应用。
- `HEALTHCHECK` 让编排层（Compose/K8s/Swarm）知道容器"真的可用"，据此路由流量或重启。

## 八、一份"生产级" Node 应用 Dockerfile 参考

```dockerfile
# syntax=docker/dockerfile:1
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    corepack enable && pnpm install --frozen-lockfile --prod=false

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN corepack enable && pnpm build

FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
# 只拷生产依赖 + 构建产物
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./
USER node                              # 官方 node 镜像自带非 root 用户
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1
CMD ["node", "dist/server.js"]
```

## 下一步

- 指令细节（多阶段/缓存挂载）见 [Dockerfile](./dockerfile.md)。
- 隔离/capabilities 的内核原理见 [引擎架构](./architecture.md#四、namespaces--cgroups)。
- 一键速查见 [参考](../reference.md)。
