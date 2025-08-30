const STOP_KO = new Set(["그리고","그러나","하지만","이것","저것","영상","채널","있는","없는","하는","합니다","까지","에서","으로","하다","했다","가능","소개","최고","오늘","영상입니다","자료"]);
const STOP_EN = new Set(["the","a","an","and","or","but","this","that","with","for","from","are","is","was","were","on","to","of","in","it","you","your","our","we","they"]);

function tokenize(text: string) {
  const cleaned = text.toLowerCase()
    .replace(/[^\p{L}\p{N}\s#@&/+-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned.split(" ").filter(Boolean);
}

export function extractKeywords(raw: {title?: string; description?: string; tags?: string[]; transcript?: string}, topN=30) {
  const base = [
    (raw.title||"")+" ",
    (raw.description||"")+" ",
    (raw.tags||[]).join(" "),
    (raw.transcript||"")
  ].join(" ");

  const tokens = tokenize(base);
  const freq = new Map<string,number>();

  for (const t of tokens) {
    const isKo = /[가-힣]/.test(t);
    const isStop = isKo ? STOP_KO.has(t) : STOP_EN.has(t);
    if (isStop) continue;
    if (t.length < 2) continue;

    const prev = freq.get(t) ?? 0;
    const bonus = (raw.title && raw.title.toLowerCase().includes(t)) ? 3 : 1;
    freq.set(t, prev + bonus);
  }

  const sorted = [...freq.entries()].sort((a,b)=>b[1]-a[1]).map(([k])=>k);

  const grams = new Map<string, number>();
  for (let i=0; i<tokens.length-1; i++){
    const a=tokens[i], b=tokens[i+1];
    if (a.length>=2 && b.length>=2) {
      const g = `${a} ${b}`;
      grams.set(g, (grams.get(g)??0)+1);
    }
  }
  const bi = [...grams.entries()].sort((a,b)=>b[1]-a[1]).slice(0, Math.floor(topN/3)).map(([k])=>k);

  const core = [...new Set([...sorted.slice(0, topN), ...bi])];
  const suggestedTags = core.slice(0, 15);

  return { core, suggestedTags };
}