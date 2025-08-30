"use client";
import { useState } from "react";
import { SettingsCard } from "@/components/SettingsCard";
import { ResultsTable } from "@/components/ResultsTable";
import type { SearchBody, VideoLite } from "@/lib/types";

export default function Home() {
  const [items, setItems] = useState<VideoLite[]>([]);
  const [busy, setBusy] = useState(false);

  async function onSearch(b: SearchBody) {
    setBusy(true);
    try {
      const toList = (val: any) =>
        typeof val === "string"
          ? val.split(/\r?\n/).map(s => s.trim()).filter(Boolean)
          : Array.isArray(val) ? val : [];

      const body: SearchBody = {
        ...b,
        channels: toList((b as any).channels),
        keywords: toList((b as any).keywords)
      };

      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      // 응답이 JSON이 아닐 때를 대비해 먼저 텍스트로 받고 파싱
      const raw = await res.text();
      let json: any = {};
      try {
        json = raw ? JSON.parse(raw) : {};
      } catch {
        throw new Error(`Non-JSON response: ${raw.slice(0, 200)}`);
      }

      if (!res.ok) {
        throw new Error(json?.error || `HTTP ${res.status}`);
      }

      setItems(json.items ?? []);
    } catch (e: any) {
      console.error(e);
      alert(`검색 실패: ${e.message}`);
      setItems([]);
    } finally {
      setBusy(false);
    }
  }

  async function extractFromVideo() {
    const id = prompt("키워드를 뽑을 YouTube videoId 또는 전체 URL을 입력하세요.");
    if (!id) return;
    const videoId = id.includes("watch?v=")
      ? new URL(id).searchParams.get("v")
      : id.replace(/^.*\/shorts\//, "").replace(/^.*v=/, "");
    if (!videoId) return alert("videoId를 찾지 못했습니다.");

    const res = await fetch(`/api/keywords/from-video?videoId=${videoId}`);
    const json = await res.json();
    alert(`핵심 키워드(일부):\n${json.core.slice(0, 20).join(", ")}`);
  }

  async function inspire() {
    const seed = prompt("씨앗 키워드(비워도 됨):");
    const res = await fetch("/api/inspire", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seed })
    });
    const json = await res.json();
    alert(`영감 키워드(일부):\n${json.core.slice(0, 20).join(", ")}`);
  }

  return (
    <main className="mx-auto max-w-6xl p-6 grid gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">YouTube Hot Finder (MVP)</h1>
        <div className="flex gap-2">
          <button onClick={extractFromVideo} className="px-3 py-2 rounded border">
            레퍼런스에서 추출
          </button>
          <button onClick={inspire} className="px-3 py-2 rounded border">
            영감 받기
          </button>
        </div>
      </div>

      <SettingsCard onSearch={onSearch} />
      {busy ? <div>검색중...</div> : <ResultsTable items={items} />}
    </main>
  );
}