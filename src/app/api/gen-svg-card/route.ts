import { APICallError, generateText } from "ai";
import { createAI302 } from "@302ai/ai-sdk";
import { createScopedLogger } from "@/utils";
import { env } from "@/env";
import {
  posterPromptForRandom,
  posterPromptForCustomAndTemplate,
} from "@/constants/prompt";

const logger = createScopedLogger("gen-svg-card");

export async function POST(request: Request) {
  try {
    const {
      apiKey,
      model,
      lang,
      style,
      content,
    }: {
      apiKey: string;
      model: string;
      lang: "cn" | "en" | "jp";
      style: "random" | "template" | "custom";
      content: string;
    } = await request.json();
    const ai302 = createAI302({
      apiKey,
      baseURL: `${env.NEXT_PUBLIC_API_URL}/v1/chat/completions`,
    });
    const prompt =
      style === "random"
        ? posterPromptForRandom({ lang, content })
        : posterPromptForCustomAndTemplate({ lang, content });

    const result = await generateText({
      model: ai302(model),
      prompt,
    });

    const stringSVG = result.text;

    return Response.json({ stringSVG });
  } catch (error) {
    logger.error(error);
    if (error instanceof APICallError) {
      const resp = error.responseBody;
      return Response.json(resp, { status: 500 });
    }

    // Handle different types of errors
    let errorMessage = "Failed to generate prompt";
    let errorCode = 500;

    if (error instanceof Error) {
      errorMessage = error.message;
      if ("code" in error && typeof (error as any).code === "number") {
        errorCode = (error as any).code;
      }
    }

    return Response.json(
      {
        error: {
          errCode: errorCode,
          message: errorMessage,
          messageCn: "生成提示词失败",
          messageEn: "Failed to generate prompt",
          messageJa: "画像の生成に失敗しました",
          type: "IMAGE_GENERATION_ERROR",
        },
      },
      { status: errorCode }
    );
  }
}
