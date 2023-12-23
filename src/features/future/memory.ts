import { GatewayMessageUpdateDispatchData } from "discord-api-types/v10";
import { FutureLinks, FutureStore } from "./store";

const future: Record<string, FutureLinks & { timeout: ReturnType<typeof setTimeout> }> = {};

export const createMemoryStore = (): FutureStore => ({ 
  async get(channelId: string) {
    return future[channelId] ?? null;
  },
  async set(channelId: string, links: FutureLinks) {
    future[channelId] = {
      ...links,
      timeout: setTimeout(() => delete future[channelId], 60_000)
    };
  }
});

export const isMessageWithUpdatedEmbed = (data: GatewayMessageUpdateDispatchData) => {
  return Object.keys(data).length === 4 && 'id' in data && 'embeds' in data && 'channel_id' in data && 'guild_id' in data;
}