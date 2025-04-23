import React, { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import HtmlPreview from "./html-preview";
import { store } from "@/stores";
import { appConfigAtom } from "@/stores/slices/config_store";
import { generateHTML } from "@/services/change-style";

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

  const handleGenerate = async () => {
    // TODO: Implement style generation logic
    console.log("Generate new style with prompt:", stylePrompt);
    const res = await generateHTML({
      apiKey: apiKey as string,
      content: stylePrompt,
      html: data?.html as string,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl">
        <div className="flex gap-6">
          {/* Left side - HTML Preview */}
          <div className="w-1/2">
            <div className="h-[600px] overflow-auto rounded-lg border p-4">
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
            <h3 className="text-lg font-semibold">想要修改的风格</h3>
            <Textarea
              placeholder="请输入你想要的风格描述..."
              className="h-[500px] resize-none"
              value={stylePrompt}
              onChange={(e) => setStylePrompt(e.target.value)}
            />
            <Button onClick={handleGenerate} className="w-full">
              生成新样式
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChangeStyleModal;
