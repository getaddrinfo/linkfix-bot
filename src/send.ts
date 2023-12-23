import { hasPermissionInChannel } from "./cache/accessors";
import { CustomPermissionsRepr } from "./cache/permissions";
import { Guild } from "./db/schema";
import { rest } from "./rest";
import { cleanup, willEdit } from "./stores";

interface Context {
  guildId: string;
  channelId: string;
  parentId: string;
  features: Guild['features'];
}

interface Extra {
  willBeEdited: boolean;
}

export const edit = async (
  forMessageId: string,
  links: string[],
  { guildId, channelId }: Pick<Context, 'guildId' | 'channelId'>
) => {
  if (!hasPermissionInChannel(guildId, channelId, CustomPermissionsRepr.CreateMessages)) {
    return;
  }

  let originalMessage = await willEdit.get(forMessageId);
  if (!originalMessage) {
    for (let i = 0; i < 100; i++) {
      if (originalMessage) break;

      await new Promise((resolve) => setTimeout(resolve, 100));
      originalMessage = await willEdit.get(forMessageId);
    }
  }

  if (!originalMessage) {
    console.warn('failed to spin to get message', {
      forMessageId,
      guildId,
      channelId
    });
    return;
  };

  let message = `${originalMessage.content}\n${links.join('\n')}`;

  await rest.patch(`/channels/${channelId}/messages/${originalMessage.replyId}`, {
    body: {
      content: message
    }
  });
}

export const send = async (
  links: string[],
  { guildId, channelId, parentId, features }: Context, 
  { willBeEdited }: Extra = { willBeEdited: false }
) => {
  if (!hasPermissionInChannel(guildId, channelId, CustomPermissionsRepr.CreateMessages)) {
    return;
  }

  if (willBeEdited) {
    await willEdit.mark(parentId);
  }

  let content = links.join('\n');
  
  if (!features.onlySendLinks) {
    content = `Fixed ${links.length} link${links.length === 0 ? '' : 's'}:\n${content}`;
  }

  const result = await rest.post(`/channels/${channelId}/messages`, {
    body: {
      content,
      allowed_mentions: { parse: [] }
    }
  });

  const id = (result as any).id;


  if (willBeEdited) {
    await willEdit.set(parentId, {
      content,
      replyId: id
    });
  }

  if (features.cleanupParentMessage) {
    await cleanup.set(id, parentId);
  }
}