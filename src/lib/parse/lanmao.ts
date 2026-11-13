import { MAX_FEED_ITEMS } from "../config";
import { publishTime } from "../publish-time";
import { cleanTitle, excerpt } from "../text";
import type { ParsedItem } from "../types";

const DETAIL_URL = /^https:\/\/lanmao\.ai\/zh\/o\/[^/\s]+\/$/;

/**
 * Lanmao publishes a Markdown table, one offer per row:
 * 名字 | 免费额度 | 门槛 | 地区 | 核实日期 | 详情
 * The detail column is a lanmao.ai page per offer. The quota column may
 * contain `|`, so columns are anchored from both ends: name is first,
 * gate/region/date/detail are the last four, quota is everything between.
 * Title composes the source's own name and quota fields so the board's
 * title-based classifier can see the offer; nothing is invented.
 * publishedAt is the row's own verification date, so only recently
 * verified offers stay inside the 7-day window.
 */
export function parseLanmaoOffers(markdown: string, now = Date.now()): ParsedItem[] {
  if (!markdown.includes("lanmao.ai/zh/o/")) {
    throw new Error("返回内容不是懒猫额度表，可能被阻断");
  }
  const items: ParsedItem[] = [];
  for (const line of markdown.split("\n")) {
    if (items.length >= MAX_FEED_ITEMS) break;
    const cells = line.split("|").map((cell) => cell.trim());
    if (cells.length < 6) continue;
    const name = cells[0] ?? "";
    const detailUrl = cells[cells.length - 1] ?? "";
    const verified = cells[cells.length - 2] ?? "";
    const region = cells[cells.length - 3] ?? "";
    const gate = cells[cells.length - 4] ?? "";
    const quota = cells.slice(1, cells.length - 4).join("|").trim();
    if (!name || !quota || !DETAIL_URL.test(detailUrl)) continue;
    const publishedAt = publishTime(verified, now);
    if (publishedAt == null) continue;
    const title = cleanTitle(`${name}：${quota}`);
    if (!title) continue;
    items.push({
      url: detailUrl,
      title,
      summary: excerpt(`门槛：${gate}；地区：${region}`),
      publishedAt,
      expiresAt: null,
    });
  }
  if (items.length === 0) {
    throw new Error("未能从 Markdown 表格解析出条目");
  }
  return items;
}
