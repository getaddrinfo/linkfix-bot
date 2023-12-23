import { CleanupStore } from "./store";

const future: Record<string, { parentId: string, timeout: ReturnType<typeof setTimeout> }> = {};

export const createMemoryStore = (): CleanupStore => ({ 
  async get(messageId: string) {
    return future[messageId]?.parentId ?? null;
  },
  async set(messageId: string, parentId: string) {
    future[messageId] = {
      parentId,
      timeout: setTimeout(() => delete future[messageId], 60_000)
    };
  }
});
