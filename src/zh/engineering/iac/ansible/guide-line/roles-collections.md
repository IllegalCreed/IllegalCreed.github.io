---
layout: doc
outline: [2, 3]
---

# Role 与 Collection：复用与分发

> 基于 Ansible（ansible-core 2.21 · 社区包 13.x）· 核于 2026-07

## 速查

- **role（角色）**：可复用的内容单元——把 tasks/handlers/变量/模板/文件按**标准目录**组织，供多个 play 复用。
- **role 七目录**：`tasks/` `handlers/` `defaults/`（默认变量，最低优先级）`vars/`（角色变量，较高）`files/` `templates/` `meta/`（元数据与依赖）。
- **`main.yml` 约定**：各目录默认读 `main.yml`（也认 `main.yaml`/`main`），无需手动 include。
- **用 role 三法**：play 顶的 `roles:`（经典静态）、`import_role`（静态导入）、`include_role`（动态、可放 task 中间/带循环条件）。
- **role 依赖**：`meta/main.yml` 里 `dependencies:`；被依赖的 role **先于**当前 role 执行。
- **collection（集合）**：2.10 起的**分发格式**，可含 playbook/role/module/plugin；命名 `namespace.collection`。
- **FQCN**：完全限定名 `namespace.collection.内容`，如 `ansible.builtin.copy`、`community.general.docker_container`、`ansible.posix.firewalld`。
- **`ansible.builtin`**：随 `ansible-core` 内置的核心集合（copy/template/service/user……）。
- **Ansible Galaxy**：`galaxy.ansible.com`，找 / 下 / 分享 role 与 collection 的社区平台。
- **`ansible-galaxy`**：`collection install`、`role install`、`role init`（脚手架）、`role search`/`info`。
- **`requirements.yml`**：一份文件声明要装的 roles + collections，批量安装、锁版本。
- **role vs collection**：role 是**组织复用**的最小单元，collection 是**打包分发**的容器（一个 collection 里可含多个 role + module）。

## 一、role：可复用内容的标准封装

当 playbook 变大，把「装并配 Nginx」这类逻辑塞在一个文件里会难以复用。**role** 就是解法——官方定义：**「一份可复用 Ansible 内容（tasks、handlers、变量、plugins、模板、文件）的有限分发单元，供 play 内使用。」**

role 的威力来自**约定优于配置**的标准目录结构：

```
roles/
  nginx/
    tasks/
      main.yml        # 入口任务列表
    handlers/
      main.yml        # 本 role 的 handler
    templates/
      nginx.conf.j2   # template 模块默认从这里找
    files/
      index.html      # copy 模块默认从这里找
    vars/
      main.yml        # 角色变量（优先级较高）
    defaults/
      main.yml        # 默认变量（优先级最低，供覆盖）
    meta/
      main.yml        # 元数据、依赖、Galaxy 信息
    library/          # 本 role 私有模块（可选）
    module_utils/     # 私有 module_utils（可选）
    lookup_plugins/   # 私有 lookup 插件（可选）
```

关键约定（官方）：**「Ansible 默认在大多数 role 目录里找 `main.yml` 文件作为相关内容」**（也认 `main.yaml` 和 `main`）。所以 `tasks/main.yml`、`handlers/main.yml`、`defaults/main.yml` 等都是自动加载的入口，你在 play 里只要引用 role 名即可。

`defaults/` 与 `vars/` 的区别是**优先级**：`defaults/main.yml` 优先级**最低**（就是给使用者覆盖的默认值），`vars/main.yml` 优先级**较高**（role 内部认定的值，不易被覆盖）——参见[变量与模板](./variables-templating)的 22 级优先级。

用 `ansible-galaxy` 一键生成骨架：

```bash
ansible-galaxy role init nginx
# 自动创建上面全套目录 + 空 main.yml
```

## 二、使用 role 的三种方式

**方式一：`roles:` 关键字（经典、静态）**——官方称「使用 role 的经典（最初）方式」，在 play 顶层声明，按顺序执行：

```yaml
- hosts: webservers
  become: true
  roles:
    - common
    - nginx
    - { role: app, vars: { app_port: 8080 } }   # 可传参
```

**方式二：`import_role`（静态导入）**——「行为与 `roles` 关键字相同」，在编译时展开，可放进 tasks 列表里控制位置：

```yaml
tasks:
  - name: 先做点别的
    ansible.builtin.debug: { msg: before }
  - name: 静态导入 role
    ansible.builtin.import_role:
      name: nginx
```

**方式三：`include_role`（动态包含）**——运行时才决定，**可配 `when` / `loop`**，灵活性最高：

```yaml
tasks:
  - name: 按环境动态包含不同 role
    ansible.builtin.include_role:
      name: "{{ item }}"
    loop:
      - base
      - "{{ 'prod_hardening' if env == 'prod' else 'dev_tools' }}"
```

> 静态（`import_*`）在解析阶段展开，`--list-tasks`/`--tags` 可见；动态（`include_*`）在运行阶段决定，支持循环条件但对 tag 的处理不同。规则简单：**要循环/条件选 role 用 `include_role`，否则 `import_role` 或 `roles:`**。

## 三、role 依赖

role 可声明它依赖别的 role，写在 `meta/main.yml`（官方示例）：

```yaml
# roles/myapp/meta/main.yml
---
dependencies:
  - role: common
    vars:
      some_parameter: 3
  - role: apache
    vars:
      apache_port: 80
```

规则：**「Ansible 总是先执行 `dependencies` 里列出的 role，再执行列出它们的 role。」** 即依赖先跑。

role 的搜索路径（默认顺序）：collection 内 → playbook 同级的 `roles/` → 配置的 `roles_path`（默认 `~/.ansible/roles:/usr/share/ansible/roles:/etc/ansible/roles`）→ playbook 所在目录。

## 四、collection 与 FQCN：2.10 的大拆分

**collection（集合）是 2.10 起引入的分发格式**——官方定义：**「一种分发 Ansible 内容的格式，可包含 playbook、role、module 和 plugin。」** 它是理解现代 Ansible 的关键背景：

- **Ansible 2.10 起，`ansible-core`（引擎 + 少量内置模块）与海量「内容」彻底拆开**。以前几千个模块都塞在一个大包里，现在按领域拆进独立 collection（`community.general`、`community.docker`、`amazon.aws`、`ansible.posix`……），各自独立发版。
- 你日常 `pip install ansible` 装的**社区发行包（Ansible community package，如 13.x）**= `ansible-core` + 一大批**预装 collection**；只装 `ansible-core` 则只有 `ansible.builtin`。

**FQCN（Fully Qualified Collection Name，完全限定集合名）**是引用内容的标准方式，格式 `namespace.collection.内容名`：

```yaml
tasks:
  - ansible.builtin.copy:                 # 内置集合的 copy 模块
      src: a.txt
      dest: /tmp/a.txt
  - community.general.docker_container:    # community.general 集合
      name: web
      image: nginx
  - ansible.posix.firewalld:               # ansible.posix 集合
      service: https
      state: enabled
```

- **`ansible.builtin`** 是随 `ansible-core` 内置的核心集合（`copy`/`template`/`service`/`user`/`file`/`debug`/`setup`……）。
- **自 2.10 起官方强烈建议「总是写 FQCN」**：短名（如直接写 `copy`）仍能用，但可能撞到不同 collection 的同名模块，FQCN 无歧义。
- play 里可用 `collections:` 关键字声明默认搜索的 collection，减少重复前缀（但 FQCN 更明确，推荐优先 FQCN）。

## 五、Ansible Galaxy 与 `requirements.yml`

**Ansible Galaxy** 是官方社区分发平台——**「[galaxy.ansible.com](https://galaxy.ansible.com) 网站，免费查找、下载、分享社区开发的 collection 与 role」**。配套 CLI 是 `ansible-galaxy`：

```bash
# 装 collection
ansible-galaxy collection install community.general

# 装 role
ansible-galaxy role install geerlingguy.nginx

# 搜索与查看
ansible-galaxy role search elasticsearch --author geerlingguy
ansible-galaxy role info geerlingguy.nginx

# 生成 role 骨架
ansible-galaxy role init my_role
```

工程化的正确姿势是把依赖写进 **`requirements.yml`**，一份文件同时声明 role 和 collection、锁版本，团队/CI 一键装齐（官方示例）：

```yaml
# requirements.yml
roles:
  - name: geerlingguy.java
    version: "1.9.6"
  - src: https://github.com/org/repo.git   # 也可从 git 装
    scm: git
    version: main
    name: my_role

collections:
  - name: community.general
    version: ">=7.0.0"
  - name: ansible.posix
```

```bash
# 一次装齐（分别装 role 与 collection）
ansible-galaxy install -r requirements.yml            # 装 roles
ansible-galaxy collection install -r requirements.yml # 装 collections
```

::: tip role 还是 collection？
**role** 解决「**组织复用**」——把一段自动化逻辑封成标准目录。**collection** 解决「**打包分发**」——把「一批 role + 一批 module + plugin」装进一个可版本化、可上传 Galaxy 的容器。一个 collection 里可以含多个 role。现代实践：内部复用写 role，对外分发/引用第三方能力用 collection。
:::

role 与 collection 把「能力」沉淀成可复用、可分发的资产。下一页收尾：**Vault 加密、check mode、大规模滚动、push vs pull 与选型，以及 AWX/AAP**。
