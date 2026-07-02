---
layout: doc
outline: [2, 3]
---

# Native Federation

> 基于 Native Federation（Angular 官方背书） · 核于 2026-07

## 速查

- **一句话**：Native Federation 是把 MF 的**心智模型**（host/remote、`exposes`/`remotes`、shared）搬到**浏览器原生标准**上的实现——底座换成 **ESM + Import Maps**，不再依赖任何打包器的私有运行时。
- **作者与背书**：由 **Manfred Steyer**（Angular GDE、Angular Architects）发起，目标是「**把联邦的理念与具体打包器彻底解耦**」；发布在 **Angular 官方博客**（blog.angular.dev），是 Angular 微前端的官方推荐路线。
- **两个包**：`@softarc/native-federation` 是**框架/打包器无关的核心**；`@angular-architects/native-federation` 是 Angular 集成（`ng add` 一条命令接入）。
- **API 与 MF 高度相似**：官方原话「其 API 面与 Module Federation 非常相似，重心在**可移植性与 ECMAScript 模块、Import Maps 这些标准**」——学过 MF 的人几乎零成本迁移心智。
- **bundler-agnostic 的实现方式**：其编译期是「**现有打包器之上的一层包装**」，通过**可替换的适配器（exchangeable adapter）**与底层打包器通信——换打包器只换适配器。
- **esbuild 加持**：Angular 集成直接委托给 **Angular ApplicationBuilder**，后者用**快速打包器 esbuild**——联邦不牺牲构建速度。
- **运行时 = 原生模块图**：remote 的产物是标准 ESM，shared 依赖通过 **Import Map** 声明去重——加载与解析交给**浏览器原生模块系统**，而非 MF 那样的自有容器。
- **Import Maps 已 Baseline**：自 **2023-03 起 Baseline Widely available**，主流浏览器普遍支持——这正是 Native Federation 敢押注原生的前提（SystemJS 已退居兼容层）。
- **与 webpack MF 的分野**：**同一套心智，两种底座**——MF 用「打包器编译 + 自有运行时容器」，Native Federation 用「原生 ESM + Import Maps + esbuild」；前者功能/生态更厚，后者更贴标准、更可移植。
- **选它的场景**：Angular 生态、想尽量贴浏览器标准、不想被某个打包器的私有联邦运行时绑定；**MF 2.0 官方 Vite 插件**也在往「贴原生」方向走，两条路在收敛。
- 依赖共享（import maps / MF shared）的通论见[核心机制 · 依赖共享三路线](../../mfe-mechanisms/guide-line/dependency-sharing)；本页讲 Native Federation 作为「MF 心智的原生实现」这一架构对照。

## 一、同一个心智，换一副底座

学完 MF 再看 Native Federation，最省事的理解是：**心智没变，底座换了**。官方把它说得很直白——「其 API 面与 Module Federation 非常相似，重心在可移植性与 ECMAScript 模块、Import Maps 这些标准」。也就是说，你依然在讲 host/remote、依然 `exposes` 模块、依然声明 `shared` 去重依赖；**变的只是这些概念底下靠什么技术实现**：

| 联邦概念 | webpack MF 的底座 | Native Federation 的底座 |
| --- | --- | --- |
| remote 加载 | 打包器生成的 `remoteEntry.js` + **自有运行时容器** | 标准 **ESM** 产物 + `remotes` 清单 |
| shared 去重 | share scope 运行时 semver 协商 | **Import Map** 声明映射，交浏览器解析 |
| 模块解析 | MF runtime 接管 | **浏览器原生模块系统** |
| 构建 | webpack/Rspack 插件织入 | **esbuild**（经 Angular ApplicationBuilder） |

Native Federation 的立意，是 Manfred Steyer 提出的一句目标：**「把联邦的理念与具体打包器彻底解耦」**。MF 2.0 也在做「脱离 webpack」，但它脱离的方式是**自造一个跨打包器的 runtime**；Native Federation 更激进——**直接押注浏览器已经原生具备的模块能力（ESM + Import Maps）**，让「联邦」尽量少一层私有运行时。

## 二、为什么现在能押注「原生」

Native Federation 的可行性建立在一个**平台事实**上：**Import Maps 已经 Baseline Widely available（自 2023-03 起）**，主流浏览器普遍支持。这条时间线很关键——在 import maps 原生化之前，同页多版本、裸说明符映射只能靠 **SystemJS** 这类 polyfill 模拟；原生化之后，这些能力**内置于浏览器**，SystemJS 退居「兼容化石浏览器」的历史层。

于是 Native Federation 的运行时可以极薄：remote 产出标准 ESM，host 用一张 **Import Map** 声明「`react` 这个裸说明符去哪取、哪些依赖共享一份」，剩下的**加载、缓存、去重全交给浏览器原生模块图**：

```html
<!-- Native Federation 运行时的核心其实就是一张原生 Import Map（示意） -->
<!-- 必须在任何模块加载前声明；shared 依赖在这里映射到唯一 URL 实现去重 -->
<script type="importmap">
  {
    "imports": {
      "react": "https://cdn.example.com/react@18.3.1/index.js",
      "shop/Button": "https://cdn.example.com/shop/Button-a1b2.js"
    }
  }
</script>
```

Import Map 的三键语义（`imports` 全局映射、`scopes` 同页多版本、`integrity` 内容锁定）与工程约束（必须最先声明、不能外链）在[依赖共享三路线](../../mfe-mechanisms/guide-line/dependency-sharing)已详述——Native Federation 本质就是**把这套原生能力工程化成「联邦」的开发体验**。

## 三、bundler-agnostic：适配器包装现有打包器

「不依赖打包器」不等于「不用打包器」——Native Federation 仍需要打包器把源码编译成 ESM，只是**它不绑定某一个**。官方描述其架构：**编译期是「现有打包器之上的一层包装」，通过一个可替换的适配器（exchangeable adapter）与底层打包器通信**。

```text
Native Federation 编译期
      │
      ├─ 适配器（可替换）
      │        │
      │        ├─ esbuild（Angular ApplicationBuilder 默认）
      │        ├─ 其他打包器…
      │        └─ CLI 未来的新能力…
      └─ 产出：标准 ESM + import map + 联邦清单
```

这层适配器就是「bundler-agnostic」的实现机制：**换打包器只换适配器**，上层的联邦语义（exposes/remotes/shared）与产物形态（ESM + import map）不变。官方也点明这带来的可移植性——「因其架构，Native Federation 可移植到更多打包器或 CLI 未来提供的新能力」。Angular 集成里，适配器直接委托给 **Angular ApplicationBuilder**，后者用 **esbuild**——所以你**既得到联邦、又得到 esbuild 的构建速度**。

## 四、接入心智（以 Angular 为例）

Native Federation 的 Angular 接入被收敛成一条 schematic 命令——心智和 MF 一样是「声明一个 remote / 声明去哪消费」：

```bash
# 把一个 Angular 项目变成 remote（生产者），跑在 4201 端口
ng add @angular-architects/native-federation --project mfe1 --port 4201 --type remote
```

框架无关的核心在 `@softarc/native-federation`（context7 描述为「**browser-native 的 Module Federation 实现，适配任意框架与构建工具**」），Angular 之外的框架可基于它自建集成。心智映射一张表记牢：

| MF 术语 | Native Federation 对应 |
| --- | --- |
| host / remote | 一样叫 host / remote |
| `exposes` | 一样声明导出（产物是 ESM） |
| `remotes` | 一样声明来源（指向 remote 的 federation 清单） |
| `shared` | 一样声明共享，但落地为 **import map 条目** |
| remoteEntry / mf-manifest.json | 联邦清单（角色相同，格式贴原生） |

> **注意**：Native Federation 与 webpack MF 的清单格式、字段不互通——它是**另一套实现**，不是 MF 的一个适配器。选型时按「生态 vs 原生」权衡（下节），而不是假设两者产物能直接混联邦。

## 五、与 webpack MF 的取舍

| 维度 | webpack/Rspack MF（2.0） | Native Federation |
| --- | --- | --- |
| **底座** | 打包器编译 + **自有运行时容器** | **原生 ESM + Import Maps** |
| **构建器绑定** | 需 MF 插件（webpack/Rspack/官方 Vite…） | **适配器包装任意打包器**（Angular 用 esbuild） |
| **生态厚度** | 厚：类型联邦、DevTools、预加载、bridge、跨工具 | 相对薄，聚焦可移植 + 标准 |
| **官方背书** | 字节 Web Infra + Zack Jackson | **Manfred Steyer / Angular** |
| **贴标准程度** | 自有运行时（虽也在贴原生） | **最大化用浏览器原生能力** |
| **甜区** | 多团队、要治理/工具/跨工具的规模化联邦 | Angular 生态、想贴标准、不愿绑私有运行时 |

要点是**别把它们看成对立的两代**——它们是**同一心智的两种底座实现**。MF 2.0 生态更厚、治理与工具更全；Native Federation 更贴浏览器标准、更可移植、在 Angular 生态有官方地位。而且两条路在**收敛**：MF 2.0 的官方 Vite 插件、对原生 ESM 的拥抱，和 Native Federation 押注的 import maps，方向是一致的——**让联邦越来越贴近平台原生**。选型上，Angular 项目或「标准洁癖」团队会更青睐 Native Federation，其余多团队规模化场景 MF 2.0 生态优势明显。

## 小结

Native Federation 证明了一件事：**「联邦」是一种心智，不是某个打包器的特性**。它由 Manfred Steyer 发起、Angular 官方背书，把 host/remote/exposes/shared 这套 MF 心智原封不动搬到 **ESM + Import Maps** 的浏览器原生底座上，用**可替换适配器**包装现有打包器（Angular 侧走 esbuild）实现 bundler-agnostic，并踩着「Import Maps 2023-03 起 Baseline」的平台红利让运行时极薄。它与 webpack MF 不是对立两代，而是同一心智的两种实现——一个生态厚、一个贴标准，且正在收敛。理解了「同一心智、不同底座」，最后一个问题是把 MF 放回微前端全景里横向选型——它与带沙箱的应用级方案到底怎么选：[与应用级方案的选型](./vs-qiankun-selection)。
