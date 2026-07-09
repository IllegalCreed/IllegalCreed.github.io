---
layout: doc
---

# Jenkins

CI/CD 领域元老级开源服务器，Kohsuke Kawaguchi 在 Sun 时期开发，2011 年从 Hudson 分叉独立。核心是把"构建 / 测试 / 部署"流程写成可版本控制的 Pipeline，配合 1800+ 插件与 Master-Agent 架构，让任何能跑 Java 的机器都能成为构建节点。Jenkinsfile（Groovy DSL）放进仓库即随代码演进，与 GitHub Actions 的 YAML 不同的是它运行在你自己机器上。

## 评价

**优点**

- **生态最厚**：1800+ 插件覆盖几乎所有工具（K8s / Docker / Slack / SonarQube / Maven / Gradle / 任意私有协议），SaaS 形态的 GitHub Actions 也难以全部对齐
- **自托管彻底**：可以跑在内网完全离线的机器上，构建产物 / 凭据 / 日志全部由你掌控，适合金融、政府等合规场景
- **声明式 Pipeline 成熟**：`pipeline { agent / stages / steps }` 语法清晰，配合 `when / parallel / matrix / post` 已经覆盖大部分 CI 场景
- **Master-Agent 灵活**：构建节点可静态固定，也可以经 Kubernetes / EC2 / Docker 插件动态扩容；构建按 label 调度
- **Multibranch Pipeline 与 SCM 集成**：自动发现仓库各分支并跑各自的 Jenkinsfile，PR / Tag / 分支策略原生支持

**缺点**

- **UI / 体验老旧**：经典 UI 像 2010 年代产物，Blue Ocean 一度想换皮但官方宣布 2026-07 弃用；新人首次进入很容易被劝退
- **Groovy 学习成本**：Pipeline 语法在 Declarative 基础上仍偶尔回落到 Groovy，写共享库（Shared Library）需要正经 Groovy / Java 基础
- **运维负担明显**：自己升级 / 备份 / 容灾 / 插件冲突 / Java 版本，相比 GitHub Actions 这种"开箱即用 SaaS"工作量大很多
- **安全坑多**：插件良莠不齐，曾多次出现严重 CVE（Script Security / Credentials），需要专人盯升级
- **新项目越来越少用**：SaaS 化的 GitHub Actions / GitLab CI / CircleCI 在中小项目里普遍更省心；Jenkins 主要存活于大型企业 + 老项目 + 强合规场景

适合：大型企业 / 私有部署 / 复杂插件需求 / 老项目维护。新创业项目或开源仓库基本可以跳过它。

## 文档地址

[Jenkins User Documentation](https://www.jenkins.io/doc/)

## GitHub 地址

[jenkinsci/jenkins](https://github.com/jenkinsci/jenkins)

## 幻灯片地址

<a href="/SlideStack/jenkins-slide/" target="_blank">Jenkins</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=jenkins" target="_blank" rel="noopener noreferrer">Jenkins 测试题</a>
