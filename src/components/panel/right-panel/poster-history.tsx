import { useAtom } from "jotai";
import React, { useState, useEffect } from "react";
import { useHistory } from "@/hooks/db/use-gen-history";
import { format } from "date-fns";
import { FileDown, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import ky from "ky";
import { env } from "@/env";
import { appConfigAtom } from "@/stores/slices/config_store";
import { store } from "@/stores";
import { useMonitorMessage } from "@/hooks/global/use-monitor-message";
import { usePosterHistory } from "@/hooks/db/use-poster-history";

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

  /* Additional styles for modal SVG */
  .modal-svg-container {
    max-height: 100%;
    max-width: 100%;
    overflow: visible;
    display: flex;
    align-items: center;
    justify-content: center;
    aspect-ratio: 800 / 1120; /* Maintain poster aspect ratio */
    margin: 0 auto;
    height: auto;
    padding: 0;
  }
  
  .modal-svg-container svg {
    max-width: 100%;
    max-height: 100%;
    width: auto;
    height: 100%;
    min-width: 500px;
    max-width: 800px;
    min-height: 700px; /* Significantly increased for better visibility */
    max-height: calc(95vh - 60px); /* Using more of the viewport height */
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    background-color: white;
  }
`;

const PosterHistory = () => {
  const { posterHistory, deletePosterHistory } = usePosterHistory();
  const [isEnlarged, setIsEnlarged] = useState(false);
  const [selectedSvg, setSelectedSvg] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [modalShow, setModalShow] = useState(false);
  const { apiKey } = store.get(appConfigAtom);
  const { handleDownload } = useMonitorMessage();

  // 下载SVG为PNG
  const onDownLoad = async (svgContent: string) => {
    try {
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

      handleDownload(resp.output, "poster.png");
    } catch (error) {
      console.error("Error downloading SVG:", error);
      // Fallback to direct SVG download if PNG conversion fails
      const blob = new Blob([svgContent], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      handleDownload(url, "poster.svg");
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

  return (
    <>
      {/* 添加自定义动画CSS */}
      <style>{customAnimationStyles}</style>

      {/* SVG 卡片网格布局 */}
      <div className="grid w-full grid-cols-3 gap-4 p-4">
        {posterHistory?.items.map((item, index) => {
          // Try to find SVG content in the item's html field
          const svgContent = extractSvgContent(item.svg || "");

          if (!svgContent || !svgContent.includes("<svg")) {
            return null; // Skip if no valid SVG content
          }

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
                <span className="text-sm text-gray-500">
                  {formatTimestamp(item.createdAt)}
                </span>
                <div className="flex">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDownLoad(svgContent);
                    }}
                    aria-label="下载"
                  >
                    <FileDown className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      deletePosterHistory(item.id);
                    }}
                    aria-label="删除"
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
          className={`modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/75 ${
            modalShow ? "show" : ""
          }`}
          onClick={handleCloseModal}
        >
          <div
            className={`modal-content relative h-auto max-h-[95%] max-w-[90%] rounded-lg bg-white shadow-xl ${
              modalShow ? "show" : ""
            }`}
            style={{ width: "auto", minWidth: "50vw" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal 标题栏 */}
            <div className="flex items-center justify-between rounded-t-lg border-b border-gray-100 bg-gray-50 px-4 py-2">
              <h3 className="m-0 text-base font-semibold text-gray-700">
                {selectedIndex !== null
                  ? `海报预览 #${selectedIndex + 1}`
                  : "海报预览"}
              </h3>
              <button
                className="flex h-8 w-8 items-center justify-center rounded-full border-0 bg-transparent text-xl text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 focus:outline-none"
                onClick={handleCloseModal}
                aria-label="关闭"
              >
                ✕
              </button>
            </div>

            {/* SVG 完整预览 */}
            <div className="flex h-auto w-full items-center justify-center overflow-auto rounded-b-lg bg-white p-3">
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
