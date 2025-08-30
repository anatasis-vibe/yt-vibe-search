"use client";
import { useState } from "react";
import { SettingsCard } from "@/components/SettingsCard";
import { ResultsTable } from "@/components/ResultsTable";
import type { SearchBody, VideoLite } from "@/lib/types";
import { downloadCsv } from "@/lib/csv";

export default function Home() {
  const [items, setItems] = useState<VideoLite[]>([]);
  const [busy, setBusy] = useState(false);

  async function onSearch(b: SearchBody) {
    setBusy(true);
    const toList = (val: any) =>
      typeof val === "string"
        ? val.split(/\r?\n/).map(s => s.trim()).filter(Boolean)
        : Array.isArray(val) ? val : [];

    const body: SearchBody = {
      ...b,
      channels: toList(b.channels),
      keywords: toList(b.keywords)
    };

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(`search failed: ${res.status} :: ${t}`);
      }
      const json = await res.json();
      setItems(json.items ?? []);
    } catch (err: any) {
      alert(`검색 실패: ${err?.message ?? err}`);
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

    try {
      const res = await fetch(`/api/keywords/from-video?videoId=${videoId}`);
      const json = await res.json();
      alert(`핵심 키워드(일부):\n${json.core.slice(0, 20).join(", ")}`);
    } catch (e: any) {
      alert(`추출 실패: ${e?.message ?? e}`);
    }
  }

  async function inspire() {
    const seed = prompt("씨앗 키워드(비워도 됨):");
    try {
      const res = await fetch("/api/inspire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seed })
      });
      const json = await res.json();
      alert(`영감 키워드(일부):\n${json.core.slice(0, 20).join(", ")}`);
    } catch (e: any) {
      alert(`실패: ${e?.message ?? e}`);
    }
  }

  function exportCsv() {
    if (items.length === 0) return alert("내보낼 결과가 없습니다.");
    downloadCsv(items, "yt-vibe-results.csv");
  }

  return (
    <main className="mx-auto max-w-6xl p-6 grid gap-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">YouTube Hot Finder (MVP)</h1>
        <div className="flex gap-2">
          <button onClick={extractFromVideo} className="px-3 py-2 rounded border">
            레퍼런스에서 추출
          </button>
          <button onClick={inspire} className="px-3 py-2 rounded border">
            영감 받기
          </button>
          <button
            onClick={exportCsv}
            disabled={items.length === 0}
            className="px-3 py-2 rounded border disabled:opacity-50"
            title={items.length === 0 ? "결과가 없어요" : "현재 결과를 CSV로 저장"}
          >
            CSV 내보내기
          </button>
        </div>
      </div>

      <SettingsCard onSearch={onSearch} />
      {busy ? <div>검색중...</div> : <ResultsTable items={items} />}
    </main>
  );
}