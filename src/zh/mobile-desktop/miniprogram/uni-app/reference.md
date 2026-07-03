---
layout: doc
outline: [2, 3]
---

# uni-app 参考

> 基于 uni-app 5.x（uni-app x）· 核于 2026-07

## 速查

- 版本：统一 **5.x**（最新 `5.07.2026041006`，2026-04），uni-app 与 uni-app x **共用版本号**；Vue2/Vue3 双支持，**新项目 Vue3 + Vite**（Node 18+/20+）
- 四大工程文件：`pages.json`（路由+导航+TabBar+分包）｜ `manifest.json`（应用+各端差异+`vueVersion`）｜ `App.vue`（应用周期）｜ `main.js`（入口）
- 生命周期来源：组件周期←`vue`；页面周期←**`@dcloudio/uni-app`**；应用周期←`App.vue`
- 条件编译：JS/UTS `//`、**CSS/SCSS `/* */`**、template `<!-- -->`、JSON `//`；**`APP-IOS`/`APP-ANDROID` 仅 uni-app x**
- 最常踩：页面周期不是 Vue 的、CSS 条件编译必须 `/* */`、传统版不能按 iOS/Android 分编译、组件用 `view`/`text` 不用 `div`/`span`

## 一、版本坐标

| 项 | 值 |
| --- | --- |
| 统一版本号 | **5.x**（最新 `5.07.2026041006`，2026-04-10） |
| uni-app / uni-app x | **共用同一版本号**（HBuilderX 亦随之进入 5.x） |
| Vue 支持 | Vue2（webpack 编译器）/ Vue3（Vite 编译器）**双支持**，新项目 Vue3 |
| Node（Vue3/Vite） | **18+ / 20+** |
| GitHub | `dcloudio/uni-app` **41.6k★ / 3.7k fork**，Apache-2.0 |

## 二、四大工程文件

| 文件 | 作用 |
| --- | --- |
| **`pages.json`** | 页面路由 + 导航栏/TabBar/分包/窗口样式（**非 Vue Router**） |
| **`manifest.json`** | appid、应用名、版本号、各端差异、`vueVersion`（"2"/"3"） |
| **`App.vue`** | 全局样式 + 应用生命周期（`onLaunch`/`onShow`/`onHide`） |
| **`main.js`**（x 为 `main.uts`） | 程序入口，创建 Vue 实例 |
| `uni.scss` | 全局 SCSS 变量（内置 `$uni-` 变量） |

## 三、创建与运行

```bash
# Vue3 + Vite（JS / TS）
npx degit dcloudio/uni-preset-vue#vite my-app
npx degit dcloudio/uni-preset-vue#vite-ts my-app

# 运行 / 打包，%PLATFORM% 取 h5 / mp-weixin / mp-alipay / app 等
npm run dev:h5
npm run dev:mp-weixin
npm run build:app
```

- HBuilderX：官方 IDE，免装 Node，图形化运行，产物 `unpackage/`（很多用户走这条，故 npm 量低估）。
- CLI：Vite 工程化，源码 `src/`、产物 `dist/`，适合团队/CI。

## 四、生命周期来源

| 类别 | 钩子 | 来源 |
| --- | --- | --- |
| 组件 | `onMounted` / `onUnmounted` / `onUpdated`… | `import { ... } from 'vue'` |
| **页面** | `onLoad` / `onShow` / `onReady` / `onHide` / `onUnload` / `onPullDownRefresh` / `onReachBottom` / `onShareAppMessage` | **`import { ... } from '@dcloudio/uni-app'`** |
| 应用 | `onLaunch` / `onShow` / `onHide` | 写在 `App.vue` |

- `onLoad(options)` 拿路由参数；`onReady` 首次渲染完成可操作节点。
- `onShow` 在应用级（切前台）与页面级（页面显示）含义不同。

## 五、条件编译

| 文件 | 注释 |
| --- | --- |
| JS / UTS / TS | `//` |
| **CSS / SCSS / Less / Stylus** | **`/* */`** |
| Vue / nvue / uvue template | `<!-- -->` |
| pages.json / manifest.json | `//` |

```
// #ifdef 平台   仅该平台      // #ifndef 平台   除该平台外
// #endif        结束          条件支持 || && !
```

高频常量：`H5`/`WEB`、`APP`/`APP-PLUS`、`APP-HARMONY`、`APP-ANDROID`/`APP-IOS`（**仅 uni-app x**）、`MP`（全部小程序）、`MP-WEIXIN`/`MP-ALIPAY`/`MP-BAIDU`/`MP-TOUTIAO`/`MP-QQ`/`MP-XHS`、`VUE2`/`VUE3`/`VUE3-VAPOR`、`UNI-APP-X`。

## 六、API 与组件

| 场景 | 用法 |
| --- | --- |
| 路由 | `navigateTo`（压栈）/ `redirectTo`（替换）/ `reLaunch`（重启）/ `switchTab`（切 tab）/ `navigateBack`（返回） |
| 交互 | `uni.showToast` / `uni.showModal` / `uni.showLoading` |
| 网络 | `uni.request`（不传 `success`，Vue3 返回 Promise） |
| 存储 | `uni.setStorage(Sync)` / `getStorage(Sync)` |
| 组件 | `view`/`text`/`image`/`scroll-view`/`swiper`/`button`/`input`（**不用 `div`/`span`**） |
| easycom | `components/foo-bar/foo-bar.vue` → 模板直接 `<foo-bar>`，免注册 |

## 七、uni-app x 速记

| 维度 | 要点 |
| --- | --- |
| 语言 | **UTS**（强类型，编 Kotlin/Swift/ArkTS/JS） |
| 渲染 | **uvue** 原生渲染（VDOM→Vapor，进行时） |
| 平台 | Android/iOS/Web/鸿蒙已覆盖，微信小程序已支持；其他小程序逐端推进 |
| 关系 | 与传统版并存、共用版本号；要原生性能选它 |
| 用途 | UTS 写原生插件（两版通用）+ x 的应用主逻辑 |

## 八、uniCloud 速记

| 组成 | 要点 |
| --- | --- |
| 云函数/云对象 | 服务端 JS，serverless；云对象像调本地方法 |
| 云数据库 | **MongoDB 系**（文档型），DB Schema 管结构/权限/校验 |
| clientDB | 前端 **JQL** 直查，权限靠 Schema，多数场景免服务端 |
| 云存储 | 文件存储 |
| 配套 | `uni-id` / `uni-starter` / `uni-admin` |

## 九、常见易错点

| # | 易错点 |
| --- | --- |
| 1 | 页面生命周期（`onLoad`/`onShow`）从 **`@dcloudio/uni-app`** 引入，不是 Vue 的 |
| 2 | **CSS 条件编译必须 `/* */`**，SCSS/Less 里也一样，写 `//` 不生效 |
| 3 | **传统版不能按 iOS/Android 条件编译**，`APP-IOS`/`APP-ANDROID` 仅 uni-app x；传统版用 `uni.getSystemInfo()` 运行时判断 |
| 4 | `APP` 与 `APP-PLUS` **基本等价**（历史命名），别对立；旧脚本 `dev:app-plus`、新 `dev:app` |
| 5 | 组件用 `view`/`text`/`image` 等小程序系，**不用 `div`/`span`/`img`** |
| 6 | JSON（pages.json/manifest.json）条件编译别产生**重复 key / 尾逗号** |
| 7 | 跳 tabBar 页必须 `switchTab`，用 `navigateTo` 失败 |
| 8 | Vue2 异步 API 返回 `[error, data]` 数组，Vue3 用 `then/catch` |
| 9 | Vue3 **暂不支持 `Teleport`/`Suspense`**；`.prevent`/`.capture` 仅 H5 |
| 10 | `pages.json` **首项即首页**；`tabBar` 2–5 项 |
| 11 | uni-app x 小程序覆盖**逐端推进**，别写「全小程序 GA」 |
| 12 | **nvue 未废弃**：存量继续支持、新原生需求引导 uni-app x（uvue） |
| 13 | 云数据库是 **MongoDB 系**（文档型），别按 SQL/JOIN 设计 |
| 14 | GitHub 主语言显示 OC/Swift 是因含 App 原生 SDK，不代表用户用 OC/Swift 开发 |

## 十、权威链接

- [uni-app 官网](https://uniapp.dcloud.net.cn/) · [教程总览](https://uniapp.dcloud.net.cn/tutorial/)
- [条件编译（平台常量）](https://uniapp.dcloud.net.cn/tutorial/platform.html) · [Vue3 基础](https://uniapp.dcloud.net.cn/tutorial/vue3-basics.html)
- [pages.json](https://uniapp.dcloud.net.cn/collocation/pages.html) · [manifest.json](https://uniapp.dcloud.net.cn/collocation/manifest.html)
- [API 总览](https://uniapp.dcloud.net.cn/api/) · [组件总览](https://uniapp.dcloud.net.cn/component/) · [nvue 概述](https://uniapp.dcloud.net.cn/tutorial/nvue-outline.html)
- [HBuilderX 上手](https://uniapp.dcloud.net.cn/quickstart-hx.html) · [CLI 上手](https://uniapp.dcloud.net.cn/quickstart-cli.html)
- [uni-app x 文档](https://doc.dcloud.net.cn/uni-app-x/) · [UTS 语言](https://doc.dcloud.net.cn/uni-app-x/uts/) · [uni-app x release](https://doc.dcloud.net.cn/uni-app-x/release.html)
- [uniCloud 文档](https://doc.dcloud.net.cn/uniCloud/) · [DCloud 插件市场](https://ext.dcloud.net.cn/) · [GitHub dcloudio/uni-app](https://github.com/dcloudio/uni-app)
