export type SourceDef = {
  id: string;
  name: string;
  url: string;
  /** Item links must stay on the source's own domain: feed content is untrusted input. */
  allowedHosts: string[];
};

/**
 * Fixed sources. Callers cannot substitute URLs.
 * V2EX must be the plural `promotions.xml`. `promotion.xml` returns an empty feed.
 * LINUX DO must go through the Jina reader. Direct category RSS is not used.
 * 异次元 is requested at the URL that 301-redirects; the client follows it.
 * jidan uses the site RSS: the /c/credit category page has no per-item dates.
 * lanmao is a Markdown table; each row's date is its own verification date.
 * baipiaoji is limits.json; the file's `generated` date is every item's date.
 */
export const SOURCE_DEFS: SourceDef[] = [
  {
    id: "linuxdo",
    name: "LINUX DO福利羊毛",
    url: "https://r.jina.ai/https://linux.do/c/welfare/36.rss",
    allowedHosts: ["linux.do"],
  },
  {
    id: "v2ex",
    name: "V2EX推广",
    url: "https://www.v2ex.com/feed/promotions.xml",
    allowedHosts: ["v2ex.com"],
  },
  {
    id: "epic",
    name: "Epic",
    url: "https://store-site-backend-static.ak.epicgames.com/freeGamesPromotions?locale=zh-CN&country=CN&allowCountries=CN",
    allowedHosts: ["store.epicgames.com"],
  },
  {
    id: "nodeseek",
    name: "NodeSeek",
    url: "https://rss.nodeseek.com/",
    allowedHosts: ["nodeseek.com"],
  },
  {
    id: "appinn",
    name: "小众软件",
    url: "https://www.appinn.com/feed/",
    allowedHosts: ["appinn.com"],
  },
  {
    id: "ghxi",
    name: "果核剥壳",
    url: "https://www.ghxi.com/feed",
    allowedHosts: ["ghxi.com"],
  },
  {
    id: "iplaysoft",
    name: "异次元软件世界",
    url: "https://www.iplaysoft.com/feed",
    allowedHosts: ["iplaysoft.com"],
  },
  {
    id: "lanmao",
    name: "懒猫免费额度",
    url: "https://lanmao.ai/zh/offers.md",
    allowedHosts: ["lanmao.ai"],
  },
  {
    id: "jidan",
    name: "赛博鸡蛋",
    url: "https://jidan.si/rss.xml",
    allowedHosts: ["jidan.si"],
  },
  {
    id: "baipiaoji",
    name: "白嫖计",
    url: "https://baipiaoji.com/limits.json",
    allowedHosts: ["baipiaoji.com"],
  },
];

export function sourceName(id: string): string {
  return SOURCE_DEFS.find((source) => source.id === id)?.name ?? id;
}
