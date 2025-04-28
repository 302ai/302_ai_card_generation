import Dexie, { Table } from "dexie";

import { History } from "./types";

class HistoryDB extends Dexie {
  history!: Table<History>;

  constructor() {
    super("history-db");
    this.version(1).stores({
      history:
        "id, html, status, createdAt, image, url, values,type,tab,content",
    });
  }
}

export const db = new HistoryDB();
