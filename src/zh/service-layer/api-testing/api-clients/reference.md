---
layout: doc
outline: [2, 3]
---

# 参考：四工具速查表、快捷键与易错点

> 基于 Postman 11 · Bruno 2 · Insomnia 11 · Hoppscotch 2025 · 核于 2026-08

## 速查

- **四工具一句话**：Postman（全功能云端重型）/ Bruno（Git-native 开源文件优先）/ Insomnia（GraphQL 友好的开源桌面）/ Hoppscotch（浏览器端零安装开源）。
- **形态对比**：Postman 桌面+Web+云；Insomnia 桌面为主；Bruno 桌面+CLI；Hoppscotch 浏览器+自部署。
- **数据存储**：Postman 默认云；Insomnia 本地+可选云；Bruno 纯本地文件；Hoppscotch 本地/自托管。
- **定价**：Postman 团队版最贵且免费层缩水；Bruno/Hoppscotch 核心全免费；Insomnia 社区版免费。
- **CLI**：Postman→Newman；Bruno→`bru run`；Insomnia→Inso CLI；Hoppscotch→hopp CLI。
- **变量语法**：四者统一 <code v-pre>&#123;&#123;varName&#125;&#125;</code>；密钥用本地覆盖（.local / current value）不进仓库。
- **Git 集成**：Bruno 第一梯队（文件即配置）；Hoppscotch 第二梯队（导出 JSON）；Postman/Insomnia 是云集合反向镜像，非文件优先。

## 一、四工具速查表

| 维度 | Postman | Insomnia | Bruno | Hoppscotch |
| --- | --- | --- | --- | --- |
| 开源 | 部分 | 社区版开源 | ✅ 完全 | ✅ 完全 |
| 形态 | 桌面+Web+云 | 桌面 | 桌面+CLI | 浏览器+自部署 |
| 数据存储 | 默认云端 | 本地+可选云 | 纯本地文件 | 本地/自托管 |
| REST | ✅ | ✅ | ✅ | ✅ |
| GraphQL | ✅ | ✅ | 🟡 | 🟡 |
| gRPC | ✅ | ✅ | ❌ | 🟡 |
| WebSocket | ✅ | ✅ | 🟡 | ✅ |
| 环境变量 | ✅ | ✅ | ✅ | ✅ |
| 脚本断言 | ✅ JS | ✅ JS | ✅ JS | 🟡 |
| Mock 服务 | ✅ | 🟡 | ❌ | 🟡 |
| 监控 | ✅ | ❌ | ❌ | ❌ |
| OpenAPI 导入 | ✅ | ✅ | 🟡 | 🟡 |
| CLI Runner | Newman | Inso | bru run | hopp |
| 团队工作区 | ✅ 云 | ✅ 云 | 🟡 Git | 🟡 自部署 |
| 定价 | 14-28+ 美元/人/月 | 社区免费 / Pro ~5 | 核心免费 | 完全免费 |

## 二、变量与密钥管理对照

| 概念 | Postman | Bruno | Insomnia | Hoppscotch |
| --- | --- | --- | --- | --- |
| 全局变量 | Globals | 集合级 `vars` | Global Env | Global |
| 环境变量 | Environments | `environments/*.bru` | Environments | Environments |
| 入库值 | initial value | `.bru`（入库） | - | 集合 JSON |
| 本地值（不入库） | current value | `*.local.bru`（gitignore） | - | 浏览器本地 |
| 引用语法 | <code v-pre>&#123;&#123;var&#125;&#125;</code> | <code v-pre>&#123;&#123;var&#125;&#125;</code> | <code v-pre>&#123;&#123; var &#125;&#125;</code> | <code v-pre>&#123;&#123;var&#125;&#125;</code> |

> **铁律**：token/apiKey 一律放「本地值」，仓库里只留变量名占位。

## 三、命令行（CLI）对应

| 操作 | Postman (Newman) | Bruno | Insomnia (Inso) |
| --- | --- | --- | --- |
| 跑集合 | `newman run c.json` | `bru run` | `inso run test` |
| 指定环境 | `-e env.json` | `--env staging` | `--env staging` |
| 输出 JUnit | `--reporters junit` | `--reporter-junit` | `--reporter junit` |
| 只跑某文件夹 | `--folder 订单` | `--folder 订单` | `--suite 订单` |

```bash
# Bruno 在 CI 里跑冒烟
bru run --env staging --reporter-junit results.xml
# 失败即阻断发布
```

## 四、常见快捷键（桌面端，macOS）

| 操作 | Postman / Bruno / Insomnia |
| --- | --- |
| 新建请求 | Cmd+N |
| 发送请求 | Cmd+Enter |
| 切换环境 | Cmd+Alt+E |
| 搜索 | Cmd+P / Cmd+F |
| 格式化 JSON body | Cmd+B / Cmd+Shift+F |

> Hoppscotch 浏览器版快捷键与 Chrome 一致（Cmd+Enter 发送）。

## 五、易错点清单

- **「Postman 是开源的」**：错。Postman 核心闭源，仅部分组件开源；Bruno/Hoppscotch 才是完全开源。
- **「Bruno 功能少所以不好」**：错。Bruno 是有意砍掉 Mock/监控等重型功能，聚焦核心 + Git-native，定位不同。
- **「Insomnia 已死」**：部分对。社区版仍活跃，但被 GitLab 收购后更新节奏放缓，重度用户在评估迁移。
- **「Hoppscotch 只能在浏览器用」**：部分对。官方有自部署版，可作团队私有云。
- **「Postman 的 GitHub 集成等于 Git-native」**：错。那是云集合的反向镜像，不是文件优先，diff 体验与 Bruno 完全不同。
- **「环境变量切了就一定生效」**：要看变量优先级（环境 > 集合 > 全局），同名变量会被覆盖；改了 current value 但用 initial 跑会拿到旧值。
- **「密钥放 initial value 也行」**：错。initial value 会随集合同步/提交，必须用 current value / `.local` 隔离。
- **「集合导入到 Bruno 后变量丢了」**：Postman 集合导入 Bruno 时环境变量不随集合走，需单独重建 environments。

## 六、迁移速查（Postman → Bruno）

1. Postman 集合 → Export → Collection v2 → 得 `collection.json`。
2. Bruno → Import → 选 Postman → 选 JSON，自动转成 `.bru` 文件目录。
3. 环境变量：Postman 的 Environments 单独导出，Bruno 里手动建 `environments/dev.bru` 等，填 `baseUrl`。
4. 密钥：在 `environments/*.local.bru` 重填 token（不进 Git）。
5. 脚本断言：Postman 的 `pm.test` 需改成 Bruno 的 `test()` / `expect()` 风格，逻辑可平移。

## 权威链接

- [Postman 官方文档](https://learning.postman.com/)
- [Bruno 官方文档](https://docs.usebruno.com/)
- [Insomnia 官方文档](https://docs.insomnia.rest/)
- [Hoppscotch 官方文档](https://docs.hoppscotch.io/)
- [Newman CLI](https://github.com/postmanlabs/newman)
- [Bruno GitHub](https://github.com/usebruno/bruno)
- [Hoppscotch GitHub](https://github.com/hoppscotch/hoppscotch)
- 本站幻灯片：<a href="/SlideStack/api-clients-slide/" target="_blank">API 客户端</a>
