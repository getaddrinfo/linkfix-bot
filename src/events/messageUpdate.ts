import type { GatewayMessageUpdateDispatchData } from "discord-api-types/v10";
import { getOrCreate } from "../db/guild/getOrCreate";
import { getServices } from "../service/services";

export const onMessageUpdate = async (message: GatewayMessageUpdateDispatchData) => {
  if (!message.content || !message.guild_id) return;

  let services = getServices(message.content);
  if (services.length === 0) return;

  const guild = await getOrCreate(message.guild_id);

  if (guild.features.cleanupParentMessage && (message.guild_id in cleanupTracker)) {
    // const services = getServices(message.content);
    console.warn('cleanup: not implemented');
  }

  if (guild.features.waitForValidEmbed) {
    console.warn('waitForValidEmbed: not implemented');
  }

  return;
}