import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { FetchLike } from "../src/lib/http";
import { parseFeed } from "../src/lib/parse/feed";
import { SOURCE_DEFS } from "../src/lib/source-defs";
import { loadSource } from "../src/lib/sources";
import { responseFor, rssFeed } from "./helpers";

const NOW = Date.parse("2026-11-13T04:00:00.000Z");
const RECENT = "Thu, 12 Nov 2026 04:32:34 +0000";

/** SYNTHETIC jidan RSS shape. Not a live offer. */
const FEED = rssFeed([
  {
    title: "SYNTHETIC 免费 GPU：每周 30 小时，不用绑卡",
    link: "https://jidan.si/free/999-synthetic-free-gpu",
    pubDate: RECENT,
    description: "SYNTHETIC 每周免费 GPU 额度说明。",
  },
  {
    title: "phishing link",
    link: "https://evil.example/steal",
    pubDate: RECENT,
    description: "SYNTHETIC off-domain item.",
  },
]);

describe("jidan RSS", () => {
  it("parses jidan items with title, link, pubDate and description", () => {
    const [item] = parseFeed(FEED, NOW);
    assert.equal(item?.title, "SYNTHETIC 免费 GPU：每周 30 小时，不用绑卡");
    assert.equal(item?.url, "https://jidan.si/free/999-synthetic-free-gpu");
    assert.equal(item?.summary, "SYNTHETIC 每周免费 GPU 额度说明。");
    assert.equal(item?.publishedAt, Date.parse(RECENT));
    assert.equal(item?.expiresAt, null);
  });

  it("drops off-domain item links through loadSource", async () => {
    const source = SOURCE_DEFS.find((entry) => entry.id === "jidan")!;
    const fetchImpl: FetchLike = async () => responseFor(FEED, source.url);
    const loaded = await loadSource(source, { fetchImpl, signal: new AbortController().signal, now: NOW });
    assert.equal(loaded.items.length, 1);
    assert.equal(loaded.items[0]?.url, "https://jidan.si/free/999-synthetic-free-gpu");
  });
});
