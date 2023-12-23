import { guildChannels, guildRoles, guilds } from "./guilds";
import { CustomPermissionsRepr } from "./permissions";
import { currentUserId } from "./self";

export const getGuild = (id: string) => {
  return guilds.get(id) ?? null;
}

export const getGuildRoles = (id: string) => {
  const guild = getGuild(id);
  if (!guild) return null;

  return guildRoles.get(guild) ?? null;
}

export const getGuildChannels = (id: string) => {
  const guild = getGuild(id);
  if (!guild) return null;

  return guildChannels.get(guild) ?? null;
}

export const hasPermissionInChannel = (
  guildId: string, 
  channelId: string, 
  permission: CustomPermissionsRepr
) => {
  if (hasPermissionInGuild(guildId, CustomPermissionsRepr.Administrator)) {
    return true;
  }

  let permissions = getCurrentMemberPermissions(guildId);
  if (permissions === null) return false;

  const guild = getGuild(guildId);
  if (!guild) return false;

  const channels = getGuildChannels(guildId);
  if (!channels) return false;

  const channel = channels.get(channelId);
  if (!channel) return false;

  let overwrite = channel.get(guildId);
  if (overwrite) {
    permissions = (permissions & ~overwrite.deny) | overwrite.allow
  }

  let allow = 0;
  let deny = 0;

  for(const id of guild.selfRoles) {
    let overwrite = channel.get(id);

    if (overwrite) {
      deny |= overwrite.deny;
      allow |= overwrite.allow;
    }
  }

  permissions = (permissions & ~deny) | allow;
  overwrite = channel.get(currentUserId);

  if (overwrite) {
    permissions = (permissions & ~overwrite.deny) | overwrite.allow;
  }
  
  return ((permissions & permission) === permission);
}

export const getCurrentMemberPermissions = (
  guildId: string,
): number | null => {
  const guild = getGuild(guildId);
  if (!guild) return null;

  const roles = getGuildRoles(guildId);
  if (!roles) return null;

  let out = roles.get(guildId) ?? 0;

  for(const roleId of guild.selfRoles) {
    out |= (roles.get(roleId) ?? 0)
  }

  if ((out & CustomPermissionsRepr.Administrator) === CustomPermissionsRepr.Administrator) {
    out = CustomPermissionsRepr.Administrator | CustomPermissionsRepr.CreateMessages | CustomPermissionsRepr.ManageMessages | CustomPermissionsRepr.ViewChannel;
  }

  return out;
}

export const hasPermissionInGuild = (guildId: string, permission: CustomPermissionsRepr) => {
  const perms = getCurrentMemberPermissions(guildId);
  if (!perms) return false;

  return ((perms & permission) === permission);
}