"use server";
import ky, { HTTPError } from "ky";
import { emitter } from "@/utils/mitt";
import { store, languageAtom } from "@/stores";
import { langToCountry } from "@/utils/302";
import { toast } from "sonner";
import { createStreamableValue, readStreamableValue } from "ai/rsc";
import { LanguageModelV1LogProbs } from "@ai-sdk/provider";
import { createAI302 } from "@302ai/ai-sdk";
import { env } from "@/env";
import { userPrompt } from "@/constants/prompt";
import { systemPrompt } from "@/constants/prompt";
import { streamText, TextStreamPart } from "ai";

interface GenerateHTMLParams {
  apiKey: string;
  model: string;
  lang: "zh" | "en" | "ja";
  date: string;
  topic: string;
  style: string;
  qrCode: string;
  type: "input-based" | "extract-key";
}

type AsyncIterableStream<T> = AsyncIterable<T> & ReadableStream<T>;

interface GenerateHTMLResult {
  html: string;
}

export const generateHTML = async ({
  apiKey,
  model,
  lang,
  date,
  topic,
  style,
  qrCode,
  type,
}: GenerateHTMLParams) => {
  const stream = createStreamableValue<{
    type: string;
    textDelta?: string;
    logprobs?: LanguageModelV1LogProbs;
  }>({ type: "text-delta", textDelta: "" });
  try {
    const ai302 = createAI302({
      apiKey,
      baseURL: `${env.NEXT_PUBLIC_API_URL}/v1/chat/completions`,
      fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = input instanceof URL ? input : new URL(input.toString());
        try {
          return await ky(url, {
            ...init,
            retry: 0,
            timeout: false,
          });
        } catch (error: any) {
          console.log("error?.message?.error?", error?.message?.error, "234");

          if (error.response) {
            const errorData = await error.response.json();
            stream.error({ message: errorData });
          } else {
            stream.error({ message: error });
          }
          return error;
        }
      },
    });

    (async () => {
      try {
        const { fullStream } = streamText({
          model: ai302(model),
          system: systemPrompt({ lang, type }),
          messages: [
            {
              role: "user",
              content: userPrompt({ date, topic, style, qrCode })[lang],
            },
          ],
        });
        const onGetResult = async (
          fullStream: AsyncIterableStream<TextStreamPart<any>>
        ) => {
          for await (const chunk of fullStream) {
            if (chunk.type === "text-delta") {
              stream.update({ type: "text-delta", textDelta: chunk.textDelta });
            } else if (chunk.type === "finish") {
              stream.update({ type: "logprobs", logprobs: chunk.logprobs });
              stream.done();
            }
          }
        };
        await onGetResult(fullStream);
      } catch (error) {
        stream.error({ message: "Initialization error" });
      }
    })();
  } catch (error: any) {
    console.log("error?.message?.error?", error?.message?.error, "234");

    stream.error({ message: "Initialization error" });
  }
  return { output: stream.value };
};
