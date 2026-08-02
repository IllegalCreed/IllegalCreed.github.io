---
layout: doc
outline: [2, 3]
---

# 配置与工作流：.tmux.conf 自定义、持久化与 screen 对比

> 基于 tmux 3.4 · 核于 2026-08

## 速查

- **配置文件**：`~/.tmux.conf`，tmux 启动时读取。改完后 `tmux source ~/.tmux.conf`（或在会话内 `Ctrl-b :` 后 `source-file ~/.tmux.conf`）热重载，无需重启 tmux。
- **改 prefix**：`set -g prefix C-a` + `unbind C-b` + `bind C-a send-prefix`，把默认难按的 Ctrl-b 改成 Ctrl-a（与 screen 习惯一致，更顺手）。
- **开鼠标**：`set -g mouse on`，支持滚轮翻页、点击切面板、拖动边界调整大小——大幅降低上手门槛（tmux 2.1+）。
- **配色与终端**：`set -g default-terminal "screen-256color"`，开启 256 色支持，否则配色土。`tmux -2` 强制 256 色。
- **vi 模式**：`set -g mode-keys vi` + `bind-key -T copy-mode-vi v send -X begin-selection`，copy mode 用 vi 按键，复制更直觉。
- **复制到系统剪贴板**：macOS 配 `bind-key -T copy-mode-vi y send -X copy-pipe-and-cancel "pbcopy"`，复制即同步系统剪贴板（旧 macOS 需 reattach-to-user-namespace）。
- **状态栏美化**：`set -g status-style`、`set -g status-left`/`status-right`、`set -g window-status-format` 自定义底部状态栏，显示会话名/窗口列表/时间。
- **会话持久化**：服务器重启后 tmux 会话默认消失，用 `tmux-resurrect` 插件保存/恢复会话（窗口/面板布局），`tmux-continuum` 自动定时保存。
- **tmux vs screen**：tmux 是 screen 的现代继任者——配置更活（声明式 .tmux.conf）、状态栏更强、活跃维护、客户端模型清晰；screen 老旧但仍存于某些精简系统，核心概念（detach/attach）相同。
- **插件管理**：用 TPM（Tmux Plugin Manager）管理插件，`.tmux.conf` 里 `set -g @plugin '插件'` 声明，`prefix + I` 安装。

## 一、`.tmux.conf` 基础配置

默认 tmux 配置反人类（Ctrl-b 难按、无鼠标、配色土）。一份好用的基础配置：

```bash
# ~/.tmux.conf

# === 1. 改 prefix：Ctrl-b → Ctrl-a（更顺手） ===
unbind C-b
set -g prefix C-a
bind C-a send-prefix            # 按 Ctrl-a 两次发真正的 Ctrl-a（emacs/终端用）

# === 2. 开鼠标 ===
set -g mouse on                 # 滚轮翻页、点击切面板、拖边界调大小

# === 3. 配色与终端 ===
set -g default-terminal "screen-256color"
set -ga terminal-overrides ",xterm-256color:Tc"   # 启用 true color

# === 4. 基础设置 ===
set -g base-index 1             # 窗口编号从 1 开始（0 在键盘太远）
setw -g pane-base-index 1       # 面板编号也从 1 开始
set -g renumber-windows on      # 关窗口后自动重排编号
set -g history-limit 10000      # 历史输出保留 1 万行（默认 2000 太少）
set -g escape-time 0            # 去 Esc 延迟（vim 用户必配）

# === 5. 重新加载配置的快捷键 ===
bind r source-file ~/.tmux.conf \; display "Reloaded ~/.tmux.conf"

# === 6. 分屏用更直觉的键 ===
bind | split-window -h          # | 垂直分（左右）
bind - split-window -v          # - 水平分（上下）

# === 7. vi 模式 copy mode ===
set -g mode-keys vi
bind-key -T copy-mode-vi v send -X begin-selection
bind-key -T copy-mode-vi y send -X copy-pipe-and-cancel "pbcopy"
```

- **改完热重载**：会话内 `Ctrl-b r`（上面的绑定）或 `Ctrl-b :` 后 `source-file ~/.tmux.conf`，立即生效无需重启。
- **`base-index 1`**：窗口编号默认从 0 开始，但键盘上 1 比 0 近，`Ctrl-b 1` 比 `Ctrl-b 0` 好按。
- **`escape-time 0`**：tmux 默认对 Esc 键有 500ms 延迟（判断是否为组合键），vim 用户会感到明显卡顿，设 0 消除。
- **`history-limit 10000`**：copy mode 能翻的历史行数，默认 2000 不够看长日志。

## 二、复制到系统剪贴板

tmux 默认复制到自己的缓冲区，不进系统剪贴板，粘贴到其他应用就断片。配置让它同步系统剪贴板：

```bash
# macOS（用 pbcopy）
bind-key -T copy-mode-vi y send -X copy-pipe-and-cancel "pbcopy"
# 鼠标拖选也同步
bind-key -T copy-mode-vi MouseDragEnd1Pane send -X copy-pipe-and-cancel "pbcopy"

# Linux（用 xclip）
bind-key -T copy-mode-vi y send -X copy-pipe-and-cancel "xclip -selection clipboard"
```

- **macOS 旧版 tmux（2.6 以下）**：因 macOS 的 namespace 限制，需装 `reattach-to-user-namespace` 并 `set -g default-command "reattach-to-user-namespace -l $SHELL"`。新版（2.6+）已修复。
- **效果**：copy mode 里选中按 y，直接进系统剪贴板，Cmd-V 就能粘到其他应用。

## 三、状态栏美化

默认状态栏（绿底白字）土且信息少。自定义让状态栏显示会话名、窗口列表、时间：

```bash
# 状态栏样式
set -g status-position top               # 状态栏放顶部（默认底部）
set -g status-style "bg=default, fg=white"
set -g status-interval 5                 # 每 5 秒刷新

# 左侧：会话名
set -g status-left "#[fg=green,bold][#S] "
set -g status-left-length 40

# 右侧：主机名 + 时间
set -g status-right "#[fg=cyan]#H | %Y-%m-%d %H:%M "

# 窗口列表样式
setw -g window-status-format         " #I:#W "
setw -g window-status-current-format "#[fg=black,bg=yellow,bold] #I:#W "
# #I = 窗口编号，#W = 窗口名，#S = 会话名，#H = 主机名
```

- **`status-left`/`status-right`**：左右两侧自定义内容，用 `#[...]` 加颜色。
- **格式变量**：`#S`（会话名）、`#W`（窗口名）、`#I`（窗口编号）、`#H`（主机名）、`%H:%M`（时间）。
- **`window-status-current-format`**：当前窗口高亮（黄底黑字），一眼看到在哪。

## 四、会话持久化：tmux-resurrect 与 tmux-continuum

tmux 默认服务器重启后会话全丢（窗口/面板布局没了）。两个插件解决：

```bash
# 用 TPM 管理插件
set -g @plugin 'tmux-plugins/tpm'
set -g @plugin 'tmux-plugins/tmux-resurrect'
set -g @plugin 'tmux-plugins/tmux-continuum'

# tmux-resurrect：手动保存/恢复
# prefix + Ctrl-s 保存会话
# prefix + Ctrl-r 恢复会话

# tmux-continuum：自动定时保存
set -g @continuum-restore 'on'        # tmux 启动时自动恢复
set -g @continuum-save-interval '15'  # 每 15 分钟自动保存
```

- **tmux-resurrect**：保存窗口/面板布局（不含进程，但可配置恢复时重启某些程序）。`prefix Ctrl-s` 存、`prefix Ctrl-r` 恢复。
- **tmux-continuum**：基于 resurrect，每 15 分钟自动保存，tmux 启动时自动恢复——服务器重启后会话几乎无损恢复。
- **限制**：进程本身（如正在跑的命令）不能完美恢复，只能恢复「窗口/面板结构」+ 可选地重启指定程序（如 vim、ssh）。

## 五、tmux vs screen：现代继任者

tmux 和 screen 都是终端复用器，核心概念（会话 detach/attach）相同，但 tmux 是现代继任者：

| 维度 | tmux | screen |
| --- | --- | --- |
| **配置** | 声明式 `.tmux.conf`，灵活 | `.screenrc`，选项较少 |
| **状态栏** | 强（自定义左右、窗口列表） | 弱（基本显示） |
| **分屏** | 原生面板（pane），强大 | 有但不如 tmux 灵活 |
| **客户端模型** | 一个 server 多 client，清晰 | 较模糊 |
| **脚本/API** | 支持 `tmux` 命令脚本化，可编程 | 弱 |
| **维护状态** | 活跃维护 | 维护放缓，老旧 |
| **默认 prefix** | Ctrl-b（多数人改 Ctrl-a） | Ctrl-a |

- **何时还会遇到 screen**：某些精简/老旧系统（嵌入式、某些发行版 minimal 安装）预装 screen 而非 tmux；容器的基础镜像可能只有 screen。
- **screen 的存活意义**：极少数场景 tmux 不可用时 screen 顶上，核心用法（`screen -S 名字` 新建、`Ctrl-a d` detach、`screen -r 名字` 恢复）几乎一样。
- **迁移**：screen 用户转 tmux 几乎无障碍，把 tmux prefix 改成 Ctrl-a（与 screen 一致）体验最接近。

## 六、TPM 插件管理

TPM（Tmux Plugin Manager）让你像管理 npm 包一样管理 tmux 插件：

```bash
# 1. 安装 TPM
git clone https://github.com/tmux-plugins/tpm ~/.tmux/plugins/tpm

# 2. .tmux.conf 里声明插件
set -g @plugin 'tmux-plugins/tpm'              # 插件管理器本身
set -g @plugin 'tmux-plugins/tmux-sensible'    # 合理的默认配置集
set -g @plugin 'tmux-plugins/tmux-resurrect'   # 会话持久化

# 3. .tmux.conf 末尾必须加（初始化 TPM）
run '~/.tmux/plugins/tpm/tpm'

# 4. 操作
# prefix + I     安装所有声明的插件
# prefix + U     更新插件
# prefix + alt + u  卸载（从 .tmux.conf 删除声明后）
```

- **`tmux-sensible`**：社区维护的合理默认配置（改 base-index、escape-time 等），省去手写一堆基础项。
- **常用插件**：`tmux-resurrect`（持久化）、`tmux-continuum`（自动保存）、`tmux-yank`（增强复制）、`tmux-pain-control`（面板操作快捷键集）。

## 下一步

配置与工作流讲完后，tmux 的核心已覆盖。回到 [参考](../reference) 复习快捷键速查表，或前往 [UFW（主机防火墙）](../../ufw/) 叶学习服务器防火墙配置。
