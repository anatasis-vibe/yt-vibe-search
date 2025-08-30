"use client";
import { useEffect, useMemo, useState } from "react";
import { VideoLite } from "@/lib/types";

// 초 → "X시간 Y분"
function formatHM(totalSeconds: number) {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return "-";
  const totalMinutes = Math.floor(totalSeconds / 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return h > 0 ? `${h}시간 ${m}분` : `${m}분`;
}
function fmtNum(n?: number | null) {
  return typeof n === "number" ? n.toLocaleString() : "-";
}
function fmtRatio(n?: number | null) {
  return typeof n === "number" ? n.toFixed(2) : "-";
}

// 🔥 Hot Score 계산식
function computeHotScore(v: VideoLite) {
  const now = Date.now();
  const ageHours = Math.max(1 / 60, (now - new Date(v.publishedAt).getTime()) / 36e5);
  const vph = typeof v.viewsPerHour === "number" && isFinite(v.viewsPerHour)
    ? v.viewsPerHour
    : (v.viewCount / ageHours);

  const ratio = (typeof v.viewToSubRatio === "number" && isFinite(v.viewToSubRatio))
    ? v.viewToSubRatio
    : ((v.channelSubscriberCount ?? 0) > 0 ? v.viewCount / (v.channelSubscriberCount as number) : 0);

  const ratioClamped = Math.max(0, Math.min(10, ratio));
  const recencyBoost = 1 / (1 + ageHours / 24); // 0~1

  const score =
    Math.log10((v.viewCount || 0) + 1) +
    2 * Math.log10(vph + 1) +
    0.6 * (ratioClamped / 10) +
    0.4 * recencyBoost;

  return score;
}

type SortKey =
  | "hotScore"
  | "title"
  | "channelTitle"
  | "viewCount"
  | "channelSubscriberCount"
  | "viewsPerHour"
  | "viewToSubRatio"
  | "publishedAt"
  | "durationSec";

type SortDir = "asc" | "desc" | null;

export function ResultsTable({ items }: { items: VideoLite[] }) {
  // 원래 순서를 복구할 수 있도록 인덱스를 저장
  const original = useMemo(
    () => items.map((v, i) => ({ ...v, __i: i })),
    [items]
  );

  const [rows, setRows] = useState<(VideoLite & { __i: number })[]>(original);
  const [sortKey, setSortKey] = useState<SortKey | null>("hotScore");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  useEffect(() => {
    if (!sortKey || !sortDir) {
      setRows(original);
      return;
    }
    const sorted = [...original].sort((a, b) => compareBy(a, b, sortKey, sortDir));
    setRows(sorted);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [original, sortKey, sortDir]);

  function handleSort(key: SortKey) {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir("asc");
      return;
    }
    // 같은 컬럼을 반복 클릭: asc -> desc -> none(원래 순서)
    if (sortDir === "asc") {
      setSortDir("desc");
    } else if (sortDir === "desc") {
      setSortKey(null);
      setSortDir(null);
      setRows(original);
    } else {
      setSortDir("asc");
    }
  }

  function compareBy(a: any, b: any, key: SortKey, dir: "asc" | "desc") {
    const mul = dir === "asc" ? 1 : -1;

    if (key === "hotScore") {
      const av = computeHotScore(a);
      const bv = computeHotScore(b);
      if (av === bv) return (a.__i - b.__i) * 1;
      return av > bv ? 1 * mul : -1 * mul;
    }

    // 문자열
    if (key === "title" || key === "channelTitle") {
      const av = (a[key] ?? "") as string;
      const bv = (b[key] ?? "") as string;
      return av.localeCompare(bv) * mul;
    }

    // 날짜
    if (key === "publishedAt") {
      const av = new Date(a.publishedAt).getTime() || 0;
      const bv = new Date(b.publishedAt).getTime() || 0;
      return (av - bv) * mul;
    }

    // 숫자(널/undefined 방어)
    const nanFix = (x: any) =>
      typeof x === "number" && Number.isFinite(x) ? x : -Infinity;

    const av =
      key === "channelSubscriberCount"
        ? nanFix(a.channelSubscriberCount)
        : key === "viewsPerHour"
        ? nanFix(a.viewsPerHour)
        : key === "viewToSubRatio"
        ? nanFix(a.viewToSubRatio)
        : key === "durationSec"
        ? nanFix(a.durationSec)
        : key === "viewCount"
        ? nanFix(a.viewCount)
        : 0;

    const bv =
      key === "channelSubscriberCount"
        ? nanFix(b.channelSubscriberCount)
        : key === "viewsPerHour"
        ? nanFix(b.viewsPerHour)
        : key === "viewToSubRatio"
        ? nanFix(b.viewToSubRatio)
        : key === "durationSec"
        ? nanFix(b.durationSec)
        : key === "viewCount"
        ? nanFix(b.viewCount)
        : 0;

    if (av === bv) return (a.__i - b.__i) * 1;
    return av > bv ? 1 * mul : -1 * mul;
  }

  function headerButton(
    label: string,
    key?: SortKey,
    align: "left" | "right" = "left"
  ) {
    const active = key && sortKey === key && sortDir;
    const caret =
      !key
        ? ""
        : sortKey !== key || !sortDir
        ? "↕"
        : sortDir === "asc"
        ? "▲"
        : "▼";

    const ariaSort =
      !key || !active ? "none" : sortDir === "asc" ? "ascending" : "descending";

    if (!key) {
      return (
        <span className={align === "right" ? "float-right" : ""}>
          {label}
        </span>
      );
    }

    return (
      <button
        type="button"
        aria-sort={ariaSort as any}
        onClick={() => handleSort(key)}
        className={`inline-flex items-center gap-1 select-none ${
          align === "right" ? "float-right" : ""
        } hover:underline`}
        title="클릭해서 정렬"
      >
        <span>{label}</span>
        <span className="opacity-70 text-xs">{caret}</span>
      </button>
    );
  }

  return (
    <div className="border rounded-2xl overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="p-2 text-left">{headerButton("썸네일")}</th>
            <th className="p-2 text-left">{headerButton("제목", "title")}</th>
            <th className="p-2 text-left">{headerButton("채널", "channelTitle")}</th>
            <th className="p-2 text-right">{headerButton("조회수", "viewCount", "right")}</th>
            <th className="p-2 text-right">{headerButton("구독자", "channelSubscriberCount", "right")}</th>
            <th className="p-2 text-right">{headerButton("시간당 조회수", "viewsPerHour", "right")}</th>
            <th className="p-2 text-right">{headerButton("조회/구독 비율", "viewToSubRatio", "right")}</th>
            <th className="p-2 text-right">{headerButton("Hot Score", "hotScore", "right")}</th>
            <th className="p-2 text-left">{headerButton("업로드", "publishedAt")}</th>
            <th className="p-2 text-right">{headerButton("길이", "durationSec", "right")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((v) => (
            <tr key={v.videoId} className="border-t">
              <td className="p-2">
                {v.thumbnails?.default && (
                  <img src={v.thumbnails.default} alt="" className="w-24 rounded" />
                )}
              </td>
              <td className="p-2">
                <a
                  className="text-blue-600 hover:underline"
                  target="_blank"
                  href={`https://www.youtube.com/watch?v=${v.videoId}`}
                >
                  {v.title}
                </a>
              </td>
              <td className="p-2">{v.channelTitle}</td>
              <td className="p-2 text-right">{v.viewCount.toLocaleString()}</td>
              <td className="p-2 text-right">{fmtNum(v.channelSubscriberCount)}</td>
              <td className="p-2 text-right">{fmtNum(v.viewsPerHour)}</td>
              <td className="p-2 text-right">{fmtRatio(v.viewToSubRatio)}</td>
              <td className="p-2 text-right">{computeHotScore(v).toFixed(2)}</td>
              <td className="p-2">{new Date(v.publishedAt).toLocaleDateString()}</td>
              <td className="p-2 text-right">{formatHM(v.durationSec)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}