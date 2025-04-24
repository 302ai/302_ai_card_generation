import { formStoreAtom } from "@/stores/slices/form_store";
import { STYLE_LIST } from "@/constants/style";
import { useAtom } from "jotai";
import React from "react";
import Image from "next/image";
import { Textarea } from "@/components/ui/textarea";
import { ControllerRenderProps, useFormContext } from "react-hook-form";
import { FormField } from "@/components/ui/form";
import { useTranslations } from "next-intl";
const StyleContent = ({
  type,
}: {
  type:
    | "knowledgeCard"
    | "promotionalPoster"
    | "quoteReference"
    | "philosophicalCard";
  // | "quoteReference"
  // | "philosophicalCard";
}) => {
  const [formStore, setFormStore] = useAtom(formStoreAtom);
  const form = useFormContext();
  const t = useTranslations();
  return (
    <div>
      {formStore.style === "template" && (
        <div className="mt-2">
          <FormField
            control={form.control}
            name={`${type}.style`}
            render={({ field }) => (
              <div className="grid max-h-[300px] grid-cols-2 gap-2 overflow-y-auto pb-2 pr-1">
                {STYLE_LIST[type]?.map((item) => (
                  <div
                    key={item.id}
                    className={`cursor-pointer transition-all ${
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
                      className="h-auto w-full rounded-md"
                    />
                  </div>
                ))}
              </div>
            )}
          />
        </div>
      )}
      {formStore.style === "custom" && (
        <div className="mt-2">
          <FormField
            control={form.control}
            name={`${type}.customStyle`}
            render={({ field }) => (
              <Textarea {...field} placeholder={t("placeholder.input_style")} />
            )}
          />
        </div>
      )}
    </div>
  );
};

export default StyleContent;
