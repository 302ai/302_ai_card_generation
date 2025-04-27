import Dexie, { Table } from "dexie";

import { History, SvgHistory } from "./types";

class HistoryDB extends Dexie {
  history!: Table<History>;
  posterHistory!: Table<SvgHistory>;
  philosophicalCardHistory!: Table<History>;
  quoteHistory!: Table<History>;
  constructor() {
    super("history-db");
    this.version(1).stores({
      history: "id, html, status, createdAt, image, url, values",
      posterHistory: "id, svg, status, createdAt, image, values",
      philosophicalCardHistory:
        "id, html, status, createdAt, image, url, values",
      quoteHistory: "id, html, status, createdAt, image, url, values",
    });
  }
}

export const db = new HistoryDB();
