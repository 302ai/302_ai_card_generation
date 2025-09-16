import { createScopedLogger } from "@/utils/logger";
import { useLiveQuery } from "dexie-react-hooks";

import { db } from "@/db";
import { History } from "@/db/types";
import { useCallback } from "react";
import { AddHistory } from "@/db/types";

const logger = createScopedLogger("use-gen-history");
const PAGE_SIZE = 99999;

export const useHistory = (page = 1, sessionId?: string) => {
  const offset = (page - 1) * PAGE_SIZE;

  const genHistory = useLiveQuery(async () => {
    const query = db.history.orderBy("createdAt").reverse();

    // Filter by sessionId if provided (for Mulerun), otherwise show records without sessionId
    if (sessionId) {
      const allItems = await query.toArray();
      const filteredItems = allItems.filter(
        (item) => item.sessionId === sessionId
      );
      return filteredItems.slice(offset, offset + PAGE_SIZE);
    } else {
      const allItems = await query.toArray();
      const filteredItems = allItems.filter((item) => !item.sessionId);
      return filteredItems.slice(offset, offset + PAGE_SIZE);
    }
  }, [page, sessionId]);

  const history = useLiveQuery(async () => {
    const query = db.history.orderBy("createdAt").reverse();

    if (sessionId) {
      // For Mulerun: show only records with matching sessionId
      const allItems = await query.toArray();
      const filteredItems = allItems.filter(
        (item) => item.sessionId === sessionId
      );
      const total = filteredItems.length;
      const items = filteredItems.slice(offset, offset + PAGE_SIZE);

      return {
        items,
        total,
        totalPages: Math.ceil(total / PAGE_SIZE),
        currentPage: page,
      };
    } else {
      // For normal mode: show only records without sessionId
      const allItems = await query.toArray();
      const filteredItems = allItems.filter((item) => !item.sessionId);
      const total = filteredItems.length;
      const items = filteredItems.slice(offset, offset + PAGE_SIZE);

      return {
        items,
        total,
        totalPages: Math.ceil(total / PAGE_SIZE),
        currentPage: page,
      };
    }
  }, [page, sessionId]);

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
