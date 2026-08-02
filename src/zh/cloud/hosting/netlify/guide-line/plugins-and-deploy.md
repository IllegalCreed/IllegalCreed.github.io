---
layout: doc
outline: [2, 3]
---

# 插件生态与高级部署：Build Plugins、原子发布与 CI/CD

> 基于 Netlify 官方文档（2025） · 核于 2026-08

## 速查

- **Build Plugins**：Netlify 构建流水线的**可编程扩展点**——在构建生命周期的钩子（`onPreBuild`/`onBuild`/`onPostBuild`/`onSuccess`/`onError`）插入自定义脚本，无需改核心代码即可生成 sitemap、注入 `<head>`、通知 Slack、压缩图片、跑 Lighthouse。
- **构建生命周期**：`onPreBuild`（拉代码后、构建前）→ `onBuild`（构建中）→ `onPostBuild`（构建完成、上传前）→ `onSuccess`（部署成功）/ `onError`（部署失败）。每个钩子可读 `netlifyConfig`、改产物、调 Netlify API。
- **官方插件市场**：Netlify 维护插件目录（如 `@netlify/plugin-lighthouse`、`@netlify/plugin-sitemap`），`netlify.toml` 一行 `[[plugins]]` 即装即用；也可写私有插件放仓库 `.netlify/plugins/`。
- **原子发布（Atomic Deploys）**：每次部署的产物**整体一次性**切流到生产——CDN 一次性把所有边缘节点指向新版本，不会出现"部分用户看到新版、部分看到旧版"的中间态；出问题一键回滚。
- **部署预览（Deploy Previews）**：每个 Pull Request 自动生成独立预览 URL（`deploy-preview-<n>--<site>.netlify.app`），团队在合并前评审真实线上效果——协作核心卖点。
- **分支部署（Branch Deploys）**：每个分支都有独立 URL（`<branch>--<site>.netlify.app`），可并行预览多个特性分支。
- **回滚（Rollback）**：在部署历史里选任意历史版本，一键回滚——CDN 切回旧产物，秒级生效，无需重新构建。
- **CI/CD 集成**：除 Git 自动触发外，可用 Netlify CLI（`netlify deploy`/`netlify deploy --prod`）在任意 CI（GitHub Actions/GitLab CI）手动触发部署，或用 Webhook/API 编程触发。
- **构建缓存**：Netlify 自动缓存 `node_modules`/`.cache`（基于 lockfile 哈希），二次构建提速；可用 `NETLIFY_CACHE_DIR` 自定义缓存目录。
- **自定义构建镜像**：企业版可指定自定义 Docker 镜像作为构建环境，预装专有工具链。

## 一、Build Plugins：流水线可编程

Build Plugins 把构建流程变成可插拔的流水线。一个最简插件：

```js
// .netlify/plugins/notify-slack/index.js
module.exports = {
  // 部署成功后发 Slack 通知
  onSuccess: ({ utils }) => {
    console.log("部署成功！");
    // utils.build.failBuild('xxx') 可主动让构建失败
    // utils.status.show({ summary: '已通知 Slack' })
  },
};
```

在 `netlify.toml` 注册：

```toml
[[plugins]]
  package = "@netlify/plugin-lighthouse"   # 官方 Lighthouse 插件
  [plugins.inputs]
    threshold = 0.8                         # 性能分低于 0.8 让构建失败

[[plugins]]
  package = "./.netlify/plugins/notify-slack"  # 本地私有插件
```

- **钩子与用途对照**：
  | 钩子 | 时机 | 典型用途 |
  | --- | --- | --- |
  | `onPreBuild` | 构建前 | 安装依赖、读取环境变量、生成配置 |
  | `onBuild` | 构建中 | 跑额外构建步骤、调用外部 API |
  | `onPostBuild` | 构建后、上传前 | 生成 sitemap、压缩产物、注入 meta、跑测试 |
  | `onSuccess` | 部署成功 | 通知 Slack、触发外部 CI、更新 CDN 缓存 |
  | `onError` | 部署失败 | 报警、收集错误日志 |
- **工具对象（utils）**：每个钩子收到 `utils` 对象，可读 `netlifyConfig`、改构建产物、主动让构建失败（`utils.build.failBuild`）、缓存数据供下次构建复用。
- **典型场景**：①Lighthouse 性能门禁（分数不达标阻断发布）；②自动生成 sitemap.xml/robots.txt；③图片压缩（tinypng）；④注入分析脚本（GA）；⑤部署后通知/触发下游 CI。

## 二、原子发布与回滚

**原子发布**是 Netlify 部署模型的核心保证：

```
传统部署（非原子）：
  逐台服务器滚动更新 → 中间时段部分用户看到新版、部分看到旧版
  → 若新版有 bug，部分用户已受影响，回滚需再逐台滚回（分钟级）

Netlify 原子部署：
  构建产物整体上传 → CDN 一次性把全部边缘节点指针切到新版本
  → 任一时刻所有用户看到同一版本 → 出问题一键回滚（秒级）
```

- **一致性**：避免"半新半旧"的脏状态，对前端尤其重要（新 HTML 配旧 JS 会白屏）。
- **回滚**：部署历史里每个版本都有快照，一键回滚到任意历史版本——CDN 切指针即可，无需重新 `git push` 或构建，秒级生效。
- **不可变产物**：每个部署是只读快照，不存在"热修复直接改线上"的灰色操作，运维更可控。

## 三、部署预览与分支部署：协作利器

- **Deploy Preview（PR 预览）**：每个 PR 自动构建并生成独立 URL，设计师/产品/PM 可在合并前直接访问评审。这是 Netlify 相对 GitHub Pages（无预览）的最大协作优势。
- **Branch Deploy（分支部署）**：每个非生产分支也有独立 URL，可并行预览多个特性分支——适合多团队并行开发。
- **用途**：代码评审时附预览链接、QA 在预览环境测试、客户验收（UAT）无需搭 staging。

## 四、CI/CD 与 CLI 集成

除 Git 自动触发外，Netlify 支持灵活的编程式部署：

- **Netlify CLI**：`npm i -g netlify-cli`，本地或 CI 里用 `netlify deploy`（预览）/ `netlify deploy --prod`（生产）部署任意目录。
- **GitHub Actions 示例**：在已有 CI 流水线里插入部署步骤（如跑完测试再部署）：
  ```yaml
  - run: npm run build
  - run: npx netlify-cli deploy --prod --dir=dist
    env:
      NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
      NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
  ```
- **Webhook / API**：构建完成可触发外部 Webhook；也可用 Netlify REST API 编程触发部署（如 CMS 内容更新后自动重建）。
- **触发条件**：可配置只在特定分支、特定路径变更、特定 commit message 时触发部署，减少无效构建。

## 五、构建性能与缓存优化

信用制下每次生产部署（15 credits）都要花钱，优化构建频率与时长有双重收益：

- **依赖缓存**：Netlify 自动按 lockfile 缓存 `node_modules`，`pnpm`/`npm ci` 二次构建跳过下载。
- **构建产物缓存**：`netlify-plugin-cache` 插件可缓存 `.cache`/`public` 目录（如 Gatsby/.next 缓存），增量构建提速。
- **减少部署次数**：合并多个 PR 一次部署；非紧急改动攒到批次，节省 credits。
- **并行构建**：企业版支持并发构建，缩短排队时间。

## 下一步

掌握了插件生态与高级部署后，可结合[参考](../reference)查阅完整的能力速查、定价对比与易错点，把 Netlify 纳入你的云服务选型决策。
