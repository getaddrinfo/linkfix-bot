import { PermissionFlagsBits } from "discord-api-types/v10";

export const enum CustomPermissionsRepr {
  Administrator = 1 << 0,
  ViewChannel = 1 << 1,
  CreateMessages = 1 << 2,
  ManageMessages = 1 << 3,
}

export const toOverwrite = (allow: string, deny: string) => ({
  allow: toChannelInternalBits(allow),
  deny: toChannelInternalBits(deny)
})

export const toChannelInternalBits = (value: string) => {
  const parsed = BigInt(value);
  let out = 0;

  if ((parsed & PermissionFlagsBits.ViewChannel) === PermissionFlagsBits.ViewChannel) {
    out |= CustomPermissionsRepr.ViewChannel;
  }

  if ((parsed & PermissionFlagsBits.SendMessages) === PermissionFlagsBits.SendMessages) {
    out |= CustomPermissionsRepr.CreateMessages;
  }

  if ((parsed & PermissionFlagsBits.ManageMessages) === PermissionFlagsBits.ManageMessages) {
    out |= CustomPermissionsRepr.ManageMessages;
  }

  return out;
}

export const toGuildRoleInternalBits = (value: string) => {
  const parsed = BigInt(value);
  let out = 0;

  if (has(parsed, PermissionFlagsBits.Administrator)) {
    out |= CustomPermissionsRepr.Administrator;
  }

  if (has(parsed, PermissionFlagsBits.ViewChannel)) {
    out |= CustomPermissionsRepr.ViewChannel;
  }

  if (has(parsed, PermissionFlagsBits.SendMessages)) {
    out |= CustomPermissionsRepr.CreateMessages;
  }

  if (has(parsed, PermissionFlagsBits.ManageMessages)) {
    out |= CustomPermissionsRepr.ManageMessages;
  }

  return out;
}

const has = (parsed: bigint, permission: bigint) => ((parsed & permission) === permission);