import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import Editor from "@monaco-editor/react";

interface EditHtmlModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  html: string;
  onSave: (html: string) => void;
}

const EditHtmlModal = ({
  open,
  onOpenChange,
  html,
  onSave,
}: EditHtmlModalProps) => {
  const t = useTranslations();
  const [editedHtml, setEditedHtml] = useState(html);

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setEditedHtml(value);
    }
  };

  const handleSave = () => {
    onSave(editedHtml);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{t("label.edit_html")}</DialogTitle>
        </DialogHeader>
        <div className="h-[60vh] w-full">
          <Editor
            height="100%"
            defaultLanguage="html"
            defaultValue={html}
            onChange={handleEditorChange}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              wordWrap: "on",
              scrollBeyondLastLine: false,
            }}
            theme="vs-dark"
          />
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            {t("button.cancel")}
          </Button>
          <Button onClick={handleSave}>{t("button.save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditHtmlModal;
