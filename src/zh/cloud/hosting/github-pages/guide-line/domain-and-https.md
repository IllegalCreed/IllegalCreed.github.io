---
layout: doc
outline: [2, 3]
---

# 自定义域名与 HTTPS：DNS、证书与 .github.io 域名

> 基于 GitHub Pages 官方文档（2025） · 核于 2026-08

## 速查

- **默认域名**：`<user>.github.io`（用户/组织站点）或 `<user>.github.io/<repo>`（项目站点），开 Pages 即得。
- **自定义域名**：在仓库 Settings → Pages 添加自定义域名，支持 **apex 域名**（`example.com`）与**子域名**（`www.example.com`、`docs.example.com`）。
- **DNS 配置**：apex 域名配 **A 记录**指向 GitHub Pages IP（多个）；子域名配 **CNAME 记录**指向 `<user>.github.io`。
- **CNAME 文件**：在仓库根目录放 `CNAME` 文件（内容为自定义域名），让域名配置随仓库版本化、团队共享、跨 fork 保持。
- **HTTPS**：绑定域名后自动签发 **Let's Encrypt** 证书，勾选 Enforce HTTPS 即强制 HTTPS——全程零配置、自动续期。
- **证书签发条件**：DNS 配置正确且 GitHub 能验证域名所有权后，证书几分钟内签发；DNS 未生效时签发会失败。
- **Enforce HTTPS**：开启后所有 HTTP 请求 301 重定向到 HTTPS，保证传输安全与 SEO（搜索引擎优先 HTTPS）。
- **`.github.io` 域名结构**：`<user>.github.io` 是用户/组织站点根；`<user>.github.io/<repo>` 是项目站点（带仓库前缀）。
- **多域名支持**：可同时配 apex + www，设一个为主域名（其他自动重定向到主域名）。
- **DNS 生效时间**：A/CNAME 记录全球传播通常几分钟到 48 小时，传播期内访问可能间歇失败。

## 一、.github.io 域名结构

GitHub Pages 的默认域名基于 `<user>.github.io`，分两类：

```
用户/组织站点：
  仓库名：<user>.github.io（如 zhangxu.github.io）
  默认 URL：https://<user>.github.io/    ← 根路径，无前缀
  每个用户/组织只能有一个

项目站点：
  仓库名：任意（如 my-project）
  默认 URL：https://<user>.github.io/<repo>/    ← 带 /<repo>/ 前缀
  每个仓库可有一个
```

- **路径前缀影响**：项目站点的 URL 带 `/<repo>/` 前缀，SSG 的资源（CSS/JS/图片）必须用相对路径或配置 `base: '/<repo>/'`，否则 404。
- **自定义域名隐藏前缀**：绑定自定义域名后，用户通过 `example.com` 访问，`/<repo>/` 前缀在 URL 中不可见（但仍存在于内部路径）。
- **子路径 vs 根路径**：用户站点是根路径部署（简单），项目站点是子路径部署（要注意 base 配置）。

## 二、自定义域名配置

绑定自定义域名的完整流程：

1. **添加域名**：仓库 Settings → Pages → Custom domain，输入自定义域名（如 `docs.example.com`），Save。
2. **配 DNS**：在域名注册商的 DNS 管理里添加记录：
   - **子域名**（`docs.example.com`）：添加 CNAME 记录，指向 `<user>.github.io`。
   - **apex 域名**（`example.com`）：添加 A 记录，指向 GitHub Pages 的 IP（多个，如 `185.199.108.153` 等）。
3. **DNS 验证**：Save 后 GitHub 验证 DNS 是否正确配置，验证通过后域名生效。
4. **CNAME 文件**：GitHub 自动在仓库根创建 `CNAME` 文件（内容为自定义域名），让配置版本化。
5. **启用 HTTPS**：DNS 生效后，证书自动签发（几分钟），勾选 Enforce HTTPS。

```
DNS 配置示例：
  docs.example.com  CNAME  zhangxu.github.io.   （子域名）
  example.com       A      185.199.108.153       （apex，配多个 IP）
  example.com       A      185.199.109.153
```

## 三、HTTPS 与 Let's Encrypt 证书

GitHub Pages 为自定义域名自动提供免费 HTTPS：

- **证书来源**：**Let's Encrypt**（免费、自动续期的 CA），GitHub 代为申请与管理。
- **签发条件**：DNS 配置正确且 GitHub 能完成域名所有权验证（ACME 挑战）后，证书几分钟内签发。
- **自动续期**：证书过期前 GitHub 自动续期，无需手动操作——告别传统手动买证书 + cron 续期的繁琐。
- **Enforce HTTPS**：勾选后所有 HTTP 请求 301 重定向到 HTTPS——保证传输加密、防篡改、利于 SEO。
- **签发失败排查**：DNS 未生效、CNAME 指向错误、域名被别人占用验证都会导致签发失败——检查 DNS 传播状态。

## 四、apex 域名 vs 子域名

两种域名类型的 DNS 配置与行为不同：

| 类型 | 示例 | DNS 记录 | 指向 | 备注 |
| --- | --- | --- | --- | --- |
| **apex 域名** | `example.com` | **A 记录** | GitHub Pages IP（多个） | 不能用 CNAME（apex 不能 CNAME，除非 DNS 服务商支持 ALIAS/ANAME） |
| **子域名** | `www.example.com` | **CNAME 记录** | `<user>.github.io` | 推荐方式，配置简单 |

- **推荐 www 还是无 www**：GitHub 建议用 `www` 子域名（CNAME 简单），把 apex 也指向 GitHub（A 记录）并在 Pages 设 www 为主域名——apex 自动重定向到 www。
- **多域名共存**：可同时配 `example.com` + `www.example.com`，设其一为主，另一个自动 301 重定向到主域名。

## 五、CNAME 文件的作用

GitHub 在仓库根创建的 `CNAME` 文件（全大写，无扩展名）有重要作用：

- **内容**：就一行，自定义域名（如 `docs.example.com`）。
- **作用**：把域名配置随仓库版本化——团队成员 clone 仓库即得正确配置；跨 fork、跨镜像保持域名绑定；删除文件会解绑域名。
- **手动管理**：也可手动创建/编辑 `CNAME` 文件提交，等效于在后台设置。
- **注意**：`CNAME` 只能含一个域名（主域名）；多域名重定向在后台配置，不写进 CNAME。

## 六、域名迁移与常见问题

- **更换域名**：在 Settings 改自定义域名，更新 DNS，等待传播——旧域名可能缓存一段时间。
- **DNS 传播期**：A/CNAME 改动全球传播需几分钟到 48 小时，传播期内访问可能间歇失败或指向旧地址。
- **CDN 缓存**：GitHub Pages 背后有 CDN，DNS 切换后边缘节点缓存可能延迟刷新。
- **SEO 考虑**：换域名会短期影响 SEO（搜索引擎需重新索引），建议用 301 重定向（设旧为主、新为重定向）。
- **子目录 vs 子域名**：项目文档推荐用子域名（`docs.example.com`）而非子目录（`example.com/docs`），后者需反代/重定向配置，GitHub Pages 原生不支持子目录到不同仓库的路由。

## 下一步

掌握自定义域名与 HTTPS 后，可结合[参考](../reference)查阅完整的能力速查、限制清单与易错点，把 GitHub Pages 用好。
