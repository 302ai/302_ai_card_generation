import React, { useState } from "react";
import { useAtom } from "jotai";
import { uiStoreAtom } from "@/stores/slices/ui_store";
import History from "./history";

const RightPanel = () => {
  const [uiStore, setUiStore] = useAtom(uiStoreAtom);
  return (
    <div className="h-full w-full">
      <History />
    </div>
  );
};

export default RightPanel;
