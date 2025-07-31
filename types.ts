export interface FontFile {
  name: string;
  url: string;
}

export interface FontResult {
  name: string;
  status: "loading" | "success" | "error";
  files?: FontFile[];
  error?: string;
}
