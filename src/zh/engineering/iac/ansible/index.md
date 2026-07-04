---
layout: doc
---

# Ansible

Ansible 是 **Red Hat（红帽）出品、当今最主流的自动化工具之一**，主战场是**配置管理（configuration management）、应用部署与多机编排（orchestration）**。它最醒目的标签是 **agentless（无 agent）**——被管机器上**不装任何常驻进程或守护程序**，控制机直接借 **SSH（Linux）/ WinRM（Windows）** 用现有系统凭据把指令**推送（push）**过去，执行完即走。你用**人类可读的 YAML** 写 **playbook（剧本）**描述「机器应该长成什么样」，Ansible 逐条调用**模块（module）**去达成目标；模块的灵魂是**幂等（idempotent）**——当系统已处于描述的状态时，反复运行**什么都不改**。它**没有中心 state 文件**：每次运行都现场采集 facts、查真实状态再收敛，这与 Terraform 维护 state 的思路截然不同。组织粒度从 **ad-hoc 单条命令**，到 **playbook**，到可复用的 **role**，再到打包分发的 **collection**（Ansible 2.10 起把 `ansible-core` 引擎与海量内容集彻底拆开）；分发平台是 **Ansible Galaxy**。与 Terraform 的关系是**互补而非替代**——Terraform 声明式**供给（provisioning）**云资源，Ansible 负责资源建好之后的**装软件、改配置、发版本、编排**。企业级场景由 **AWX / Ansible Automation Platform（AAP）** 补上 Web UI、RBAC、调度与执行环境（EE）。2015 年 Red Hat 收购 Ansible，如今 `ansible-core` 每半年一个大版本（5 月 / 11 月），2026 年在维护的是 **2.21 / 2.20 / 2.19**，社区发行包（Ansible community package）为 **13.x**。

## 概述

- **定位**：**配置管理 + 部署 + 编排**的自动化引擎——用 YAML 描述期望状态，靠幂等模块把一批远程主机收敛过去；不是云资源供给工具（那是 Terraform 的活）。
- **agentless（无 agent）是最大差异化**：被管节点**零安装**（只需 SSH + Python，Windows 用 WinRM），相比 Puppet/Chef 的「装 agent、跑 master、节点定时 pull」模型，上手与运维成本都低得多。
- **push 模型**：控制机主动把任务推给节点执行（对比 Puppet/Chef 的 **pull**）；超大规模可用 `ansible-pull` 反转成节点自拉 git + 本地跑，近乎无限扩展。
- **幂等**：模块尽量做到「已达标就不动」——重复运行安全；但 `command`/`shell` 这类原生命令模块**默认不幂等**（每次都报 `changed`），要靠 `changed_when`/`creates` 收敛。
- **无中心 state**：Ansible 不存「配置 ↔ 真实对象」的映射文件，每次运行现采 facts、模块自己判断当前态——这既省心（无 state 漂移/锁）也意味着「删掉任务不会自动回收资源」。
- **复用与分发**：`role`（标准目录结构的可复用单元）→ `collection`（namespace.collection，2.10 起的分发格式，含 playbook/role/module/plugin）→ **Ansible Galaxy** 检索安装。
- **模板与数据**：**Jinja2** 提供 <code v-pre>{{ 变量 }}</code>、filter、条件循环；**facts** 是自动采集的主机信息；**Vault** 加密敏感数据。
- **横向选型**：与 **Terraform** 互补（供给 vs 配置）；相对 **Puppet/Chef** 胜在无 agent + YAML；企业化走 **AWX/AAP**。

## 本叶地图

- [入门](./getting-started) —— Ansible 定位与 agentless/SSH push 心智、control node vs managed node、playbook·play·task·module 四层、inventory（INI/YAML）、ad-hoc vs playbook、第一个 playbook 全流程
- [Playbook 与模块](./guide-line/playbooks-modules) —— 模块幂等与 `changed`/`ok`/`failed` 状态、`when` 条件、`loop` 循环、`register`、`handler` + `notify`、`block`/`tags`、`changed_when`/`failed_when`
- [变量与模板](./guide-line/variables-templating) —— 变量来源与 **22 级优先级**、`extra vars` 永远最高、facts 采集与 `ansible_facts`、自定义 local facts、Jinja2 模板与 `template` 模块、常用 filter、`set_fact`
- [Role 与 Collection](./guide-line/roles-collections) —— role 标准七目录与 `main.yml`、`roles:`/`import_role`/`include_role`、role 依赖、collection 与 **FQCN**、`ansible.builtin`、Galaxy 与 `requirements.yml`、`ansible-galaxy` CLI
- [工程实践与选型](./guide-line/practice-selection) —— **Vault** 加密、**check mode**（`--check`/`--diff`）、大规模并发（`forks`）与 `serial` 滚动更新、push vs pull（对比 Puppet/Chef）、与 Terraform 互补、无 state 的取舍、AWX/AAP/EE/ansible-navigator
- [参考](./reference) —— CLI 命令 + 常用模块 + inventory/变量/facts 速查 + 常见坑 + 版本与权威链接

## 文档地址

- [Ansible 官方文档总入口](https://docs.ansible.com/ansible/latest/) —— Getting Started / Using Ansible / Galaxy / Reference 全部一手来源
- [Getting Started](https://docs.ansible.com/ansible/latest/getting_started/index.html) · [核心概念](https://docs.ansible.com/ansible/latest/getting_started/basic_concepts.html) —— control/managed node、playbook/play/task/module 定义
- [Playbook 指南](https://docs.ansible.com/ansible/latest/playbook_guide/index.html) · [模块索引](https://docs.ansible.com/ansible/latest/collections/index_module.html) —— 关键字、条件循环、模块参数与返回值
- [Ansible Galaxy](https://galaxy.ansible.com/) —— role 与 collection 的社区分发与检索平台
- [版本与维护策略](https://docs.ansible.com/ansible/latest/reference_appendices/release_and_maintenance.html) —— ansible-core / community package 版本、支持矩阵、发布节奏
- [Red Hat Ansible Automation Platform](https://www.redhat.com/en/technologies/management/ansible) · [AWX（GitHub）](https://github.com/ansible/awx) —— 企业版与其上游开源项目

## 幻灯片地址

- <a href="/SlideStack/ansible-slide/" target="_blank">Ansible</a>
