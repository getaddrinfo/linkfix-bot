import { MessageFlags, type GatewayMessageUpdateDispatchData } from "discord-api-types/v10";
import { getOrCreate } from "../db/guild/getOrCreate";
import { Guild } from "../db/schema";
import { isMessageWithUpdatedEmbed } from "../features/future/memory";
import { rest } from "../rest";
import { services } from "../service";
import { edit, send } from "../send";
import { hasPermissionInChannel } from "../cache/accessors";
import { CustomPermissionsRepr } from "../cache/permissions";
import { cleanup, future, willEdit } from "../stores";

export const onMessageUpdate = async (message: GatewayMessageUpdateDispatchData) => {
  if (!isMessageWithUpdatedEmbed(message) || !message.guild_id) return;
  
  const guild = await getOrCreate(message.guild_id);

  if (guild.features.waitForValidEmbed) {
    await waitForValidEmbed(message, guild);
  }

  if (guild.features.cleanupParentMessage) {
    await cleanupParentMessage(message);
  }
}

const waitForValidEmbed = async (message: GatewayMessageUpdateDispatchData, guild: Guild) => {
  if (!message.guild_id) return;

  const updates = await future.get(message.channel_id);
  if (!updates) return;

  const allLinks = updates.tiktok;
  const allResolved = Object
    .keys(allLinks)
    .every((link) => message.embeds!.findIndex((embed) => embed.url && embed.url.startsWith(link)) !== -1);

  if (!allResolved) return;

  const liveRewrittenLinks = [];

  for(const [originalLink, rewrittenLink] of Object.entries(allLinks)) {
    const embed = message.embeds?.find((embed) => embed.url && embed.url.startsWith(originalLink));
    if (!embed) continue;
    if (!services.tiktok.features.waitForEmbed?.isOriginalLinkHealthy(embed)) continue;
    liveRewrittenLinks.push(rewrittenLink);
  }

  const willHaveMessageToEditInFuture = await willEdit.isMarked(message.id);
  if (willHaveMessageToEditInFuture) {
    return await edit(
      message.id,
      liveRewrittenLinks,
      { guildId: message.guild_id, channelId: message.channel_id }
    )    
  }

  await send(liveRewrittenLinks, {
    guildId: message.guild_id,
    channelId: message.channel_id,
    parentId: message.id,
    features: guild.features
  });
}

const cleanupParentMessage = async (message: GatewayMessageUpdateDispatchData) => {
  if (!message.guild_id) return;

  const parentId = await cleanup.get(message.id);
  if (!parentId) return;

  if (!hasPermissionInChannel(message.guild_id, message.channel_id, CustomPermissionsRepr.ManageMessages)) {
    return;
  }

  await rest.patch(`/channels/${message.channel_id}/messages/${parentId}`, {
    body: {
      flags: MessageFlags.SuppressEmbeds
    }
  });
}