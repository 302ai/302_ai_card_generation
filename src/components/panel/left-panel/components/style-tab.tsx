import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { formStoreAtom } from "@/stores/slices/form_store";
import { useAtom } from "jotai";
import { cn } from "@/lib/utils";
import { ControllerRenderProps } from "react-hook-form";
import { useTranslations } from "next-intl";
const StyleTab = () => {
  const [formStore, setFormStore] = useAtom(formStoreAtom);
  const t = useTranslations();
  return (
    <div className="">
      <div className="flex justify-end rounded-md">
        <Button
          type="button"
          size="sm"
          variant={formStore.style === "random" ? "default" : "outline"}
          className={cn(
            "rounded-r-none",
            formStore.style === "random" &&
              "bg-purple-500 text-white hover:bg-purple-600"
          )}
          onClick={() => setFormStore({ ...formStore, style: "random" })}
        >
          {t("select.random")}
        </Button>
        <Button
          type="button"
          size="sm"
          variant={formStore.style === "template" ? "default" : "outline"}
          className={cn(
            "rounded-none border-l-0",
            formStore.style === "template" &&
              "bg-purple-500 text-white hover:bg-purple-600"
          )}
          onClick={() => setFormStore({ ...formStore, style: "template" })}
        >
          {t("select.template")}
        </Button>
        <Button
          type="button"
          size="sm"
          variant={formStore.style === "custom" ? "default" : "outline"}
          className={cn(
            "rounded-l-none border-l-0",
            formStore.style === "custom" &&
              "bg-purple-500 text-white hover:bg-purple-600"
          )}
          onClick={() => setFormStore({ ...formStore, style: "custom" })}
        >
          {t("select.custom")}
        </Button>
      </div>
    </div>
  );
};

export default StyleTab;
