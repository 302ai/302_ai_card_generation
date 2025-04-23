import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import KnowledgeHistory from "./knowledge-history";
import PosterHistory from "./poster-history";
import { useAtom } from "jotai";
import { formStoreAtom } from "@/stores/slices/form_store";
import { uiStoreAtom } from "@/stores/slices/ui_store";
import PhilosophicalCardHistory from "./philosophical-history";
import QuoteHistory from "./quote-history";

const RightPanel = () => {
  const [uiStore, setUiStore] = useAtom(uiStoreAtom);
  return (
    <div className="h-full w-full">
      {uiStore.activeCard === "knowledge-card" && <KnowledgeHistory />}
      {uiStore.activeCard === "promotional-poster" && <PosterHistory />}
      {uiStore.activeCard === "philosophical-card" && (
        <PhilosophicalCardHistory />
      )}
      {uiStore.activeCard === "quote-reference" && <QuoteHistory />}
    </div>
  );
};

export default RightPanel;
