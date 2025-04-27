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
      history: "id, html, status, createdAt, image, url",
      posterHistory: "id, svg, status, createdAt, image",
      philosophicalCardHistory: "id, html, status, createdAt, image, url",
      quoteHistory: "id, html, status, createdAt, image, url",
    });
  }
}

export const db = new HistoryDB();
