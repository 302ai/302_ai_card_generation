import { useAtom } from "jotai";
import React, { useState, useEffect } from "react";
import { useHistory } from "@/hooks/db/use-gen-history";
import { format } from "date-fns";
import { Download, Trash, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import ky from "ky";
import { env } from "@/env";
import { appConfigAtom } from "@/stores/slices/config_store";
import { store } from "@/stores";
import { useMonitorMessage } from "@/hooks/global/use-monitor-message";
import { usePosterHistory } from "@/hooks/db/use-poster-history";
import { useTranslations } from "next-intl";
import { concurrentTaskCountAtom } from "@/stores/slices/task_store";
import { toast } from "sonner";

// Utility function to extract SVG content from various formats
const extractSvgContent = (content: string): string => {
  try {
    let svgContent = "";

    // Check if it's already a valid SVG
    if (content.trim().startsWith("<svg") && content.includes("</svg>")) {
      svgContent = content;
    }
    // Check if SVG is wrapped in markdown code blocks
    else if (content.includes("```")) {
      const cleaned = content
        .replace(/```+svg/g, "")
        .replace(/```+/g, "")
        .trim();

      if (cleaned.startsWith("<svg") && cleaned.includes("</svg>")) {
        svgContent = cleaned;
      }
    }
    // Try to extract SVG from JSON
    else {
      try {
        if (content.trim().startsWith("{") || content.trim().startsWith("[")) {
          const parsed = JSON.parse(content);
          if (typeof parsed === "string" && parsed.includes("<svg")) {
            svgContent = parsed;
          }
        }
      } catch (e) {
        // Ignore parsing errors
      }

      // Find any SVG content in the string if not found yet
      if (!svgContent) {
        const svgMatch = content.match(/<svg[\s\S]*?<\/svg>/);
        if (svgMatch) {
          svgContent = svgMatch[0];
        } else {
          svgContent = content;
        }
      }
    }

    // Ensure SVG has proper viewport attributes for poster dimensions
    if (svgContent.includes("<svg")) {
      // Check if SVG already has viewBox
      if (!svgContent.includes("viewBox=")) {
        // Add viewBox if missing with poster dimensions (A3 ratio: 800x1120)
        svgContent = svgContent.replace(/<svg/, '<svg viewBox="0 0 800 1120"');
      }

      // Make sure SVG has width and height attributes for proper scaling
      if (!svgContent.includes("width=")) {
        svgContent = svgContent.replace(/<svg/, '<svg width="100%"');
      } else {
        // Replace any fixed width with 100%
        svgContent = svgContent.replace(/width="[^"]*"/, 'width="100%"');
      }

      if (!svgContent.includes("height=")) {
        svgContent = svgContent.replace(/<svg/, '<svg height="100%"');
      } else {
        // Replace any fixed height with 100%
        svgContent = svgContent.replace(/height="[^"]*"/, 'height="100%"');
      }

      // Add preserveAspectRatio attribute if not present to maintain poster ratio
      if (!svgContent.includes("preserveAspectRatio=")) {
        svgContent = svgContent.replace(
          /<svg/,
          '<svg preserveAspectRatio="xMidYMid meet"'
        );
      }
    }

    return svgContent;
  } catch (error) {
    console.error("Error extracting SVG content:", error);
    return content;
  }
};

// 添加自定义动画的CSS
const customAnimationStyles = `
  /* Modal 动画 */
  .modal-overlay {
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  .modal-overlay.show {
    opacity: 1;
  }
  
  .modal-content {
    transform: scale(0.9);
    opacity: 0;
    transition: transform 0.3s ease, opacity 0.3s ease;
  }
  
  .modal-content.show {
    transform: scale(1);
    opacity: 1;
  }
  
  /* SVG 样式 */
  .svg-container {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: white;
    overflow: hidden; /* Prevent overflow */
    aspect-ratio: 800 / 1120; /* Poster aspect ratio (A3-like) */
  }
  
  .svg-container svg {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    width: 100%; /* Force SVG to respect container width */
    height: auto; /* Maintain aspect ratio */
  }

  /* Additional styles for modal SVG - Revised */
  .modal-svg-container {
    /* 使用 Flexbox 来居中 SVG 子元素 */
    display: flex; 
    align-items: center;
    justify-content: center;
    
    /* 设置较大的默认尺寸 */
    min-width: 600px;
    min-height: 800px;
    
    /* 保持海报宽高比 */
    aspect-ratio: 800 / 1120;
    
    /* 让容器充满其父级（即滚动区域） */
    width: 100%;
    margin: 0 auto;
  }

  .modal-svg-container svg {
    /* 关键：确保 SVG 不会超出其容器 */
    max-width: 100%;
    max-height: 100%;
    min-width: 600px; /* 设置最小宽度 */
    width: 100%; /* 填充容器宽度 */
    
    /* 视觉样式 (保留) */
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    background-color: white; /* 保留背景色以便看清边界 */
  }
`;

const PosterHistory = () => {
  const { posterHistory, deletePosterHistory, updatePosterHistoryStatus } =
    usePosterHistory();
  const [isEnlarged, setIsEnlarged] = useState(false);
  const [selectedSvg, setSelectedSvg] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [modalShow, setModalShow] = useState(false);
  const { apiKey } = store.get(appConfigAtom);
  const { handleDownload } = useMonitorMessage();
  const [concurrentTasks, setConcurrentTasks] = useAtom(
    concurrentTaskCountAtom
  );
  const t = useTranslations();

  // Handle deletion with concurrent task counter decrement
  const handleDelete = (id: string, status: string) => {
    // Decrement the counter if deleting a pending task
    if (status === "pending") {
      setConcurrentTasks((prev) => Math.max(0, prev - 1));
    }
    deletePosterHistory(id);
  };

  // 下载SVG为PNG
  const onDownLoad = async (svgContent: string) => {
    try {
      // Show toast notification for download start
      const toastId = toast(t("status.downloading"));

      // Create a Blob from the SVG content
      const blob = new Blob([svgContent], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);

      // 转换为PNG并下载
      const resp = await ky
        .post(`${env.NEXT_PUBLIC_API_URL}/v1/svgtopng`, {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
          json: {
            svgCode: svgContent,
          },
        })
        .json<{
          output: string;
        }>();

      // Dismiss the downloading toast
      toast.dismiss(toastId);

      handleDownload(resp.output, "poster.png");

      // Show success notification
      toast.success(t("toast.download_success"));
    } catch (error) {
      console.error("Error downloading SVG:", error);
      // Show error notification
      toast.error(t("toast.download_failed"));

      // Fallback to direct SVG download if PNG conversion fails
      try {
        const blob = new Blob([svgContent], { type: "image/svg+xml" });
        const url = URL.createObjectURL(blob);
        handleDownload(url, "poster.svg");
        toast.success(t("toast.download_success"));
      } catch (fallbackError) {
        console.error("Fallback SVG download failed:", fallbackError);
        toast.error(t("toast.download_failed"));
      }
    }
  };

  // 处理SVG预览点击
  const handlePreviewClick = (svgContent: string, index: number) => {
    setSelectedSvg(svgContent);
    setSelectedIndex(index);
    setIsEnlarged(true);

    // 延迟显示动画效果
    setTimeout(() => {
      setModalShow(true);
    }, 50);
  };

  // 处理关闭弹窗
  const handleCloseModal = () => {
    setModalShow(false);

    // 动画结束后才真正关闭弹窗
    setTimeout(() => {
      setIsEnlarged(false);
      setSelectedSvg(null);
    }, 300);
  };

  // 监听ESC键关闭弹窗
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isEnlarged) {
        handleCloseModal();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isEnlarged]);

  // Format timestamp function
  const formatTimestamp = (timestamp: string | number) => {
    try {
      const date = new Date(Number(timestamp));
      return format(date, "yyyy-MM-dd HH:mm:ss");
    } catch (error) {
      console.error("Error formatting date:", error);
      return timestamp; // Return original timestamp if formatting fails
    }
  };

  // Check for stale pending tasks (older than 5 minutes)
  useEffect(() => {
    if (!posterHistory?.items) return;

    const checkStaleItems = () => {
      const now = Date.now();
      const fiveMinutesInMs = 5 * 60 * 1000;

      posterHistory.items.forEach((item) => {
        if (item.status === "pending") {
          const itemAge = now - item.createdAt;

          // If the item is pending for more than 5 minutes
          if (itemAge > fiveMinutesInMs) {
            // Mark as failed
            updatePosterHistoryStatus(item.id, "failed");

            // Decrement the concurrent task count
            setConcurrentTasks((prev) => Math.max(0, prev - 1));
          }
        }
      });
    };

    // Initial check
    checkStaleItems();

    // Set up interval to check periodically
    const intervalId = setInterval(checkStaleItems, 30000); // Check every 30 seconds

    return () => clearInterval(intervalId);
  }, [posterHistory?.items, setConcurrentTasks, updatePosterHistoryStatus]);

  return (
    <>
      {/* 添加自定义动画CSS */}
      <style>{customAnimationStyles}</style>

      {/* SVG 卡片网格布局 */}
      <div className="grid w-full grid-cols-1 gap-4 p-4 sm:grid-cols-2 md:grid-cols-3">
        {posterHistory?.items.map((item, index) => {
          // Handle loading state
          if (item.status === "pending") {
            return (
              <div
                key={item.id}
                className="flex aspect-[2/3] w-full flex-col rounded-lg border border-gray-200 bg-white shadow-sm"
              >
                <div className="flex flex-1 flex-col items-center justify-center space-y-4 p-4 text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-primary">
                    {t("status.generating")}...
                  </p>
                </div>
                <div className="flex w-full items-center justify-between p-2">
                  <span className="max-w-[60%] truncate text-xs text-gray-500 sm:text-sm">
                    {formatTimestamp(item.createdAt)}
                  </span>
                  <div className="flex items-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(item.id, item.status);
                      }}
                      className="h-8 w-8"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          }

          // Handle failed state
          if (item.status === "failed") {
            return (
              <div
                key={item.id}
                className="flex aspect-[2/3] w-full flex-col items-center justify-center rounded-lg border border-red-200 bg-white shadow-sm"
              >
                <div className="flex flex-col items-center justify-center space-y-4 p-4 text-center">
                  <AlertCircle className="h-8 w-8 text-red-500" />
                  <p className="text-sm text-red-500">
                    {t("status.generating_failed")}
                  </p>

                  <div className="flex">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(item.id, item.status);
                      }}
                      className="h-8 w-8"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          }

          // Try to find SVG content in the item's html field
          const svgContent = extractSvgContent(item.svg || "");

          if (!svgContent || !svgContent.includes("<svg")) {
            // Instead of returning null, show an error card for invalid SVG content
            return (
              <div
                key={item.id}
                className="flex aspect-[2/3] w-full flex-col items-center justify-center rounded-lg border border-orange-200 bg-white shadow-sm"
              >
                <div className="flex flex-col items-center justify-center space-y-4 p-4 text-center">
                  <AlertCircle className="h-8 w-8 text-orange-500" />
                  <p className="text-sm text-orange-500">
                    {t("status.invalid_svg")}
                  </p>
                  <p className="mt-2 text-xs text-gray-500">
                    {item.svg
                      ? `${item.svg.substring(0, 50)}...`
                      : t("status.empty_content")}
                  </p>
                  <div className="flex">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(item.id, item.status);
                      }}
                      className="h-8 w-8"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          }

          // Normal success state
          return (
            <div
              className="flex w-full cursor-pointer flex-col rounded-lg border border-gray-200 bg-white shadow-sm transition-all duration-200 ease-in-out hover:-translate-y-1 hover:shadow-md"
              key={index}
              onClick={() => handlePreviewClick(svgContent, index)}
            >
              <div
                className="svg-container flex w-full flex-grow items-center justify-center p-2"
                onClick={() => handlePreviewClick(svgContent, index)}
              >
                <div
                  className="flex h-full w-full items-center justify-center overflow-hidden"
                  dangerouslySetInnerHTML={{ __html: svgContent }}
                />
              </div>

              <div className="flex items-center justify-between border-t p-2">
                <span className="max-w-[60%] truncate text-xs text-gray-500 sm:text-sm">
                  {formatTimestamp(item.createdAt)}
                </span>
                <div className="flex items-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDownLoad(svgContent);
                    }}
                    aria-label="下载"
                    className="h-8 w-8"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(item.id, item.status);
                    }}
                    aria-label="删除"
                    className="ml-1 h-8 w-8"
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 放大预览的 Modal */}
      {isEnlarged && selectedSvg && (
        <div
          className={`modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 ${
            modalShow ? "show" : ""
          }`}
          onClick={handleCloseModal}
        >
          <div
            className={`modal-content relative flex max-h-[95vh] max-w-[95vw] flex-col rounded-lg bg-white shadow-xl ${
              modalShow ? "show" : ""
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal 标题栏 */}
            <div className="flex flex-shrink-0 items-center justify-between rounded-t-lg border-b border-gray-100 bg-gray-50 px-4 py-2">
              <h3 className="m-0 text-base font-semibold text-gray-700">
                {selectedIndex !== null
                  ? `${t("label.poster_preview")}`
                  : t("label.poster_preview")}
              </h3>
              <button
                className="flex h-8 w-8 items-center justify-center rounded-full border-0 bg-transparent text-xl text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 focus:outline-none"
                onClick={handleCloseModal}
                aria-label="close"
              >
                ✕
              </button>
            </div>

            {/* SVG 完整预览 */}
            <div className="flex-grow overflow-auto p-3">
              <div
                className="modal-svg-container"
                dangerouslySetInnerHTML={{ __html: selectedSvg }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PosterHistory;
