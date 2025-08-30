"use client";

import { useState } from "react";
import { SettingsCard } from "@/components/SettingsCard";
import { ResultsTable } from "@/components/ResultsTable";
import type { SearchBody, VideoLite } from "@/lib/types";
import { downloadCsv } from "@/lib/csv";
// import PwaRegister from "./pwa-register"; // PWA 등록을 했다면 주석 해제

export default function Home() {
  const [items, setItems] = useState<VideoLite[]>([]);
  const [busy, setBusy] = useState(false);

  // 문자열/배열 입력을 통일해서 배열로 만드는 보조함수
  const toList = (val: unknown) =>
    typeof val === "string"
      ? val.split(/\r?\n/).map((s) => s.trim()).filter(Boolean)
      : Array.isArray(val)
      ? val
      : [];

  // 메인 검색
  async function onSearch(b: SearchBody) {
    setBusy(true);
    try {
      const body: SearchBody = {
        ...b,
        channels: toList(b.channels),
        keywords: toList(b.keywords),
      };

      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        // 서버가 오류 본문을 줄 수 있으니 텍스트로 읽어서 알림
        const errText = await res.text().catch(() => "");
        throw new Error(`search failed: ${res.status}${errText ? ` :: ${errText}` : ""}`);
      }

      // JSON 파싱 보호
      let json: any = null;
      try {
        json = await res.json();
      } catch {
        throw new Error("응답 JSON 파싱 실패");
      }

      setItems(json.items ?? []);
    } catch (e: any) {
      alert(`검색 실패: ${e?.message ?? e}`);
    } finally {
      setBusy(false);
    }
  }

  // 레퍼런스 영상에서 키워드 추출
  async function extractFromVideo() {
    const input = prompt("키워드를 뽑을 YouTube videoId 또는 전체 URL을 입력하세요.");
    if (!input) return;

    const videoId = (() => {
      try {
        if (/youtu\.be\//.test(input)) return input.split("youtu.be/")[1].split(/[?&]/)[0];
        if (/watch\?v=/.test(input)) return new URL(input).searchParams.get("v") ?? "";
        if (/\/shorts\//.test(input)) return input.split("/shorts/")[1].split(/[?&]/)[0];
        return input; // 사용자가 그냥 id만 준 경우
      } catch {
        return input;
      }
    })();

    if (!videoId) return alert("videoId를 찾지 못했습니다.");

    try {
      const res = await fetch(`/api/keywords/from-video?videoId=${encodeURIComponent(videoId)}`);
      if (!res.ok) throw new Error(`extract failed: ${res.status}`);
      const json = await res.json();
      alert(`핵심 키워드(일부):\n${json.core.slice(0, 20).join(", ")}`);
    } catch (e: any) {
      alert(`추출 실패: ${e?.message ?? e}`);
    }
  }

  // 영감 키워드 받기
  async function inspire() {
    const seed = prompt("씨앗 키워드(비워도 됨):") ?? "";
    try {
      const res = await fetch("/api/inspire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seed }),
      });
      if (!res.ok) throw new Error(`inspire failed: ${res.status}`);
      const json = await res.json();
      alert(`영감 키워드(일부):\n${json.core.slice(0, 20).join(", ")}`);
    } catch (e: any) {
      alert(`요청 실패: ${e?.message ?? e}`);
    }
  }

  return (
    <main className="mx-auto max-w-7xl p-6 space-y-6">
      {/* {<PwaRegister />}  // PWA를 쓰면 주석 해제 */}

      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">YouTube Hot Finder</h1>
        <div className="flex gap-2">
          <button
            onClick={extractFromVideo}
            className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm hover:bg-gray-50"
          >
            레퍼런스에서 추출
          </button>
          <button
            onClick={inspire}
            className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm hover:bg-gray-50"
          >
            영감 받기
          </button>
        </div>
      </header>

      <SettingsCard onSearch={onSearch} />

      {busy ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-600">
          검색중…
        </div>
      ) : (
        <ResultsTable
          items={items}
          onExportCsv={() => downloadCsv(items, "yt-hot-results.csv")}
        />
      )}
    </main>
  );
}