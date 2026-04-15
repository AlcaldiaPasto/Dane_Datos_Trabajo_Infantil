import Dexie from "dexie";

export const INDEXED_DB_NAME = "trabajoInfantilDB";

class TrabajoInfantilDB extends Dexie {
  constructor() {
    super(INDEXED_DB_NAME);

    this.version(1).stores({
      datasets:
        "id, sourceType, detectedYear, yearSource, isPrimary, status, uploadedAt, updatedAt, [status+detectedYear]",
      processes: "id, datasetId, status, startedAt, finishedAt, updatedAt",
      appState: "id, activeYear, activeDatasetId, updatedAt",
    });
  }
}

export const trabajoInfantilDb = new TrabajoInfantilDB();

