mport type { VideoLite } from "./types";

function cell(v: unknown) {
  const s = String(v ?? "");
  return `"${s.replace(/"/g, '""')}"`; // CSV 이스케이프
}

export function buildCsv(items: VideoLite[]) {
  const header = [
    "videoId",
    "title",
    "channelTitle",
    "publishedAt",
    "durationSec",
    "viewCount",
    "likeCount",
    "url"
  ];
  const lines = [header.join(",")];

  for (const it of items) {
    const url = `https://www.youtube.com/watch?v=${it.videoId}`;
    lines.push(
      [
        it.videoId,
        it.title,
        it.channelTitle,
        it.publishedAt,
        it.durationSec,
        it.viewCount ?? "",
        it.likeCount ?? "",
        url,
      ].map(cell).join(",")
    );
  }
  return lines.join("\r\n");
}

export function downloadCsv(items: VideoLite[], filename = "results.csv") {
  const csv = buildCsv(items);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}