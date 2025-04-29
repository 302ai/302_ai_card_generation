import { readStreamableValue } from "ai/rsc";
import { createScopedLogger } from "@/utils";
import { generateSVG } from "@/services/generate-svg";

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

    const { output } = await generateSVG({
      apiKey,
      model,
      lang,
      content,
      style,
      styleType,
    });

    // Create a transform stream for response
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    // Process the stream in the background
    (async () => {
      try {
        const reader = await readStreamableValue(output);
        let chatValue = "";

        for await (const chunk of reader) {
          if (chunk && chunk.type === "text-delta" && chunk.textDelta) {
            chatValue += chunk.textDelta;
            await writer.write(
              encoder.encode(JSON.stringify({ chunk: chunk.textDelta }) + "\n")
            );
          }
        }

        // Send finished signal
        await writer.write(
          encoder.encode(JSON.stringify({ finished: true }) + "\n")
        );
      } catch (error) {
        console.error("Stream processing error:", error);
        await writer.write(
          encoder.encode(JSON.stringify({ error: String(error) }) + "\n")
        );
      } finally {
        writer.close();
      }
    })();

    // Return the streaming response
    return new Response(stream.readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    // Handle different types of errors
    const errorMessage = "Failed to generate SVG";
    const errorCode = 500;

    if (error instanceof Error) {
      console.log("error", error);
      return Response.json(
        {
          error: {
            err_code: errorCode,
            message: error.message || errorMessage,
            message_cn: "生成图片失败",
            message_en: "Failed to generate SVG",
            message_ja: "SVGの生成に失敗しました",
            type: "SVG_GENERATION_ERROR",
          },
        },
        { status: errorCode }
      );
    }

    return Response.json(
      {
        error: {
          err_code: errorCode,
          message: errorMessage,
          message_cn: "生成图片失败",
          message_en: "Failed to generate SVG",
          message_ja: "SVGの生成に失敗しました",
          type: "SVG_GENERATION_ERROR",
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
