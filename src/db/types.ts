export type History = {
  id: string;
  html: string;
  status: "pending" | "success" | "failed";
  createdAt: number;
};

export type SvgHistory = {
  id: string;
  svg: string;
  status: "pending" | "success" | "failed";
  createdAt: number;
};

export type AddHistory = Omit<History, "id" | "createdAt">;
