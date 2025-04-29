import { createScopedLogger } from "@/utils/logger";
import { useLiveQuery } from "dexie-react-hooks";

import { db } from "@/db";
import { History } from "@/db/types";
import { useCallback } from "react";
import { AddHistory } from "@/db/types";

const logger = createScopedLogger("use-gen-history");
const PAGE_SIZE = 99999;

export const useHistory = (page = 1) => {
  const offset = (page - 1) * PAGE_SIZE;

  const genHistory = useLiveQuery(async () => {
    const genHistory = await db.history
      .orderBy("createdAt")
      .reverse()
      .offset(offset)
      .limit(PAGE_SIZE)
      .toArray();
    return genHistory;
  }, [page]);

  const history = useLiveQuery(async () => {
    const [items, total] = await Promise.all([
      db.history
        .orderBy("createdAt")
        .reverse()
        .offset(offset)
        .limit(PAGE_SIZE)
        .toArray(),
      db.history.count(),
    ]);

    return {
      items,
      total,
      totalPages: Math.ceil(total / PAGE_SIZE),
      currentPage: page,
    };
  }, [page]);

  const addHistory = useCallback(async (history: AddHistory) => {
    const id = crypto.randomUUID();
    await db.history.add({
      ...history,
      id,
      createdAt: Date.now(),
      status: history.status || "pending",
    });
    return id;
  }, []);

  const updateHistory = useCallback((id: string, history: Partial<History>) => {
    db.history.update(id, history);
  }, []);

  const deleteHistory = useCallback((id: string) => {
    db.history.delete(id);
  }, []);

  const updateHistoryHtml = useCallback(
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

  const updateHistoryStatus = useCallback(
    async (historyId: string, status: "pending" | "success" | "failed") => {
      await db.history
        .where("id")
        .equals(historyId)
        .modify((history: History) => {
          history.status = status;
          if (status === "pending") {
            history.createdAt = Date.now();
          }
        });
    },
    []
  );

  const updateHistoryUrl = useCallback(async (id: string, url: string) => {
    await db.history
      .where("id")
      .equals(id)
      .modify((history: History) => {
        history.url = url;
      });
  }, []);
  return {
    genHistory,
    history,
    addHistory,
    updateHistory,
    deleteHistory,
    updateHistoryHtml,
    updateHistoryStatus,
    updateHistoryUrl,
  };
};
