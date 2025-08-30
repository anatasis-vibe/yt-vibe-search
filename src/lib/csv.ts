function cell(v) {
  const s = String(v ?? "");
  return `"${s.replace(/"/g, '""')}"`;
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
  return lines.join("\r\n");
}

export function downloadCsv(items, filename = "yt-vibe-results.csv") {
  const csv = buildCsv(items);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}