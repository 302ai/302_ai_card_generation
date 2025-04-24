import { Textarea } from "@/components/ui/textarea";
import { useTranslations } from "next-intl";
import { ControllerRenderProps } from "react-hook-form";

const QrGenerate = ({ field }: { field: ControllerRenderProps<any, any> }) => {
  const t = useTranslations();
  return (
    <Textarea
      placeholder={t("placeholder.input_content")}
      className="h-[100px] w-full"
      {...field}
    />
  );
};

export default QrGenerate;
