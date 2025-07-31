import React, { useState } from "react";
import { fetchFontFiles } from "../services/githubService.ts";
import type { FontFile, FontResult } from "../types.ts";
import CheckIcon from "./icons/CheckIcon.tsx";
import DownloadIcon from "./icons/DownloadIcon.tsx";
import ErrorIcon from "./icons/ErrorIcon.tsx";
import SpinnerIcon from "./icons/SpinnerIcon.tsx";

function parseFontNames(text: string): string[] {
  const set = new Set<string>();

  // Extract from @import
  const importRegex = /@import[^;]*family=([^:&')]+)/gi;
  let match;
  while ((match = importRegex.exec(text))) {
    set.add(match[1].replace(/\+/g, " ").trim());
  }

  // Remove import lines
  text = text.replace(/@import[^;]*;/gi, "");

  const lines = text.split(/\n|,/).map((l) => l.trim()).filter(Boolean);

  for (let line of lines) {
    line = line.replace(/\/\*.*?\*\//g, ""); // remove css comments
    if (!line) continue;
    if (line.includes(":")) {
      line = line.split(":").pop() || "";
    }
    if (line.includes("/")) {
      line = line.split("/")[0];
    }
    const words = line.split(/\s+/);
    const keywords = [
      "thin",
      "extralight",
      "light",
      "regular",
      "medium",
      "semibold",
      "bold",
      "extrabold",
      "black",
      "italic",
      "ultra",
      "condensed",
    ];
    while (words.length && keywords.includes(words[words.length - 1].toLowerCase())) {
      words.pop();
    }
    const name = words.join(" ").trim();
    if (name) set.add(name);
  }

  return Array.from(set);
}

export default function FontDownloader() {
  const [fontList, setFontList] = useState(
    "Orbitron, IBM Plex Sans\n@import url('https://fonts.googleapis.com/css2?family=Roboto');\nTitle: Open Sans Bold");
  const [results, setResults] = useState<FontResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const handleFetchFonts = async () => {
    setIsLoading(true);
    setGlobalError(null);
    const names = parseFontNames(fontList);
    setResults(names.map((name) => ({ name, status: "loading" as const })));

    const promises = names.map((name) => fetchFontFiles(name).then(
      (files) => ({ name, status: "success" as const, files }),
      (err) => ({ name, status: "error" as const, error: (err as Error).message })
    ));

    const res = await Promise.all(promises);
    setResults(res);
    setIsLoading(false);
  };

  const downloadFile = async (file: FontFile) => {
    const response = await fetch(file.url);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const downloadAll = async () => {
    const files = results.flatMap((r) => (r.status === "success" ? r.files || [] : []));
    for (const [i, file] of files.entries()) {
      setTimeout(() => downloadFile(file), i * 300);
    }
  };

  const successFilesCount = results.reduce((acc, r) => acc + (r.status === "success" ? (r.files?.length || 0) : 0), 0);

  return (
    <div className="space-y-4">
      <textarea
        className="w-full h-40 p-2 rounded bg-slate-800 text-white"
        value={fontList}
        onChange={(e) => setFontList(e.target.value)}
      />
      <button
        onClick={handleFetchFonts}
        disabled={isLoading}
        className="px-4 py-2 bg-teal-600 rounded hover:bg-teal-700 disabled:opacity-50 flex items-center gap-2"
      >
        {isLoading && <SpinnerIcon />}
        {isLoading ? "Processing..." : "Get Fonts"}
      </button>
      {globalError && <p className="text-red-400">{globalError}</p>}
      {results.length > 0 && (
        <div className="space-y-4">
          {results.map((r) => (
            <div key={r.name} className="border border-slate-700 p-2 rounded">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-semibold flex-1">{r.name}</span>
                {r.status === "loading" && <SpinnerIcon />}
                {r.status === "success" && <CheckIcon />}
                {r.status === "error" && <ErrorIcon />}
              </div>
              {r.status === "success" && r.files && (
                <ul className="space-y-1">
                  {r.files.map((f) => (
                    <li key={f.name}>
                      <button
                        className="flex items-center gap-1 text-teal-400 hover:underline"
                        onClick={() => downloadFile(f)}
                      >
                        <DownloadIcon /> {f.name}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {r.status === "error" && <p className="text-red-400">{r.error}</p>}
            </div>
          ))}
          {successFilesCount > 0 && !isLoading && (
            <button
              onClick={downloadAll}
              className="px-4 py-2 bg-teal-600 rounded hover:bg-teal-700 flex items-center gap-2"
            >
              <DownloadIcon /> Download All ({successFilesCount} files)
            </button>
          )}
        </div>
      )}
    </div>
  );
}
