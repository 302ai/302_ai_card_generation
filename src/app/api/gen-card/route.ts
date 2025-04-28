import { APICallError, generateText } from "ai";
import { createAI302 } from "@302ai/ai-sdk";
import { createScopedLogger } from "@/utils";
import { env } from "@/env";
import { systemPrompt, userPrompt } from "@/constants/prompt";

const logger = createScopedLogger("gen-prompt");

export async function POST(request: Request) {
  try {
    const {
      apiKey,
      model,
      lang,
      date,
      topic,
      style,
      qrCode,
      type,
    }: {
      apiKey: string;
      model: string;
      lang: "zh" | "en" | "ja";
      date: string;
      topic: string;
      style: string;
      qrCode: string;
      type: "input-based" | "extract-key";
    } = await request.json();
    const ai302 = createAI302({
      apiKey,
      baseURL: `${env.NEXT_PUBLIC_API_URL}/v1/chat/completions`,
    });

    const result = await generateText({
      model: ai302(model),
      system: systemPrompt({ lang, type }),
      messages: [
        {
          role: "user",
          content: userPrompt({ date, topic, style, qrCode })[lang],
        },
      ],
    });

    const stringHTML = result.text;
    let html;

    try {
      // First, check if response contains markdown code blocks
      if (stringHTML.includes("```")) {
        const cleanedHTML = stringHTML
          .replace(/```+html/g, "") // Handle any number of backticks followed by html
          .replace(/```+/g, "") // Handle any number of backticks
          .trim();

        html = JSON.parse(cleanedHTML);
      }
      // Check if it's directly HTML content
      else if (
        stringHTML.trim().startsWith("<!DOCTYPE") ||
        stringHTML.trim().startsWith("<html")
      ) {
        html = stringHTML;
      }
      // If it's a JSON string
      else {
        html = JSON.parse(stringHTML);
      }
    } catch (parseError) {
      logger.error("Failed to parse AI response:", parseError);
      // Return the raw text if parsing fails
      html = stringHTML;
    }

    return Response.json({ html });
  } catch (error) {
    // logger.error(error);
    if (error instanceof APICallError) {
      // console.log("APICallError", error);

      const resp = error.responseBody;

      return Response.json(resp, { status: 500 });
    }
    // Handle different types of errors
    const errorMessage = "Failed to generate image";
    const errorCode = 500;

    if (error instanceof Error) {
      console.log("error", error);

      const resp = (error as any)?.responseBody as any; // You can add specific error code mapping here if needed
      return Response.json(resp, { status: 500 });
    }

    return Response.json(
      {
        error: {
          err_code: errorCode,
          message: errorMessage,
          message_cn: "生成图片失败",
          message_en: "Failed to generate image",
          message_ja: "画像の生成に失敗しました",
          type: "IMAGE_GENERATION_ERROR",
        },
      },
      { status: errorCode }
    );
  }
}
