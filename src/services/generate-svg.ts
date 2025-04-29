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
import {
  posterPromptForRandom,
  posterPromptForCustomAndTemplate,
} from "@/constants/prompt";
import { streamText, TextStreamPart } from "ai";

interface GenerateSVGParams {
  apiKey: string;
  model: string;
  lang: "zh" | "en" | "ja";
  content: string;
  style: string;
  styleType: "random" | "template" | "custom";
}

type AsyncIterableStream<T> = AsyncIterable<T> & ReadableStream<T>;

interface GenerateSVGResult {
  output: any;
}

/**
 * Cleans SVG string from markdown formatting
 * @param svgString - The SVG string that might contain markdown
 * @returns Cleaned SVG string
 */
function cleanSvgFromMarkdown(svgString: string): string {
  // Remove markdown code blocks (```svg and ```)
  svgString = svgString.replace(/```svg\n?/g, "").replace(/```\n?/g, "");

  // Ensure the string starts with <svg
  const svgStartIndex = svgString.indexOf("<svg");
  if (svgStartIndex > 0) {
    svgString = svgString.substring(svgStartIndex);
  }

  // Ensure the string ends properly with </svg>
  const svgEndIndex = svgString.lastIndexOf("</svg>");
  if (svgEndIndex !== -1 && svgEndIndex < svgString.length - 6) {
    svgString = svgString.substring(0, svgEndIndex + 6);
  }

  return svgString;
}

export const generateSVG = async ({
  apiKey,
  model,
  lang,
  content,
  style,
  styleType,
}: GenerateSVGParams) => {
  console.log({
    content,
    style,
    styleType,
  });

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
          system:
            styleType === "random"
              ? posterPromptForRandom({ lang, content })
              : posterPromptForCustomAndTemplate({
                  lang,
                  content,
                  style,
                }),
          model: ai302(model),
          messages: [
            {
              role: "user",
              content: style,
            },
          ],
        });

        const onGetResult = async (
          fullStream: AsyncIterableStream<TextStreamPart<any>>
        ) => {
          let chatValue = "";
          for await (const chunk of fullStream) {
            if (chunk.type === "text-delta") {
              chatValue += chunk.textDelta;
              stream.update({ type: "text-delta", textDelta: chunk.textDelta });
            } else if (chunk.type === "finish") {
              stream.update({ type: "logprobs", logprobs: chunk.logprobs });

              // Clean SVG string from markdown formatting
              const cleanedSVG = cleanSvgFromMarkdown(chatValue);
              console.log("Final cleaned SVG, length:", cleanedSVG.length);

              stream.done();
            }
          }
        };
        await onGetResult(fullStream);
      } catch (error) {
        const uiLanguage = store.get(languageAtom);
        console.error("SVG generation error:", error);

        if (error instanceof HTTPError) {
          try {
            const errorData = JSON.parse(
              (await error.response.json()) as string
            );
            if (errorData.error && uiLanguage) {
              const countryCode = langToCountry(uiLanguage);
              const messageKey =
                countryCode === "en" ? "message" : `message_${countryCode}`;
              const message = errorData.error[messageKey];
              emitter.emit("ToastError", {
                code: errorData.error.err_code,
                message,
              });
            }
          } catch {
            // If we can't parse the error response, show a generic error
            emitter.emit("ToastError", {
              code: error.response.status,
              message: error.message,
            });
          }
        } else {
          // For non-HTTP errors
          emitter.emit("ToastError", {
            code: 500,
            message: error instanceof Error ? error.message : String(error),
          });
        }

        stream.error({
          message:
            error instanceof Error ? error.message : "SVG generation error",
        });
      }
    })();
  } catch (error: any) {
    console.log("error?.message?.error?", error?.message?.error, "234");
    stream.error({ message: "Initialization error" });
  }
  return { output: stream.value };
};
