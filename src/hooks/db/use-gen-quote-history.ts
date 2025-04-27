import { createScopedLogger } from "@/utils/logger";
import { useLiveQuery } from "dexie-react-hooks";

import { db } from "@/db";
import { History } from "@/db/types";
import { useCallback } from "react";
import { AddHistory } from "@/db/types";

const logger = createScopedLogger("use-gen-quote-history");
const PAGE_SIZE = 99999;

export const useGenQuoteHistory = (page = 1) => {
  const offset = (page - 1) * PAGE_SIZE;

  const genQuoteHistory = useLiveQuery(async () => {
    const genQuoteHistory = await db.quoteHistory
      .orderBy("createdAt")
      .reverse()
      .offset(offset)
      .limit(PAGE_SIZE)
      .toArray();
    return genQuoteHistory;
  }, [page]);

  const quoteHistory = useLiveQuery(async () => {
    const [items, total] = await Promise.all([
      db.quoteHistory
        .orderBy("createdAt")
        .reverse()
        .offset(offset)
        .limit(PAGE_SIZE)
        .toArray(),
      db.quoteHistory.count(),
    ]);

    return {
      items,
      total,
      totalPages: Math.ceil(total / PAGE_SIZE),
      currentPage: page,
    };
  }, [page]);

  const addQuoteHistory = useCallback(async (history: AddHistory) => {
    const id = crypto.randomUUID();
    await db.quoteHistory.add({
      ...history,
      id,
      createdAt: Date.now(),
    });
    return id;
  }, []);

  const updateQuoteHistory = useCallback(
    (id: string, history: Partial<History>) => {
      db.quoteHistory.update(id, history);
    },
    []
  );

  const deleteQuoteHistory = useCallback((id: string) => {
    db.quoteHistory.delete(id);
  }, []);

  const updateQuoteHistoryHtml = useCallback(
    async (
      historyId: string,
      html: string,
      status: "pending" | "success" | "failed"
    ) => {
      await db.quoteHistory
        .where("id")
        .equals(historyId)
        .modify((history: History) => {
          history.status = status;
          history.html = html;
        });
    },
    []
  );

  const updateQuoteHistoryStatus = useCallback(
    async (historyId: string, status: "pending" | "success" | "failed") => {
      await db.quoteHistory
        .where("id")
        .equals(historyId)
        .modify((history: History) => {
          history.status = status;
        });
    },
    []
  );

  const updateQuoteHistoryUrl = useCallback(
    async (historyId: string, url: string) => {
      await db.quoteHistory
        .where("id")
        .equals(historyId)
        .modify((history: History) => {
          history.url = url;
        });
    },
    []
  );

  return {
    genQuoteHistory,
    quoteHistory,
    addQuoteHistory,
    updateQuoteHistory,
    deleteQuoteHistory,
    updateQuoteHistoryHtml,
    updateQuoteHistoryStatus,
    updateQuoteHistoryUrl,
  };
};
