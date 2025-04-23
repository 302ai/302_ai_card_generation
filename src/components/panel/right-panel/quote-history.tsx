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
import { useGenQuoteHistory } from "@/hooks/db/use-gen-quote-history";

// Utility function to properly sanitize and clean HTML content
const sanitizeHtml = (htmlContent: string): string => {
  try {
    // Check if the html is already clean and starts with proper doctype or html tag
    if (
      htmlContent.trim().startsWith("<!DOCTYPE") ||
      htmlContent.trim().startsWith("<html")
    ) {
      return htmlContent;
    }

    // Check if the HTML content is wrapped in markdown code blocks
    if (htmlContent.includes("```")) {
      // Remove markdown code blocks
      const cleaned = htmlContent
        .replace(/```+html/g, "") // Remove ```html
        .replace(/```+/g, "") // Remove any remaining ```
        .trim();

      // If the cleaned content is valid HTML, return it
      if (cleaned.startsWith("<!DOCTYPE") || cleaned.startsWith("<html")) {
        return cleaned;
      }

      // If it might be a JSON string containing HTML
      try {
        const parsed = JSON.parse(cleaned);
        return typeof parsed === "string" ? parsed : cleaned;
      } catch (e) {
        return cleaned;
      }
    }

    // Try parsing as JSON if it seems to be a JSON string
    try {
      if (
        htmlContent.trim().startsWith("{") ||
        htmlContent.trim().startsWith("[")
      ) {
        const parsed = JSON.parse(htmlContent);
        return typeof parsed === "string" ? parsed : htmlContent;
      }
    } catch (e) {
      // Ignore parsing errors and continue
    }

    // Return the original if we couldn't clean it
    return htmlContent;
  } catch (error) {
    console.error("Error sanitizing HTML:", error);
    return htmlContent;
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
  
  /* 隐藏iframe滚动条 */
  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }
  
  .no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`;

const QuoteHistory = () => {
  const { quoteHistory, deleteQuoteHistory } = useGenQuoteHistory();
  const [isEnlarged, setIsEnlarged] = useState(false);
  const [selectedHtml, setSelectedHtml] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [modalShow, setModalShow] = useState(false);
  const { apiKey } = store.get(appConfigAtom);
  const { handleDownload } = useMonitorMessage();

  const onDownLoad = async (html: string) => {
    const resp = await ky
      .post(`${env.NEXT_PUBLIC_API_URL}/v1/htmltopng`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        json: {
          htmlCode: html,
        },
      })
      .json<{
        output: string;
      }>();
    handleDownload(resp.output, "knowledge-card.png");
  };

  // 处理卡片点击
  const handlePreviewClick = (html: string, index: number) => {
    setSelectedHtml(html);
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
      setSelectedHtml(null);
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

  // 修改HTML内容以确保正确渲染，只显示顶部内容
  const optimizeHtmlForPreview = (html: string): string => {
    const sanitized = sanitizeHtml(html);
    // 添加CSS以确保内容正确缩放，只显示顶部内容，并隐藏滚动条
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            html, body {
              margin: 0;
              padding: 0;
              width: 100%;
              height: 100%;
              overflow: hidden;
              font-family: Arial, sans-serif;
            }
            body {
              display: block;
              position: relative;
            }
            .content-container {
              width: 100%;
              overflow: hidden;
            }
            * {
              box-sizing: border-box;
            }
            img, svg {
              max-width: 100%;
              height: auto;
            }
            ::-webkit-scrollbar {
              display: none;
              width: 0 !important;
              height: 0 !important;
            }
            * {
              scrollbar-width: none;
              -ms-overflow-style: none;
            }
          </style>
        </head>
        <body>
          <div class="content-container">
            ${sanitized}
          </div>
        </body>
      </html>
    `;
  };

  // 为完整预览优化的HTML
  const optimizeHtmlForFullPreview = (html: string): string => {
    const sanitized = sanitizeHtml(html);
    // 添加CSS但允许内容滚动查看
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            html, body {
              margin: 0;
              padding: 0;
              width: 100%;
              height: 100%;
              font-family: Arial, sans-serif;
            }
            body {
              display: block;
              position: relative;
              overflow: auto;
            }
            .content-container {
              width: 100%;
              padding: 16px;
            }
            * {
              box-sizing: border-box;
            }
            img, svg {
              max-width: 100%;
              height: auto;
            }
          </style>
        </head>
        <body>
          <div class="content-container">
            ${sanitized}
          </div>
        </body>
      </html>
    `;
  };

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

      {/* 卡片网格布局 */}
      <div className="grid w-full grid-cols-3 gap-4 p-4">
        {quoteHistory?.items.map((item, index) => {
          const optimizedHtml = optimizeHtmlForPreview(item.html);

          return (
            <div
              className="aspect-[2/3] w-full cursor-pointer rounded-lg border border-gray-200 bg-white shadow-sm transition-all duration-200 ease-in-out hover:-translate-y-1 hover:shadow-md"
              key={index}
              onClick={() => handlePreviewClick(optimizedHtml, index)}
            >
              <iframe
                className="no-scrollbar pointer-events-none h-full w-full border-0"
                srcDoc={optimizedHtml}
                title={`Knowledge Card Preview ${index + 1}`}
                scrolling="no"
                sandbox="allow-scripts allow-same-origin"
              />
              <div className="flex items-center justify-between p-2">
                <span className="text-sm text-gray-500">
                  {formatTimestamp(item.createdAt)}
                </span>
                <div className="flex">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDownLoad(optimizedHtml);
                    }}
                  >
                    <FileDown className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteQuoteHistory(item.id);
                    }}
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
      {isEnlarged && selectedHtml && (
        <div
          className={`modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/75 ${
            modalShow ? "show" : ""
          }`}
          onClick={handleCloseModal}
        >
          <div
            className={`modal-content relative h-[90%] w-4/5 overflow-hidden rounded-lg bg-white shadow-xl ${
              modalShow ? "show" : ""
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal 标题栏 */}
            <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-4 py-3">
              <h3 className="m-0 text-base font-semibold text-gray-700">
                {selectedIndex !== null
                  ? `知识卡片预览 #${selectedIndex + 1}`
                  : "知识卡片预览"}
              </h3>
              <button
                className="flex h-8 w-8 items-center justify-center rounded-full border-0 bg-transparent text-xl text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 focus:outline-none"
                onClick={handleCloseModal}
                aria-label="关闭"
              >
                ✕
              </button>
            </div>

            {/* 完整预览内容 */}
            <iframe
              className="h-[calc(100%-48px)] w-full border-0"
              srcDoc={optimizeHtmlForFullPreview(selectedHtml)}
              title="Enlarged Knowledge Card Preview"
              sandbox="allow-scripts allow-same-origin"
              scrolling="auto"
            />
          </div>
        </div>
      )}
    </>
  );
};

export default QuoteHistory;
