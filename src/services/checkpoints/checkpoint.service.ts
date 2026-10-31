import checkpointData from "../../data/checkpointss.json";

import type {
  Checkpoint,
  CreateCheckpointPayload,
  UpdateCheckpointPayload,
} from "../../types/patrol-point/checkpoints";

const delay = (ms = 400) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

let checkpoints: Checkpoint[] = checkpointData as Checkpoint[];

export const checkpointService = {
  // Mengambil semua checkpoint
  async getAll(): Promise<Checkpoint[]> {
    await delay();

    return structuredClone(checkpoints);
  },

  // Mengambil satu checkpoint berdasarkan ID
  async getById(id: string): Promise<Checkpoint | null> {
    await delay();

    const checkpoint = checkpoints.find((item) => item.id === id);

    return checkpoint ? structuredClone(checkpoint) : null;
  },

  // Menambahkan checkpoint
  async create(payload: CreateCheckpointPayload): Promise<Checkpoint> {
    await delay();

    const codeExists = checkpoints.some((item) => item.code === payload.code);

    if (codeExists) {
      throw new Error("Kode checkpoint sudah digunakan.");
    }

    const checkpoint: Checkpoint = {
      ...payload,
      id: `CP-${crypto.randomUUID()}`,
    };

    checkpoints = [...checkpoints, checkpoint];

    return structuredClone(checkpoint);
  },

  // Mengubah checkpoint
  async update(
    id: string,
    payload: UpdateCheckpointPayload,
  ): Promise<Checkpoint> {
    await delay();

    const existing = checkpoints.find((item) => item.id === id);

    if (!existing) {
      throw new Error("Checkpoint tidak ditemukan.");
    }

    if (
      payload.code &&
      checkpoints.some((item) => item.code === payload.code && item.id !== id)
    ) {
      throw new Error("Kode checkpoint sudah digunakan.");
    }

    const updated: Checkpoint = {
      ...existing,
      ...payload,
      id,
    };

    checkpoints = checkpoints.map((item) => (item.id === id ? updated : item));

    return structuredClone(updated);
  },

  // Menghapus checkpoint
  async delete(id: string): Promise<void> {
    await delay();

    const exists = checkpoints.some((item) => item.id === id);

    if (!exists) {
      throw new Error("Checkpoint tidak ditemukan.");
    }

    checkpoints = checkpoints.filter((item) => item.id !== id);
  },
};
