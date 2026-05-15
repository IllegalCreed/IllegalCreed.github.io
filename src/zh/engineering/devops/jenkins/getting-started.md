---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Jenkins LTS + 声明式 Pipeline 编写

## 速查

- 安装：官方镜像 `docker run -p 8080:8080 -p 50000:50000 -v jenkins_home:/var/jenkins_home jenkins/jenkins:lts`
- Pipeline 定义文件：仓库根目录 `Jenkinsfile`（无后缀，Groovy DSL）
- 顶层骨架：`pipeline { agent / stages / steps }` 三件必备
- 执行位置：`agent any` 任意节点 / `agent { label 'linux' }` 标签匹配 / `agent { docker '...' }` 容器
- 阶段：`stages { stage('Build') { steps { sh '...' } } }`
- 触发：Webhook（SCM 配置）/ `triggers { cron('H 4 * * *') }` / 手动
- 变量：`env.BUILD_NUMBER` / `params.BRANCH` / `currentBuild.result`
- 凭据：`environment { TOKEN = credentials('github-token') }` 或 `withCredentials([...]) { ... }`
- 收尾：`post { always {} success {} failure {} }`
- Multibranch：仓库里有 Jenkinsfile，Jenkins 自动为每个分支建 Job

## 安装与第一次启动

最快路径是 Docker：

```bash
docker volume create jenkins_home

docker run -d --name jenkins \
  -p 8080:8080 -p 50000:50000 \
  -v jenkins_home:/var/jenkins_home \
  jenkins/jenkins:lts
```

打开 `http://localhost:8080`，按提示从 `/var/jenkins_home/secrets/initialAdminPassword` 读初始密码：

```bash
docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword
```

完成"安装推荐插件"→ 创建管理员账号 → 进入主界面。

::: tip 长期支持版（LTS）vs Weekly

- **LTS**（如 2.426.x）：每 12 周一次，跟着安全补丁滚；生产环境只选这条线
- **Weekly**：每周发布，最新特性最早到，但回归风险大，本地试用可以，生产慎用

:::

## Pipeline 与 Jenkinsfile

Jenkins 有三种"Job"形态：

| 类型                        | 适合          | 说明                                                                        |
| --------------------------- | ------------- | --------------------------------------------------------------------------- |
| Freestyle Project           | 老项目 / 简单 | 全部点击配置，不进版本控制，难维护                                          |
| Pipeline                    | 单分支项目    | 写一份 Jenkinsfile，可放仓库里或在 Jenkins UI 里                            |
| **Multibranch Pipeline**    | **现代首选**  | Jenkins 扫描 SCM 仓库，**每个分支都有自己的 Jenkinsfile**，PR / Tag 都自动跑 |

新项目直接选 Multibranch Pipeline，把 Jenkinsfile 放仓库根目录，与代码一起 review、一起演进。

## 第一份 Jenkinsfile

```groovy
// Jenkinsfile（放在仓库根目录）
pipeline {
  agent any                                    // 在任意节点上跑

  stages {
    stage('Checkout') {
      steps {
        checkout scm                           // 拉取触发本次构建的代码
      }
    }

    stage('Install') {
      steps {
        sh 'pnpm install --frozen-lockfile'
      }
    }

    stage('Test') {
      steps {
        sh 'pnpm test'
      }
    }

    stage('Build') {
      steps {
        sh 'pnpm build'
      }
    }
  }

  post {
    success { echo '构建成功' }
    failure { echo '构建失败' }
  }
}
```

每个字段都解释一遍：

- **`pipeline {}`**：必备外壳，所有声明都在内
- **`agent any`**：在 Jenkins 集群中任意空闲节点上分配一个 executor + 工作区
- **`stages {}`**：阶段容器，至少一个 `stage`
- **`stage('Name') { steps { ... } }`**：阶段名 + 实际执行的 step 列表
- **`steps {}`**：每条 step 是一个内置函数（`sh` / `bat` / `echo`），或插件提供的扩展
- **`post {}`**：阶段或整条 pipeline 结束后跑，可按 success/failure/always 等条件分支

## agent 的几种写法

```groovy
// 1. 任意节点
agent any

// 2. 不分配（每个 stage 自己声明，节省 master 资源）
agent none

// 3. 标签匹配（推荐生产用法）
agent { label 'linux-build' }

// 4. Docker 容器
agent {
  docker {
    image 'node:22-alpine'
    args  '-v /var/cache/npm:/root/.npm'
  }
}

// 5. Kubernetes Pod
agent {
  kubernetes {
    yaml '''
      kind: Pod
      spec:
        containers:
          - name: jnlp
            image: node:22
    '''
  }
}
```

`agent none` + 每 stage 单独声明 agent 适合"不同阶段不同环境"场景（如 Build 用 Linux、Test 用 Windows）。

## 触发构建

三种常见姿势：

```groovy
triggers {
  // 1. 定时（Cron 风格，H 表示 hash 分散，避免所有 Job 同分触发）
  cron('H 4 * * 1-5')                   // 工作日凌晨 4 点附近

  // 2. SCM 轮询（不推荐，优先用 webhook）
  pollSCM('H/15 * * * *')               // 每 15 分钟查一次仓库

  // 3. 上游构建完成后触发
  upstream(upstreamProjects: 'libs/main', threshold: hudson.model.Result.SUCCESS)
}
```

**生产环境最佳实践**：在 GitHub / GitLab 仓库设置 Webhook → Jenkins，事件来了立刻触发，**不要用 pollSCM**（高频轮询既慢又增加服务器负载）。

## 环境变量与凭据

```groovy
pipeline {
  agent any

  environment {
    NODE_ENV   = 'production'                       // 字面量
    GIT_COMMIT = "${env.GIT_COMMIT}"                // 引用 Jenkins 注入的变量
    // 凭据：自动从 credentials store 解密注入
    GITHUB_TOKEN = credentials('github-pat')        // Secret Text
    AWS_KEY      = credentials('aws-access-key')    // Username/Password → 自动生成 _USR / _PSW
  }

  stages {
    stage('Deploy') {
      steps {
        sh 'echo $GITHUB_TOKEN | docker login ...'
        // AWS_KEY_USR + AWS_KEY_PSW 也可分开用
      }
    }
  }
}
```

凭据 ID（如 `github-pat`）在 **Manage Jenkins → Credentials** 里管理，Jenkinsfile 只引用 ID，密文从不进仓库。

需要在某个 step 临时用凭据（不污染 environment）：

```groovy
steps {
  withCredentials([usernamePassword(
    credentialsId: 'docker-registry',
    usernameVariable: 'DOCKER_USER',
    passwordVariable: 'DOCKER_PASS',
  )]) {
    sh 'docker login -u $DOCKER_USER -p $DOCKER_PASS'
  }
}
```

`withCredentials` 退出块后变量立刻失效，更安全。

## 一份能跑的最小 Multibranch Pipeline 示例

```
my-app/
├── src/
├── package.json
└── Jenkinsfile          ← 仓库根目录
```

```groovy
// Jenkinsfile
pipeline {
  agent { label 'linux' }

  options {
    timeout(time: 30, unit: 'MINUTES')               // 整体超时
    buildDiscarder(logRotator(numToKeepStr: '20'))   // 只保留最近 20 次构建日志
    timestamps()                                      // 控制台打时间戳
  }

  environment {
    NODE_VERSION = '22'
  }

  stages {
    stage('Install') {
      steps { sh 'pnpm install --frozen-lockfile' }
    }

    stage('Quality') {
      parallel {
        stage('Lint')  { steps { sh 'pnpm lint' } }
        stage('Type')  { steps { sh 'pnpm type-check' } }
        stage('Test')  { steps { sh 'pnpm test' } }
      }
    }

    stage('Build') {
      steps { sh 'pnpm build' }
    }

    stage('Deploy') {
      when { branch 'main' }                         // 只 main 分支部署
      steps {
        withCredentials([string(credentialsId: 'k8s-token', variable: 'TOKEN')]) {
          sh 'kubectl --token=$TOKEN apply -f k8s/'
        }
      }
    }
  }

  post {
    always  { junit 'reports/*.xml' }                // 收集测试报告
    failure { slackSend(message: "❌ ${env.JOB_NAME} #${env.BUILD_NUMBER}") }
  }
}
```

把它推到任意分支，Jenkins Multibranch Pipeline 自动发现并跑：

- `feature/*` → 只跑 lint + type + test + build
- `main` → 额外执行 Deploy stage

## 下一步

- 复杂场景（parallel / matrix / when 嵌套）见 [指南 - 高级流程控制](./guide-line.md#高级流程控制)
- 共享 Pipeline 代码避免复制粘贴见 [指南 - 共享库 Shared Library](./guide-line.md#共享库-shared-library)
- Master-Agent 架构与节点池见 [指南 - Master-Agent 架构](./guide-line.md#master-agent-架构)
- 凭据高级用法见 [指南 - 凭据与密钥](./guide-line.md#凭据与密钥)
- 与 GitHub Actions 对比见 [指南 - 与 GitHub Actions 对比](./guide-line.md#与-github-actions-对比)
