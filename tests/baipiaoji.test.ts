import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { FetchLike } from "../src/lib/http";
import { parseBaipiaojiLimits } from "../src/lib/parse/baipiaoji";
import { SOURCE_DEFS } from "../src/lib/source-defs";
import { loadSource } from "../src/lib/sources";
import { responseFor } from "./helpers";

const NOW = Date.parse("2026-11-13T04:00:00.000Z");

/** SYNTHETIC limits.json payload. Not a live tool. */
const PAYLOAD = {
  title: "SYNTHETIC",
  generated: "2026-11-12",
  count: 3,
  tools: [
    {
      slug: "synthetic-a",
      name: "SYNTHETIC 工具 A",
      category: "chat",
      quota: "免费对话不限量，支持文件上传",
      wall: "免费档无公布上限",
      source: "SYNTHETIC",
      checked: "2026-08-13",
      page: "https://baipiaoji.com/tools/synthetic-a",
    },
    {
      slug: "synthetic-b",
      name: "SYNTHETIC 工具 B",
      category: "api",
      quota: "每月免费 100 万 tokens",
      wall: "",
      source: "SYNTHETIC",
      checked: "2026-08-13",
      page: "https://baipiaoji.com/tools/synthetic-b",
    },
    {
      slug: "synthetic-c",
      name: "SYNTHETIC 坏链接",
      category: "api",
      quota: "每月免费 1 万 tokens",
      wall: "",
      source: "SYNTHETIC",
      checked: "2026-08-13",
      page: "https://evil.example/tools/synthetic-c",
    },
  ],
};

describe("baipiaoji limits.json", () => {
  it("parses tools with composed titles and the generated date for every item", () => {
    const items = parseBaipiaojiLimits(PAYLOAD, NOW);
    assert.equal(items.length, 2);
    assert.equal(items[0]?.title, "SYNTHETIC 工具 A：免费对话不限量，支持文件上传");
    assert.equal(items[0]?.url, "https://baipiaoji.com/tools/synthetic-a");
    assert.equal(items[0]?.summary, "免费档无公布上限");
    assert.equal(items[0]?.publishedAt, Date.parse("2026-11-12"));
    assert.equal(items[0]?.expiresAt, null);
    assert.equal(items[1]?.summary, "每月免费 100 万 tokens");
    assert.equal(items[1]?.publishedAt, Date.parse("2026-11-12"));
  });

  it("fails honestly on a missing generated date or tool list", () => {
    assert.throws(() => parseBaipiaojiLimits({ tools: PAYLOAD.tools }, NOW), /生成日期/);
    assert.throws(() => parseBaipiaojiLimits({ generated: "2026-11-12" }, NOW), /工具列表/);
    assert.throws(() => parseBaipiaojiLimits({ generated: "2026-11-12", tools: [] }, NOW), /为空/);
    assert.throws(
      () => parseBaipiaojiLimits({ generated: "2026-11-12", tools: [PAYLOAD.tools[2]] }, NOW),
      /解析/,
    );
  });

  it("routes through loadSource for the baipiaoji definition", async () => {
    const source = SOURCE_DEFS.find((entry) => entry.id === "baipiaoji")!;
    const fetchImpl: FetchLike = async () => responseFor(JSON.stringify(PAYLOAD), source.url);
    const loaded = await loadSource(source, { fetchImpl, signal: new AbortController().signal, now: NOW });
    assert.equal(loaded.items.length, 2);
    assert.equal(loaded.finalUrl, source.url);
  });
});
