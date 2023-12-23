import { hasPermissionInChannel } from "./cache/accessors";
import { CustomPermissionsRepr } from "./cache/permissions";
import { Guild } from "./db/schema";
import { rest } from "./rest";

interface Context {
  guildId: string;
  channelId: string;
  features: Guild['features'];
}

export const send = async (
  links: string[],
  { guildId, channelId, features }: Context, 
) => {
  if (!hasPermissionInChannel(guildId, channelId, CustomPermissionsRepr.CreateMessages)) {
    return;
  }

  let content = links.join('\n');
  
  if (!features.onlySendLinks) {
    content = `Fixed ${links.length} link${links.length === 0 ? '' : 's'}:\n${content}`;
  }

  await rest.post(`/channels/${channelId}/messages`, {
    body: {
      content,
      allowed_mentions: { parse: [] }
    }
  })
}