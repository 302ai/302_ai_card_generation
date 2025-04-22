import { createScopedLogger } from "@/utils/logger";
import { useLiveQuery } from "dexie-react-hooks";

import { db } from "@/db";
import { History } from "@/db/types";
import { useCallback } from "react";
import { AddHistory } from "@/db/types";

const logger = createScopedLogger("use-philosophical-history");
const PAGE_SIZE = 99999;

export const usePhilosophicalHistory = (page = 1) => {
  const offset = (page - 1) * PAGE_SIZE;

  const philosophicalHistory = useLiveQuery(async () => {
    const [items, total] = await Promise.all([
      db.philosophicalCardHistory
        .orderBy("createdAt")
        .reverse()
        .offset(offset)
        .limit(PAGE_SIZE)
        .toArray(),
      db.philosophicalCardHistory.count(),
    ]);

    return {
      items,
      total,
      totalPages: Math.ceil(total / PAGE_SIZE),
      currentPage: page,
    };
  }, [page]);

  const addPhilosophicalHistory = useCallback(async (history: AddHistory) => {
    const id = crypto.randomUUID();
    await db.philosophicalCardHistory.add({
      ...history,
      id,
      createdAt: Date.now(),
    });
    return id;
  }, []);

  const updatePhilosophicalHistory = useCallback(
    (id: string, history: Partial<History>) => {
      db.philosophicalCardHistory.update(id, history);
    },
    []
  );

  const deletePhilosophicalHistory = useCallback((id: string) => {
    db.philosophicalCardHistory.delete(id);
  }, []);

  const updatePhilosophicalHistoryHtml = useCallback(
    async (
      historyId: string,
      html: string,
      status: "pending" | "success" | "failed"
    ) => {
      await db.history
        .where("id")
        .equals(historyId)
        .modify((history: History) => {
          history.status = status;
          history.html = html;
        });
    },
    []
  );

  const updatePhilosophicalHistoryStatus = useCallback(
    async (historyId: string, status: "pending" | "success" | "failed") => {
      await db.philosophicalCardHistory
        .where("id")
        .equals(historyId)
        .modify((history: History) => {
          history.status = status;
        });
    },
    []
  );

  return {
    philosophicalHistory,
    addPhilosophicalHistory,
    updatePhilosophicalHistory,
    deletePhilosophicalHistory,
    updatePhilosophicalHistoryHtml,
    updatePhilosophicalHistoryStatus,
  };
};
