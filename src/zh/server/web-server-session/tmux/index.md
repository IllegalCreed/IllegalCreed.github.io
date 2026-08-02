---
layout: doc
---

# tmux（终端复用）

**tmux**（terminal multiplexer）是 Linux/macOS 服务器运维的**生存工具**——它让你在一个终端里管理多个会话、窗口、面板，更关键的是**让进程在 SSH 断开后继续运行**。没装 tmux 的惨痛场景：SSH 连服务器跑一个耗时训练任务，网络一抖断连，任务被 SIGHUP 杀死，几小时进度归零。tmux 解决这个根本痛点：进程跑在 tmux 会话里，SSH 断开会话只是「分离」（detach），进程继续在后台跑，重连后 `tmux attach` 回去，一切如旧。它是远程服务器长任务、多窗口运维、结对编程的事实标准。

tmux 的全部考点围绕**三层结构**展开：①**会话（session）**——最外层容器，一个会话独立于 SSH 连接存在（断连不灭）；②**窗口（window）**——会话内的「标签页」，一个会话可开多个窗口（如一个跑日志、一个跑构建）；③**面板（pane）**——窗口内的分屏，一个窗口可切分成多个面板（一边看代码一边跑命令）。掌握这三层 + 前缀键（prefix）驱动的快捷键 + `.tmux.conf` 自定义配置，就能把远程服务器变成高效工作台。本叶与 [Nginx](../nginx/)、[Caddy](../caddy/) 叶同属 Web 服务器与会话——讲的是「服务器端的终端会话管理」。

## 评价

**优点**

- **SSH 断开进程不死**：会话 detach 后进程继续运行，重连 attach 回去，告别断连杀任务
- **多任务并行**：一个会话开多个窗口/面板，日志/构建/调试同时进行
- **会话持久化**：服务器重启前 detach，重启后 attach 恢复（配合 tmux-resurrect）
- **结对编程**：多人 attach 同一会话，实时共享终端
- **跨终端复用**：一个终端连服务器后开多面板，省去开多个 SSH 窗口

**缺点**

- **学习曲线**：前缀键 + 快捷键体系需记忆，初学者易懵
- **默认配置反人类**：默认 prefix 是 Ctrl-b（难按）、不支持鼠标、配色土，必须改 .tmux.conf
- **复制粘贴绕路**：与系统剪贴板集成需额外配置（macOS 要装 reattach-to-user-namespace）
- **重启会话丢失**：服务器重启后 tmux 会话默认消失（需 tmux-resurrect 插件持久化）

## 本叶地图

- [入门](./getting-started) —— tmux 定位、SSH 断连痛点、会话/窗口/面板三层结构、前缀键与核心快捷键
- [会话、窗口与面板](./guide-line/sessions-and-panes) —— 三层结构的命令与操作、常用快捷键速查、copy mode 复制
- [配置与工作流](./guide-line/config-and-workflow) —— `.tmux.conf` 自定义（改 prefix、开鼠标、配色）、持久化方案、tmux vs screen
- [参考](./reference) —— 快捷键速查表、常用命令、`.tmux.conf` 配置示例、易错点清单

## 幻灯片地址

<a href="/SlideStack/tmux-slide/" target="_blank">tmux（终端复用）</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=tmux" target="_blank" rel="noopener noreferrer">tmux（终端复用）测试题</a>
