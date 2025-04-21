// import { WorkflowType } from "@/type";
import { MODEL_LIST, ModelId } from "@/constants/models";
import { atomWithStorage, createJSONStorage } from "jotai/utils";

export type HistoryStore = {
  htmls: string[];
};

const STORAGE_KEY = "historyStore";
const defaultState: HistoryStore = {
  htmls: [],
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

export const historyStoreAtom = atomWithStorage<HistoryStore>(
  STORAGE_KEY,
  defaultState,
  createJSONStorage(() => createStorage()),
  {
    getOnInit: true,
  }
);
