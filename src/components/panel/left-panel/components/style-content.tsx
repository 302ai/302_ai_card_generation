import { formStoreAtom } from "@/stores/slices/form_store";
import { STYLE_LIST } from "@/constants/style";
import { useAtom } from "jotai";
import React from "react";
import Image from "next/image";
import { Textarea } from "@/components/ui/textarea";
import { ControllerRenderProps } from "react-hook-form";

const StyleContent = ({
  field,
  type,
}: {
  field: ControllerRenderProps<any, any>;
  type: "knowledgeCard" | "promotionalPoster";
  // | "quoteReference"
  // | "philosophicalCard";
}) => {
  const [formStore, setFormStore] = useAtom(formStoreAtom);
  return (
    <div>
      {formStore.style === "template" && (
        <div className="mt-2">
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {STYLE_LIST[type]?.map((item) => (
              <div
                key={item.id}
                className={`flex-shrink-0 cursor-pointer transition-all ${
                  field.value === item.prompt
                    ? "rounded-md border-2 border-primary shadow-md"
                    : "border-2 border-transparent"
                }`}
                onClick={() => {
                  field.onChange(item.prompt);
                }}
              >
                <Image
                  src={item.url}
                  alt={item.name}
                  width={100}
                  height={100}
                  className="rounded-md"
                />
              </div>
            ))}
          </div>
        </div>
      )}
      {formStore.style === "custom" && (
        <div className="mt-2">
          <Textarea
            {...field}
            placeholder="请输入卡片风格 e.g. 简约现代风格，文字排版简洁，有简单的图形元素或线条"
          />
        </div>
      )}
    </div>
  );
};

export default StyleContent;
