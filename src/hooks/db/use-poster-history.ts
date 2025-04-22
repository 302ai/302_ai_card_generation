import { createScopedLogger } from "@/utils/logger";
import { useLiveQuery } from "dexie-react-hooks";

import { db } from "@/db";
import { SvgHistory } from "@/db/types";
import { useCallback } from "react";

// Create a type that matches what we need to add to posterHistory
type AddPosterHistory = Omit<SvgHistory, "id" | "createdAt">;

const logger = createScopedLogger("use-poster-history");
const PAGE_SIZE = 99999;

export const usePosterHistory = (page = 1) => {
  const offset = (page - 1) * PAGE_SIZE;

  const genPosterHistory = useLiveQuery(async () => {
    const genPosterHistory = await db.posterHistory
      .orderBy("createdAt")
      .reverse()
      .offset(offset)
      .limit(PAGE_SIZE)
      .toArray();
    return genPosterHistory;
  }, [page]);

  const posterHistory = useLiveQuery(async () => {
    const [items, total] = await Promise.all([
      db.posterHistory
        .orderBy("createdAt")
        .reverse()
        .offset(offset)
        .limit(PAGE_SIZE)
        .toArray(),
      db.posterHistory.count(),
    ]);

    return {
      items,
      total,
      totalPages: Math.ceil(total / PAGE_SIZE),
      currentPage: page,
    };
  }, [page]);

  const addPosterHistory = useCallback(async (history: AddPosterHistory) => {
    const id = crypto.randomUUID();
    await db.posterHistory.add({
      ...history,
      id,
      createdAt: Date.now(),
    });
    return id;
  }, []);

  const updatePosterHistory = useCallback(
    (id: string, history: Partial<SvgHistory>) => {
      db.posterHistory.update(id, history);
    },
    []
  );

  const deletePosterHistory = useCallback((id: string) => {
    db.posterHistory.delete(id);
  }, []);

  const updatePosterHistorySvg = useCallback(
    async (
      historyId: string,
      svg: string,
      status: "pending" | "success" | "failed"
    ) => {
      await db.posterHistory
        .where("id")
        .equals(historyId)
        .modify((history: SvgHistory) => {
          history.status = status;
          history.svg = svg;
        });
    },
    []
  );

  const updatePosterHistoryStatus = useCallback(
    async (historyId: string, status: "pending" | "success" | "failed") => {
      await db.posterHistory
        .where("id")
        .equals(historyId)
        .modify((history: SvgHistory) => {
          history.status = status;
        });
    },
    []
  );

  return {
    genPosterHistory,
    posterHistory,
    addPosterHistory,
    updatePosterHistory,
    deletePosterHistory,
    updatePosterHistorySvg,
    updatePosterHistoryStatus,
  };
};
