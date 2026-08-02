---
layout: doc
outline: [2, 3]
---

# 参考：OpenSSH 命令速查与易错点

> 基于 OpenSSH · 核于 2026-08

## 速查

- **ed25519 首选**：`ssh-keygen -t ed25519 -C "comment"`。RSA 仅老系统用 `-t rsa -b 4096`。
- **免密三步**：①生成密钥 ②`ssh-copy-id` 部署公钥 ③确保权限（.ssh 700、authorized_keys 600）。
- **agent 三步**：①`eval "$(ssh-agent -s)"` ②`ssh-add` 加载 ③之后免输 passphrase。
- **config 浓缩**：`Host` 别名 + `HostName`/`User`/`Port`/`IdentityFile`，`ssh 别名` 即用。
- **隧道三件**：`-L` 本地转发、`-R` 反向转发、`-D` 动态代理。
- **权限命门**：过松则 sshd 静默拒绝密钥认证，回退到密码。

## 一、ssh 常用选项速查

| 选项 | 作用 |
| --- | --- |
| `-i file` | 指定私钥文件 |
| `-p port` | 指定端口（小写 p） |
| `-J host` | ProxyJump 跳板机 |
| `-L lport:host:hport` | 本地端口转发 |
| `-R rport:host:hport` | 反向端口转发 |
| `-D port` | 动态 SOCKS 代理 |
| `-N` | 不执行远程命令（纯转发） |
| `-f` | 后台运行 |
| `-A` | 转发 agent（**慎用**，不可信机器禁开） |
| `-v` / `-vv` / `-vvv` | 详细日志（排障用，-vvv 最详细） |
| `-o Option=value` | 临时设置选项（如 `-o ServerAliveInterval=60`） |

## 二、ssh-keygen 常用选项

| 选项 | 作用 |
| --- | --- |
| `-t type` | 算法（ed25519/rsa/ecsa） |
| `-b bits` | 密钥长度（RSA 用 4096） |
| `-C comment` | 注释（通常写邮箱） |
| `-f file` | 输出文件名 |
| `-p` | 修改已有私钥的 passphrase |
| `-y` | 从私钥导出公钥 |
| `-l -f file` | 显示公钥指纹 |
| `-R host` | 从 known_hosts 删除某 host 的记录 |

## 三、ssh-add 常用命令

| 命令 | 作用 |
| --- | --- |
| `ssh-add file` | 加载私钥（问 passphrase） |
| `ssh-add -l` | 列出已加载密钥指纹 |
| `ssh-add -L` | 列出已加载密钥完整公钥 |
| `ssh-add -D` | 清空所有密钥 |
| `ssh-add -d file` | 删除指定密钥 |
| `ssh-add -t secs file` | 加载并设过期时间 |
| `ssh-add --apple-use-keychain file` | macOS 存入钥匙串 |

## 四、~/.ssh/config 指令表

| 指令 | 作用 | 示例 |
| --- | --- | --- |
| `Host` | 别名（支持 `*`/`?`） | `Host prod` |
| `HostName` | 真实地址 | `HostName 10.0.0.5` |
| `User` | 登录用户 | `User deploy` |
| `Port` | 端口 | `Port 2222` |
| `IdentityFile` | 私钥 | `IdentityFile ~/.ssh/work_key` |
| `ProxyJump` | 跳板机 | `ProxyJump bastion` |
| `LocalForward` | 本地转发 | `LocalForward 5432 db:5432` |
| `RemoteForward` | 反向转发 | `RemoteForward 8080 localhost:80` |
| `DynamicForward` | 动态代理 | `DynamicForward 1080` |
| `ForwardAgent` | 转发 agent（慎用） | `ForwardAgent no` |
| `ServerAliveInterval` | 保活间隔 | `ServerAliveInterval 60` |
| `AddKeysToAgent` | 自动加入 agent | `AddKeysToAgent yes` |
| `UseKeychain` | macOS 钥匙串 | `UseKeychain yes` |
| `GatewayPorts` | 允许转发绑外部 | `GatewayPorts yes` |

## 五、权限要求清单

| 路径 | 权限 | 说明 |
| --- | --- | --- |
| `~/.ssh/` | 700 | 仅属主读写执行 |
| `~/.ssh/id_ed25519` | 600 | 私钥，仅属主读写 |
| `~/.ssh/authorized_keys` | 600 | 公钥列表，仅属主读写 |
| `~/.ssh/config` | 600 | 配置文件，仅属主读写 |
| `~/.ssh/known_hosts` | 644 | 已知主机，可读 |

- **修正命令**：`chmod 700 ~/.ssh && chmod 600 ~/.ssh/id_ed25519 ~/.ssh/authorized_keys ~/.ssh/config`。

## 六、端口转发速查

| 类型 | 命令 | 监听端口 | 典型场景 |
| --- | --- | --- | --- |
| 本地 `-L` | `ssh -L 5432:db:5432 user@bastion` | 本地 5432 | 本地访问内网数据库 |
| 反向 `-R` | `ssh -R 9090:localhost:8080 user@gw` | 远程 9090 | 内网穿透/暴露本地服务 |
| 动态 `-D` | `ssh -D 1080 user@gw` | 本地 1080（SOCKS） | 通用代理 |

## 七、易错点清单

- **「密钥配好了还要输密码」**：九成是 `~/.ssh` 或 `authorized_keys` 权限过松，sshd 静默拒绝。用 `chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys` 修正，排障加 `ssh -v` 看详细日志。
- **「RSA 比较新所以首选」**：错。ed25519（2014 起 OpenSSH 推荐）更短更快更安全，新项目首选 ed25519；RSA 仅老系统兼容用。
- **「私钥可以提交到 Git」**：错。私钥是机密，提交 Git 即永久泄露（即使后续删除，历史记录仍存），必须加入 .gitignore。
- **「passphrase 没用，反正麻烦」**：错。passphrase 是私钥泄露后的最后一道防线；配合 ssh-agent 只需输一次，不麻烦。
- **「scp -p 是端口」**：错。scp 端口是 `-P`（大写），`-p` 是保留时间戳；ssh 的端口才是 `-p`（小写），两者相反。
- **「-A（ForwardAgent）随时开」**：错。在不可信机器上开 `-A`，恶意 root 可借用你的 agent 盗用身份。只在可信机器开。
- **「-L 的目标主机由本地解析」**：错。`-L 本地端口:目标:目标端口` 的目标主机由 **ssh 服务器（远端）**解析，这让本地能访问远端私网地址。
- **「-R 默认能让远程公网访问」**：错。`-R` 默认只绑远程 127.0.0.1，要让远程公网访问需 sshd 设 `GatewayPorts yes` 且命令写 `0.0.0.0:端口:...`。
- **「ProxyJump 和 ProxyCommand 一样旧」**：ProxyJump（7.3+）是 ProxyCommand 的简洁替代，优先用 `ProxyJump`。

## 八、进阶方向（链接其他叶）

- [网络工具](../network-tools/) —— scp/rsync 走的就是 SSH 通道
- [OpenSSL](../openssl/) —— SSH 加密底层依赖的密码学与证书体系
- [Nginx](../../web-server-session/nginx/) —— 配合 `-L` 隧道访问内网 Web 服务

## 权威链接

- [OpenSSH - Wikipedia](https://en.wikipedia.org/wiki/OpenSSH)
- [ssh-keygen man page](https://man.openbsd.org/ssh-keygen)
- [ssh_config man page](https://man.openbsd.org/ssh_config)
- [SSH Jump Proxy - SSH](https://en.wikibooks.org/wiki/OpenSSH/Cookbook/Proxies_and_Jump_Hosts)
- 本站幻灯片：<a href="/SlideStack/openssh-slide/" target="_blank">OpenSSH</a>
