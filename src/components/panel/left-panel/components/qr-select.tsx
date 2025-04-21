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

const QrSelect = () => {
  const [formStore, setFormStore] = useAtom(formStoreAtom);
  return (
    <div className="flex flex-col gap-4">
      <Select
        value={formStore.qrType}
        onValueChange={(value) =>
          setFormStore((prev) => ({
            ...prev,
            qrType: value as "none" | "upload" | "genrate",
          }))
        }
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Theme" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">不展示</SelectItem>
          <SelectItem value="upload">图片上传</SelectItem>
          <SelectItem value="genrate">生成</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default QrSelect;
