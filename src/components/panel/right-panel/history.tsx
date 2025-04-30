import React, { useState, useEffect } from "react";
import { useHistory } from "@/hooks/db/use-gen-history";
import { format } from "date-fns";
import {
  Trash,
  AlertCircle,
  Loader2,
  RocketIcon,
  RefreshCw,
  WandSparkles,
  PencilLine,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import HtmlPreview from "./html-preview";
import { useTranslations } from "next-intl";
import DownloadDropdown from "./download-dropdown";
import { useAtom } from "jotai";
import {
  concurrentTaskCountAtom,
  MAX_CONCURRENT_TASKS,
} from "@/stores/slices/task_store";
import ky from "ky";
import { appConfigAtom } from "@/stores/slices/config_store";
import { store } from "@/stores";
import { toast } from "sonner";
import { generateHTML } from "@/services/gen-html";
import SvgPreview from "./svg-preview";
import ChangeStyleModal from "./change-style-modal";
import { readStreamableValue } from "ai/rsc";
import { genPhilosophicalCard } from "@/services/gen-philosophical-card";
import { generateQuoteCard } from "@/services/gen-quote";
import { generateSVG } from "@/services/generate-svg";
import { ErrorToast } from "@/components/ui/errorToast";
import EditHtmlModal from "./edit-html-modal";

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

const History = () => {
  const {
    history,
    deleteHistory,
    updateHistoryStatus,
    updateHistoryUrl,
    updateHistoryHtml,
  } = useHistory();
  const [isEnlarged, setIsEnlarged] = useState(false);
  const [selectedHtml, setSelectedHtml] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [styleModalOpen, setStyleModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [currentEditId, setCurrentEditId] = useState<string | null>(null);

  const [concurrentTasks, setConcurrentTasks] = useAtom(
    concurrentTaskCountAtom
  );
  const t = useTranslations();
  const { apiKey } = store.get(appConfigAtom);

  // Handle deletion with concurrent task counter decrement
  const handleDelete = (id: string, status: string) => {
    // Decrement the counter if deleting a pending task
    if (status === "pending") {
      setConcurrentTasks((prev) => Math.max(0, prev - 1));
    }
    deleteHistory(id);
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

  const handleDeploy = async (id: string, html: string) => {
    // Check if the content is just an SVG and wrap it if needed
    let processedHtml = html;
    const historyItem = history?.items.find((item) => item.id === id);

    // If it's only an SVG, wrap it in a proper HTML document with div
    if (
      (html.trim().startsWith("<svg") || html.trim().startsWith("svg")) &&
      html.trim().endsWith("</svg>")
    ) {
      // If it starts with "svg", remove that prefix first
      const cleanedHtml = html.trim().startsWith("svg")
        ? html.trim().substring(3).trim()
        : html;

      processedHtml = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${historyItem?.content}</title>
</head>
<body>
    <div style="display:flex;justify-content:center">${cleanedHtml}</div>
</body>
</html>`;
    }
    // If it's HTML but missing charset, try to add it
    else if (
      html.includes("<html") &&
      !html.includes('<meta charset="UTF-8">')
    ) {
      // Try to insert charset meta tag after the head tag
      if (html.includes("<head>")) {
        processedHtml = html.replace(
          "<head>",
          '<head>\n    <meta charset="UTF-8">'
        );
      }
    }

    const formData = new FormData();
    if (apiKey) {
      formData.append("apiKey", apiKey);
    }
    formData.append("htmlCode", processedHtml);

    try {
      const loadingToast = toast.loading(t("toast.deploying"));
      const response = await ky.post("/api/deploy-html", {
        body: formData,
      });
      const data = (await response.json()) as { url?: string };
      toast.dismiss(loadingToast);
      if (data.url) {
        // Update status or show success notification if needed
        updateHistoryUrl(id, data.url);
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
      updateHistoryStatus(values.historyId, "pending");

      // Check the action type to decide which generation function to use
      if (values.actionType === "knowledge-card") {
        const res = await generateHTML({
          ...values,
          apiKey: apiKey as string,
        });
        if (res?.output) {
          let chatValue = "";
          for await (const delta of readStreamableValue(res.output)) {
            if (delta?.type === "text-delta") {
              chatValue += delta?.textDelta;
            } else if (delta?.type === "logprobs") {
              // Process is complete
              updateHistoryHtml(values.historyId, chatValue, "success");
            }
          }
        }
      } else if (values.actionType === "promotional-poster") {
        const res = await generateSVG({
          ...values,
          apiKey: apiKey as string,
        });
        if (res?.output) {
          let chatValue = "";
          for await (const delta of readStreamableValue(res.output)) {
            if (delta?.type === "text-delta") {
              chatValue += delta?.textDelta;
            } else if (delta?.type === "logprobs") {
              // Clean SVG string from markdown formatting
              const cleanedSVG = chatValue;
              updateHistoryHtml(values.historyId, cleanedSVG, "success");
            }
          }
        }
      } else if (values.actionType === "philosophical-card") {
        const res = await genPhilosophicalCard({
          ...values,
          apiKey: apiKey as string,
        });
        if (res?.output) {
          let chatValue = "";
          for await (const delta of readStreamableValue(res.output)) {
            if (delta?.type === "text-delta") {
              chatValue += delta?.textDelta;
            } else if (delta?.type === "logprobs") {
              updateHistoryHtml(values.historyId, chatValue, "success");
            }
          }
        }
      } else if (values.actionType === "quote-reference") {
        const res = await generateQuoteCard({
          ...values,
          apiKey: apiKey as string,
        });
        if (res?.output) {
          let chatValue = "";
          for await (const delta of readStreamableValue(res.output)) {
            if (delta?.type === "text-delta") {
              chatValue += delta?.textDelta;
            } else if (delta?.type === "logprobs") {
              updateHistoryHtml(values.historyId, chatValue, "success");
            }
          }
        }
      }
    } catch (error: any) {
      console.error("Retry generation failed:", error);
      updateHistoryStatus(values.historyId, "failed");

      if (error?.message?.error?.err_code) {
        toast.error(() => ErrorToast(error.message.error.err_code));
      } else {
        toast.error(t("generate_error"));
      }
    } finally {
      setConcurrentTasks((prev) => Math.max(0, prev - 1));
    }
  };

  const handleEditHtml = (id: string, html: string) => {
    setCurrentEditId(id);
    setSelectedHtml(html);
    setEditModalOpen(true);
  };

  const handleSaveHtml = (html: string) => {
    if (currentEditId) {
      updateHistoryHtml(currentEditId, html, "success");
      setEditModalOpen(false);
    }
  };

  return (
    <>
      {/* 卡片网格布局 */}
      <div className="grid w-full grid-cols-1 gap-4 p-4 sm:grid-cols-2 md:grid-cols-3">
        {history?.items.map((item) => {
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
                  <div className="flex justify-end">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(item.id, item.status);
                      }}
                      className="h-8 w-8"
                      title={t("button.delete")}
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
                      title={t("button.retry")}
                    >
                      <RefreshCw className="h-4 w-4 text-primary" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(item.id, item.status);
                      }}
                      className="h-8 w-8"
                      title={t("button.delete")}
                    >
                      <Trash className="h-4 w-4 text-red-500 dark:text-red-400" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          }

          // For success state, check content type

          const isSvgContent =
            (item.html?.trim().startsWith("<svg") ||
              item.html?.trim().startsWith("```svg") ||
              item.html?.trim().startsWith("```")) &&
            item.html?.includes("</svg>");

          if (isSvgContent) {
            return (
              <SvgPreview
                svg={item.html}
                title={t(`label.${item.tab}`)}
                key={item.id}
              >
                <div className="flex items-center justify-between p-2">
                  <span className="max-w-[60%] truncate text-xs sm:text-sm">
                    {item?.url && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline"
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
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
                      className="ml-1 h-8 w-8"
                      title={t("button.deploy")}
                    >
                      <RocketIcon className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                    </Button>
                    <DownloadDropdown
                      html={sanitizeHtml(item.html)}
                      filename="knowledge-card"
                      className="h-8"
                      type={item.type}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(item.id, item.status);
                      }}
                      className="ml-1 h-8 w-8"
                      title={t("button.delete")}
                    >
                      <Trash className="h-4 w-4 text-red-500 dark:text-red-400" />
                    </Button>
                  </div>
                </div>
              </SvgPreview>
            );
          } else {
            return (
              <HtmlPreview
                html={sanitizeHtml(item.html)}
                title={t(`label.${item.tab}`)}
                key={item.id}
              >
                <div className="flex items-center justify-between p-2">
                  <span className="max-w-[60%] truncate text-xs sm:text-sm">
                    {item?.url && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline"
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
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
                        handleEditHtml(item.id, sanitizeHtml(item.html));
                      }}
                      className="ml-1 h-8 w-8"
                      title={t("button.edit")}
                    >
                      <PencilLine className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeploy(item.id, sanitizeHtml(item.html));
                      }}
                      className="ml-1 h-8 w-8"
                      title={t("button.deploy")}
                    >
                      <RocketIcon className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                    </Button>
                    {(item.tab === "philosophical-card" ||
                      item.tab === "quote-reference") && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedHtml(sanitizeHtml(item.html));
                          setStyleModalOpen(true);
                        }}
                        className="h-8 w-8"
                        title={t("button.style")}
                      >
                        <WandSparkles className="h-4 w-4 text-purple-500 dark:text-purple-400" />
                      </Button>
                    )}
                    <DownloadDropdown
                      html={sanitizeHtml(item.html)}
                      filename="knowledge-card"
                      className="h-8"
                      type={item.type}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(item.id, item.status);
                      }}
                      className="h-8 w-8"
                      title={t("button.delete")}
                    >
                      <Trash className="h-4 w-4 text-red-500 dark:text-red-400" />
                    </Button>
                  </div>
                </div>
              </HtmlPreview>
            );
          }
        })}
        <ChangeStyleModal
          open={styleModalOpen}
          onOpenChange={setStyleModalOpen}
          data={{ html: selectedHtml || "" }}
        />
      </div>
      <EditHtmlModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        html={selectedHtml || ""}
        onSave={handleSaveHtml}
      />
    </>
  );
};

export default History;
