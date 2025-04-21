// import { WorkflowType } from "@/type";
import { MODEL_LIST, ModelId } from "@/constants/models";
import { atomWithStorage, createJSONStorage } from "jotai/utils";

export type FormStore = {
  inputBasedContent: string;
  extractKeyContent: string;
  model: ModelId;
  qrType: "none" | "upload" | "genrate";
  showDate: boolean;
  style: "random" | "template" | "custom";
};

const STORAGE_KEY = "formStore";
const defaultState: FormStore = {
  inputBasedContent: "",
  extractKeyContent: "",
  model: MODEL_LIST[0].id,
  qrType: "none",
  showDate: false,
  style: "random",
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

export const formStoreAtom = atomWithStorage<FormStore>(
  STORAGE_KEY,
  defaultState,
  createJSONStorage(() => createStorage()),
  {
    getOnInit: true,
  }
);
