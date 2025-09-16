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

export const MODEL_PRICE = {
  "claude-3-7-sonnet-20250219": {
    promptTokens: 3 / 1_000_000,
    completionTokens: 15 / 1_000_000,
  },
  "gpt-4.1": {
    promptTokens: 2 / 1_000_000,
    completionTokens: 8 / 1_000_000,
  },
  "deepseek-chat": {
    promptTokens: 0.3 / 1_000_000,
    completionTokens: 1.2 / 1_000_000,
  },
  "gemini-2.5-pro-preview-05-06": {
    promptTokens: 1.25 / 1_000_000,
    completionTokens: 10 / 1_000_000,
  },
};
