---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Ansible（ansible-core 2.21 · 社区包 13.x）· 核于 2026-07。模块以 FQCN 计，权威索引见 [模块列表](https://docs.ansible.com/ansible/latest/collections/index_module.html)。

## CLI 命令速查

| 命令 | 作用 | 常用示例 |
| --- | --- | --- |
| `ansible` | 跑 ad-hoc 单命令 | `ansible all -m ping` |
| `ansible-playbook` | 运行 playbook | `ansible-playbook -i inv.ini site.yml` |
| `ansible-inventory` | 查看/校验 inventory | `ansible-inventory --list -i inv.ini` |
| `ansible-galaxy` | 装/建 role 与 collection | `ansible-galaxy collection install community.general` |
| `ansible-vault` | 加解密敏感数据 | `ansible-vault edit secrets.yml` |
| `ansible-config` | 查看/dump 配置 | `ansible-config dump --only-changed` |
| `ansible-doc` | 查模块文档 | `ansible-doc ansible.builtin.copy` |
| `ansible-pull` | pull 模式（节点自拉 git 本地跑） | `ansible-pull -U https://git/repo.git` |
| `ansible-navigator` | 在 EE 容器里跑 playbook（TUI/CLI） | `ansible-navigator run site.yml` |

## `ansible-playbook` 常用参数

| 参数 | 说明 |
| --- | --- |
| `-i <inventory>` | 指定清单文件/目录 |
| `-l` / `--limit <pattern>` | 只作用于匹配的主机子集 |
| `--check` | check mode（演练，不改动） |
| `--diff` | 显示（将）变更的内容 |
| `--tags` / `--skip-tags` | 只跑 / 跳过指定标签 |
| `-e` / `--extra-vars` | 注入变量（**优先级最高**），如 `-e "env=prod"` |
| `-f` / `--forks <n>` | 并发数（默认 5） |
| `--ask-vault-pass` / `--vault-password-file` | 提供 Vault 密码 |
| `-b` / `--become` | 提权（sudo） |
| `--list-tasks` / `--list-hosts` | 只列任务 / 主机，不执行 |
| `--syntax-check` | 只做语法检查 |
| `--start-at-task <name>` | 从指定 task 开始跑 |
| `-v` / `-vvv` | 提高日志详细度（最多 `-vvvv`） |

## 常用模块速查（FQCN）

| 模块 | 用途 | 幂等要点 |
| --- | --- | --- |
| `ansible.builtin.ping` | 探活（非 ICMP，是连通+Python 检查） | — |
| `ansible.builtin.command` | 跑命令（不经 shell） | **默认每次 changed**，用 `creates`/`changed_when` 收敛 |
| `ansible.builtin.shell` | 跑 shell（支持管道重定向） | 同上；优先用专用模块 |
| `ansible.builtin.copy` | 拷贝文件到目标机 | 内容一致则 `ok` |
| `ansible.builtin.template` | 渲染 Jinja2 `.j2` 再下发 | 渲染结果一致则 `ok` |
| `ansible.builtin.file` | 管文件/目录/软链、权限属主 | 声明 `state` 幂等 |
| `ansible.builtin.lineinfile` / `blockinfile` | 改文件某行/某块 | 幂等（按正则/标记匹配） |
| `ansible.builtin.service` / `systemd_service` | 起停服务、开机自启 | 声明 `state`/`enabled` |
| `ansible.builtin.dnf` / `apt` / `package` | 装包（`package` 跨发行版） | `state: present/latest/absent` |
| `ansible.builtin.user` / `group` | 管用户/组 | 声明 `state` |
| `ansible.builtin.get_url` / `unarchive` | 下载 / 解压 | `unarchive` 支持 `creates` |
| `ansible.builtin.setup` | 采集 facts | 只读 |
| `ansible.builtin.debug` | 打印变量/消息 | 只读 |
| `ansible.builtin.set_fact` | 运行期设变量 | — |
| `ansible.posix.firewalld` / `community.general.*` | 防火墙 / 各类扩展 | 需装对应 collection |

## Playbook 关键字速查

| 关键字 | 层级 | 说明 |
| --- | --- | --- |
| `hosts` | play | 作用主机/组/pattern |
| `become` / `become_user` | play/task | 提权及目标用户 |
| `gather_facts` | play | `true`/`false` 是否自动采 facts |
| `vars` / `vars_files` / `vars_prompt` | play | 定义变量 |
| `roles` | play | 引入 role（静态） |
| `pre_tasks` / `tasks` / `post_tasks` | play | 任务阶段（handler 在其后统一跑） |
| `handlers` | play | 声明 handler |
| `serial` / `strategy` / `max_fail_percentage` | play | 滚动批次 / 执行策略 / 熔断 |
| `when` | task/block | 条件（**裸表达式，无花括号**） |
| `loop` / `loop_control` / `until` | task | 循环 / 循环控制 / 重试 |
| `register` | task | 捕获输出为变量 |
| `notify` | task | 触发 handler |
| `changed_when` / `failed_when` | task | 自定义 changed/failed 判定 |
| `check_mode` / `no_log` | task | 强制演练/真跑 / 屏蔽敏感输出 |
| `ignore_errors` | task | 失败不中断 |
| `tags` | play/task | 打标签供 `--tags` 选择 |
| `delegate_to` / `run_once` | task | 委派到别的主机 / 只跑一次 |
| `block` / `rescue` / `always` | 块 | try/catch/finally |

## Inventory 与连接变量

| 项 | INI | YAML |
| --- | --- | --- |
| 组 | `[webservers]` | `webservers:` → `hosts:` |
| 组变量 | `[web:vars]` | `web:` → `vars:` |
| 嵌套组 | `[prod:children]` | `children:` |
| 主机范围 | `www[01:50].ex.com` | 同 |

| 连接变量 | 含义 |
| --- | --- |
| `ansible_host` | 真实 IP / 域名 |
| `ansible_user` | 登录用户 |
| `ansible_connection` | 连接类型（`ssh`/`winrm`/`local`/`docker`） |
| `ansible_port` | 端口（SSH 默认 22） |
| `ansible_ssh_private_key_file` | 私钥路径 |
| `ansible_python_interpreter` | 目标机 Python 路径 |
| `ansible_become` / `ansible_become_pass` | 提权及密码 |

## 变量优先级（低 → 高，记两头）

`role defaults`（最低）< inventory/playbook 的 group_vars < host_vars < facts/set_fact < play vars/vars_files < role vars < block vars < task vars < include_vars < registered/set_facts < role params < **extra vars `-e`（永远最高）**。

## facts 与模板速查

| 项 | 写法 |
| --- | --- |
| 访问 fact | <code v-pre>{{ ansible_facts['os_family'] }}</code> |
| 顶层别名 | `ansible_os_family`（`INJECT_FACTS_AS_VARS` 可关） |
| 自定义 local fact | 节点 `/etc/ansible/facts.d/*.fact` → <code v-pre>{{ ansible_local['x'] }}</code> |
| 循环取值 | <code v-pre>{{ item }}</code> / <code v-pre>{{ item.key }}</code> / <code v-pre>{{ item.value }}</code> |
| 兜底 filter | <code v-pre>{{ v \| default('x') }}</code> |
| 必填 filter | <code v-pre>{{ v \| mandatory }}</code> |
| 字典转列表 | <code v-pre>{{ m \| dict2items }}</code> |
| 状态 test | `when: r is changed` / `is failed` / `is succeeded` / `is skipped` |

## `ansible-vault` 子命令

| 子命令 | 作用 |
| --- | --- |
| `create <f>` | 新建加密文件 |
| `edit <f>` | 解密进编辑器、存回再加密 |
| `view <f>` | 只读查看 |
| `encrypt <f>` / `decrypt <f>` | 加密已有 / 永久解密 |
| `rekey <f>` | 更换密码 |
| `encrypt_string 'val' --name 'k'` | 加密单个变量值嵌入 YAML |

## 常见坑速查

| 坑 | 说明与对策 |
| --- | --- |
| **`command`/`shell` 永远 changed** | 它们不幂等；用 `creates`/`removes` 或 `changed_when: false` 收敛；能用专用模块就别用 shell |
| **`when` 里加了花括号** | `when` 是裸表达式，写 `when: x == 1`，**不要** <code v-pre>when: {{ x == 1 }}</code> |
| **值以 <code v-pre>{{ }}</code> 开头没加引号** | YAML 会当成字典报错；整串加引号 <code v-pre>"{{ x }}/y"</code> |
| **忘了 FQCN 撞名** | 2.10 后建议总写 `namespace.collection.module`，短名可能歧义 |
| **serial 缺失导致全站瞬断** | 发布服务务必配 `serial` 分批滚动 + `max_fail_percentage` 熔断 |
| **以为删 task 会回收资源** | Ansible 无 state，删任务不卸载；要移除得显式 `state: absent` |
| **facts 拖慢大批量** | 不用 facts 时 `gather_facts: false` |
| **明文密钥进 Git** | 用 Vault；`no_log: true` 防敏感 task 输出泄露 |
| **控制节点用 Windows** | 不支持；控制节点须类 Unix（Linux/macOS/WSL），Windows 只能当被管节点 |

## 版本与生态速记

| 项 | 事实（2026-07） |
| --- | --- |
| 出品方 | Red Hat（2015 年收购 Ansible） |
| ansible-core 在维护版本 | **2.21**（GA 2026-05）/ 2.20 / 2.19 |
| 社区发行包 | Ansible community package **13.x**（基于 ansible-core 2.20） |
| 发布节奏 | ansible-core 每半年大版本（5 月/11 月），小版本每 4 周 |
| 控制节点 Python | 3.12–3.14（2.21/2.20） |
| 被管节点 Python | 3.9–3.14（2.21） |
| collection 分拆 | 自 **2.10** 起 `ansible-core` 与内容 collection 分离 |
| 企业版 | Ansible Automation Platform（AAP）；controller（原 Tower）源自上游 **AWX** |

## 权威链接

- [Ansible 官方文档](https://docs.ansible.com/ansible/latest/) —— 一手来源总入口
- [Getting Started](https://docs.ansible.com/ansible/latest/getting_started/index.html) · [核心概念](https://docs.ansible.com/ansible/latest/getting_started/basic_concepts.html)
- [Playbook 指南](https://docs.ansible.com/ansible/latest/playbook_guide/index.html)（条件/循环/handler/变量/策略）
- [模块索引](https://docs.ansible.com/ansible/latest/collections/index_module.html) · [ansible.builtin 集合](https://docs.ansible.com/ansible/latest/collections/ansible/builtin/index.html)
- [变量优先级](https://docs.ansible.com/ansible/latest/playbook_guide/playbooks_variables.html) · [facts](https://docs.ansible.com/ansible/latest/playbook_guide/playbooks_vars_facts.html)
- [Vault](https://docs.ansible.com/ansible/latest/vault_guide/index.html) · [check mode](https://docs.ansible.com/ansible/latest/playbook_guide/playbooks_checkmode.html) · [执行策略/serial](https://docs.ansible.com/ansible/latest/playbook_guide/playbooks_strategies.html)
- [Ansible Galaxy](https://galaxy.ansible.com/) · [collection 使用](https://docs.ansible.com/ansible/latest/collections_guide/index.html)
- [版本与维护策略](https://docs.ansible.com/ansible/latest/reference_appendices/release_and_maintenance.html)
- [Red Hat AAP](https://www.redhat.com/en/technologies/management/ansible) · [AWX（GitHub）](https://github.com/ansible/awx)
