import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { formStoreAtom } from "@/stores/slices/form_store";
import { useAtom } from "jotai";
import { cn } from "@/lib/utils";
import { ControllerRenderProps } from "react-hook-form";

const StyleTab = () => {
  const [formStore, setFormStore] = useAtom(formStoreAtom);

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
          随机
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
          样板
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
          自定义
        </Button>
      </div>
      {/* 
      {selected === "random" && <div className="mt-2">随机样式内容</div>}
      {selected === "template" && <div className="mt-2">样板内容</div>}
      {selected === "custom" && <div className="mt-2">自定义内容</div>} */}
    </div>
  );
};

export default StyleTab;
