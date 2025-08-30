import { NextRequest } from "next/server";
import { searchVideosSimple } from "@/lib/youtube";
import { extractKeywords } from "@/lib/keywords";

export async function POST(req: NextRequest) {
  const body = await req.json() as { region?: string; lang?: string; days?: number; seed?: string };
  const region = body.region ?? process.env.DEFAULT_REGION ?? "KR";
  const lang = body.lang ?? process.env.DEFAULT_LANG ?? "ko";
  const days = body.days ?? 7;

  const q = body.seed ?? "";
  const { items } = await searchVideosSimple({
    q, days, regionCode: region, lang, order: "viewCount"
  });

  const text = items.slice(0,50).map(i => `${i.title}\n${i.description}`).join("\n");
  const { core, suggestedTags } = extractKeywords({ description: text });

  const longtail = core.slice(0,20).flatMap(k => [
    `${k} 추천`,
    `${k} 비교`,
    `${k} 방법`,
    `${k} 브이로그`,
  ]);

  return Response.json({
    core: core.slice(0,30),
    longtail: longtail.slice(0,40),
    suggestedTags
  });
}