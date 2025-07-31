import type { FontFile } from "../types.ts";

const BASE_URL = "https://api.github.com/repos/google/fonts/contents";

function sanitize(name: string) {
  return name.toLowerCase().replace(/\s+/g, "");
}

export async function fetchFontFiles(fontFamily: string): Promise<FontFile[]> {
  const key = sanitize(fontFamily);
  const paths = [
    `ofl/${key}`,
    `ofl/${key}/static`,
    `apache/${key}`,
  ];

  let files: any[] | null = null;
  let lastError: any = null;

  for (const path of paths) {
    try {
      const res = await fetch(`${BASE_URL}/${path}`);
      if (res.status === 404) continue;
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        files = data.filter((f) => f.name.endsWith(".ttf") && f.download_url);
        if (files.length > 0) break;
      }
    } catch (err) {
      lastError = err;
      if (err instanceof Error && err.message === "403") {
        throw new Error("Rate limit exceeded");
      }
    }
  }

  if (!files || files.length === 0) {
    throw new Error("No font files found");
  }

  const weightOrder = [
    "thin",
    "extralight",
    "light",
    "regular",
    "medium",
    "semibold",
    "bold",
    "extrabold",
    "black",
  ];

  const styleOrder = ["", "italic"];

  const parse = (name: string) => {
    const lower = name.toLowerCase();
    const weight = weightOrder.findIndex((w) => lower.includes(w));
    const style = lower.includes("italic") ? 1 : 0;
    return { weight: weight === -1 ? 3 : weight, style };
  };

  files.sort((a, b) => {
    const pa = parse(a.name);
    const pb = parse(b.name);
    if (pa.weight !== pb.weight) return pa.weight - pb.weight;
    return pa.style - pb.style;
  });

  return files.map((f) => ({ name: f.name, url: f.download_url }));
}
