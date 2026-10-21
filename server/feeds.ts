import { cacheLife } from "next/cache";
import { XMLParser } from "fast-xml-parser";
import type { FeedSource } from "@/lib/feeds";

export interface FeedItem {
  id: string;
  title: string;
  link: string;
  summary: string;
  publishedAt: string;
  image?: string;
  audioUrl?: string;
  durationSeconds?: number;
  sourceId: string;
  sourceName: string;
  lang: "en" | "ja";
  category: string;
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
  cdataPropName: "#cdata",
  trimValues: true,
  processEntities: true,
  htmlEntities: true,
  parseTagValue: false,
  parseAttributeValue: false,
});

type XmlNode = Record<string, unknown>;

function asArray<T>(value: T | T[] | undefined | null): T[] {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

function textOf(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (Array.isArray(value)) return textOf(value[0]);
  if (value && typeof value === "object") {
    const node = value as XmlNode;
    return textOf(node["#text"] ?? node["#cdata"] ?? node["@_href"] ?? "");
  }
  return "";
}

function stripHtml(value: string): string {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(value: string, max: number): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max).trim()}…`;
}

function linkOf(item: XmlNode): string {
  const links = asArray(item.link);
  for (const link of links) {
    if (typeof link === "string") return link;
    if (link && typeof link === "object") {
      const node = link as XmlNode;
      const rel = textOf(node["@_rel"]);
      if (!rel || rel === "alternate") {
        const href = textOf(node["@_href"] ?? node["#text"]);
        if (href) return href;
      }
    }
  }
  return textOf(item.id);
}

function audioOf(item: XmlNode, link: string): string {
  for (const enclosure of asArray(item.enclosure)) {
    if (!enclosure || typeof enclosure !== "object") continue;
    const node = enclosure as XmlNode;
    const url = textOf(node["@_url"] ?? node["@_href"] ?? node["#text"]);
    const type = textOf(node["@_type"]);
    if (url && (type.includes("audio") || /\.(mp3|m4a|ogg|aac)(\?|$)/i.test(url))) {
      return url.replace(/^http:\/\//i, "https://");
    }
  }

  for (const linkNode of asArray(item.link)) {
    if (!linkNode || typeof linkNode !== "object") continue;
    const node = linkNode as XmlNode;
    if (textOf(node["@_rel"]) === "enclosure") {
      const href = textOf(node["@_href"]);
      if (href) return href;
    }
  }

  if (link && /\.(mp3|m4a|ogg|aac)(\?|$)/i.test(link)) return link;
  return "";
}

function durationOf(item: XmlNode): number | undefined {
  const raw = textOf(item["itunes:duration"] ?? item["media:content"]);
  if (!raw) return undefined;
  if (/^\d+$/.test(raw)) return Number(raw);
  const parts = raw.split(":").map((part) => Number(part));
  if (parts.some((part) => Number.isNaN(part))) return undefined;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return undefined;
}

function imageOf(item: XmlNode): string | undefined {
  const candidates = [
    item["media:thumbnail"],
    item["media:content"],
    item["itunes:image"],
    item.image,
  ];
  for (const candidate of candidates) {
    for (const node of asArray(candidate)) {
      if (!node) continue;
      if (typeof node === "string") return node;
      if (typeof node === "object") {
        const url = textOf(
          (node as XmlNode)["@_url"] ??
            (node as XmlNode)["@_href"] ??
            (node as XmlNode)["#text"]
        );
        if (url) return url;
      }
    }
  }
  return undefined;
}

function parseDate(value: string, fallbackIndex: number): string {
  const date = value ? new Date(value) : null;
  if (date && !Number.isNaN(date.getTime())) return date.toISOString();
  return new Date(Date.now() - fallbackIndex * 60 * 60 * 1000).toISOString();
}

function normalizeItems(
  rawItems: XmlNode[],
  source: FeedSource,
  withAudio: boolean
): FeedItem[] {
  const limit = withAudio ? 8 : 12;
  const items: FeedItem[] = [];

  for (const item of rawItems) {
    if (!item || typeof item !== "object") continue;
    const title = stripHtml(textOf(item.title));
    if (!title) continue;
    const link = linkOf(item);
    const audioUrl = audioOf(item, link);
    if (withAudio && !audioUrl) continue;

    const description = stripHtml(
      textOf(
        item["content:encoded"] ??
          item.description ??
          item.summary ??
          item["media:description"] ??
          ""
      )
    );
    const published = textOf(item.pubDate ?? item.published ?? item.updated);
    const id =
      stripHtml(textOf(item.guid ?? item.id)) ||
      link ||
      `${source.id}-${items.length}`;

    items.push({
      id,
      title,
      link,
      summary: truncate(description, withAudio ? 260 : 480),
      publishedAt: parseDate(published, items.length),
      image: imageOf(item),
      audioUrl: audioUrl || undefined,
      durationSeconds: durationOf(item),
      sourceId: source.id,
      sourceName: source.name,
      lang: source.lang,
      category: source.category,
    });

    if (items.length >= limit) break;
  }

  return items;
}

export function parseFeedXml(
  xml: string,
  source: FeedSource,
  withAudio = source.category !== "news" && source.category !== "magazine"
): FeedItem[] {
  const doc = parser.parse(xml) as XmlNode;
  const rss = doc.rss as XmlNode | undefined;
  const channel = rss?.channel as XmlNode | undefined;
  const rdf = doc["rdf:RDF"] as XmlNode | undefined;
  const rawItems = asArray(
    (channel?.item ??
      rdf?.item ??
      (doc.feed as XmlNode | undefined)?.entry ??
      []) as XmlNode | XmlNode[]
  );
  return normalizeItems(rawItems, source, withAudio);
}

export async function getFeedItems(source: FeedSource): Promise<FeedItem[]> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 1800, expire: 3600 });

  const withAudio = source.category !== "news" && source.category !== "magazine";
  const response = await fetch(source.url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; LinguaReader/1.0; +https://lingua-irocy64.netlify.app)",
      Accept:
        "application/rss+xml, application/atom+xml, application/xml, text/xml, */*",
    },
    signal: AbortSignal.timeout(8000),
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`${source.name}: HTTP ${response.status}`);
  }

  const buffer = await response.arrayBuffer();
  const head = new TextDecoder("utf-8").decode(buffer.slice(0, 200));
  const declared = head.match(/encoding=["']([^"']+)["']/i)?.[1];
  let xml: string;
  try {
    xml = new TextDecoder(declared ?? "utf-8").decode(buffer);
  } catch {
    xml = new TextDecoder("utf-8").decode(buffer);
  }

  const items = parseFeedXml(xml, source, withAudio);
  return items;
}
