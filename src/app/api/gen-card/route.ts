import { APICallError, generateText } from "ai";
import { createAI302 } from "@302ai/ai-sdk";
import { createScopedLogger } from "@/utils";
import { env } from "@/env";

const logger = createScopedLogger("gen-prompt");

export async function POST(request: Request) {
  try {
    const {
      prompt,
      apiKey,
      model,
    }: {
      prompt: string;
      apiKey: string;
      model: string;
    } = await request.json();

    const ai302 = createAI302({
      apiKey,
      baseURL: `${env.NEXT_PUBLIC_API_URL}/v1/chat/completions`,
    });

    const result = await generateText({
      model: ai302(model),
      system: `
You are an AI that analyzes images and creates comprehensive art prompts.

When given an image, you will generate:
1. A detailed paragraph description (naturalLanguage)
2. A comma-separated list of keywords (keywords)

You must format your entire response as a valid JSON object with exactly this structure:
{
  "naturalLanguage": "your detailed paragraph here",
  "keywords": "keyword1, keyword2, keyword3, etc"
}

Only output the JSON object. Do not include any explanations, markdown formatting, or any text outside the JSON structure.
      `,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              image: prompt,
            },
          ],
        },
      ],
    });

    logger.info("Generated prompt text successfully");

    // Parse the text response as JSON
    try {
      const jsonResult = JSON.parse(result.text);
      console.log("jsonResult", jsonResult);

      return Response.json({
        naturalLanguage: jsonResult.naturalLanguage,
        keywords: jsonResult.keywords,
      });
    } catch (parseError) {
      logger.error("Failed to parse model output as JSON", parseError);
      const { naturalLanguage, keywords } = JSON.parse(
        result.text.replace(/```json\n/, "").replace(/\n```/, "")
      );
      // Return the raw text if parsing fails
      return Response.json({
        naturalLanguage,
        keywords,
        error: "Failed to parse as JSON, returning raw text",
      });
    }
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
