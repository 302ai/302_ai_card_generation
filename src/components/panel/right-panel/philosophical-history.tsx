import { useAtom } from "jotai";
import React, { useState, useEffect } from "react";
import { useHistory } from "@/hooks/db/use-gen-history";
import { format } from "date-fns";
import {
  FileDown,
  Trash,
  WandSparkles,
  AlertCircle,
  Loader2,
  RocketIcon,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ky from "ky";
import { env } from "@/env";
import { appConfigAtom } from "@/stores/slices/config_store";
import { store } from "@/stores";
import { useMonitorMessage } from "@/hooks/global/use-monitor-message";
import { usePhilosophicalHistory } from "@/hooks/db/use-philosophical-history";
import HtmlPreview from "./html-preview";
import { MagicWandIcon } from "@radix-ui/react-icons";
import { modalStoreAtom } from "@/stores/slices/modal_store";
import ChangeStyleModal from "./change-style-modal";
import { useTranslations } from "next-intl";
import DownloadDropdown from "./download-dropdown";
import {
  concurrentTaskCountAtom,
  MAX_CONCURRENT_TASKS,
} from "@/stores/slices/task_store";
import { toast } from "sonner";
import { genPhilosophicalCard } from "@/services/gen-philosophical-card";

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

const PhilosophicalCardHistory = () => {
  const {
    philosophicalHistory,
    deletePhilosophicalHistory,
    updatePhilosophicalHistoryStatus,
    updatePhilosophicalHistoryUrl,
    updatePhilosophicalHistoryHtml,
    updatePhilosophicalHistory,
  } = usePhilosophicalHistory();
  const { apiKey } = store.get(appConfigAtom);
  const { handleDownload } = useMonitorMessage();
  const [modalStore, setModalStore] = useAtom(modalStoreAtom);
  const [styleModalOpen, setStyleModalOpen] = useState(false);
  const [selectedHtml, setSelectedHtml] = useState<string>("");
  const t = useTranslations();
  const [concurrentTasks, setConcurrentTasks] = useAtom(
    concurrentTaskCountAtom
  );

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

  // Handle deletion with concurrent task counter decrement
  const handleDelete = (id: string, status: string) => {
    // Decrement the counter if deleting a pending task
    if (status === "pending") {
      setConcurrentTasks((prev) => Math.max(0, prev - 1));
    }
    deletePhilosophicalHistory(id);
  };

  const handleDeploy = async (id: string, html: string) => {
    const formData = new FormData();
    if (apiKey) {
      formData.append("apiKey", apiKey);
    }
    formData.append("htmlCode", html);

    try {
      const loadingToast = toast.loading(t("toast.deploying"));
      const response = await ky.post("/api/deploy-html", {
        body: formData,
      });
      const data = (await response.json()) as { url?: string };
      toast.dismiss(loadingToast);
      if (data.url) {
        // Update status or show success notification if needed
        updatePhilosophicalHistoryUrl(id, data.url);
        toast.success(t("toast.deploy_success"));
      }
    } catch (error) {
      toast.dismiss(); // Dismiss any loading toasts
      toast.error(t("toast.deploy_failed"));
      console.error("Deploy failed:", error);
    }
  };

  const handleRetry = async (values: any) => {
    if (concurrentTasks >= MAX_CONCURRENT_TASKS) {
      toast.error(
        t("toast.task_limit_reached", { limit: MAX_CONCURRENT_TASKS })
      );
      return;
    }

    try {
      setConcurrentTasks((prev) => prev + 1);
      updatePhilosophicalHistoryStatus(values.historyId, "pending");
      const res = await genPhilosophicalCard(values);
      updatePhilosophicalHistoryStatus(values.historyId, "success");
      updatePhilosophicalHistory(values.historyId, {
        html: res.html,
        status: "success",
      });
      toast.success(t("toast.generation_success"));
    } catch (error) {
      console.error("Retry generation failed:", error);
      updatePhilosophicalHistoryStatus(values.historyId, "failed");
      toast.error(t("toast.generation_failed"));
    } finally {
      setConcurrentTasks((prev) => Math.max(0, prev - 1));
    }
  };

  // Check for stale pending tasks (older than 5 minutes)
  useEffect(() => {
    if (!philosophicalHistory?.items) return;

    const checkStaleItems = () => {
      const now = Date.now();
      const fiveMinutesInMs = 5 * 60 * 1000;

      philosophicalHistory.items.forEach((item) => {
        if (item.status === "pending") {
          const itemAge = now - item.createdAt;

          // If the item is pending for more than 5 minutes
          if (itemAge > fiveMinutesInMs) {
            // Mark as failed
            updatePhilosophicalHistoryStatus(item.id, "failed");

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
  }, [
    philosophicalHistory?.items,
    setConcurrentTasks,
    updatePhilosophicalHistoryStatus,
  ]);

  return (
    <>
      {/* 卡片网格布局 */}
      <div className="grid w-full grid-cols-1 gap-4 p-4 sm:grid-cols-2 md:grid-cols-3">
        {philosophicalHistory?.items.map((item, index) => {
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
                <div className="flex w-full items-center justify-end p-2">
                  <div className="flex items-center justify-end">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(item.id, item.status);
                      }}
                      className="h-8 w-8"
                    >
                      <Trash className="h-4 w-4 text-red-500 dark:text-red-400" />
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
                        handleRetry(item.values);
                      }}
                      className="h-8 w-8"
                    >
                      <RefreshCw className="h-4 w-4 text-red-500 dark:text-red-400" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(item.id, item.status);
                      }}
                      className="h-8 w-8"
                    >
                      <Trash className="h-4 w-4 text-red-500 dark:text-red-400" />
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
              title={t("label.philosophical_card_preview")}
              key={item.id}
            >
              <div className="flex items-center justify-between p-2">
                <span className="max-w-[60%] truncate text-xs text-gray-500 sm:text-sm">
                  {item?.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      {item.url}
                    </a>
                  )}
                </span>
                <div className="flex items-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeploy(item.id, sanitizeHtml(item.html));
                    }}
                    className="h-8 w-8"
                  >
                    <RocketIcon className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedHtml(sanitizeHtml(item.html));
                      setStyleModalOpen(true);
                    }}
                    className="h-8 w-8"
                  >
                    <WandSparkles className="h-4 w-4 text-purple-500 dark:text-purple-400" />
                  </Button>
                  <DownloadDropdown
                    html={sanitizeHtml(item.html)}
                    filename="philosophical-card"
                    className="h-8"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(item.id, item.status);
                    }}
                    className="ml-1 h-8 w-8"
                  >
                    <Trash className="h-4 w-4 text-red-500 dark:text-red-400" />
                  </Button>
                </div>
              </div>
            </HtmlPreview>
          );
        })}
      </div>

      <ChangeStyleModal
        open={styleModalOpen}
        onOpenChange={setStyleModalOpen}
        data={{ html: selectedHtml }}
      />
    </>
  );
};

export default PhilosophicalCardHistory;
