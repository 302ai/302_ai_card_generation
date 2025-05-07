import { FC, SVGProps } from "react";

export interface ModelInfo {
  id: string;
  name: string;
}

export type ModelId = (typeof MODEL_LIST)[number]["id"];

export const MODEL_LIST = [
  {
    id: "claude-3-7-sonnet-20250219",
    name: "claude-3-7-sonnet-20250219",
  },
  {
    id: "claude-3-5-sonnet-20241022",
    name: "claude-3-5-sonnet-20241022",
  },
  {
    id: "gpt-4.1",
    name: "gpt-4.1",
  },
  {
    id: "deepseek-chat",
    name: "deepseek-chat",
  },
  {
    id: "gemini-2.5-pro-preview-05-06",
    name: "gemini-2.5-pro-preview-05-06",
  },
] as const;
