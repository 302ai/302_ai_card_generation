import { useSearchParams, usePathname } from "next/navigation";
import { useEffect } from "react";

const MULERUN_STORAGE_KEY = "mulerun_session";

export function useFromMulerun() {
  const sp = useSearchParams();
  const pathname = usePathname();

  // 从URL查询参数获取MuleRun参数
  const signature = sp.get("signature");
  const querySessionId = sp.get("sessionId");
  const agentId = sp.get("agentId");
  const origin = sp.get("origin");

  // 从URL路径提取sessionId（用于直接访问MuleRun链接的情况）
  // 匹配 /agents/xxx/sessions/sessionId 格式
  const pathSessionMatch = pathname.match(
    /\/agents\/[^\/]+\/sessions\/([^\/\?]+)/
  );
  const pathSessionId = pathSessionMatch ? pathSessionMatch[1] : null;

  // 优先使用查询参数中的sessionId，如果没有则使用路径中的
  const currentSessionId = querySessionId || pathSessionId;

  // 检查是否是MuleRun iframe访问（有完整的MuleRun参数）
  const isCurrentUrlMulerun = !!(
    signature &&
    querySessionId &&
    agentId &&
    origin === "mulerun.com"
  );

  // 检查是否在iframe中
  const isInIframe = typeof window !== "undefined" && window.parent !== window;

  // 检查是否是直接访问MuleRun agent页面（路径中有sessionId但没有查询参数）
  const isMulerunAgentPage = !!(pathSessionId && isInIframe);

  // 如果是MuleRun访问，保存数据
  useEffect(() => {
    if (isCurrentUrlMulerun || (isMulerunAgentPage && currentSessionId)) {
      const mulerunData = {
        signature: signature || "direct_access",
        sessionId: currentSessionId,
        agentId: agentId || "from_path",
        pathname,
        timestamp: Date.now(), // 添加时间戳
      };
      sessionStorage.setItem(MULERUN_STORAGE_KEY, JSON.stringify(mulerunData));
    }
  }, [
    signature,
    currentSessionId,
    agentId,
    origin,
    pathname,
    isCurrentUrlMulerun,
    isMulerunAgentPage,
  ]);

  // 从sessionStorage获取数据
  const storedData =
    typeof window !== "undefined"
      ? JSON.parse(sessionStorage.getItem(MULERUN_STORAGE_KEY) || "null")
      : null;

  // 在iframe环境中，如果有存储的MuleRun数据，就认为是MuleRun会话的延续
  const isIframeMulerunContinuation =
    isInIframe && storedData && storedData.sessionId;

  const finalData = {
    signature:
      signature || (isIframeMulerunContinuation ? storedData?.signature : null),
    sessionId:
      currentSessionId ||
      (isIframeMulerunContinuation ? storedData?.sessionId : null),
    agentId:
      agentId || (isIframeMulerunContinuation ? storedData?.agentId : null),
  };

  // 判断是否是MuleRun模式：
  // 1. 当前URL有完整MuleRun参数
  // 2. 是MuleRun agent页面
  // 3. 在iframe中且有存储的MuleRun数据（会话延续）
  const isMulerun =
    isCurrentUrlMulerun ||
    isMulerunAgentPage ||
    (isIframeMulerunContinuation && !!finalData.sessionId);

  return {
    isMulerun,
    sessionId: finalData.sessionId,
    agentId: finalData.agentId,
    signature: finalData.signature,
  };
}
