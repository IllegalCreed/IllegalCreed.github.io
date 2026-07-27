#!/usr/bin/env node

import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const expectedClient = "ca-pub-4047630223754404";
const expectedRecord =
  "google.com, pub-4047630223754404, DIRECT, f08c47fec0942fa0";
const failures = [];

async function read(relativePath) {
  try {
    return await readFile(path.join(root, relativePath), "utf8");
  } catch {
    return "";
  }
}

function check(condition, message) {
  if (!condition) failures.push(message);
}

const [
  config,
  rootHome,
  zhHome,
  adsText,
  robots,
  auditScript,
  rootPrivacy,
  zhPrivacy,
] = await Promise.all([
  read(".vitepress/config.mts"),
  read("src/index.md"),
  read("src/zh/index.md"),
  read("src/public/ads.txt"),
  read("src/public/robots.txt"),
  read("scripts/audit-vitepress-content.mjs"),
  read("src/privacy.md"),
  read("src/zh/privacy.md"),
]);

check(adsText.trim() === expectedRecord, "src/public/ads.txt 不是精确授权记录");
check(robots.includes("Sitemap: https://illegalscreed.cn/sitemap.xml"), "robots 缺 sitemap");
check(robots.includes("Mediapartners-Google"), "robots 缺 AdSense crawler");
check(config.includes(`content: "${expectedClient}"`), "VitePress 缺 AdSense account meta");
check(config.includes('hostname: "https://illegalscreed.cn"'), "VitePress 缺 sitemap hostname");
check(!config.includes("pagead2.googlesyndication.com"), "个人站不得加载 AdSense 脚本");
check(!config.includes("vuejs/vitepress"), "社交链接仍指向 VitePress 仓库");
check(!config.includes("markdown-examples"), "导航仍暴露 Markdown 示例");
check(!config.includes("api-examples"), "导航仍暴露 API 示例");

for (const placeholder of ["My great project tagline", "Lorem ipsum", "Feature A"]) {
  check(!rootHome.includes(placeholder), `英文首页仍含模板占位：${placeholder}`);
}
check(rootHome.includes("Developer Roadmap"), "英文首页缺真实定位");
check(rootHome.includes("https://algo.illegalscreed.cn/"), "英文首页缺算法站链接");
check(zhHome.includes("https://algo.illegalscreed.cn/"), "中文首页缺算法站正式域名");
check(!zhHome.includes("illegalcreed.github.io/algorithms-visualization"), "中文首页仍使用旧算法 URL");

for (const relativePath of [
  "src/about.md",
  "src/contact.md",
  "src/privacy.md",
  "src/zh/about.md",
  "src/zh/contact.md",
  "src/zh/privacy.md",
]) {
  try {
    await access(path.join(root, relativePath));
  } catch {
    failures.push(`缺少信任页面：${relativePath}`);
  }
}

for (const privacy of [rootPrivacy, zhPrivacy]) {
  check(/Google Analytics/i.test(privacy), "隐私政策缺 Google Analytics 说明");
  check(/Google AdSense/i.test(privacy), "隐私政策缺 Google AdSense 说明");
  check(/cookie/i.test(privacy), "隐私政策缺 Cookie 说明");
  check(privacy.includes("https://adssettings.google.com/"), "隐私政策缺广告退出入口");
}

for (const relativePath of [
  "src/markdown-examples.md",
  "src/api-examples.md",
  "src/zh/markdown-examples.md",
  "src/zh/api-examples.md",
]) {
  try {
    await access(path.join(root, relativePath));
    failures.push(`VitePress 示例页仍存在：${relativePath}`);
  } catch {
    // Expected: sample pages are removed.
  }
  check(!auditScript.includes(relativePath), `内容审计仍排除已删除页面：${relativePath}`);
}

if (failures.length > 0) {
  console.error("[adsense:check] failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log("[adsense:check] passed");
}
