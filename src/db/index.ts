import Dexie, { Table } from "dexie";

import { History, SvgHistory } from "./types";

class HistoryDB extends Dexie {
  history!: Table<History>;
  posterHistory!: Table<SvgHistory>;

  constructor() {
    super("history-db");
    this.version(1).stores({
      history: "id, html, status, createdAt, image",
      posterHistory: "id, html, status, createdAt, image",
    });
  }
}

export const db = new HistoryDB();
