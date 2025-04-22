import React, { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import QrUpload from "./qr-upload";
import { useAtom } from "jotai";
import { formStoreAtom } from "@/stores/slices/form_store";
import { useFormContext } from "react-hook-form";
import { useTranslations } from "next-intl";
const QrSelect = () => {
  const [formStore, setFormStore] = useAtom(formStoreAtom);
  const form = useFormContext();
  const t = useTranslations();
  return (
    <div className="flex flex-col gap-4">
      <Select
        value={formStore.qrType}
        onValueChange={(value) => {
          setFormStore((prev) => ({
            ...prev,
            qrType: value as "none" | "upload" | "genrate",
          }));
          if (value === "none") {
            form.setValue("qrCode", "");
          }
        }}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder={t("select.not_display")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">{t("select.not_display")}</SelectItem>
          <SelectItem value="upload">{t("select.image_upload")}</SelectItem>
          <SelectItem value="genrate">{t("select.generate")}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default QrSelect;
