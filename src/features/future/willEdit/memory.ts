import { GatewayMessageUpdateDispatchData } from "discord-api-types/v10";
import { WillEditData, WillEditStore } from "./store";

const future: Record<string, WillEditData & { timeout: ReturnType<typeof setTimeout> }> = {};
const marks = new Set<string>();

export const createMemoryStore = (): WillEditStore => ({ 
  async mark(parentId) {
    marks.add(parentId);
    setTimeout(() => marks.delete(parentId), 60_000);
  },
  async isMarked(parentId) {
    return marks.has(parentId);
  },
  async get(messageId: string) {
    return future[messageId] ?? null;
  },
  async set(channelId: string, data: WillEditData) {
    future[channelId] = {
      ...data,
      timeout: setTimeout(() => delete future[channelId], 60_000)
    };
  }
});

export const isMessageWithUpdatedEmbed = (data: GatewayMessageUpdateDispatchData) => {
  return Object.keys(data).length === 4 && 'id' in data && 'embeds' in data && 'channel_id' in data && 'guild_id' in data;
}