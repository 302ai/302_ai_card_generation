import { readStreamableValue } from "ai/rsc";
import { createScopedLogger } from "@/utils";
import { genPhilosophicalCard } from "@/services/gen-philosophical-card";

const logger = createScopedLogger("gen-philosophical-card");

export async function POST(request: Request) {
  try {
    const {
      apiKey,
      model,
      content,
      lang,
      style,
    }: {
      apiKey: string;
      model: string;
      lang: "zh" | "en" | "ja";
      content: string;
      style: string;
    } = await request.json();

    const { output } = await genPhilosophicalCard({
      apiKey,
      model,
      lang,
      style,
      content,
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
    const errorMessage = "Failed to generate philosophical card";
    const errorCode = 500;

    if (error instanceof Error) {
      console.log("error", error);
      return Response.json(
        {
          error: {
            err_code: errorCode,
            message: error.message || errorMessage,
            message_cn: "生成哲学卡片失败",
            message_en: "Failed to generate philosophical card",
            message_ja: "哲学カードの生成に失敗しました",
            type: "PHILOSOPHICAL_CARD_GENERATION_ERROR",
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
          message_cn: "生成哲学卡片失败",
          message_en: "Failed to generate philosophical card",
          message_ja: "哲学カードの生成に失敗しました",
          type: "PHILOSOPHICAL_CARD_GENERATION_ERROR",
        },
      },
      { status: errorCode }
    );
  }
}
