import { MessageFlags, type GatewayMessageUpdateDispatchData } from "discord-api-types/v10";
import { getOrCreate } from "../db/guild/getOrCreate";
import { Guild } from "../db/schema";
import { store } from "./messageCreate";
import { isMessageWithUpdatedEmbed } from "../features/future/memory";
import { rest } from "../rest";
import { services } from "../service";
import { send } from "../send";
import { hasPermissionInChannel } from "../cache/accessors";
import { CustomPermissionsRepr } from "../cache/permissions";

export const onMessageUpdate = async (message: GatewayMessageUpdateDispatchData) => {
  if (!message.guild_id) return;

  const guild = await getOrCreate(message.guild_id);

  // if (guild.features.cleanupParentMessage && (message.guild_id in cleanupTracker)) {
  //   // const services = getServices(message.content);
  //   console.warn('cleanup: not implemented');
  // }

  if (guild.features.waitForValidEmbed) {
    await handleWaitForValidEmbed(guild, message);
  }

  return;
}

const handleWaitForValidEmbed = async (guild: Guild, message: GatewayMessageUpdateDispatchData) => {
  // if it's an embed update, we only have a few fields...
  if (!isMessageWithUpdatedEmbed(message) || !message.guild_id) return;
  
  const updates = await store.get(message.channel_id);
  if (!updates) return;

  const allLinks = updates.tiktok;
  const allResolved = Object
    .keys(allLinks)
    .every((link) => message.embeds!.findIndex((embed) => embed.url && embed.url.startsWith(link)) !== -1);

  if (!allResolved) return;

  if (guild.features.waitForValidEmbed) {
    const liveRewrittenLinks = [];

    for(const [originalLink, rewrittenLink] of Object.entries(allLinks)) {
      const embed = message.embeds?.find((embed) => embed.url && embed.url.startsWith(originalLink));
      if (!embed) continue;
      if (!services.tiktok.features.waitForEmbed?.isOriginalLinkHealthy(embed)) continue;
      liveRewrittenLinks.push(rewrittenLink);
    }

    await send(liveRewrittenLinks, {
      guildId: message.guild_id,
      channelId: message.channel_id,
      features: guild.features
    });
  }

  if (guild.features.cleanupParentMessage) {
    if (!hasPermissionInChannel(message.guild_id, message.channel_id, CustomPermissionsRepr.ManageMessages)) {
      return;
    }

    await rest.patch(`/channels/${message.channel_id}/messages/${updates.parentId}`, {
      body: {
        flags: MessageFlags.SuppressEmbeds
      }
    });
  }
}