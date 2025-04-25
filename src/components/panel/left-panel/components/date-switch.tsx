import { Switch } from "@/components/ui/switch";
import { useAtom } from "jotai";
import { formStoreAtom } from "@/stores/slices/form_store";
import React, { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { PopoverContent } from "@/components/ui/popover";
import { PopoverTrigger } from "@/components/ui/popover";
import { Popover } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { format, setDate } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ControllerRenderProps, FieldValues } from "react-hook-form";
import { useTranslations } from "next-intl";
const DateSwitch = ({ field }: { field: ControllerRenderProps<any, any> }) => {
  const [formStore, setFormStore] = useAtom(formStoreAtom);
  const t = useTranslations();
  return (
    <div className="flex items-center gap-2">
      {formStore.showDate && (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "justify-start text-left font-normal",
                !field.value && "text-muted-foreground"
              )}
            >
              <CalendarIcon />
              {field.value ? (
                format(new Date(field.value), "PPP")
              ) : (
                <span>{t("placeholder.pick_a_date")}</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="end">
            <Calendar
              mode="single"
              selected={field.value ? new Date(field.value) : undefined}
              onSelect={(date) =>
                field.onChange(date ? date.toISOString() : "")
              }
              initialFocus
            />
          </PopoverContent>
        </Popover>
      )}
      <Switch
        checked={formStore.showDate}
        onCheckedChange={(checked) => {
          setFormStore((prev) => ({ ...prev, showDate: checked }));
          if (!checked) {
            field.onChange("");
          }
        }}
      />
    </div>
  );
};

export default DateSwitch;
