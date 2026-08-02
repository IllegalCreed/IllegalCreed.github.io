---
layout: doc
outline: [2, 3]
---

# 部署、Docker 与静态站：Git 自动部署与 Preview Environments

> 基于 Render 官方文档 · 核于 2026-08

## 速查

- **部署主路径：连 GitHub/GitLab → push 即部署**。Render 监听分支（默认 main），有 push 就自动拉代码、构建、滚动发布——零 CI 配置。
- **Docker 优先策略**：有 Dockerfile → 用 Dockerfile 构建（完全自定义）；无 Dockerfile → 自动检测运行时（Node/Python/Ruby/Go/Deno）用 Buildpack 推断。
- **render.yaml = 基础设施即代码**：用声明式 YAML 定义服务（类型/规格/环境变量/磁盘），随仓库版本化，可一键 Blueprint 重建整个环境。
- **Static Site 完全免费**：纯前端构建产物（HTML/CSS/JS、VitePress/Docusaurus/Vite SPA），$0/mo + 全球 CDN + 自动 HTTPS。
- **Preview Environments**：每个 PR 自动拉起一套临时环境（Web Service + Postgres + 静态站），合并/关闭后自动销毁——用于评审与测试。
- **构建命令 vs 启动命令**：构建命令（如 `npm run build`）在构建期跑一次产出产物；启动命令（如 `npm start`）是运行期容器的入口进程。
- **环境变量**：分 Plain/Secret/从文件读，服务级与环境级两层，**敏感配置必须用 Secret 类型**（加密存储，日志脱敏）。
- **滚动发布与回滚**：Render 默认滚动更新（新实例起来再下旧实例），失败可一键回滚到上一版镜像。

## 一、Git 自动部署：push 即上线

Render 的部署主路径是把仓库连到平台，靠 Git 事件触发：

```
开发者 git push origin main
        │
        ▼
  GitHub/GitLab 通知 Render
        │
        ▼
  Render 拉取代码
        │
        ▼
  构建阶段：检测运行时 / 用 Dockerfile
   - npm install / npm run build（Node）
   - 或 docker build
        │
        ▼
  发布阶段：滚动替换实例
   - 新实例启动并通过健康检查
   - 旧实例下线（零停机）
        │
        ▼
  上线完成，新版本对外生效
```

- **默认监听 main 分支**：可改配置监听任意分支。
- **自动 HTTPS**：域名绑定后 Render 自动签发 Let's Encrypt 证书并续期。
- **零 CI 配置**：不必写 GitHub Actions 部署 YAML，Render 自己就是部署器（当然你也可以用 Render API 接外部 CI 触发）。

## 二、Docker 优先：两种构建策略

Render 的构建分两条路径，**Dockerfile 优先**：

| 策略 | 触发条件 | 控制度 | 适用 |
| --- | --- | --- | --- |
| **Dockerfile 构建** | 仓库根有 `Dockerfile` | 完全自定义（基础镜像/构建步骤/启动命令） | 任意语言、自定义运行时、复杂构建 |
| **自动检测（Buildpack）** | 无 Dockerfile | Render 推断（语言→构建/启动命令） | 标准 Node/Python/Ruby/Go 项目，零配置 |

- **Dockerfile 示例**（Node 应用）：

  ```dockerfile
  FROM node:20-alpine
  WORKDIR /app
  COPY package*.json ./
  RUN npm ci --omit=dev
  COPY . .
  RUN npm run build
  EXPOSE 10000
  CMD ["npm", "start"]
  ```

- **Render 约定 `PORT` 环境变量**：容器监听 Render 注入的 `PORT`（不要硬编码端口），平台据此转发流量。
- **生产建议**：用 Dockerfile + `render.yaml`，让部署**完全可重复**——换平台或本地复现都方便。

## 三、render.yaml：基础设施即代码

`render.yaml`（Blueprint）让你用声明式 YAML 定义整个工作区的服务：

```yaml
services:
  - type: web                 # 长驻 HTTP 服务
    name: api
    env: docker               # 用 Dockerfile 构建
    region: singapore
    plan: starter             # $7/mo
    healthCheckPath: /health
    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: prod-db
          property: connectionString
      - key: API_KEY          # 敏感配置用 sync（Secret）
        sync: false
  - type: worker              # 后台 Worker
    name: queue-consumer
    env: docker
    plan: starter
  - type: pserv               # 私有服务（仅内网）
    name: internal-rpc
  - type: cron                # 定时任务
    name: nightly-report
    schedule: "0 2 * * *"
    command: npm run report
databases:
  - name: prod-db
    plan: basic               # $6/mo
    ipAllowList: []           # 仅内网访问
```

- **版本化**：`render.yaml` 进 Git，团队任何人 `render blueprint apply` 即可重建整套环境。
- **环境变量引用**：用 `fromDatabase` 自动注入数据库连接串，避免硬编码。
- **服务类型关键字**：`web`/`worker`/`pserv`（私有）/`cron`/`postgres`/`redis`。

## 四、静态站：免费 + CDN

Static Site 是纯前端项目（构建产物）的最佳归宿：

- **完全免费**（$0/mo）：不占长驻实例，按 CDN 分发。
- **自动构建**：指定构建命令（如 `npm run build`）与发布目录（如 `dist`、`public`）。
- **全球 CDN + 自动 HTTPS**：自带边缘分发与证书。
- **典型用途**：VitePress/Docusaurus 文档站、Vite 构建的 SPA、Hexo 博客、营销官网。

- **静态站 vs Web Service**：纯前端（无服务端渲染/无 API）用静态站（免费）；需要服务端逻辑（SSR、API、长连接）用 Web Service（$7/mo 起）。
- **JAMstack 友好**：静态站 + 客户端调第三方 API（如调 Supabase/Firebase）= 现代 JAMstack，零服务端成本。

## 五、Preview Environments：每个 PR 一套临时环境

Preview Environments 是 Render 的协作利器：

- **PR 触发**：每个 Pull Request 自动拉起一套**完整的临时环境**——Web Service + Postgres + 静态站都复制一份。
- **隔离测试**：评审者在隔离环境验证改动，不污染生产。
- **自动销毁**：PR 合并或关闭后，临时环境自动销毁，停止计费。
- **成本提示**：Preview 用的实例照常计费，存在期间按规格收费——别让 PR 长期挂着不合并。

## 六、环境变量与健康检查

- **环境变量三层**：①Plain（明文）；②Secret（加密存储、日志脱敏）；③从文件/数据库注入（如 `fromDatabase`）。**敏感配置（API Key/密码）必须用 Secret**。
- **健康检查（Health Check）**：Web Service 配 `healthCheckPath`（如 `/health`），Render 据此判断实例是否就绪——发布时新实例通过健康检查才接流量，保证零停机。
- **磁盘（Disk）**：Web Service/Worker 可挂持久化磁盘，但磁盘**不可跨实例共享**（单实例绑定）——需要共享存储用对象存储或数据库。

## 下一步

掌握了部署、Docker 与静态站后，下一步进入[参考](../reference)——服务类型速查、定价矩阵、Heroku 迁移对照与易错点清单，作为快速查阅与排错的手册。
