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
  content: string;
  sessionId?: string; // For Mulerun session isolation
};

export type AddHistory = Omit<History, "id" | "createdAt">;
