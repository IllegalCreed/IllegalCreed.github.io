---
layout: doc
outline: [2, 3]
---

# 工程实践与选型：Vault、规模化、push/pull 与 AWX

> 基于 Ansible（ansible-core 2.21 · 社区包 13.x）· 核于 2026-07

## 速查

- **Ansible Vault**：加密敏感内容（密码、密钥），**只保护「静态数据」**；解密后的运行期泄露由 playbook 作者负责。
- **`ansible-vault` 命令**：`create` / `edit` / `view` / `encrypt` / `decrypt` / `rekey` / `encrypt_string`（加密单个变量值）。
- **Vault 运行期解密**：`--ask-vault-pass`（交互）、`--vault-password-file`（密码文件）、`--vault-id`（多密码源）。
- **check mode（演练）**：`--check` 只预测不改动；**模块须支持** check mode 才有意义；`--diff` 显示（将）变更内容；两者常合用。
- **`check_mode` 关键字**：task 级 `check_mode: true`（强制演练）/ `false`（强制真跑），覆盖 `--check`。
- **`forks`**：并发数，默认 **5**；`ansible.cfg` 里 `forks=30` 或命令行 `-f 30` 提升吞吐。
- **`serial`（滚动更新）**：分批发布，可给数字、百分比或递进列表（`[1, 5, "20%"]`）；配 `max_fail_percentage` 控制熔断。
- **strategy**：`linear`（默认，逐 task 齐步走）/ `free`（各主机自跑到底）/ `host_pinned`。
- **push vs pull**：Ansible 默认 **push（SSH 推）+ 无 agent**；Puppet/Chef 是 **pull（节点 agent 定时拉 master）**；超大规模用 `ansible-pull` 反转成节点自拉 git。
- **与 Terraform 互补**：Terraform 管**供给（provisioning）**云资源、维护 state；Ansible 管**配置/编排**、**无中心 state**。
- **无 state 的取舍**：Ansible 每次现采 facts、靠幂等收敛——省去 state 漂移/锁，但**删任务不自动回收资源**。
- **AWX / AAP**：企业化 Web UI + RBAC + 调度 + 日志；**AWX 是上游开源项目**，automation controller（原 Tower）是 AAP 中由 AWX 加固而来的组件。
- **EE / ansible-navigator**：Execution Environment 是打包好依赖的**容器镜像**；`ansible-navigator` 是在 EE 里跑 playbook 的 CLI/TUI。

## 一、Ansible Vault：加密敏感数据

密码、API key、证书私钥不能明文进 Git。**Ansible Vault** 就是解法——官方定义：它保护**「密码、密钥这类敏感内容，避免在 playbook 或 role 里明文可见」**。核心工具是 `ansible-vault`：

```bash
ansible-vault create secrets.yml      # 新建并加密
ansible-vault edit secrets.yml        # 解密进编辑器、存回时再加密
ansible-vault view secrets.yml        # 只读查看
ansible-vault encrypt vars.yml        # 加密已有明文文件
ansible-vault decrypt secrets.yml     # 永久解密回明文（慎用）
ansible-vault rekey secrets.yml       # 换密码
```

除了整文件加密，还能**只加密单个变量值**（`encrypt_string`），把密文直接嵌进普通 YAML：

```bash
ansible-vault encrypt_string 's3cr3t' --name 'db_password'
# 输出一段 !vault | 密文，粘进 group_vars 即可
```

运行带 Vault 内容的 playbook 时提供密码（三选一）：

```bash
ansible-playbook site.yml --ask-vault-pass          # 交互输入
ansible-playbook site.yml --vault-password-file ~/.vault_pass  # 密码文件
ansible-playbook site.yml --vault-id prod@prompt    # 多环境多密码
```

::: warning Vault 只保护「静态数据」
官方明确：**「Vault 加密只保护 data at rest（静态数据）。一旦内容被解密（data in use），避免泄密就是 play/plugin 作者的责任。」** 所以别在 `debug` 里打印解密后的密码、注意 `no_log: true` 屏蔽敏感 task 输出。
:::

## 二、check mode：先演练再动手

Ansible 的「dry run」是 **check mode**，官方描述：**「在 check mode 下，Ansible 运行但不对远程系统做任何改动。」**

```bash
ansible-playbook site.yml --check              # 只预测会改什么，不真改
ansible-playbook site.yml --check --diff       # 额外显示文件级的前后差异
ansible-playbook site.yml --check --diff --limit web01.example.com
```

要点：

- **模块须支持 check mode**：官方——「支持 check mode 的模块报告它们**会做**的改动；不支持的模块什么都不报也什么都不做」。
- **`--diff`** 可单用或配 `--check`：显示模块（将）做出的具体内容变更（尤其 `template`/`copy` 的文件 diff）。
- **task 级覆盖**：`check_mode: true` 让某 task **即使没加 `--check` 也只演练**；`check_mode: false` 让它**即使 `--check` 也真跑**（适合只读查询类 task）：

```yaml
- name: 这条查询即便演练也要真跑
  ansible.builtin.command: /usr/bin/get-status
  check_mode: false
  changed_when: false
```

- **`ansible_check_mode`** 是布尔魔术变量，可用它在 check 模式下跳过某些逻辑。
- **局限**：依赖「前一步注册变量」的条件 task，在 check 模式下可能无输出（因为前一步没真跑）。

## 三、规模化：forks、serial 与 strategy

**`forks`（并发）**：Ansible 默认**同时对 5 台主机**执行同一 task。大批量要调高：

```ini
# ansible.cfg
[defaults]
forks = 30
```

```bash
ansible-playbook site.yml -f 30
```

**`serial`（滚动更新）**：默认一个 task 会在**所有主机**上跑完才进下一个 task。发布服务时这很危险（同时重启全部 = 全站瞬断）。`serial` 把主机**分批**处理，实现**滚动发布**（官方示例）：

```yaml
- name: 滚动发布
  hosts: webservers
  serial: 3                 # 每批 3 台
```

```yaml
- name: 递进批次（金丝雀）
  hosts: webservers
  serial:
    - 1                     # 先 1 台试水
    - 5                     # 再 5 台
    - "20%"                 # 之后每批 20%
  max_fail_percentage: 20   # 单批失败超 20% 就整体中止
```

**strategy（执行策略）**：

- **`linear`（默认）**：所有主机**齐步走**——一个 task 在全批跑完，才一起进下一个 task。
- **`free`**：**「每台主机以自己最快的速度一路跑到 play 结束」**，不等别人，适合主机间无依赖、想尽快跑完。
- **`host_pinned`**：把一批 task 固定到一批主机上处理完再换。

配合 `throttle`（限制某 task 的并发，用于 CPU 密集操作）、`run_once`（只在一台跑，配 serial 则每批一次）、`order`（主机选取顺序）。

## 四、push vs pull：Ansible 与 Puppet/Chef 的架构分野

这是理解 Ansible 定位的关键对比：

| 维度 | Ansible | Puppet / Chef |
| --- | --- | --- |
| agent | **无**（agentless） | 每节点装 agent 常驻进程 |
| 中心服务 | 无需 master（控制机即可） | 通常有 master/server |
| 触发方向 | **push**：控制机主动推 | **pull**：节点 agent 定时拉 |
| 传输 | SSH / WinRM | 专有协议 + 证书 |
| 语言 | YAML（playbook） | Puppet DSL / Chef Ruby DSL |

Ansible 默认是 **push + agentless**：控制机用 SSH 把模块推到节点执行完即走。Puppet/Chef 走 **pull + agent**：每台节点装 agent，**定期去中心 master 拉取配置**并本地应用（Puppet 是声明式 agent-master，Chef 用 cookbook/recipe，节点从 Chef server 拉）。

Ansible 也能**反转成 pull**——`ansible-pull`：官方描述它**「从 VCS 仓库拉取 playbook 并在目标机上执行」**，典型是**每台节点用 cron 定时跑，自己拉 git、本地应用**，官方称其**「有近乎无限的扩展潜力」**，适合**超大规模**（push 模型下控制机对上万节点会成瓶颈）。

## 五、与 Terraform 互补：供给 vs 配置，state 的有无

Ansible 和 Terraform 常被拿来比，但它们**互补而非竞争**：

| 维度 | Terraform | Ansible |
| --- | --- | --- |
| 主职 | **供给（provisioning）**：建 VM、网络、DNS、托管服务 | **配置管理 + 部署 + 编排**：往机器里装软件、改配置、发版 |
| 范式 | 声明式，围绕**资源图** | 声明式模块 + 过程式流程（task 有序） |
| **state** | **维护 state 文件**（配置 ↔ 真实对象映射，真相之源） | **无中心 state**，每次现采 facts、靠幂等收敛 |
| 删除语义 | 从配置删资源 → `apply` **自动销毁** | 删 task **不会**自动回收已建的东西 |

典型组合：**Terraform 把 VM/网络/负载均衡建出来 → Ansible 进这些机器装软件、下发配置、编排发布**。

**「无中心 state」是 Ansible 的鲜明取舍**：

- **好处**：没有 state 文件要存/锁/防漂移，心智更轻；每次运行都直接问真实系统（facts + 幂等模块自查当前态）。
- **代价**：Ansible **不知道「上次它建过什么」**——你把一个「装 X」的 task 删掉，X **不会**被自动卸载（Terraform 删资源块会销毁资源）。要「移除」得显式写 `state: absent`。这决定了 Ansible 更适合「收敛到期望态」，而非「全生命周期资源账本」。

## 六、AWX 与 Ansible Automation Platform（AAP）

命令行的 Ansible 之上，企业需要 **Web UI、RBAC、审批、调度、密钥托管、审计日志、REST API**——这就是 **AWX / AAP**：

- **AWX**：**上游开源项目**，提供 Web UI、REST API 和任务引擎，**「是 Red Hat Ansible Automation Platform 的上游项目之一」**。免费、社区支持、迭代快。
- **automation controller**（**原 Ansible Tower**）：AAP 里的核心组件，**「取 AWX 的选定版本、加固以获得长期可支持性」**后交付给客户。
- **AAP（Ansible Automation Platform）**：Red Hat 的**商业订阅产品**，把 controller、私有 Galaxy（automation hub）、EE 构建等打包，含官方支持。

配套的现代运行方式：

- **Execution Environment（EE）**：**打包好 `ansible-core` + collection + Python 依赖的容器镜像**，解决「我机器上能跑、你机器上缺依赖」的环境漂移；由 `ansible-builder` 构建。
- **ansible-navigator**：面向 EE 的 CLI/TUI 工具，**在 EE 容器里跑 playbook**；底层由 `ansible-runner` 真正执行。

::: tip 选型速记
**临时/小规模/开发** → 裸 `ansible-playbook` + Vault + inventory 足矣。
**团队协作/审计合规/定时调度/自助运行** → 上 **AWX**（自建、免费）或 **AAP**（商业、有支持）。
**跨机器依赖一致性** → 用 **EE 容器** + `ansible-navigator` 固化运行环境。
:::

至此，Ansible 从入门到工程化的全貌已完整。速查命令、模块与坑见[参考](./reference)。
