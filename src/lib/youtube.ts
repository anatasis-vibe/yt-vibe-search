// src/lib/youtube.ts
const API = "https://www.googleapis.com/youtube/v3";
const KEY = process.env.YOUTUBE_API_KEY!;

function toISODateNDaysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function parseISODurationToSec(iso: string): number {
  const m = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/.exec(iso);
  if (!m) return 0;
  const [_, h, min, s] = m;
  return (parseInt(h || "0") * 3600) + (parseInt(min || "0") * 60) + parseInt(s || "0");
}

export type SearchParams = {
  q?: string;
  channelId?: string;
  publishedAfter?: string;
  regionCode?: string;
  relevanceLanguage?: string;
  videoDuration?: "any" | "short" | "medium" | "long";
  order?: "relevance" | "date" | "viewCount";
  pageToken?: string;
  maxResults?: number;
};

async function ytSearch(params: SearchParams) {
  const url = new URL(`${API}/search`);
  url.searchParams.set("key", KEY);
  url.searchParams.set("part", "snippet");
  url.searchParams.set("type", "video");
  url.searchParams.set("maxResults", String(params.maxResults ?? 50));
  if (params.q) url.searchParams.set("q", params.q);
  if (params.channelId) url.searchParams.set("channelId", params.channelId);
  if (params.publishedAfter) url.searchParams.set("publishedAfter", params.publishedAfter);
  if (params.regionCode) url.searchParams.set("regionCode", params.regionCode);
  if (params.relevanceLanguage) url.searchParams.set("relevanceLanguage", params.relevanceLanguage);
  if (params.videoDuration) url.searchParams.set("videoDuration", params.videoDuration);
  if (params.order) url.searchParams.set("order", params.order);
  if (params.pageToken) url.searchParams.set("pageToken", params.pageToken);

  const res = await fetch(url.toString());
  if (!res.ok) {
    const errText = await res.text(); // 에러 본문까지 표시
    throw new Error(`search failed: ${res.status} :: ${errText}`);
  }
  return res.json() as Promise<{ items: any[]; nextPageToken?: string }>;
}

async function ytVideosList(ids: string[]) {
  const url = new URL(`${API}/videos`);
  url.searchParams.set("key", KEY);
  url.searchParams.set("part", "snippet,contentDetails,statistics");
  url.searchParams.set("id", ids.join(","));
  const res = await fetch(url.toString());
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`videos.list failed: ${res.status} :: ${errText}`);
  }
  return res.json() as Promise<{ items: any[] }>;
}

// ---------- 채널 통계 (구독자 수) ----------
async function ytChannelsList(ids: string[]) {
  const url = new URL(`${API}/channels`);
  url.searchParams.set("key", KEY);
  url.searchParams.set("part", "statistics");
  url.searchParams.set("id", ids.join(","));
  const res = await fetch(url.toString());
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`channels.list failed: ${res.status} :: ${errText}`);
  }
  return res.json() as Promise<{ items: any[] }>;
}

export async function getChannelSubscribersMap(channelIds: string[]) {
  const unique = Array.from(new Set(channelIds)).filter(Boolean);
  const chunks: string[][] = [];
  for (let i = 0; i < unique.length; i += 50) chunks.push(unique.slice(i, i + 50));

  const map = new Map<string, number>();
  for (const ch of chunks) {
    const j = await ytChannelsList(ch);
    for (const it of j.items ?? []) {
      const id = it.id as string;
      const subs = Number(it.statistics?.subscriberCount ?? 0);
      map.set(id, subs);
    }
  }
  return map;
}

// ---------- 간단 검색 ----------
export async function searchVideosSimple(opts: {
  q?: string;
  channelId?: string;
  days?: number;
  regionCode?: string;
  lang?: string;
  duration?: "any" | "short" | "medium" | "long";
  order?: "relevance" | "date" | "viewCount";
}) {
  const publishedAfter = opts.days ? toISODateNDaysAgo(opts.days) : undefined;

  const s = await ytSearch({
    q: opts.q,
    channelId: opts.channelId,
    publishedAfter,
    regionCode: opts.regionCode,
    relevanceLanguage: opts.lang,
    videoDuration: opts.duration ?? "any",
    order: opts.order ?? "relevance",
    maxResults: 50
  });

  const ids = s.items.map(i => i.id.videoId).filter(Boolean);
  if (ids.length === 0) return { items: [], nextPageToken: s.nextPageToken };

  const v = await ytVideosList(ids);

  const items = v.items.map((x): import("./types").VideoLite => ({
    videoId: x.id,
    title: x.snippet.title,
    description: x.snippet.description ?? "",
    channelId: x.snippet.channelId,
    channelTitle: x.snippet.channelTitle,
    publishedAt: x.snippet.publishedAt,
    durationSec: parseISODurationToSec(x.contentDetails.duration),
    viewCount: Number(x.statistics?.viewCount ?? 0),
    likeCount: x.statistics?.likeCount ? Number(x.statistics.likeCount) : undefined,
    tags: x.snippet.tags,
    thumbnails: {
      default: x.snippet.thumbnails?.default?.url,
      high: x.snippet.thumbnails?.high?.url
    }
  }));

  return { items, nextPageToken: s.nextPageToken };
}