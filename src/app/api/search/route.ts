import { NextRequest } from "next/server";
import { searchVideosSimple, getChannelSubscribersMap } from "@/lib/youtube";
import type { SearchBody, VideoLite } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as SearchBody;
    const region = body.region ?? process.env.DEFAULT_REGION ?? "KR";
    const lang = body.lang ?? process.env.DEFAULT_LANG ?? "ko";
    const perChannel = body.perChannelLimit ?? 10;
    const minViews = body.minViews ?? 0;

    let pool: VideoLite[] = [];

    async function pushByKeyword(q: string) {
      const { items } = await searchVideosSimple({
        q, days: body.days ?? 7,
        regionCode: region, lang,
        duration: body.duration ?? "any",
        order: body.order ?? "relevance"
      });
      pool = pool.concat(items);
    }

    if (body.mode === "keyword" || body.mode === "mixed") {
      const kws = (body.keywords ?? []).slice(0, 20);
      for (const k of kws) await pushByKeyword(k);
    }
    // (채널 모드는 간단화를 위해 생략되어 있음)

    // 1) 1차 필터: 조회수 하한
    pool = pool.filter(v => v.viewCount >= minViews);

    // 2) 채널 구독자 수 조회
    const chMap = await getChannelSubscribersMap(pool.map(v => v.channelId));

    // 3) 메트릭 계산 (views/hour, view/sub 비율)
    const now = Date.now();
    for (const v of pool) {
      const hours = Math.max(1/60, (now - new Date(v.publishedAt).getTime()) / 36e5);
      const subs = chMap.get(v.channelId);
      v.channelSubscriberCount = (typeof subs === "number") ? subs : null;
      v.viewsPerHour = Math.round((v.viewCount / hours) * 100) / 100; // 소수 2자리
      v.viewToSubRatio = (subs && subs > 0) ? (v.viewCount / subs) : null;
    }

    // 4) 2차 필터: 구독자 최대, VPH, V/Sub
    if (typeof body.maxSubscribers === "number") {
      pool = pool.filter(v => (v.channelSubscriberCount ?? 0) <= body.maxSubscribers!);
    }
    if (typeof body.minViewsPerHour === "number") {
      pool = pool.filter(v => (v.viewsPerHour ?? 0) >= body.minViewsPerHour!);
    }
    if (typeof body.minViewToSubRatio === "number") {
      pool = pool.filter(v => (v.viewToSubRatio ?? 0) >= body.minViewToSubRatio!);
    }

    // 5) 정렬: 속도 필터가 있으면 속도로, 아니면 조회수로
    if (typeof body.minViewsPerHour === "number") {
      pool = pool.sort((a,b) => (b.viewsPerHour ?? 0) - (a.viewsPerHour ?? 0));
    } else if (typeof body.minViewToSubRatio === "number") {
      pool = pool.sort((a,b) => (b.viewToSubRatio ?? 0) - (a.viewToSubRatio ?? 0));
    } else {
      pool = pool.sort((a,b) => b.viewCount - a.viewCount);
    }

    // 6) 채널당 N개 제한
    const byCh = new Map<string, VideoLite[]>();
    for (const v of pool) {
      const arr = byCh.get(v.channelId) ?? [];
      if (arr.length < perChannel) arr.push(v);
      byCh.set(v.channelId, arr);
    }
    const final = [...byCh.values()].flat();

    return Response.json({ items: final.slice(0, 200) });
  } catch (err: any) {
    console.error("[/api/search] error:", err);
    return Response.json({ error: err?.message || String(err) }, { status: 500 });
  }
}