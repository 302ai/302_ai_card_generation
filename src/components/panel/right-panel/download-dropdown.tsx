import React from "react";
import { Download, FileCode, FileDown, Image } from "lucide-react";
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

interface DownloadDropdownProps {
  html: string;
  filename?: string;
}

const DownloadDropdown = ({
  html,
  filename = "knowledge-card",
}: DownloadDropdownProps) => {
  const t = useTranslations();
  const { apiKey } = store.get(appConfigAtom);
  const { handleDownload } = useMonitorMessage();

  const onDownLoadAsPng = async (html: string) => {
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
    handleDownload(resp.output, `${filename}.png`);
  };

  const onDownloadAsHtml = (html: string) => {
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <Download className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation();
            onDownLoadAsPng(html);
          }}
        >
          <Image className="mr-2 h-4 w-4" />
          {t("action.download_as_png") || "Download as PNG"}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation();
            onDownloadAsHtml(html);
          }}
        >
          <FileCode className="mr-2 h-4 w-4" />
          {t("action.download_as_html") || "Download as HTML"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default DownloadDropdown;
