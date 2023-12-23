import { GatewayGuildRoleCreateDispatchData, GatewayGuildRoleDeleteDispatchData, GatewayGuildRoleUpdateDispatchData } from "discord-api-types/v10";
import { guildRoles, guilds } from "./guilds";
import { toGuildRoleInternalBits } from "./permissions";

export type Roles = Map<string, number>;

export const onRoleCreate = ({ role, guild_id }: GatewayGuildRoleCreateDispatchData) => {
  const guild = guilds.get(guild_id);

  if (!guild) {
    return;
  }

  const roles = guildRoles.get(guild);

  if (!roles) {
    guildRoles.set(guild, new Map([
      [role.id, toGuildRoleInternalBits(role.permissions)]
    ]))

    return;
  }

  roles.set(role.id, toGuildRoleInternalBits(role.permissions));
  return;
}

export const onRoleUpdate = (data: GatewayGuildRoleUpdateDispatchData) => onRoleCreate(data);
export const onRoleDelete = (data: GatewayGuildRoleDeleteDispatchData) => {
  const guild = guilds.get(data.guild_id);
  if (!guild) return;

  const roles = guildRoles.get(guild);
  if (!roles) return;

  roles.delete(data.role_id);
}