---
layout: doc
outline: [2, 3]
---

# OSS 与 CDN：对象存储与内容分发

> 基于阿里云 · 核于 2026-08

## 速查

- **OSS（对象存储）**：S3 兼容的海量存储，按**容量（GB·月）+ 请求次数 + 流量**计费，放图片/视频/静态资源/备份。
- **三大概念**：①**Bucket（桶）**——顶层命名空间，名字全球唯一；②**Object（对象）**——存的文件，由数据+元数据组成；③**Endpoint**——访问域名（地域级，如 `oss-cn-hangzhou.aliyuncs.com`）。
- **三种权限**：①**私有**（默认，需签名访问，适合敏感数据）；②**公共读**（任何人可读，适合图片/静态资源）；③**公共读写**（**严禁**，会被刷流量）。
- **S3 兼容**：OSS 完全兼容 AWS S3 协议——S3 SDK 换 Endpoint（`oss-cn-xxx.aliyuncs.com`）+ AccessKey 即可访问，迁移成本低。
- **CDN（内容分发）**：把**静态资源**从源站（OSS/ECS）缓存到全国边缘节点，用户就近取——降低延迟、减轻源站压力、省源站流量。
- **回源**：用户请求未命中 CDN 缓存时，CDN 节点回源站（OSS）拉取并缓存；配置缓存过期时间（如 JS/CSS 30 天、图片 365 天）。
- **DCDN（全站加速）**：CDN 只加速静态；DCDN 对**动态请求**（API/登录）走最优路由回源，适合动态+静态混合站点。
- **私有 Bucket + CDN 鉴权**：高价值内容（视频/付费资源）放私有 Bucket，CDN 开启**鉴权**（URL 带签名+时效），防止源站被盗刷。
- **典型用法**：用户上传头像 → 后端生成签名 URL → 前端直传 OSS → 后端存 URL → CDN 加速分发。
- **RAM 角色授权**：ECS 通过**实例 RAM 角色**访问 OSS，无需硬编码 AccessKey（密钥泄漏是云上最大安全事故之一）。

## 一、OSS：Bucket、Object 与 Endpoint

OSS 的数据模型是扁平的"桶 + 对象"两层（不像文件系统的目录树）：

- **Bucket（桶）**：顶层容器，名字**全球唯一**（命名规则：小写字母/数字/连字符，3-63 字符）。一个账号最多 30 个 Bucket（可提工单加）。创建 Bucket 要选**地域**（Region）和**存储类型**。
- **Object（对象）**：桶里的文件，由 **数据（Data）+ 元数据（Metadata，如 Content-Type）+ Key（路径）** 组成。Key 看起来像路径（`images/avatar.png`）但实际是扁平字符串（OSS 模拟目录靠 Key 前缀）。
- **Endpoint（接入点）**：访问 OSS 的域名，**地域级**——如杭州是 `oss-cn-hangzhou.aliyuncs.com`，北京是 `oss-cn-beijing.aliyuncs.com`。访问 URL 形如 `https://<bucket>.<endpoint>/<key>`。
- **存储类型**：①**标准存储**（频繁访问，默认）；②**低频访问 IA**（少访问，存储费低但有最短存储期+取回费）；③**归档存储**（极少访问，最便宜但取回要分钟级解冻）；④**冷归档**（最便宜，解冻数小时）。冷数据转 IA/归档可大幅省钱。

## 二、S3 兼容：换 Endpoint 即可迁移

OSS 完全兼容 AWS S3 的 REST API——同一个 S3 SDK，**只改 Endpoint 和 AccessKey**，就能在 S3 和 OSS 之间无缝切换：

```js
// AWS S3 SDK 访问 OSS（Node.js 示例）
const S3 = require("aws-sdk/clients/s3");
const s3 = new S3({
  accessKeyId: process.env.ALIYUN_AK, // 阿里云 AccessKey ID
  secretAccessKey: process.env.ALIYUN_SK, // 阿里云 AccessKey Secret
  endpoint: "https://oss-cn-hangzhou.aliyuncs.com", // 换成 OSS Endpoint
  s3ForcePathStyle: true, // 用 path-style：bucket.endpoint/key
  region: "cn-hangzhou",
});
// 之后 putObject/getObject 用法与 S3 完全一致
```

- **迁移价值**：从 AWS 迁阿里云，应用代码（S3 SDK 调用）几乎不改，只换配置；反之亦然。这是对象存储的事实标准带来的便利。
- **阿里云自有 SDK**：阿里也提供 `ali-oss`（Node.js）/ `oss2`（Python）等原生 SDK，功能更全（STS 临时凭证、分片上传优化等），但用 S3 SDK 已够多数场景。

## 三、权限与签名 URL

OSS 的访问控制是**安全核心**：

- **Bucket ACL（桶级权限）**：私有 / 公共读 / 公共读写（**禁用**）。生产环境静态资源桶一般设**公共读**（前端直接 `<img src="oss-url">` 访问），敏感数据桶设**私有**。
- **签名 URL（私有对象临时访问）**：对私有对象，后端用 AccessKey 生成一个**带签名+过期时间**的 URL（如有效期 15 分钟），前端拿这个 URL 才能读写。典型用法：用户上传头像 → 后端签一个写 URL → 前端直传 OSS → 后端存返回的 Key。
- **STS 临时凭证**：更安全的做法是用 **STS（Security Token Service）** 颁发临时 AccessKey（有时效+权限范围），前端拿临时凭证直传 OSS，后端不直接签 URL。
- **RAM 角色（推荐）**：ECS 通过**实例 RAM 角色**访问同账号 OSS，**无需在代码里写任何 AccessKey**——这是最安全的方式（密钥不出控制台）。

## 四、CDN：加速静态资源

**CDN** 把静态资源从源站（OSS 或 ECS）缓存到全国边缘节点，用户就近取：

```
用户（北京）请求 images.example.com/avatar.png
  → DNS 解析到最近的 CDN 节点（北京节点）
  → 北京节点缓存命中？直接返回（快）
  → 未命中？回源到 OSS（杭州）拉取，缓存后返回（首次稍慢）
```

- **加速域名**：在 OSS Bucket 前加一个**加速域名**（如 `cdn.example.com`），CNAME 到 CDN 分配的域名（`xxx.aliyuncs.com`），CDN 回源到 OSS。
- **缓存配置**：按文件类型设过期时间——JS/CSS/图片 30-365 天（带 hash 文件名可长缓存）、HTML 短缓存或不缓存。更新静态资源用**版本号/hash 文件名**（如 `app.a1b2c3.js`），而非手动刷新 CDN。
- **HTTPS**：CDN 域名配 HTTPS 证书（可申请免费 DV 证书），全链路加密。
- **计费**：CDN 按**下行流量**（GB）计费，可买流量包降低单价。

## 五、DCDN：动态+静态全站加速

**DCDN（Dynamic Route for CDN）** 在 CDN 静态缓存之外，对**动态请求**（API/登录/查询）做**智能路由加速**：

- **动态加速原理**：CDN 节点之间、节点到源站之间走阿里**最优内网路径**（避开公网拥塞），动态请求响应更快、更稳。
- **适用场景**：动态+静态混合的站点（电商、SaaS、API 服务）——静态走 CDN 缓存，动态走 DCDN 智能路由，一个域名搞定。
- **与 CDN 区别**：CDN 只缓存静态；DCDN 静态缓存 + 动态智能路由，覆盖更全但价格略高。

本站静态资源（图片/图标）走 CDN 即可，动态 API 由 ECS 直接响应，暂不需要 DCDN。

## 六、防盗刷：私有 Bucket + CDN 鉴权

高价值内容（付费视频/会员资源）放 OSS 有被盗链/刷流量的风险，防护组合：

- **私有 Bucket**：源站设私有，禁止公共读。
- **CDN 鉴权**（URL 鉴权）：CDN 开启鉴权后，每个 URL 带签名+过期时间（如 2 小时），过期失效；即使链接泄漏，过期后无法访问。
- **Referer/UA 黑白名单**：CDN 配 Referer 白名单（只允许自家域名），防外站盗链。
- **流量监控告警**：CDN 控制台设流量阈值告警，异常暴涨第一时间发现。

## 下一步

OSS 与 CDN 讲完，至此阿里云开发者产品的核心选型（ECS/RDS/OSS/CDN/函数计算）已覆盖。下一步见[参考](../reference)——产品速查表、ECS vs 轻量对比、计费模式、易错点。
