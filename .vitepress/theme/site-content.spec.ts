import { describe, expect, it } from "vitest";
import configSource from "../config.mts?raw";
import homeEn from "../../src/index.md?raw";
import homeZh from "../../src/zh/index.md?raw";

const sidebarSource = configSource.slice(configSource.lastIndexOf("sidebar: ["));

function collapsedEntries() {
  return sidebarSource.split("\n").flatMap((line) => {
    const indent = (line.match(/^\s*/) ?? [""])[0].length;
    return [...line.matchAll(/collapsed:\s*(true|false)/g)].map((match) => ({
      indent,
      value: match[1],
    }));
  });
}

describe("个人站主页项目导览", () => {
  const projects = [
    ["https://pal.illegalscreed.cn/", "/projects/webpal.png"],
    ["https://algo.illegalscreed.cn/", "/projects/algorithm-visualizer.png"],
    ["https://lumideck.illegalscreed.cn/", "/projects/slide-agent.png"],
    ["https://quiz.illegalscreed.cn/", "/projects/programmer-quiz.png"],
  ];

  it("中英文主页都明确列出四个项目入口和真实截图", () => {
    for (const [link, image] of projects) {
      expect(homeEn).toContain(link);
      expect(homeZh).toContain(link);
      expect(homeEn).toContain(image);
      expect(homeZh).toContain(image);
    }
  });
});

describe("中文侧边栏折叠层级", () => {
  it("所有一级目录展开，嵌套目录保持折叠", () => {
    const topLevelGroups = [
      ...sidebarSource.matchAll(/^ {12}text: "([^"]+)"/gm),
    ];
    const entries = collapsedEntries();
    const topLevelEntries = entries.filter((entry) => entry.indent === 12);
    const nestedEntries = entries.filter((entry) => entry.indent > 12);

    expect(topLevelEntries).toHaveLength(topLevelGroups.length);
    expect(topLevelEntries.every((entry) => entry.value === "false")).toBe(true);
    expect(nestedEntries.some((entry) => entry.value === "false")).toBe(false);
  });
});
