#!/usr/bin/env node
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const websiteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const srcRoot = path.join(websiteRoot, "src", "zh");
const defaultReportPath =
  "/Users/zhangxu/illegal/quiz-monorepo/docs/plans/20260709-vitepress-full-audit-and-quiz-link.md";
const args = new Set(process.argv.slice(2));

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
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(fullPath);
    }
  }
  return files.sort((a, b) => a.localeCompare(b));
}

function stripFrontmatter(text) {
  if (!text.startsWith("---\n")) return text;
  const end = text.indexOf("\n---", 4);
  if (end === -1) return text;
  const after = text.indexOf("\n", end + 4);
  return after === -1 ? "" : text.slice(after + 1);
}

function hasHeading(text, heading) {
  return new RegExp(`^##\\s+${heading}\\s*$`, "m").test(text);
}

function getTitle(text, fileRel) {
  const match = text.match(/^#\s+(.+?)\s*$/m);
  if (match) return match[1].trim();
  const dirName = path.basename(path.dirname(fileRel));
  return dirName.replace(/-/g, " ");
}

function getQuickCheckStatus(text) {
  if (!hasHeading(text, "速查")) return "missing";

  const body = stripFrontmatter(text);
  const lines = body.split(/\r?\n/);
  let index = lines.findIndex((line) => /^#\s+/.test(line.trim()));
  if (index === -1) return "misplaced";

  index += 1;
  while (index < lines.length && lines[index].trim() === "") index += 1;

  if (lines[index]?.trim().startsWith(">")) {
    while (index < lines.length && lines[index].trim().startsWith(">")) index += 1;
    while (index < lines.length && lines[index].trim() === "") index += 1;
  }

  return lines[index]?.trim() === "## 速查" ? "ok" : "misplaced";
}

function sectionBucket(fileRel) {
  const parts = fileRel.split("/");
  const afterLocale = parts.slice(2, -1);
  return afterLocale.slice(0, 2).join("/") || "(root)";
}

function countByBucket(items, key = "file") {
  const counts = new Map();
  for (const item of items) {
    const bucket = sectionBucket(item[key]);
    const current = counts.get(bucket) ?? 0;
    counts.set(bucket, current + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

function markdownTable(headers, rows) {
  if (rows.length === 0) return "_无_\n";
  const header = `| ${headers.join(" | ")} |`;
  const divider = `| ${headers.map(() => "---").join(" | ")} |`;
  const body = rows.map((row) => `| ${row.join(" | ")} |`).join("\n");
  return `${header}\n${divider}\n${body}\n`;
}

function formatPathList(items, pick = (item) => item.file) {
  if (items.length === 0) return "_无_\n";
  return items.map((item) => `- \`${pick(item)}\``).join("\n") + "\n";
}

async function audit() {
  const files = await listMarkdownFiles(srcRoot);
  const pages = [];

  for (const filePath of files) {
    const text = await readFile(filePath, "utf8");
    const file = relativePath(filePath);
    const isIndex = path.basename(filePath) === "index.md";
    const hasDocLink = hasHeading(text, "文档地址");
    const hasSlideLink = hasHeading(text, "幻灯片地址");
    const hasQuizLink = hasHeading(text, "测试题");
    const quizHrefMatch = text.match(/https:\/\/quiz\.illegalscreed\.cn\/\?category=([^"'\s)]+)/);
    pages.push({
      file,
      title: getTitle(text, file),
      isIndex,
      hasDocLink,
      hasSlideLink,
      hasQuizLink,
      quizCategory: quizHrefMatch?.[1] ?? null,
      quickCheckStatus: isIndex ? "index" : getQuickCheckStatus(text),
    });
  }

  const indexPages = pages.filter((page) => page.isIndex);
  const contentPages = pages.filter((page) => !page.isIndex);
  const techIndexPages = indexPages.filter(
    (page) => page.hasDocLink || page.hasSlideLink || page.hasQuizLink,
  );
  const pagesExpectingQuiz = techIndexPages.filter((page) => page.hasDocLink || page.hasSlideLink);
  const missingQuickCheck = contentPages.filter((page) => page.quickCheckStatus === "missing");
  const misplacedQuickCheck = contentPages.filter((page) => page.quickCheckStatus === "misplaced");
  const missingQuizLink = pagesExpectingQuiz.filter((page) => !page.hasQuizLink);
  const invalidQuizLink = pagesExpectingQuiz.filter(
    (page) => page.hasQuizLink && !page.quizCategory,
  );

  return {
    generatedAt: new Date().toISOString(),
    totals: {
      markdown: pages.length,
      indexPages: indexPages.length,
      contentPages: contentPages.length,
      techIndexPages: techIndexPages.length,
      docLinks: techIndexPages.filter((page) => page.hasDocLink).length,
      slideLinks: techIndexPages.filter((page) => page.hasSlideLink).length,
      quizLinks: techIndexPages.filter((page) => page.hasQuizLink).length,
      expectedQuizLinks: pagesExpectingQuiz.length,
      quickCheckOk: contentPages.filter((page) => page.quickCheckStatus === "ok").length,
      missingQuickCheck: missingQuickCheck.length,
      misplacedQuickCheck: misplacedQuickCheck.length,
      missingQuizLink: missingQuizLink.length,
      invalidQuizLink: invalidQuizLink.length,
    },
    pages,
    missingQuickCheck,
    misplacedQuickCheck,
    missingQuizLink,
    invalidQuizLink,
  };
}

function renderReport(result) {
  const quickRows = countByBucket(result.pages.filter((page) => !page.isIndex)).map(
    ([bucket, total]) => {
      const pages = result.pages.filter((page) => !page.isIndex && sectionBucket(page.file) === bucket);
      const missing = pages.filter((page) => page.quickCheckStatus === "missing").length;
      const misplaced = pages.filter((page) => page.quickCheckStatus === "misplaced").length;
      return [bucket, String(total), String(total - missing - misplaced), String(missing), String(misplaced)];
    },
  );

  const techRows = countByBucket(result.pages.filter((page) => page.isIndex)).map(([bucket]) => {
    const pages = result.pages.filter((page) => page.isIndex && sectionBucket(page.file) === bucket);
    const techPages = pages.filter((page) => page.hasDocLink || page.hasSlideLink || page.hasQuizLink);
    const expectedQuiz = techPages.filter((page) => page.hasDocLink || page.hasSlideLink);
    return [
      bucket,
      String(techPages.length),
      String(techPages.filter((page) => page.hasDocLink).length),
      String(techPages.filter((page) => page.hasSlideLink).length),
      String(expectedQuiz.length),
      String(expectedQuiz.filter((page) => page.hasQuizLink).length),
    ];
  });

  return `# VitePress 内容全量审计报告

> 生成时间：${result.generatedAt}
> 审计仓库：\`/Users/zhangxu/workspace/IllegalCreedWebsite\`
> 规则口径：除 \`index.md\` 概览页外，所有 Markdown 内容页都应在标题和版本说明后紧跟 \`## 速查\`；带 \`## 文档地址\` 或 \`## 幻灯片地址\` 的技术节点首页应带 \`## 测试题\`。

## 摘要

| 指标 | 数量 |
| --- | ---: |
| Markdown 总数 | ${result.totals.markdown} |
| index 概览页 | ${result.totals.indexPages} |
| 内容页（需速查） | ${result.totals.contentPages} |
| 速查合规 | ${result.totals.quickCheckOk} |
| 缺失速查 | ${result.totals.missingQuickCheck} |
| 速查位置不合规 | ${result.totals.misplacedQuickCheck} |
| 技术节点首页 | ${result.totals.techIndexPages} |
| 文档链接首页 | ${result.totals.docLinks} |
| 幻灯片链接首页 | ${result.totals.slideLinks} |
| 应有测试题链接首页 | ${result.totals.expectedQuizLinks} |
| 已有测试题链接首页 | ${result.totals.quizLinks} |
| 缺失测试题链接首页 | ${result.totals.missingQuizLink} |
| 测试题链接格式异常 | ${result.totals.invalidQuizLink} |

## 速查审计

${markdownTable(["目录", "内容页", "合规", "缺失", "位置不合规"], quickRows)}

### 缺失速查文件

${formatPathList(result.missingQuickCheck)}

### 速查位置不合规文件

${formatPathList(result.misplacedQuickCheck)}

## 技术节点链接审计

${markdownTable(["目录", "技术首页", "文档链接", "幻灯片链接", "应有测试题", "已有测试题"], techRows)}

### 缺失测试题链接文件

${formatPathList(result.missingQuizLink)}

### 测试题链接格式异常文件

${formatPathList(result.invalidQuizLink)}
`;
}

const result = await audit();

if (args.has("--write-report")) {
  const reportPath = process.env.VITEPRESS_AUDIT_REPORT_PATH ?? defaultReportPath;
  await writeFile(reportPath, renderReport(result));
  console.log(`Wrote ${reportPath}`);
}

if (args.has("--json")) {
  console.log(JSON.stringify(result, null, 2));
} else {
  console.log(
    [
      `Markdown: ${result.totals.markdown}`,
      `Content pages: ${result.totals.contentPages}`,
      `Quick check missing/misplaced: ${result.totals.missingQuickCheck}/${result.totals.misplacedQuickCheck}`,
      `Tech index pages: ${result.totals.techIndexPages}`,
      `Quiz links missing/invalid: ${result.totals.missingQuizLink}/${result.totals.invalidQuizLink}`,
    ].join("\n"),
  );
}
