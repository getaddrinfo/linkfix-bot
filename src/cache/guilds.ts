import { APIGuildChannel, GatewayGuildCreateDispatchData, GatewayGuildDeleteDispatchData, GatewayGuildUpdateDispatchData } from "discord-api-types/v10";
import { toGuildRoleInternalBits } from "./permissions";
import { Channels, createChannel } from "./channel";
import { Roles } from "./roles";


// the roles of the guild. that's it...
export type GuildCacheData = {
  unavailable: boolean;
  selfRoles: string[];
};

export const guilds: Map<string, GuildCacheData> = new Map();
export const guildChannels = new WeakMap<GuildCacheData, Channels>();
export const guildRoles = new WeakMap<GuildCacheData, Roles>();

export const onGuildCreate = (data: GatewayGuildCreateDispatchData) => {
  const cacheEntry: GuildCacheData = {
    unavailable: data.unavailable ?? false,
    selfRoles: []
  }

  const me = data.members[0];
  if (me) {
    cacheEntry.selfRoles = me.roles; 
  } else {
    console.warn('missing user info for self', data.id);
  }

  guilds.set(data.id, cacheEntry);
  if (data.unavailable) {    
    return;
  }

  const channels = new Map();
  const roles = new Map();

  for(const channel of data.channels) {
    channels.set(channel.id, createChannel(channel as APIGuildChannel<any>));
  }

  for(const role of data.roles) {
    roles.set(role.id, toGuildRoleInternalBits(role.permissions));
  }

  guildRoles.set(cacheEntry, roles);
  guildChannels.set(cacheEntry, channels);
}

export const onGuildUpdate = (data: GatewayGuildUpdateDispatchData) => {
  if (!guilds.has(data.id)) {
    // return onGuildCreate()
    return;
  }


}

export const onGuildDelete = (data: GatewayGuildDeleteDispatchData) => {
  guilds.delete(data.id);
}
