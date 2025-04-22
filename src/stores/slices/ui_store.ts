// import { WorkflowType } from "@/type";
import { MODEL_LIST, ModelId } from "@/constants/models";
import { atomWithStorage, createJSONStorage } from "jotai/utils";

export type UiStoreActiveTab = "input-based" | "extract-key";
export type UiStoreActiveCard =
  | "knowledge-card"
  | "promotional-poster"
  | "quote-reference"
  | "philosophical-card";
export type UiStore = {
  activeTab: UiStoreActiveTab;
  activeCard: UiStoreActiveCard;
  drawerOpen: boolean;
};

const STORAGE_KEY = "uiStore";
const defaultState: UiStore = {
  activeTab: "input-based",
  activeCard: "knowledge-card",
  drawerOpen: false,
};

const createStorage = () => {
  if (typeof window === "undefined") {
    return {
      getItem: () => null,
      setItem: () => null,
      removeItem: () => null,
    };
  }
  const existingData = sessionStorage.getItem(STORAGE_KEY);
  if (!existingData) {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(defaultState));
  }

  return sessionStorage;
};

export const uiStoreAtom = atomWithStorage<UiStore>(
  STORAGE_KEY,
  defaultState,
  createJSONStorage(() => createStorage()),
  {
    getOnInit: true,
  }
);
