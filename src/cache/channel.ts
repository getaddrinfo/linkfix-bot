import { APIGuildChannel, GatewayChannelCreateDispatchData, GatewayChannelDeleteDispatchData, GatewayChannelModifyDispatchData } from "discord-api-types/v10";
import { toOverwrite } from "./permissions";
import { guildChannels, guilds } from "./guilds";

// channels are actually just their permission overwrites
export type OverwriteData = { allow: number, deny: number };
export type Channels = Map<string, Map<string, OverwriteData>>;

export const createChannel = (data: APIGuildChannel<any>): Map<string, OverwriteData> => {
  if (!data.permission_overwrites) data.permission_overwrites = [];

  return data.permission_overwrites?.reduce((acc, overwrite) => {
    acc.set(overwrite.id, toOverwrite(overwrite.allow, overwrite.deny));
    return acc;
  }, new Map<string, OverwriteData>());
}

export const onChannelCreate = (data: GatewayChannelCreateDispatchData) => {
  const channel = (data as APIGuildChannel<any>);
  const guild = guilds.get(channel.guild_id!);

  if (!guild) {
    return;
  }

  const channels = guildChannels.get(guild);

  if (!channels) {
    const channels = new Map([
      [channel.id, createChannel(channel)]
    ]);

    guildChannels.set(guild, channels);

    return;
  }

  channels.set(channel.id, createChannel(channel));
  return;
}

export const onChannelUpdate = (data: GatewayChannelModifyDispatchData) => onChannelCreate(data);

export const onChannelDelete = (data: GatewayChannelDeleteDispatchData) => {
  const channel = (data as APIGuildChannel<any>);

  const guild = guilds.get(channel.guild_id!);
  if (!guild) {
    return;
  }

  const channels = guildChannels.get(guild);
  if (!channels) {
    return;
  }

  channels.delete(channel.id);
  return;
}