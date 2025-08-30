"use client";
import { useState } from "react";
import type { VideoLite } from "@/lib/types";
import dayjs from "dayjs";

type Props = { items: VideoLite[]; onExportCsv?: () => void };

export function ResultsTable({ items, onExportCsv }: Props) {
  const [sortKey, setSortKey] =
    useState<keyof VideoLite | "vph" | "vpr">("vph");
  const [dir, setDir] = useState<1 | -1>(-1);

  const sorted = [...items].sort((a, b) => {
    const vph = (x: VideoLite) => (x.viewCount || 0) / Math.max(1, x.durationSec / 3600);
    const vpr = (x: VideoLite) => (x.viewCount || 0) / Math.max(1, (x as any).subs || 1);
    const A = sortKey === "vph" ? vph(a) : sortKey === "vpr" ? vpr(a) : (a as any)[sortKey];
    const B = sortKey === "vph" ? vph(b) : sortKey === "vpr" ? vpr(b) : (b as any)[sortKey];
    return (A === B ? 0 : A > B ? 1 : -1) * dir;
  });

  function head(label: string, key: typeof sortKey) {
    const active = sortKey === key;
    return (
      <th
        onClick={() => {
          setSortKey(key);
          setDir(active ? (dir === 1 ? -1 : 1) : -1);
        }}
        className={`px-3 py-2 text-left text-sm font-semibold
                    ${active ? "text-indigo-600" : "text-gray-700"} cursor-pointer`}
        title="정렬"
      >
        {label} {active ? (dir === 1 ? "↑" : "↓") : ""}
      </th>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between px-4 py-3">
        <h2 className="text-lg font-semibold">결과 ({items.length.toLocaleString()}건)</h2>
        <div className="flex gap-2">
          {onExportCsv && (
            <button
              onClick={onExportCsv}
              className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm hover:bg-gray-50"
            >
              CSV로 저장
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-t border-gray-100">
          <thead className="sticky top-0 bg-gray-50">
            <tr>
              {head("썸네일", "title")}
              {head("제목", "title")}
              {head("채널", "channelTitle")}
              {head("조회수", "viewCount")}
              {head("구독자", "vpr")}      {/* vpr 칼럼명은 표시에만 사용 */}
              {head("시간당 조회수", "vph")}
              {head("업로드", "publishedAt")}
              {head("길이", "durationSec")}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sorted.map((v) => (
              <tr key={v.videoId} className="hover:bg-gray-50">
                <td className="px-3 py-2">
                  {v.thumbnails?.default && (
                    <img src={v.thumbnails.default} alt="" className="h-12 w-20 rounded-lg object-cover" />
                  )}
                </td>
                <td className="px-3 py-2">
                  <a
                    href={`https://www.youtube.com/watch?v=${v.videoId}`}
                    target="_blank"
                    className="line-clamp-2 text-sm font-medium text-indigo-600 hover:underline"
                  >
                    {v.title}
                  </a>
                </td>
                <td className="px-3 py-2 text-sm text-gray-700">{v.channelTitle}</td>
                <td className="px-3 py-2 text-sm">{(v.viewCount ?? 0).toLocaleString()}</td>
                <td className="px-3 py-2 text-sm">
                  {/* 표시용: 조회/구독 비율이 있으면 보여주기 */}
                  {(v as any).subs
                    ? ((v.viewCount ?? 0) / Math.max(1, (v as any).subs)).toFixed(2)
                    : "-"}
                </td>
                <td className="px-3 py-2 text-sm">
                  {((v.viewCount ?? 0) / Math.max(1, v.durationSec / 3600)).toFixed(0)}
                </td>
                <td className="px-3 py-2 text-sm">{dayjs(v.publishedAt).format("YYYY-MM-DD")}</td>
                <td className="px-3 py-2 text-sm">
                  {Math.floor((v.durationSec ?? 0) / 60)}분
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-10 text-center text-sm text-gray-500">
                  검색 결과가 없습니다. 조건을 바꿔 다시 시도해 보세요.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}