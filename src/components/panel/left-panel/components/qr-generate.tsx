import { Textarea } from "@/components/ui/textarea";
import { useTranslations } from "next-intl";
import { ControllerRenderProps } from "react-hook-form";
import { QRCodeSVG } from "qrcode.react";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

const QrGenerate = ({ field }: { field: ControllerRenderProps<any, any> }) => {
  const t = useTranslations();
  const [qrValue, setQrValue] = useState<string>("");
  const qrRef = useRef<SVGSVGElement>(null);

  // Update qrValue when field.value changes (but not on mount)
  useEffect(() => {
    setQrValue(field.value || "");
  }, [field.value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    field.onChange(e);
    setQrValue(e.target.value);
  };

  return (
    <div className="flex flex-col gap-4">
      <Textarea
        placeholder={t("placeholder.input_content")}
        className="h-[100px] w-full"
        value={field.value || ""}
        onChange={handleInputChange}
      />
      <div className="flex flex-col items-center gap-4">
        <div className="qr-code-generated flex justify-center rounded-md bg-white p-4">
          {qrValue && (
            <QRCodeSVG
              ref={qrRef}
              value={qrValue}
              size={200}
              bgColor={"#ffffff"}
              fgColor={"#000000"}
              level={"L"}
              includeMargin={false}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default QrGenerate;
