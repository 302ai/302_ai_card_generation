// import { WorkflowType } from "@/type";
import { atomWithStorage, createJSONStorage } from "jotai/utils";

export type ModalStore = {
  open: boolean;
  data: any;
};

const STORAGE_KEY = "ModalStore";
const defaultState: ModalStore = {
  open: false,
  data: {},
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

export const modalStoreAtom = atomWithStorage<ModalStore>(
  STORAGE_KEY,
  defaultState,
  createJSONStorage(() => createStorage()),
  {
    getOnInit: true,
  }
);
