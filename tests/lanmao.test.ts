import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { FetchLike } from "../src/lib/http";
import { parseLanmaoOffers } from "../src/lib/parse/lanmao";
import { SOURCE_DEFS } from "../src/lib/source-defs";
import { loadSource } from "../src/lib/sources";
import { responseFor } from "./helpers";

const NOW = Date.parse("2026-11-13T04:00:00.000Z");

/** SYNTHETIC lanmao table. Not a live offer. */
const SAMPLE = [
  "# SYNTHETIC 懒猫额度表",
  "",
  "名字 | 免费额度 | 门槛 | 地区 | 核实日期 | 详情",
  "",
  "SYNTHETIC 模型 A | 免费层每天 1,000 次调用 | 邮箱注册 | 海外 | 2026-11-12 | https://lanmao.ai/zh/o/synthetic-a/",
  "SYNTHETIC 模型 B | 新用户免费 100 元额度 | 国内手机号 | 国内直连 | 2026-11-10 | https://lanmao.ai/zh/o/synthetic-b/",
  "SYNTHETIC 坏链接 | 免费层每天 1 次调用 | 邮箱注册 | 海外 | 2026-11-12 | https://evil.example/o/x/",
  "SYNTHETIC 坏日期 | 免费层每天 1 次调用 | 邮箱注册 | 海外 | 未知 | https://lanmao.ai/zh/o/synthetic-d/",
  "",
].join("\n");

describe("lanmao markdown table", () => {
  it("parses rows with composed titles, detail links and verification dates", () => {
    const items = parseLanmaoOffers(SAMPLE, NOW);
    assert.equal(items.length, 2);
    assert.equal(items[0]?.title, "SYNTHETIC 模型 A：免费层每天 1,000 次调用");
    assert.equal(items[0]?.url, "https://lanmao.ai/zh/o/synthetic-a/");
    assert.equal(items[0]?.summary, "门槛：邮箱注册；地区：海外");
    assert.equal(items[0]?.publishedAt, Date.parse("2026-11-12"));
    assert.equal(items[0]?.expiresAt, null);
    assert.equal(items[1]?.publishedAt, Date.parse("2026-11-10"));
  });

  it("keeps a pipe inside the quota column by anchoring columns from both ends", () => {
    const markdown = [
      "名字 | 免费额度 | 门槛 | 地区 | 核实日期 | 详情",
      "SYNTHETIC 模型 C | 免费 A 套餐 | B 套餐 | 邮箱注册 | 海外 | 2026-11-11 | https://lanmao.ai/zh/o/synthetic-c/",
    ].join("\n");
    const [item] = parseLanmaoOffers(markdown, NOW);
    assert.equal(item?.title, "SYNTHETIC 模型 C：免费 A 套餐|B 套餐");
    assert.equal(item?.summary, "门槛：邮箱注册；地区：海外");
  });

  it("fails honestly when the body is not the offers table", () => {
    assert.throws(() => parseLanmaoOffers("SYNTHETIC challenge page", NOW), /阻断|解析/);
    assert.throws(
      () => parseLanmaoOffers("名字 | 免费额度 | 门槛 | 地区 | 核实日期 | 详情\n", NOW),
      /阻断|解析/,
    );
  });

  it("routes through loadSource for the lanmao definition", async () => {
    const source = SOURCE_DEFS.find((entry) => entry.id === "lanmao")!;
    const fetchImpl: FetchLike = async () => responseFor(SAMPLE, source.url);
    const loaded = await loadSource(source, { fetchImpl, signal: new AbortController().signal, now: NOW });
    assert.equal(loaded.items.length, 2);
    assert.equal(loaded.finalUrl, source.url);
  });
});
