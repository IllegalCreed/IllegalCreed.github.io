---
layout: doc
outline: [2, 3]
---

# 参考：OpenSSL 命令速查与易错点

> 基于 OpenSSL · 核于 2026-08

## 速查

- **三件套**：`openssl req`（生成 CSR/自签）、`openssl x509`（查看证书）、`openssl rsa`（查看/处理 RSA 私钥）。
- **CSR 流程**：req 生成私钥 + CSR → 提交 CA → CA 签名 → 证书 → 配 Web 服务器。
- **SAN 必需**：现代浏览器只认 SAN，仅 CN 报错。`-addext "subjectAltName=DNS:..."`（1.1.1+）。
- **自签**：`req -x509 -newkey rsa:2048 -nodes -days 365`，内网/开发用。
- **格式**：PEM（文本，Nginx）、DER（二进制，Java）、PKCS#12（.pfx，Windows IIS）。
- **匹配验证**：私钥与证书的 modulus md5 相同即匹配。

## 一、openssl req 速查

| 命令 | 作用 |
| --- | --- |
| `req -new -newkey rsa:2048 -nodes -keyout k -out csr -subj "/CN=x"` | 生成私钥 + CSR |
| `req -new -key k -out csr -subj "/CN=x"` | 已有私钥生成 CSR |
| `req -x509 -newkey rsa:2048 -nodes -keyout k -out crt -days 365 -subj "/CN=x"` | 生成自签证书 |
| `req -in csr -text -noout` | 查看 CSR 内容 |
| `req -addext "subjectAltName=DNS:x,DNS:y"` | 添加 SAN（1.1.1+） |

**`-subj` 字段**：`/C` 国家 / `ST` 省 / `L` 城市 / `O` 组织 / `OU` 部门 / `CN` 主域名。

## 二、openssl x509 速查

| 命令 | 作用 |
| --- | --- |
| `x509 -in crt -text -noout` | 看证书全部字段 |
| `x509 -in crt -dates -noout` | 看有效期（notBefore/notAfter） |
| `x509 -in crt -issuer -noout` | 看颁发者（哪个 CA） |
| `x509 -in crt -subject -noout` | 看主体（属于谁） |
| `x509 -in crt -modulus -noout` | 看模数（与私钥比对） |
| `x509 -in crt -ext subjectAltName -noout` | 看 SAN 域名列表 |
| `x509 -in crt -fingerprint -noout` | 看指纹 |
| `verify -CAfile ca.crt domain.crt` | 验证证书链 |

## 三、openssl rsa 速查

| 命令 | 作用 |
| --- | --- |
| `rsa -in key -check -noout` | 验证私钥完整性 |
| `rsa -in key -text -noout` | 看私钥详情（模数/指数/大小） |
| `rsa -in key -pubout -out pub` | 导出公钥 |
| `rsa -in key -modulus -noout` | 看模数（与证书比对） |
| `rsa -des3 -in plain.key -out enc.key` | 给私钥加密码 |
| `rsa -in enc.key -out plain.key` | 去掉私钥密码 |

## 四、格式转换速查

| 转换 | 命令 |
| --- | --- |
| PEM → DER（证书） | `x509 -in c -outform der -out c.der` |
| DER → PEM（证书） | `x509 -in c.der -inform der -outform pem -out c` |
| PEM → DER（私钥） | `rsa -in k -outform der -out k.der` |
| 打包 PKCS#12 | `pkcs12 -export -in crt -inkey key -out b.p12` |
| 解出私钥 | `pkcs12 -in b.p12 -nocerts -out key.pem` |
| 解出证书 | `pkcs12 -in b.p12 -clcerts -nokeys -out crt` |

## 五、证书关键字段速查

| 字段 | 含义 | 排障看点 |
| --- | --- | --- |
| Issuer | 颁发者（CA） | 是受信任 CA 吗 |
| Validity | notBefore/notAfter | 是否过期 |
| Subject | 主体（域名/组织） | 域名对吗 |
| Subject Alternative Name | SAN 域名列表 | 现代浏览器看这里 |
| Public Key Algorithm | 公钥算法 | rsaEncryption + 2048bit |
| Signature Algorithm | 签名算法 | sha256WithRSA（非 sha1） |

## 六、文件扩展名约定

| 扩展名 | 内容 | 说明 |
| --- | --- | --- |
| `.key` | 私钥（PEM） | 机密，600 |
| `.pub` | 公钥（PEM） | 可公开 |
| `.csr` | 证书签名请求 | 提交给 CA |
| `.crt` / `.cer` | 证书（PEM 或 DER） | .cer 常见于 Windows |
| `.pem` | PEM 编码文件 | 通用文本格式 |
| `.der` | DER 编码文件 | 二进制 |
| `.p12` / `.pfx` | PKCS#12 打包 | 含证书+私钥，Windows IIS |
| `.chain` / `ca-bundle` | 中间证书链 | 与证书合并给 Nginx |

## 七、易错点清单

- **「CN 配对了浏览器就不报错」**：错。现代浏览器**只认 SAN**，证书无 SAN 扩展会报 `ERR_CERT_COMMON_NAME_INVALID`，即使 CN 正确。
- **「PEM 和 DER 是不同算法」**：错。它们是编码格式（Base64 文本 vs 二进制），不是算法。同一密钥可存成任一格式。
- **「openssl rsa 能处理所有私钥」**：错。`openssl rsa` 只处理 RSA；ECDSA 私钥用 `openssl ec`，混用报错。
- **「私钥一定要加密码」**：错。Web 服务器要自动重启，加密私钥每次重启要人工输密码，不现实。生产用 -nodes 不加密，靠权限保护。
- **「自签证书能用于公网」**：错。浏览器不信任自签证书（颁发者不在受信 CA 列表），公网必须用受信任 CA（如 Let's Encrypt）签发。
- **「私钥和证书随便配」**：错。私钥与证书模数必须匹配，不匹配 Nginx 报 key values mismatch。
- **「-nodes 没用，可省略」**：错。-nodes 让私钥不加密，Web 服务器自动重启必备；省略会要求输 passphrase。
- **「SHA-1 签名的证书还能用」**：错。SHA-1 已被浏览器视为不安全并拒绝，新证书必须用 SHA-256（sha256WithRSAEncryption）。
- **「证书链只有自己的证书就行」**：错。Nginx 需把「你的证书 + 中间证书」合并（fullchain），否则部分客户端报证书链不完整。

## 八、进阶方向（链接其他叶）

- [OpenSSH](../openssh/) —— SSH 密钥与 OpenSSL 密钥的区别（不同协议，不同密钥）
- [网络工具](../network-tools/) —— curl `-k` 跳过证书校验、`-v` 看 TLS 握手
- [Nginx](../../web-server-session/nginx/) —— HTTPS 配置消费 OpenSSL 生成的证书与私钥

## 权威链接

- [OpenSSL - Wikipedia](https://en.wikipedia.org/wiki/OpenSSL)
- [openssl req man page](https://www.openssl.org/docs/manmaster/man1/openssl-req.html)
- [openssl x509 man page](https://www.openssl.org/docs/manmaster/man1/openssl-x509.html)
- [Certificate Signing Request - Wikipedia](https://en.wikipedia.org/wiki/Certificate_signing_request)
- [Subject Alternative Name - Wikipedia](https://en.wikipedia.org/wiki/Subject_Alternative_Name)
- 本站幻灯片：<a href="/SlideStack/openssl-slide/" target="_blank">OpenSSL</a>
