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
import { quoteReferenceCardPrompt } from "@/constants/prompt";
import { streamText, TextStreamPart } from "ai";

interface GenerateQuoteCardParams {
  apiKey: string;
  model: string;
  content: string;
  author: string;
  textPosition: string;
  style: string;
}

type AsyncIterableStream<T> = AsyncIterable<T> & ReadableStream<T>;

interface GenerateQuoteCardResult {
  html: string;
}

export const generateQuoteCard = async ({
  apiKey,
  model,
  content,
  author,
  textPosition,
  style,
}: GenerateQuoteCardParams) => {
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
          messages: [
            {
              role: "user",
              content: quoteReferenceCardPrompt({
                content,
                author,
                textPosition,
                style,
              }),
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

              // Process the received content before completing
              let html = "";
              try {
                // First, check if response contains markdown code blocks
                if (chatValue.includes("```")) {
                  const regex = /```(?:html)?([\s\S]*?)```/;
                  const match = chatValue.match(regex);
                  const cleanedHTML = match ? match[1].trim() : chatValue;

                  try {
                    html = JSON.parse(cleanedHTML);
                  } catch {
                    html = cleanedHTML;
                  }
                }
                // Check if it's directly HTML content
                else if (
                  chatValue.trim().startsWith("<!DOCTYPE") ||
                  chatValue.trim().startsWith("<html")
                ) {
                  html = chatValue;
                }
                // If it's a JSON string
                else {
                  try {
                    html = JSON.parse(chatValue);
                  } catch {
                    html = chatValue;
                  }
                }
              } catch (parseError) {
                console.error("Failed to parse AI response:", parseError);
                html = chatValue;
              }

              stream.done();
            }
          }
        };
        await onGetResult(fullStream);
      } catch (error) {
        const uiLanguage = store.get(languageAtom);
        console.error("Generation error:", error);

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
          message: error instanceof Error ? error.message : "Generation error",
        });
      }
    })();
  } catch (error: any) {
    console.log("error?.message?.error?", error?.message?.error, "234");
    stream.error({ message: "Initialization error" });
  }
  return { output: stream.value };
};
