import { Select } from "@/components/ui/select";
import {
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MODEL_LIST, ModelId } from "@/constants/models";
import { formStoreAtom } from "@/stores/slices/form_store";
import { useAtom } from "jotai";
import React from "react";

interface ModelSelectProps {
  value?: ModelId; // 来自 field.value
  onChange?: (value: ModelId) => void; // 来自 field.onChange
  name?: string; // 来自 field.name
}

const ModelSelect = ({ value, onChange, name, ...props }: ModelSelectProps) => {
  // const [formStore, setFormStore] = useAtom(formStoreAtom);
  return (
    <Select
      name={name}
      defaultValue={value}
      onValueChange={(value: ModelId) => {
        onChange?.(value);
      }}
      {...props}
    >
      <SelectTrigger className="w-full max-w-[180px]">
        <SelectValue placeholder="选择模型" />
      </SelectTrigger>
      <SelectContent>
        {MODEL_LIST.map((model) => (
          <SelectItem key={model.id} value={model.id}>
            {model.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default ModelSelect;
