import { APICallError, generateText } from "ai";
import { createAI302 } from "@302ai/ai-sdk";
import { createScopedLogger } from "@/utils";
import { env } from "@/env";
import {
  changeStylePrompt,
  systemPrompt,
  userPrompt,
} from "@/constants/prompt";
import { MODEL_PRICE } from "@/constants/models";
import { reportMulerunUsage } from "@/services/mulerun-service";

const logger = createScopedLogger("change-style");

export async function POST(request: Request) {
  try {
    const {
      apiKey,
      lang,
      content,
      html,
      isMulerun,
      sessionId,
      agentId,
    }: {
      apiKey: string;
      lang: "zh" | "en" | "ja";
      content: string;
      html: string;
      isMulerun: boolean;
      sessionId: string;
      agentId: string;
    } = await request.json();
    const ai302 = createAI302({
      apiKey,
      baseURL: `${env.NEXT_PUBLIC_API_URL}/v1/chat/completions`,
    });

    const result = await generateText({
      model: ai302("claude-3-7-sonnet-20250219"),
      messages: [
        {
          role: "user",
          content: changeStylePrompt({ content, html }),
        },
      ],
    });
    const stringHTML = result.text;
    if (isMulerun && agentId && sessionId) {
      const { promptTokens, completionTokens } = result.usage;
      const price =
        MODEL_PRICE["claude-3-7-sonnet-20250219"].promptTokens * promptTokens +
        MODEL_PRICE["claude-3-7-sonnet-20250219"].completionTokens *
          completionTokens;
      try {
        await reportMulerunUsage({
          agentId,
          sessionId,
          cost: price,
          isFinal: false,
        });
      } catch (error) {
        throw error;
      }
    }

    let newHTML;

    try {
      // First, check if response contains markdown code blocks
      if (stringHTML.includes("```")) {
        const cleanedHTML = stringHTML
          .replace(/```+html/g, "") // Handle any number of backticks followed by html
          .replace(/```+/g, "") // Handle any number of backticks
          .trim();

        newHTML = JSON.parse(cleanedHTML);
      }
      // Check if it's directly HTML content
      else if (
        stringHTML.trim().startsWith("<!DOCTYPE") ||
        stringHTML.trim().startsWith("<html")
      ) {
        newHTML = stringHTML;
      }
      // If it's a JSON string
      else {
        newHTML = JSON.parse(stringHTML);
      }
    } catch (parseError) {
      logger.error("Failed to parse AI response:", parseError);
      // Return the raw text if parsing fails
      newHTML = stringHTML;
    }

    return Response.json({ html: newHTML });
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
