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
    id: "gemini-2.5-pro-exp-03-25",
    name: "gemini-2.5-pro-exp-03-25",
  },
  {
    id: "gpt-4.1",
    name: "gpt-4.1",
  },
  {
    id: "deepseek-chat",
    name: "deepseek-chat",
  },
] as const;
