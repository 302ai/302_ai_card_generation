const METERING_GET_URL = process.env.NEXT_PUBLIC_MULERUN_URL?.replace(
  "/report",
  "/session"
);
const API_TOKEN = process.env.NEXT_PUBLIC_MULERUN_API_KEY;

export interface SessionStatus {
  sessionId: string;
  sessionStatus: "running" | "completed" | "error";
  reportCount: number;
  isFinalReported: boolean;
  meteringRecords: Array<{
    meteringId: string;
    isFinal: boolean;
  }>;
}

export interface SessionDetectionResult {
  success: boolean;
  sessionStatus?: SessionStatus;
  error?: string;
}

/**
 * 检测 MuleRun session 状态
 */
export async function detectMulerunSession(
  sessionId: string
): Promise<SessionDetectionResult> {
  try {
    if (!METERING_GET_URL) {
      throw new Error(
        "NEXT_PUBLIC_MULERUN_URL environment variable not configured"
      );
    }

    if (!API_TOKEN) {
      throw new Error(
        "NEXT_PUBLIC_MULERUN_API_KEY environment variable not configured"
      );
    }

    console.log(`[Mulerun] 检测 session 状态: ${sessionId}`);

    const url = `${METERING_GET_URL}/${sessionId}`;
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
      },
    });

    if (!res.ok) {
      const errorText = await res.text();

      if (res.status === 404) {
        throw new Error(`Session not found: ${sessionId}`);
      } else if (res.status === 401) {
        throw new Error("Invalid authentication token");
      } else if (res.status === 403) {
        throw new Error("Permission denied for this session");
      } else {
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }
    }

    const result = await res.json();

    if (result.status !== "success") {
      throw new Error(`API returned non-success status: ${result.status}`);
    }

    const sessionStatus: SessionStatus = {
      sessionId: result.data.sessionId,
      sessionStatus: result.data.sessionStatus,
      reportCount: result.data.reportCount,
      isFinalReported: result.data.isFinalReported,
      meteringRecords: result.data.meteringRecords,
    };

    console.log(`[Mulerun] Session 状态检测成功:`, sessionStatus);

    return {
      success: true,
      sessionStatus,
    };
  } catch (error: any) {
    console.error("[Mulerun] Session 状态检测失败:", {
      error: error.message,
      sessionId,
      timestamp: new Date().toISOString(),
    });

    return {
      success: false,
      error: error.message || "Unknown error",
    };
  }
}

/**
 * 检查 session 是否还在运行
 */
export async function isSessionRunning(sessionId: string): Promise<boolean> {
  const result = await detectMulerunSession(sessionId);
  return result.success && result.sessionStatus?.sessionStatus === "running";
}

/**
 * 检查 session 是否已完成
 */
export async function isSessionCompleted(sessionId: string): Promise<boolean> {
  const result = await detectMulerunSession(sessionId);
  return result.success && result.sessionStatus?.sessionStatus === "completed";
}

/**
 * 检查 session 是否有错误
 */
export async function isSessionError(sessionId: string): Promise<boolean> {
  const result = await detectMulerunSession(sessionId);
  return result.success && result.sessionStatus?.sessionStatus === "error";
}
