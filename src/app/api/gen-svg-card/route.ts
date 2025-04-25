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
      styleType,
    }: {
      apiKey: string;
      model: string;
      lang: "zh" | "en" | "ja";
      style: string;
      content: string;
      styleType: "random" | "template" | "custom";
    } = await request.json();
    const ai302 = createAI302({
      apiKey,
      baseURL: `${env.NEXT_PUBLIC_API_URL}/v1/chat/completions`,
    });
    const prompt =
      styleType === "random"
        ? posterPromptForRandom({ lang, content })
        : posterPromptForCustomAndTemplate({
            lang,
            content,
            style,
          });

    const result = await generateText({
      model: ai302(model),
      prompt,
    });

    let stringSVG = result.text;

    // Clean SVG string from markdown formatting
    stringSVG = cleanSvgFromMarkdown(stringSVG);

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
