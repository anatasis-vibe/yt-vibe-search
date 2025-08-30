import { NextRequest } from "next/server";
import { extractKeywords } from "@/lib/keywords";

const API = "https://www.googleapis.com/youtube/v3";
const KEY = process.env.YOUTUBE_API_KEY!;

async function videosList(id: string){
  const url = new URL(`${API}/videos`);
  url.searchParams.set("key", KEY);
  url.searchParams.set("part", "snippet");
  url.searchParams.set("id", id);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("videos.list failed");
  const j = await res.json();
  return j.items?.[0];
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const videoId = searchParams.get("videoId");
  if (!videoId) return new Response("videoId required", { status: 400 });

  const v = await videosList(videoId);
  if (!v) return new Response("not found", { status: 404 });

  const title = v.snippet?.title ?? "";
  const description = v.snippet?.description ?? "";
  const tags = v.snippet?.tags ?? [];

  const { core, suggestedTags } = extractKeywords({ title, description, tags });
  return Response.json({ videoId, title, core, suggestedTags });
}