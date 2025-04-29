import { readStreamableValue } from "ai/rsc";
import { createScopedLogger } from "@/utils";
import { generateQuoteCard } from "@/services/gen-quote";

const logger = createScopedLogger("gen-quote-card");

export async function POST(request: Request) {
  try {
    const {
      apiKey,
      model,
      content,
      style,
      author,
      textPosition,
    }: {
      apiKey: string;
      model: string;
      content: string;
      style: string;
      author: string;
      textPosition: string;
    } = await request.json();

    const { output } = await generateQuoteCard({
      apiKey,
      model,
      content,
      author,
      textPosition,
      style,
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
    const errorMessage = "Failed to generate quote card";
    const errorCode = 500;

    if (error instanceof Error) {
      console.log("error", error);
      return Response.json(
        {
          error: {
            err_code: errorCode,
            message: error.message || errorMessage,
            message_cn: "生成引用卡片失败",
            message_en: "Failed to generate quote card",
            message_ja: "引用カードの生成に失敗しました",
            type: "QUOTE_CARD_GENERATION_ERROR",
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
          message_cn: "生成引用卡片失败",
          message_en: "Failed to generate quote card",
          message_ja: "引用カードの生成に失敗しました",
          type: "QUOTE_CARD_GENERATION_ERROR",
        },
      },
      { status: errorCode }
    );
  }
}
