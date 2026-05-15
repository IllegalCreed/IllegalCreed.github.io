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
