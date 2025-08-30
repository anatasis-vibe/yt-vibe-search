function cell(v) {
  const s = String(v ?? "");
  // CSV 인젝션(=,+,-,@로 시작) 예방: 앞에 ' 붙이기
  const safe = /^[=+\-@]/.test(s) ? "'" + s : s;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function buildCsv(items) {
  const header = [
    "videoId", "title", "channelTitle", "publishedAt",
    "durationSec", "viewCount", "likeCount", "url"
  ];
  const lines = [header.join(",")];

  for (const it of items) {
    const url = `https://www.youtube.com/watch?v=${it.videoId}`;
    lines.push([
      it.videoId,
      it.title,
      it.channelTitle,
      it.publishedAt,
      it.durationSec,
      it.viewCount ?? "",
      it.likeCount ?? "",
      url,
    ].map(cell).join(","));
  }
  // CRLF로 줄바꿈(Windows Excel 호환)
  return lines.join("\r\n");
}

export function downloadCsv(items, filename = "yt-vibe-results.csv") {
  const csv = buildCsv(items);
  // 💡 UTF-8 BOM 추가 → Excel이 UTF-8로 정확히 인식
  const bom = "\uFEFF";
  const blob = new Blob([bom, csv], { type: "text/csv;charset=utf-8" });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}