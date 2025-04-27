import Dexie, { Table } from "dexie";

import { History, SvgHistory } from "./types";

class HistoryDB extends Dexie {
  history!: Table<History>;

  constructor() {
    super("history-db");
    this.version(1).stores({
      history: "id, html, status, createdAt, image, url, values",
    });
  }
}

export const db = new HistoryDB();
