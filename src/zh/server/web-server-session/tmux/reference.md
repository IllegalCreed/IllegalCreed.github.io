---
layout: doc
outline: [2, 3]
---

# 参考：tmux 快捷键速查、命令清单与易错点

> 基于 tmux 3.4 · 核于 2026-08

## 速查

- **tmux 定位**：终端复用器，让进程在 SSH 断开后继续运行，支持多会话/窗口/面板。
- **三层结构**：会话（session，独立存活）→ 窗口（window，标签页）→ 面板（pane，分屏）。
- **prefix 默认**：`Ctrl-b`（多数人改 `Ctrl-a`），所有快捷键先按 prefix 再按功能键。
- **会话核心**：`tmux new -s 名字`（新建）、`Ctrl-b d`（detach）、`tmux a -t 名字`（attach）。
- **配置**：`~/.tmux.conf`，`tmux source-file` 热重载。
- **vs screen**：tmux 是现代继任者，配置更活、状态栏更强、活跃维护。

## 一、会话（session）命令速查

| 命令/快捷键 | 作用 |
| --- | --- |
| `tmux new -s 名字` | 新建并进入会话 |
| `tmux new -s 名字 -d` | 后台新建不进入 |
| `tmux ls` | 列出所有会话 |
| `tmux a -t 名字` | 接入指定会话 |
| `tmux a` | 接入最近会话 |
| `tmux kill-session -t 名字` | 销毁指定会话 |
| `tmux kill-server` | 销毁所有会话（慎用） |
| `Ctrl-b d` | 分离当前会话（detach） |
| `Ctrl-b s` | 会话内列出并切换会话 |
| `Ctrl-b $` | 重命名当前会话 |

## 二、窗口（window）快捷键

| 快捷键 | 作用 |
| --- | --- |
| `Ctrl-b c` | 创建新窗口 |
| `Ctrl-b ,` | 重命名当前窗口 |
| `Ctrl-b n` | 下一个窗口 |
| `Ctrl-b p` | 上一个窗口 |
| `Ctrl-b 0-9` | 切到第 N 个窗口 |
| `Ctrl-b l` | 上一个活跃窗口 |
| `Ctrl-b w` | 列出所有窗口选择 |
| `Ctrl-b f` | 按内容查找窗口 |
| `Ctrl-b &` | 关闭当前窗口（确认） |

## 三、面板（pane）快捷键

| 快捷键 | 作用 |
| --- | --- |
| `Ctrl-b %` | 垂直分屏（左右） |
| `Ctrl-b "` | 水平分屏（上下） |
| `Ctrl-b 方向键` | 切到对应方向面板 |
| `Ctrl-b o` | 顺序切换面板 |
| `Ctrl-b q` | 显示面板编号 |
| `Ctrl-b z` | 当前面板全屏切换 |
| `Ctrl-b x` | 关闭当前面板（确认） |
| `Ctrl-b {` / `}` | 交换面板位置 |
| `Ctrl-b Space` | 切换预设布局 |
| `Ctrl-b :` `resize-pane -L 10` | 调整面板大小 |

## 四、copy mode 快捷键

| 快捷键 | 作用 |
| --- | --- |
| `Ctrl-b [` | 进入 copy mode |
| `方向键`/`hjkl` | 移动光标（vi 模式） |
| `Ctrl-u`/`Ctrl-d` | 半屏上/下翻 |
| `Space`/`v` | 开始选择 |
| `Enter` | 复制选中 |
| `Ctrl-b ]` | 粘贴 tmux 缓冲区 |
| `q` | 退出 copy mode |

## 五、常用 `.tmux.conf` 配置

```bash
# 改 prefix 为 Ctrl-a
unbind C-b
set -g prefix C-a
bind C-a send-prefix

# 基础优化
set -g mouse on                          # 开鼠标
set -g base-index 1                      # 窗口编号从 1 开始
set -g history-limit 10000               # 历史保留 1 万行
set -g escape-time 0                     # 去 Esc 延迟
set -g default-terminal "screen-256color"

# 热重载
bind r source-file ~/.tmux.conf

# vi 模式 copy + 同步系统剪贴板
set -g mode-keys vi
bind-key -T copy-mode-vi v send -X begin-selection
bind-key -T copy-mode-vi y send -X copy-pipe-and-cancel "pbcopy"

# 同步输入（批量运维）
# Ctrl-b : 后 setw synchronize-panes on/off
```

## 六、tmux vs screen 对比

| 维度 | tmux | screen |
| --- | --- | --- |
| 配置 | `.tmux.conf` 灵活 | `.screenrc` 选项少 |
| 状态栏 | 强（自定义） | 弱 |
| 分屏 | 原生面板，强大 | 有但不如 tmux |
| 维护 | 活跃 | 老旧 |
| 默认 prefix | Ctrl-b（多改 Ctrl-a） | Ctrl-a |

## 七、易错点清单

- **「SSH 断连 tmux 会话就被杀」**：错。detach 只是分离，进程继续跑。只有显式 kill-session 或服务器重启才会话灭。
- **「prefix 是同时按」**：错。prefix 是先按 Ctrl-b 松开，再按功能键，不是同时按。
- **「`Ctrl-b %` 和 `Ctrl-b "` 分不清」**：`%` 键有竖点，垂直分（左右两块）；`"` 横线，水平分（上下两块）。
- **「改完 .tmux.conf 要重启 tmux」**：错。`tmux source-file ~/.tmux.conf` 热重载，无需重启（重启会丢会话）。
- **「默认 prefix Ctrl-b 很顺手」**：多数人觉得难按，改 Ctrl-a（与 screen 一致，左下角好按）。
- **「tmux 复制能直接粘到其他应用」**：错。默认只复制到 tmux 缓冲区，需配 `copy-pipe "pbcopy"`（macOS）才同步系统剪贴板。
- **「服务器重启后 tmux 会话还在」**：错。默认重启会话全丢，需 tmux-resurrect + tmux-continuum 插件持久化。
- **「tmux 能完美恢复正在跑的进程」**：不完全。resurrect 恢复窗口/面板布局，进程本身只能按配置重启指定程序（如 vim/ssh）。
- **「screen 完全没人用了」**：夸大。精简/嵌入式系统、某些基础镜像仍只有 screen，核心用法与 tmux 几乎一样。
- **「synchronize-panes 总是安全的」**：危险。开同步后危险命令（如 rm -rf）会同时在所有面板执行，务必确认。

## 权威链接

- [tmux 官方 Wiki](https://github.com/tmux/tmux/wiki)
- [tmux man page](https://man7.org/linux/man-pages/man1/tmux.1.html)
- [tmux shortcuts cheat sheet](https://tmuxcheatsheet.com/)
- [Oh My Tmux! 配置模板](https://github.com/gpakosz/.tmux)
- [tmux-resurrect 插件](https://github.com/tmux-plugins/tmux-resurrect)
- [Tmux Plugin Manager (TPM)](https://github.com/tmux-plugins/tpm)
- [GNU Screen 文档](https://www.gnu.org/software/screen/manual/screen.html)
- 本站幻灯片：<a href="/SlideStack/tmux-slide/" target="_blank">tmux（终端复用）</a>
