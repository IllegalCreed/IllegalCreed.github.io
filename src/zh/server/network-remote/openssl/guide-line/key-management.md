---
layout: doc
outline: [2, 3]
---

# 密钥管理：rsa、格式转换与匹配验证

> 基于 OpenSSL · 核于 2026-08

## 速查

- **openssl rsa**：`-check` 验证私钥完整性、`-text` 看模数/指数、`-pubout` 导出公钥、`-modulus` 看模数（验匹配）。
- **密钥与证书匹配**：比对两者的模数 md5，相同即匹配。`openssl rsa -in key -modulus | openssl md5` vs `openssl x509 -in crt -modulus | openssl md5`。
- **三种格式**：PEM（Base64 文本，最常用，`-----BEGIN`）、DER（二进制，Java/Windows 偏好）、PKCS#12（.p12/.pfx，含证书+私钥，Windows IIS）。
- **PEM ↔ DER 转换**：`openssl x509 -in crt -outform der -out cert.der`；反向 `-inform der -outform pem`。
- **PKCS#12 打包/解包**：`openssl pkcs12 -export -in crt -inkey key -out bundle.p12`；`openssl pkcs12 -in bundle.p12 -nocerts -out key.pem`。
- **私钥加解密**：`openssl rsa -des3 -in plain.key -out encrypted.key` 加密；`-in encrypted.key -out plain.key` 解密。
- **ECDSA 私钥**：用 `openssl ec` 而非 `openssl rsa`（rsa 命令只处理 RSA 密钥）。

## 一、openssl rsa 详解

`openssl rsa` 专门处理 RSA 私钥（ECDSA 密钥用 `openssl ec`）。

### 1.1 检查与查看私钥

```bash
# 验证私钥是否有效（输出 "RSA key ok" 表示无误）
openssl rsa -in domain.key -check -noout

# 看私钥详细信息（大小/模数/公钥指数/私钥指数）
openssl rsa -in domain.key -text -noout

# 从私钥导出对应的公钥
openssl rsa -in domain.key -pubout -out domain.pub

# 只输出模数（用于与证书比对验证匹配）
openssl rsa -in domain.key -modulus -noout
```

- **`-check`**：验证私钥的数学一致性（如检查 p*q == modulus、d*e ≡ 1 mod φ(n)），输出 `RSA key ok` 或报错。私钥文件损坏或被截断时能发现。
- **`-pubout`**：从私钥提取公钥部分，单独存为公钥文件。公钥可公开，用于分发给需要验证签名的对方。
- **`-modulus`**：输出私钥的模数（16 进制）。RSA 私钥和它对应证书的**模数必然相同**，这是验证「私钥与证书是否匹配」的标准方法。

### 1.2 私钥加解密

```bash
# 给未加密的私钥加密码（用 DES3，会提示输 passphrase）
openssl rsa -des3 -in plain.key -out encrypted.key

# 给未加密私钥加密码（用 AES-256，更现代）
openssl rsa -aes256 -in plain.key -out encrypted.key

# 去掉私钥的密码（解密，会提示输原 passphrase）
openssl rsa -in encrypted.key -out plain.key
```

- **何时加密**：私钥要在机器间传输或存储在不够安全的位置时，加 passphrase 加密更安全。
- **何时不加密（-nodes）**：Web 服务器要自动重启读私钥，加密会导致每次重启都要人工输密码，不现实。生产 Web 服务器的私钥通常不加密，靠文件权限（600）和服务器访问控制保障安全。

## 二、密钥与证书匹配验证

部署 HTTPS 时，常见错误是私钥与证书不匹配（如用了旧私钥配新证书，或证书换域名后忘了换私钥）。验证方法：比对两者的**模数（modulus）**，RSA 私钥和对应证书的模数必然相同：

```bash
# 取私钥模数的 md5
openssl rsa -in domain.key -modulus -noout | openssl md5
# 输出: (stdin)= d4abcdef...

# 取证书模数的 md5
openssl x509 -in domain.crt -modulus -noout | openssl md5
# 输出: (stdin)= d4abcdef...

# 两个 md5 相同 → 私钥与证书匹配
# 不同 → 不匹配，需找到正确的私钥或重新生成
```

- **原理**：证书里包含公钥（从私钥推导），RSA 公钥的核心是模数 n（n = p*q）。私钥也含相同的 n。所以同一对密钥的私钥和证书，模数 n 完全一致。比对模数的 md5 即可判断是否匹配。
- **Nginx 报错**：如果配置了不匹配的私钥与证书，Nginx 启动时报 `SSL_CTX_use_PrivateKey_file() failed`（key values mismatch），用上面的方法定位正确的私钥。

## 三、证书/密钥格式与转换

OpenSSL 涉及三种主流格式，转换是常见需求。

### 3.1 三种格式

| 格式 | 编码 | 内容 | 特征 | 用途 |
| --- | --- | --- | --- | --- |
| **PEM** | Base64 文本 | 单个证书/私钥 | `-----BEGIN CERTIFICATE-----` | Linux/Nginx/Apache，最常用 |
| **DER** | 二进制 | 单个证书/私钥 | 无文本头，二进制 | Java/Windows 原生偏好 |
| **PKCS#12（.p12/.pfx）** | 二进制 | 证书 + 私钥 + CA 链（打包） | 二进制 | Windows IIS、跨平台迁移 |

- **PEM** 是 Linux 世界的默认格式，Nginx/Apache 直接消费 `-----BEGIN CERTIFICATE-----` 文本文件。
- **DER** 是二进制编码的证书，Java 的 keytool、部分 Windows 工具偏好 DER。
- **PKCS#12**（PFX）把「证书 + 私钥 + 可选 CA 链」打包成一个加密文件，用 passphrase 保护，适合在 Windows IIS 或不同服务器间整体迁移 HTTPS 配置。

### 3.2 PEM ↔ DER 转换

```bash
# 证书 PEM → DER
openssl x509 -in domain.crt -outform der -out domain.der

# 证书 DER → PEM
openssl x509 -in domain.der -inform der -outform pem -out domain.crt

# 私钥 PEM → DER
openssl rsa -in domain.key -outform der -out domain.der

# 私钥 DER → PEM
openssl rsa -in domain.der -inform der -outform pem -out domain.key
```

- **`-outform der/pem`**：输出格式。
- **`-inform der/pem`**：输入格式（读 DER 时必须指定，OpenSSL 默认按 PEM 读）。

### 3.3 PKCS#12 打包与解包

```bash
# 把证书 + 私钥打包成 PKCS#12（会提示设一个导出密码）
openssl pkcs12 -export \
  -in domain.crt -inkey domain.key \
  -certfile chain.crt \
  -out bundle.p12 -name "example.com"

# 从 PKCS#12 解出私钥（会提示输导出密码）
openssl pkcs12 -in bundle.p12 -nocerts -out domain.key

# 从 PKCS#12 解出证书
openssl pkcs12 -in bundle.p12 -clcerts -nokeys -out domain.crt

# 解出所有内容（证书 + 私钥）
openssl pkcs12 -in bundle.p12 -out all.pem
```

- **`-export`**：打包模式（合成 p12）。
- **`-clcerts`**：只导出客户端证书；`-cacerts` 只导出 CA 证书。
- **`-nocerts`/`-nokeys`**：解包时跳过证书/跳过私钥。

### 3.4 实战：从 Windows IIS 的 .pfx 迁移到 Nginx

```bash
# 1. 解出私钥（Nginx 用 PEM 格式）
openssl pkcs12 -in bundle.pfx -nocerts -out domain.key
# （若提示输入 Export Password，输入 .pfx 的导出密码；
#   再提示 PEM pass phrase，可设一个临时的，之后去掉）

# 2. 去掉私钥的 passphrase（Nginx 自动启动需要）
openssl rsa -in domain.key -out domain.key

# 3. 解出证书
openssl pkcs12 -in bundle.pfx -clcerts -nokeys -out domain.crt

# 4. 解出 CA 链
openssl pkcs12 -in bundle.pfx -cacerts -nokeys -out chain.crt

# 5. 部署到 Nginx（domain.key + domain.crt + chain.crt）
```

## 四、连接测试与排障

```bash
# 测试服务器的 HTTPS 配置（看证书链/协商的加密套件）
echo | openssl s_client -connect example.com:443 -servername example.com

# 只看证书
echo | openssl s_client -connect example.com:443 -servername example.com 2>/dev/null | openssl x509 -text -noout

# 指定 SNI（一个 IP 多证书时必需）
openssl s_client -connect 1.2.3.4:443 -servername example.com

# 测试特定的加密套件
openssl s_client -connect example.com:443 -cipher 'ECDHE-RSA-AES256-GCM-SHA384'
```

- **`s_client`**：OpenSSL 的 TLS 客户端调试工具，连接目标查看握手过程、证书链、协商的协议（TLSv1.3）和加密套件。是排查 HTTPS 配置（证书链不完整、协议版本、SNI）的核心工具。
- **`-servername`**：SNI（Server Name Indication），一个 IP 托管多个 HTTPS 站点时，告诉服务器要哪个域名的证书。不指定会拿到默认证书，可能是错的。

## 五、易错点

- **「PEM 和 DER 是不同算法」**：错。它们是**编码格式**（Base64 文本 vs 二进制），不是加密算法。同一把 RSA 密钥可存成 PEM 或 DER，内容等价。
- **「openssl rsa 能处理所有私钥」**：错。`openssl rsa` 只处理 RSA 私钥；ECDSA 私钥用 `openssl ec`，混用会报 `unable to load Private Key`。
- **「私钥加了密码更安全所以 Web 服务器一定用」**：错。Web 服务器要自动重启，加密私钥每次重启都要人工输密码，不现实。生产用 -nodes 不加密，靠权限保护。
- **「私钥和证书随便配就行」**：错。私钥与证书的模数必须匹配，不匹配 Nginx 启动报 key values mismatch，需用 modulus md5 比对找到正确私钥。

## 下一步

密钥管理讲完后，可回到[参考](../reference)查看 OpenSSL 命令速查与易错点清单，或复习[CSR 与证书](./csr-and-certs)的完整流程。
