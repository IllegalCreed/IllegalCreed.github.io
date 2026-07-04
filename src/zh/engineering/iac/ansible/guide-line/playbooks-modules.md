---
layout: doc
outline: [2, 3]
---

# Playbook 与模块：幂等、条件、循环、handler

> 基于 Ansible（ansible-core 2.21 · 社区包 13.x）· 核于 2026-07

## 速查

- **模块幂等**：模块尽量做到「已达标就不动」；task 结果状态有 **`ok`（无需改）/ `changed`（改了）/ `failed` / `skipped` / `unreachable`**。
- **`command`/`shell` 不幂等**：它们每次都报 `changed`（Ansible 无法判断命令效果），要用 `creates`/`removes` 或 `changed_when` 收敛，能用专用模块就别用 shell。
- **`state` 是幂等的关键参数**：`present`/`absent`/`started`/`stopped`/`latest` 等描述「期望态」，模块自己算要不要动。
- **`when`**：条件执行，值是**不带 <code v-pre>{{ }}</code> 的裸 Jinja2 表达式**；多条件写成列表 = 逻辑 AND。
- **`register`**：把 task 输出存进变量，供后续 `when`/循环使用；含 `.stdout`/`.rc`/`.changed` 等字段。
- **`loop`**：循环，用 <code v-pre>{{ item }}</code> 取当前元素；`loop_control` 调 `label`/`index_var`；`until`+`retries`+`delay` 做重试（默认 3 次 / 隔 5 秒）。
- **`handler` + `notify`**：task 报 `changed` 时用 `notify` 触发 handler；handler **在 play 全部 task 跑完后统一执行、多次通知只跑一次**。
- **`changed_when` / `failed_when`**：自定义「什么算改了 / 什么算失败」，把不幂等命令驯服成幂等语义。
- **`become`**：提权（默认 sudo），`become_user` 指定目标用户。
- **`block`**：把多 task 分组，配 `rescue`（出错时跑）/ `always`（总是跑）实现类 try/catch。
- **`tags`**：给 task/play 打标签，`--tags` / `--skip-tags` 选择性执行。
- **`ignore_errors: true`**：失败不中断；`meta: flush_handlers` 手动立即触发 handler。

## 一、幂等与 task 状态：Ansible 的世界观

Ansible 的模块设计目标是**幂等（idempotent）**：官方原话——**「当系统已处于 playbook 描述的状态时，即便 playbook 运行多次，Ansible 也不改任何东西。」** 每个 task 跑完会报一个状态，颜色和含义要记牢：

- **`ok`（绿）**：task 执行了，但**系统已达标、无需改动**（幂等空转）。
- **`changed`（黄）**：task **确实做了改动**。
- **`failed`（红）**：task 失败。
- **`skipped`**：`when` 条件为假，跳过。
- **`unreachable`**：连不上主机。

正因如此，写 Ansible 的正确姿势是**声明期望态**，而不是写「怎么一步步做」。看这个对比：

```yaml
# 好：声明式、幂等。已装则 ok，未装则 changed
- name: 确保 nginx 已安装
  ansible.builtin.dnf:
    name: nginx
    state: present

# 坏：命令式、不幂等。每次都 changed，且重复装可能报错
- name: 安装 nginx（反面教材）
  ansible.builtin.command: dnf install -y nginx
```

关键参数 `state` 就是幂等的抓手：`present`/`absent`（在/不在）、`started`/`stopped`/`restarted`（服务态）、`latest`（最新版）——你说要什么态，模块自己判断「现在是不是这个态、要不要动」。

### `command`/`shell` 为什么不幂等，怎么驯服

`ansible.builtin.command` 和 `ansible.builtin.shell` 直接跑 shell 命令，**Ansible 无从知道这条命令有没有产生改变**，所以它们**默认每次都报 `changed`**。三种驯服手段：

```yaml
# 1) creates/removes：目标文件已存在就跳过（最省心）
- name: 解压安装包（/opt/app 已存在就不重复解压）
  ansible.builtin.command: tar xzf /tmp/app.tgz -C /opt
  args:
    creates: /opt/app

# 2) changed_when：自定义「什么算改了」
- name: 查询版本（这是只读查询，永远不该算 changed）
  ansible.builtin.command: myapp --version
  register: ver
  changed_when: false

# 3) failed_when：自定义「什么算失败」
- name: 允许 rc=2 视为正常
  ansible.builtin.command: /usr/bin/check
  register: r
  failed_when: r.rc != 0 and r.rc != 2
```

**能用专用模块就别用 `command`/`shell`**——`copy`/`template`/`service`/`user`/`file` 这些都是幂等的，天然报准 `ok`/`changed`。

## 二、`register`：捕获 task 输出

`register` 把一个 task 的执行结果存进变量，供后续 task 判断或引用。注册变量是**主机级**、**仅当次运行有效**：

```yaml
- name: 读取 motd
  ansible.builtin.command: cat /etc/motd
  register: motd_contents

- name: motd 含 hi 才提示
  ansible.builtin.debug:
    msg: "motd 里有 hi"
  when: motd_contents.stdout.find('hi') != -1
```

注册变量常用字段：`.stdout` / `.stdout_lines`（输出）、`.rc`（返回码）、`.changed` / `.failed`（状态）、`.stderr`。

## 三、`when`：条件执行

`when` 控制 task 跑不跑。**注意：它的值是「不带花括号」的裸 Jinja2 表达式**——这是初学者最常踩的坑：

```yaml
- name: 只关 Debian 系
  ansible.builtin.command: /sbin/shutdown -t now
  when: ansible_facts['os_family'] == "Debian"
```

多个条件**写成列表 = 逻辑 AND**，可读性比一长串 `and` 好：

```yaml
- name: CentOS 6 才执行
  ansible.builtin.command: echo hi
  when:
    - ansible_facts['distribution'] == "CentOS"
    - ansible_facts['distribution_major_version'] == "6"
```

复杂逻辑用 `and`/`or` + 括号，配合状态测试 `is failed` / `is succeeded` / `is changed` / `is skipped`：

```yaml
- name: 前一步改过才继续
  ansible.builtin.service:
    name: nginx
    state: restarted
  when: config_result is changed
```

::: warning `when` 里不要加花括号
<code v-pre>when: {{ x == 1 }}</code> 是错的。`when` 本身就是表达式上下文，写成 `when: x == 1` 即可。正文里单独提到变量插值时才用 <code v-pre>{{ x }}</code>，而 `when`/`loop`/`changed_when` 这些「表达式关键字」**一律不加花括号**。
:::

## 四、`loop`：循环

`loop`（2.5 起的推荐写法，取代老的 `with_*`）让一个 task 迭代一组值，用 <code v-pre>{{ item }}</code> 取当前元素：

```yaml
- name: 批量建用户
  ansible.builtin.user:
    name: "{{ item }}"
    state: present
    groups: wheel
  loop:
    - alice
    - bob
```

元素是字典时，用 <code v-pre>{{ item.键名 }}</code>：

```yaml
- name: 建用户并指定组
  ansible.builtin.user:
    name: "{{ item.name }}"
    groups: "{{ item.groups }}"
  loop:
    - { name: alice, groups: wheel }
    - { name: bob, groups: docker }
```

遍历字典要先过 `dict2items` filter，然后用 <code v-pre>{{ item.key }}</code> / <code v-pre>{{ item.value }}</code>：

```yaml
- name: 遍历 map
  ansible.builtin.debug:
    msg: "{{ item.key }} = {{ item.value }}"
  loop: "{{ server_configs | dict2items }}"
```

`loop_control` 优化循环体验，`until` 做重试：

```yaml
- name: 循环控制
  ansible.builtin.debug:
    msg: "{{ item.name }}"
  loop: "{{ big_list }}"
  loop_control:
    label: "{{ item.name }}"   # 只在输出里显示 name，避免刷屏整个字典
    index_var: idx             # 用 idx 拿到序号

- name: 轮询直到就绪（默认 retries=3, delay=5）
  ansible.builtin.command: /usr/bin/foo
  register: result
  until: result.stdout.find("all systems go") != -1
  retries: 5
  delay: 10
```

::: tip `loop` 与 `when` 同用
两者共用时，`when` **对每个 `item` 单独判断**，条件不满足的元素被 `skipped`：`loop: [0,2,4,6,8,10]` 配 `when: item > 5` 只会对 6/8/10 执行。
:::

## 五、handler 与 notify：改了才重启

**handler 是「只在被通知时才运行的特殊 task」**，最经典的用途是「配置文件变了 → 重启服务」。规则（官方）非常关键：

- task 报 **`changed`** 时，用 `notify` **按名字**通知一个或多个 handler。
- handler **不是立刻跑**，而是**等 play 里所有 task 跑完后统一执行**（顺序：`pre_tasks` → `roles`/`tasks` → `post_tasks` 之后）。
- **同一个 handler 即便被通知多次，也只跑一次**——这正是我们要的（改了 3 个配置只重启 1 次）。
- task **没 `changed`（是 `ok`）就不会触发** handler。

```yaml
- name: 配置并按需重启 Apache
  hosts: webservers
  become: true
  tasks:
    - name: 下发 httpd.conf
      ansible.builtin.template:
        src: httpd.conf.j2
        dest: /etc/httpd/conf/httpd.conf
      notify: Restart apache          # 只有这份配置真变了才通知

  handlers:
    - name: Restart apache            # 名字要和 notify 对上
      ansible.builtin.service:
        name: httpd
        state: restarted
```

进阶：

- **一次通知多个 handler**：`notify: [Restart apache, Restart memcached]`。
- **`listen`**：多个 handler 监听同一「主题名」，一条 `notify: 主题名` 全触发，解耦 handler 具体名字。
- **`meta: flush_handlers`**：在 play 中途**立即**执行已排队的 handler，而不必等到最后。

```yaml
- name: 中途强制刷 handler
  ansible.builtin.meta: flush_handlers
```

## 六、block：分组、rescue、always

`block` 把多个 task 打包，配 `rescue`（块内出错时执行）和 `always`（无论成败都执行），相当于 try/catch/finally：

```yaml
- name: 带错误处理的部署
  block:
    - name: 部署新版本
      ansible.builtin.command: /opt/deploy.sh
  rescue:
    - name: 部署失败则回滚
      ansible.builtin.command: /opt/rollback.sh
  always:
    - name: 无论如何都通知
      ansible.builtin.debug:
        msg: 部署流程结束
```

`block` 还能给一组 task 统一加 `when` / `become` / `tags`，减少重复。

## 七、tags：选择性执行

给 task 或 play 打 `tags`，运行时用 `--tags` 只跑指定标签、`--skip-tags` 跳过：

```yaml
tasks:
  - name: 装包
    ansible.builtin.dnf:
      name: nginx
      state: present
    tags: [install]

  - name: 下发配置
    ansible.builtin.template:
      src: nginx.conf.j2
      dest: /etc/nginx/nginx.conf
    tags: [config]
```

```bash
ansible-playbook site.yml --tags config      # 只下发配置，不重装
ansible-playbook site.yml --skip-tags install
```

到这里你已经能写出「条件 + 循环 + 幂等 + 变更触发重启 + 错误处理」的实战 playbook。下一页深入**变量的 22 级优先级、facts 与 Jinja2 模板**。
