---
layout: doc
outline: [2, 3]
---

# 变量与模板：优先级、facts 与 Jinja2

> 基于 Ansible（ansible-core 2.21 · 社区包 13.x）· 核于 2026-07

## 速查

- **引用变量**：Jinja2 双花括号 <code v-pre>{{ 变量名 }}</code>；**值以 <code v-pre>{{ }}</code> 开头时整串必须加引号**（否则 YAML 当成字典），如 <code v-pre>path: "{{ base }}/x"</code>。
- **变量来源**：`vars`（play 内）、`vars_files`、`group_vars/`、`host_vars/`、role 的 `defaults/` 与 `vars/`、`--extra-vars`（`-e`）、`register`、`set_fact`。
- **22 级优先级**：从低到高——**role defaults 最低**，`-e` extra vars **永远最高（always win）**；越靠近具体主机/任务越高。
- **facts**：play 前自动采集的主机信息（OS、IP、内存……），存在 `ansible_facts` 字典，如 <code v-pre>{{ ansible_facts['os_family'] }}</code>。
- **关 facts 提速**：不需要时 `gather_facts: false`；手动采集用 `ansible.builtin.setup` 模块。
- **facts 顶层别名**：默认 facts 也以 `ansible_` 前缀注入顶层变量（如 `ansible_os_family`），可用 `INJECT_FACTS_AS_VARS` 配置关闭。
- **自定义 local facts**：节点 `/etc/ansible/facts.d/*.fact`（INI/JSON 或可执行脚本输出 JSON），读作 <code v-pre>{{ ansible_local['xxx'] }}</code>。
- **`set_fact`**：运行期动态设变量/主机级 fact，`cacheable: true` 可入 fact 缓存。
- **`register`**：捕获 task 输出为变量（见 [Playbook 与模块](./playbooks-modules)）。
- **Jinja2 模板发生在控制节点**：`template` 模块渲染 `.j2` 后再传到目标机，**目标机无需装 Jinja2**。
- **常用 filter**：`| default('x')`、`| to_json` / `| to_nice_yaml`、`| dict2items`、`| join(',')`、`| mandatory`；filter 用管道 `|`，test 用 `is`。
- **变量名规则**：只能字母、数字、下划线，不能数字开头，不能是关键字。

## 一、定义与引用变量

变量让 playbook 可复用。最直接的是 play 内 `vars`，引用用 **Jinja2 双花括号**：

```yaml
- hosts: webservers
  vars:
    http_port: 80
    doc_root: /var/www/html
  tasks:
    - name: 用变量拼路径
      ansible.builtin.template:
        src: nginx.conf.j2
        dest: "{{ doc_root }}/nginx.conf"    # 引用变量
```

::: warning 以花括号开头的值必须加引号
这是最高频的 YAML 坑：当一个值**以 <code v-pre>{{ }}</code> 开头**时，YAML 会把它误当成字典，必须给整串加引号。
:::

```yaml
# 错：YAML 解析失败
dest: {{ doc_root }}/nginx.conf
# 对：整串加引号
dest: "{{ doc_root }}/nginx.conf"
# 值在中间则不必：
greeting: "Hello {{ user }}"
```

变量名**只能包含字母、数字、下划线**，不能以数字开头，也不能是 Python/playbook 关键字。

变量的常见落脚点（后面细讲优先级）：

- `vars:` / `vars_files:` —— play 内联或外部文件。
- `group_vars/<组名>.yml`、`host_vars/<主机名>.yml` —— 按组/主机自动加载。
- role 的 `defaults/main.yml`（最低优先级，供覆盖）与 `vars/main.yml`（较高）。
- 命令行 `--extra-vars` / `-e`（最高优先级）。
- `register`（捕获输出）、`set_fact`（运行期设值）。

## 二、变量优先级：22 级全景（务必记住两头）

同名变量在多处定义时，Ansible 有一套**严格的优先级**。官方从**低到高**排序如下（记不住全部没关系，**记牢两头**即可）：

1. command line values（如 `-u my_user`）
2. **role defaults** ← **最低，就是给人覆盖的**
3. inventory file / script group vars
4. inventory `group_vars/all`
5. playbook `group_vars/all`
6. inventory `group_vars/*`
7. playbook `group_vars/*`
8. inventory file / script host vars
9. inventory `host_vars/*`
10. playbook `host_vars/*`
11. host facts / cached set_facts
12. play vars
13. play vars_prompt
14. play vars_files
15. role vars
16. block vars
17. task vars
18. include_vars
19. registered vars / set_facts
20. role（及 include_role）params
21. include params
22. **extra vars（`-e "user=my_user"`）← 永远最高，always win**

三条实用心法：

- **`defaults/main.yml` 是「默认值」**：放在 role 里供外部覆盖，优先级几乎垫底。
- **`-e` 是「大锤」**：命令行 extra vars 压过一切，适合临时强制、CI 注入，但**别滥用**（会让「变量到底哪来的」变难追）。
- **越具体越优先**：大体上「离具体主机/任务越近」优先级越高（host_vars > group_vars，task vars > play vars）。

官方还把作用域分三类：**Global**（config / 环境变量 / 命令行）、**Play**（play 及其 `vars`/`vars_files`/`vars_prompt`、role defaults 与 vars）、**Host**（与主机直接绑定的 inventory、include_vars、facts、注册变量）。

## 三、facts：自动采集的主机信息

**facts 是关于远程主机的数据**——官方定义：**「操作系统、IP 地址、挂载的文件系统等」**。每个 play 默认开跑前会自动采集（那步 `Gathering Facts`），结果存进 `ansible_facts` 字典：

```yaml
- name: 按 OS 分发
  ansible.builtin.debug:
    msg: "OS 家族是 {{ ansible_facts['os_family'] }}，主机名 {{ ansible_facts['nodename'] }}"
```

手动查看某主机全部 facts（ad-hoc 用 `setup` 模块）：

```bash
ansible web01 -m ansible.builtin.setup
```

关键点：

- **默认还注入 `ansible_` 前缀顶层变量**：`ansible_facts['os_family']` 也能写成 `ansible_os_family`。这个「注入」行为可用 `INJECT_FACTS_AS_VARS = false` 配置关闭，届时只能走 `ansible_facts['...']`。**新代码建议统一用 `ansible_facts['...']`**，更清晰、不受该开关影响。
- **关掉采集提速**：facts 采集有开销，大规模或不需要时在 play 里 `gather_facts: false`。
- **fact 缓存**：facts 默认只在**内存**里、当次有效；配 cache plugin 可**跨 playbook 运行持久化**——甚至能「在配置 B 主机时引用先前采集的 A 主机的 facts」。

### 自定义 local facts

想让节点上报**自己的业务信息**？在节点的 `/etc/ansible/facts.d/` 放 `*.fact` 文件（静态 INI/JSON，或输出 JSON 的可执行脚本），它们出现在 `ansible_local` 命名空间下：

```ini
# 节点上 /etc/ansible/facts.d/preferences.fact
[general]
asdf = 1
```

```yaml
- name: 读自定义 local fact
  ansible.builtin.debug:
    msg: "{{ ansible_local['preferences']['general']['asdf'] }}"
```

## 四、`set_fact`：运行期动态设值

`set_fact` 在 playbook 执行过程中**动态创建变量 / 主机级 fact**，常用于「根据前面结果算出一个值，供后面用」：

```yaml
- name: 依据环境算出配置目录
  ansible.builtin.set_fact:
    conf_dir: "{{ '/etc/app/prod' if env == 'prod' else '/etc/app/dev' }}"

- name: 使用它
  ansible.builtin.file:
    path: "{{ conf_dir }}"
    state: directory
```

加 `cacheable: true` 可把它写进 fact 缓存，行为更接近采集来的 fact。

## 五、Jinja2 模板：`template` 模块与 filter

Ansible 的模板引擎是 **Jinja2**。核心事实（官方）：**「所有模板渲染都发生在 Ansible 控制节点上，在 task 被发往目标机执行之前完成」**，所以**目标机不需要装 Jinja2**。

最典型用法是 `template` 模块——渲染一个 `.j2` 模板文件再投放到目标机：

```jinja
# templates/nginx.conf.j2
server {
    listen {{ http_port }};
    server_name {{ ansible_facts['fqdn'] }};
    root {{ doc_root }};
}
```

```yaml
- name: 渲染并下发 nginx 配置
  ansible.builtin.template:
    src: nginx.conf.j2
    dest: /etc/nginx/nginx.conf
  notify: Restart nginx        # 内容变了才重启（见 handler）
```

`template` 与 `copy` 的区别：**`copy` 原样拷贝，`template` 先渲染 <code v-pre>{{ }}</code> / 控制流再拷贝**。约定模板文件名以 `.j2` 结尾。

### 常用 filter（管道 `|`）

filter 用管道 `|` 链式处理值，是 Jinja2 里最实用的一块：

```yaml
# 给可能不存在的变量兜底
port: "{{ custom_port | default(8080) }}"

# 变量必须存在，否则报错
token: "{{ api_token | mandatory }}"

# 序列化
config_json: "{{ my_dict | to_json }}"
config_yaml: "{{ my_dict | to_nice_yaml }}"

# 列表拼接
csv: "{{ ['a', 'b', 'c'] | join(',') }}"     # -> a,b,c

# 字典转列表（配合 loop）
loop: "{{ my_map | dict2items }}"
```

::: tip filter（`|`）与 test（`is`）之别
**filter 用管道 `|` 变换值**（<code v-pre>{{ x | upper }}</code>）；**test 用 `is` 判断真假**（`when: result is changed`、`when: path is exists`）。两者都来自 Jinja2，Ansible 又额外提供了一批（`ipaddr`、`to_uuid`、`combine`、`selectattr` 等）。
:::

::: warning VitePress 的 <code v-pre>{{ }}</code> 陷阱
本页大量 <code v-pre>{{ }}</code> 都写在**代码围栏**里（`yaml`/`jinja`/`bash`），围栏内完全安全。只有当你在**正文或行内 `code`** 里要展示 <code v-pre>{{ 变量 }}</code> 时，才必须用 `<code v-pre>...</code>` 包裹——否则 VitePress 会把它当 Vue 插值导致构建崩溃。这是写 Ansible 笔记最容易翻车的地方。
:::

变量、facts、模板三者打通后，你的 playbook 就能「按主机差异自适应、按环境生成不同配置」。下一页讲怎么把这些封装成可复用的 **role** 和可分发的 **collection**。
