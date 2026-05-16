---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 Jenkins LTS + 声明式 Pipeline 编写

## 速查

- `parallel { ... }`：阶段间并发；`failFast true` 任一失败立刻中止其它分支
- `matrix { axes / stages }`：多维度组合（OS × Node 版本 × 浏览器）
- `when { branch / changeRequest / expression { } / allOf / anyOf / not }`：条件跳过 stage
- `input message: 'Deploy?'`：人工卡点，常用于生产部署
- `options { timeout / retry / disableConcurrentBuilds / buildDiscarder }`：Pipeline 级行为
- 共享库：`@Library('my-shared-lib@v1.2') _` 导入；`vars/` 全局函数，`src/` Groovy 类，`resources/` 模板文件
- 凭据 6 种：Secret Text / Username+Password / Secret File / SSH Key / Certificate / Docker Host
- Master-Agent：节点按 `label` 调度；动态扩容用 Kubernetes / EC2 / Docker 插件
- 安全：永远启用 CSRF、限制 `Script Console`、定期升级插件、敏感操作走凭据系统
- 与 GitHub Actions：Jenkins 胜在自托管 + 插件深度；GA 胜在 SaaS 体验 + 与 PR 流深度集成

## 高级流程控制

### 并行 stages

```groovy
stage('Quality Gates') {
  failFast true                                       // 任一失败立刻终止其它
  parallel {
    stage('Lint')       { steps { sh 'pnpm lint' } }
    stage('Type Check') { steps { sh 'pnpm type-check' } }
    stage('Unit Tests') { steps { sh 'pnpm test:unit' } }
    stage('E2E')        {
      agent { label 'linux-gui' }                     // 并行分支可单独声明 agent
      steps { sh 'pnpm test:e2e' }
    }
  }
}
```

并行块里每个分支可有独立的 agent / when / post，是真正"分卡运行"。

### 条件执行 when

```groovy
stage('Deploy Prod') {
  when {
    allOf {
      branch 'main'
      not { changeRequest() }                         // 不是 PR
      environment name: 'DEPLOY_LOCK', value: 'open'  // 全局变量为 open
    }
    beforeAgent true                                  // 条件不满足就不分配 agent，省资源
  }
  steps { sh './deploy.sh prod' }
}
```

可用比较条件：`branch / buildingTag / changeRequest / changelog / changeset / environment / equals / expression / tag / triggeredBy`，组合用 `allOf / anyOf / not`。

::: tip beforeAgent / beforeInput / beforeOptions

默认顺序是 options → agent → input → when。加 `beforeAgent true` 让 when 在 agent 分配前先判断，**对昂贵的 Docker / Cloud agent 节约非常明显**。

:::

### 矩阵构建 matrix

```groovy
stage('Cross-Platform Build') {
  matrix {
    axes {
      axis { name 'NODE_VERSION'; values '18', '20', '22' }
      axis { name 'OS';           values 'linux', 'windows', 'macos' }
    }

    excludes {
      // 排除 macos × node 18 这种历史组合
      exclude {
        axis { name 'OS'; values 'macos' }
        axis { name 'NODE_VERSION'; values '18' }
      }
    }

    stages {
      stage('Build') {
        agent { label "${OS}" }
        steps { sh "nvm use ${NODE_VERSION} && pnpm build" }
      }
    }
  }
}
```

矩阵 = `axes` 笛卡尔积 - `excludes` 排除项，每个组合各自分配 agent 并行执行。

### 人工卡点 input

```groovy
stage('Confirm Deploy') {
  input {
    message 'Deploy to production?'
    ok      'Yes, deploy'
    submitter 'admin,release-manager'                 // 限制谁能点
    parameters {
      string(name: 'TAG', defaultValue: 'v1.0.0', description: '部署版本号')
    }
  }
  steps {
    sh "./deploy.sh ${TAG}"
  }
}
```

input 步骤会**暂停 Pipeline 等待用户点击**，常用于"上线前最后一道闸"。注意：input 期间占用 executor，如果是付费云 agent 要算上等待成本——可以加 `agent none` 在外层、stage 里临时分配，避免 executor 长期挂着。

## 凭据与密钥

凭据全部存在 **Manage Jenkins → Credentials**，加密后保存到 controller 文件系统。Pipeline 里只引用 ID，永远不写明文。

### 6 种凭据类型 + 使用方式

| 类型                  | environment 注入               | withCredentials 块                                            |
| --------------------- | ------------------------------ | ------------------------------------------------------------- |
| Secret Text           | `TOKEN = credentials('id')`    | `string(credentialsId: 'id', variable: 'TOKEN')`              |
| Username + Password   | 同上，自动生成 `_USR` / `_PSW` | `usernamePassword(credentialsId, usernameVariable, passwordVariable)` |
| Secret File           | 路径注入到变量                 | `file(credentialsId, variable: 'PATH')`                       |
| SSH Username + Key    | 路径 + `_USR` + `_PSW`         | `sshUserPrivateKey(credentialsId, keyFileVariable, ...)`      |
| Certificate           | -                              | `certificate(credentialsId, ...)`                             |
| Docker Host Cert      | -                              | -                                                             |

### 完整示例

```groovy
pipeline {
  agent any

  // 方案 A：environment（整条 pipeline 都有）
  environment {
    NPM_TOKEN = credentials('npm-publish-token')      // Secret Text
    DB_CRED   = credentials('mysql-prod')             // Username+Password → DB_CRED_USR / DB_CRED_PSW
  }

  stages {
    stage('Publish') {
      steps {
        // 方案 B：withCredentials（只在块内有效）
        withCredentials([
          file(credentialsId: 'kubeconfig-prod', variable: 'KUBECONFIG'),
          sshUserPrivateKey(
            credentialsId: 'deploy-ssh',
            keyFileVariable: 'SSH_KEY',
            usernameVariable: 'SSH_USER',
          ),
        ]) {
          sh '''
            kubectl --kubeconfig=$KUBECONFIG apply -f k8s/
            ssh -i $SSH_KEY $SSH_USER@host './reload.sh'
          '''
        }
      }
    }
  }
}
```

::: warning 凭据日志保护

Jenkins 默认会把 environment 注入的凭据值在控制台打印时自动屏蔽（显示为 `****`）。但**字符串拼接 / Base64 编码后再 echo** 这类操作绕过保护，仍然会暴露原值。脚本里永远不要 `echo $TOKEN`，要 `echo "Token loaded"` 替代。

:::

## 共享库 Shared Library

把多个项目重复的 Pipeline 片段抽到独立 Git 仓库，所有 Jenkinsfile 一行 `@Library` 即可复用。

### 目录结构

```
my-shared-library/
├── vars/                       # 全局函数（文件名=变量名）
│   ├── deploy.groovy
│   └── notifySlack.groovy
├── src/                        # Groovy 类（包结构）
│   └── org/company/Helper.groovy
└── resources/                  # 文本资源（k8s.yaml.tpl 之类）
    └── k8s.yaml.tpl
```

### 配置全局库

**Manage Jenkins → System → Global Pipeline Libraries**：

- Name：`shared-lib`（Pipeline 里引用的名字）
- Default version：`main` 或 tag（如 `v1.0`）
- Retrieval method：Modern SCM → Git → 仓库 URL + 凭据

### Pipeline 里使用

```groovy
@Library('shared-lib@v1.0') _                         // 注意 _，必填，让注解生效

pipeline {
  agent any
  stages {
    stage('Deploy') {
      steps {
        deploy 'staging'                              // vars/deploy.groovy 的 call() 方法
        notifySlack(channel: '#ops', message: 'done') // vars/notifySlack.groovy
      }
    }
  }
}
```

### 写一个 var 函数

```groovy
// vars/deploy.groovy
def call(String env) {
  echo "Deploying to ${env}..."
  sh "./scripts/deploy.sh ${env}"
}
```

文件名 `deploy.groovy` → Pipeline 里 `deploy('staging')` 或 `deploy 'staging'`（Groovy 省括号）。

### 动态加载（运行时决定版本）

```groovy
library "shared-lib@${env.BRANCH_NAME}"               // 用当前分支同名的库版本
```

::: warning 共享库的信任级别

- **Global Trusted**：可访问 Jenkins API + 第三方 Java 代码，需 Overall/RunScripts 权限
- **Global Untrusted**：跑在 Groovy sandbox 里，受 Script Security 限制

写共享库要意识到自己处在哪个信任域；普通项目代码默认走 untrusted，只能调白名单方法。

:::

## Master-Agent 架构

```
┌─────────────────┐
│  Controller     │  ← Jenkins 主进程：管理 UI / 调度 / 凭据 / 配置
│  (master)       │
└────────┬────────┘
         │ 调度
         ↓
┌────────────────────────────────────┐
│  Agents（按 label 调度）           │
│   - linux-build (executors: 4)    │
│   - macos-arm   (executors: 2)    │
│   - windows     (executors: 2)    │
│   - k8s-dynamic (按需扩容)        │
└────────────────────────────────────┘
```

### 关键概念

- **Controller**：Jenkins 服务本身，做配置 + 调度，**不应跑构建任务**（安全 + 性能考量）
- **Agent**：独立 Java 进程，通过 SSH / JNLP 连到 controller；可在任意 OS
- **Executor**：agent 上的执行槽位，决定该节点最多同时跑几个任务
- **Label**：agent 的标签集合，Pipeline 用 `agent { label 'linux-build' }` 按 label 调度

### 三种节点形态

| 形态           | 适合                   | 特点                                                   |
| -------------- | ---------------------- | ------------------------------------------------------ |
| 静态节点       | 长期固定的机器         | 手动加，IP / SSH key 写死，重启自动重连                |
| Kubernetes Pod | 容器化 + 弹性          | `kubernetes` 插件 + Pod 模板，按需启停，跑完即销毁     |
| EC2 / Cloud    | AWS / GCP / Azure 用户 | `ec2 / Google Cloud / Azure VM` 插件，闲时关机省钱     |

### 配置静态 agent（SSH 方式）

1. **Manage Jenkins → Nodes → New Node**：选 Permanent Agent
2. 设 Remote root directory（如 `/var/jenkins`）
3. Labels：`linux-build linux docker`（空格分隔）
4. Launch method：Launch agents via SSH → 凭据选 SSH Username with key
5. Save → 节点自动连接

::: tip 不要在 controller 上跑构建

默认有个 "built-in node" 跑在 controller 进程里，安装时记得把它的 executor 数设为 0。原因：

- 构建脚本能读到 controller 的 `JENKINS_HOME` → 所有凭据 / 配置都暴露
- 大型构建吃光 controller 内存 → 整个 Jenkins 卡死

生产环境必须用独立 agent。

:::

## 与 GitHub Actions 对比

| 维度       | Jenkins                                         | GitHub Actions                                |
| ---------- | ----------------------------------------------- | --------------------------------------------- |
| 部署模式   | **自托管为主**（也有 CloudBees 商业 SaaS）      | SaaS 为主 + 可自托管 Runner                   |
| 配置文件   | Jenkinsfile（Groovy DSL）                       | `.github/workflows/*.yml`（YAML）             |
| 语法心智   | Declarative + Scripted（混合），偶尔回落 Groovy | YAML 纯声明 + JavaScript Actions              |
| 触发集成   | 需配 Webhook + Branch Source 插件               | 与 GitHub 仓库原生集成，PR/Tag 直接拿到事件   |
| 节点管理   | Master-Agent 显式配置                           | Runner 隐式（SaaS）或自部署                   |
| 复用       | Shared Library（Groovy）                        | Composite Actions / Reusable Workflows（YAML）|
| 插件 / 生态 | **1800+ 插件**，覆盖深                          | Marketplace 1.5w+ Actions，组合够用           |
| 凭据       | Credentials Store（6 类）                       | Repo/Org/Env Secrets                          |
| 学习曲线   | 高（Groovy + 运维）                             | 低（YAML 即可上手）                           |
| 何时选     | 私有部署 / 复杂插件 / 老项目                    | 开源仓 / GitHub-only / 中小项目               |

**简单原则**：

- 你的代码在 GitHub 且不要求私网 → 直接 GitHub Actions
- 你要把构建跑在内网 / 上 K8s / 链接老旧系统 → Jenkins 还是首选
- 你已有 Jenkins 集群 → 别动它，新项目沿用比迁移划算

## 常见陷阱

- **`agent any` 把任务跑在 master**：默认配置下 built-in node 也匹配 `any`，导致构建脚本看到 controller 数据。生产环境把 built-in 的 executor 设为 0
- **凭据 `echo $TOKEN`**：自动屏蔽只覆盖完整变量，base64/拼接后会暴露；用 `set +x` 或永远不 echo 敏感字段
- **pollSCM 高频拖垮**：默认每分钟跑一次的 cron 表达式 `* * * * *` 会让所有 Job 同时打 SCM，用 `H` 让 Jenkins 自动 hash 时间到分散点
- **共享库改 vars/ 后立刻生效**：默认是动态加载，可能正在跑的构建拿到新代码出错；生产请固定 `@Library('lib@v1.0')` 用 tag
- **声明式里偷偷写 Groovy 语句**：声明式块内只允许声明 + step，命令式逻辑必须包 `script { }` 块；写错语法 Jenkins 报错信息很难解读
- **`when { branch 'main' }` 在 Multibranch 才有意义**：单分支 Pipeline 里没有 BRANCH_NAME，`branch` 条件永远不匹配

## 何时跳过 Jenkins

- 项目托管在 GitHub / GitLab，没有强自托管需求 → 直接用 Actions / GitLab CI
- 团队 < 10 人，无运维资源维持插件升级
- 构建场景标准化（Node / Python / Java），不需要奇特的私有协议接入
- 想要 ChatOps / PR 状态深度集成 → SaaS CI 体验明显更好

Jenkins 的价值在"对内可控 + 插件深 + 私网友好"，没有这些诉求时其它工具更省心。

## 完整 Pipeline 语法参考

### Declarative Pipeline 顶层结构

```groovy
pipeline {
  agent any                                      // 1. 必填
  options { /* ... */ }                          // 2. pipeline 级行为
  triggers { /* ... */ }                         // 3. 自动触发器
  parameters { /* ... */ }                       // 4. 构建参数
  environment { /* ... */ }                      // 5. 环境变量
  tools { /* ... */ }                            // 6. 工具版本
  stages {                                       // 7. 必填，主流程
    stage('Build') { /* ... */ }
  }
  post { /* ... */ }                             // 8. 收尾
}
```

执行顺序：parameters / triggers / options → agent 分配 → environment / tools 注入 → stages → post。

### `agent` 完整选项

```groovy
agent any                                        // 任意可用 agent
agent none                                       // 不分配（每个 stage 自己声明）
agent { label 'linux && docker' }                // 标签表达式（支持 &&、|| 等）
agent { node { label 'build'; customWorkspace '/var/build' } }

agent {                                          // Docker 容器
  docker {
    image 'maven:3.9-eclipse-temurin-21'
    args '-v $HOME/.m2:/root/.m2'                // 额外 docker 参数
    registryUrl 'https://my-registry.com'
    registryCredentialsId 'docker-cred'
    label 'docker'                                // 哪些节点能拉这个镜像
    alwaysPull true                               // 总是 pull latest
    reuseNode true                                // 复用外层 agent 的 workspace
  }
}

agent {                                          // 从 Dockerfile 构建
  dockerfile {
    filename 'ci/Dockerfile'
    dir 'subdir'
    label 'docker'
    additionalBuildArgs '--build-arg version=1.0'
  }
}

agent {                                          // Kubernetes Pod
  kubernetes {
    cloud 'k8s-cluster'
    namespace 'jenkins'
    yaml '''
      apiVersion: v1
      kind: Pod
      spec:
        containers:
          - name: maven
            image: maven:3.9
            command: ['cat']
            tty: true
          - name: docker
            image: docker:24-cli
    '''
    defaultContainer 'maven'
  }
}
```

### `options` 详细

```groovy
options {
  // 构建保留
  buildDiscarder(logRotator(
    numToKeepStr: '50',                          // 保留最近 50 次
    daysToKeepStr: '30',                          // 30 天后清理
    artifactNumToKeepStr: '10',                   // artifacts 留 10 次
  ))

  // 超时
  timeout(time: 1, unit: 'HOURS')                 // pipeline 级超时
  timeout(time: 30, unit: 'MINUTES', activity: true) // 30min 无活动则超时

  // 并发控制
  disableConcurrentBuilds()                       // 同 job 串行
  disableConcurrentBuilds(abortPrevious: true)    // 新触发取消旧的

  // 重试
  retry(3)                                        // pipeline 失败重试 3 次

  // 输出
  timestamps()                                    // console 加时间戳
  ansiColor('xterm')                              // ANSI 颜色支持（需 plugin）

  // 跳过 / 复用
  skipDefaultCheckout()                           // 跳过自动 git checkout
  skipStagesAfterUnstable()                       // unstable 后停止
  preserveStashes(buildCount: 5)                  // 保留 stash 供 stage 重跑

  // 并行行为
  parallelsAlwaysFailFast()                       // 所有 parallel 块默认 failFast

  // 限制操作
  disableRestartFromStage()                       // UI 上不能从中间 stage 重启

  // 检出选项
  checkoutToSubdirectory('repo')                  // checkout 到 subdir
  newContainerPerStage()                          // docker agent 时每 stage 新容器
}
```

### `triggers` 完整

```groovy
triggers {
  cron('H 4 * * 1-5')                            // 定时（H 是 hash 分散）
  cron('@daily')                                  // 别名：@hourly / @daily / @weekly / @monthly
  cron('TZ=Asia/Shanghai\nH 4 * * *')             // 显式时区

  pollSCM('H/15 * * * *')                         // 每 15min 查 SCM（不推荐，用 webhook）

  upstream(
    upstreamProjects: 'lib/main, infra/k8s',     // 上游成功后触发
    threshold: hudson.model.Result.SUCCESS,
  )

  // GitHub webhook trigger（带 plugin）
  githubPush()
  pullRequestReview(commentTrigger: 'lgtm')

  // Generic webhook（需 plugin）
  GenericTrigger(
    genericVariables: [[key: 'ref', value: '$.ref']],
    token: 'my-token',
    causeString: 'Triggered on $ref',
  )
}
```

### `parameters` 完整类型

```groovy
parameters {
  string(name: 'TARGET', defaultValue: 'staging', description: '部署目标')
  text(name: 'NOTES', defaultValue: '', description: '发布说明（多行）')

  booleanParam(name: 'SKIP_TESTS', defaultValue: false, description: '跳过测试')

  choice(
    name: 'ENV',
    choices: ['dev', 'staging', 'production'],
    description: '环境',
  )

  password(name: 'SECRET', defaultValue: '', description: '一次性密码')

  // 来自 plugin（Active Choices）
  // 动态生成的选项 / 反应式参数

  // 文件参数（plugin）
  file(name: 'CONFIG_FILE', description: '上传配置')

  // 凭据参数（让用户选用哪条凭据）
  credentials(name: 'DEPLOY_CRED', defaultValue: 'aws-prod',
              description: '部署凭据', credentialType: 'aws',
              required: true)
}
```

读取：`params.TARGET` / `${params.TARGET}`。

### `environment` 详细

```groovy
environment {
  // 字面量
  CI = 'true'
  NODE_VERSION = '22'

  // 引用其它变量
  BUILD_TAG = "${env.JOB_NAME}-${env.BUILD_NUMBER}"
  GIT_URL = "https://github.com/${env.GH_OWNER}/${env.GH_REPO}"

  // 凭据注入
  NPM_TOKEN = credentials('npm-publish-token')     // Secret Text
  AWS = credentials('aws-prod')                    // Username+Password → AWS_USR / AWS_PSW
  KUBECONFIG = credentials('kube-config-file')     // Secret File → 文件路径

  // 调用工具拿值
  GIT_COMMIT_MSG = sh(returnStdout: true, script: 'git log -1 --pretty=%B').trim()
  // 注意：sh() 调用需 agent 已分配；不能在 pipeline 顶层 environment 用，要在 stage environment 里
}
```

### `tools` 自动安装

```groovy
tools {
  jdk 'jdk-21'                                    // 在 Manage Jenkins → Tools 配过的
  maven 'maven-3.9'
  nodejs 'node-22'                                 // 需要 NodeJS plugin
}
```

会自动把工具加到 PATH，`mvn` / `node` / `java` 等可直接用。

## stages / stage 高级用法

### `parallel` 完整

```groovy
stage('Quality Gates') {
  failFast true                                    // 任一失败立即终止其它
  parallel {
    stage('Lint') {
      agent { label 'linux-build' }                // 子 stage 可单独声明 agent
      steps { sh 'pnpm lint' }
    }
    stage('Type Check') {
      steps { sh 'pnpm type-check' }
    }
    stage('E2E') {
      agent { label 'linux-gui' }
      steps { sh 'pnpm test:e2e' }
      post {
        always { junit 'reports/e2e/*.xml' }
      }
    }
  }
}
```

### `matrix`

```groovy
stage('Cross-Build') {
  matrix {
    axes {
      axis {
        name 'PLATFORM'
        values 'linux', 'darwin', 'windows'
      }
      axis {
        name 'NODE_VERSION'
        values '20', '22'
      }
    }
    excludes {
      exclude {
        axis { name 'PLATFORM'; values 'windows' }
        axis { name 'NODE_VERSION'; values '20' }
      }
    }
    stages {
      stage('Build') {
        agent { label "${PLATFORM}" }
        steps { sh "nvm use ${NODE_VERSION} && pnpm build" }
      }
      stage('Test') {
        steps { sh 'pnpm test' }
      }
    }
  }
}
```

笛卡尔积 = 3 × 2 - 1 = 5 个并发 stage 组。

### `when` 完整条件

```groovy
stage('Deploy') {
  when {
    // 单一条件
    branch 'main'                                   // 分支
    branch comparator: 'REGEXP', pattern: '^release/.*'  // 正则
    branch comparator: 'GLOB', pattern: 'release/*'      // glob（默认）

    buildingTag()                                    // 当前是 tag
    tag 'v*'                                         // tag 匹配
    tag comparator: 'REGEXP', pattern: '^v\\d+\\.\\d+\\.\\d+$'

    changeset 'src/**'                               // 文件改动
    changeset comparator: 'REGEXP', pattern: '.*\\.ts$'

    changelog '.*\\[deploy\\].*'                     // commit message 匹配

    changeRequest()                                  // 是 PR
    changeRequest target: 'main'                     // PR 目标分支
    changeRequest authorEmail: '.*@example\\.com'    // PR 作者邮箱

    environment name: 'DEPLOY_ENV', value: 'prod'    // env 值
    equals expected: 'true', actual: env.SHIP_FLAG

    expression { params.FORCE_DEPLOY == true }       // Groovy 表达式

    triggeredBy 'TimerTrigger'                       // 触发方
    triggeredBy 'UserIdCause'
  }
  steps { /* ... */ }
}
```

### `when` 组合 + 排序优化

```groovy
when {
  allOf {
    branch 'main'
    not { changeRequest() }
  }
  anyOf {
    environment name: 'DEPLOY_LOCK', value: 'open'
    triggeredBy 'UserIdCause'
  }

  // 优化：在分配 agent 前判断
  beforeAgent true

  // 优化：在 input 前判断
  beforeInput true

  // 优化：在 options 前判断（最早）
  beforeOptions true
}
```

`beforeAgent true` 对**昂贵的云 agent**节省很大——条件不满足直接跳过，不分配 agent。

### `input` 人工卡点

```groovy
stage('Approve Deploy') {
  input {
    message '部署到生产环境？'
    ok 'Yes, deploy'
    submitter 'admin,release-manager,leadership'    // 限制提交者（用户名 / 组）
    submitterParameter 'APPROVED_BY'                 // 把提交者写到这个变量
    parameters {
      string(name: 'TAG', defaultValue: 'v1.0.0', description: '部署版本')
      booleanParam(name: 'SKIP_SMOKE', defaultValue: false, description: '跳过 smoke test')
    }
  }
  steps {
    sh "echo Approved by ${APPROVED_BY}"
    sh "./deploy.sh ${TAG}"
  }
}
```

input 期间占用 executor，**云 agent 慎用**——可以配合 `agent none` + 外层 input + stage 内分配。

## `post` 所有条件

```groovy
post {
  always {                          // 不论结果
    junit 'reports/*.xml'
    cleanWs()                       // 清理 workspace
  }
  success { /* 当前 build 成功 */ }
  unstable { /* 测试有失败但非崩 */ }
  failure { /* 失败 */ }
  aborted { /* 用户手动取消 */ }
  unsuccessful { /* 非 success */ }
  changed { /* 状态与上次不同 */ }
  fixed { /* 上次失败 / unstable，本次成功 */ }
  regression { /* 上次 success，本次失败 / unstable / aborted */ }
  cleanup { /* 最后执行（所有其它 post 后） */ }
}
```

常见组合：

```groovy
post {
  success {
    slackSend(channel: '#deploys', message: "✅ ${env.JOB_NAME} #${env.BUILD_NUMBER}")
  }
  failure {
    mail to: 'team@example.com', subject: "FAIL: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
         body: "${env.BUILD_URL}"
  }
  regression {
    // 关注从 success 退化的情况
    slackSend(channel: '#alerts', color: 'danger',
              message: "🔥 Regression in ${env.JOB_NAME}")
  }
  cleanup {
    cleanWs(deleteDirs: true)
  }
}
```

## Pipeline Script (Scripted 范式)

虽然官方推荐 Declarative，但 Scripted 在动态生成 stage 时仍有用：

```groovy
node('linux-build') {
  stage('Checkout') {
    checkout scm
  }

  // 动态决定 stage
  def services = ['web', 'api', 'worker']
  for (service in services) {
    stage("Build ${service}") {
      sh "docker build -t ${service}:latest ./services/${service}"
    }
  }

  stage('Test') {
    try {
      sh 'pnpm test'
    } catch (err) {
      currentBuild.result = 'UNSTABLE'
      throw err
    } finally {
      junit 'reports/*.xml'
    }
  }
}
```

### Declarative 内嵌 Scripted

Declarative 块里写命令式逻辑必须包 `script { }`：

```groovy
pipeline {
  agent any
  stages {
    stage('Process') {
      steps {
        script {
          def items = sh(returnStdout: true, script: 'ls config/*.json').split('\n')
          for (item in items) {
            echo "Processing ${item}"
            // ...
          }
        }
      }
    }
  }
}
```

## Multibranch Pipeline 完整

### 创建方式

UI：Jenkins → New Item → Multibranch Pipeline

配置：
1. **Branch Sources**：选择 SCM（GitHub / Bitbucket / GitLab / Git plain）+ 凭据
2. **Behaviors**：发现哪些分支 / Tag / PR
3. **Property Strategies**：分支级权限
4. **Build Configuration**：默认从 `Jenkinsfile` 读
5. **Scan Triggers**：定时扫描间隔（默认 1d）+ webhook

### 自动发现的分支变量

| 变量 | 例子 |
|---|---|
| `BRANCH_NAME` | `main` / `feature/x` / `PR-42` |
| `BRANCH_IS_PRIMARY` | true（如果是默认分支） |
| `CHANGE_ID` | PR 号（PR 构建时） |
| `CHANGE_URL` | PR URL |
| `CHANGE_TITLE` | PR 标题 |
| `CHANGE_AUTHOR` | PR 作者 |
| `CHANGE_AUTHOR_DISPLAY_NAME` | 作者显示名 |
| `CHANGE_AUTHOR_EMAIL` | 作者邮箱 |
| `CHANGE_TARGET` | PR 目标分支 |
| `CHANGE_BRANCH` | PR 源分支 |
| `CHANGE_FORK` | fork 仓库（如果是） |

### Organization Folder

发现整个 GitHub Org / Bitbucket Team / GitLab Group 下所有仓库——每个仓库自动成为一个 Multibranch Pipeline。适合企业级。

```
GitHub Organization
└── repo-a (Multibranch)
    ├── main (Job)
    ├── develop (Job)
    └── PR-12 (Job)
└── repo-b (Multibranch)
    └── ...
```

## 共享库（Shared Library）深入

### 完整目录

```
my-shared-library/
├── vars/                            # 全局函数（文件名 = 变量名）
│   ├── deploy.groovy                # call() 让 `deploy()` 可调
│   ├── notifySlack.groovy
│   └── waitForApproval.groovy
├── src/                             # Groovy 类（需 package）
│   ├── org/company/
│   │   ├── Build.groovy
│   │   ├── Deploy.groovy
│   │   └── utils/
│   │       └── Helper.groovy
├── resources/                       # 文本 / 模板
│   ├── k8s.yaml.tpl
│   └── slack.json.tpl
└── test/                            # 单元测试
    └── org/company/BuildTest.groovy
```

### `vars/deploy.groovy` 完整

```groovy
// 类型注解
def call(Map config) {
  def env = config.env ?: 'staging'
  def version = config.version ?: 'latest'

  echo "Deploying ${version} to ${env}"

  // 多种命名调用方式
  // deploy([env: 'prod', version: 'v1.0'])
  // deploy env: 'prod', version: 'v1.0'

  withCredentials([
    file(credentialsId: "kube-${env}", variable: 'KUBECONFIG'),
  ]) {
    sh "kubectl set image deployment/my-app my-app=registry/my-app:${version} -n ${env}"
    sh "kubectl rollout status deployment/my-app -n ${env} --timeout=5m"
  }
}

// 多个方法
def rollback(String env, String revision) {
  sh "kubectl rollout undo deployment/my-app --to-revision=${revision} -n ${env}"
}
```

调用方：

```groovy
@Library('my-shared-lib@v1.0') _

pipeline {
  agent any
  stages {
    stage('Deploy') {
      steps {
        deploy(env: 'prod', version: env.GIT_COMMIT_SHORT)
      }
    }
  }
  post {
    failure {
      script { deploy.rollback('prod', '12') }
    }
  }
}
```

### `src/` Groovy 类

```groovy
// src/org/company/Deploy.groovy
package org.company

class Deploy implements Serializable {
  def script

  Deploy(script) {
    this.script = script
  }

  void to(String env, String version) {
    script.echo "Deploying ${version} to ${env}"
    script.sh "./deploy.sh ${env} ${version}"
  }
}
```

```groovy
@Library('my-shared-lib') _
import org.company.Deploy

pipeline {
  agent any
  stages {
    stage('Deploy') {
      steps {
        script {
          def d = new Deploy(this)
          d.to('prod', env.GIT_TAG)
        }
      }
    }
  }
}
```

### `resources/` 模板

```groovy
// vars/k8sApply.groovy
def call(Map config) {
  def template = libraryResource('k8s.yaml.tpl')
  def yaml = template
    .replace('{{IMAGE}}', config.image)
    .replace('{{NAMESPACE}}', config.namespace)

  writeFile file: 'k8s-rendered.yaml', text: yaml
  sh "kubectl apply -f k8s-rendered.yaml"
}
```

### Library 版本控制

```groovy
@Library('my-shared-lib@v1.2.3') _    // tag（推荐生产）
@Library('my-shared-lib@main') _       // 分支
@Library('my-shared-lib@abc1234') _    // commit SHA
@Library(['lib-a', 'lib-b@v1.0']) _   // 多个 + 各自版本

// 动态加载
library 'my-shared-lib'
library "my-shared-lib@${env.BRANCH_NAME}"
```

### 全局自动加载

Manage Jenkins → System → Global Pipeline Libraries 配置后，可勾选「Load implicitly」让所有 pipeline 自动加载——`@Library` 都不用写。

### Trusted vs Untrusted

- **Trusted**（Global Trusted）：可调 Jenkins 内部 API、第三方 Java 代码；需 `Overall/RunScripts` 权限注册
- **Untrusted**（Folder libraries / Project libraries）：跑在 Groovy sandbox 里，受 Script Security 限制；普通项目代码默认是这个

写 shared library 时要注意：库代码自己跑在 trusted 域（开发者可信），但被调用时还要看调用方权限。

## Master-Agent 架构深入

### Controller 应该做什么

✅ 做：
- 服务 UI / API 请求
- 调度构建
- 管理凭据 / 配置 / 用户
- 接收 webhook

❌ 不做（必须在 agent 上）：
- 跑构建 / 测试
- 拉代码（除非是 git plugin 的元数据扫描）
- 执行 shell 命令

**built-in node executor 必须设为 0**（Manage Jenkins → Nodes → Built-In Node → Number of executors: 0）。

### Static Agent 配置（SSH）

1. **新 Linux 机器**：装 Java 21+、创建 `jenkins` 用户、给 jenkins 用户 SSH key
2. Jenkins UI → Manage Jenkins → Nodes → New Node
   - Name：`linux-build-01`
   - Type：Permanent Agent
   - Remote root：`/var/jenkins`
   - Labels：`linux build docker x64`
   - Launch method：Launch agents via SSH
   - Host：IP / hostname
   - Credentials：选 SSH Username with private key
   - Host Key Verification Strategy：Manually trusted（生产用 known_hosts file）
3. Save → 自动建立 SSH 连接

### Static Agent 配置（JNLP / Inbound）

适合**agent 不能被 controller 主动连**（防火墙后）：

1. Agent → Launch method → Launch agent by connecting it to the controller
2. 生成 JNLP secret
3. Agent 机器：`java -jar agent.jar -url http://jenkins.example.com -secret xxx -name agent-01 -workDir /var/jenkins`

### Kubernetes 动态 Agent

```bash
helm repo add jenkins https://charts.jenkins.io
helm install jenkins jenkins/jenkins \
  --namespace jenkins --create-namespace \
  --set controller.adminUser=admin \
  --set controller.adminPassword=changeme
```

配 K8s cloud：

```groovy
pipeline {
  agent {
    kubernetes {
      yaml '''
        apiVersion: v1
        kind: Pod
        metadata:
          labels:
            jenkins-agent: 'true'
        spec:
          containers:
            - name: maven
              image: maven:3.9-eclipse-temurin-21
              command: ['cat']
              tty: true
            - name: docker
              image: docker:24-cli
              command: ['cat']
              tty: true
              volumeMounts:
                - name: docker-sock
                  mountPath: /var/run/docker.sock
          volumes:
            - name: docker-sock
              hostPath:
                path: /var/run/docker.sock
      '''
    }
  }
  stages {
    stage('Build') {
      steps {
        container('maven') {
          sh 'mvn clean package'
        }
      }
    }
    stage('Image') {
      steps {
        container('docker') {
          sh 'docker build -t my-app .'
        }
      }
    }
  }
}
```

Pod 跑完即销毁。

### EC2 / Cloud Agent

`ec2-fleet` / `Amazon EC2` plugin 动态启 EC2 spot fleet——闲时关、忙时开，节省成本。需要 AWS Role 给 Jenkins controller。

## 凭据管理深入

### 凭据类型 vs 注入方式

| 凭据类型 | environment 注入字段 | withCredentials step |
|---|---|---|
| Secret Text | `X = credentials('id')` | `string(credentialsId, variable)` |
| Username + Password | `X = credentials('id')` → `X` 拼接 + `X_USR` / `X_PSW` | `usernamePassword(credentialsId, usernameVariable, passwordVariable)` |
| Secret File | `X = credentials('id')` → 文件路径 | `file(credentialsId, variable)` |
| SSH Username + Private Key | 文件路径 + `_USR` + `_PSW`（passphrase） | `sshUserPrivateKey(credentialsId, keyFileVariable, usernameVariable, passphraseVariable)` |
| Certificate | - | `certificate(credentialsId, keystoreVariable, passwordVariable, aliasVariable)` |
| Docker Host | 自动注入 docker auth | - |

### `withCredentials` 完整

```groovy
stage('Deploy') {
  steps {
    withCredentials([
      // 多种凭据组合使用
      string(credentialsId: 'github-token', variable: 'GH_TOKEN'),
      usernamePassword(
        credentialsId: 'docker-registry',
        usernameVariable: 'DOCKER_USER',
        passwordVariable: 'DOCKER_PASS',
      ),
      file(credentialsId: 'kubeconfig-prod', variable: 'KUBECONFIG'),
      sshUserPrivateKey(
        credentialsId: 'deploy-ssh',
        keyFileVariable: 'SSH_KEY',
        usernameVariable: 'SSH_USER',
        passphraseVariable: 'SSH_PASS',
      ),
      certificate(
        credentialsId: 'code-signing',
        keystoreVariable: 'CERT_KEYSTORE',
        passwordVariable: 'CERT_PASS',
        aliasVariable: 'CERT_ALIAS',
      ),
    ]) {
      sh '''
        echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin
        kubectl --kubeconfig=$KUBECONFIG apply -f k8s/
        ssh -i $SSH_KEY -o StrictHostKeyChecking=no $SSH_USER@host './reload.sh'
      '''
    }
  }
}
```

退出 `withCredentials` 块后变量销毁、文件删除。

### 凭据 scope

- **Global**：所有 Jenkins 项目可用
- **System**：仅 Jenkins controller 系统使用（如 plugin 用）
- **Folder**：仅该 folder 下的 job 可用

按权限粒度分层 —— 生产部署密钥放 Folder 级，仅给生产 folder 用，避免误用。

## 安全实践

### 1. 关闭 built-in node executor

Manage Jenkins → Nodes → Built-In Node → 配 0 个 executor。理由：构建脚本能读 `JENKINS_HOME` 下所有凭据。

### 2. Script Security 严格模式

Manage Jenkins → In-process Script Approval → 关「Auto-approve」。所有 Groovy 脚本必须管理员审核。代价是 dev 慢，但安全可控。

### 3. CSRF 必须开启

Manage Jenkins → Security → CSRF Protection ON。禁止跨站请求触发构建。

### 4. 升级 Java + Jenkins + plugins

Jenkins LTS 每 12 周一发，plugins 各自演进。配 Update Center cron 检查 + 测试环境先验证。

### 5. Credentials Binding plugin 替代 environment

不要给整个 pipeline 注 environment 凭据——只在需要的 step 用 `withCredentials`，缩小爆炸半径。

### 6. 不要 echo 凭据

```bash
echo $TOKEN                  # ❌ Jenkins 自动屏蔽，但拼接 / base64 仍泄漏
echo ${TOKEN:0:5}            # ❌ 取前缀绕过屏蔽
echo $TOKEN | base64         # ❌ 编码绕过
curl -H "Auth: $TOKEN" ...   # ✅ 用了不打印
```

### 7. Pipeline 配 timeout

防止恶意死循环吃光 agent：

```groovy
options { timeout(time: 1, unit: 'HOURS') }
```

### 8. 限制 plugin 安装

只装来自官方 Update Center 的、活跃维护的 plugin。第三方 plugin 检查最近 release、issues、commits。

### 9. Fork PR 隔离

Multibranch 配 Behaviors → Discover pull requests from forks → 「Trust」选 「Members of organization」或「Nobody」。否则任意 fork PR 都能读 Jenkins 凭据。

## 性能调优

### Pipeline 速度优化

| 问题 | 方案 |
|---|---|
| 串行 stage 太慢 | `parallel { }` 块拆分 |
| 同 stage 同 agent 重新拉代码 | `options { skipDefaultCheckout() }` + 手动 checkout |
| docker pull 慢 | `reuseNode true` 在外层 agent / 提前 pre-pull |
| 重复 `mvn install` | `agent { docker { args '-v $HOME/.m2:/root/.m2' } }` 挂载缓存 |
| Multibranch 扫描慢 | webhook 替代 pollSCM |
| 工具下载慢 | 在 agent 镜像里 pre-install / 用 mirror |

### Controller 性能

- JVM heap 至少 4 GB（大集群 8-16 GB）
- 监控 GC（开 GC log）
- 用 SSD 存 `$JENKINS_HOME`
- builds 数量过多 → `buildDiscarder` 控制 + Folder 分层

### Agent 数量规划

每 5-10 个开发者大约配 1 个常驻 agent；高峰期 burst 用 K8s / EC2 fleet。监控指标：

- 等待时间（Queue → Build executor status）
- agent CPU / Memory（Prometheus exporter）

## CI/CD 模式集成

### 部署到 Kubernetes

```groovy
pipeline {
  agent { label 'linux' }
  environment {
    K8S_NAMESPACE = 'production'
  }
  stages {
    stage('Build & Push Image') {
      steps {
        withCredentials([
          usernamePassword(credentialsId: 'docker-hub',
                           usernameVariable: 'DOCKER_USER',
                           passwordVariable: 'DOCKER_PASS'),
        ]) {
          sh '''
            echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin
            docker build -t my-org/my-app:${GIT_COMMIT::8} .
            docker push my-org/my-app:${GIT_COMMIT::8}
          '''
        }
      }
    }
    stage('Deploy K8s') {
      when { branch 'main' }
      steps {
        withCredentials([file(credentialsId: 'kubeconfig-prod', variable: 'KUBECONFIG')]) {
          sh '''
            kubectl set image deployment/my-app my-app=my-org/my-app:${GIT_COMMIT::8} \
              -n ${K8S_NAMESPACE}
            kubectl rollout status deployment/my-app -n ${K8S_NAMESPACE} --timeout=5m
          '''
        }
      }
    }
  }
}
```

### Helm Chart 部署

```groovy
stage('Helm Deploy') {
  steps {
    withCredentials([file(credentialsId: 'kubeconfig-prod', variable: 'KUBECONFIG')]) {
      sh '''
        helm upgrade --install my-app ./charts/my-app \
          --namespace production \
          --set image.tag=${GIT_COMMIT::8} \
          --atomic \
          --timeout 10m \
          --wait
      '''
    }
  }
}
```

### Blue/Green / Canary

通过 `parallel` + `input` 实现：

```groovy
stage('Blue/Green') {
  parallel {
    stage('Deploy Green') {
      steps {
        sh './deploy.sh green'
        sh './smoke-test.sh green'
      }
    }
  }
}

stage('Promote Green to Live') {
  input { message 'Switch traffic to Green?'; ok '是的，切换' }
  steps {
    sh './switch-traffic.sh green'
    sh './deactivate-blue.sh'
  }
}
```

### Slack / Teams 通知

```groovy
post {
  success {
    slackSend(
      channel: '#deploys',
      color: 'good',
      message: "✅ Deploy success: ${env.JOB_NAME} #${env.BUILD_NUMBER}\n${env.BUILD_URL}",
    )
  }
  failure {
    slackSend(
      channel: '#alerts',
      color: 'danger',
      message: "❌ Deploy FAILED: ${env.JOB_NAME} #${env.BUILD_NUMBER}\n${env.BUILD_URL}\n@oncall",
    )
  }
}
```

### Test Reports 集成

```groovy
post {
  always {
    junit 'reports/junit/*.xml'                    // JUnit 解析
    archiveArtifacts artifacts: 'reports/**/*', allowEmptyArchive: true
    cobertura coberturaReportFile: 'reports/coverage/cobertura.xml'

    // Code Coverage（Jenkins Coverage plugin）
    recordCoverage(tools: [[parser: 'COBERTURA', pattern: 'reports/coverage.xml']])

    // 静态分析（warnings-ng plugin）
    recordIssues(
      enabledForFailure: true,
      tools: [esLint(pattern: 'reports/eslint.xml')],
    )
  }
}
```

## Job DSL / Configuration as Code

Jenkins 自身的配置也可以代码化：

### Job DSL plugin

```groovy
// seed.groovy（一个 freestyle 跑这个，自动生成其它 jobs）
job('my-org/my-app-build') {
  description 'Build my-app'
  triggers {
    cron('H 4 * * *')
  }
  steps {
    shell('./build.sh')
  }
}

multibranchPipelineJob('my-org/my-app') {
  branchSources {
    github {
      id 'my-org-my-app'
      repository 'my-app'
      repoOwner 'my-org'
      credentialsId 'github-token'
    }
  }
}
```

### Configuration as Code (JCasC)

```yaml
# jenkins.yaml
jenkins:
  systemMessage: "Jenkins managed by JCasC"
  numExecutors: 0
  securityRealm:
    local:
      allowsSignup: false
      users:
        - id: admin
          password: ${ADMIN_PASSWORD}

  clouds:
    - kubernetes:
        name: "k8s"
        namespace: "jenkins"
        jenkinsUrl: "http://jenkins:8080"

unclassified:
  location:
    url: "https://jenkins.example.com/"
  globalLibraries:
    libraries:
      - name: "my-shared-lib"
        defaultVersion: "main"
        retriever:
          modernSCM:
            scm:
              git:
                remote: "https://github.com/my-org/jenkins-shared-lib.git"
```

启动时 `CASC_JENKINS_CONFIG=/var/jenkins/jenkins.yaml` 自动加载。

## 监控与可观测

### Prometheus exporter

```bash
# Plugin: Prometheus metrics
# Endpoint: /prometheus
```

抓 metrics：build duration / queue length / executor utilization / disk usage / heap memory。

### 健康端点

`/manage/about` / `/login` 用作 K8s liveness probe；`/whoAmI/api/json` 验证认证。

### 日志聚合

- `JENKINS_HOME/logs/` 下系统日志
- 各 build 的 console 输出在 `JENKINS_HOME/jobs/<name>/builds/<n>/log`
- 用 Filebeat / Fluent Bit 推到 ELK / Loki

## 备份与灾难恢复

### 必备备份

1. `JENKINS_HOME` 全部（含 plugins / config / job history）
2. Pipeline 库（git 本来就在仓库）
3. 凭据（加密的，单独备份 master.key）

### 恢复 drill

季度跑一次：在备机上 restore JENKINS_HOME → 验证能登录、跑一个 sample job。**没演练过的备份等于没备份**。

### 蓝绿升级

Jenkins LTS 升级：

1. snapshot 当前 JENKINS_HOME
2. 新机器装新版 Jenkins
3. restore JENKINS_HOME
4. 启动验证 → 切流量
5. 旧机器保留 1 周再回收

## 与其它 CI 对比再深入

| 维度 | Jenkins | GitHub Actions | GitLab CI |
|---|---|---|---|
| 安装 | 自托管必装 + JDK + plugins | SaaS 或 Runner | SaaS 或 Runner |
| Pipeline 写法 | Groovy DSL（Declarative / Scripted） | YAML | YAML |
| 执行 | Master + Agent | Runner（hosted 或 self） | Runner（不同 executor） |
| 调度复杂度 | label 表达式（&&、\|\|）灵活 | label AND 关系 | tag 列表 |
| 扩展机制 | 1800+ plugin（深） | Marketplace 15000+（广） | Components（新） |
| 复用 | Shared Library（完整 Groovy） | Composite + Reusable Workflow | extends + include |
| 触发 | webhook + plugin 各种 | 原生事件丰富 | 原生事件丰富 |
| UI | 老旧但稳定（Blue Ocean 2026-07 弃用） | 现代 | 现代 |
| 凭据 | Credentials Plugin + 多类型 | Secrets | CI/CD Variables |
| 学习曲线 | 陡（Groovy + 运维） | 平（YAML） | 平（YAML） |
| 适合 | 私有部署 / 复杂插件 / 老项目 | GitHub 项目 / 中小团队 | GitLab 项目 / 自托管 |
