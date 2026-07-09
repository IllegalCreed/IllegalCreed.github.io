#!/usr/bin/env node
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const websiteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const srcRoot = path.join(websiteRoot, "src", "zh");
const quizBaseUrl = process.env.QUIZ_BASE_URL ?? "https://quiz.illegalscreed.cn/";

function toPosix(filePath) {
  return filePath.split(path.sep).join("/");
}

function relativePath(filePath) {
  return toPosix(path.relative(websiteRoot, filePath));
}

async function listMarkdownFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listMarkdownFiles(fullPath)));
    } else if (entry.isFile() && entry.name === "index.md") {
      files.push(fullPath);
    }
  }
  return files.sort((a, b) => a.localeCompare(b));
}

function hasHeading(text, heading) {
  return new RegExp(`^##\\s+${heading}\\s*$`, "m").test(text);
}

function getTitle(text, fileRel) {
  const match = text.match(/^#\s+(.+?)\s*$/m);
  if (match) return match[1].trim();
  return path.basename(path.dirname(fileRel)).replace(/-/g, " ");
}

function escapeHtml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function createCategoryParam(title) {
  const slug = title
    .trim()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/\+/g, " plus ")
    .replace(/#/g, " sharp ")
    .replace(/@/g, " ")
    .replace(/\./g, "-")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  return slug || title.trim();
}

function buildQuizHref(title) {
  const url = new URL(quizBaseUrl);
  url.searchParams.set("category", createCategoryParam(title));
  return url.toString();
}

function insertQuizSection(text, title) {
  const lines = text.split(/\r?\n/);
  const preferredHeading = hasHeading(text, "幻灯片地址") ? "## 幻灯片地址" : "## 文档地址";
  const headingIndex = lines.findIndex((line) => line.trim() === preferredHeading);
  if (headingIndex === -1) return null;

  let insertIndex = headingIndex + 1;
  while (insertIndex < lines.length && !/^##\s+/.test(lines[insertIndex].trim())) {
    insertIndex += 1;
  }
  while (insertIndex > headingIndex + 1 && lines[insertIndex - 1].trim() === "") {
    insertIndex -= 1;
  }

  const href = buildQuizHref(title);
  const section = [
    "",
    "## 测试题",
    "",
    `<a href="${href}" target="_blank" rel="noopener noreferrer">${escapeHtml(title)} 测试题</a>`,
    "",
  ];
  lines.splice(insertIndex, 0, ...section);
  return lines.join("\n").replace(/\n*$/, "\n");
}

const files = await listMarkdownFiles(srcRoot);
const updated = [];
const skipped = [];

for (const filePath of files) {
  const text = await readFile(filePath, "utf8");
  if (!(hasHeading(text, "文档地址") || hasHeading(text, "幻灯片地址"))) continue;
  if (hasHeading(text, "测试题")) {
    skipped.push(relativePath(filePath));
    continue;
  }

  const fileRel = relativePath(filePath);
  const title = getTitle(text, fileRel);
  const nextText = insertQuizSection(text, title);
  if (!nextText) continue;

  await writeFile(filePath, nextText);
  updated.push(fileRel);
}

console.log(`Updated ${updated.length} index pages`);
console.log(`Skipped ${skipped.length} pages with existing quiz links`);
for (const file of updated) {
  console.log(file);
}
