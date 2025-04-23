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
import { usePhilosophicalHistory } from "@/hooks/db/use-philosophical-history";
import HtmlPreview from "./html-preview";
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
  const { philosophicalHistory, deletePhilosophicalHistory } =
    usePhilosophicalHistory();
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
      {/* 卡片网格布局 */}
      <div className="grid w-full grid-cols-3 gap-4 p-4">
        {philosophicalHistory?.items.map((item, index) => {
          return (
            <HtmlPreview
              html={sanitizeHtml(item.html)}
              title={`哲学卡片预览 ${index + 1}`}
            >
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
                      onDownLoad(sanitizeHtml(item.html));
                    }}
                  >
                    <FileDown className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      deletePhilosophicalHistory(item.id);
                    }}
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

export default PhilosophicalCardHistory;
