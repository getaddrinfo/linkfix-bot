import { createMemoryStore as createFutureMemoryStore } from "./features/future/memory";
import { createMemoryStore as createWillEditMemoryStore } from "./features/future/willEdit/memory";
import { createMemoryStore as createCleanupMemoryStore } from "./features/cleanup/memory";

export const cleanup = createCleanupMemoryStore();
export const willEdit = createWillEditMemoryStore();
export const future = createFutureMemoryStore();