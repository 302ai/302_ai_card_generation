import { atom } from "jotai";

// Maximum number of concurrent tasks allowed
export const MAX_CONCURRENT_TASKS = 4;

// Atom to track the current number of concurrent tasks
export const concurrentTaskCountAtom = atom<number>(0);
