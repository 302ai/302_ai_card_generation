import React, { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import HtmlPreview from "./html-preview";
import { store } from "@/stores";
import { appConfigAtom } from "@/stores/slices/config_store";
import { generateHTML } from "@/services/change-style";
import { useTranslations } from "next-intl";
import { formStoreAtom } from "@/stores/slices/form_store";
import { useAtom } from "jotai";
import { toast } from "sonner";
import { uiStoreAtom } from "@/stores/slices/ui_store";
import { useHistory } from "@/hooks/db/use-gen-history";

interface ChangeStyleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data?: {
    html: string;
  };
}

const ChangeStyleModal: React.FC<ChangeStyleModalProps> = ({
  open,
  onOpenChange,
  data,
}) => {
  const [stylePrompt, setStylePrompt] = useState("");
  const { apiKey } = store.get(appConfigAtom);

  const { addHistory, updateHistory } = useHistory();
  const t = useTranslations();
  const [uiStore, setUiStore] = useAtom(uiStoreAtom);

  useEffect(() => {
    setStylePrompt("");
  }, [open]);

  const handleGenerate = async () => {
    if (!stylePrompt) {
      toast.error(t("toast.change_style_required"));
      return;
    }

    if (!data?.html) {
      toast.error(t("toast.html_content_required"));
      return;
    }

    let historyId = "";

    try {
      historyId = await addHistory({
        html: "",
        status: "pending",
        type: "html",
        tab: uiStore.activeCard,
        content: stylePrompt,
      });
      onOpenChange(false);
      const res = await generateHTML({
        apiKey: apiKey as string,
        content: stylePrompt,
        html: data.html,
      });

      // Update history based on active card type

      await updateHistory(historyId, {
        html: res.html,
        status: "success",
      });
    } catch (error) {
      await updateHistory(historyId, {
        status: "failed",
      });

      toast.error(
        error instanceof Error
          ? error.message
          : t("toast.style_generation_failed")
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl">
        <div className="flex gap-6">
          {/* Left side - HTML Preview */}
          <div className="w-1/2">
            <div className="h-[400px] overflow-auto rounded-lg border p-4">
              {data?.html && (
                <div className="h-full w-full">
                  <iframe
                    srcDoc={data.html}
                    className="h-full w-full border-0"
                    title="HTML Preview"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Right side - Style Input */}
          <div className="flex w-1/2 flex-col gap-4">
            <h3 className="text-lg font-semibold">{t("label.change_style")}</h3>
            <Textarea
              placeholder={t("label.change_style_placeholder")}
              className="h-[200px] resize-none"
              value={stylePrompt}
              onChange={(e) => setStylePrompt(e.target.value)}
            />
            <Button onClick={handleGenerate} className="w-full">
              {t("label.generate_new_style")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChangeStyleModal;
