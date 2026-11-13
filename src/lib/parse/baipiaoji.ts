import { MAX_FEED_ITEMS } from "../config";
import { publishTime } from "../publish-time";
import { cleanTitle, excerpt } from "../text";
import type { ParsedItem } from "../types";

const TOOL_URL = /^https:\/\/baipiaoji\.com\/tools\/[^/\s]+$/;

type BaipiaojiTool = {
  slug?: unknown;
  name?: unknown;
  quota?: unknown;
  wall?: unknown;
  page?: unknown;
};

/**
 * Baipiaoji publishes limits.json: { generated, count, tools: [...] }.
 * Each tool has a name, a quota paragraph, a wall note and an on-site page.
 * publishedAt is the file's `generated` date for every tool: the snapshot
 * is regenerated as a whole, while individual `checked` dates go stale
 * (most are months old) and would admit nothing. When the publisher stops
 * regenerating, entries age out of the 7-day window on their own.
 * Title composes the source's own name and quota fields; summary uses the
 * wall note when present, otherwise the quota text. License is CC BY 4.0;
 * the board shows the source name and links each item to its tool page.
 */
export function parseBaipiaojiLimits(payload: unknown, now = Date.now()): ParsedItem[] {
  const root = payload as { generated?: unknown; tools?: unknown };
  const generated = typeof root?.generated === "string" ? publishTime(root.generated, now) : null;
  if (generated == null) throw new Error("白嫖计响应缺少有效的生成日期");
  if (!Array.isArray(root?.tools)) throw new Error("白嫖计响应缺少工具列表");
  if (root.tools.length === 0) throw new Error("白嫖计工具列表为空");
  const items: ParsedItem[] = [];
  for (const raw of root.tools.slice(0, MAX_FEED_ITEMS)) {
    if (!raw || typeof raw !== "object") continue;
    const tool = raw as BaipiaojiTool;
    if (typeof tool.name !== "string" || !tool.name.trim()) continue;
    if (typeof tool.page !== "string" || !TOOL_URL.test(tool.page)) continue;
    if (typeof tool.quota !== "string" || !tool.quota.trim()) continue;
    const title = cleanTitle(`${tool.name.trim()}：${tool.quota.trim()}`);
    if (!title) continue;
    const wall = typeof tool.wall === "string" ? tool.wall : "";
    items.push({
      url: tool.page,
      title,
      summary: excerpt(wall || tool.quota),
      publishedAt: generated,
      expiresAt: null,
    });
  }
  if (items.length === 0) {
    throw new Error("未能从白嫖计响应解析出条目");
  }
  return items;
}
