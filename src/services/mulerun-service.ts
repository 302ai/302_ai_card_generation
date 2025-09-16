import crypto from "crypto";

const METERING_URL = process.env.NEXT_PUBLIC_MULERUN_URL;
const API_TOKEN = process.env.NEXT_PUBLIC_MULERUN_API_KEY;

export interface MulerunReportOptions {
  agentId: string;
  sessionId: string;
  cost: number; // PTC 值
  isFinal?: boolean;
}

export interface MulerunResult {
  success: boolean;
  skipped?: boolean;
  error?: string;
}

/**
 * 上报使用量到 Mulerun
 */
export async function reportMulerunUsage(
  options: MulerunReportOptions
): Promise<MulerunResult> {
  const { agentId, sessionId, cost, isFinal = false } = options;

  try {
    // 第一步：PTC → credit
    const credit = cost * 150; // 1 PTC = 150 credits
    console.log(`[Mulerun] PTC ${cost} → credit ${credit}`);

    // 第二步：credit → MuleRun cost 单位 (0.0001 credits)
    const mulerunCost = Math.round(credit * 10000);
    console.log(
      `[Mulerun] credit ${credit} → MuleRun cost units ${mulerunCost}`
    );

    if (mulerunCost <= 0) {
      console.warn(`[Mulerun] mulerunCost=${mulerunCost} <= 0，跳过上报`);
      return { success: true, skipped: true };
    }

    if (credit > 200) {
      console.warn(`[Mulerun] credit=${credit} > 200，跳过上报`);
      return { success: true, skipped: true };
    }

    const requestBody = {
      agentId,
      sessionId,
      cost: mulerunCost,
      timestamp: new Date().toISOString(),
      isFinal,
      meteringId: crypto.randomUUID(),
    };

    console.log(`[Mulerun] 发送请求:`, JSON.stringify(requestBody));

    const res = await fetch(METERING_URL!, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`HTTP ${res.status}: ${errorText}`);
    }

    const result = await res.json();
    console.log(`[Mulerun] 上报成功:`, result);

    return { success: true };
  } catch (error: any) {
    console.error("[Mulerun] 上报失败:", {
      error: error.message,
      agentId,
      sessionId,
      cost,
      timestamp: new Date().toISOString(),
    });

    return {
      success: false,
      error: error.message || "Unknown error",
    };
  }
}
