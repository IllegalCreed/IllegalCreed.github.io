#!/usr/bin/env node
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const websiteRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const srcRoot = path.join(websiteRoot, "src", "zh");
const defaultReportPath =
  "/Users/zhangxu/illegal/quiz-monorepo/docs/audits/20260710-vitepress-content-baseline.md";
const args = new Set(process.argv.slice(2));

// 这些根级页面服务于站点介绍或 VitePress 脚手架演示，不属于技术节点内容页。
const QUICK_CHECK_EXCLUSIONS = new Map([
  ["src/zh/api-examples.md", "VitePress 运行时 API 脚手架示例"],
  ["src/zh/CV.md", "个人简历"],
  ["src/zh/markdown-examples.md", "VitePress Markdown 脚手架示例"],
  ["src/zh/start.md", "站点使用说明"],
]);

// 版本说明允许自然语言、vN、语义版本、技术名 + 主版本及常见运行时基线。
const VERSION_SIGNAL_PATTERN =
  /(?:版本|基于|截至|适用|\bv\d+(?:\.\d+)*(?:\.x)?\b|\b\d+\.(?:\d+|x)(?:\.\d+)?\b|\b[A-Za-z][\w.-]*\s+(?:v\s*)?\d+(?:\.\d+)*(?:\.x|\+)?\b|ES20\d{2}|Node(?:\.js)?\s*(?:>=|≥|v)?\s*\d+|浏览器)/i;

function toPosix(filePath) {
  return filePath.split(path.sep).join("/");
}

function relativePath(filePath) {
  return toPosix(path.relative(websiteRoot, filePath));
}

/**
 * 将 Markdown 文件转换为 VitePress cleanUrls 路由。
 */
function pageRoute(fileRel) {
  const sourceRel = fileRel.replace(/^src\//, "");
  if (sourceRel.endsWith("/index.md")) {
    return `/${sourceRel.slice(0, -"index.md".length)}`;
  }
  return `/${sourceRel.replace(/\.md$/, "")}`;
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

function getVersionAnalysis(text) {
  const lines = stripFrontmatter(text).split(/\r?\n/);
  let index = lines.findIndex((line) => /^#\s+/.test(line.trim()));
  if (index === -1) return { status: "missing", text: null };

  index += 1;
  while (index < lines.length && lines[index].trim() === "") index += 1;

  const quote = [];
  while (index < lines.length && lines[index].trim().startsWith(">")) {
    quote.push(lines[index].trim().replace(/^>\s?/, ""));
    index += 1;
  }

  if (quote.length === 0) return { status: "missing", text: null };

  const versionText = quote.join(" ").trim();
  const normalizedVersionText = versionText.replace(/[`*_]/g, "");
  return {
    status: VERSION_SIGNAL_PATTERN.test(normalizedVersionText)
      ? "ok"
      : "unspecified",
    text: versionText,
  };
}

function getQuickCheckAnalysis(text) {
  if (!hasHeading(text, "速查")) {
    return {
      status: "missing",
      characters: 0,
      listItems: 0,
      tableRows: 0,
      codeFences: 0,
      links: 0,
    };
  }

  const body = stripFrontmatter(text);
  const lines = body.split(/\r?\n/);
  let index = lines.findIndex((line) => /^#\s+/.test(line.trim()));
  if (index === -1) {
    return {
      status: "misplaced",
      characters: 0,
      listItems: 0,
      tableRows: 0,
      codeFences: 0,
      links: 0,
    };
  }

  index += 1;
  while (index < lines.length && lines[index].trim() === "") index += 1;

  if (lines[index]?.trim().startsWith(">")) {
    while (index < lines.length && lines[index].trim().startsWith(">"))
      index += 1;
    while (index < lines.length && lines[index].trim() === "") index += 1;
  }

  const quickCheckIndex = lines.findIndex((line) => line.trim() === "## 速查");
  const nextHeadingIndex = lines.findIndex(
    (line, lineIndex) =>
      lineIndex > quickCheckIndex && /^##\s+/.test(line.trim()),
  );
  const section = lines
    .slice(
      quickCheckIndex + 1,
      nextHeadingIndex === -1 ? lines.length : nextHeadingIndex,
    )
    .join("\n")
    .trim();
  const listItems = (section.match(/^\s*(?:[-*]|\d+\.)\s+/gm) ?? []).length;
  const tableRows = (section.match(/^\s*\|.*\|\s*$/gm) ?? []).filter(
    (line) => !/^\s*\|(?:\s*:?-+:?\s*\|)+\s*$/.test(line),
  ).length;
  const codeFences = Math.floor(
    (section.match(/^\s*(?:```|~~~)/gm) ?? []).length / 2,
  );
  const links =
    (section.match(/\[[^\]]+\]\([^)]+\)/g) ?? []).length +
    (section.match(/<https?:\/\/[^>]+>/g) ?? []).length;
  const characters = section.replace(/[`*_#>|:\-\s]/g, "").length;

  return {
    status:
      lines[index]?.trim() !== "## 速查"
        ? "misplaced"
        : section === ""
          ? "empty"
          : "ok",
    characters,
    listItems,
    tableRows,
    codeFences,
    links,
  };
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
  return [...counts.entries()].sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
  );
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
    const quickCheckExclusionReason = QUICK_CHECK_EXCLUSIONS.get(file) ?? null;
    const quickCheckRequired = !isIndex && !quickCheckExclusionReason;
    const quickCheck = quickCheckRequired ? getQuickCheckAnalysis(text) : null;
    const version = quickCheckRequired ? getVersionAnalysis(text) : null;
    const hasDocLink = hasHeading(text, "文档地址");
    const hasSlideLink = hasHeading(text, "幻灯片地址");
    const hasQuizLink = hasHeading(text, "测试题");
    const slideHrefMatch = text.match(/(\/SlideStack\/([^\/"'\s)]+)\/?)/);
    const quizHrefMatch = text.match(
      /(https:\/\/quiz\.illegalscreed\.cn\/\?category=([^"'\s)]+))/,
    );
    pages.push({
      file,
      route: pageRoute(file),
      title: getTitle(text, file),
      isIndex,
      quickCheckRequired,
      quickCheckExclusionReason,
      quickCheck,
      version,
      hasDocLink,
      hasSlideLink,
      hasQuizLink,
      slideHref: slideHrefMatch?.[1] ?? null,
      slidePackage: slideHrefMatch?.[2] ?? null,
      quizHref: quizHrefMatch?.[1] ?? null,
      quizCategory: quizHrefMatch?.[2] ?? null,
      quickCheckStatus: isIndex
        ? "index"
        : quickCheckExclusionReason
          ? "excluded"
          : quickCheck.status,
    });
  }

  const indexPages = pages.filter((page) => page.isIndex);
  const contentPages = pages.filter((page) => page.quickCheckRequired);
  const excludedQuickCheck = pages.filter(
    (page) => page.quickCheckStatus === "excluded",
  );
  const techIndexPages = indexPages.filter(
    (page) => page.hasDocLink || page.hasSlideLink || page.hasQuizLink,
  );
  const pagesExpectingQuiz = techIndexPages.filter(
    (page) => page.hasDocLink || page.hasSlideLink,
  );
  const missingQuickCheck = contentPages.filter(
    (page) => page.quickCheckStatus === "missing",
  );
  const misplacedQuickCheck = contentPages.filter(
    (page) => page.quickCheckStatus === "misplaced",
  );
  const emptyQuickCheck = contentPages.filter(
    (page) => page.quickCheckStatus === "empty",
  );
  const missingVersion = contentPages.filter(
    (page) => page.version.status === "missing",
  );
  const unspecifiedVersion = contentPages.filter(
    (page) => page.version.status === "unspecified",
  );
  const missingQuizLink = pagesExpectingQuiz.filter(
    (page) => !page.hasQuizLink,
  );
  const invalidQuizLink = pagesExpectingQuiz.filter(
    (page) => page.hasQuizLink && !page.quizCategory,
  );

  return {
    generatedAt: new Date().toISOString(),
    totals: {
      markdown: pages.length,
      indexPages: indexPages.length,
      contentPages: contentPages.length,
      excludedQuickCheck: excludedQuickCheck.length,
      techIndexPages: techIndexPages.length,
      docLinks: techIndexPages.filter((page) => page.hasDocLink).length,
      slideLinks: techIndexPages.filter((page) => page.hasSlideLink).length,
      quizLinks: techIndexPages.filter((page) => page.hasQuizLink).length,
      expectedQuizLinks: pagesExpectingQuiz.length,
      quickCheckOk: contentPages.filter(
        (page) => page.quickCheckStatus === "ok",
      ).length,
      missingQuickCheck: missingQuickCheck.length,
      misplacedQuickCheck: misplacedQuickCheck.length,
      emptyQuickCheck: emptyQuickCheck.length,
      versionOk: contentPages.filter((page) => page.version.status === "ok")
        .length,
      missingVersion: missingVersion.length,
      unspecifiedVersion: unspecifiedVersion.length,
      missingQuizLink: missingQuizLink.length,
      invalidQuizLink: invalidQuizLink.length,
    },
    pages,
    excludedQuickCheck,
    techIndexPages,
    missingQuickCheck,
    misplacedQuickCheck,
    emptyQuickCheck,
    missingVersion,
    unspecifiedVersion,
    missingQuizLink,
    invalidQuizLink,
  };
}

function renderReport(result) {
  const quickRows = countByBucket(
    result.pages.filter((page) => page.quickCheckRequired),
  ).map(([bucket, total]) => {
    const pages = result.pages.filter(
      (page) => page.quickCheckRequired && sectionBucket(page.file) === bucket,
    );
    const missing = pages.filter(
      (page) => page.quickCheckStatus === "missing",
    ).length;
    const misplaced = pages.filter(
      (page) => page.quickCheckStatus === "misplaced",
    ).length;
    const empty = pages.filter(
      (page) => page.quickCheckStatus === "empty",
    ).length;
    return [
      bucket,
      String(total),
      String(total - missing - misplaced - empty),
      String(missing),
      String(misplaced),
      String(empty),
    ];
  });

  const techRows = countByBucket(
    result.pages.filter((page) => page.isIndex),
  ).map(([bucket]) => {
    const pages = result.pages.filter(
      (page) => page.isIndex && sectionBucket(page.file) === bucket,
    );
    const techPages = pages.filter(
      (page) => page.hasDocLink || page.hasSlideLink || page.hasQuizLink,
    );
    const expectedQuiz = techPages.filter(
      (page) => page.hasDocLink || page.hasSlideLink,
    );
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
> 规则口径：技术内容页应在标题和版本说明后紧跟 \`## 速查\`；\`index.md\` 概览页及明确登记的根级非技术页面除外。带 \`## 文档地址\` 或 \`## 幻灯片地址\` 的技术节点首页应带 \`## 测试题\`。

## 摘要

| 指标 | 数量 |
| --- | ---: |
| Markdown 总数 | ${result.totals.markdown} |
| index 概览页 | ${result.totals.indexPages} |
| 内容页（需速查） | ${result.totals.contentPages} |
| 非技术页（免速查） | ${result.totals.excludedQuickCheck} |
| 速查合规 | ${result.totals.quickCheckOk} |
| 缺失速查 | ${result.totals.missingQuickCheck} |
| 速查位置不合规 | ${result.totals.misplacedQuickCheck} |
| 空速查 | ${result.totals.emptyQuickCheck} |
| 版本说明合规 | ${result.totals.versionOk} |
| 缺失版本说明块 | ${result.totals.missingVersion} |
| 版本说明未给出基线 | ${result.totals.unspecifiedVersion} |
| 技术节点首页 | ${result.totals.techIndexPages} |
| 文档链接首页 | ${result.totals.docLinks} |
| 幻灯片链接首页 | ${result.totals.slideLinks} |
| 应有测试题链接首页 | ${result.totals.expectedQuizLinks} |
| 已有测试题链接首页 | ${result.totals.quizLinks} |
| 缺失测试题链接首页 | ${result.totals.missingQuizLink} |
| 测试题链接格式异常 | ${result.totals.invalidQuizLink} |

## 速查审计

### 免速查页面

${markdownTable(
  ["文件", "原因"],
  result.excludedQuickCheck.map((page) => [
    `\`${page.file}\``,
    page.quickCheckExclusionReason,
  ]),
)}

${markdownTable(
  ["目录", "内容页", "合规", "缺失", "位置不合规", "空速查"],
  quickRows,
)}

### 缺失速查文件

${formatPathList(result.missingQuickCheck)}

### 速查位置不合规文件

${formatPathList(result.misplacedQuickCheck)}

### 空速查文件

${formatPathList(result.emptyQuickCheck)}

## 版本说明审计

### 缺失版本说明块

${formatPathList(result.missingVersion)}

### 版本说明未给出基线

${formatPathList(result.unspecifiedVersion)}

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
  const reportPath =
    process.env.VITEPRESS_AUDIT_REPORT_PATH ?? defaultReportPath;
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
      `Quick check missing/misplaced/empty: ${result.totals.missingQuickCheck}/${result.totals.misplacedQuickCheck}/${result.totals.emptyQuickCheck}`,
      `Version missing/unspecified: ${result.totals.missingVersion}/${result.totals.unspecifiedVersion}`,
      `Tech index pages: ${result.totals.techIndexPages}`,
      `Quiz links missing/invalid: ${result.totals.missingQuizLink}/${result.totals.invalidQuizLink}`,
    ].join("\n"),
  );
}
