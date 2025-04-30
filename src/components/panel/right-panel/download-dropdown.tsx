import React from "react";
import { Download, FileCode, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslations } from "next-intl";
import { appConfigAtom } from "@/stores/slices/config_store";
import { store } from "@/stores";
import { useMonitorMessage } from "@/hooks/global/use-monitor-message";
import ky from "ky";
import { env } from "@/env";
import { toast } from "sonner";

interface DownloadDropdownProps {
  html: string;
  filename?: string;
  className?: string;
  type: "html" | "svg";
}

const DownloadDropdown = ({
  html,
  filename = "knowledge-card",
  className,
  type,
}: DownloadDropdownProps) => {
  const t = useTranslations();
  const { apiKey } = store.get(appConfigAtom);
  const { handleDownload } = useMonitorMessage();

  const onDownLoadAsPng = async (html: string) => {
    try {
      // Show toast notification for download start
      const toastId = toast(t("status.downloading"));

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

      // Dismiss the downloading toast
      toast.dismiss(toastId);

      handleDownload(resp.output, `${filename}.png`);

      // Show success notification
      toast.success(`${t("toast.download_success")}`);
    } catch (error) {
      console.error("Failed to download PNG:", error);
      toast.error(t("toast.download_failed"));
    }
  };

  const onDownloadAsHtml = (html: string) => {
    try {
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${filename}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Show success notification
      toast.success(`${t("toast.download_success")}`);
    } catch (error) {
      console.error("Failed to download HTML:", error);
      toast.error(t("toast.download_failed"));
    }
  };

  const onDownLoadAsSvg = async (svgContent: string) => {
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

  // For SVG type, directly show download button without dropdown
  if (type === "svg") {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => {
          e.stopPropagation();
          onDownLoadAsSvg(html);
        }}
        className={className}
        title={t("button.download_svg")}
      >
        <Download className="h-4 w-4 text-green-500 dark:text-green-400" />
      </Button>
    );
  }

  // For HTML type, show dropdown as before
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
          }}
          className={className}
          title={t("button.download")}
        >
          <Download className="h-4 w-4 text-green-500 dark:text-green-400" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation();
            onDownLoadAsPng(html);
          }}
          title={t("action.download_as_png")}
        >
          <Image className="mr-2 h-4 w-4" />
          {t("action.download_as_png") || "Download as PNG"}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation();
            onDownloadAsHtml(html);
          }}
          title={t("action.download_as_html")}
        >
          <FileCode className="mr-2 h-4 w-4" />
          {t("action.download_as_html") || "Download as HTML"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default DownloadDropdown;
