import { GatewayGuildMemberAddDispatchData, GatewayGuildMemberRemoveDispatchData, GatewayGuildMemberUpdateDispatchData } from "discord-api-types/v10";
import { guilds } from "./guilds";

const CURRENT_USER_ID = '1';

export const onMemberAdd = (member: GatewayGuildMemberAddDispatchData) => {
  if (member.user?.id !== CURRENT_USER_ID) return;

  const guild = guilds.get(member.guild_id);

  if (!guild) return;
  guild.selfRoles = member.roles;
}

export const onMemberUpdate = (member: GatewayGuildMemberUpdateDispatchData) => {
  if (member.user?.id !== CURRENT_USER_ID) return;

  const guild = guilds.get(member.guild_id);

  if (!guild) return;
  guild.selfRoles = member.roles; 
}

export const onMemberRemove = (member: GatewayGuildMemberRemoveDispatchData) => {
  if (member.user.id !== CURRENT_USER_ID) return;

  // other resources get cleaned up thanks to the `WeakMap`.
  const guild = guilds.has(member.guild_id);

  if (guild) {
    guilds.delete(member.guild_id)
  }
}