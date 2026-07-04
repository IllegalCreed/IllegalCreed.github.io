---
layout: doc
outline: [2, 3]
---

# 入门：agentless、SSH push 与第一个 playbook

> 基于 Ansible（ansible-core 2.21 · 社区包 13.x）· 核于 2026-07

## 速查

- **Ansible 是什么**：Red Hat 出品的**自动化引擎**，管配置、部署、编排；官方定义「automates the management of remote systems and controls their desired state」。
- **agentless（无 agent）**：被管机器**不装常驻软件**，只需能 SSH 进去 + 有 Python（Windows 走 WinRM）；控制机用现有 OS 凭据连接。
- **push 模型**：控制机主动把模块推到节点执行完即走（对比 Puppet/Chef 的 pull + agent + master）。
- **control node（控制节点）**：装了 Ansible、跑 `ansible` / `ansible-playbook` / `ansible-vault` 等 CLI 的机器；**不能是 Windows**。
- **managed node（被管节点 / host）**：被 Ansible 管理的目标机器；控制节点上**只装一次** Ansible 即可管一片。
- **inventory（清单）**：被管节点的列表，可 **INI** 或 **YAML** 格式；默认自带 `all` 和 `ungrouped` 两个组。
- **四层结构**：**playbook**（剧本，一组 play）→ **play**（把 hosts 映射到一串 task）→ **task**（一个动作，引用一个 module）→ **module**（真正在节点上跑的代码）。
- **module 幂等**：官方原话「当系统已处于 playbook 描述的状态时，即便多次运行 Ansible 也不改任何东西」。
- **ad-hoc vs playbook**：一次性小事用 <code v-pre>ansible &lt;pattern&gt; -m 模块 -a "参数"</code>；可复用、要留档的用 playbook（YAML 文件 + `ansible-playbook` 跑）。
- **默认自动采集 facts**：play 开跑前有一步隐式 `Gathering Facts`，把主机信息灌进变量供后续使用。
- **YAML 可读性**：playbook 用 YAML 写，「读起来像文档」——这是 Ansible 相对脚本/其他工具的核心卖点之一。
- **两个主命令**：`ansible`（ad-hoc）与 `ansible-playbook`（跑 playbook）；辅以 `ansible-inventory`、`ansible-galaxy`、`ansible-vault`、`ansible-config` 等。

## 一、Ansible 是什么，为什么是 agentless

Ansible 是 Red Hat 旗下的开源自动化工具，官方一句话定义是：**「Ansible 自动化远程系统的管理，并把它们控制到期望状态。」** 它的典型用途是**配置管理**（在一批机器上装包、改配置文件、起服务）、**应用部署**、以及**多机编排**（按顺序滚动发布、协调多角色）。

理解 Ansible 的第一把钥匙是 **agentless（无 agent）**。传统配置管理工具（Puppet、Chef）通常要在每台被管机器上**装一个 agent 常驻进程**，agent 定期去中心 master 服务器**拉（pull）**配置。Ansible 反其道而行：

- 被管机器上**不装任何 Ansible 软件、不跑守护进程**——只要它能被 SSH 登录、装了 Python（大多数 Linux 自带）即可。Windows 节点则通过 **WinRM** 管理。
- 控制机用**现有的 OS 凭据（SSH key / 账号）**连过去，把要执行的模块代码**推（push）**到节点上跑，跑完即走、不留后台。

官方对这套架构的描述是：**「Agent-less architecture」**，好处是**「避免在 IT 基础设施上遍装额外软件，维护开销低」**，并且**「用现有 OS 凭据通过 SSH 访问远程机器」**。这带来两个直接后果：**上手快**（没有 master/agent 要搭），**攻击面小**（节点没多开一个常驻服务）。

::: tip control node 不能是 Windows
你可以用 Ansible **管理** Windows 节点（经 WinRM），但**运行 Ansible 的控制节点必须是类 Unix 系统**（Linux / macOS / WSL）。控制节点上装一次 Ansible，就能管理成百上千台节点。
:::

## 二、control node 与 managed node

Ansible 的世界里只有两类角色（官方定义）：

- **control node（控制节点）**：**「你运行 Ansible CLI 工具（`ansible-playbook`、`ansible`、`ansible-vault` 等）的机器」**。全部逻辑都在这里执行、这里发起连接。
- **managed node（被管节点）**：**「也叫 host，是你想用 Ansible 管理的目标设备——服务器、网络设备或任何计算机」**。

再加上一个把它们联系起来的东西——**inventory（清单）**：**「一个或多个 inventory source 提供的被管节点列表」**。

## 三、inventory：告诉 Ansible 管哪些机器

inventory 就是一份主机名单，可以用 **INI** 或 **YAML** 两种格式写。最小的 INI 清单：

```ini
# inventory.ini
mail.example.com

[webservers]
foo.example.com
bar.example.com

[dbservers]
one.example.com
two.example.com
three.example.com
```

方括号里的 `[webservers]` 是**组名**，用来给主机分类，方便「这次只对 web 组动手」。等价的 YAML 写法：

```yaml
# inventory.yml
webservers:
  hosts:
    foo.example.com:
    bar.example.com:
dbservers:
  hosts:
    one.example.com:
    two.example.com:
```

几个关键规则：

- **两个默认组**：即使你一个组都不建，Ansible 也自带 `all`（包含所有主机）和 `ungrouped`（不属于任何自定义组的主机）。
- **主机范围**：一批规律命名的主机可写成范围，`www[01:50].example.com` 展开成 www01 到 www50；加步长 `www[01:50:2]` 只取奇数号。
- **嵌套组（children）**：组之间可建父子关系，INI 用 `[prod:children]`，YAML 用 `children:`。
- **连接变量**：常用 `ansible_host`（真实 IP/域名）、`ansible_user`（登录用户）、`ansible_connection`（连接类型，如 `ssh`/`winrm`/`local`）、`ansible_port`（端口，SSH 默认 22）、`ansible_ssh_private_key_file`（私钥路径）。

## 四、playbook · play · task · module 四层结构

这是 Ansible 最核心的心智模型，务必分清（均为官方定义）：

- **playbook（剧本）**：**「一组 play 的列表，定义 Ansible 从上到下执行操作的顺序，以达成整体目标」**。就是你写的那个 YAML 文件。
- **play（剧目）**：**「Ansible 执行的基本单元」**，把一批 **hosts** 映射到一串有序 **task**。
- **task（任务）**：**「对被管主机施加的一个动作的定义」**，每个 task 引用**一个** module。
- **module（模块）**：**「Ansible 拷贝到每个被管节点上执行、以完成 task 所定义动作的代码或二进制」**。模块是幂等的主力。

一个最小 playbook（官方示例）：

```yaml
# playbook.yaml
- name: My first play          # play 的名字
  hosts: myhosts               # 这个 play 作用在哪些主机
  tasks:
    - name: Ping my hosts      # task 的名字（描述性）
      ansible.builtin.ping:    # 引用 ping 模块，无参数

    - name: Print message
      ansible.builtin.debug:   # debug 模块
        msg: Hello world       # 模块参数
```

运行它：

```bash
ansible-playbook -i inventory.ini playbook.yaml
```

::: tip 为什么模块名带 `ansible.builtin.` 前缀
`ansible.builtin.ping` 是模块的 **FQCN（完全限定集合名，Fully Qualified Collection Name）**——`namespace.collection.module`。`ansible.builtin` 是内置在 `ansible-core` 里的核心集合。自 2.10 起官方推荐**总是写 FQCN**，避免同名模块歧义（详见 [Role 与 Collection](./guide-line/roles-collections)）。
:::

跑起来时你会先看到一步 **`Gathering Facts`**——这是 Ansible 在正式执行 task 前**自动采集主机信息**（OS、IP、内存……）的隐式任务，采到的数据后续可用（详见 [变量与模板](./guide-line/variables-templating)）。

## 五、ad-hoc 命令：不写 playbook 的一次性活

不是所有事都值得写 playbook。**ad-hoc 命令**用 `ansible` 工具跑单个模块，官方描述是**「快、方便，但不可复用」**——适合偶尔一次的操作。语法：

```bash
ansible <pattern> -m <module> -a "<module options>"
```

- `<pattern>`：作用于哪些主机（组名、主机名、`all`、通配等）。
- `-m`：用哪个模块（**不写 `-m` 时默认是 `command` 模块**）。
- `-a`：模块参数，`key=value` 或 JSON。

常见例子（官方）：

```bash
ansible all -m ping                                  # 探活所有主机
ansible webservers -m ansible.builtin.service -a "name=httpd state=started"  # 起服务
ansible webservers -m ansible.builtin.dnf -a "name=acme state=present"       # 装包
ansible atlanta -a "/sbin/reboot" -f 10              # 用默认 command 模块重启，10 并发
ansible all -m ansible.builtin.setup                 # 打印某主机全部 facts
```

**ad-hoc vs playbook 怎么选**：临时探活、临时重启、临时查状态 → ad-hoc；只要这件事会**重复做**、需要**留档 / 评审 / 版本控制** → 写成 playbook。

## 六、跑通第一个闭环

把上面串起来，一个「装 Nginx 并启动」的最小 playbook：

```yaml
# site.yml
- name: 部署 Nginx
  hosts: webservers
  become: true                       # 用 sudo 提权
  tasks:
    - name: 安装 nginx 包
      ansible.builtin.dnf:
        name: nginx
        state: present               # 声明「要存在」，已装则不动（幂等）

    - name: 确保 nginx 已启动并开机自启
      ansible.builtin.service:
        name: nginx
        state: started
        enabled: true
```

```bash
ansible-playbook -i inventory.ini site.yml
```

第一次跑，两个 task 都报 **`changed`**（真装了、真启动了）；**原封不动再跑一次**，两个 task 都变成 **`ok`**（系统已达标，什么都没动）——这就是**幂等**的直观体现，也是 Ansible 世界观的核心：**你描述「要什么」，模块负责「已经对了就别动」**。

到这里你已经能跑通「写 inventory → 写 playbook → `ansible-playbook` → 幂等复跑」的闭环。接下来按[本叶地图](./)深入 playbook 写法、变量模板、role/collection 与工程实践。
