import React, { useState, useEffect } from "react";
import { useHistory } from "@/hooks/db/use-gen-history";
import { format } from "date-fns";
import { Trash, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import HtmlPreview from "./html-preview";
import { useTranslations } from "next-intl";
import DownloadDropdown from "./download-dropdown";
import { useAtom } from "jotai";
import { concurrentTaskCountAtom } from "@/stores/slices/task_store";

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

const KnowledgeHistory = () => {
  const { history, deleteHistory, updateHistoryStatus } = useHistory();
  const [isEnlarged, setIsEnlarged] = useState(false);
  const [selectedHtml, setSelectedHtml] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [modalShow, setModalShow] = useState(false);
  const [concurrentTasks, setConcurrentTasks] = useAtom(
    concurrentTaskCountAtom
  );
  const t = useTranslations();

  // Format timestamp function
  const formatTimestamp = (timestamp: string | number) => {
    try {
      const date = new Date(Number(timestamp));
      return format(date, "yyyy-MM-dd HH:mm:ss");
    } catch (error) {
      console.error("Error formatting date:", error);
      return timestamp;
    }
  };

  // Check for stale pending tasks (older than 5 minutes)
  useEffect(() => {
    if (!history?.items) return;

    const checkStaleItems = () => {
      const now = Date.now();
      const fiveMinutesInMs = 5 * 60 * 1000;

      history.items.forEach((item) => {
        if (item.status === "pending") {
          const itemAge = now - item.createdAt;

          // If the item is pending for more than 5 minutes
          if (itemAge > fiveMinutesInMs) {
            // Mark as failed
            updateHistoryStatus(item.id, "failed");

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
  }, [history?.items, setConcurrentTasks, updateHistoryStatus]);

  return (
    <>
      {/* 卡片网格布局 */}
      <div className="grid w-full grid-cols-1 gap-4 p-4 sm:grid-cols-2 md:grid-cols-3">
        {history?.items.map((item, index) => {
          // Handle loading state
          if (item.status === "pending") {
            return (
              <div
                key={item.id}
                className="flex aspect-[2/3] w-full flex-col items-center rounded-lg border border-gray-200 bg-white shadow-sm"
              >
                <div className="flex flex-1 flex-col items-center justify-center space-y-4 p-4 text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-primary">
                    {t("status.generating")}...
                  </p>
                </div>
                <div className="flex w-full items-center justify-between p-2">
                  <span className="text-sm text-gray-500">
                    {formatTimestamp(item.createdAt)}
                  </span>
                  <div className="flex">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteHistory(item.id);
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
                        deleteHistory(item.id);
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
            <HtmlPreview
              html={sanitizeHtml(item.html)}
              title={t("label.knowledge_card_preview")}
              key={item.id}
            >
              <div className="flex items-center justify-between p-2">
                <span className="max-w-[60%] truncate text-xs text-gray-500 sm:text-sm">
                  {formatTimestamp(item.createdAt)}
                </span>
                <div className="flex items-center">
                  <DownloadDropdown
                    html={sanitizeHtml(item.html)}
                    filename="knowledge-card"
                    className="h-8"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteHistory(item.id);
                    }}
                    className="ml-1 h-8 w-8"
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </HtmlPreview>
          );
        })}
      </div>
    </>
  );
};

export default KnowledgeHistory;
