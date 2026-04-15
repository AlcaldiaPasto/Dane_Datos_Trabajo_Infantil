import { DATASET_STATUS } from "@/lib/constants/dataset-status";
import { buildDatasetFromCsvText } from "@/lib/indexeddb/client-dataset-processing";
import {
  BASE_DATASET_ID,
  GLOBAL_APP_STATE_ID,
  getDatasetById,
  putAppState,
  putDataset,
  putProcess,
} from "@/lib/indexeddb/repository";
import { trabajoInfantilDb } from "@/lib/indexeddb/db";

const BASE_DATASET_URL = "/data/base/2024/dane-2024.csv";
let bootstrapPromise = null;

async function tryPersistStorage() {
  if (typeof navigator === "undefined" || !navigator.storage) {
    return { supported: false, persisted: false };
  }

  try {
    const persistedBefore = await navigator.storage.persisted?.();
    const persistedNow = persistedBefore || (await navigator.storage.persist?.());
    const estimate = await navigator.storage.estimate?.();
    return {
      supported: true,
      persisted: Boolean(persistedNow),
      quota: estimate?.quota || null,
      usage: estimate?.usage || null,
    };
  } catch {
    return { supported: true, persisted: false };
  }
}

async function ensureBaseDatasetSeeded() {
  await trabajoInfantilDb.open();
  const existing = await getDatasetById(BASE_DATASET_ID);
  if (existing) {
    return existing;
  }

  const response = await fetch(BASE_DATASET_URL, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`No se pudo cargar dataset base 2024 desde ${BASE_DATASET_URL}.`);
  }

  const csvText = await response.text();
  const { dataset, process } = buildDatasetFromCsvText({
    datasetId: BASE_DATASET_ID,
    sourceType: "base",
    fileName: "dane-2024.csv",
    csvText,
    forcedYear: 2024,
    yearSource: "seed",
    isPrimary: true,
  });

  await putDataset({
    ...dataset,
    status: DATASET_STATUS.CLEAN,
    isPrimary: true,
  });
  await putProcess({
    ...process,
    status: DATASET_STATUS.CLEAN,
    currentStep: "clean",
    errorMessage: null,
  });
  await putAppState({
    id: GLOBAL_APP_STATE_ID,
    activeYear: 2024,
    activeDatasetId: BASE_DATASET_ID,
    selectedFilters: {},
    lastOpenedSection: "/",
    baseSeededAt: new Date().toISOString(),
  });

  return dataset;
}

export async function bootstrapClientPersistence() {
  const storageInfo = await tryPersistStorage();
  const baseDataset = await ensureBaseDatasetSeeded();
  await putAppState({
    id: GLOBAL_APP_STATE_ID,
    storageInfo,
    persistenceReady: true,
  });

  return { storageInfo, baseDataset };
}

export function ensureClientBootstrap() {
  if (!bootstrapPromise) {
    bootstrapPromise = bootstrapClientPersistence().catch((error) => {
      bootstrapPromise = null;
      throw error;
    });
  }

  return bootstrapPromise;
}

