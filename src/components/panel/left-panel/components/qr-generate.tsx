import { Textarea } from "@/components/ui/textarea";
import { ControllerRenderProps } from "react-hook-form";

const QrGenerate = ({ field }: { field: ControllerRenderProps<any, any> }) => {
  return (
    <Textarea
      placeholder="请输入内容"
      className="h-[100px] w-full"
      {...field}
    />
  );
};

export default QrGenerate;
