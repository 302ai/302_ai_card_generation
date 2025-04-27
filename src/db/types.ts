export type History = {
  id: string;
  html: string;
  status: "pending" | "success" | "failed";
  createdAt: number;
  url?: string;
  values?: Record<string, any>;
  type: "html" | "svg";
  tab:
    | "knowledge-card"
    | "promotional-poster"
    | "quote-reference"
    | "philosophical-card";
};

export type SvgHistory = {
  id: string;
  svg: string;
  status: "pending" | "success" | "failed";
  createdAt: number;
  values?: Record<string, any>;
  type: "";
  tab: "";
};

export type AddHistory = Omit<History, "id" | "createdAt">;
